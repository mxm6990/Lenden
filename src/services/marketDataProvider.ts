/**
 * Market data adapter — mock by default; optional experimental or licensed endpoints.
 * Do not scrape DSE from the frontend. Do not hardcode unofficial endpoints.
 *
 * Experimental DSE adapter for local testing only. Confirm licensing before production use.
 */

import { getStock, stocks, type Stock } from '../data/stocks'
import { buildMockMarketQuotes } from '../data/mockMarketQuotes'
import { normalizeSecurityKey } from '../lib/securityListing'
import { isSupabaseConfigured } from '../lib/supabase'
import type {
  MarketDataBadgeLabel,
  MarketDataMode,
  MarketDataStatus,
  MarketQuote,
  StockQuote,
} from '../types/marketData'
import { EXPERIMENTAL_DSE_DISCLAIMER, MARKET_DATA_DISCLAIMER } from '../types/marketData'

const REFRESH_TTL_MS = 60_000

let quoteCache = new Map<string, MarketQuote>()
let lastStatus: MarketDataStatus = createDefaultStatus()
let lastRefreshAt = 0
let refreshPromise: Promise<MarketQuote[]> | null = null

function createDefaultStatus(): MarketDataStatus {
  return {
    mode: 'mock',
    badge: 'Prototype Data',
    sourceLabel: 'Prototype Data',
    disclaimer: MARKET_DATA_DISCLAIMER,
    isMock: true,
    isLive: false,
    isDelayed: true,
    configurationError: null,
    lastRefreshAt: null,
    fellBackToMock: false,
    quoteCount: 0,
  }
}

function readEnvMode(): MarketDataMode {
  const mode = import.meta.env.VITE_MARKET_DATA_MODE?.trim()
  if (mode === 'experimental_dse' || mode === 'licensed') return mode
  return 'mock'
}

function readEndpoint(): string {
  return import.meta.env.VITE_DSE_MARKET_DATA_ENDPOINT?.trim() ?? ''
}

function readApiKey(): string {
  return import.meta.env.VITE_DSE_MARKET_DATA_API_KEY?.trim() ?? ''
}

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

function setCache(quotes: MarketQuote[], status: Partial<MarketDataStatus>) {
  quoteCache = new Map<string, MarketQuote>()
  for (const quote of quotes) {
    const tickerKey = quote.ticker.toUpperCase()
    const stockIdKey = normalizeSecurityKey(quote.stockId)
    quoteCache.set(tickerKey, quote)
    quoteCache.set(stockIdKey, quote)
    if (quote.stockId !== stockIdKey) {
      quoteCache.set(quote.stockId, quote)
    }
  }
  lastRefreshAt = Date.now()
  lastStatus = {
    ...lastStatus,
    ...status,
    lastRefreshAt: new Date(lastRefreshAt).toISOString(),
    quoteCount: quotes.length,
  }
  logExperimentalDseQuoteAudit(quotes, lastStatus)
}

function logExperimentalDseQuoteAudit(quotes: MarketQuote[], status: MarketDataStatus) {
  if (!import.meta.env.DEV) return
  if (status.mode !== 'experimental_dse') return

  console.group('Experimental DSE Quote Audit')
  console.log('status:', {
    badge: status.badge,
    sourceLabel: status.sourceLabel,
    isMock: status.isMock,
    fellBackToMock: status.fellBackToMock,
    fellBackToCache: status.fellBackToCache,
    sourceUnavailable: status.sourceUnavailable,
    configurationError: status.configurationError,
  })

  for (const quote of quotes) {
    console.log({
      stockId: quote.stockId,
      ticker: quote.ticker,
      lastPrice: quote.lastPrice,
      source: quote.source,
      sourceLabel: quote.sourceLabel,
      isLive: quote.isLive,
      isDelayed: quote.isDelayed,
      isMock: quote.isMock,
    })
  }

  console.groupEnd()
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function normalizeRemoteRow(raw: Record<string, unknown>, defaults: Partial<MarketQuote>): MarketQuote | null {
  const ticker =
    asString(raw.ticker) ??
    asString(raw.symbol) ??
    asString(raw.Ticker) ??
    asString(raw.Symbol)

  if (!ticker) return null

  const normalized = normalizeSecurityKey(ticker)
  const catalogStock = stocks.find((stock) => stock.ticker.toUpperCase() === normalized)

  const lastPrice =
    asNumber(raw.lastPrice) ??
    asNumber(raw.price) ??
    asNumber(raw.last) ??
    asNumber(raw.close)

  if (lastPrice === null || lastPrice <= 0) return null

  const change = asNumber(raw.change) ?? 0
  const changePercent =
    asNumber(raw.changePercent) ??
    asNumber(raw.changePct) ??
    asNumber(raw.change_percent) ??
    (lastPrice !== 0 ? (change / lastPrice) * 100 : 0)

  const volume = asNumber(raw.volume) ?? 0
  const tradeTime =
    asString(raw.tradeTime) ??
    asString(raw.asOf) ??
    asString(raw.timestamp) ??
    new Date().toISOString()

  return {
    stockId: normalized,
    ticker: normalized,
    name: asString(raw.name) ?? catalogStock?.name ?? normalized,
    lastPrice,
    change,
    changePercent,
    volume,
    tradeTime,
    source: defaults.source ?? 'remote',
    sourceLabel: defaults.sourceLabel ?? 'Prototype Data',
    isLive: defaults.isLive ?? false,
    isDelayed: defaults.isDelayed ?? true,
    isMock: defaults.isMock ?? false,
    disclaimer: defaults.disclaimer ?? MARKET_DATA_DISCLAIMER,
  }
}

function extractRemoteRows(payload: unknown): Record<string, unknown>[] {
  if (Array.isArray(payload)) {
    return payload.filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object')
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>
    const candidates = [record.quotes, record.data, record.results, record.stocks]
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate.filter(
          (row): row is Record<string, unknown> => Boolean(row) && typeof row === 'object',
        )
      }
    }
  }

  return []
}

async function fetchRemoteQuotes(
  endpoint: string,
  headers: Record<string, string>,
  defaults: Partial<MarketQuote>,
): Promise<MarketQuote[]> {
  const response = await fetch(endpoint, { headers })
  if (!response.ok) {
    throw new Error(`Market data request failed (${response.status})`)
  }

  const payload = (await response.json()) as unknown
  const rows = extractRemoteRows(payload)
  const quotes: MarketQuote[] = []

  for (const row of rows) {
    const normalized = normalizeRemoteRow(row, defaults)
    if (normalized) quotes.push(normalized)
  }

  return quotes
}

function mergeWithMockFallback(remoteQuotes: MarketQuote[]): MarketQuote[] {
  const remoteByTicker = new Map(remoteQuotes.map((quote) => [quote.ticker.toUpperCase(), quote]))
  const catalogMock = buildMockMarketQuotes()
  const mergedCatalog = catalogMock.map(
    (mockQuote) => remoteByTicker.get(mockQuote.ticker.toUpperCase()) ?? mockQuote,
  )
  const catalogTickers = new Set(catalogMock.map((quote) => quote.ticker.toUpperCase()))
  const extras = remoteQuotes.filter((quote) => !catalogTickers.has(quote.ticker.toUpperCase()))
  return [...mergedCatalog, ...extras]
}

function readProxyUrl(): string | null {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, '')
  if (!supabaseUrl) return null
  return `${supabaseUrl}/functions/v1/dse-market-data`
}

interface ProxyMarketDataResponse {
  quotes: MarketQuote[]
  status: {
    mode?: string
    badge?: string
    sourceLabel?: string
    disclaimer?: string
    isMock?: boolean
    isLive?: boolean
    isDelayed?: boolean
    fellBackToMock?: boolean
    fellBackToCache?: boolean
    sourceUnavailable?: boolean
    configurationError?: string | null
    lastRefreshAt?: string
    quoteCount?: number
  }
}

function mapProxyBadge(badge: string | undefined): MarketDataBadgeLabel {
  if (badge === 'Experimental DSE Feed') return 'Experimental DSE Feed'
  if (badge === 'Experimental Feed') return 'Experimental Feed'
  if (badge === 'Licensed Feed') return 'Licensed Feed'
  if (badge === 'Delayed Data') return 'Delayed Data'
  if (badge === 'Data Unavailable') return 'Data Unavailable'
  return 'Prototype Data'
}

function mapProxyStatus(
  proxyStatus: ProxyMarketDataResponse['status'],
  mode: MarketDataMode,
  quoteCount: number,
): Partial<MarketDataStatus> {
  return {
    mode,
    badge: mapProxyBadge(proxyStatus.badge),
    sourceLabel: proxyStatus.sourceLabel ?? 'Prototype Data',
    disclaimer: proxyStatus.disclaimer ?? EXPERIMENTAL_DSE_DISCLAIMER,
    isMock: proxyStatus.isMock ?? true,
    isLive: proxyStatus.isLive ?? false,
    isDelayed: proxyStatus.isDelayed ?? true,
    configurationError: proxyStatus.configurationError ?? null,
    lastRefreshAt: proxyStatus.lastRefreshAt ?? new Date().toISOString(),
    fellBackToMock: proxyStatus.fellBackToMock ?? false,
    fellBackToCache: proxyStatus.fellBackToCache ?? false,
    sourceUnavailable: proxyStatus.sourceUnavailable ?? false,
    quoteCount,
  }
}

/**
 * Experimental DSE adapter for local testing only. Confirm licensing before production use.
 * Calls Supabase Edge Function proxy — never the upstream DSE host from the browser.
 */
async function fetchExperimentalQuotesViaProxy(stockId?: string): Promise<{
  quotes: MarketQuote[]
  status: Partial<MarketDataStatus>
}> {
  const proxyUrl = readProxyUrl()
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

  if (!proxyUrl || !anonKey) {
    throw new Error('Supabase proxy is not configured for experimental DSE market data.')
  }

  const url = new URL(proxyUrl)
  if (stockId) url.searchParams.set('stockId', stockId)

  const headers: Record<string, string> = {
    Accept: 'application/json',
    apikey: anonKey,
  }

  // Legacy anon JWT keys require Authorization; publishable keys may not be JWT-shaped.
  if (anonKey.startsWith('eyJ')) {
    headers.Authorization = `Bearer ${anonKey}`
  }

  const response = await fetch(url.toString(), { headers })

  if (!response.ok) {
    throw new Error(`Experimental DSE proxy failed (${response.status}).`)
  }

  const payload = (await response.json()) as ProxyMarketDataResponse
  const remoteQuotes = Array.isArray(payload.quotes) ? payload.quotes : []
  const quotes = remoteQuotes.length > 0 ? remoteQuotes : buildMockMarketQuotes()

  return {
    quotes,
    status: mapProxyStatus(payload.status ?? {}, 'experimental_dse', quotes.length),
  }
}

async function fetchLicensedQuotes(endpoint: string, apiKey: string): Promise<MarketQuote[]> {
  const remote = await fetchRemoteQuotes(
    endpoint,
    {
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    {
      source: 'licensed',
      sourceLabel: 'Licensed Feed',
      isLive: false,
      isDelayed: true,
      isMock: false,
      disclaimer: 'Market data provided by licensed feed for prototype evaluation.',
    },
  )

  if (remote.length === 0) {
    throw new Error('Licensed feed returned no valid quotes')
  }

  return mergeWithMockFallback(remote)
}

function cacheMockStatus(mode: MarketDataMode, fellBackToMock = false): MarketDataStatus {
  return {
    mode,
    badge: 'Prototype Data',
    sourceLabel: 'Prototype Data',
    disclaimer: MARKET_DATA_DISCLAIMER,
    isMock: true,
    isLive: false,
    isDelayed: true,
    configurationError: null,
    lastRefreshAt: new Date().toISOString(),
    fellBackToMock,
    quoteCount: quoteCache.size,
  }
}

export function getMarketDataMode(): MarketDataMode {
  return readEnvMode()
}

export function getMarketDataSourceLabel(): string {
  return lastStatus.sourceLabel
}

export function isMarketDataMock(): boolean {
  return lastStatus.isMock
}

export function getMarketDataStatus(): MarketDataStatus {
  return lastStatus
}

function findQuoteInCache(stockIdOrTicker: string): MarketQuote | null {
  const normalized = normalizeSecurityKey(stockIdOrTicker)
  const direct =
    quoteCache.get(normalized) ??
    quoteCache.get(stockIdOrTicker.toUpperCase()) ??
    quoteCache.get(stockIdOrTicker)

  if (direct) return direct

  for (const quote of quoteCache.values()) {
    if (quote.ticker.toUpperCase() === normalized) return quote
    if (normalizeSecurityKey(quote.stockId) === normalized) return quote
  }

  return null
}

export function getCachedMarketQuote(stockIdOrTicker: string): MarketQuote | null {
  return findQuoteInCache(stockIdOrTicker)
}

export function getAllCachedMarketQuotes(): MarketQuote[] {
  const seen = new Set<string>()
  const results: MarketQuote[] = []

  for (const quote of quoteCache.values()) {
    const key = quote.ticker.toUpperCase()
    if (seen.has(key)) continue
    seen.add(key)
    results.push(quote)
  }

  return results.sort((a, b) => a.ticker.localeCompare(b.ticker))
}

export async function getMarketQuote(stockId: string): Promise<MarketQuote | null> {
  if (readEnvMode() === 'experimental_dse' && isSupabaseConfigured()) {
    await refreshMarketQuotes(false, stockId)
  } else {
    await refreshMarketQuotes()
  }
  return getCachedMarketQuote(stockId)
}

export async function getMarketQuotes(): Promise<MarketQuote[]> {
  await refreshMarketQuotes()
  return getAllCachedMarketQuotes()
}

export async function refreshMarketQuotes(force = false, stockId?: string): Promise<MarketQuote[]> {
  if (!force && refreshPromise) return refreshPromise

  const stale = Date.now() - lastRefreshAt > REFRESH_TTL_MS
  const mode = readEnvMode()
  const cacheMatchesMode = lastStatus.mode === mode
  if (!force && quoteCache.size > 0 && !stale && !stockId && cacheMatchesMode) {
    return getAllCachedMarketQuotes()
  }

  refreshPromise = (async () => {
    const mode = readEnvMode()
    const endpoint = readEndpoint()
    const apiKey = readApiKey()

    if (mode === 'mock') {
      const quotes = buildMockMarketQuotes()
      setCache(quotes, cacheMockStatus('mock'))
      return quotes
    }

    if (mode === 'licensed') {
      if (!endpoint || !apiKey) {
        const quotes = buildMockMarketQuotes()
        setCache(quotes, {
          mode: 'licensed',
          badge: 'Data Unavailable',
          sourceLabel: 'Prototype Data',
          disclaimer: MARKET_DATA_DISCLAIMER,
          isMock: true,
          isLive: false,
          isDelayed: true,
          configurationError:
            'Licensed feed requires VITE_DSE_MARKET_DATA_ENDPOINT and VITE_DSE_MARKET_DATA_API_KEY.',
          fellBackToMock: true,
          quoteCount: quotes.length,
          lastRefreshAt: new Date().toISOString(),
        })
        return quotes
      }

      try {
        const quotes = await fetchLicensedQuotes(endpoint, apiKey)
        setCache(quotes, {
          mode: 'licensed',
          badge: 'Licensed Feed',
          sourceLabel: 'Licensed Feed',
          disclaimer: 'Market data provided by licensed feed for prototype evaluation.',
          isMock: false,
          isLive: false,
          isDelayed: true,
          configurationError: null,
          fellBackToMock: false,
          quoteCount: quotes.length,
          lastRefreshAt: new Date().toISOString(),
        })
        return quotes
      } catch {
        const quotes = buildMockMarketQuotes()
        setCache(quotes, {
          mode: 'licensed',
          badge: 'Delayed Data',
          sourceLabel: 'Prototype Data',
          disclaimer: MARKET_DATA_DISCLAIMER,
          isMock: true,
          isLive: false,
          isDelayed: true,
          configurationError: 'Licensed feed request failed. Showing prototype data.',
          fellBackToMock: true,
          quoteCount: quotes.length,
          lastRefreshAt: new Date().toISOString(),
        })
        return quotes
      }
    }

    if (!isSupabaseConfigured()) {
      const quotes = buildMockMarketQuotes()
      setCache(quotes, {
        mode: 'experimental_dse',
        badge: 'Prototype Data',
        sourceLabel: 'Prototype Data',
        disclaimer: EXPERIMENTAL_DSE_DISCLAIMER,
        isMock: true,
        isLive: false,
        isDelayed: true,
        configurationError:
          'Experimental DSE mode requires Supabase configuration. Upstream data is proxied server-side only.',
        fellBackToMock: true,
        sourceUnavailable: true,
        quoteCount: quotes.length,
        lastRefreshAt: new Date().toISOString(),
      })
      return quotes
    }

    try {
      const { quotes, status } = await fetchExperimentalQuotesViaProxy(stockId)
      setCache(quotes, status)
      return quotes
    } catch {
      const quotes = buildMockMarketQuotes()
      setCache(quotes, {
        mode: 'experimental_dse',
        badge: 'Prototype Data',
        sourceLabel: 'Prototype Data',
        disclaimer: EXPERIMENTAL_DSE_DISCLAIMER,
        isMock: true,
        isLive: false,
        isDelayed: true,
        configurationError: 'Experimental DSE proxy unavailable. Showing prototype mock quotes.',
        fellBackToMock: true,
        sourceUnavailable: true,
        quoteCount: quotes.length,
        lastRefreshAt: new Date().toISOString(),
      })
      return quotes
    }
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

export function applyQuoteToStock(stock: Stock): Stock {
  const quote = getCachedMarketQuote(stock.ticker) ?? getCachedMarketQuote(stock.id)
  if (!quote) return stock

  return {
    ...stock,
    id: stock.ticker.toUpperCase(),
    price: quote.lastPrice,
    change: quote.change,
    changePct: quote.changePercent,
  }
}

export function getStockPrice(stockId: string): number {
  const normalized = normalizeSecurityKey(stockId)
  return (
    getCachedMarketQuote(normalized)?.lastPrice ??
    getCachedMarketQuote(stockId)?.lastPrice ??
    getStock(stockId)?.price ??
    0
  )
}

export function getStockPriceOnDayIndex(
  stockId: string,
  dayIndex: number,
  historyLength: number,
): number {
  const normalized = normalizeSecurityKey(stockId)
  const stock = getStock(stockId) ?? stocks.find((entry) => entry.ticker.toUpperCase() === normalized)
  if (!stock) return getStockPrice(stockId)
  const prices = interpolatePoints(stock.chartPoints, historyLength)
  return prices[dayIndex] ?? getStockPrice(stockId)
}

export function getStockQuote(stockId: string): StockQuote | null {
  const quote = getCachedMarketQuote(stockId)
  if (!quote) return null

  return {
    stockId: quote.stockId,
    ticker: quote.ticker,
    price: quote.lastPrice,
    change: quote.change,
    changePct: quote.changePercent,
    source: quote.sourceLabel,
    asOf: quote.tradeTime,
    isMock: quote.isMock,
  }
}

export function listStockIds(): string[] {
  return stocks.map((stock) => stock.id)
}

export function getMarketDataBadgeLabel(): MarketDataBadgeLabel {
  return lastStatus.badge
}

export function isExperimentalMarketDataMode(): boolean {
  return readEnvMode() === 'experimental_dse'
}

export async function getMarketSnapshot(): Promise<{
  quotes: MarketQuote[]
  status: MarketDataStatus
}> {
  await refreshMarketQuotes()
  return {
    quotes: getAllCachedMarketQuotes(),
    status: getMarketDataStatus(),
  }
}

if (readEnvMode() === 'mock') {
  setCache(buildMockMarketQuotes(), cacheMockStatus('mock'))
}
