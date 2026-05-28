/**
 * Future trading API contracts — not live.
 * Mock trading only in prototype — no live order routing.
 */

import type { ApiResponse } from './common.contract'

export interface OrderPreviewRequest {
  stockId: string
  side: 'buy' | 'sell'
  amountBdt: number
}

export interface OrderPreviewResponse {
  stockId: string
  symbol: string
  amountBdt: number
  estimatedShares: number
  pricePerShare: number
  feeBdt: number
  totalBdt: number
  marketOpen: boolean
  warnings: string[]
}

export interface SubmitOrderRequest {
  previewId: string
  stockId: string
  side: 'buy' | 'sell'
  amountBdt: number
  transactionPin?: string
}

export interface SubmitOrderResponse {
  orderId: string
  status: 'accepted' | 'rejected' | 'pending'
  message: string
  filledShares?: number
}

export type OrderPreviewApiResponse = ApiResponse<OrderPreviewResponse>
export type SubmitOrderApiResponse = ApiResponse<SubmitOrderResponse>
