-- Keeps students and admin separate. Safe to run more than once.
-- EDIT the email below (one place) BEFORE running.

-- 1) Every new sign-up is a student. Nobody can become admin by signing up.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);  -- role defaults to 'student'
  return new;
end $$;

-- 2) Everyone is a student, then only the account you name is admin.
update public.profiles set role = 'student';
update public.profiles set role = 'admin' where email = 'YOUR-ADMIN-EMAIL@example.com';

-- 3) Check the result: exactly one admin, everyone else student.
select email, role from public.profiles order by role, email;
