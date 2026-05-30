/**
 * Security quote service — uses marketDataProvider for prices.
 *
 * Replace with backend proxy when licensed production feed is available.
 */

import { getStock, stocks } from '../data/stocks'
import {
  getCachedMarketQuote,
  getMarketDataStatus,
  refreshMarketQuotes,
} from '../services/marketDataProvider'
import type { SecurityQuote, SecurityQuoteApiResponse } from '../types/security'

const MOCK_DELAY_MS = 80

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

/** Extended mock metrics keyed by stock id */
const MOCK_METRICS: Record<
  string,
  Omit<SecurityQuoteApiResponse['quote'], 'lastPrice' | 'change' | 'changePct'>
> = {
  gp: {
    value: 842_500_000,
    volume: 2_840_000,
    averageVolume: 2_100_000,
    open: 294.3,
    dayHigh: 299.8,
    dayLow: 293.5,
    marketCap: 401_000_000_000,
    week52High: 312.0,
    week52Low: 265.4,
    peRatio: 14.2,
    dividendYield: 5.8,
  },
  brac: {
    value: 128_400_000,
    volume: 4_520_000,
    averageVolume: 3_800_000,
    open: 52.5,
    dayHigh: 53.2,
    dayLow: 52.1,
    marketCap: 48_000_000_000,
    week52High: 58.4,
    week52Low: 44.2,
    peRatio: 11.8,
    dividendYield: 3.2,
  },
  squr: {
    value: 96_200_000,
    volume: 890_000,
    averageVolume: 1_050_000,
    open: 216.2,
    dayHigh: 217.0,
    dayLow: 214.2,
    marketCap: 95_000_000_000,
    week52High: 228.5,
    week52Low: 198.0,
    peRatio: 16.5,
    dividendYield: 2.1,
  },
  batbc: {
    value: 215_800_000,
    volume: 520_000,
    averageVolume: 480_000,
    open: 406.0,
    dayHigh: 413.5,
    dayLow: 405.2,
    marketCap: 62_000_000_000,
    week52High: 425.0,
    week52Low: 368.0,
    peRatio: 18.3,
    dividendYield: 6.4,
  },
  renata: {
    value: 178_400_000,
    volume: 198_000,
    averageVolume: 240_000,
    open: 878.0,
    dayHigh: 892.0,
    dayLow: 876.5,
    marketCap: 78_000_000_000,
    week52High: 920.0,
    week52Low: 780.0,
    peRatio: 15.1,
    dividendYield: 1.8,
  },
  marico: {
    value: 42_600_000,
    volume: 310_000,
    averageVolume: 285_000,
    open: 177.3,
    dayHigh: 179.0,
    dayLow: 176.8,
    marketCap: 32_000_000_000,
    week52High: 185.0,
    week52Low: 158.0,
    peRatio: 22.4,
    dividendYield: 2.5,
  },
}

function buildQuoteFromMarketData(stockId: string): SecurityQuote | null {
  const stock = getStock(stockId)
  if (!stock) return null

  const marketQuote = getCachedMarketQuote(stockId)
  const metrics = MOCK_METRICS[stockId]
  const lastPrice = marketQuote?.lastPrice ?? stock.price
  const change = marketQuote?.change ?? stock.change
  const changePct = marketQuote?.changePercent ?? stock.changePct
  const asOf = marketQuote?.tradeTime ?? new Date().toISOString()

  if (metrics) {
    return {
      stockId,
      symbol: stock.ticker,
      asOf,
      lastPrice,
      change,
      changePct,
      ...metrics,
      volume: marketQuote?.volume ?? metrics.volume,
    }
  }

  const prevClose = lastPrice - change
  return {
    stockId,
    symbol: stock.ticker,
    asOf,
    lastPrice,
    change,
    changePct,
    value: lastPrice * 500_000,
    volume: marketQuote?.volume ?? 500_000,
    averageVolume: 450_000,
    open: prevClose,
    dayHigh: Math.max(lastPrice, prevClose) + 1,
    dayLow: Math.min(lastPrice, prevClose) - 1,
    marketCap: lastPrice * 1_000_000_000,
    week52High: Math.max(...stock.chartPoints) * 1.05,
    week52Low: Math.min(...stock.chartPoints) * 0.92,
    peRatio: Number.parseFloat(stock.peRatio) || null,
    dividendYield: Number.parseFloat(stock.dividend) || null,
  }
}

export function formatVolume(units: number): string {
  if (units >= 1_000_000) return `${(units / 1_000_000).toFixed(2)}M`
  if (units >= 1_000) return `${(units / 1_000).toFixed(1)}K`
  return units.toLocaleString('en-BD')
}

export function formatMarketCap(amount: number): string {
  if (amount >= 1_000_000_000_000) return `৳${(amount / 1_000_000_000_000).toFixed(1)}T`
  if (amount >= 1_000_000_000) return `৳${(amount / 1_000_000_000).toFixed(0)}B`
  if (amount >= 1_000_000) return `৳${(amount / 1_000_000).toFixed(0)}M`
  return `৳${amount.toLocaleString('en-BD')}`
}

export function formatRatio(value: number | null, suffix = ''): string {
  if (value === null || Number.isNaN(value)) return '—'
  return `${value.toFixed(1)}${suffix}`
}

export function getSecurityQuote(stockId: string): SecurityQuote | null {
  return buildQuoteFromMarketData(stockId)
}

export async function fetchSecurityQuote(stockId: string): Promise<SecurityQuote | null> {
  await refreshMarketQuotes()
  return delay(getSecurityQuote(stockId))
}

export async function fetchAllSecurityQuotes(): Promise<SecurityQuote[]> {
  await refreshMarketQuotes()
  return delay(
    stocks
      .map((stock) => getSecurityQuote(stock.id))
      .filter((quote): quote is SecurityQuote => quote !== null),
  )
}

export function getSecurityQuoteSourceLabel(): string {
  return getMarketDataStatus().sourceLabel
}
