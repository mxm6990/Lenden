-- Phase 5: Schema integrity + atomic mock buy RPC
-- Run after 003_persistent_investing.sql

-- ─── 1. Buying power constraints ─────────────────────────────────────────────
do $$
begin
  alter table public.profiles
    add constraint profiles_buying_power_nonneg
    check (buying_power_available >= 0 and buying_power_reserved >= 0);
exception
  when duplicate_object then null;
end $$;

-- ─── 2. Support ticket category CHECK ───────────────────────────────────────
do $$
begin
  alter table public.support_tickets
    add constraint support_tickets_category_check
    check (category in ('general', 'account', 'transaction', 'dispute', 'recovery', 'technical'));
exception
  when duplicate_object then null;
end $$;

-- ─── 3. Link transactions → mock_orders ─────────────────────────────────────
alter table public.transactions
  add column if not exists mock_order_id uuid references public.mock_orders (id) on delete set null;

-- ─── 4. Indexes ─────────────────────────────────────────────────────────────
create index if not exists transactions_mock_order_id_idx
  on public.transactions (mock_order_id);

create index if not exists transactions_user_stock_idx
  on public.transactions (user_id, stock_id, created_at desc);

create index if not exists audit_logs_action_idx
  on public.audit_logs (action);

create index if not exists audit_logs_user_action_idx
  on public.audit_logs (user_id, action, created_at desc);

-- ─── 5. Watchlists UPDATE policy (for upsert on conflict) ───────────────────
do $$
begin
  create policy "watchlists_update_own"
    on public.watchlists
    for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);
exception
  when duplicate_object then null;
end $$;

-- ─── 6. Atomic mock buy RPC ─────────────────────────────────────────────────
create or replace function public.submit_mock_buy(
  p_stock_id text,
  p_symbol text,
  p_side text,
  p_amount_bdt numeric,
  p_fee_bdt numeric,
  p_filled_shares numeric,
  p_execution_price numeric,
  p_ticker text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_available numeric;
  v_order_id uuid;
  v_old_shares numeric;
  v_old_avg numeric;
  v_new_shares numeric;
  v_new_avg numeric;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_filled_shares is null or p_filled_shares <= 0 then
    raise exception 'invalid_filled_shares';
  end if;

  if p_execution_price is null or p_execution_price <= 0 then
    raise exception 'invalid_execution_price';
  end if;

  select buying_power_available
  into v_available
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'profile_not_found';
  end if;

  if p_amount_bdt > v_available then
    raise exception 'insufficient_buying_power';
  end if;

  insert into public.mock_orders (
    user_id,
    stock_id,
    symbol,
    side,
    amount_bdt,
    fee_bdt,
    filled_shares,
    status
  )
  values (
    v_user_id,
    p_stock_id,
    p_symbol,
    p_side,
    p_amount_bdt,
    p_fee_bdt,
    p_filled_shares,
    'accepted'
  )
  returning id into v_order_id;

  insert into public.transactions (
    user_id,
    type,
    stock_id,
    ticker,
    shares,
    amount,
    status,
    note,
    mock_order_id
  )
  values (
    v_user_id,
    'buy',
    p_stock_id,
    p_ticker,
    p_filled_shares,
    -p_amount_bdt,
    'completed',
    'Mock buy order',
    v_order_id
  );

  select shares, avg_cost
  into v_old_shares, v_old_avg
  from public.holdings
  where user_id = v_user_id
    and stock_id = p_stock_id
  for update;

  if found then
    v_new_shares := v_old_shares + p_filled_shares;
    v_new_avg := ((v_old_shares * v_old_avg) + (p_filled_shares * p_execution_price)) / v_new_shares;

    update public.holdings
    set
      shares = v_new_shares,
      avg_cost = v_new_avg,
      updated_at = now()
    where user_id = v_user_id
      and stock_id = p_stock_id;
  else
    insert into public.holdings (user_id, stock_id, shares, avg_cost)
    values (v_user_id, p_stock_id, p_filled_shares, p_execution_price);
  end if;

  update public.profiles
  set
    buying_power_available = v_available - p_amount_bdt,
    updated_at = now()
  where id = v_user_id;

  insert into public.audit_logs (user_id, action, target_id, metadata)
  values (
    v_user_id,
    'MOCK_ORDER_SUBMITTED',
    v_order_id::text,
    jsonb_build_object(
      'amountBdt', p_amount_bdt,
      'filledShares', p_filled_shares,
      'executionPrice', p_execution_price,
      'mock', true,
      'atomic', true
    )
  );

  return jsonb_build_object(
    'orderId', v_order_id,
    'buyingPowerAfter', v_available - p_amount_bdt,
    'filledShares', p_filled_shares,
    'executionPrice', p_execution_price
  );
end;
$$;

revoke all on function public.submit_mock_buy(
  text, text, text, numeric, numeric, numeric, numeric, text
) from public;

grant execute on function public.submit_mock_buy(
  text, text, text, numeric, numeric, numeric, numeric, text
) to authenticated;

-- ─── Verification queries (run manually after a mock buy) ───────────────────
-- select * from public.mock_orders order by created_at desc;
-- select * from public.transactions order by created_at desc;
-- select * from public.holdings order by updated_at desc;
-- select * from public.audit_logs order by created_at desc;
-- select email, buying_power_available, buying_power_reserved from public.profiles;
