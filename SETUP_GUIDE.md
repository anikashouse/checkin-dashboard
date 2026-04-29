# CheckIn Dashboard - Setup & Implementation Guide

## Part 1: User Setup (Manual Steps for New Users)

### Step 1.1: Get Airbnb iCal URLs
- [ ] Go to Airbnb Host Dashboard
- [ ] For each property: Settings → Calendar → Copy iCal URL
- [ ] Store URLs safely (they contain tokens)
- [ ] Example: `https://www.airbnb.es/calendar/ical/50886202.ics?t=...`

**How to find it:**
1. Login to Airbnb as host
2. Go to "Manage listings"
3. Click on a property
4. Calendar settings → iCal subscription
5. Copy the full URL

---

### Step 1.2: Prepare Mossos Information
- [ ] Get establishment ID from Mossos registration (if applicable)
- [ ] Example: `ID50044239`
- [ ] Note: Required only for Spanish properties

---

### Step 1.3: Deploy Own Instance
- [ ] Fork/clone the repository
- [ ] Create Supabase project
- [ ] Setup environment variables
- [ ] Deploy to Vercel/similar
- [ ] (See Part 3: Deployment)

---

### Step 1.4: Create User Account
- [ ] Login to dashboard (once auth is implemented)
- [ ] Or contact admin for account creation
- [ ] (See Part 2.1: Authentication)

---

### Step 1.5: Add Properties via UI
- [ ] Go to Dashboard → Propiedades (Properties)
- [ ] Click "+ Add Property"
- [ ] Fill in:
  - Property ID (e.g., p1, p2)
  - Property Name
  - iCal URL (from Step 1.1)
  - Mossos ID (optional, from Step 1.2)
- [ ] Click "Test iCal" to validate
- [ ] Click "Create Property"

---

### Step 1.6: Initial Sync
- [ ] In Properties settings, click "Sync Now"
- [ ] Wait for reservations to load
- [ ] Check dashboard to see reservations

---

## Part 2: Technical Implementation (Development)

### Part 2.1: Authentication with NextAuth
- [ ] [ ] Implement NextAuth sign-up flow
- [ ] [ ] Implement NextAuth sign-in flow
- [ ] [ ] Protect routes with session checks
- [ ] [ ] Add logout functionality
- [ ] [ ] Store user_id in session
- [ ] [ ] Add login page at `/auth/signin`

**Files to create/modify:**
```
src/app/auth/signin/page.tsx (NEW)
src/app/auth/signup/page.tsx (NEW)
src/lib/auth.ts (NEW)
src/middleware.ts (NEW - protect routes)
```

---

### Part 2.2: Multi-Tenancy - Database Schema
- [ ] [ ] Update `properties` table to filter by `user_id`
- [ ] [ ] Update `reservations` table (already has property_id)
- [ ] [ ] Add RLS (Row Level Security) policies
- [ ] [ ] Ensure all queries filter by user context

**RLS Policies needed:**
```sql
-- Properties: users can only see their own
-- Reservations: users can only see reservations from their properties
-- CheckinRecords: users can only see records for their properties
```

---

### Part 2.3: Update API Endpoints
- [ ] [ ] Get user from session in all endpoints
- [ ] [ ] Filter properties by user_id
- [ ] [ ] Filter reservations by user's properties
- [ ] [ ] Prevent cross-user data access

**Endpoints to update:**
```
GET /admin/properties/list → filter by session.user.id
GET /sync/ical → iterate only user's properties
POST /admin/properties/create → add user_id
PUT /admin/properties/{id} → verify ownership
```

---

### Part 2.4: Update UI Components
- [ ] [ ] Show user info in sidebar
- [ ] [ ] Add sign-out button
- [ ] [ ] Show only user's properties
- [ ] [ ] Hide admin endpoints from regular users
- [ ] [ ] Add role-based access control (RBAC)

---

### Part 2.5: User Profile Page
- [ ] [ ] Create `/dashboard/profile` page
- [ ] [ ] Show user info (email, joined date, etc)
- [ ] [ ] Allow change password
- [ ] [ ] Show API key for integrations (future)

---

## Part 3: Deployment

### Step 3.1: Environment Setup
- [ ] [ ] Create `.env.production` file
- [ ] [ ] Get Supabase keys from project settings
- [ ] [ ] Configure OAuth providers (Google, GitHub, etc)
- [ ] [ ] Set NEXTAUTH_SECRET (generate: `openssl rand -base64 32`)
- [ ] [ ] Set NEXTAUTH_URL to production domain

**Required env vars:**
```
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://yourdomain.com
```

---

### Step 3.2: Database Initialization
- [ ] [ ] Create Supabase project
- [ ] [ ] Run migrations (create users, properties, reservations tables)
- [ ] [ ] Setup RLS policies
- [ ] [ ] Configure backups
- [ ] [ ] Setup logging

**Migrations needed:**
```sql
-- Add user_id to properties if not exists
-- Add RLS policies
-- Create indexes for performance
```

---

### Step 3.3: Deploy to Vercel
- [ ] [ ] Connect GitHub repo to Vercel
- [ ] [ ] Add environment variables in Vercel dashboard
- [ ] [ ] Configure build settings
- [ ] [ ] Deploy preview environment first
- [ ] [ ] Test thoroughly before production

---

### Step 3.4: Domain & SSL
- [ ] [ ] Configure custom domain in Vercel
- [ ] [ ] SSL certificate (automatic with Vercel)
- [ ] [ ] Update NEXTAUTH_URL to match domain
- [ ] [ ] Test login on production domain

---

### Step 3.5: Monitoring & Backups
- [ ] [ ] Setup Supabase backups
- [ ] [ ] Configure error tracking (Sentry?)
- [ ] [ ] Setup uptime monitoring
- [ ] [ ] Create runbook for common issues

---

## Part 4: Additional Features

### Part 4.1: Multi-Property Support
- [ ] [ ] Users can add multiple properties
- [ ] [ ] Dashboard shows all user's properties
- [ ] [ ] Bulk operations (sync all, etc)
- [ ] [ ] Property-specific settings

---

### Part 4.2: Team Management
- [ ] [ ] Invite other users to manage properties
- [ ] [ ] Role-based permissions (admin, manager, viewer)
- [ ] [ ] Activity log of who did what

---

### Part 4.3: API Keys for Integrations
- [ ] [ ] Generate API keys per user
- [ ] [ ] Allow external integrations
- [ ] [ ] Rate limiting per key

---

### Part 4.4: Webhooks
- [ ] [ ] Setup webhooks for real-time updates
- [ ] [ ] Notify when new reservation arrives
- [ ] [ ] Integration with Slack/Discord

---

## Priority Order

**Priority 1 (Must have):**
1. Authentication (Part 2.1)
2. Multi-tenancy DB (Part 2.2)
3. Update API endpoints (Part 2.3)
4. Environment variables for deployment (Part 3.1)
5. Supabase setup guide (Part 3.2)

**Priority 2 (Should have):**
6. Update UI (Part 2.4)
7. Vercel deployment (Part 3.3)
8. Multi-property support (Part 4.1)

**Priority 3 (Nice to have):**
9. User profile (Part 2.5)
10. Team management (Part 4.2)
11. API keys (Part 4.3)
12. Webhooks (Part 4.4)

---

## Current Status

```
[  ] Part 1: User Setup (Manual guide)

[✓] Part 2.1: Authentication
    - NextAuth configured with Google OAuth
    - Users saved to Supabase on first login
    - Middleware protects dashboard routes
    - Session includes user_id
    
[✓] Part 2.2: Multi-tenancy DB
    - users table created with RLS
    - user_id column added to properties
    - RLS policies configured for both tables
    - Each user can only see their own data
    
[✓] Part 2.3: API Endpoints
    - All endpoints filter by user_id
    - property_id filtering in queries
    - Supabase service role key configured

[✓] Part 2.4: UI Components - PARTIAL
    [✓] Dashboard layout (dark sidebar + light content)
    [✓] Calendar component (month view with reservations)
    [✓] Property cards (with reservation counts)
    [✓] Reservation summary (próximas, activas, completadas)
    [✓] Property detail page (/dashboard/[id])
    [ ] Edit property modal
    [ ] Add property form
    
[  ] Part 2.5: User Profile
[  ] Part 3.1: Environment Setup
[✓] Part 3.2: Database Initialization
    - Supabase project configured
    - Tables created and synced
    
[✓] Part 3.3: Deploy to Vercel
    - Deployed and live at checkin-dashboard-eight.vercel.app
    - Auto-deploy from GitHub main branch
    
[  ] Part 3.4: Domain & SSL
[  ] Part 3.5: Monitoring

[✓] Part 4.1: Multi-property Support - PARTIAL
    [✓] Users can add multiple properties
    [✓] Dashboard shows all user's properties
    [✓] Property-specific calendar view
    [ ] Bulk operations (sync all)
    [ ] Property-specific settings
    
[  ] Part 4.2: Team Management
[  ] Part 4.3: API Keys
[  ] Part 4.4: Webhooks

[  ] ADDITIONAL: Mossos Integration
    [ ] Status badges for Mossos uploads
    [ ] Sync to Mossos API
    [ ] Checkin form with Mossos code
```

---

## Next Steps

1. **Start with Part 2.1** - Implement authentication
2. Make sure Part 2.2 is done - Database RLS
3. Update all endpoints - Part 2.3
4. Update UI to be multi-tenant - Part 2.4
5. Test thoroughly locally
6. Deploy to Vercel - Part 3.3

**Ready to start?** → Let's begin with Part 2.1: Authentication
