/**
 * Mock portfolio API — holdings, buying power, transactions, allocation.
 * Replace with portfolio service when backend is live.
 */

import { getPortfolioAllocationByIndustry } from '../data/allocation'
import {
  getBuyingPower as getBuyingPowerLocal,
  getCombinedPnL,
  getPortfolioDayChange,
  getPortfolioHistory,
  getPortfolioSummary as getPortfolioSummaryLocal,
  getRealizedPnL,
  type BuyingPower,
  type PortfolioHistoryPoint,
  type PortfolioSummary,
} from '../data/portfolio'
import { getEnrichedHoldings, type EnrichedHolding } from '../data/stocks'
import { getPastTransactions as getPastTransactionsLocal, type PastTransaction } from '../data/transactions'
import type { AllocationSegment } from '../data/allocation'

const MOCK_DELAY_MS = 80

let simulateBuyingPowerUnavailable = false
let simulateTransactionsUnavailable = false

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

export async function getPortfolioSummary(): Promise<PortfolioSummary> {
  return delay(getPortfolioSummaryLocal())
}

export async function getHoldings(): Promise<EnrichedHolding[]> {
  return delay(getEnrichedHoldings())
}

export async function getWatchlistStockIds(watchlist: string[]): Promise<string[]> {
  return delay([...watchlist])
}

export async function getBuyingPower(): Promise<BuyingPower | null> {
  if (simulateBuyingPowerUnavailable) return delay(null)
  return delay(getBuyingPowerLocal())
}

export async function getPastTransactions(): Promise<PastTransaction[] | null> {
  if (simulateTransactionsUnavailable) return delay(null)
  return delay(getPastTransactionsLocal())
}

export async function getAllocationBreakdown(): Promise<AllocationSegment[]> {
  return delay(getPortfolioAllocationByIndustry())
}

export async function getPortfolioHistoryData(): Promise<PortfolioHistoryPoint[]> {
  return delay(getPortfolioHistory())
}

export async function getPortfolioDayChangeData(): Promise<{ amount: number; pct: number }> {
  return delay(getPortfolioDayChange())
}

export async function getCombinedPnLData() {
  return delay(getCombinedPnL())
}

export async function getRealizedPnLData() {
  return delay(getRealizedPnL())
}

export function __setBuyingPowerUnavailable(unavailable: boolean) {
  simulateBuyingPowerUnavailable = unavailable
}

export function __setTransactionsUnavailable(unavailable: boolean) {
  simulateTransactionsUnavailable = unavailable
}

export type { PortfolioSummary, BuyingPower, PastTransaction, AllocationSegment, EnrichedHolding }
