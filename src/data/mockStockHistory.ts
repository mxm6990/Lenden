import type { StockHistoryPoint, StockHistoryRange } from '../types/stockHistory'

const RANGE_CONFIG: Record<
  StockHistoryRange,
  { points: number; stepMs: number; label: string }
> = {
  '1D': { points: 24, stepMs: 60 * 60 * 1000, label: '1D' },
  '1W': { points: 7, stepMs: 24 * 60 * 60 * 1000, label: '1W' },
  '1M': { points: 30, stepMs: 24 * 60 * 60 * 1000, label: '1M' },
  '6M': { points: 26, stepMs: 7 * 24 * 60 * 60 * 1000, label: '6M' },
  '1Y': { points: 12, stepMs: 30 * 24 * 60 * 60 * 1000, label: '1Y' },
}

function pseudoRandom(seed: string, index: number): number {
  let hash = 0
  const input = `${seed}:${index}`
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return (Math.abs(hash) % 1000) / 1000
}

export function buildMockStockHistory(
  ticker: string,
  basePrice: number,
  range: StockHistoryRange,
  source: string,
): StockHistoryPoint[] {
  const config = RANGE_CONFIG[range]
  const now = Date.now()
  const points: StockHistoryPoint[] = []
  let price = basePrice * (0.94 + pseudoRandom(ticker, 0) * 0.04)

  for (let i = config.points - 1; i >= 0; i -= 1) {
    const drift = (pseudoRandom(ticker, i + 1) - 0.48) * basePrice * 0.015
    price = Math.max(basePrice * 0.75, Math.min(basePrice * 1.25, price + drift))
    points.push({
      ticker,
      timestamp: new Date(now - i * config.stepMs).toISOString(),
      price: Math.round(price * 100) / 100,
      volume: Math.round(10000 + pseudoRandom(ticker, i + 99) * 50000),
      source,
      isMock: true,
    })
  }

  if (points.length > 0) {
    points[points.length - 1].price = basePrice
  }

  return points
}

export { RANGE_CONFIG }
