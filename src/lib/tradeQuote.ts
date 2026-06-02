import { getCachedMarketQuote, getMarketSnapshot, refreshMarketQuotes } from '../services/marketDataProvider'
import { coerceMarketQuote } from './marketQuoteMerge'
import { normalizeSecurityKey } from './securityListing'

export interface TradeQuoteDisplay {
  lastPrice: number | null
  change: number | null
  changePct: number | null
  sourceLabel: string
  asOf: string | null
  isMock: boolean
  hasQuote: boolean
}

export async function getTradeQuoteDisplay(stockId: string): Promise<TradeQuoteDisplay> {
  await refreshMarketQuotes()
  const normalized = normalizeSecurityKey(stockId)
  const rawQuote = getCachedMarketQuote(normalized) ?? getCachedMarketQuote(stockId)
  const quote = rawQuote ? coerceMarketQuote(rawQuote) : null

  if (!quote) {
    const snapshot = await getMarketSnapshot()
    const snapshotQuote = snapshot.quotes.find(
      (entry) =>
        entry.ticker.toUpperCase() === normalized ||
        normalizeSecurityKey(entry.stockId) === normalized,
    )
    const coerced = snapshotQuote ? coerceMarketQuote(snapshotQuote) : null
    if (coerced) {
      return {
        lastPrice: coerced.lastPrice,
        change: coerced.change,
        changePct: coerced.changePercent,
        sourceLabel: coerced.sourceLabel,
        asOf: coerced.tradeTime,
        isMock: coerced.isMock,
        hasQuote: true,
      }
    }
  }

  if (!quote) {
    return {
      lastPrice: null,
      change: null,
      changePct: null,
      sourceLabel: 'Prototype Data',
      asOf: null,
      isMock: true,
      hasQuote: false,
    }
  }

  return {
    lastPrice: quote.lastPrice,
    change: quote.change,
    changePct: quote.changePercent,
    sourceLabel: quote.sourceLabel,
    asOf: quote.tradeTime,
    isMock: quote.isMock,
    hasQuote: true,
  }
}
