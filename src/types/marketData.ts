export type MarketDataMode = 'mock' | 'experimental_dse' | 'licensed'

export type MarketDataBadgeLabel =
  | 'Prototype Data'
  | 'Experimental Feed'
  | 'Experimental DSE Feed'
  | 'Licensed Feed'
  | 'Delayed Data'
  | 'Data Unavailable'

export interface MarketQuote {
  stockId: string
  ticker: string
  name: string
  lastPrice: number
  change: number
  changePercent: number
  volume: number
  tradeTime: string
  source: string
  sourceLabel: string
  isLive: boolean
  isDelayed: boolean
  isMock: boolean
  disclaimer: string
}

/** @deprecated Use MarketQuote — kept for internal chart/history helpers */
export interface StockQuote {
  stockId: string
  ticker: string
  price: number
  change: number
  changePct: number
  source: string
  asOf: string
  isMock: boolean
}

export interface MarketDataStatus {
  mode: MarketDataMode
  badge: MarketDataBadgeLabel
  sourceLabel: string
  disclaimer: string
  isMock: boolean
  isLive: boolean
  isDelayed: boolean
  configurationError: string | null
  lastRefreshAt: string | null
  fellBackToMock: boolean
  fellBackToCache?: boolean
  sourceUnavailable?: boolean
  quoteCount: number
}

export const MARKET_DATA_DISCLAIMER =
  'Market data shown for prototype demonstration unless connected to a licensed provider.' as const

export const EXPERIMENTAL_DSE_DISCLAIMER =
  'Experimental DSE data for paper trading only. Verify licensing before production use.' as const
