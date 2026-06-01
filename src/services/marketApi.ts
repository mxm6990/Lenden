/**
 * Mock market API — DSE summary, stocks, search, market status.
 * Securities catalog + prices from marketDataProvider.
 */

import { DSE_STATUS_STYLES, getDSEMarketInfo } from '../data/dseMarket'
import { DSE_INDEX, type Stock } from '../data/stocks'
import type { DseSummaryPayload } from '../api-contracts/market.contract'
import { getMarketDataStatus, refreshMarketQuotes } from './marketDataProvider'
import {
  getSecurityListings,
  refreshSecurityCatalog,
  securityToStock,
} from './securityCatalogApi'
import { matchesStockId } from '../lib/securityListing'

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

async function loadQuotedStocks(query = ''): Promise<Stock[]> {
  await refreshMarketQuotes()
  await refreshSecurityCatalog()
  const listings = await getSecurityListings(query)
  return listings.map((listing) => securityToStock(listing, listing))
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
    delayed: getMarketDataStatus().isDelayed,
  })
}

export async function getStocks(): Promise<Stock[]> {
  if (simulateMarketUnavailable) return delay([])
  return delay(loadQuotedStocks())
}

export async function searchStocks(query: string): Promise<Stock[]> {
  if (simulateMarketUnavailable) return delay([])
  return delay(loadQuotedStocks(query))
}

export async function getStockByTicker(ticker: string): Promise<Stock | null> {
  const all = await loadQuotedStocks()
  const match = all.find((stock) => stock.ticker.toLowerCase() === ticker.toLowerCase())
  return delay(match ?? null)
}

export async function getStockById(stockId: string): Promise<Stock | null> {
  const all = await loadQuotedStocks()
  return delay(all.find((stock) => matchesStockId(stock.id, stockId)) ?? null)
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
  const dataStatus = getMarketDataStatus()
  return delay({
    ...info,
    isDelayed: dataStatus.isDelayed,
    unavailable: dataStatus.badge === 'Data Unavailable' && !dataStatus.fellBackToMock,
  })
}

export { DSE_STATUS_STYLES }

/** Demo helper — toggle market outage simulation */
export function __setMarketUnavailable(unavailable: boolean) {
  simulateMarketUnavailable = unavailable
}
