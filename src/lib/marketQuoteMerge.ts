import type { MarketQuote } from '../types/marketData'
import { normalizeSecurityKey } from './securityListing'

export function coerceFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/,/g, '').trim())
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

export function normalizeQuoteTickerKey(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  return normalizeSecurityKey(value.trim())
}

export function coerceMarketQuote(quote: MarketQuote): MarketQuote | null {
  const ticker = normalizeQuoteTickerKey(quote.ticker || quote.stockId)
  if (!ticker) return null

  const lastPrice = coerceFiniteNumber(quote.lastPrice)
  if (lastPrice === null) return null

  return {
    ...quote,
    stockId: normalizeQuoteTickerKey(quote.stockId) ?? ticker,
    ticker,
    lastPrice,
    change: coerceFiniteNumber(quote.change) ?? 0,
    changePercent: coerceFiniteNumber(quote.changePercent) ?? 0,
    volume: coerceFiniteNumber(quote.volume) ?? 0,
  }
}

export function buildQuotesByTickerMap(quotes: MarketQuote[]): Map<string, MarketQuote> {
  const map = new Map<string, MarketQuote>()

  for (const rawQuote of quotes) {
    const quote = coerceMarketQuote(rawQuote)
    if (!quote) continue

    const tickerKey = quote.ticker.toUpperCase()
    const stockIdKey = quote.stockId.toUpperCase()
    const normalizedKey = normalizeSecurityKey(quote.ticker)

    map.set(tickerKey, quote)
    map.set(stockIdKey, quote)
    map.set(normalizedKey, quote)
  }

  return map
}

export function findQuoteForTicker(
  ticker: string,
  quotesByTicker: Map<string, MarketQuote>,
): MarketQuote | undefined {
  const key = normalizeQuoteTickerKey(ticker)
  if (!key) return undefined
  return quotesByTicker.get(key) ?? quotesByTicker.get(key.toUpperCase())
}
