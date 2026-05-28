/**
 * Future market data API contracts — not live.
 */

import type { ApiResponse } from './common.contract'

export interface DseSummaryPayload {
  indexName: string
  value: number
  change: number
  changePct: number
  status: 'Open' | 'Pre-open' | 'Closed'
  asOf: string
  delayed: boolean
}

export interface StockListItem {
  symbol: string
  stockId: string
  name: string
  sector: string
  price: number
  change: number
  changePct: number
}

export type DseSummaryResponse = ApiResponse<DseSummaryPayload>
export type StockListResponse = ApiResponse<StockListItem[]>
