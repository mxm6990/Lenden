import type { EnrichedHolding } from '../data/stocks'
import { getStockPrice, getStockPriceOnDayIndex } from '../services/marketDataProvider'

export function calculateHoldingMarketValue(shares: number, stockId: string): number {
  return shares * getStockPrice(stockId)
}

export function calculateAverageCostBasis(
  existingShares: number,
  existingAvgCost: number,
  newShares: number,
  newPrice: number,
): number {
  const totalShares = existingShares + newShares
  if (totalShares <= 0) return 0
  return (existingShares * existingAvgCost + newShares * newPrice) / totalShares
}

export function calculateTotalInvested(holdings: EnrichedHolding[]): number {
  return holdings.reduce((sum, holding) => sum + holding.invested, 0)
}

export function calculatePortfolioCurrentValue(holdings: EnrichedHolding[]): number {
  return holdings.reduce(
    (sum, holding) => sum + calculateHoldingMarketValue(holding.shares, holding.stockId),
    0,
  )
}

export function calculateUnrealizedGain(holdings: EnrichedHolding[]): number {
  return calculatePortfolioCurrentValue(holdings) - calculateTotalInvested(holdings)
}

export function calculateUnrealizedGainPercent(holdings: EnrichedHolding[]): number {
  const invested = calculateTotalInvested(holdings)
  if (invested <= 0) return 0
  return (calculateUnrealizedGain(holdings) / invested) * 100
}

export function calculateBuyingPowerAfterOrder(
  buyingPower: number,
  totalRequired: number,
): number {
  return Math.max(0, buyingPower - totalRequired)
}

export function computePortfolioSummaryFromHoldings(holdings: EnrichedHolding[]) {
  const totalInvested = calculateTotalInvested(holdings)
  const totalValue = calculatePortfolioCurrentValue(holdings)
  const totalGain = calculateUnrealizedGain(holdings)
  const totalGainPct = calculateUnrealizedGainPercent(holdings)

  return {
    holdings,
    totalInvested,
    totalValue,
    totalGain,
    totalGainPct,
  }
}

const HISTORY_LENGTH = 30

function buildHistoryLabels(length: number): string[] {
  const labels: string[] = []
  const today = new Date()
  for (let i = length - 1; i >= 0; i -= 1) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    labels.push(
      i === 0
        ? 'Today'
        : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    )
  }
  return labels
}

/** Prototype portfolio history derived from holdings and stock price series */
export function buildPortfolioHistoryFromHoldings(
  holdings: EnrichedHolding[],
): { label: string; value: number }[] {
  if (holdings.length === 0) return []

  const labels = buildHistoryLabels(HISTORY_LENGTH)
  return labels.map((label, dayIndex) => ({
    label,
    value: holdings.reduce((sum, holding) => {
      const price = getStockPriceOnDayIndex(holding.stockId, dayIndex, HISTORY_LENGTH)
      return sum + holding.shares * price
    }, 0),
  }))
}

export function generatePrototypeHistoryFromValue(currentValue: number): { label: string; value: number }[] {
  if (currentValue <= 0) return []

  const labels = buildHistoryLabels(HISTORY_LENGTH)
  const startValue = currentValue * 0.92
  return labels.map((label, index) => ({
    label,
    value: startValue + ((currentValue - startValue) * index) / (labels.length - 1),
  }))
}
