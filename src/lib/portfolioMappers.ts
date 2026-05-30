import type { BuyingPower } from '../data/portfolio'
import type { PastTransaction, TransactionType } from '../data/transactions'
import { type EnrichedHolding } from '../data/stocks'
import { resolveStockSync } from '../lib/securityListing'
import {
  calculateHoldingMarketValue,
  computePortfolioSummaryFromHoldings,
} from './portfolioCalculations'

export interface HoldingRow {
  id: string
  user_id: string
  stock_id: string
  shares: number
  avg_cost: number
  created_at: string
  updated_at: string
}

export interface TransactionRow {
  id: string
  user_id: string
  type: TransactionType
  stock_id: string | null
  ticker: string | null
  shares: number | null
  amount: number
  status: 'completed' | 'pending' | 'failed'
  note: string | null
  mock_order_id: string | null
  realized_gain_loss?: number | null
  created_at: string
}

export function enrichHoldings(rows: HoldingRow[]): EnrichedHolding[] {
  return rows
    .map((row) => {
      const stock = resolveStockSync(row.stock_id)
      if (!stock) return null
      const shares = Number(row.shares)
      const avgCost = Number(row.avg_cost)
      const currentValue = calculateHoldingMarketValue(shares, row.stock_id)
      const invested = shares * avgCost
      const returnAmount = currentValue - invested
      const returnPct = invested > 0 ? (returnAmount / invested) * 100 : 0
      return {
        stockId: stock.id,
        shares,
        avgCost,
        stock,
        currentValue,
        invested,
        returnAmount,
        returnPct,
      }
    })
    .filter((h): h is EnrichedHolding => h !== null)
}

export function mapTransactionRow(row: TransactionRow): PastTransaction {
  const date = new Date(row.created_at)
  const dateLabel = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return {
    id: row.id,
    userId: row.user_id,
    date: dateLabel,
    type: row.type,
    ticker: row.ticker,
    shares: row.shares !== null ? Number(row.shares) : null,
    amount: Number(row.amount),
    status: row.status,
    note: row.note,
    realizedGainLoss:
      row.realized_gain_loss !== null && row.realized_gain_loss !== undefined
        ? Number(row.realized_gain_loss)
        : null,
  }
}

export function buildBuyingPowerFromProfile(
  available: number,
  reserved: number,
): BuyingPower {
  return {
    available: Number(available),
    reserved: Number(reserved),
    currency: 'BDT',
    boAccountId: null,
    asOf: new Date().toISOString(),
  }
}

export function computePortfolioSummary(holdings: EnrichedHolding[]) {
  return computePortfolioSummaryFromHoldings(holdings)
}
