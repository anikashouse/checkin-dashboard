# From Personal Tool → Sellable SaaS: Roadmap

**What you have today:** a working Next.js 15 dashboard (`checkin-dashboard`) backed by
Supabase, plus a legacy Playwright robot (`airbnb_chekin`) that logs into the Mossos
d'Esquadra web portal and uploads the guest `.txt`. It works well **for you** — one owner
("Anika's House"), one Mossos login, one Telegram, one Stripe account.

**The gap to a product:** the app *looks* multi-tenant (Google login, `users` table) but is
wired as single-tenant underneath. Going commercial is not a polish pass — it's re-architecting
tenancy, data isolation, the police-submission pipeline, and the legal/compliance layer, because
you'll be handling other people's guests' ID documents and card payments.

This document is the ordered plan to close that gap. Each phase ends with a checkable outcome.

---

## Strategic decisions to make first (they reshape everything below)

| Decision | Options | Recommendation |
|---|---|---|
| **Market scope** | Catalonia/Mossos only → all Spain (national **SES.Hospedajes**, RD 933/2021) → EU | **Start Catalonia-only.** You already know the flow, the compliance surface is smallest, and you can reach a paying pilot fastest. Design the submission layer behind an interface so a national SES.Hospedajes adapter can slot in later. |
| **Submission tech** | Keep Playwright screen-scraper → migrate to official SES.Hospedajes web service (SOAP/REST + certificate) | **Keep the robot to reach a pilot, but make it per-tenant, then migrate to the official API before you scale.** The scraper breaks whenever the portal HTML changes and can't be sold as reliable. See Phase 4. |
| **Monetization** | Per-room subscription · % fee on tourist tax · per-check-in · tiered | **Per-room monthly subscription** as the base (predictable), optionally **+ small fee on tourist-tax payments** once you add Stripe Connect. Simple to communicate to hosts. |
| **Resourcing** | Solo bootstrap → full-time → license to a PMS/agency | Assumed **solo bootstrap** below. If you go full-time, front-load Phases 4 and 6. |

> These four choices are yours to lock in. The phases below assume the recommended path
> (Catalonia-first, robot-then-API, per-room subscription, solo bootstrap). Adjust scope if you pick differently.

---

## Phase 0 — Stop the bleeding (security blockers) — **do before anyone else touches it**

These are live risks *today*. None are optional before a second customer exists.

- [ ] **Fix tenant isolation (critical).** Every server DB call uses the Supabase **service-role
  key** (`src/lib/supabase.ts`, `src/lib/db.ts`), which bypasses Row-Level Security, and
  functions like `getProperties()` / `getAllReservations()` (`src/lib/db.ts`) don't filter by
  owner. **Any logged-in user can read every other host's guest PII.** Add a mandatory `user_id`
  filter to every query, and audit each `api/*` route to confirm it scopes by `session.user.id`.
- [ ] **Lock down or delete debug endpoints.** `api/debug/*` is not covered by `src/middleware.ts`;
  `debug/table-schema` returns a real `checkin_records` row *with guest PII*, `debug/list-properties`
  leaks iCal URLs. Delete them or gate behind an admin check + env flag.
- [ ] **Secure the payment endpoint.** `api/stripe/create-payment-intent` takes `amount`/`currency`
  from the client body with `Access-Control-Allow-Origin: *` and no auth — anyone can mint a
  PaymentIntent for any amount. Compute the amount server-side from the reservation, restrict CORS.
- [ ] **Remove the public-page secret leak.** `airbnb_chekin/.github/workflows/deploy.yml` `sed`-injects
  the live **Gemini API key** and **Airbnb iCal URLs** into `index.html` served on GitHub Pages —
  readable via "view source." Rotate that Gemini key now; move OCR server-side (see Phase 3).
- [ ] Extend `src/middleware.ts` matcher to cover all non-public API routes; make `MOSSOS_CALLBACK_SECRET`
  on `api/mossos/complete` required, not optional.

**Outcome:** no cross-tenant data access, no unauthenticated PII/payment endpoints, no secrets in public HTML.

---

## Phase 1 — True multi-tenancy (de-hardcode "Anika's House")

Right now the police pipeline, notifications, and payouts all point at your personal accounts.

- [ ] **Per-tenant Mossos identity.** Remove the hardcoded `'ID50044239'` default and `"ANIKA'S HOUSE"`
  establishment name (`api/mossos/save-guests/route.ts`, `dashboard/[id]/[reservationId]/page.tsx`).
  Every property already has a `mossos_id` field — make it required, no fallback.
- [ ] **Per-tenant Mossos credentials.** Today the robot uses one shared `MOSSOS_USER`/`MOSSOS_PASS`
  (GitHub secret). Each host must supply *their own* Mossos portal login, stored encrypted per tenant
  (see Phase 3), and injected into an isolated submission run — never a shared login.
- [ ] **Per-tenant notifications.** `api/mossos/complete` sends Telegram to one global
  `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` (your group). Switch to the per-user `user_services.telegram_*`
  fields that already exist, or drop Telegram in favor of email.
- [ ] **Config, not code.** Replace hardcoded `https://checkin-dashboard-eight.vercel.app` fallbacks
  (`PayLinkButton.tsx`, `pay/[reservationId]/page.tsx`, `api/mossos/send`, drive OAuth routes) and the
  hardcoded owner email in `privacy/page.tsx` with env/config values.
- [ ] **Reconcile the robot repo target.** `api/mossos/send` dispatches to `anikashouse/airbnb_chekin`
  while your local repo is `MikelLG/airbnb_chekin` — pick one and document it.

**Outcome:** a brand-new host can sign up, add their property + their own Mossos ID/login, and submit —
with nothing of yours in the path.

---

## Phase 2 — Onboarding & self-service (so you're not the bottleneck)

- [ ] **Guided setup wizard.** Extend `app/setup` into a multi-step flow: property details → Airbnb
  iCal URL (with a "test connection" that validates the feed) → Mossos ID + credentials → tourist-tax
  settings → Google Drive (optional). You already have most fields in `settings/properties`.
- [ ] **Connection health checks.** Surface iCal sync status, last successful Mossos submission, and
  Stripe connection on the dashboard so hosts self-diagnose.
- [ ] **Billing.** Add subscription billing (Stripe Billing) — per-room monthly plan, free trial,
  a `subscription` table keyed to `user_id`, and a paywall gate in `src/middleware.ts` for expired accounts.
- [ ] **Basic support surface.** A help page, a contact/support email that isn't your personal Gmail,
  and a changelog.

**Outcome:** a host can go from signup to first successful police submission without you touching anything.

---

## Phase 3 — Data protection & GDPR (mandatory: you're handling ID documents)

You store names, DNI/NIE/passport numbers, addresses, DOB — borderline special-category data — for
*other people's* guests. This is the legal core of being sellable in the EU.

- [ ] **Encrypt sensitive fields at rest** (application-level, above Supabase's disk encryption):
  `checkin_records.guest_data`, `txt_content`, `pdf_base64`, and stored Mossos credentials. Use a KMS
  or envelope encryption; never store host Mossos passwords in plaintext.
- [ ] **Retention & erasure.** Implement a retention job (Spanish hospedaje law ≈3 years) plus a
  **per-guest / per-host deletion endpoint** (GDPR Art. 17). The privacy page currently promises deletion
  "by contacting us" with no mechanism — build the mechanism.
- [ ] **Move ID-photo OCR server-side.** Today the guest's DNI image goes from a public page to Google
  Gemini using a public key. Proxy OCR through your backend with a server-side key; don't persist raw images.
- [ ] **Legal docs.** Real Privacy Policy + Terms of Service + a **Data Processing Agreement** (you're a
  data processor for each host, who is the controller). Consider consulting a Spanish data-protection lawyer —
  this is the one place worth paying for.
- [ ] **Consent capture & audit log.** Record guest consent at check-in; log who accessed which guest
  record and when.

**Outcome:** defensible GDPR posture — encryption, retention, erasure, DPA, audit trail.

---

## Phase 4 — Reliable police submission (retire the fragile scraper)

The Playwright robot screen-scrapes a legacy Java portal via a cross-repo GitHub PAT, with no retry
or queue. Fine for you; not sellable as "reliable."

- [ ] **Wrap submission behind an interface** (`SubmissionAdapter`) so the delivery mechanism is swappable.
  `src/lib/mossos.ts` (the `.txt` generator, spec V24) stays as the format layer.
- [ ] **Short term — harden the robot:** per-tenant credentials, a proper job queue with retries and
  status, structured logging, and alerting when the portal HTML changes.
- [ ] **Medium term — migrate to the official web service.** Spain's national **SES.Hospedajes** (RD 933/2021)
  exposes a documented web service (certificate-authenticated) that replaces screen-scraping and is the
  strategic path if you expand beyond Catalonia. Build it as a second `SubmissionAdapter`.
- [ ] **Idempotency & receipts.** Guarantee no double-submission, and store every comprobante PDF as proof.

**Outcome:** submissions succeed reliably, retry on failure, and don't break when a portal changes its HTML.

---

## Phase 5 — Payments done properly (if you monetize tourist tax)

- [ ] **Stripe Connect.** Today all tourist-tax money lands in one Stripe account (yours). To collect on
  behalf of hosts you need Connect (Express accounts) so payouts go to each host, with your platform fee split.
- [ ] **Server-authoritative amounts.** Tax amount computed from reservation nights × rate, never trusted
  from the client (ties into Phase 0's payment fix).
- [ ] **Reconciliation & invoicing.** Per-host statements of tax collected and fees charged.

**Outcome:** hosts receive their tourist-tax collections directly; you take a clean, auditable fee.

---

## Phase 6 — Engineering hygiene (make it maintainable & trustworthy)

- [ ] **Re-enable checks.** `next.config.ts` sets `eslint.ignoreDuringBuilds: true` — turn it back on;
  add typecheck to CI. You're handling regulated PII with checks disabled at build.
- [ ] **Tests.** There are none. Start with the highest-risk logic: `src/lib/mossos.ts` (`validateGuests`,
  `generateMossosTxt`), tenant-isolation queries, and payment amount calculation.
- [ ] **CI pipeline.** GitHub Actions: lint + typecheck + test on every PR; block merge on failure.
- [ ] **Observability.** Add error tracking (Sentry), structured logs with PII redaction (logs currently
  print guest data), uptime monitoring, and a health endpoint.
- [ ] **Secrets & backups.** Move to a proper secret manager, enable Supabase point-in-time recovery,
  document a restore procedure.
- [ ] **Real README/runbook** to replace the create-next-app boilerplate.

**Outcome:** changes are safe to ship, failures are visible, and a new dev could operate the system.

---

## Phase 7 — Go to market (Catalonia pilot → grow)

- [ ] **Pick 3–5 pilot hosts** you can support hands-on. Onboard them, watch every submission, fix friction.
- [ ] **Pricing page & landing site** with the value prop: "Automated Mossos guest registration + tourist-tax
  collection for Airbnb hosts in Catalonia."
- [ ] **Positioning:** lead with the pain you remove (manual police uploads, tax admin), show the compliance
  guarantee, and the receipts/audit trail.
- [ ] **Feedback loop → iterate**, then expand: more of Catalonia, then national via the SES.Hospedajes adapter.
- [ ] **Company & liability:** register a company, get liability terms in the ToS, and consider insurance
  given you touch regulated data and payments.

**Outcome:** paying customers, a repeatable onboarding, and a clear path to expand market scope.

---

## Suggested order & rough effort (solo, part-time)

1. **Phase 0** — security blockers — *days, non-negotiable first.*
2. **Phase 1** — de-hardcode multi-tenancy — *1–2 weeks.*
3. **Phase 3 (start)** — encryption, retention, legal docs — *in parallel with Phase 2; start the legal review early, it has lead time.*
4. **Phase 2** — onboarding + billing — *2–3 weeks.*
5. **Phase 7 pilot** — onboard 3–5 hosts on the hardened robot.
6. **Phase 4 / 5 / 6** — API migration, Stripe Connect, tests/CI — *harden as revenue justifies.*

> **The one-line summary:** it works for you because it's *yours* — one Mossos login, one Stripe
> account, one Telegram. Selling it means (a) making sure host B can never see host A's guests
> [Phase 0/1], (b) handling ID documents legally [Phase 3], and (c) submitting to the police in a
> way that doesn't break [Phase 4]. Everything else is packaging.
