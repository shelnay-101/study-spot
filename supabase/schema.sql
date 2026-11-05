-- Run in Supabase SQL Editor. Replace sample spaces with verified campus data.
create extension if not exists pgcrypto;
create table if not exists public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null default '',
 role text not null default 'student' check(role in ('student','staff','admin')),
 created_at timestamptz not null default now()
);
create table if not exists public.study_spaces (
 id uuid primary key default gen_random_uuid(),
 name text not null, building text not null,
 type text not null check(type in ('quiet','group')),
 total_seats integer not null check(total_seats>=0),
 available_seats integer not null default 0 check(available_seats>=0),
 distance_minutes integer not null default 0 check(distance_minutes>=0),
 wifi boolean not null default false, power_outlets boolean not null default false,
 quiet_environment boolean not null default false, description text not null default '',
 is_active boolean not null default true, updated_at timestamptz not null default now(),
 created_at timestamptz not null default now(),
 constraint available_not_over_total check(available_seats<=total_seats)
);
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.profiles(id,full_name) values(new.id,coalesce(new.raw_user_meta_data->>'full_name','Student'));
 return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.current_user_is_staff() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.profiles where id=(select auth.uid()) and role in ('staff','admin'));
$$;
alter table public.profiles enable row level security;
alter table public.study_spaces enable row level security;
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select to authenticated using(id=(select auth.uid()) or public.current_user_is_staff());
drop policy if exists "Staff can update profiles" on public.profiles;
create policy "Staff can update profiles" on public.profiles for update to authenticated using(public.current_user_is_staff()) with check(public.current_user_is_staff());
drop policy if exists "Anyone can read active study spaces" on public.study_spaces;
create policy "Anyone can read active study spaces" on public.study_spaces for select to anon,authenticated using(is_active=true);
drop policy if exists "Staff can insert study spaces" on public.study_spaces;
create policy "Staff can insert study spaces" on public.study_spaces for insert to authenticated with check(public.current_user_is_staff());
drop policy if exists "Staff can update study spaces" on public.study_spaces;
create policy "Staff can update study spaces" on public.study_spaces for update to authenticated using(public.current_user_is_staff()) with check(public.current_user_is_staff());
drop policy if exists "Staff can delete study spaces" on public.study_spaces;
create policy "Staff can delete study spaces" on public.study_spaces for delete to authenticated using(public.current_user_is_staff());
-- If this line says the table is already in the publication, remove it and rerun the rest.
alter publication supabase_realtime add table public.study_spaces;
insert into public.study_spaces(name,building,type,total_seats,available_seats,distance_minutes,wifi,power_outlets,quiet_environment,description) values
('Main Library — Silent Zone','Main Library · 2nd floor','quiet',40,12,4,true,true,true,'Individual desks in a designated silent study area.'),
('Learning Commons','Student Center · Ground floor','group',24,7,6,true,true,false,'Shared tables for small group study and discussion.'),
('Engineering Study Room','Engineering Building · 3rd floor','quiet',18,3,8,true,true,true,'Focused work area with desks and power outlets.'),
('Humanities Reading Room','Humanities Building · 1st floor','quiet',30,0,9,true,false,true,'A quiet reading room for individual study.'),
('Project Collaboration Room','Innovation Hub · 2nd floor','group',16,9,10,true,true,false,'Flexible seating for project teams and collaborative work.'),
('North Wing Study Lounge','North Academic Wing · 1st floor','quiet',22,5,3,false,true,true,'Casual individual study seating near the north entrance.')
on conflict do nothing;