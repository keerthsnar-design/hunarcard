-- ============================================================
-- Hunar Card - Anti-Fake-Photo & Report Protection Migration
-- ============================================================
-- Run this script in Supabase Dashboard -> SQL Editor -> New Query
-- to add the new columns, duplicate photo check function,
-- and reporting system.
-- ============================================================

-- 1. Add source and file_hash columns to work_photos
alter table public.work_photos
  add column if not exists source text check (source in ('camera', 'gallery')) default 'gallery',
  add column if not exists file_hash text;

create index if not exists idx_work_photos_file_hash on public.work_photos(file_hash);

-- 2. SECURITY DEFINER function to check if a photo hash already exists on another user's card
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

-- 3. Create table: reports
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.skill_cards(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  reason text not null check (reason in ('Fake photo', 'Fake vouch', 'Wrong information', 'Other')),
  created_at timestamptz not null default now(),
  constraint reports_card_user_unique unique (card_id, user_id)
);

-- Enable RLS on reports
alter table public.reports enable row level security;

-- Drop old policies if re-running
drop policy if exists "reports_select_own" on public.reports;
drop policy if exists "reports_insert_not_owner_published" on public.reports;

-- Policy: Select only own reports
create policy "reports_select_own"
on public.reports
for select
to anon, authenticated
using (user_id = auth.uid());

-- Policy: Insert only by current user, on published card, and not by card owner
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

-- 4. SECURITY DEFINER function to safely return report count for a card
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
