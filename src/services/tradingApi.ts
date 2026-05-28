/**
 * Mock trading API — order preview and mock submission only.
 * NOT live trading. Replace with licensed brokerage integration when ready.
 */

import { getDSEMarketInfo } from '../data/dseMarket'
import { getStock } from '../data/stocks'
import { appendAuditLog } from './auditApi'
import type {
  OrderPreviewRequest,
  OrderPreviewResponse,
  SubmitOrderRequest,
  SubmitOrderResponse,
} from '../api-contracts/trading.contract'

const MOCK_DELAY_MS = 100
const FEE_RATE = 0.0015
const MOCK_USER_ID = 'usr_mahathir_001'

export type OrderFailureReason =
  | 'insufficient_buying_power'
  | 'market_closed'
  | 'preview_failed'
  | 'confirmation_timeout'
  | 'order_rejected'

export interface MockOrderRecord {
  orderId: string
  stockId: string
  symbol: string
  amountBdt: number
  status: 'accepted' | 'rejected' | 'pending'
  createdAt: string
}

let orderHistory: MockOrderRecord[] = []
let simulatePreviewFailure = false
let simulateOrderRejection = false
let simulateConfirmationTimeout = false

function delay<T>(value: T, ms = MOCK_DELAY_MS): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms))
}

export async function previewOrder(
  orderInput: OrderPreviewRequest,
  buyingPowerAvailable: number,
): Promise<{ ok: true; preview: OrderPreviewResponse } | { ok: false; reason: OrderFailureReason }> {
  if (simulatePreviewFailure) {
    return delay({ ok: false, reason: 'preview_failed' })
  }

  const stock = getStock(orderInput.stockId)
  if (!stock) return delay({ ok: false, reason: 'preview_failed' })

  const market = getDSEMarketInfo()
  if (market.status !== 'Open') {
    return delay({ ok: false, reason: 'market_closed' })
  }

  if (orderInput.amountBdt > buyingPowerAvailable) {
    return delay({ ok: false, reason: 'insufficient_buying_power' })
  }

  const feeBdt = Math.round(orderInput.amountBdt * FEE_RATE * 100) / 100
  const net = orderInput.amountBdt - feeBdt
  const estimatedShares = Math.floor((net / stock.price) * 100) / 100

  const preview: OrderPreviewResponse = {
    stockId: orderInput.stockId,
    symbol: stock.ticker,
    amountBdt: orderInput.amountBdt,
    estimatedShares,
    pricePerShare: stock.price,
    feeBdt,
    totalBdt: orderInput.amountBdt,
    marketOpen: true,
    warnings: [
      'Mock trading only — no real order routing.',
      'Market data shown for demonstration only.',
    ],
  }

  await appendAuditLog({
    action: 'ORDER_PREVIEWED',
    actorId: MOCK_USER_ID,
    targetId: orderInput.stockId,
    metadata: { amountBdt: orderInput.amountBdt },
  })

  return delay({ ok: true, preview })
}

export async function submitMockOrder(
  orderInput: SubmitOrderRequest,
): Promise<{ ok: true; order: SubmitOrderResponse } | { ok: false; reason: OrderFailureReason }> {
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

  const orderId = `ord_mock_${Date.now()}`
  const response: SubmitOrderResponse = {
    orderId,
    status: 'accepted',
    message: 'Mock order accepted. No real securities were purchased.',
    filledShares: Math.floor(((orderInput.amountBdt * (1 - FEE_RATE)) / stock.price) * 100) / 100,
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
    actorId: MOCK_USER_ID,
    targetId: orderId,
    metadata: { amountBdt: orderInput.amountBdt, mock: true },
  })

  return delay({ ok: true, order: response })
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
