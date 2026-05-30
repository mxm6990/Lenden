import { normalizeSecurityKey, resolveStockSync } from '../lib/securityListing'
import {
  buildPrototypeHistorySummary,
  buildSessionEstimateSummary,
} from '../lib/stockChartFallback'
import {
  getCachedMarketQuote,
  getMarketDataMode,
  refreshMarketQuotes,
} from './marketDataProvider'
import type { StockHistoryRange, StockHistorySummary } from '../types/stockHistory'

const MOCK_DELAY_MS = 60

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

export async function getStockHistory(
  ticker: string,
  _range: StockHistoryRange,
): Promise<StockHistorySummary> {
  await refreshMarketQuotes()

  const normalized = normalizeSecurityKey(ticker)
  const quote = getCachedMarketQuote(normalized)
  const stock = resolveStockSync(normalized)
  const lastPrice = quote?.lastPrice ?? stock?.price ?? 0

  if (lastPrice <= 0) {
    return delay(buildPrototypeHistorySummary(normalized, 100, '1D'))
  }

  const mode = getMarketDataMode()
  const endpoint = import.meta.env.VITE_DSE_MARKET_DATA_ENDPOINT?.trim()

  if (mode === 'licensed' && endpoint) {
    // Future: fetch(`${endpoint}/history?ticker=...&range=...`) and return hasRealHistory: true
  }

  if (quote && !quote.isMock && mode === 'experimental_dse') {
    return delay(buildSessionEstimateSummary(normalized, quote, '1D'))
  }

  return delay(buildPrototypeHistorySummary(normalized, lastPrice, '1D'))
}

export type { StockHistoryRange, StockHistorySummary }
