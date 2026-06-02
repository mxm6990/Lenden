-- Per-ticker durable cache for experimental DSE quotes (edge function service role only).
-- Complements market_quotes_cache (aggregate JSON snapshot from migration 006).

create table if not exists public.market_quotes_by_ticker (
  ticker text primary key,
  stock_id text not null,
  name text,
  last_price numeric not null,
  change numeric not null default 0,
  change_percent numeric not null default 0,
  volume numeric not null default 0,
  trade_time timestamptz not null default now(),
  source text not null default 'experimental_dse',
  source_label text not null default 'Experimental DSE Feed',
  raw jsonb,
  updated_at timestamptz not null default now()
);

create index if not exists market_quotes_by_ticker_updated_at_idx
  on public.market_quotes_by_ticker (updated_at desc);

alter table public.market_quotes_by_ticker enable row level security;

comment on table public.market_quotes_by_ticker is
  'Last known DSE quote per ticker. Written by dse-market-data edge function; not exposed to clients.';

-- Revoke direct client access; edge function uses service role.
revoke all on table public.market_quotes_by_ticker from anon, authenticated;
grant all on table public.market_quotes_by_ticker to service_role;
