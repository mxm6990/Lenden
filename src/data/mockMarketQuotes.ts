import { stocks } from './stocks'
import { MARKET_DATA_DISCLAIMER, type MarketQuote } from '../types/marketData'

const MOCK_VOLUMES: Record<string, number> = {
  gp: 2_840_000,
  brac: 4_520_000,
  squr: 890_000,
  batbc: 520_000,
  renata: 198_000,
  marico: 310_000,
}

export function buildMockMarketQuotes(): MarketQuote[] {
  const tradeTime = new Date().toISOString()

  return stocks.map((stock) => ({
    stockId: stock.id,
    ticker: stock.ticker,
    name: stock.name,
    lastPrice: stock.price,
    change: stock.change,
    changePercent: stock.changePct,
    volume: MOCK_VOLUMES[stock.id] ?? 500_000,
    tradeTime,
    source: 'mock',
    sourceLabel: 'Prototype Data',
    isLive: false,
    isDelayed: true,
    isMock: true,
    disclaimer: MARKET_DATA_DISCLAIMER,
  }))
}

export function buildMockMarketQuote(stockId: string): MarketQuote | null {
  const quotes = buildMockMarketQuotes()
  const normalized = stockId.trim().toUpperCase()
  return (
    quotes.find((quote) => quote.stockId === stockId) ??
    quotes.find((quote) => quote.ticker.toUpperCase() === normalized) ??
    null
  )
}
