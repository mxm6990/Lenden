-- Phase 6: Atomic mock sell RPC + realized gain/loss on transactions
-- Run after 004_schema_integrity_and_atomic_mock_buy.sql

alter table public.transactions
  add column if not exists realized_gain_loss numeric;

create or replace function public.submit_mock_sell(
  p_stock_id text,
  p_symbol text,
  p_ticker text,
  p_shares numeric,
  p_execution_price numeric,
  p_fee_bdt numeric
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
  v_holding_shares numeric;
  v_avg_cost numeric;
  v_cost_basis numeric;
  v_gross_proceeds numeric;
  v_net_proceeds numeric;
  v_realized_gain_loss numeric;
  v_remaining_shares numeric;
begin
  if v_user_id is null then
    raise exception 'not_authenticated';
  end if;

  if p_shares is null or p_shares <= 0 then
    raise exception 'invalid_shares';
  end if;

  if p_execution_price is null or p_execution_price <= 0 then
    raise exception 'invalid_execution_price';
  end if;

  select shares, avg_cost
  into v_holding_shares, v_avg_cost
  from public.holdings
  where user_id = v_user_id
    and stock_id = p_stock_id
  for update;

  if not found then
    raise exception 'holding_not_found';
  end if;

  if p_shares > v_holding_shares then
    raise exception 'insufficient_shares';
  end if;

  v_cost_basis := round((p_shares * v_avg_cost)::numeric, 2);
  v_gross_proceeds := round((p_shares * p_execution_price)::numeric, 2);
  v_net_proceeds := round((v_gross_proceeds - p_fee_bdt)::numeric, 2);
  v_realized_gain_loss := round((v_net_proceeds - v_cost_basis)::numeric, 2);
  v_remaining_shares := round((v_holding_shares - p_shares)::numeric, 2);

  select buying_power_available
  into v_available
  from public.profiles
  where id = v_user_id
  for update;

  if not found then
    raise exception 'profile_not_found';
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
    'sell',
    v_gross_proceeds,
    p_fee_bdt,
    p_shares,
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
    mock_order_id,
    realized_gain_loss
  )
  values (
    v_user_id,
    'sell',
    p_stock_id,
    p_ticker,
    p_shares,
    v_net_proceeds,
    'completed',
    'Mock sell order',
    v_order_id,
    v_realized_gain_loss
  );

  if v_remaining_shares <= 0 then
    delete from public.holdings
    where user_id = v_user_id
      and stock_id = p_stock_id;
  else
    update public.holdings
    set
      shares = v_remaining_shares,
      updated_at = now()
    where user_id = v_user_id
      and stock_id = p_stock_id;
  end if;

  update public.profiles
  set
    buying_power_available = v_available + v_net_proceeds,
    updated_at = now()
  where id = v_user_id;

  insert into public.audit_logs (user_id, action, target_id, metadata)
  values (
    v_user_id,
    'MOCK_ORDER_SUBMITTED',
    v_order_id::text,
    jsonb_build_object(
      'side', 'sell',
      'shares', p_shares,
      'executionPrice', p_execution_price,
      'grossProceeds', v_gross_proceeds,
      'netProceeds', v_net_proceeds,
      'costBasis', v_cost_basis,
      'realizedGainLoss', v_realized_gain_loss,
      'mock', true,
      'atomic', true
    )
  );

  return jsonb_build_object(
    'orderId', v_order_id,
    'buyingPowerAfter', v_available + v_net_proceeds,
    'filledShares', p_shares,
    'executionPrice', p_execution_price,
    'grossProceeds', v_gross_proceeds,
    'feeBdt', p_fee_bdt,
    'netProceeds', v_net_proceeds,
    'costBasis', v_cost_basis,
    'realizedGainLoss', v_realized_gain_loss
  );
end;
$$;

revoke all on function public.submit_mock_sell(text, text, text, numeric, numeric, numeric) from public;

grant execute on function public.submit_mock_sell(text, text, text, numeric, numeric, numeric) to authenticated;
