/**
 * Mock trading API — order preview and mock submission only.
 * Authenticated buys use atomic Supabase RPC submit_mock_buy.
 * NOT live trading. Replace with licensed brokerage integration when ready.
 */

import { getDSEMarketInfo } from '../data/dseMarket'
import { getStock } from '../data/stocks'
import { calculateBuyingPowerAfterOrder } from '../lib/portfolioCalculations'
import { isDemoModeActive } from '../lib/demoMode'
import { getAuthenticatedUserId } from '../lib/supabaseAuth'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import type { SubmitMockBuyRpcResult, SubmitMockSellRpcResult } from '../types/supabase'
import type { MockOrderReceipt } from '../types/trading'
import { appendAuditLog } from './auditApi'
import { getHoldings, getBuyingPowerResult } from './portfolioApi'
import type {
  OrderPreviewRequest,
  OrderPreviewResponse,
  SubmitOrderRequest,
  SubmitOrderResponse,
} from '../api-contracts/trading.contract'

const MOCK_DELAY_MS = 100
export const FEE_RATE = 0.0015
const DEMO_USER_ID = 'usr_demo_001'

export type OrderFailureReason =
  | 'insufficient_buying_power'
  | 'insufficient_shares'
  | 'market_closed'
  | 'preview_failed'
  | 'confirmation_timeout'
  | 'order_rejected'
  | 'auth_required'
  | 'persist_failed'

export interface MockOrderRecord {
  orderId: string
  stockId: string
  symbol: string
  amountBdt: number
  status: 'accepted' | 'rejected' | 'pending'
  createdAt: string
}

export type SubmitMockOrderResult =
  | { ok: true; order: SubmitOrderResponse; receipt: MockOrderReceipt }
  | { ok: false; reason: OrderFailureReason; errorMessage?: string }

let orderHistory: MockOrderRecord[] = []
let simulatePreviewFailure = false
let simulateOrderRejection = false
let simulateConfirmationTimeout = false

function delay<T>(value: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

function formatSupabaseError(error: unknown): string {
  if (error && typeof error === 'object') {
    const record = error as { message?: string; details?: string; hint?: string; code?: string }
    return [record.message, record.details, record.hint, record.code].filter(Boolean).join(' · ')
  }
  return error instanceof Error ? error.message : 'Unknown Supabase error'
}

function mapRpcError(message: string): OrderFailureReason {
  const lower = message.toLowerCase()
  if (lower.includes('insufficient_buying_power')) return 'insufficient_buying_power'
  if (lower.includes('insufficient_shares')) return 'insufficient_shares'
  if (lower.includes('holding_not_found')) return 'insufficient_shares'
  if (lower.includes('not_authenticated')) return 'auth_required'
  if (lower.includes('profile_not_found')) return 'persist_failed'
  if (
    lower.includes('invalid_filled_shares') ||
    lower.includes('invalid_execution_price') ||
    lower.includes('invalid_shares')
  ) {
    return 'order_rejected'
  }
  return 'persist_failed'
}

async function resolveActorId(): Promise<string> {
  const userId = await getAuthenticatedUserId()
  return userId ?? DEMO_USER_ID
}

export function computeOrderFee(amountBdt: number): number {
  return Math.round(amountBdt * FEE_RATE * 100) / 100
}

export function computeFilledShares(amountBdt: number, price: number): number {
  const feeBdt = computeOrderFee(amountBdt)
  const net = amountBdt - feeBdt
  return Math.floor((net / price) * 100) / 100
}

export function computeExecutionPrice(amountBdt: number, filledShares: number): number {
  if (filledShares <= 0) return 0
  const feeBdt = computeOrderFee(amountBdt)
  return Math.round(((amountBdt - feeBdt) / filledShares) * 100) / 100
}

export function computeSellProceeds(shares: number, price: number) {
  const grossProceeds = Math.round(shares * price * 100) / 100
  const feeBdt = computeOrderFee(grossProceeds)
  const netProceeds = Math.round((grossProceeds - feeBdt) * 100) / 100
  return { grossProceeds, feeBdt, netProceeds }
}

export function computeSellRealizedGainLoss(shares: number, avgCost: number, price: number) {
  const { netProceeds } = computeSellProceeds(shares, price)
  const costBasis = Math.round(shares * avgCost * 100) / 100
  return Math.round((netProceeds - costBasis) * 100) / 100
}

export interface SellPreviewResponse {
  stockId: string
  symbol: string
  sharesToSell: number
  sharesOwned: number
  pricePerShare: number
  grossProceeds: number
  feeBdt: number
  netProceeds: number
  costBasis: number
  realizedGainLoss: number
  marketOpen: boolean
  warnings: string[]
}

export type PreviewSellOrderResult =
  | { ok: true; preview: SellPreviewResponse; buyingPowerAfter: number }
  | { ok: false; reason: OrderFailureReason; errorMessage?: string }

export type SubmitMockSellResult =
  | { ok: true; order: SubmitOrderResponse; receipt: MockOrderReceipt }
  | { ok: false; reason: OrderFailureReason; errorMessage?: string }

async function fetchBuyingPowerAvailable(userId: string): Promise<number> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase client unavailable')

  const { data, error } = await supabase
    .from('profiles')
    .select('buying_power_available')
    .eq('id', userId)
    .maybeSingle()

  if (error) throw error
  return Number(data?.buying_power_available ?? 0)
}

function buildReceipt(params: {
  orderId: string
  stock: NonNullable<ReturnType<typeof getStock>>
  orderInput: SubmitOrderRequest
  feeBdt: number
  filledShares: number
  executionPrice: number
  buyingPowerBefore: number
  buyingPowerAfter: number
  timestamp: string
}): MockOrderReceipt {
  return {
    orderId: params.orderId,
    ticker: params.stock.ticker,
    side: params.orderInput.side,
    amountInvested: params.orderInput.amountBdt,
    estimatedShares: params.filledShares,
    priceUsed: params.executionPrice,
    fees: params.feeBdt,
    totalRequired: params.orderInput.amountBdt,
    buyingPowerBefore: params.buyingPowerBefore,
    buyingPowerAfter: params.buyingPowerAfter,
    timestamp: params.timestamp,
    status: 'Mock Filled',
  }
}

async function submitMockBuyViaRpc(
  userId: string,
  orderInput: SubmitOrderRequest,
  stock: NonNullable<ReturnType<typeof getStock>>,
): Promise<{ order: SubmitOrderResponse; receipt: MockOrderReceipt }> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase client unavailable')

  const feeBdt = computeOrderFee(orderInput.amountBdt)
  const filledShares = computeFilledShares(orderInput.amountBdt, stock.price)
  const executionPrice = computeExecutionPrice(orderInput.amountBdt, filledShares)

  if (filledShares <= 0) {
    throw new Error('invalid_filled_shares')
  }

  const buyingPowerBefore = await fetchBuyingPowerAvailable(userId)

  console.group('Lenden mock order debug')
  console.log('authenticated:', true)
  console.log('user.id:', userId)
  console.log('order input:', orderInput)
  console.log('buying power before:', buyingPowerBefore)
  console.log('order total:', orderInput.amountBdt)
  console.log('filled shares:', filledShares)
  console.log('execution price:', executionPrice)
  console.log('path: submit_mock_buy RPC')

  const { data, error } = await supabase.rpc('submit_mock_buy', {
    p_stock_id: orderInput.stockId,
    p_symbol: stock.ticker,
    p_side: orderInput.side,
    p_amount_bdt: orderInput.amountBdt,
    p_fee_bdt: feeBdt,
    p_filled_shares: filledShares,
    p_execution_price: executionPrice,
    p_ticker: stock.ticker,
  })

  if (error) {
    console.error('RPC submit_mock_buy failed:', formatSupabaseError(error))
    console.groupEnd()
    throw error
  }

  const result = data as SubmitMockBuyRpcResult
  console.log('RPC result:', result)
  console.groupEnd()

  const receipt = buildReceipt({
    orderId: result.orderId,
    stock,
    orderInput,
    feeBdt,
    filledShares: Number(result.filledShares),
    executionPrice: Number(result.executionPrice),
    buyingPowerBefore,
    buyingPowerAfter: Number(result.buyingPowerAfter),
    timestamp: new Date().toISOString(),
  })

  return {
    order: {
      orderId: result.orderId,
      status: 'accepted',
      message: 'Mock order accepted. No real securities were purchased.',
      filledShares: Number(result.filledShares),
    },
    receipt,
  }
}

async function submitDemoMockOrder(
  orderInput: SubmitOrderRequest,
  stock: NonNullable<ReturnType<typeof getStock>>,
): Promise<{ order: SubmitOrderResponse; receipt: MockOrderReceipt }> {
  const feeBdt = computeOrderFee(orderInput.amountBdt)
  const filledShares = computeFilledShares(orderInput.amountBdt, stock.price)
  const executionPrice = computeExecutionPrice(orderInput.amountBdt, filledShares)
  const orderId = `ord_mock_${Date.now()}`
  const buyingPowerBefore = 8450
  const totalRequired = orderInput.amountBdt

  if (filledShares <= 0) {
    throw new Error('invalid_filled_shares')
  }

  if (totalRequired > buyingPowerBefore) {
    throw new Error('insufficient_buying_power')
  }

  orderHistory = [
    {
      orderId,
      stockId: orderInput.stockId,
      symbol: stock.ticker,
      amountBdt: orderInput.amountBdt,
      status: 'accepted',
      createdAt: new Date().toISOString(),
    },
    ...orderHistory,
  ]

  await appendAuditLog({
    action: 'MOCK_ORDER_SUBMITTED',
    actorId: DEMO_USER_ID,
    targetId: orderId,
    metadata: { amountBdt: orderInput.amountBdt, mock: true, demo: true },
  })

  const receipt = buildReceipt({
    orderId,
    stock,
    orderInput,
    feeBdt,
    filledShares,
    executionPrice,
    buyingPowerBefore,
    buyingPowerAfter: calculateBuyingPowerAfterOrder(buyingPowerBefore, totalRequired),
    timestamp: new Date().toISOString(),
  })

  return {
    order: {
      orderId,
      status: 'accepted',
      message: 'Mock order accepted. No real securities were purchased.',
      filledShares,
    },
    receipt,
  }
}

function buildSellReceipt(params: {
  orderId: string
  stock: NonNullable<ReturnType<typeof getStock>>
  shares: number
  executionPrice: number
  grossProceeds: number
  feeBdt: number
  netProceeds: number
  costBasis: number
  realizedGainLoss: number
  buyingPowerBefore: number
  buyingPowerAfter: number
  timestamp: string
}): MockOrderReceipt {
  return {
    orderId: params.orderId,
    ticker: params.stock.ticker,
    side: 'sell',
    amountInvested: params.netProceeds,
    estimatedShares: params.shares,
    priceUsed: params.executionPrice,
    fees: params.feeBdt,
    totalRequired: params.netProceeds,
    buyingPowerBefore: params.buyingPowerBefore,
    buyingPowerAfter: params.buyingPowerAfter,
    timestamp: params.timestamp,
    status: 'Mock Filled',
    grossProceeds: params.grossProceeds,
    netProceeds: params.netProceeds,
    costBasis: params.costBasis,
    realizedGainLoss: params.realizedGainLoss,
  }
}

async function submitMockSellViaRpc(
  userId: string,
  stockId: string,
  shares: number,
  stock: NonNullable<ReturnType<typeof getStock>>,
): Promise<{ order: SubmitOrderResponse; receipt: MockOrderReceipt }> {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase client unavailable')

  const executionPrice = stock.price
  const feeBdt = computeOrderFee(Math.round(shares * executionPrice * 100) / 100)
  const buyingPowerBefore = await fetchBuyingPowerAvailable(userId)

  if (shares <= 0) throw new Error('invalid_shares')

  console.group('Lenden mock sell debug')
  console.log('authenticated:', true)
  console.log('user.id:', userId)
  console.log('stockId:', stockId)
  console.log('shares:', shares)
  console.log('execution price:', executionPrice)
  console.log('path: submit_mock_sell RPC')

  const { data, error } = await supabase.rpc('submit_mock_sell', {
    p_stock_id: stockId,
    p_symbol: stock.ticker,
    p_ticker: stock.ticker,
    p_shares: shares,
    p_execution_price: executionPrice,
    p_fee_bdt: feeBdt,
  })

  if (error) {
    console.error('RPC submit_mock_sell failed:', formatSupabaseError(error))
    console.groupEnd()
    throw error
  }

  const result = data as SubmitMockSellRpcResult
  console.log('RPC result:', result)
  console.groupEnd()

  const receipt = buildSellReceipt({
    orderId: result.orderId,
    stock,
    shares: Number(result.filledShares),
    executionPrice: Number(result.executionPrice),
    grossProceeds: Number(result.grossProceeds),
    feeBdt: Number(result.feeBdt),
    netProceeds: Number(result.netProceeds),
    costBasis: Number(result.costBasis),
    realizedGainLoss: Number(result.realizedGainLoss),
    buyingPowerBefore,
    buyingPowerAfter: Number(result.buyingPowerAfter),
    timestamp: new Date().toISOString(),
  })

  return {
    order: {
      orderId: result.orderId,
      status: 'accepted',
      message: 'Mock sell accepted. No real securities were sold.',
      filledShares: Number(result.filledShares),
    },
    receipt,
  }
}

async function submitDemoMockSell(
  stockId: string,
  shares: number,
  stock: NonNullable<ReturnType<typeof getStock>>,
  avgCost: number,
): Promise<{ order: SubmitOrderResponse; receipt: MockOrderReceipt }> {
  const executionPrice = stock.price
  const { grossProceeds, feeBdt, netProceeds } = computeSellProceeds(shares, executionPrice)
  const costBasis = Math.round(shares * avgCost * 100) / 100
  const realizedGainLoss = Math.round((netProceeds - costBasis) * 100) / 100
  const orderId = `ord_mock_sell_${Date.now()}`
  const buyingPowerBefore = 8450

  orderHistory = [
    {
      orderId,
      stockId,
      symbol: stock.ticker,
      amountBdt: grossProceeds,
      status: 'accepted',
      createdAt: new Date().toISOString(),
    },
    ...orderHistory,
  ]

  await appendAuditLog({
    action: 'MOCK_ORDER_SUBMITTED',
    actorId: DEMO_USER_ID,
    targetId: orderId,
    metadata: { side: 'sell', shares, realizedGainLoss, mock: true, demo: true },
  })

  const receipt = buildSellReceipt({
    orderId,
    stock,
    shares,
    executionPrice,
    grossProceeds,
    feeBdt,
    netProceeds,
    costBasis,
    realizedGainLoss,
    buyingPowerBefore,
    buyingPowerAfter: buyingPowerBefore + netProceeds,
    timestamp: new Date().toISOString(),
  })

  return {
    order: {
      orderId,
      status: 'accepted',
      message: 'Mock sell accepted. No real securities were sold.',
      filledShares: shares,
    },
    receipt,
  }
}

export async function previewSellOrder(
  stockId: string,
  sharesToSell: number,
): Promise<PreviewSellOrderResult> {
  if (simulatePreviewFailure) {
    return delay({ ok: false, reason: 'preview_failed' })
  }

  const stock = getStock(stockId)
  if (!stock) return delay({ ok: false, reason: 'preview_failed' })

  const market = getDSEMarketInfo()
  if (market.status !== 'Open') {
    return delay({ ok: false, reason: 'market_closed' })
  }

  if (sharesToSell <= 0) {
    return delay({
      ok: false,
      reason: 'preview_failed',
      errorMessage: 'Enter a valid number of shares to sell.',
    })
  }

  const holdingsResult = await getHoldings()
  if (holdingsResult.error) {
    return delay({
      ok: false,
      reason: 'preview_failed',
      errorMessage: holdingsResult.error,
    })
  }

  const holding = holdingsResult.data.find((h) => h.stockId === stockId)
  if (!holding) {
    return delay({
      ok: false,
      reason: 'insufficient_shares',
      errorMessage: 'You do not hold this stock.',
    })
  }

  if (sharesToSell > holding.shares) {
    return delay({
      ok: false,
      reason: 'insufficient_shares',
      errorMessage: `You only own ${holding.shares} shares.`,
    })
  }

  const executionPrice = stock.price
  const { grossProceeds, feeBdt, netProceeds } = computeSellProceeds(sharesToSell, executionPrice)
  const costBasis = Math.round(sharesToSell * holding.avgCost * 100) / 100
  const realizedGainLoss = Math.round((netProceeds - costBasis) * 100) / 100

  const buyingPowerResult = await getBuyingPowerResult()
  const buyingPowerBefore = buyingPowerResult.error ? 0 : buyingPowerResult.data.available

  const preview: SellPreviewResponse = {
    stockId,
    symbol: stock.ticker,
    sharesToSell,
    sharesOwned: holding.shares,
    pricePerShare: executionPrice,
    grossProceeds,
    feeBdt,
    netProceeds,
    costBasis,
    realizedGainLoss,
    marketOpen: true,
    warnings: [
      'Mock trading only — no real order is submitted.',
      'Market data shown for demonstration only.',
    ],
  }

  await appendAuditLog({
    action: 'ORDER_PREVIEWED',
    actorId: await resolveActorId(),
    targetId: stockId,
    metadata: { side: 'sell', shares: sharesToSell },
  })

  return delay({
    ok: true,
    preview,
    buyingPowerAfter: buyingPowerBefore + netProceeds,
  })
}

export async function submitMockSell(
  stockId: string,
  shares: number,
): Promise<SubmitMockSellResult> {
  if (simulateConfirmationTimeout) {
    await delay(null, 2500)
    return { ok: false, reason: 'confirmation_timeout' }
  }

  if (simulateOrderRejection) {
    return delay({ ok: false, reason: 'order_rejected' })
  }

  const stock = getStock(stockId)
  if (!stock) return delay({ ok: false, reason: 'order_rejected' })

  const market = getDSEMarketInfo()
  if (market.status !== 'Open') {
    return delay({ ok: false, reason: 'market_closed' })
  }

  if (shares <= 0) {
    return delay({
      ok: false,
      reason: 'order_rejected',
      errorMessage: 'Enter a valid number of shares to sell.',
    })
  }

  const holdingsResult = await getHoldings()
  if (holdingsResult.error) {
    return delay({ ok: false, reason: 'persist_failed', errorMessage: holdingsResult.error })
  }

  const holding = holdingsResult.data.find((h) => h.stockId === stockId)
  if (!holding || shares > holding.shares) {
    return delay({
      ok: false,
      reason: 'insufficient_shares',
      errorMessage: holding
        ? `You only own ${holding.shares} shares.`
        : 'You do not hold this stock.',
    })
  }

  const supabase = getSupabaseClient()
  const authUser = supabase ? (await supabase.auth.getUser()).data.user : null

  if (isDemoModeActive()) {
    try {
      const result = await submitDemoMockSell(stockId, shares, stock, holding.avgCost)
      return delay({ ok: true, ...result })
    } catch {
      return delay({ ok: false, reason: 'order_rejected' })
    }
  }

  if (!authUser) {
    return delay({
      ok: false,
      reason: 'auth_required',
      errorMessage: 'Sign in required to place persistent mock orders.',
    })
  }

  if (!isSupabaseConfigured() || !supabase) {
    return delay({
      ok: false,
      reason: 'persist_failed',
      errorMessage: 'Supabase is not configured.',
    })
  }

  try {
    const result = await submitMockSellViaRpc(authUser.id, stockId, shares, stock)
    orderHistory = [
      {
        orderId: result.order.orderId,
        stockId,
        symbol: stock.ticker,
        amountBdt: result.receipt.grossProceeds ?? 0,
        status: 'accepted',
        createdAt: result.receipt.timestamp,
      },
      ...orderHistory,
    ]
    return delay({ ok: true, ...result })
  } catch (err) {
    const message = formatSupabaseError(err)
    const reason = mapRpcError(message)

    if (reason === 'insufficient_shares') {
      return delay({
        ok: false,
        reason,
        errorMessage: 'You do not own enough shares for this mock sell.',
      })
    }

    return delay({ ok: false, reason, errorMessage: message })
  }
}

export async function previewOrder(
  orderInput: OrderPreviewRequest,
  buyingPowerAvailable: number,
): Promise<
  | { ok: true; preview: OrderPreviewResponse; buyingPowerAfter: number }
  | { ok: false; reason: OrderFailureReason; errorMessage?: string }
> {
  if (simulatePreviewFailure) {
    return delay({ ok: false, reason: 'preview_failed' })
  }

  const stock = getStock(orderInput.stockId)
  if (!stock) return delay({ ok: false, reason: 'preview_failed' })

  const market = getDSEMarketInfo()
  if (market.status !== 'Open') {
    return delay({ ok: false, reason: 'market_closed' })
  }

  if (orderInput.amountBdt <= 0) {
    return delay({
      ok: false,
      reason: 'preview_failed',
      errorMessage: 'Enter an amount to invest.',
    })
  }

  if (orderInput.amountBdt > buyingPowerAvailable) {
    return delay({
      ok: false,
      reason: 'insufficient_buying_power',
      errorMessage: 'This order exceeds your buying power.',
    })
  }

  const feeBdt = computeOrderFee(orderInput.amountBdt)
  const estimatedShares = computeFilledShares(orderInput.amountBdt, stock.price)
  const executionPrice = computeExecutionPrice(orderInput.amountBdt, estimatedShares)

  if (estimatedShares <= 0) {
    return delay({
      ok: false,
      reason: 'preview_failed',
      errorMessage: 'Amount is too small to buy at least one share.',
    })
  }

  const buyingPowerAfter = calculateBuyingPowerAfterOrder(buyingPowerAvailable, orderInput.amountBdt)

  const preview: OrderPreviewResponse = {
    stockId: orderInput.stockId,
    symbol: stock.ticker,
    amountBdt: orderInput.amountBdt,
    estimatedShares,
    pricePerShare: executionPrice,
    feeBdt,
    totalBdt: orderInput.amountBdt,
    marketOpen: true,
    warnings: [
      'Mock trading only — no real order is submitted.',
      'Market data shown for demonstration only.',
    ],
  }

  await appendAuditLog({
    action: 'ORDER_PREVIEWED',
    actorId: await resolveActorId(),
    targetId: orderInput.stockId,
    metadata: { amountBdt: orderInput.amountBdt },
  })

  return delay({ ok: true, preview, buyingPowerAfter })
}

export async function submitMockOrder(
  orderInput: SubmitOrderRequest,
): Promise<SubmitMockOrderResult> {
  if (simulateConfirmationTimeout) {
    await delay(null, 2500)
    return { ok: false, reason: 'confirmation_timeout' }
  }

  if (simulateOrderRejection) {
    return delay({ ok: false, reason: 'order_rejected' })
  }

  const stock = getStock(orderInput.stockId)
  if (!stock) return delay({ ok: false, reason: 'order_rejected' })

  const market = getDSEMarketInfo()
  if (market.status !== 'Open') {
    return delay({ ok: false, reason: 'market_closed' })
  }

  const supabase = getSupabaseClient()
  const authUser = supabase ? (await supabase.auth.getUser()).data.user : null

  if (isDemoModeActive()) {
    try {
      const result = await submitDemoMockOrder(orderInput, stock)
      return delay({ ok: true, ...result })
    } catch (err) {
      if (err instanceof Error && err.message === 'insufficient_buying_power') {
        return delay({
          ok: false,
          reason: 'insufficient_buying_power',
          errorMessage: 'This order exceeds your buying power.',
        })
      }
      if (err instanceof Error && err.message === 'invalid_filled_shares') {
        return delay({
          ok: false,
          reason: 'order_rejected',
          errorMessage: 'Order amount too small for at least one share.',
        })
      }
      throw err
    }
  }

  if (!authUser) {
    return delay({
      ok: false,
      reason: 'auth_required',
      errorMessage: 'Sign in required to place mock orders with persistence.',
    })
  }

  if (!isSupabaseConfigured() || !supabase) {
    return delay({
      ok: false,
      reason: 'persist_failed',
      errorMessage: 'Supabase is not configured.',
    })
  }

  try {
    const result = await submitMockBuyViaRpc(authUser.id, orderInput, stock)
    orderHistory = [
      {
        orderId: result.order.orderId,
        stockId: orderInput.stockId,
        symbol: stock.ticker,
        amountBdt: orderInput.amountBdt,
        status: 'accepted',
        createdAt: result.receipt.timestamp,
      },
      ...orderHistory,
    ]
    return delay({ ok: true, ...result })
  } catch (err) {
    const message = formatSupabaseError(err)
    const reason = mapRpcError(message)

    if (reason === 'insufficient_buying_power') {
      await appendAuditLog({
        action: 'ORDER_REJECTED',
        actorId: authUser.id,
        targetId: orderInput.stockId,
        metadata: { amountBdt: orderInput.amountBdt, reason: 'insufficient_buying_power' },
      })
      return delay({
        ok: false,
        reason,
        errorMessage: 'This order exceeds your buying power.',
      })
    }

    return delay({
      ok: false,
      reason,
      errorMessage: message,
    })
  }
}

export async function getOrderStatus(orderId: string): Promise<MockOrderRecord | null> {
  return delay(orderHistory.find((o) => o.orderId === orderId) ?? null)
}

export async function getOrderHistory(): Promise<MockOrderRecord[]> {
  return delay([...orderHistory])
}

export function __setPreviewFailure(enabled: boolean) {
  simulatePreviewFailure = enabled
}

export function __setOrderRejection(enabled: boolean) {
  simulateOrderRejection = enabled
}

export function __setConfirmationTimeout(enabled: boolean) {
  simulateConfirmationTimeout = enabled
}
