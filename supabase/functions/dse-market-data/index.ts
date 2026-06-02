/**
 * Experimental DSE market data proxy for Lenden closed beta.
 *
 * Unofficial source adapter for ShanjinurIslam/Dhaka-Stock-Exchange-style APIs.
 * Do not expose upstream URLs to the frontend. Confirm licensing before production use.
 *
 * Secrets (Supabase Dashboard → Edge Functions → Secrets):
 * - DSE_EXPERIMENTAL_BASE_URL  e.g. https://your-self-hosted-dse-api.example.com
 * - DSE_MARKET_DATA_MODE       experimental_dse
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { findCatalogEntry, EXPERIMENTAL_DSE_DISCLAIMER } from '../_shared/lendenCatalog.ts'
import {
  buildMockMarketQuotes,
  buildStatus,
  normalizeDseRow,
  normalizeLatestPricePayload,
  type MarketDataStatusPayload,
  type MarketQuote,
} from '../_shared/normalizeQuotes.ts'

const CACHE_ID = 'latest'
const UPSTREAM_TIMEOUT_MS = 15_000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TickerCacheRow {
  ticker: string
  stock_id: string
  name: string | null
  last_price: number
  change: number
  volume: number
  change_percent: number
  trade_time: string
  source: string
  source_label: string
  raw: Record<string, unknown> | null
  updated_at: string
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function getAdminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!url || !serviceRoleKey) {
    throw new Error('Supabase service role environment is unavailable.')
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function quoteToTickerRow(quote: MarketQuote): Record<string, unknown> {
  return {
    ticker: quote.ticker.toUpperCase(),
    stock_id: quote.stockId,
    name: quote.name,
    last_price: quote.lastPrice,
    change: quote.change,
    change_percent: quote.changePercent,
    volume: quote.volume,
    trade_time: quote.tradeTime,
    source: quote.source,
    source_label: quote.sourceLabel,
    raw: {
      stockId: quote.stockId,
      ticker: quote.ticker,
      lastPrice: quote.lastPrice,
      change: quote.change,
      changePercent: quote.changePercent,
      volume: quote.volume,
      tradeTime: quote.tradeTime,
    },
    updated_at: new Date().toISOString(),
  }
}

function tickerRowToQuote(row: TickerCacheRow): MarketQuote {
  return {
    stockId: row.stock_id,
    ticker: row.ticker.toUpperCase(),
    name: row.name ?? row.ticker,
    lastPrice: Number(row.last_price),
    change: Number(row.change),
    changePercent: Number(row.change_percent),
    volume: Number(row.volume),
    tradeTime: row.trade_time,
    source: row.source,
    sourceLabel: row.source_label,
    isLive: false,
    isDelayed: true,
    isMock: false,
    disclaimer: EXPERIMENTAL_DSE_DISCLAIMER,
  }
}

async function readAggregateCache(): Promise<{ quotes: MarketQuote[]; fetchedAt: string | null } | null> {
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('market_quotes_cache')
      .select('quotes, fetched_at')
      .eq('id', CACHE_ID)
      .maybeSingle()

    if (error || !data) return null

    return {
      quotes: Array.isArray(data.quotes) ? (data.quotes as MarketQuote[]) : [],
      fetchedAt: data.fetched_at ?? null,
    }
  } catch {
    return null
  }
}

async function readTickerCache(): Promise<{ quotes: MarketQuote[]; fetchedAt: string | null } | null> {
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('market_quotes_by_ticker')
      .select(
        'ticker, stock_id, name, last_price, change, change_percent, volume, trade_time, source, source_label, raw, updated_at',
      )
      .order('ticker', { ascending: true })

    if (error || !data?.length) return null

    const rows = data as TickerCacheRow[]
    const quotes = rows.map(tickerRowToQuote)
    const fetchedAt = rows.reduce<string | null>((latest, row) => {
      if (!latest) return row.updated_at
      return new Date(row.updated_at) > new Date(latest) ? row.updated_at : latest
    }, null)

    return { quotes, fetchedAt }
  } catch {
    return null
  }
}

async function readCachedQuotes(): Promise<{ quotes: MarketQuote[]; fetchedAt: string | null } | null> {
  const tickerCache = await readTickerCache()
  if (tickerCache && tickerCache.quotes.length > 0) return tickerCache

  const aggregateCache = await readAggregateCache()
  if (aggregateCache && aggregateCache.quotes.length > 0) return aggregateCache

  return null
}

async function writeAggregateCache(quotes: MarketQuote[], status: MarketDataStatusPayload) {
  try {
    const supabase = getAdminClient()
    await supabase.from('market_quotes_cache').upsert({
      id: CACHE_ID,
      quotes,
      status,
      fetched_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('market_quotes_cache write failed', error)
  }
}

async function writeTickerCache(quotes: MarketQuote[]) {
  if (quotes.length === 0) return

  try {
    const supabase = getAdminClient()
    const rows = quotes.map(quoteToTickerRow)
    const chunkSize = 100

    for (let index = 0; index < rows.length; index += chunkSize) {
      const chunk = rows.slice(index, index + chunkSize)
      const { error } = await supabase.from('market_quotes_by_ticker').upsert(chunk, {
        onConflict: 'ticker',
      })
      if (error) {
        console.error('market_quotes_by_ticker upsert failed', error)
        return
      }
    }
  } catch (error) {
    console.error('market_quotes_by_ticker write failed', error)
  }
}

async function persistLiveQuotes(quotes: MarketQuote[], status: MarketDataStatusPayload) {
  await Promise.all([writeTickerCache(quotes), writeAggregateCache(quotes, status)])
}

function cacheAgeMs(fetchedAt: string | null): number | null {
  if (!fetchedAt) return null
  return Math.max(0, Date.now() - new Date(fetchedAt).getTime())
}

function filterQuotesForStockId(quotes: MarketQuote[], stockId: string | null): MarketQuote[] {
  if (!stockId) return quotes

  const normalized = stockId.trim().toUpperCase()
  const entry = findCatalogEntry({ stockId })
  const ticker = entry?.ticker.toUpperCase() ?? normalized
  const filtered = quotes.filter(
    (quote) =>
      quote.stockId.toUpperCase() === normalized ||
      quote.ticker.toUpperCase() === ticker ||
      quote.ticker.toUpperCase() === normalized,
  )

  return filtered.length > 0 ? filtered : quotes
}

function markCachedQuotes(quotes: MarketQuote[]): MarketQuote[] {
  return quotes.map((quote) => ({
    ...quote,
    source: 'cache',
    sourceLabel: 'Cached Experimental DSE Feed',
    isMock: false,
    isDelayed: true,
  }))
}

async function fetchUpstream(path: string): Promise<unknown> {
  const baseUrl = Deno.env.get('DSE_EXPERIMENTAL_BASE_URL')?.replace(/\/$/, '')
  if (!baseUrl) {
    throw new Error('DSE_EXPERIMENTAL_BASE_URL is not configured.')
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS)

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })

    if (!response.ok) {
      throw new Error(`Upstream DSE request failed (${response.status})`)
    }

    return response.json()
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchLatestQuotes(): Promise<MarketQuote[]> {
  const payload = await fetchUpstream('/api/latest_price')
  const remoteQuotes = normalizeLatestPricePayload(payload)

  if (remoteQuotes.length === 0) {
    throw new Error('Upstream latest_price returned no recognizable Lenden tickers.')
  }

  return remoteQuotes
}

async function fetchSingleQuote(stockId: string): Promise<MarketQuote[]> {
  const catalogEntry = findCatalogEntry({ stockId })
  if (!catalogEntry) {
    throw new Error(`Unknown stockId: ${stockId}`)
  }

  const payload = await fetchUpstream(
    `/api/share_price?name=${encodeURIComponent(catalogEntry.ticker)}`,
  )

  if (!payload || typeof payload !== 'object') {
    throw new Error('Upstream share_price returned an invalid payload.')
  }

  const normalized = normalizeDseRow(payload as Record<string, unknown>, new Date().toISOString())
  if (!normalized) {
    throw new Error(`Could not normalize share_price for ${catalogEntry.ticker}.`)
  }

  const allQuotes = await fetchLatestQuotes().catch(() => [normalized])
  const merged = new Map(allQuotes.map((quote) => [quote.ticker.toUpperCase(), quote]))
  merged.set(normalized.ticker.toUpperCase(), normalized)
  return Array.from(merged.values())
}

function buildMockResponse(stockId: string | null, cachedQuotesCount: number): {
  quotes: MarketQuote[]
  status: MarketDataStatusPayload
} {
  const quotes = filterQuotesForStockId(buildMockMarketQuotes(), stockId)
  const status = buildStatus({
    mode: 'experimental_dse',
    badge: 'Prototype Data',
    sourceLabel: 'Prototype Data',
    disclaimer: EXPERIMENTAL_DSE_DISCLAIMER,
    isMock: true,
    fellBackToMock: true,
    fellBackToCache: false,
    sourceUnavailable: true,
    configurationError: 'Experimental DSE source unavailable and no cached quotes exist.',
    quoteCount: quotes.length,
    source: 'mock',
    liveQuotesCount: 0,
    cachedQuotesCount,
    returnedQuotesCount: quotes.length,
    cacheAgeMs: null,
  })

  return { quotes, status }
}

function buildCacheResponse(
  cached: { quotes: MarketQuote[]; fetchedAt: string | null },
  stockId: string | null,
  liveQuotesCount: number,
  errorMessage: string,
): { quotes: MarketQuote[]; status: MarketDataStatusPayload } {
  const cachedQuotes = markCachedQuotes(filterQuotesForStockId(cached.quotes, stockId))
  const ageMs = cacheAgeMs(cached.fetchedAt)

  const status = buildStatus({
    mode: 'experimental_dse',
    badge: 'Experimental DSE Feed',
    sourceLabel: 'Cached Experimental DSE Feed',
    disclaimer: EXPERIMENTAL_DSE_DISCLAIMER,
    isMock: false,
    fellBackToMock: false,
    fellBackToCache: true,
    sourceUnavailable: true,
    configurationError: errorMessage,
    quoteCount: cachedQuotes.length,
    source: 'cache',
    liveQuotesCount,
    cachedQuotesCount: cached.quotes.length,
    returnedQuotesCount: cachedQuotes.length,
    cacheAgeMs: ageMs,
  })

  return { quotes: cachedQuotes, status }
}

function buildLiveResponse(quotes: MarketQuote[], liveQuotesCount: number): {
  quotes: MarketQuote[]
  status: MarketDataStatusPayload
} {
  const status = buildStatus({
    mode: 'experimental_dse',
    badge: 'Experimental DSE Feed',
    sourceLabel: 'Experimental DSE Feed',
    disclaimer: EXPERIMENTAL_DSE_DISCLAIMER,
    isMock: false,
    fellBackToMock: false,
    fellBackToCache: false,
    sourceUnavailable: false,
    configurationError: null,
    quoteCount: quotes.length,
    source: 'live',
    liveQuotesCount,
    cachedQuotesCount: liveQuotesCount,
    returnedQuotesCount: quotes.length,
    cacheAgeMs: 0,
  })

  return { quotes, status }
}

async function resolveQuotes(stockId: string | null): Promise<{
  quotes: MarketQuote[]
  status: MarketDataStatusPayload
}> {
  const mode = Deno.env.get('DSE_MARKET_DATA_MODE')?.trim() ?? 'mock'
  const baseUrl = Deno.env.get('DSE_EXPERIMENTAL_BASE_URL')?.trim()

  if (mode !== 'experimental_dse' || !baseUrl) {
    const quotes = filterQuotesForStockId(buildMockMarketQuotes(), stockId)
    return {
      quotes,
      status: buildStatus({
        mode: mode === 'experimental_dse' ? 'experimental_dse' : 'mock',
        badge: 'Prototype Data',
        sourceLabel: 'Prototype Data',
        disclaimer: EXPERIMENTAL_DSE_DISCLAIMER,
        isMock: true,
        fellBackToMock: true,
        fellBackToCache: false,
        sourceUnavailable: mode === 'experimental_dse',
        configurationError:
          mode === 'experimental_dse'
            ? 'Experimental DSE proxy requires DSE_EXPERIMENTAL_BASE_URL and DSE_MARKET_DATA_MODE=experimental_dse.'
            : null,
        quoteCount: quotes.length,
        source: 'mock',
        liveQuotesCount: 0,
        cachedQuotesCount: 0,
        returnedQuotesCount: quotes.length,
        cacheAgeMs: null,
      }),
    }
  }

  try {
    const liveQuotes = stockId ? await fetchSingleQuote(stockId) : await fetchLatestQuotes()
    const quotes = filterQuotesForStockId(liveQuotes, stockId)

    if (quotes.length === 0) {
      throw new Error('Live upstream fetch returned no quotes.')
    }

    const { status } = buildLiveResponse(quotes, quotes.length)
    await persistLiveQuotes(quotes, status)
    return { quotes, status }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Experimental DSE upstream fetch failed.'
    console.error('Experimental DSE fetch failed', error)

    const cached = await readCachedQuotes()
    if (cached && cached.quotes.length > 0) {
      return buildCacheResponse(
        cached,
        stockId,
        0,
        `Experimental DSE source unavailable (${message}). Serving last known cached quotes.`,
      )
    }

    return buildMockResponse(stockId, 0)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    const url = new URL(req.url)
    const stockId = url.searchParams.get('stockId')

    const { quotes, status } = await resolveQuotes(stockId)

    if (quotes.length === 0) {
      const fallback = buildMockResponse(stockId, status.cachedQuotesCount ?? 0)
      return jsonResponse({ quotes: fallback.quotes, status: fallback.status })
    }

    console.log(
      JSON.stringify({
        event: 'dse_market_data_response',
        source: status.source,
        liveQuotesCount: status.liveQuotesCount,
        cachedQuotesCount: status.cachedQuotesCount,
        returnedQuotesCount: status.returnedQuotesCount,
        fellBackToCache: status.fellBackToCache,
        fellBackToMock: status.fellBackToMock,
      }),
    )

    return jsonResponse({ quotes, status })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected proxy error'
    const cached = await readCachedQuotes()

    if (cached && cached.quotes.length > 0) {
      const fallback = buildCacheResponse(cached, null, 0, message)
      return jsonResponse({ quotes: fallback.quotes, status: fallback.status })
    }

    const fallback = buildMockResponse(null, 0)
    return jsonResponse({
      quotes: fallback.quotes,
      status: {
        ...fallback.status,
        configurationError: message,
      },
    })
  }
})
