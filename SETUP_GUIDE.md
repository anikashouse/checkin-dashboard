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
[✓] Reservations sorted earliest→latest
[✓] Onboarding flow for new users (/setup, 2 steps: property + services, with skip)
[✓] Deployed to Vercel: checkin-dashboard-eight.vercel.app

[✓] Reservation detail page (all fields + working action buttons)
[✓] 3 Mossos status dots in reservation list (real data from checkin_records)
[✓] Mossos integration: .txt upload → GitHub Actions robot → PDF comprobante
[✓] Services management page (/dashboard/settings/services)
[✓] Telegram config (token + chat ID)
[✓] Email config (address)
[✓] Google Drive OAuth connect + folder ID + test + bulk sync
[✓] GitHub Actions workflow (upload_mossos.yml) with Vercel bypass
[✓] Vercel Deployment Protection bypass (x-vercel-protection-bypass)

[ ] Per-property color picker
[ ] Bulk sync all properties (one button, all iCals)
[ ] Edit reservation fields from detail page
[ ] Custom domain + SSL
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

---

## PART 2 — Dashboard & Navigation

### 2.1 Layout & Sidebar ✓
- [x] Dark sidebar (`slate-900`) + light content area
- [x] Sidebar shows all user's properties as nav links
- [x] "Resumen" link → main dashboard
- [x] "Propiedades" link → settings/properties
- [x] "Servicios" link → settings/services
- [x] User avatar + email at bottom of sidebar
- [x] Logout button in sidebar

### 2.2 Resumen page (`/dashboard`) ✓
- [x] Calendar showing all reservations across all properties
- [x] Each reservation block shows code + check-in/check-out indicators
- [x] Today highlighted with orange ring
- [x] Property cards with pending count
- [x] Reservation summary list split by property
- [x] 3 status dots per reservation row (formComplete · txtGenerated · mossosSent) — live data

### 2.3 Property detail page (`/dashboard/[id]`) ✓
- [x] Property-specific calendar
- [x] List of reservations for that property, sorted earliest → latest
- [x] Each reservation clickable → reservation detail page
- [x] Edit property button (modal: nombre, dirección, iCal URL, Mossos ID)
- [x] Delete property (confirmación + cascada reservas)
- [x] 3 Mossos status dots per reservation row

### 2.4 Reservation detail page (`/dashboard/[id]/[reservationId]`) ✓
- [x] All reservation fields (code, guest name, check-in, check-out, nights, guests, phone)
- [x] 3 Mossos status indicators (real data from checkin_records)
- [x] "Enviar enlace al huésped" — sends checkin form link to guest
- [x] Upload .txt button — stores txt_content in checkin_records
- [x] "Enviar a Mossos" — triggers GitHub Actions robot, stores PDF comprobante
- [x] Download comprobante PDF button (when available)
- [ ] Edit reservation fields

---

## PART 3 — Properties Management

### 3.1 Properties settings page (`/dashboard/settings/properties`) ✓
- [x] List all properties with iCal URL, Mossos ID
- [x] Edit each property (name, iCal URL, Mossos ID)
- [x] Add new property
- [x] Test iCal button
- [x] Sync Now button per property
- [ ] Bulk "Sync All" button (all properties at once)
- [ ] Per-property color picker

### 3.2 iCal sync engine ✓
- [x] Fetches iCal from Airbnb URL
- [x] Parses VEVENT blocks, filters blocked/unavailable events
- [x] Extracts: code, guest name, check-in, check-out, nights, guests, phone suffix
- [x] Deduplicates by airbnb_code across properties
- [x] Upserts to Supabase `reservations` table

---

## PART 4 — Mossos Integration ✓

### 4.1 Guest checkin form (airbnb_chekin repo) ✓
- [x] Separate repo at `airbnb_chekin/`
- [x] Form data POSTed to `/api/mossos/send` → stored in `checkin_records`
- [x] Validation on required fields

### 4.2 .txt file
- [x] Upload .txt via dashboard reservation page → stored as `txt_content` in `checkin_records`
- [x] Auto-generate .txt from form data (airbnb_chekin repo)
- [x] `txt_filename` stored alongside content
- [x] Download button in reservation detail page

### 4.3 Send to Mossos API ✓
- [x] GitHub Actions workflow (`upload_mossos.yml`) polls for pending records and uploads
- [x] `upload_mossos.js` calls Mossos API with .txt, receives PDF comprobante
- [x] PDF stored as `pdf_base64` in `checkin_records`
- [x] Callback to `/api/mossos/complete` marks `mossos_sent = true`, stores PDF
- [x] Vercel Deployment Protection bypassed via `x-vercel-protection-bypass` header
- [x] `mossos_status` values: `uploading / uploaded / error`

### 4.4 Status indicators ✓
- [x] 3 status dots in reservation list rows (Resumen + property detail)
- [x] Real data: `formComplete`, `txtGenerated` (`txt_content` or `txt_path`), `mossosSent`
- [x] Download comprobante PDF in reservation detail

---

## PART 5 — Services Management ✓

### 5.1 Services page (`/dashboard/settings/services`) ✓
- [x] Telegram: bot token + chat ID, toggle enable/disable
- [x] Email: address, toggle enable/disable
- [x] Google Drive: folder ID + OAuth connect + test + bulk sync
- [x] Save button persists to `user_services` table

### 5.2 Telegram ✓
- [x] Bot token + chat ID input
- [ ] Test connection button
- [ ] Active use: send notifications on check-in

### 5.3 Email ✓
- [x] Email address input
- [ ] Test connection button
- [ ] Active use: send checkin link to guest

### 5.4 Google Drive ✓
- [x] Folder ID input with instructions
- [x] Separate OAuth connect flow (`/api/auth/drive-connect` → `/api/auth/drive-callback`)
- [x] Stores `google_refresh_token` in `user_services` per user
- [x] "Probar conexión" — tests folder access
- [x] "Sincronizar todo" — bulk uploads all `mossos_sent=true` records (TXT + PDF)
- [x] Auto-upload to Drive on each new Mossos send (`/api/mossos/complete`)
- [ ] Add `https://checkin-dashboard-eight.vercel.app/api/auth/drive-callback` to Google Cloud OAuth redirect URIs (manual step per user)

---

## PART 6 — Database Schema ✓

### Tables (current)
```sql
users            (id, email, name, created_at)
properties       (id, user_id, name, address, ical_url, mossos_id, cover_color)
reservations     (id, property_id, airbnb_code, guest_name, check_in, check_out,
                  nights, guests, tel_suffix, checked_in_at)
checkin_records  (id, reservation_id, property_id, airbnb_code,
                  guest_data jsonb, form_complete bool,
                  txt_content text, txt_filename text,
                  pdf_base64 text,
                  mossos_sent bool, mossos_status text, sent_at timestamp,
                  created_at, updated_at)
user_services    (id, user_id, email_enabled, email,
                  telegram_enabled, telegram_token, telegram_chat_id,
                  drive_enabled, drive_folder_id, google_refresh_token)
```

### RLS Policies ✓
- Properties, reservations, checkin_records: user sees only their own data
- `user_services`: user sees only their row

---

## PART 7 — Deployment ✓

### 7.1 Vercel ✓
- [x] Connected to GitHub `anikashouse/checkin-dashboard`
- [x] Auto-deploy on push to `main`
- [x] Live at: `checkin-dashboard-eight.vercel.app`
- [x] Deployment Protection bypass secret configured for GitHub Actions

### 7.2 Environment variables (Vercel)
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXTAUTH_SECRET
NEXTAUTH_URL                    = https://checkin-dashboard-eight.vercel.app
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
MOSSOS_CALLBACK_SECRET
```

### 7.3 Environment variables (GitHub Actions / airbnb_chekin)
```
MOSSOS_API_URL
MOSSOS_API_KEY
DASHBOARD_URL                   = https://checkin-dashboard-eight.vercel.app
DASHBOARD_SECRET                = same as MOSSOS_CALLBACK_SECRET
VERCEL_BYPASS_SECRET            = x-vercel-protection-bypass token
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

### 7.4 Pending
- [ ] Custom domain + SSL
- [ ] Supabase backups configured
- [ ] Error tracking (Sentry)

---

## NEXT PRIORITIES

1. Connect Google Drive for current user (add redirect URI in Google Cloud Console → click "Conectar Google Drive")
2. Upload `ID50044239.015.txt` from correct path and send to Mossos (reservation HM35BJ3QKE)
3. Per-property color picker
4. Bulk "Sync All" properties button
5. Edit reservation fields from detail page
