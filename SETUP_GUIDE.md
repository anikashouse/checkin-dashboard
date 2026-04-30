# CheckIn Dashboard — Product Roadmap & Progress

## What this is
A platform for Airbnb hosts to manage guest check-ins. Users sign up, connect their properties via iCal,
and can send guest data to Mossos d'Esquadra (Spanish police) via API. Each reservation tracks 3 status
indicators: form filled, .txt generated, sent to Mossos.

---

## CURRENT STATUS SNAPSHOT

```
[✓] Auth & onboarding foundation
[✓] Multi-tenancy (each user sees only their data)
[✓] Dashboard layout (sidebar + calendar + property cards)
[✓] Calendar with reservations per property (check-in/check-out indicators)
[✓] Calendar colors pinned per property (consistent across all views)
[✓] Property detail pages (clickable from sidebar)
[✓] Properties settings page (add, edit, test iCal, sync)
[✓] Reservations sorted earliest→latest (in both property detail and resumen)
[✓] Onboarding flow for new users (/setup, 2 steps: property + services, with skip)
[✓] Deployed to Vercel: checkin-dashboard-eight.vercel.app

[✓] Per-property color pinned consistently in calendar
[✓] Reservation detail page (clickable reservations)
[✓] 3 Mossos status badges (scaffold) in reservation list rows + calendar blocks
[✓] List of ALL reservations across properties on Resumen page (split by property, colored cards)
[✓] Calendar weekly view (toggle Mes/Semana, week starts Monday, < Hoy > navigation)
[✓] Visual overhaul v2: Geist font, calendar white card cells + amber today, tooltip status dots
[✓] Edit property button from property detail page (modal con nombre, dirección, iCal, Mossos ID)
[✓] Delete property (con confirmación, cascada reservas, desde detail y settings)
[✓] Logout button in sidebar
[ ] Mossos integration (real data: checkin_records table + .txt + PDF comprobante)
[ ] Services management page in dashboard (/dashboard/settings/services)
[ ] Per-property color picker
[ ] Bulk sync all properties
```

---

## PART 1 — Auth & Onboarding

### 1.1 Authentication ✓
- [x] Google OAuth via NextAuth
- [x] Users saved to Supabase on first login
- [x] Middleware protects all `/dashboard/*` routes
- [x] Session carries `user_id`
- [x] Sign-in page at `/auth/signin`

### 1.2 Onboarding flow for new users ✓
- [x] Detect first-time login — dashboard redirects to `/setup` if no properties exist
- [x] Onboarding screen at `/setup`:
  - [x] Step 1: Add property (name, address, city, iCal URL, Mossos ID) — or skip
  - [x] Step 2: Connect services (email, Telegram, Google Drive) — or skip
- [x] After onboarding → redirect to `/dashboard`
- [ ] Allow returning to onboarding / re-configuring services from settings (no link exists yet)

---

## PART 2 — Dashboard & Navigation

### 2.1 Layout & Sidebar ✓
- [x] Dark sidebar (`slate-900`) + light content area
- [x] Sidebar shows all user's properties as nav links
- [x] "Resumen" link → main dashboard
- [x] "Propiedades" link → settings/properties
- [x] User avatar + email at bottom of sidebar
- [x] Shared layout via `dashboard/layout.tsx` (no duplication)
- [x] Logout button in sidebar (bottom-left, per FUNCTIONALLITY.md)

### 2.2 Resumen page (`/dashboard`) ✓
- [x] Calendar showing all reservations across all properties
- [x] Each reservation block shows code + check-in (green dot) / check-out (orange dot)
- [x] Today highlighted with orange ring
- [x] Property cards (icon, name, address, reservation count, days until next)
- [x] Reservation summary (total, proximas, activas, completadas)
- [x] Per-property color pinned in calendar
- [ ] List of ALL reservations across properties, sorted earliest→latest

### 2.3 Property detail page (`/dashboard/[id]`) ✓
- [x] Property-specific calendar
- [x] List of reservations for that property
- [x] Reservations sorted earliest → latest (via `db.ts` `order('check_in', ascending: true)`)
- [x] Each reservation clickable → reservation detail page
- [x] Edit property button (modal: nombre, dirección, iCal URL, Mossos ID)
- [x] Delete property (confirmación inline + cascada reservas)
- [x] Mossos 3-status badges visible in reservation list rows (scaffold, all pending)

### 2.4 Reservation detail page (`/dashboard/[id]/[reservationId]`)
- [x] Show all reservation fields (code, guest name, check-in, check-out, nights, guests, phone)
- [ ] Edit reservation fields
- [x] **3 Mossos status indicators (scaffold, all grey/pending):**
  - [ ] Form status: green if checkin form filled correctly, red if missing/wrong (needs checkin_records)
  - [ ] .txt file: green if generated, with download button (stored in Supabase Storage)
  - [ ] Mossos sent: green if sent, red if not — with PDF comprobante download
- [x] Button scaffold: "Enviar enlace al huésped" (disabled)
- [x] Button scaffold: "Generar .txt" (disabled)
- [x] Button scaffold: "Enviar a Mossos" (disabled)

---

## PART 3 — Properties Management

### 3.1 Properties settings page (`/dashboard/settings/properties`) ✓
- [x] List all properties with iCal URL, Mossos ID
- [x] Edit each property (name, iCal URL, Mossos ID)
- [x] Add new property
- [x] Test iCal button
- [x] Sync Now button (fetches iCal and saves reservations)
- [ ] Bulk "Sync All" button
- [ ] Delete property
- [ ] Per-property color picker (for calendar color coding)

### 3.2 iCal sync engine ✓
- [x] Fetches iCal from Airbnb URL
- [x] Parses VEVENT blocks
- [x] Filters out blocked/unavailable events
- [x] Extracts: code, guest name, check-in, check-out, nights, guests, phone suffix
- [x] Deduplicates by airbnb_code across properties
- [x] Upserts to Supabase `reservations` table

---

## PART 4 — Mossos Integration

### 4.1 Guest checkin form (airbnb_chekin repo)
- [x] Separate repo: sends guest data to this dashboard
- [ ] Form data stored in `checkin_records` table linked to reservation
- [ ] Validation: all required fields present and correctly formatted

### 4.2 .txt file generation
- [ ] Generate Mossos-format .txt from checkin_record data
- [ ] Store .txt in Supabase Storage (`mossos-txt` bucket)
- [ ] Update reservation status: `txt_generated = true`
- [ ] Download button in reservation detail page
- [ ] Upload button (in case generated externally)

### 4.3 Send to Mossos API
- [ ] POST to Mossos API with .txt file
- [ ] Receive PDF comprobante in response
- [ ] Store PDF in Supabase Storage (`mossos-pdf` bucket)
- [ ] Update reservation status: `mossos_sent = true`, `sent_at = timestamp`
- [ ] Download button for comprobante in reservation detail page
- [ ] Upload button (in case sent externally)

### 4.4 Status indicators in reservation list
- [ ] Form filled: green / red badge per reservation row
- [ ] .txt file: green / red badge per reservation row
- [ ] Mossos sent: green / red badge per reservation row
- [ ] Show these 3 badges in the reservation list inside property detail page

---

## PART 5 — Services Management

### 5.1 Onboarding services step (partial) ✓
- [x] Step 2 of `/setup` lets user enable and input credentials for email, Telegram, Google Drive
- [x] Form POSTs to `/api/user-services` on save (or skip)
- [ ] Test connection button per service (not implemented)
- [ ] Credentials actually validated / connections tested before saving

### 5.2 Services management page in dashboard
- [ ] Dedicated page at `/dashboard/settings/services`
- [ ] List connected services (Telegram, email, Drive, etc.)
- [ ] Connect / disconnect each service
- [ ] Edit credentials for each service

### 5.3 Telegram
- [ ] Input: bot token + chat ID (onboarding UI exists; backend validation pending)
- [ ] Test connection button
- [ ] Use: send checkin link to guest, notify host of new reservation

### 5.4 Email
- [ ] Input: email address (onboarding UI exists; SMTP/SendGrid backend pending)
- [ ] Test connection button
- [ ] Use: send checkin link to guest

### 5.5 Google Drive
- [ ] Input: folder ID (onboarding UI exists; OAuth/real connection pending)
- [ ] OAuth connection
- [ ] Use: backup .txt and PDF files to Drive automatically

---

## PART 6 — Database Schema

### Tables (current) ✓
```sql
users          (id, email, name, created_at)
properties     (id, user_id, name, address, ical_url, mossos_id, cover_color)
reservations   (id, property_id, airbnb_code, guest_name, check_in, check_out,
                nights, guests, tel_suffix, checked_in_at)
```

### Tables (needed)
```sql
checkin_records  (id, reservation_id, guest_data jsonb, form_complete bool,
                  txt_path text, pdf_path text, mossos_sent bool, sent_at timestamp)

user_services    (id, user_id, service_name, credentials jsonb, connected_at)
```

### RLS Policies ✓
- Properties: user sees only their own
- Reservations: user sees only from their properties
- checkin_records: user sees only from their reservations (pending — table not yet created)

---

## PART 7 — Deployment

### 7.1 Vercel ✓
- [x] Connected to GitHub `anikashouse/checkin-dashboard`
- [x] Auto-deploy on push to `main`
- [x] Live at: `checkin-dashboard-eight.vercel.app`

### 7.2 Environment variables needed
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXTAUTH_SECRET
NEXTAUTH_URL
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

### 7.3 Pending
- [ ] Custom domain + SSL
- [ ] Supabase Storage buckets (`mossos-txt`, `mossos-pdf`)
- [ ] Supabase backups configured
- [ ] Error tracking (Sentry)

---

## NEXT PRIORITIES

**Next up (in order):**
1. ~~Logout button in sidebar~~ ✓
2. Reservations clickable → reservation detail page (scaffold)
3. Per-property color pinned in calendar (use `property.cover_color` or stable hash of property ID)
4. Reservation detail page with 3 Mossos status indicators
5. `checkin_records` table + link form data to reservations
6. .txt generation + Mossos API send
7. List of ALL reservations on Resumen page
8. Services management page + real service connections (Telegram first)
9. Edit property from property detail page
