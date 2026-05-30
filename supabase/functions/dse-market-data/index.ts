/**
 * Experimental DSE market data proxy for Lenden closed beta.
 *
 * Unofficial source adapter for ShanjinurIslam/Dhaka-Stock-Exchange-style APIs.
 * Do not expose upstream URLs to the frontend. Confirm licensing before production.
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
  mergeQuotesWithCatalog,
  normalizeDseRow,
  normalizeLatestPricePayload,
  type MarketDataStatusPayload,
  type MarketQuote,
} from '../_shared/normalizeQuotes.ts'

const CACHE_ID = 'latest'
const CACHE_TTL_MS = 5 * 60 * 1000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

async function readCache(): Promise<{ quotes: MarketQuote[]; fetchedAt: string | null } | null> {
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

async function writeCache(quotes: MarketQuote[], status: MarketDataStatusPayload) {
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

function isCacheRecent(fetchedAt: string | null) {
  if (!fetchedAt) return false
  return Date.now() - new Date(fetchedAt).getTime() <= CACHE_TTL_MS
}

async function fetchUpstream(path: string): Promise<unknown> {
  const baseUrl = Deno.env.get('DSE_EXPERIMENTAL_BASE_URL')?.replace(/\/$/, '')
  if (!baseUrl) {
    throw new Error('DSE_EXPERIMENTAL_BASE_URL is not configured.')
  }

  const response = await fetch(`${baseUrl}${path}`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Upstream DSE request failed (${response.status})`)
  }

  return response.json()
}

async function fetchLatestQuotes(): Promise<MarketQuote[]> {
  const payload = await fetchUpstream('/api/latest_price')
  const remoteQuotes = normalizeLatestPricePayload(payload)

  if (remoteQuotes.length === 0) {
    throw new Error('Upstream latest_price returned no recognizable Lenden tickers.')
  }

  return mergeQuotesWithCatalog(remoteQuotes)
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

  const allQuotes = await fetchLatestQuotes().catch(() => mergeQuotesWithCatalog([normalized]))
  const merged = new Map(allQuotes.map((quote) => [quote.stockId, quote]))
  merged.set(normalized.stockId, normalized)
  return mergeQuotesWithCatalog(Array.from(merged.values()))
}

async function resolveQuotes(stockId: string | null): Promise<{
  quotes: MarketQuote[]
  status: MarketDataStatusPayload
}> {
  const mode = Deno.env.get('DSE_MARKET_DATA_MODE')?.trim() ?? 'mock'
  const baseUrl = Deno.env.get('DSE_EXPERIMENTAL_BASE_URL')?.trim()

  if (mode !== 'experimental_dse' || !baseUrl) {
    const quotes = buildMockMarketQuotes()
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
      }),
    }
  }

  try {
    const quotes = stockId ? await fetchSingleQuote(stockId) : await fetchLatestQuotes()
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
    })

    await writeCache(quotes, status)
    return { quotes, status }
  } catch (error) {
    console.error('Experimental DSE fetch failed', error)

    const cached = await readCache()
    if (cached && isCacheRecent(cached.fetchedAt) && cached.quotes.length > 0) {
      const quotes = stockId
        ? mergeQuotesWithCatalog(
            cached.quotes.filter((quote) => quote.stockId === stockId).length > 0
              ? cached.quotes.filter((quote) => quote.stockId === stockId)
              : cached.quotes,
          )
        : mergeQuotesWithCatalog(cached.quotes)

      return {
        quotes,
        status: buildStatus({
          mode: 'experimental_dse',
          badge: 'Experimental DSE Feed',
          sourceLabel: 'Experimental DSE Feed',
          disclaimer: EXPERIMENTAL_DSE_DISCLAIMER,
          isMock: quotes.some((quote) => quote.isMock),
          fellBackToMock: false,
          fellBackToCache: true,
          sourceUnavailable: true,
          configurationError: 'Experimental DSE source unavailable. Serving recent cached quotes.',
          quoteCount: quotes.length,
        }),
      }
    }

    const quotes = buildMockMarketQuotes()
    return {
      quotes,
      status: buildStatus({
        mode: 'experimental_dse',
        badge: 'Prototype Data',
        sourceLabel: 'Prototype Data',
        disclaimer: EXPERIMENTAL_DSE_DISCLAIMER,
        isMock: true,
        fellBackToMock: true,
        fellBackToCache: false,
        sourceUnavailable: true,
        configurationError: 'Experimental DSE source unavailable. Showing prototype mock quotes.',
        quoteCount: quotes.length,
      }),
    }
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
    return jsonResponse({ quotes, status })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected proxy error'
    const quotes = buildMockMarketQuotes()

    return jsonResponse({
      quotes,
      status: buildStatus({
        mode: 'experimental_dse',
        badge: 'Prototype Data',
        sourceLabel: 'Prototype Data',
        disclaimer: EXPERIMENTAL_DSE_DISCLAIMER,
        isMock: true,
        fellBackToMock: true,
        fellBackToCache: false,
        sourceUnavailable: true,
        configurationError: message,
        quoteCount: quotes.length,
      }),
    })
  }
})
