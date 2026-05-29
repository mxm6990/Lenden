export type StockHistoryRange = '1D' | '1W' | '1M' | '6M' | '1Y'

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
  source: string
  isMock: boolean
}
