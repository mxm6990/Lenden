-- Phase 4: Persistent mock investing loop
-- holdings, watchlists, transactions, mock_orders, support_tickets, audit_logs
-- buying power columns on profiles

-- ─── Buying power on profiles ───────────────────────────────────────────────
alter table public.profiles
  add column if not exists buying_power_available numeric not null default 8450,
  add column if not exists buying_power_reserved numeric not null default 1200;

-- ─── Holdings ─────────────────────────────────────────────────────────────
create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stock_id text not null,
  shares numeric not null default 0 check (shares >= 0),
  avg_cost numeric not null default 0 check (avg_cost >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, stock_id)
);

create index if not exists holdings_user_id_idx on public.holdings (user_id);

-- ─── Watchlists ───────────────────────────────────────────────────────────
create table if not exists public.watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stock_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, stock_id)
);

create index if not exists watchlists_user_id_idx on public.watchlists (user_id);

-- ─── Transactions ─────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('buy', 'sell', 'deposit', 'withdrawal', 'dividend')),
  stock_id text,
  ticker text,
  shares numeric,
  amount numeric not null,
  status text not null default 'completed'
    check (status in ('completed', 'pending', 'failed')),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists transactions_user_id_idx on public.transactions (user_id, created_at desc);

-- ─── Mock orders ──────────────────────────────────────────────────────────
create table if not exists public.mock_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  stock_id text not null,
  symbol text not null,
  side text not null default 'buy' check (side in ('buy', 'sell')),
  amount_bdt numeric not null,
  fee_bdt numeric not null default 0,
  filled_shares numeric not null default 0,
  status text not null default 'accepted'
    check (status in ('accepted', 'rejected', 'pending')),
  created_at timestamptz not null default now()
);

create index if not exists mock_orders_user_id_idx on public.mock_orders (user_id, created_at desc);

-- ─── Support tickets ──────────────────────────────────────────────────────
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  subject text not null,
  description text not null,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_user_id_idx on public.support_tickets (user_id, created_at desc);

-- ─── Audit logs (append-only from client — use Edge Functions in production) ─
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  target_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  device_id text,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id, created_at desc);

-- ─── updated_at triggers ──────────────────────────────────────────────────
drop trigger if exists holdings_set_updated_at on public.holdings;
create trigger holdings_set_updated_at
  before update on public.holdings
  for each row execute function public.set_profiles_updated_at();

drop trigger if exists support_tickets_set_updated_at on public.support_tickets;
create trigger support_tickets_set_updated_at
  before update on public.support_tickets
  for each row execute function public.set_profiles_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────
alter table public.holdings enable row level security;
alter table public.watchlists enable row level security;
alter table public.transactions enable row level security;
alter table public.mock_orders enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;

-- holdings
create policy "holdings_select_own" on public.holdings for select using (auth.uid() = user_id);
create policy "holdings_insert_own" on public.holdings for insert with check (auth.uid() = user_id);
create policy "holdings_update_own" on public.holdings for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "holdings_delete_own" on public.holdings for delete using (auth.uid() = user_id);

-- watchlists
create policy "watchlists_select_own" on public.watchlists for select using (auth.uid() = user_id);
create policy "watchlists_insert_own" on public.watchlists for insert with check (auth.uid() = user_id);
create policy "watchlists_delete_own" on public.watchlists for delete using (auth.uid() = user_id);

-- transactions
create policy "transactions_select_own" on public.transactions for select using (auth.uid() = user_id);
create policy "transactions_insert_own" on public.transactions for insert with check (auth.uid() = user_id);

-- mock_orders
create policy "mock_orders_select_own" on public.mock_orders for select using (auth.uid() = user_id);
create policy "mock_orders_insert_own" on public.mock_orders for insert with check (auth.uid() = user_id);

-- support_tickets
create policy "support_tickets_select_own" on public.support_tickets for select using (auth.uid() = user_id);
create policy "support_tickets_insert_own" on public.support_tickets for insert with check (auth.uid() = user_id);
create policy "support_tickets_update_own" on public.support_tickets for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- audit_logs: append-only for authenticated users (no update/delete)
create policy "audit_logs_select_own" on public.audit_logs for select using (auth.uid() = user_id);
create policy "audit_logs_insert_own" on public.audit_logs for insert with check (auth.uid() = user_id);

-- Update signup trigger with buying power defaults
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, phone, profile_initial, lenden_id,
    buying_power_available, buying_power_reserved
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), ''),
    upper(left(coalesce(new.raw_user_meta_data ->> 'full_name', 'LU'), 2)),
    'LDN-' || upper(substr(replace(new.id::text, '-', ''), 1, 8)),
    8450,
    1200
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
