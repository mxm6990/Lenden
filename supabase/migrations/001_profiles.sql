-- Lenden profiles table — run in Supabase SQL Editor or via Supabase CLI
-- Maps to src/types/profile.ts UserProfile and src/types/supabase.ts ProfileRow

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  profile_initial text,
  kyc_status text not null default 'not_started'
    check (kyc_status in ('not_started', 'pending', 'verified', 'rejected', 'expired')),
  bo_account_status text not null default 'not_opened'
    check (bo_account_status in ('not_opened', 'pending', 'active', 'suspended', 'closed')),
  linked_wallet text,
  linked_bank text,
  nid_verification_status text not null default 'not_started'
    check (nid_verification_status in ('not_started', 'pending', 'verified', 'rejected', 'expired')),
  risk_profile_status text not null default 'not_assessed'
    check (risk_profile_status in ('not_assessed', 'conservative', 'moderate', 'aggressive', 'expired')),
  lenden_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_lenden_id_idx on public.profiles (lenden_id);

alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  with check (auth.uid() = id);

-- Keep updated_at fresh
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_profiles_updated_at();

-- Auto-create profile row when Supabase Auth user signs up (Option B later)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, profile_initial, lenden_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    upper(left(coalesce(new.raw_user_meta_data ->> 'full_name', 'LU'), 2)),
    'LDN-' || upper(substr(replace(new.id::text, '-', ''), 1, 8))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
