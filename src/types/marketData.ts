export type MarketDataMode = 'mock' | 'experimental_dse' | 'disabled'

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
