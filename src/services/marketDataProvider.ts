/**
 * Market data adapter — mock by default; experimental DSE endpoint optional.
 * Do not scrape DSE from the frontend.
 */

import { getStock, stocks } from '../data/stocks'
import type { MarketDataMode, StockQuote } from '../types/marketData'

function interpolatePoints(points: number[], length: number): number[] {
  if (points.length === 0) return Array(length).fill(0)
  if (points.length === 1) return Array(length).fill(points[0])
  if (points.length === length) return [...points]

  return Array.from({ length }, (_, i) => {
    const t = (i / (length - 1)) * (points.length - 1)
    const lo = Math.floor(t)
    const hi = Math.min(Math.ceil(t), points.length - 1)
    const frac = t - lo
    return points[lo] * (1 - frac) + points[hi] * frac
  })
}

export function getMarketDataMode(): MarketDataMode {
  const mode = import.meta.env.VITE_MARKET_DATA_MODE
  if (mode === 'experimental_dse' || mode === 'disabled') return mode
  return 'mock'
}

export function getMarketDataSourceLabel(): string {
  const mode = getMarketDataMode()
  const endpoint = import.meta.env.VITE_DSE_MARKET_DATA_ENDPOINT?.trim()
  if (mode === 'experimental_dse' && endpoint) return 'DSE Feed'
  return 'Prototype Data'
}

export function isMarketDataMock(): boolean {
  return getMarketDataSourceLabel() === 'Prototype Data'
}

export function getStockPrice(stockId: string): number {
  if (getMarketDataMode() === 'disabled') return 0
  return getStock(stockId)?.price ?? 0
}

export function getStockPriceOnDayIndex(
  stockId: string,
  dayIndex: number,
  historyLength: number,
): number {
  const stock = getStock(stockId)
  if (!stock) return 0
  const prices = interpolatePoints(stock.chartPoints, historyLength)
  return prices[dayIndex] ?? stock.price
}

export function getStockQuote(stockId: string): StockQuote | null {
  const stock = getStock(stockId)
  if (!stock) return null

  const source = getMarketDataSourceLabel()
  return {
    stockId: stock.id,
    ticker: stock.ticker,
    price: stock.price,
    change: stock.change,
    changePct: stock.changePct,
    source,
    asOf: new Date().toISOString(),
    isMock: source === 'Prototype Data',
  }
}

export function listStockIds(): string[] {
  return stocks.map((s) => s.id)
}
