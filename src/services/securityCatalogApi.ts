import { stocks, type Stock } from '../data/stocks'
import {
  buildStockFromSecurity,
  LEGACY_STOCK_ID_MAP,
  normalizeSecurityKey,
  resolveStockSync,
} from '../lib/securityListing'
import {
  buildQuotesByTickerMap,
  coerceMarketQuote,
  findQuoteForTicker,
} from '../lib/marketQuoteMerge'
import { isDemoMode, shouldUseSupabase } from '../lib/marketSession'
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabase'
import type { MarketDataStatus, MarketQuote } from '../types/marketData'
import {
  getAllCachedMarketQuotes,
  getCachedMarketQuote,
  getMarketDataMode,
  getMarketDataStatus,
  getMarketSnapshot,
  refreshMarketQuotes,
} from './marketDataProvider'
import type { Security, SecurityListing, SecuritiesCatalogSnapshot } from '../types/security'

export { LEGACY_STOCK_ID_MAP, normalizeSecurityKey }

const CACHE_TTL_MS = 5 * 60 * 1000
const FEATURED_TICKERS = ['GP', 'BRACBANK', 'SQURPHARMA', 'BATBC', 'RENATA', 'MARICO']

let cache: SecuritiesCatalogSnapshot | null = null
let loadPromise: Promise<SecuritiesCatalogSnapshot> | null = null
let cachedCatalogAuthKey: string | null | undefined

async function readCatalogAuthKey(): Promise<string | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user?.id ?? null
}

interface SecurityRow {
  id: string
  ticker: string
  company_name: string
  sector: string | null
  exchange: string
  is_active: boolean
}

function mapRow(row: SecurityRow): Security {
  return {
    id: row.id,
    ticker: row.ticker.trim().toUpperCase(),
    companyName: row.company_name,
    sector: row.sector,
    exchange: row.exchange,
    isActive: row.is_active,
  }
}

function fallbackSecurities(): Security[] {
  return stocks.map((stock) => ({
    id: `legacy:${stock.ticker}`,
    ticker: stock.ticker.toUpperCase(),
    companyName: stock.name,
    sector: stock.sector,
    exchange: 'DSE',
    isActive: true,
  }))
}

async function fetchFromSupabase(): Promise<Security[]> {
  const supabase = getSupabaseClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from('securities')
    .select('id, ticker, company_name, sector, exchange, is_active')
    .eq('is_active', true)
    .order('ticker', { ascending: true })

  if (error || !data?.length) return []
  return (data as SecurityRow[]).map(mapRow)
}

async function fetchFromQuoteProxy(): Promise<Security[]> {
  await refreshMarketQuotes()
  const seen = new Set<string>()
  const results: Security[] = []

  for (const quote of getAllCachedMarketQuotes()) {
    const ticker = quote.ticker.toUpperCase()
    if (seen.has(ticker)) continue
    seen.add(ticker)
    results.push({
      id: `quote:${ticker}`,
      ticker,
      companyName: quote.name || ticker,
      sector: null,
      exchange: 'DSE',
      isActive: true,
    })
  }

  return results.sort((a, b) => a.ticker.localeCompare(b.ticker))
}

export async function refreshSecurityCatalog(force = false): Promise<SecuritiesCatalogSnapshot> {
  const authKey = await readCatalogAuthKey()
  const authChanged = cachedCatalogAuthKey !== undefined && cachedCatalogAuthKey !== authKey
  cachedCatalogAuthKey = authKey

  if (!force && !authChanged && cache && Date.now() - new Date(cache.loadedAt).getTime() < CACHE_TTL_MS) {
    return cache
  }

  if (!force && loadPromise) return loadPromise

  loadPromise = (async () => {
    let securities: Security[] = []
    let source: SecuritiesCatalogSnapshot['source'] = 'fallback'

    if (isSupabaseConfigured()) {
      securities = await fetchFromSupabase()
      if (securities.length > 0) source = 'supabase'
    }

    if (securities.length === 0) {
      securities = await fetchFromQuoteProxy()
      if (securities.length > 0) source = 'quotes'
    }

    if (securities.length === 0) {
      securities = fallbackSecurities()
      source = 'fallback'
    }

    cache = {
      securities,
      source,
      loadedAt: new Date().toISOString(),
    }

    return cache
  })()

  try {
    return await loadPromise
  } finally {
    loadPromise = null
  }
}

export function getCachedSecurities(): Security[] {
  return cache?.securities ?? fallbackSecurities()
}

export function getSecurityCatalogSource(): SecuritiesCatalogSnapshot['source'] {
  return cache?.source ?? 'fallback'
}

export function getSecurityCount(): number {
  return getCachedSecurities().length
}

export async function getAllSecurities(): Promise<Security[]> {
  const snapshot = await refreshSecurityCatalog()
  return snapshot.securities
}

export async function searchSecurities(query: string): Promise<Security[]> {
  const all = await getAllSecurities()
  const q = query.trim().toLowerCase()
  if (!q) return all
  return all.filter(
    (security) =>
      security.ticker.toLowerCase().includes(q) ||
      security.companyName.toLowerCase().includes(q),
  )
}

function findInCacheByKey(key: string): Security | null {
  const normalized = normalizeSecurityKey(key)
  const securities = getCachedSecurities()
  return (
    securities.find(
      (security) =>
        security.id === key ||
        security.ticker === normalized ||
        security.ticker.toLowerCase() === key.toLowerCase(),
    ) ?? null
  )
}

export async function getSecurityByTicker(ticker: string): Promise<Security | null> {
  await refreshSecurityCatalog()
  return findInCacheByKey(ticker)
}

export async function getSecurityById(id: string): Promise<Security | null> {
  await refreshSecurityCatalog()
  return findInCacheByKey(id)
}

export async function getFeaturedSecurities(): Promise<Security[]> {
  await refreshSecurityCatalog()
  const securities = getCachedSecurities()
  const featured = FEATURED_TICKERS.map((ticker) =>
    securities.find((security) => security.ticker === ticker),
  ).filter((security): security is Security => Boolean(security))

  return featured.length > 0 ? featured : securities.slice(0, 6)
}

export function buildQuotesByTicker(quotes: MarketQuote[]): Map<string, MarketQuote> {
  return buildQuotesByTickerMap(quotes)
}

function resolveListingQuote(
  quote: MarketQuote | undefined,
  status: MarketDataStatus,
): MarketQuote | null {
  if (!quote) return null

  const coerced = coerceMarketQuote(quote)
  if (!coerced) return null

  if (status.mode === 'experimental_dse' && coerced.isMock && !status.fellBackToMock) {
    return null
  }

  return coerced
}

async function resolveQuotesForListings(): Promise<{ quotes: MarketQuote[]; status: MarketDataStatus }> {
  const snapshot = await getMarketSnapshot()
  if (snapshot.quotes.length > 0) {
    return snapshot
  }

  await refreshMarketQuotes()
  return {
    quotes: getAllCachedMarketQuotes(),
    status: getMarketDataStatus(),
  }
}

function findQuoteForSecurity(
  security: Security,
  quotesByTicker: Map<string, MarketQuote>,
): MarketQuote | undefined {
  return (
    findQuoteForTicker(security.ticker, quotesByTicker) ??
    (() => {
      const cached = getCachedMarketQuote(security.ticker)
      return cached ? coerceMarketQuote(cached) ?? undefined : undefined
    })()
  )
}

function logAuthenticatedMarketListingAudit(
  securities: Security[],
  listings: SecurityListing[],
  quotesByTicker: Map<string, MarketQuote>,
  quotesCount: number,
): void {
  if (!import.meta.env.DEV) return

  void shouldUseSupabase().then((useSupabase) => {
    let zeroPriceListingsCount = 0
    const missingQuoteSample: string[] = []
    const sampleListings: Record<string, Pick<SecurityListing, 'hasQuote' | 'lastPrice' | 'sourceLabel'>> =
      {}

    for (const listing of listings) {
      if (listing.hasQuote && listing.lastPrice === 0) zeroPriceListingsCount += 1
      if (!listing.hasQuote && missingQuoteSample.length < 5) {
        missingQuoteSample.push(listing.ticker)
      }
    }

    for (const ticker of ['GP', 'BRACBANK', 'SQURPHARMA', 'BATBC']) {
      const listing = listings.find((entry) => entry.ticker === ticker)
      sampleListings[ticker] = listing
        ? {
            hasQuote: listing.hasQuote,
            lastPrice: listing.lastPrice,
            sourceLabel: listing.sourceLabel,
          }
        : { hasQuote: false, lastPrice: null, sourceLabel: 'missing listing' }
    }

    console.group('Authenticated market listing audit')
    console.log({
      isDemo: isDemoMode(),
      shouldUseSupabase: useSupabase,
      securitiesCount: securities.length,
      quotesCount,
      listingsCount: listings.length,
      pricedListingsCount: listings.filter((listing) => listing.hasQuote).length,
      zeroPriceListingsCount,
      missingQuoteSample,
      sampleListings,
      sampleQuoteMap: Object.fromEntries(
        ['GP', 'BRACBANK', 'SQURPHARMA', 'BATBC'].map((ticker) => [
          ticker,
          quotesByTicker.get(ticker)?.lastPrice ?? null,
        ]),
      ),
    })
    console.groupEnd()
  })
}

function logMarketQuoteMergeAudit(
  securities: Security[],
  quotesByTicker: Map<string, MarketQuote>,
): void {
  if (!import.meta.env.DEV) return

  let matchedCount = 0
  let zeroPriceQuoteCount = 0
  const missingQuoteSample: string[] = []
  const sampleMatches: Record<string, number | null> = {}

  for (const security of securities) {
    const key = security.ticker.toUpperCase()
    const quote = quotesByTicker.get(key)
    if (quote) {
      matchedCount += 1
      if (quote.lastPrice === 0) zeroPriceQuoteCount += 1
    } else if (missingQuoteSample.length < 5) {
      missingQuoteSample.push(key)
    }
  }

  for (const ticker of ['GP', 'BRACBANK', 'SQURPHARMA', 'BATBC']) {
    const quote = quotesByTicker.get(ticker)
    sampleMatches[ticker] = quote?.lastPrice ?? null
  }

  console.group('Market quote merge audit')
  console.log({
    securitiesCount: securities.length,
    quotesCount: quotesByTicker.size,
    matchedCount,
    zeroPriceQuoteCount,
    missingQuoteSample,
    sampleMatches,
  })
  console.groupEnd()
}

export function securityToListing(
  security: Security,
  quotesByTicker: Map<string, MarketQuote>,
  status: MarketDataStatus = getMarketDataStatus(),
): SecurityListing {
  const quote = findQuoteForSecurity(security, quotesByTicker)
  const displayQuote = resolveListingQuote(quote, status)

  return {
    ...security,
    hasQuote: displayQuote !== null,
    lastPrice: displayQuote?.lastPrice ?? null,
    change: displayQuote?.change ?? null,
    changePct: displayQuote?.changePercent ?? null,
    sourceLabel: displayQuote?.sourceLabel ?? status.sourceLabel ?? 'Prototype Data',
    volume: displayQuote?.volume ?? null,
    quoteTradeTime: displayQuote?.tradeTime ?? null,
  }
}

export interface SecurityListingsLoadResult {
  listings: SecurityListing[]
  quotesCount: number
  matchedCount: number
  pricesUnavailable: boolean
  usingCachedPrices: boolean
  stalePrices: boolean
  status: MarketDataStatus
}

export async function loadSecurityListingsWithMeta(query = ''): Promise<SecurityListingsLoadResult> {
  const { quotes, status } = await resolveQuotesForListings()
  const useSupabase = await shouldUseSupabase()
  await refreshSecurityCatalog(useSupabase)
  const quotesByTicker = buildQuotesByTicker(quotes)
  const trimmedQuery = query.trim()
  const securities = trimmedQuery ? await searchSecurities(trimmedQuery) : await getAllSecurities()
  const sorted = trimmedQuery
    ? [...securities].sort(
        (left, right) => rankSearchResult(left, trimmedQuery) - rankSearchResult(right, trimmedQuery),
      )
    : securities

  logMarketQuoteMergeAudit(sorted, quotesByTicker)

  const listings = sorted.map((security) => securityToListing(security, quotesByTicker, status))
  logAuthenticatedMarketListingAudit(sorted, listings, quotesByTicker, quotes.length)

  const matchedCount = listings.filter((listing) => listing.hasQuote).length
  const usingCachedPrices = Boolean(status.fellBackToCache || status.source === 'cache')
  const pricesUnavailable =
    getMarketDataMode() === 'experimental_dse' &&
    (status.fellBackToMock || status.source === 'mock' || (quotes.length === 0 && matchedCount === 0))
  const stalePrices =
    usingCachedPrices &&
    typeof status.cacheAgeMs === 'number' &&
    status.cacheAgeMs > 24 * 60 * 60 * 1000

  return {
    listings,
    quotesCount: quotes.length,
    matchedCount,
    pricesUnavailable,
    usingCachedPrices,
    stalePrices,
    status,
  }
}

function rankSearchResult(security: Security, query: string): number {
  const q = query.trim().toLowerCase()
  if (!q) return 0

  const ticker = security.ticker.toLowerCase()
  const name = security.companyName.toLowerCase()

  if (ticker === q) return 0
  if (ticker.startsWith(q)) return 1
  if (name.startsWith(q)) return 2
  if (ticker.includes(q)) return 3
  if (name.includes(q)) return 4
  return 5
}

export async function getSecurityListings(query = ''): Promise<SecurityListing[]> {
  const result = await loadSecurityListingsWithMeta(query)
  return result.listings
}

export function securityToStock(security: Security, listing?: Partial<SecurityListing>): Stock {
  const quote = getCachedMarketQuote(security.ticker)
  const coercedQuote = quote ? coerceMarketQuote(quote) : null
  const fallback = stocks.find((stock) => stock.ticker.toUpperCase() === security.ticker)
  const stock = buildStockFromSecurity(security, coercedQuote, fallback)

  if (!listing) return stock

  return {
    ...stock,
    price:
      listing.hasQuote === true && typeof listing.lastPrice === 'number'
        ? listing.lastPrice
        : stock.price,
    change: listing.change ?? stock.change,
    changePct: listing.changePct ?? stock.changePct,
  }
}

export async function resolveStockForTrading(key: string): Promise<Stock | null> {
  await refreshSecurityCatalog()
  const security = findInCacheByKey(key)
  return resolveStockSync(key, security)
}

export async function ensureSecurityCatalogLoaded(): Promise<void> {
  await refreshSecurityCatalog()
}
