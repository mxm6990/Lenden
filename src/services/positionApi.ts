/**
 * User position service — uses portfolioApi holdings when authenticated.
 */

import type { UserPosition } from '../types/position'
import { getPortfolioBundle } from './portfolioApi'
import { getCachedMarketQuote } from './marketDataProvider'
import type { EnrichedHolding } from '../data/stocks'

const MOCK_USER_ID = 'usr_demo_001'
const MOCK_DELAY_MS = 80

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

function buildPositionFromHolding(
  holding: EnrichedHolding,
  totalValue: number,
  userId: string,
): UserPosition {
  const quote = getCachedMarketQuote(holding.stockId)
  const change = quote?.change ?? holding.stock.change
  const lastPrice = quote?.lastPrice ?? holding.currentValue / Math.max(holding.shares, 1)
  const previousClose = lastPrice - change
  const todayAmount = holding.shares * change
  const costBasis = holding.shares * previousClose
  const todayPct = costBasis > 0 ? (todayAmount / costBasis) * 100 : 0
  const portfolioWeightPct = totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0

  return {
    userId,
    stockId: holding.stockId,
    symbol: holding.stock.ticker,
    asOf: new Date().toISOString(),
    sharesOwned: holding.shares,
    averageCost: holding.avgCost,
    marketValue: holding.currentValue,
    portfolioWeightPct,
    totalReturn: {
      amount: holding.returnAmount,
      pct: holding.returnPct,
    },
    todayReturn: {
      amount: todayAmount,
      pct: todayPct,
    },
  }
}

export async function fetchUserPosition(stockId: string): Promise<UserPosition | null> {
  const bundle = await getPortfolioBundle()
  const holding = bundle.holdings.find((h) => h.stockId === stockId)
  if (!holding) return delay(null)
  return delay(buildPositionFromHolding(holding, bundle.summary.totalValue, MOCK_USER_ID))
}

export async function fetchAllUserPositions(): Promise<UserPosition[]> {
  const bundle = await getPortfolioBundle()
  return delay(
    bundle.holdings.map((holding) =>
      buildPositionFromHolding(holding, bundle.summary.totalValue, MOCK_USER_ID),
    ),
  )
}
