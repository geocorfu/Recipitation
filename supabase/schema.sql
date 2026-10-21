-- Recipitation schema
-- Run this once in Supabase: SQL Editor > New query > paste > Run.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------
-- Recipes. Ingredients and steps are stored as the JSON pasted in
-- (groups of items), so a shopping list can read quantity/unit/name/
-- metric later without a schema change.
-- ---------------------------------------------------------------
create table if not exists public.recipes (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  category      text not null default 'Άλλο',
  tags          text[] not null default '{}',
  from_person   text,
  servings      integer,
  yield         text,
  prep_minutes  integer,
  cook_minutes  integer,
  ingredients   jsonb not null default '[]'::jsonb,
  steps         jsonb not null default '[]'::jsonb,
  notes         text,
  source_url    text,
  image_url     text,
  -- Filled by the app on save: lowercase, accents stripped, ς -> σ.
  search_text   text not null default '',
  created_by    uuid references auth.users (id) default auth.uid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists recipes_title_idx on public.recipes (title);

-- Keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recipes_touch_updated_at on public.recipes;
create trigger recipes_touch_updated_at
  before update on public.recipes
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------
-- Row Level Security: only signed-in users. Turn OFF public sign-ups
-- in Authentication > Sign In / Providers so nobody else can join.
-- ---------------------------------------------------------------
alter table public.recipes enable row level security;

-- Explicit grants: newer Supabase projects may not expose new tables to the API
-- automatically. Signed-in users only; the anon role gets nothing.
-- service_role is for the daily keep-alive cron job.
revoke all on public.recipes from anon;
grant select, insert, update, delete on public.recipes to authenticated;
grant select, insert, update, delete on public.recipes to service_role;

drop policy if exists "family can read recipes" on public.recipes;
drop policy if exists "family can write recipes" on public.recipes;
create policy "family can read recipes" on public.recipes
  for select to authenticated using (true);
create policy "family can write recipes" on public.recipes
  for all to authenticated using (true) with check (true);
