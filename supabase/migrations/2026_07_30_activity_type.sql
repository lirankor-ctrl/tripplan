-- Migration for the "סוג פעילות" (activity type) feature.
-- Run manually in the Supabase SQL editor against the production project
-- AFTER backing up. Every statement is idempotent (IF NOT EXISTS / DROP IF
-- EXISTS … CREATE) so re-running is safe.
--
-- events.activity_type is nullable with NO default — existing rows stay
-- exactly as they are (NULL). The app treats NULL/missing as 'concert'
-- (הופעה) purely at the display layer (see src/lib/activityTypes.ts). This
-- migration does not modify any existing row's data.
--
-- Until this migration is applied, the app keeps working: storage.ts's
-- optionalColumns fallback strips activity_type from writes if the column
-- doesn't exist yet (same mechanism as flights.transport_type in
-- 2026_05_11_transport_type_and_documents.sql) — selections just won't
-- persist until the column exists.

alter table public.events
  add column if not exists activity_type text;

-- Drop and re-create the check constraint so re-running the script keeps the
-- allowed-values list in sync. NULL is explicitly allowed (legacy rows).
alter table public.events
  drop constraint if exists events_activity_type_check;
alter table public.events
  add constraint events_activity_type_check
  check (activity_type is null or activity_type in (
    'concert', 'play', 'museum', 'amusement_park', 'nature_park', 'beach',
    'trip', 'guided_tour', 'shopping', 'winery', 'culinary', 'exhibition',
    'sports_event', 'festival', 'other'
  ));
