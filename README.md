# TripPlan

מתכנן טיולים בעברית — Hebrew/RTL trip planner with mobile-first UI and optional Supabase sync.

## Quick start

```bash
npm install
npm run dev
```

The app runs out of the box with **localStorage**. Auth + cross-device sync require Supabase setup (below).

## Supabase setup (optional)

The app is fully functional without Supabase. Add it when you want accounts and cross-device sync.

### 1. Create a Supabase project

Go to [supabase.com](https://supabase.com), create a project, and copy the **Project URL** and **anon public key** from *Project Settings → API*.

### 2. Add environment variables

Create `.env.local` in the project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Restart `npm run dev` after editing `.env.local`.

### 3. Run the schema

Open the Supabase dashboard → **SQL Editor** → **New query**, paste the contents of `supabase/schema.sql`, and run it.

This creates: `profiles`, `trips`, `flights`, `hotels`, `restaurants`, `events`, `packing_items`, `photos`, `trip_notes`. Each table has Row Level Security so users can only read/write their own rows.

### 4. (Optional) Disable email confirmation for local testing

In *Authentication → Providers → Email*, turn off **Confirm email** if you want signups to log in immediately without clicking a confirmation link.

## What got built

- **Mobile-first UI**: viewport meta tag, safe-area insets for notched phones, 44px touch targets, iOS-zoom-prevention on inputs, mobile camera capture in the photo uploader, bottom-sheet modals on small screens, vertical card stacking, dedicated mobile lightbox controls.
- **Auth (Supabase)**: signup, login, forgot password, reset password, logout, session-cookie middleware (Next 16 calls it *Proxy*) that protects every non-public page. Hebrew UI throughout: הרשמה / התחברות / התנתקות / שכחת סיסמה.
- **Hybrid storage**: when Supabase is configured *and* the user is signed in, all data goes to Postgres. Otherwise the existing localStorage path is used. The same call sites work in both modes.
- **One-shot migration**: a banner on the homepage offers to upload existing localStorage data to the cloud the first time a user signs in.

## Testing

### Auth flow
1. Open `/signup`, register with email + password.
2. If email confirmation is enabled, click the link in your inbox; otherwise you're logged in straight away.
3. Visit `/`, create a trip — it lands in the cloud (`select * from trips` confirms it).
4. Sign out from the user menu (top-left of the homepage hero), then sign in again on a different device with the same email.

### Mobile
- Chrome DevTools → device toolbar → iPhone 14 Pro / Pixel 8.
- Or open the network IP shown by `npm run dev` (e.g. `http://192.168.1.x:3000`) on your phone over the same Wi-Fi.
- Verify: no horizontal scroll, hero fits without zooming out, bottom nav is reachable, photo uploader exposes both "מצלמה" and "גלריה" buttons.

## Tech

- Next.js 16 (Turbopack, App Router, `proxy.ts` for middleware)
- React 19
- Tailwind CSS v4
- Supabase JS + `@supabase/ssr` for server-side cookie handling
- date-fns / lucide-react

## Structure

```
src/
  app/
    (auth)/             login, signup, forgot-password, reset-password
    auth/callback/      OAuth + email confirmation handler
    trips/[id]/         dashboard + 9 sub-pages
    page.tsx            home (trip list)
    layout.tsx          AuthProvider mounts here
  components/
    auth/               AuthProvider, UserMenu, MigrateLocalDataBanner, AuthCard
    ui/                 Button, Input, Modal, Card, ImageUploader, ...
    calendar/           TripCalendar (with mobile list view)
    flights/, hotels/, restaurants/, events/, trips/  forms
    TripSidebar.tsx     desktop sidebar + mobile bottom nav
  lib/
    storage.ts          hybrid Supabase ↔ localStorage layer
    supabase/           client.ts (browser), server.ts (RSC), config.ts (env)
    types.ts, utils.ts, image.ts
  proxy.ts              Next 16 middleware — gates protected routes
supabase/
  schema.sql            tables + RLS policies (paste into Supabase SQL editor)
```
