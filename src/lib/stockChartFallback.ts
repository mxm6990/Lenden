import type { MarketQuote } from '../types/marketData'
import type { StockHistoryPoint, StockHistoryRange, StockHistorySourceLabel, StockHistorySummary } from '../types/stockHistory'
import { RANGE_CONFIG } from '../data/mockStockHistory'
import { buildMockStockHistory } from '../data/mockStockHistory'

export interface SessionQuoteFields {
  lastPrice: number
  change: number
  previousClose: number
  dayHigh: number
  dayLow: number
  tradeTime: string
}

export function deriveSessionQuoteFields(quote: MarketQuote): SessionQuoteFields {
  const previousClose = quote.previousClose ?? quote.lastPrice - quote.change
  const dayHigh = quote.dayHigh ?? Math.max(quote.lastPrice, previousClose)
  const dayLow = quote.dayLow ?? Math.min(quote.lastPrice, previousClose)

  return {
    lastPrice: quote.lastPrice,
    change: quote.change,
    previousClose,
    dayHigh,
    dayLow,
    tradeTime: quote.tradeTime,
  }
}

function interpolateSessionPrice(progress: number, fields: SessionQuoteFields): number {
  const anchors = [
    { t: 0, price: fields.previousClose },
    { t: 0.28, price: fields.dayLow },
    { t: 0.55, price: fields.dayHigh },
    { t: 1, price: fields.lastPrice },
  ]

  for (let index = 0; index < anchors.length - 1; index += 1) {
    const start = anchors[index]
    const end = anchors[index + 1]
    if (progress >= start.t && progress <= end.t) {
      const span = end.t - start.t || 1
      const ratio = (progress - start.t) / span
      return Math.round((start.price + (end.price - start.price) * ratio) * 100) / 100
    }
  }

  return fields.lastPrice
}

export function buildSessionEstimateHistory(
  ticker: string,
  fields: SessionQuoteFields,
  range: StockHistoryRange,
): StockHistoryPoint[] {
  const config = RANGE_CONFIG[range]
  const sessionEnd = new Date(fields.tradeTime).getTime()
  const sessionStart = sessionEnd - 4.5 * 60 * 60 * 1000
  const points: StockHistoryPoint[] = []

  for (let index = config.points - 1; index >= 0; index -= 1) {
    const progress = index / Math.max(config.points - 1, 1)
    const timestamp = new Date(
      range === '1D'
        ? sessionStart + progress * (sessionEnd - sessionStart)
        : sessionEnd - index * config.stepMs,
    ).toISOString()

    points.push({
      ticker,
      timestamp,
      price: interpolateSessionPrice(progress, fields),
      source: 'Session estimate',
      isMock: false,
    })
  }

  if (points.length > 0) {
    points[points.length - 1].price = fields.lastPrice
  }

  return points
}

export function summarizeHistory(
  ticker: string,
  range: StockHistoryRange,
  points: StockHistoryPoint[],
  sourceLabel: StockHistorySourceLabel,
  sourceDescription: string,
  isMock: boolean,
): StockHistorySummary {
  const prices = points.map((point) => point.price)

  return {
    ticker,
    range,
    points,
    startPrice: prices[0] ?? 0,
    endPrice: prices[prices.length - 1] ?? 0,
    high: prices.length > 0 ? Math.max(...prices) : 0,
    low: prices.length > 0 ? Math.min(...prices) : 0,
    lastUpdated: points[points.length - 1]?.timestamp ?? new Date().toISOString(),
    source: sourceLabel,
    sourceLabel,
    sourceDescription,
    isMock,
  }
}

export function buildPrototypeHistorySummary(
  ticker: string,
  basePrice: number,
  range: StockHistoryRange,
): StockHistorySummary {
  const points = buildMockStockHistory(ticker, basePrice, range, 'Prototype history')
  return summarizeHistory(
    ticker,
    range,
    points,
    'Prototype history',
    'Prototype chart generated for demonstration. Not licensed historical data.',
    true,
  )
}

export function buildSessionEstimateSummary(
  ticker: string,
  quote: MarketQuote,
  range: StockHistoryRange,
): StockHistorySummary {
  const fields = deriveSessionQuoteFields(quote)
  const points = buildSessionEstimateHistory(ticker, fields, range)
  return summarizeHistory(
    ticker,
    range,
    points,
    'Session estimate',
    'Session estimate from latest DSE quote. Not full historical accuracy.',
    false,
  )
}
