import {
  EXPERIMENTAL_DSE_DISCLAIMER,
  findCatalogEntry,
  LENDEN_STOCK_CATALOG,
  type LendenCatalogEntry,
} from './lendenCatalog.ts'

export interface MarketQuote {
  stockId: string
  ticker: string
  name: string
  lastPrice: number
  change: number
  changePercent: number
  volume: number
  tradeTime: string
  source: string
  sourceLabel: string
  isLive: boolean
  isDelayed: boolean
  isMock: boolean
  disclaimer: string
}

export interface MarketDataStatusPayload {
  mode: string
  badge: string
  sourceLabel: string
  disclaimer: string
  isMock: boolean
  isLive: boolean
  isDelayed: boolean
  fellBackToMock: boolean
  fellBackToCache: boolean
  sourceUnavailable: boolean
  configurationError: string | null
  lastRefreshAt: string
  quoteCount: number
  source?: 'live' | 'cache' | 'mock'
  liveQuotesCount?: number
  cachedQuotesCount?: number
  returnedQuotesCount?: number
  cacheAgeMs?: number | null
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim()
    if (!cleaned || cleaned === '-' || cleaned === '—') return null
    const parsed = Number(cleaned)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function buildQuoteFromCatalog(
  entry: LendenCatalogEntry,
  overrides: Partial<MarketQuote> = {},
): MarketQuote {
  return {
    stockId: entry.stockId,
    ticker: entry.ticker,
    name: entry.name,
    lastPrice: entry.mockPrice,
    change: entry.mockChange,
    changePercent: entry.mockChangePercent,
    volume: entry.mockVolume,
    tradeTime: new Date().toISOString(),
    source: 'mock',
    sourceLabel: 'Prototype Data',
    isLive: false,
    isDelayed: true,
    isMock: true,
    disclaimer: EXPERIMENTAL_DSE_DISCLAIMER,
    ...overrides,
  }
}

export function buildMockMarketQuotes(): MarketQuote[] {
  return LENDEN_STOCK_CATALOG.map((entry) => buildQuoteFromCatalog(entry))
}

export function normalizeDseRow(
  row: Record<string, unknown>,
  tradeTime: string,
): MarketQuote | null {
  const tradingCode =
    typeof row.TRADING_CODE === 'string'
      ? row.TRADING_CODE
      : typeof row.trading_code === 'string'
        ? row.trading_code
        : typeof row.ticker === 'string'
          ? row.ticker
          : null

  if (!tradingCode) return null

  const ticker = tradingCode.trim().toUpperCase()
  const catalogEntry = findCatalogEntry({ ticker })

  const lastPrice =
    parseNumber(row.LTP) ??
    parseNumber(row.ltp) ??
    parseNumber(row.lastPrice) ??
    parseNumber(row.price)

  if (lastPrice === null || lastPrice <= 0) return null

  const change = parseNumber(row.CHANGE) ?? parseNumber(row.change) ?? 0
  const ycp = parseNumber(row.YCP) ?? parseNumber(row.ycp)
  const changePercent =
    parseNumber(row.changePercent) ??
    parseNumber(row.changePct) ??
    (ycp && ycp > 0 ? (change / ycp) * 100 : lastPrice > 0 ? (change / lastPrice) * 100 : 0)

  const volume = parseNumber(row.VOLUME) ?? parseNumber(row.volume) ?? 0

  return {
    stockId: ticker,
    ticker,
    name: catalogEntry?.name ?? ticker,
    lastPrice,
    change,
    changePercent,
    volume,
    tradeTime,
    source: 'experimental_dse',
    sourceLabel: 'Experimental DSE Feed',
    isLive: false,
    isDelayed: true,
    isMock: false,
    disclaimer: EXPERIMENTAL_DSE_DISCLAIMER,
  }
}

export function extractDseRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    if (Array.isArray(record.stocks)) {
      return record.stocks.filter(
        (row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object',
      )
    }
    return [record]
  }

  return []
}

export function mergeQuotesWithCatalog(remoteQuotes: MarketQuote[]): MarketQuote[] {
  if (remoteQuotes.length === 0) {
    return buildMockMarketQuotes()
  }

  const remoteByTicker = new Map(remoteQuotes.map((quote) => [quote.ticker.toUpperCase(), quote]))
  const mergedCatalog = LENDEN_STOCK_CATALOG.map((entry) => {
    return remoteByTicker.get(entry.ticker.toUpperCase()) ?? buildQuoteFromCatalog(entry)
  })

  const catalogTickers = new Set(LENDEN_STOCK_CATALOG.map((entry) => entry.ticker.toUpperCase()))
  const extras = remoteQuotes.filter((quote) => !catalogTickers.has(quote.ticker.toUpperCase()))

  return [...mergedCatalog, ...extras]
}

export function buildStatus(params: {
  mode: string
  badge: string
  sourceLabel: string
  disclaimer: string
  isMock: boolean
  fellBackToMock: boolean
  fellBackToCache: boolean
  sourceUnavailable: boolean
  configurationError: string | null
  quoteCount: number
  source?: 'live' | 'cache' | 'mock'
  liveQuotesCount?: number
  cachedQuotesCount?: number
  returnedQuotesCount?: number
  cacheAgeMs?: number | null
}): MarketDataStatusPayload {
  return {
    mode: params.mode,
    badge: params.badge,
    sourceLabel: params.sourceLabel,
    disclaimer: params.disclaimer,
    isMock: params.isMock,
    isLive: false,
    isDelayed: true,
    fellBackToMock: params.fellBackToMock,
    fellBackToCache: params.fellBackToCache,
    sourceUnavailable: params.sourceUnavailable,
    configurationError: params.configurationError,
    lastRefreshAt: new Date().toISOString(),
    quoteCount: params.quoteCount,
    source: params.source,
    liveQuotesCount: params.liveQuotesCount,
    cachedQuotesCount: params.cachedQuotesCount,
    returnedQuotesCount: params.returnedQuotesCount ?? params.quoteCount,
    cacheAgeMs: params.cacheAgeMs ?? null,
  }
}

export function normalizeLatestPricePayload(payload: unknown): MarketQuote[] {
  const tradeTime =
    payload && typeof payload === 'object' && typeof (payload as Record<string, unknown>).date === 'number'
      ? new Date((payload as Record<string, unknown>).date as number).toISOString()
      : new Date().toISOString()

  const rows = extractDseRows(payload)
  const quotes: MarketQuote[] = []

  for (const row of rows) {
    const normalized = normalizeDseRow(row, tradeTime)
    if (normalized) quotes.push(normalized)
  }

  return quotes
}
