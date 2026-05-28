/**
 * User position service — mock until portfolio ledger API is connected.
 *
 * Positions are computed from transaction history on the backend.
 * Replace with: GET /api/portfolio/positions/:symbol
 */

import { getPortfolioSummary } from '../data/portfolio'
import { getEnrichedHoldings } from '../data/stocks'
import type { UserPosition } from '../types/position'

const MOCK_USER_ID = 'usr_mahathir_001'
const MOCK_DELAY_MS = 80

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

function buildPosition(stockId: string): UserPosition | null {
  const holding = getEnrichedHoldings().find((h) => h.stockId === stockId)
  if (!holding) return null

  const { totalValue } = getPortfolioSummary()
  const previousClose = holding.stock.price - holding.stock.change
  const todayAmount = holding.shares * holding.stock.change
  const costBasis = holding.shares * previousClose
  const todayPct = costBasis > 0 ? (todayAmount / costBasis) * 100 : 0
  const portfolioWeightPct = totalValue > 0 ? (holding.currentValue / totalValue) * 100 : 0

  return {
    userId: MOCK_USER_ID,
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

export function getUserPosition(stockId: string): UserPosition | null {
  return buildPosition(stockId)
}

export async function fetchUserPosition(stockId: string): Promise<UserPosition | null> {
  // const res = await fetch(`/api/portfolio/positions/${stockId}`)
  // if (res.status === 404) return null
  // if (!res.ok) throw new Error('Failed to load position')
  // const payload: UserPositionApiResponse = await res.json()
  // if (!payload.position) return null
  // return { userId: payload.userId, asOf: payload.asOf, ...payload.position }
  return delay(getUserPosition(stockId))
}

export async function fetchAllUserPositions(): Promise<UserPosition[]> {
  // const res = await fetch('/api/portfolio/positions')
  // ...
  return delay(
    getEnrichedHoldings()
      .map((h) => buildPosition(h.stockId))
      .filter((p): p is UserPosition => p !== null),
  )
}
