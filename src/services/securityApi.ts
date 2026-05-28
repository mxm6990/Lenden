/**
 * Security quote service — mock until market data API is connected.
 *
 * Replace with: GET /api/securities/:symbol/quote
 */

import { getStock, stocks } from '../data/stocks'
import type { SecurityQuote, SecurityQuoteApiResponse } from '../types/security'

const MOCK_DELAY_MS = 80

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

/** Mock quote payloads keyed by stock id — mirrors expected API response bodies */
const MOCK_QUOTES: Record<string, Omit<SecurityQuoteApiResponse['quote'], never>> = {
  gp: {
    lastPrice: 298.5,
    change: 4.2,
    changePct: 1.43,
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
    lastPrice: 52.8,
    change: 0.3,
    changePct: 0.57,
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
    lastPrice: 215.0,
    change: -0.8,
    changePct: -0.37,
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
    lastPrice: 412.0,
    change: 6.5,
    changePct: 1.6,
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
    lastPrice: 890.0,
    change: 12.0,
    changePct: 1.37,
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
    lastPrice: 178.5,
    change: 1.2,
    changePct: 0.68,
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

function buildQuoteFromStock(stockId: string): SecurityQuote | null {
  const stock = getStock(stockId)
  if (!stock) return null

  const mock = MOCK_QUOTES[stockId]
  if (mock) {
    return {
      stockId,
      symbol: stock.ticker,
      asOf: new Date().toISOString(),
      ...mock,
    }
  }

  const prevClose = stock.price - stock.change
  return {
    stockId,
    symbol: stock.ticker,
    asOf: new Date().toISOString(),
    lastPrice: stock.price,
    change: stock.change,
    changePct: stock.changePct,
    value: stock.price * 500_000,
    volume: 500_000,
    averageVolume: 450_000,
    open: prevClose,
    dayHigh: Math.max(stock.price, prevClose) + 1,
    dayLow: Math.min(stock.price, prevClose) - 1,
    marketCap: stock.price * 1_000_000_000,
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
  return buildQuoteFromStock(stockId)
}

export async function fetchSecurityQuote(stockId: string): Promise<SecurityQuote | null> {
  // const res = await fetch(`/api/securities/${stockId}/quote`)
  // if (!res.ok) throw new Error('Failed to load quote')
  // const payload: SecurityQuoteApiResponse = await res.json()
  // return { stockId, symbol: payload.symbol, asOf: payload.asOf, ...payload.quote }
  return delay(getSecurityQuote(stockId))
}

export async function fetchAllSecurityQuotes(): Promise<SecurityQuote[]> {
  // const res = await fetch('/api/securities/quotes')
  // ...
  return delay(
    stocks
      .map((s) => getSecurityQuote(s.id))
      .filter((q): q is SecurityQuote => q !== null),
  )
}
