/**
 * Mock market API — DSE summary, stocks, search, market status.
 * Replace with market data provider integration when live.
 */

import { DSE_STATUS_STYLES, getDSEMarketInfo } from '../data/dseMarket'
import { DSE_INDEX, getStock, stocks, type Stock } from '../data/stocks'
import type { DseSummaryPayload } from '../api-contracts/market.contract'

const MOCK_DELAY_MS = 80

/** Set to simulate market data outage in UI demos */
let simulateMarketUnavailable = false

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

export interface MarketStatusInfo {
  status: ReturnType<typeof getDSEMarketInfo>['status']
  sessionLabel: string
  hoursLabel: string
  isDelayed: boolean
  unavailable: boolean
}

export async function getDseSummary(): Promise<DseSummaryPayload | null> {
  if (simulateMarketUnavailable) return delay(null)
  const info = getDSEMarketInfo()
  return delay({
    indexName: DSE_INDEX.name,
    value: DSE_INDEX.value,
    change: DSE_INDEX.change,
    changePct: DSE_INDEX.changePct,
    status: info.status,
    asOf: new Date().toISOString(),
    delayed: true,
  })
}

export async function getStocks(): Promise<Stock[]> {
  if (simulateMarketUnavailable) return delay([])
  // return fetch('/api/market/stocks').then(...)
  return delay([...stocks])
}

export async function searchStocks(query: string): Promise<Stock[]> {
  const all = simulateMarketUnavailable ? [] : stocks
  const q = query.trim().toLowerCase()
  if (!q) return delay([...all])
  return delay(
    all.filter(
      (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q),
    ),
  )
}

export async function getStockByTicker(ticker: string): Promise<Stock | null> {
  const match = stocks.find((s) => s.ticker.toLowerCase() === ticker.toLowerCase())
  return delay(match ?? null)
}

export async function getStockById(stockId: string): Promise<Stock | null> {
  return delay(getStock(stockId) ?? null)
}

export async function getMarketStatus(): Promise<MarketStatusInfo> {
  if (simulateMarketUnavailable) {
    return delay({
      status: 'Closed',
      sessionLabel: 'Market data temporarily unavailable',
      hoursLabel: '',
      isDelayed: true,
      unavailable: true,
    })
  }
  const info = getDSEMarketInfo()
  return delay({
    ...info,
    isDelayed: true,
    unavailable: false,
  })
}

export { DSE_STATUS_STYLES }

/** Demo helper — toggle market outage simulation */
export function __setMarketUnavailable(unavailable: boolean) {
  simulateMarketUnavailable = unavailable
}
