-- Run once if you already created users before phone was copied to profiles.
-- Supabase SQL Editor → paste → Run

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, profile_initial, lenden_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    upper(left(coalesce(new.raw_user_meta_data ->> 'full_name', 'LU'), 2)),
    'LDN-' || upper(substr(replace(new.id::text, '-', ''), 1, 8))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Backfill phone (and name) from auth metadata for existing accounts
update public.profiles p
set
  phone = nullif(trim(u.raw_user_meta_data ->> 'phone'), ''),
  full_name = coalesce(nullif(trim(p.full_name), ''), u.raw_user_meta_data ->> 'full_name', p.full_name),
  updated_at = now()
from auth.users u
where p.id = u.id
  and p.phone is null
  and nullif(trim(u.raw_user_meta_data ->> 'phone'), '') is not null;
