-- Allow staff to sign in with an app username while Supabase Auth retains
-- its internal email-based credential identifier.
alter table public.profiles add column if not exists username text;

alter table public.profiles
  drop constraint if exists profiles_username_format;
alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[a-z0-9][a-z0-9._-]{2,31}$');

create unique index if not exists profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

update public.profiles p
set username = 'adminbantarsari'
from auth.users u
where p.id = u.id
  and lower(u.email) = lower('putrainti.sagara@gmail.com')
  and (p.username is null or p.username = '');
