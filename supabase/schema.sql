-- TripPlan — Supabase database schema
-- Run this once against your Supabase project (SQL editor → New query → paste → Run).
-- Tested against PostgreSQL 15 (Supabase default).
--
-- What this creates:
--   * One table per app entity: profiles, trips, flights, hotels, restaurants,
--     events, packing_items, photos, trip_notes.
--   * Every row carries user_id; child rows also carry trip_id.
--   * Row Level Security is enabled on every table so auth.uid() can only
--     read/write its own rows.
--   * created_at / updated_at columns with auto-touching triggers.
--
-- Safe to re-run: each statement uses IF [NOT] EXISTS or CREATE OR REPLACE.

------------------------------------------------------------
-- Helpers
------------------------------------------------------------

create extension if not exists "pgcrypto"; -- gen_random_uuid()

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

------------------------------------------------------------
-- profiles  (1:1 with auth.users — convenient place for display name etc.)
------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Auto-create a profile row when a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

------------------------------------------------------------
-- trips
------------------------------------------------------------

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  destination text,
  start_date date,
  end_date date,
  cover_image text,           -- data URL or remote URL
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trips_user_id_idx on public.trips(user_id);

drop trigger if exists trips_touch on public.trips;
create trigger trips_touch before update on public.trips
  for each row execute function public.touch_updated_at();

alter table public.trips enable row level security;

drop policy if exists "trips_owner_all" on public.trips;
create policy "trips_owner_all" on public.trips
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- Generic helper: build a child table referencing trips
------------------------------------------------------------
-- We just inline the same pattern below for each child table.

------------------------------------------------------------
-- flights
------------------------------------------------------------

create table if not exists public.flights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  type text not null check (type in ('international', 'internal')),
  airline text,
  departure_airport text,
  arrival_airport text,
  departure_date date,
  departure_time text,        -- 'HH:MM'
  price text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists flights_trip_idx on public.flights(trip_id);
create index if not exists flights_user_idx on public.flights(user_id);

drop trigger if exists flights_touch on public.flights;
create trigger flights_touch before update on public.flights
  for each row execute function public.touch_updated_at();

alter table public.flights enable row level security;

drop policy if exists "flights_owner_all" on public.flights;
create policy "flights_owner_all" on public.flights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- hotels
------------------------------------------------------------

create table if not exists public.hotels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  city text,
  hotel_name text,
  arrival_date date,
  departure_date date,
  notes text,
  price text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hotels_trip_idx on public.hotels(trip_id);

drop trigger if exists hotels_touch on public.hotels;
create trigger hotels_touch before update on public.hotels
  for each row execute function public.touch_updated_at();

alter table public.hotels enable row level security;

drop policy if exists "hotels_owner_all" on public.hotels;
create policy "hotels_owner_all" on public.hotels
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- restaurants
------------------------------------------------------------

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  city text,
  name text not null,
  date date,
  time text,
  location text,
  notes text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists restaurants_trip_idx on public.restaurants(trip_id);

drop trigger if exists restaurants_touch on public.restaurants;
create trigger restaurants_touch before update on public.restaurants
  for each row execute function public.touch_updated_at();

alter table public.restaurants enable row level security;

drop policy if exists "restaurants_owner_all" on public.restaurants;
create policy "restaurants_owner_all" on public.restaurants
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- events
------------------------------------------------------------

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  city text,
  name text not null,
  date date,
  time text,
  location text,
  notes text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_trip_idx on public.events(trip_id);

drop trigger if exists events_touch on public.events;
create trigger events_touch before update on public.events
  for each row execute function public.touch_updated_at();

alter table public.events enable row level security;

drop policy if exists "events_owner_all" on public.events;
create policy "events_owner_all" on public.events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- packing_items
------------------------------------------------------------

create table if not exists public.packing_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  name text not null,
  category text,
  is_done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists packing_items_trip_idx on public.packing_items(trip_id);

drop trigger if exists packing_items_touch on public.packing_items;
create trigger packing_items_touch before update on public.packing_items
  for each row execute function public.touch_updated_at();

alter table public.packing_items enable row level security;

drop policy if exists "packing_items_owner_all" on public.packing_items;
create policy "packing_items_owner_all" on public.packing_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- photos
------------------------------------------------------------

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  image_url text not null,
  caption text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists photos_trip_idx on public.photos(trip_id);

drop trigger if exists photos_touch on public.photos;
create trigger photos_touch before update on public.photos
  for each row execute function public.touch_updated_at();

alter table public.photos enable row level security;

drop policy if exists "photos_owner_all" on public.photos;
create policy "photos_owner_all" on public.photos
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- trip_notes  (one row per trip — content is free text)
------------------------------------------------------------

create table if not exists public.trip_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid not null references public.trips(id) on delete cascade,
  content text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trip_id)
);

drop trigger if exists trip_notes_touch on public.trip_notes;
create trigger trip_notes_touch before update on public.trip_notes
  for each row execute function public.touch_updated_at();

alter table public.trip_notes enable row level security;

drop policy if exists "trip_notes_owner_all" on public.trip_notes;
create policy "trip_notes_owner_all" on public.trip_notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

------------------------------------------------------------
-- Done.
------------------------------------------------------------
