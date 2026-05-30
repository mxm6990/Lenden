-- Dynamic DSE securities master (closed beta paper trading)

create table if not exists public.securities (
  id uuid primary key default gen_random_uuid(),
  ticker text unique not null,
  company_name text not null,
  sector text,
  exchange text not null default 'DSE',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists securities_ticker_idx on public.securities (ticker);
create index if not exists securities_company_name_idx on public.securities (company_name);
create index if not exists securities_is_active_idx on public.securities (is_active);

drop trigger if exists securities_set_updated_at on public.securities;
create trigger securities_set_updated_at
  before update on public.securities
  for each row execute function public.set_profiles_updated_at();

alter table public.securities enable row level security;

create policy "securities_select_authenticated"
  on public.securities
  for select
  to authenticated
  using (true);

comment on table public.securities is
  'DSE security universe for LenDen paper trading. Writes via service role / Edge Functions only.';
