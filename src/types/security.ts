/**
 * Security catalog types — DSE securities master + quote types.
 */

export interface Security {
  id: string
  ticker: string
  companyName: string
  sector: string | null
  exchange: string
  isActive: boolean
}

export interface SecurityQuote {
  symbol: string
  stockId: string
  asOf: string
  /** Last traded price (BDT) */
  lastPrice: number
  change: number
  changePct: number
  /** Total traded value for the session (BDT) */
  value: number
  volume: number
  averageVolume: number
  open: number
  dayHigh: number
  dayLow: number
  marketCap: number
  week52High: number
  week52Low: number
  peRatio: number | null
  dividendYield: number | null
}

/** Expected API envelope from brokerage/market data provider */
export interface SecurityQuoteApiResponse {
  symbol: string
  asOf: string
  currency: 'BDT'
  quote: Omit<SecurityQuote, 'symbol' | 'stockId' | 'asOf'>
}

export type SecurityQuoteField =
  | 'value'
  | 'volume'
  | 'averageVolume'
  | 'open'
  | 'dayHigh'
  | 'dayLow'
  | 'marketCap'
  | 'week52High'
  | 'week52Low'
  | 'peRatio'
  | 'dividendYield'

export interface SecurityListing extends Security {
  lastPrice: number
  change: number
  changePct: number
  sourceLabel: string
  volume: number
}

export interface SecuritiesCatalogSnapshot {
  securities: Security[]
  source: 'supabase' | 'quotes' | 'fallback'
  loadedAt: string
}
