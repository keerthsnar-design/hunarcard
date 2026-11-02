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
  created_at timestamptz not null default now()
);

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

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table public.skill_cards enable row level security;
alter table public.work_photos enable row level security;
alter table public.vouches enable row level security;

-- ------------------------------------------------------------
-- Policies for skill_cards
-- ------------------------------------------------------------
-- Select if is_published = true or user_id = auth.uid() (applies to anon and authenticated)
create policy "skill_cards_select_published_or_owner"
on public.skill_cards
for select
to anon, authenticated
using (is_published = true or user_id = auth.uid());

-- Insert owner-only
create policy "skill_cards_insert_owner"
on public.skill_cards
for insert
to anon, authenticated
with check (user_id = auth.uid());

-- Update owner-only
create policy "skill_cards_update_owner"
on public.skill_cards
for update
to anon, authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Delete owner-only
create policy "skill_cards_delete_owner"
on public.skill_cards
for delete
to anon, authenticated
using (user_id = auth.uid());

-- ------------------------------------------------------------
-- Policies for work_photos
-- ------------------------------------------------------------
-- Select if parent card is published or owned by the user
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

-- Insert owner-only
create policy "work_photos_insert_owner"
on public.work_photos
for insert
to anon, authenticated
with check (user_id = auth.uid());

-- Update owner-only
create policy "work_photos_update_owner"
on public.work_photos
for update
to anon, authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- Delete owner-only
create policy "work_photos_delete_owner"
on public.work_photos
for delete
to anon, authenticated
using (user_id = auth.uid());

-- ------------------------------------------------------------
-- Policies for vouches
-- ------------------------------------------------------------
-- Select if parent card is published or owned
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

-- Insert only with WITH CHECK (user_id = auth.uid()), only on a published card, and not by the card owner
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

-- Allow a user to delete only their own vouch. No update.
create policy "vouches_delete_own"
on public.vouches
for delete
to anon, authenticated
using (user_id = auth.uid());

-- ============================================================
-- STORAGE BUCKET: work-photos
-- ============================================================
-- Create bucket if it doesn't already exist
insert into storage.buckets (id, name, public)
values ('work-photos', 'work-photos', true)
on conflict (id) do update set public = true;

-- Storage Policy 1: Public read for demo
create policy "work_photos_storage_public_read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'work-photos');

-- Storage Policy 2: Insert allowed only into a folder named auth.uid()
create policy "work_photos_storage_insert_folder"
on storage.objects
for insert
to anon, authenticated
with check (
  bucket_id = 'work-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage Policy 3: Delete only own files
create policy "work_photos_storage_delete_own"
on storage.objects
for delete
to anon, authenticated
using (
  bucket_id = 'work-photos'
  and (storage.foldername(name))[1] = auth.uid()::text
);
