import type { AllocationSegment } from '../data/allocation'
import type {
  BuyingPower,
  PortfolioHistoryPoint,
  PortfolioSummary,
  RealizedPnLEntry,
} from '../data/portfolio'
import type { EnrichedHolding } from '../data/stocks'

/** Result wrapper — authenticated Supabase reads surface errors instead of mock fallback. */
export interface PortfolioServiceResult<T> {
  data: T
  error: string | null
}

export interface PortfolioDayChange {
  amount: number
  pct: number
  /** Set when day change cannot be computed (e.g. insufficient prototype history). */
  sourceLabel: string | null
}

export interface CombinedPnLData {
  unrealized: { amount: number; pct: number }
  realized: number
  total: number
}

export interface RealizedPnLData {
  total: number
  entries: RealizedPnLEntry[]
}

export type PortfolioDataSource = 'supabase' | 'demo'

/** Single holdings fetch with derived portfolio metrics — use for Home, Portfolio, Allocation. */
export interface PortfolioBundle {
  source: PortfolioDataSource
  summary: PortfolioSummary
  holdings: EnrichedHolding[]
  allocation: AllocationSegment[]
  history: PortfolioHistoryPoint[]
  dayChange: PortfolioDayChange
  combinedPnL: CombinedPnLData
  realizedPnL: RealizedPnLData
  buyingPower: BuyingPower | null
  buyingPowerError: string | null
  /** portfolioValue + buyingPower.available — service-level only, not shown in UI yet. */
  accountValue: number
  error: string | null
}
