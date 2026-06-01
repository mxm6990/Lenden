import { stocks, type Stock } from '../data/stocks'
import {
  buildStockFromSecurity,
  LEGACY_STOCK_ID_MAP,
  normalizeSecurityKey,
  resolveStockSync,
} from '../lib/securityListing'
import { isSupabaseConfigured, getSupabaseClient } from '../lib/supabase'
import type { MarketQuote } from '../types/marketData'
import {
  getAllCachedMarketQuotes,
  getCachedMarketQuote,
  refreshMarketQuotes,
} from './marketDataProvider'
import type { Security, SecurityListing, SecuritiesCatalogSnapshot } from '../types/security'

export { LEGACY_STOCK_ID_MAP, normalizeSecurityKey }

const CACHE_TTL_MS = 5 * 60 * 1000
const FEATURED_TICKERS = ['GP', 'BRACBANK', 'SQURPHARMA', 'BATBC', 'RENATA', 'MARICO']

let cache: SecuritiesCatalogSnapshot | null = null
let loadPromise: Promise<SecuritiesCatalogSnapshot> | null = null

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
    ticker: row.ticker.toUpperCase(),
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
  if (!force && cache && Date.now() - new Date(cache.loadedAt).getTime() < CACHE_TTL_MS) {
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

export function buildQuotesByTicker(quotes: MarketQuote[] = getAllCachedMarketQuotes()): Map<string, MarketQuote> {
  const map = new Map<string, MarketQuote>()
  for (const quote of quotes) {
    map.set(quote.ticker.toUpperCase(), quote)
  }
  return map
}

function findQuoteForSecurity(
  security: Security,
  quotesByTicker: Map<string, MarketQuote>,
): MarketQuote | undefined {
  return quotesByTicker.get(security.ticker.toUpperCase()) ?? getCachedMarketQuote(security.ticker) ?? undefined
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
  quotesByTicker: Map<string, MarketQuote> = buildQuotesByTicker(),
): SecurityListing {
  const quote = findQuoteForSecurity(security, quotesByTicker)

  return {
    ...security,
    hasQuote: Boolean(quote),
    lastPrice: quote ? quote.lastPrice : null,
    change: quote?.change ?? null,
    changePct: quote?.changePercent ?? null,
    sourceLabel: quote?.sourceLabel ?? 'Prototype Data',
    volume: quote?.volume ?? null,
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
  await refreshMarketQuotes()
  await refreshSecurityCatalog()
  const quotesByTicker = buildQuotesByTicker()
  const trimmedQuery = query.trim()
  const securities = trimmedQuery ? await searchSecurities(trimmedQuery) : await getAllSecurities()
  const sorted = trimmedQuery
    ? [...securities].sort(
        (left, right) => rankSearchResult(left, trimmedQuery) - rankSearchResult(right, trimmedQuery),
      )
    : securities
  logMarketQuoteMergeAudit(sorted, quotesByTicker)
  return sorted.map((security) => securityToListing(security, quotesByTicker))
}

export function securityToStock(security: Security, listing?: Partial<SecurityListing>): Stock {
  const quote = getCachedMarketQuote(security.ticker)
  const fallback = stocks.find((stock) => stock.ticker.toUpperCase() === security.ticker)
  const stock = buildStockFromSecurity(security, quote, fallback)

  if (!listing) return stock

  return {
    ...stock,
    price: listing.lastPrice ?? stock.price,
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
