-- StudySpot schema. Run in Supabase: SQL Editor > New query > Run. Safe to run more than once.
-- Run order: schema.sql first, then 02_demo_features.sql.

-- Profiles: one row per user, role is 'student' unless an admin promotes them.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'student' check (role in ('student','admin')),
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select using (auth.uid() = id);
-- No insert/update policies: users can never grant themselves admin.

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Study spaces
create table if not exists public.study_spaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('quiet','group')),
  location text not null,
  total_seats int not null check (total_seats > 0),
  open_seats int not null check (open_seats >= 0),
  has_wifi boolean not null default true,
  has_outlets boolean not null default true,
  last_updated timestamptz not null default now(),
  constraint open_within_total check (open_seats <= total_seats)
);
alter table public.study_spaces enable row level security;
drop policy if exists "anyone can read spaces" on public.study_spaces;
drop policy if exists "admins insert spaces" on public.study_spaces;
drop policy if exists "admins update spaces" on public.study_spaces;
drop policy if exists "admins delete spaces" on public.study_spaces;
create policy "anyone can read spaces" on public.study_spaces for select using (true);
create policy "admins insert spaces" on public.study_spaces for insert with check (public.is_admin());
create policy "admins update spaces" on public.study_spaces for update using (public.is_admin()) with check (public.is_admin());
create policy "admins delete spaces" on public.study_spaces for delete using (public.is_admin());

create or replace function public.touch_last_updated() returns trigger language plpgsql as $$
begin new.last_updated = now(); return new; end $$;
drop trigger if exists study_spaces_touch on public.study_spaces;
create trigger study_spaces_touch before update on public.study_spaces
  for each row execute function public.touch_last_updated();

-- Live updates for students
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'study_spaces') then
    alter publication supabase_realtime add table public.study_spaces;
  end if;
end $$;

-- Seed data (8 spaces), only when the table is empty
insert into public.study_spaces (name, type, location, total_seats, open_seats, has_wifi, has_outlets)
select * from (values
  ('Main Library Silent Hall', 'quiet', 'Main Library, Level 2', 60, 24, true, true),
  ('Main Library Reading Room', 'quiet', 'Main Library, Level 1', 40, 12, true, false),
  ('Engineering Study Lounge', 'group', 'Block B, Ground Floor', 30, 9, true, true),
  ('Science Commons', 'group', 'Science Building, Level 3', 36, 18, true, true),
  ('Business School Atrium', 'group', 'Business Building, Level 1', 50, 31, true, true),
  ('Arts Quiet Corner', 'quiet', 'Arts Building, Level 2', 20, 5, false, true),
  ('Student Centre Co-work Space', 'group', 'Student Centre, Level 2', 44, 0, true, true),
  ('Night Study Room', 'quiet', 'Main Library, Basement', 25, 14, true, true)
) as v(name, type, location, total_seats, open_seats, has_wifi, has_outlets)
where not exists (select 1 from public.study_spaces);

-- Make someone admin (replace the email):
-- update public.profiles set role = 'admin' where email = 'you@university.edu';
