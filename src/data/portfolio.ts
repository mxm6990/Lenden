import { getEnrichedHoldings, getStock, holdings, type EnrichedHolding } from './stocks'

export interface PortfolioHistoryPoint {
  label: string
  value: number
}

export interface PortfolioSummary {
  holdings: EnrichedHolding[]
  totalInvested: number
  totalValue: number
  totalGain: number
  totalGainPct: number
}

const HISTORY_LABELS = [
  '21 Apr',
  '22 Apr',
  '23 Apr',
  '24 Apr',
  '25 Apr',
  '28 Apr',
  '29 Apr',
  '30 Apr',
  '1 May',
  '2 May',
  '5 May',
  '6 May',
  '7 May',
  '8 May',
  '9 May',
  '12 May',
  '13 May',
  '14 May',
  '15 May',
  '16 May',
  '19 May',
  '20 May',
  '21 May',
  '22 May',
  '23 May',
  '26 May',
  '27 May',
  '28 May',
  '29 May',
  'Today',
] as const

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

function stockValueOnDay(stockId: string, dayIndex: number, historyLength: number): number {
  const stock = getStock(stockId)
  if (!stock) return 0
  const prices = interpolatePoints(stock.chartPoints, historyLength)
  return prices[dayIndex]
}

/** Single source of truth for holdings-based portfolio totals */
export function getPortfolioSummary(): PortfolioSummary {
  const enriched = getEnrichedHoldings()
  const totalInvested = enriched.reduce((sum, h) => sum + h.invested, 0)
  const totalValue = enriched.reduce((sum, h) => sum + h.currentValue, 0)
  const totalGain = totalValue - totalInvested
  const totalGainPct = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0

  return {
    holdings: enriched,
    totalInvested,
    totalValue,
    totalGain,
    totalGainPct,
  }
}

/** Portfolio value over time — derived from the user's holdings and each stock's price history */
export function getPortfolioHistory(): PortfolioHistoryPoint[] {
  const length = HISTORY_LABELS.length

  return HISTORY_LABELS.map((label, dayIndex) => ({
    label,
    value: holdings.reduce((sum, holding) => {
      const price = stockValueOnDay(holding.stockId, dayIndex, length)
      return sum + holding.shares * price
    }, 0),
  }))
}

export function getLatestPortfolioValue(): number {
  return getPortfolioSummary().totalValue
}

export function getPortfolioDayChange(): { amount: number; pct: number } {
  const history = getPortfolioHistory()
  const latest = history[history.length - 1].value
  const previous = history[history.length - 2]?.value ?? latest
  const amount = latest - previous
  const pct = previous > 0 ? (amount / previous) * 100 : 0
  return { amount, pct }
}

/** Cash available in BO account for new orders — mock until API is connected */
export interface BuyingPower {
  available: number
  reserved: number
  currency: 'BDT'
  boAccountId: string | null
  asOf: string
}

export function getBuyingPower(): BuyingPower {
  return {
    available: 8450,
    reserved: 1200,
    currency: 'BDT',
    boAccountId: null,
    asOf: new Date().toISOString(),
  }
}

export async function fetchBuyingPower(): Promise<BuyingPower> {
  // return fetch('/api/account/buying-power').then((r) => r.json())
  return getBuyingPower()
}

export interface RealizedPnLEntry {
  id: string
  date: string
  ticker: string
  type: 'sell' | 'dividend'
  amount: number
  note: string
}

const REALIZED_PNL_ENTRIES: RealizedPnLEntry[] = [
  {
    id: 'r1',
    date: '14 May',
    ticker: 'BATBC',
    type: 'sell',
    amount: 1250,
    note: 'Sold 5 shares · partial exit',
  },
  {
    id: 'r2',
    date: '2 May',
    ticker: 'GP',
    type: 'dividend',
    amount: 890,
    note: 'Dividend payout',
  },
  {
    id: 'r3',
    date: '18 Apr',
    ticker: 'RENATA',
    type: 'sell',
    amount: 640,
    note: 'Sold 2 shares · rebalanced',
  },
]

export function getUnrealizedPnL() {
  const { totalGain, totalGainPct } = getPortfolioSummary()
  return { amount: totalGain, pct: totalGainPct }
}

export function getRealizedPnL() {
  const total = REALIZED_PNL_ENTRIES.reduce((sum, entry) => sum + entry.amount, 0)
  return { total, entries: REALIZED_PNL_ENTRIES }
}

export function getCombinedPnL() {
  const unrealized = getUnrealizedPnL()
  const realized = getRealizedPnL()
  return {
    unrealized,
    realized: realized.total,
    total: unrealized.amount + realized.total,
  }
}
