import { getCachedMarketQuote, refreshMarketQuotes } from '../services/marketDataProvider'
import { normalizeSecurityKey } from './securityListing'

export interface TradeQuoteDisplay {
  lastPrice: number
  change: number
  changePct: number
  sourceLabel: string
  asOf: string | null
  isMock: boolean
}

export async function getTradeQuoteDisplay(stockId: string): Promise<TradeQuoteDisplay> {
  await refreshMarketQuotes()
  const normalized = normalizeSecurityKey(stockId)
  const quote = getCachedMarketQuote(normalized) ?? getCachedMarketQuote(stockId)

  return {
    lastPrice: quote?.lastPrice ?? 0,
    change: quote?.change ?? 0,
    changePct: quote?.changePercent ?? 0,
    sourceLabel: quote?.sourceLabel ?? 'Prototype Data',
    asOf: quote?.tradeTime ?? null,
    isMock: quote?.isMock ?? true,
  }
}
