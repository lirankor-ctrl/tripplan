-- Migration for the נסיעות / הסעות + Documents features.
-- Run manually in the Supabase SQL editor against the production project
-- AFTER backing up. Every statement is idempotent (IF NOT EXISTS / DROP IF
-- EXISTS … CREATE) so re-running is safe.
--
-- Two changes:
--   1. flights: add transport_type column (defaults to 'flight' so existing
--      rows are preserved as flights).
--   2. trip_documents: brand-new table for uploaded trip documents.
--
-- Storage bucket setup is at the bottom — only needed if you want users to
-- upload files. The app gracefully degrades to "metadata only" mode when
-- the bucket is absent.

------------------------------------------------------------
-- 1) flights.transport_type
------------------------------------------------------------

alter table public.flights
  add column if not exists transport_type text not null default 'flight';

-- Drop and re-create the check constraint so re-running the script keeps the
-- allowed-values list in sync.
alter table public.flights
  drop constraint if exists flights_transport_type_check;
alter table public.flights
  add constraint flights_transport_type_check
  check (transport_type in ('flight', 'train', 'bus', 'car', 'other'));

------------------------------------------------------------
-- 2) trip_documents
------------------------------------------------------------

create table if not exists public.trip_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text,
  category text,                       -- passport / insurance / flight_ticket / hotel_booking / car_rental / event_ticket / visa / other
  file_url text,                       -- public or signed download URL — empty rows are allowed (storage may not be configured)
  file_path text,                      -- storage object path; needed to delete the file when the row is removed
  file_type text,                      -- MIME type (application/pdf, image/jpeg, ...)
  file_size bigint,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trip_documents_trip_idx on public.trip_documents(trip_id);
create index if not exists trip_documents_user_idx on public.trip_documents(user_id);

drop trigger if exists trip_documents_touch on public.trip_documents;
create trigger trip_documents_touch before update on public.trip_documents
  for each row execute function public.touch_updated_at();

alter table public.trip_documents enable row level security;

drop policy if exists "trip_documents_owner_all" on public.trip_documents;
create policy "trip_documents_owner_all" on public.trip_documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- 3) (Optional) Storage bucket for uploaded documents
------------------------------------------------------------
-- Skip this block if you want documents-as-metadata-only.
--
-- Steps:
--   a. Supabase Dashboard → Storage → New bucket
--      - Name: trip-documents   (must match NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET)
--      - Public: ON  (the app uses getPublicUrl; flip to private + signed URLs
--        later by switching the documents page to call getSignedDownloadUrl).
--   b. Set NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=trip-documents in .env.local
--      (and on the production host).
--   c. Run the policies below so users can only read/write their OWN folder.
--      Files are stored at  {auth.uid()}/{trip_id}/{filename}.

-- Allow each authenticated user to read/write only files under their own user_id folder.
drop policy if exists "trip_documents_storage_select_own" on storage.objects;
create policy "trip_documents_storage_select_own" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'trip-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "trip_documents_storage_insert_own" on storage.objects;
create policy "trip_documents_storage_insert_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'trip-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "trip_documents_storage_update_own" on storage.objects;
create policy "trip_documents_storage_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'trip-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "trip_documents_storage_delete_own" on storage.objects;
create policy "trip_documents_storage_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'trip-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

------------------------------------------------------------
-- Done.
------------------------------------------------------------
