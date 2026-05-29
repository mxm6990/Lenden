import { stocks } from '../data/stocks'
import { buildMockStockHistory } from '../data/mockStockHistory'
import {
  getMarketDataMode,
  getMarketDataSourceLabel,
  isMarketDataMock,
} from './marketDataProvider'
import type { StockHistoryRange, StockHistorySummary } from '../types/stockHistory'

const MOCK_DELAY_MS = 60

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

export async function getStockHistory(
  ticker: string,
  range: StockHistoryRange,
): Promise<StockHistorySummary | null> {
  const stock = getStockByTicker(ticker)
  if (!stock) return delay(null)

  const mode = getMarketDataMode()
  const endpoint = import.meta.env.VITE_DSE_MARKET_DATA_ENDPOINT?.trim()

  if (mode === 'experimental_dse' && endpoint) {
    // Future: fetch(`${endpoint}/history?ticker=...&range=...`)
    // Fall back to mock when vendor API is not wired yet.
  }

  const source = getMarketDataSourceLabel()
  const points = buildMockStockHistory(stock.ticker, stock.price, range, source)
  const prices = points.map((p) => p.price)

  return delay({
    ticker: stock.ticker,
    range,
    points,
    startPrice: prices[0] ?? stock.price,
    endPrice: prices[prices.length - 1] ?? stock.price,
    high: Math.max(...prices),
    low: Math.min(...prices),
    lastUpdated: points[points.length - 1]?.timestamp ?? new Date().toISOString(),
    source,
    isMock: isMarketDataMock(),
  })
}

function getStockByTicker(ticker: string) {
  const normalized = ticker.trim().toLowerCase()
  return stocks.find((s) => s.ticker.toLowerCase() === normalized || s.id === normalized) ?? null
}

export type { StockHistoryRange, StockHistorySummary }
