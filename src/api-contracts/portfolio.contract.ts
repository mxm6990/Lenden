/**
 * Future portfolio API contracts — not live.
 */

import type { ApiResponse } from './common.contract'
import type { BuyingPower } from '../data/portfolio'
import type { PastTransaction } from '../data/transactions'
import type { AllocationSegment } from '../data/allocation'

export interface PortfolioSummaryPayload {
  totalInvested: number
  totalValue: number
  totalGain: number
  totalGainPct: number
  asOf: string
}

export type PortfolioSummaryResponse = ApiResponse<PortfolioSummaryPayload>
export type BuyingPowerResponse = ApiResponse<BuyingPower>
export type PastTransactionsResponse = ApiResponse<PastTransaction[]>
export type AllocationBreakdownResponse = ApiResponse<AllocationSegment[]>
