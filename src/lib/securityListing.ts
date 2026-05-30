import { getStock, stocks, type Stock } from '../data/stocks'
import type { MarketQuote } from '../types/marketData'
import type { Security } from '../types/security'
import { getCachedMarketQuote } from '../services/marketDataProvider'

/** Legacy slug → canonical DSE ticker */
export const LEGACY_STOCK_ID_MAP: Record<string, string> = {
  gp: 'GP',
  brac: 'BRACBANK',
  squr: 'SQURPHARMA',
  batbc: 'BATBC',
  renata: 'RENATA',
  marico: 'MARICO',
}

export function normalizeSecurityKey(key: string): string {
  const trimmed = key.trim()
  const lower = trimmed.toLowerCase()
  if (LEGACY_STOCK_ID_MAP[lower]) return LEGACY_STOCK_ID_MAP[lower]
  return trimmed.toUpperCase()
}

export function matchesStockId(left: string, right: string): boolean {
  return normalizeSecurityKey(left) === normalizeSecurityKey(right)
}

export function buildSyntheticChart(lastPrice: number, change: number): number[] {
  const start = Math.max(lastPrice - change, 0.01)
  return Array.from({ length: 10 }, (_, index) => {
    const t = index / 9
    return Math.round((start + (lastPrice - start) * t) * 100) / 100
  })
}

export function buildStockFromQuote(quote: MarketQuote): Stock {
  const fallback = stocks.find((stock) => stock.ticker.toUpperCase() === quote.ticker.toUpperCase())
  return {
    id: quote.ticker.toUpperCase(),
    ticker: quote.ticker.toUpperCase(),
    name: quote.name || quote.ticker,
    sector: fallback?.sector ?? 'DSE',
    price: quote.lastPrice,
    change: quote.change,
    changePct: quote.changePercent,
    about:
      fallback?.about ??
      `${quote.name || quote.ticker} (${quote.ticker}) is listed on the Dhaka Stock Exchange. Company profile shown for paper-trading prototype purposes.`,
    marketCap: fallback?.marketCap ?? '—',
    peRatio: fallback?.peRatio ?? '—',
    dividend: fallback?.dividend ?? '—',
    chartPoints: fallback?.chartPoints ?? buildSyntheticChart(quote.lastPrice, quote.change),
  }
}

export function buildStockFromSecurity(
  security: Security,
  quote?: MarketQuote | null,
  fallback?: Stock,
): Stock {
  const ticker = security.ticker.toUpperCase()
  const lastPrice = quote?.lastPrice ?? fallback?.price ?? 0
  const change = quote?.change ?? fallback?.change ?? 0
  const changePct = quote?.changePercent ?? fallback?.changePct ?? 0

  return {
    id: ticker,
    ticker,
    name: security.companyName,
    sector: security.sector ?? fallback?.sector ?? 'DSE',
    price: lastPrice,
    change,
    changePct,
    about:
      fallback?.about ??
      `${security.companyName} (${ticker}) is listed on the Dhaka Stock Exchange. Company profile shown for paper-trading prototype purposes.`,
    marketCap: fallback?.marketCap ?? '—',
    peRatio: fallback?.peRatio ?? '—',
    dividend: fallback?.dividend ?? '—',
    chartPoints: fallback?.chartPoints ?? buildSyntheticChart(lastPrice, change),
  }
}

export function resolveStockSync(key: string, security?: Security | null): Stock | null {
  const ticker = normalizeSecurityKey(key)
  const legacy = getStock(key) ?? stocks.find((stock) => stock.ticker.toUpperCase() === ticker)
  const quote = getCachedMarketQuote(ticker) ?? getCachedMarketQuote(key)

  if (security) {
    return buildStockFromSecurity(security, quote, legacy)
  }

  if (legacy) {
    if (!quote) return legacy
    return {
      ...legacy,
      id: ticker,
      price: quote.lastPrice,
      change: quote.change,
      changePct: quote.changePercent,
    }
  }

  if (quote) {
    return buildStockFromQuote(quote)
  }

  return null
}

export function canonicalStockId(stock: Stock): string {
  return normalizeSecurityKey(stock.ticker)
}
