-- Run AFTER schema.sql. Safe to run more than once.

-- 1) No email confirmation: every new account is confirmed on creation.
create or replace function public.auto_confirm_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin new.email_confirmed_at = coalesce(new.email_confirmed_at, now()); return new; end $$;
drop trigger if exists auto_confirm_before_insert on auth.users;
create trigger auto_confirm_before_insert before insert on auth.users
  for each row execute function public.auto_confirm_user();

-- 2) Roles: every new account is a student. Admins are promoted only by SQL (see 04_separate_roles.sql).

-- 3) Students save study spaces to a personal shortlist.
create table if not exists public.saved_spaces (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  space_id uuid not null references public.study_spaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, space_id)
);
alter table public.saved_spaces enable row level security;
drop policy if exists "read own saved" on public.saved_spaces;
drop policy if exists "add own saved" on public.saved_spaces;
drop policy if exists "remove own saved" on public.saved_spaces;
create policy "read own saved" on public.saved_spaces for select using (auth.uid() = user_id);
create policy "add own saved" on public.saved_spaces for insert with check (auth.uid() = user_id);
create policy "remove own saved" on public.saved_spaces for delete using (auth.uid() = user_id);
