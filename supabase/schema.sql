-- ============================================================
-- Hunar Card - Supabase Database Schema & Storage Configuration
-- ============================================================
-- Run this entire script in Supabase Dashboard -> SQL Editor -> New Query.
-- Make sure to enable Anonymous Sign-Ins in Supabase Dashboard:
-- Authentication -> Providers -> Anonymous Sign-Ins -> Enable.
-- ============================================================

-- Enable pgcrypto extension for gen_random_uuid if needed
create extension if not exists "pgcrypto";

-- 1. Table: skill_cards
create table if not exists public.skill_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  card_name text not null,
  trade text not null,
  years_experience int not null default 0,
  skills text[] not null default '{}',
  area text not null,
  availability text not null,
  story text check (char_length(story) <= 140),
  contact text null,
  show_contact boolean not null default false,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- 2. Table: work_photos
create table if not exists public.work_photos (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.skill_cards(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  file_path text not null,
  caption text,
  source text check (source in ('camera', 'gallery')) default 'gallery',
  file_hash text,
  created_at timestamptz not null default now()
);

create index if not exists idx_work_photos_file_hash on public.work_photos(file_hash);

-- 3. Table: vouches
create table if not exists public.vouches (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.skill_cards(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  comment text not null check (char_length(comment) <= 140),
  relation text not null check (relation in ('Customer', 'Colleague', 'Employer')),
  created_at timestamptz not null default now(),
  constraint vouches_card_user_unique unique (card_id, user_id)
);

-- 4. Table: reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.skill_cards(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  reason text not null check (reason in ('Fake photo', 'Fake vouch', 'Wrong information', 'Other')),
  created_at timestamptz not null default now(),
  constraint reports_card_user_unique unique (card_id, user_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.skill_cards enable row level security;
alter table public.work_photos enable row level security;
alter table public.vouches enable row level security;
alter table public.reports enable row level security;

-- ------------------------------------------------------------
-- Policies for skill_cards
-- ------------------------------------------------------------
create policy "skill_cards_select_published_or_owner"
on public.skill_cards
for select
to anon, authenticated
using (is_published = true or user_id = auth.uid());

create policy "skill_cards_insert_owner"
on public.skill_cards
for insert
to anon, authenticated
with check (user_id = auth.uid());

create policy "skill_cards_update_owner"
on public.skill_cards
for update
to anon, authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "skill_cards_delete_owner"
on public.skill_cards
for delete
to anon, authenticated
using (user_id = auth.uid());

-- ------------------------------------------------------------
-- Policies for work_photos
-- ------------------------------------------------------------
create policy "work_photos_select_published_or_owner"
on public.work_photos
for select
to anon, authenticated
using (
  exists (
    select 1 from public.skill_cards sc
    where sc.id = work_photos.card_id
      and (sc.is_published = true or sc.user_id = auth.uid())
  )
);

create policy "work_photos_insert_owner"
on public.work_photos
for insert
to anon, authenticated
with check (user_id = auth.uid());

create policy "work_photos_update_owner"
on public.work_photos
for update
to anon, authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "work_photos_delete_owner"
on public.work_photos
for delete
to anon, authenticated
using (user_id = auth.uid());

-- ------------------------------------------------------------
-- Policies for vouches
-- ------------------------------------------------------------
create policy "vouches_select_published_or_owner"
on public.vouches
for select
to anon, authenticated
using (
  exists (
    select 1 from public.skill_cards sc
    where sc.id = vouches.card_id
      and (sc.is_published = true or sc.user_id = auth.uid())
  )
);

create policy "vouches_insert_not_owner_published"
on public.vouches
for insert
to anon, authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.skill_cards sc
    where sc.id = vouches.card_id
      and sc.is_published = true
      and sc.user_id != auth.uid()
  )
);

create policy "vouches_delete_own"
on public.vouches
for delete
to anon, authenticated
using (user_id = auth.uid());

-- ------------------------------------------------------------
-- Policies for reports
-- ------------------------------------------------------------
create policy "reports_select_own"
on public.reports
for select
to anon, authenticated
using (user_id = auth.uid());

create policy "reports_insert_not_owner_published"
on public.reports
for insert
to anon, authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.skill_cards sc
    where sc.id = reports.card_id
      and sc.is_published = true
      and sc.user_id != auth.uid()
  )
);

-- ============================================================
-- HELPER FUNCTIONS (SECURITY DEFINER)
-- ============================================================

-- Function 1: Check if photo hash already exists on another user's card
create or replace function public.photo_hash_exists(h text)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if h is null or length(trim(h)) = 0 then
    return false;
  end if;

  return exists (
    select 1
    from public.work_photos wp
    join public.skill_cards sc on wp.card_id = sc.id
    where wp.file_hash = h
      and sc.user_id != auth.uid()
  );
end;
$$;

grant execute on function public.photo_hash_exists(text) to anon, authenticated;

-- Function 2: Count reports on a card
create or replace function public.report_count(cid uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  c integer;
begin
  select count(*)::integer into c
  from public.reports
  where card_id = cid;
  return coalesce(c, 0);
end;
$$;

grant execute on function public.report_count(uuid) to anon, authenticated;

-- ============================================================
-- STORAGE BUCKET: work-photos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('work-photos', 'work-photos', true)
on conflict (id) do update set public = true;

create policy "work_photos_storage_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'work-photos');

create policy "work_photos_storage_insert_folder"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'work-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "work_photos_storage_delete_own"
on storage.objects
for delete
to anon, authenticated
using (
  bucket_id = 'work-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
