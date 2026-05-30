-- Server-side cache for experimental DSE market quotes (edge function only).
-- Not exposed to clients via RLS — service role writes from dse-market-data function.

create table if not exists public.market_quotes_cache (
  id text primary key default 'latest',
  quotes jsonb not null default '[]'::jsonb,
  status jsonb not null default '{}'::jsonb,
  fetched_at timestamptz not null default now()
);

alter table public.market_quotes_cache enable row level security;

-- No client policies — edge function uses service role.

comment on table public.market_quotes_cache is
  'Cached normalized market quotes for experimental DSE proxy fallback.';
