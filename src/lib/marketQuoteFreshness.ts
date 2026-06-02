export type QuoteFreshnessLevel = 'live' | 'delayed' | 'stale'

const THIRTY_MINUTES_MS = 30 * 60 * 1000
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export function getQuoteAgeMs(tradeTime: string | null | undefined): number | null {
  if (!tradeTime) return null
  const parsed = Date.parse(tradeTime)
  if (!Number.isFinite(parsed)) return null
  return Math.max(0, Date.now() - parsed)
}

export function getQuoteFreshnessLevel(tradeTime: string | null | undefined): QuoteFreshnessLevel | null {
  const ageMs = getQuoteAgeMs(tradeTime)
  if (ageMs === null) return null
  if (ageMs > TWENTY_FOUR_HOURS_MS) return 'stale'
  if (ageMs > THIRTY_MINUTES_MS) return 'delayed'
  return 'live'
}

export function getQuoteFreshnessLabel(tradeTime: string | null | undefined): string | null {
  const level = getQuoteFreshnessLevel(tradeTime)
  if (level === 'delayed') return 'Delayed / cached'
  if (level === 'stale') return 'Stale cached price'
  return null
}

export function getMarketFeedStatusLabel(status: {
  source?: string
  fellBackToCache?: boolean
  fellBackToMock?: boolean
  cacheAgeMs?: number | null
}): string {
  if (status.fellBackToMock || status.source === 'mock') return 'Market prices unavailable'
  if (status.fellBackToCache || status.source === 'cache') return 'Using cached prices'
  return 'Live experimental DSE feed'
}
