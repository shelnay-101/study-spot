-- Fixes "admin cannot edit study spaces". Safe to run more than once.

-- 1) Accounts created before the profile trigger existed have no profile row.
insert into public.profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

-- 2) If nobody is admin yet, promote the earliest account.
update public.profiles set role = 'admin'
where id = (select p.id from public.profiles p join auth.users u on u.id = p.id order by u.created_at limit 1)
  and not exists (select 1 from public.profiles where role = 'admin');

-- 3) Make sure the admin check and edit rules are in place.
grant execute on function public.is_admin() to anon, authenticated;
drop policy if exists "admins insert spaces" on public.study_spaces;
drop policy if exists "admins update spaces" on public.study_spaces;
drop policy if exists "admins delete spaces" on public.study_spaces;
create policy "admins insert spaces" on public.study_spaces for insert with check (public.is_admin());
create policy "admins update spaces" on public.study_spaces for update using (public.is_admin()) with check (public.is_admin());
create policy "admins delete spaces" on public.study_spaces for delete using (public.is_admin());

-- To make a specific account admin instead, uncomment and edit:
-- update public.profiles set role = 'admin' where email = 'you@example.com';

-- Check the result:
select email, role from public.profiles order by created_at;
