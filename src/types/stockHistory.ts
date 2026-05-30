export type StockHistoryRange = '1D' | '1W' | '1M' | '6M' | '1Y'

export type StockHistorySourceLabel = 'Historical data' | 'Session estimate' | 'Prototype history'

export interface StockHistoryPoint {
  ticker: string
  timestamp: string
  price: number
  volume?: number
  source: string
  isMock: boolean
}

export interface StockHistorySummary {
  ticker: string
  range: StockHistoryRange
  points: StockHistoryPoint[]
  startPrice: number
  endPrice: number
  high: number
  low: number
  lastUpdated: string
  /** @deprecated Use sourceLabel */
  source: string
  sourceLabel: StockHistorySourceLabel
  sourceDescription: string
  isMock: boolean
}
