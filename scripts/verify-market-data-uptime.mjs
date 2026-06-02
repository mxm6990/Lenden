#!/usr/bin/env node
/**
 * Verify market data uptime: edge function source + sample prices + optional DB cache count.
 *
 * Usage:
 *   node scripts/verify-market-data-uptime.mjs
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const envPath = resolve(root, '.env.local')
const SAMPLE_TICKERS = ['GP', 'BRACBANK', 'SQURPHARMA', 'BATBC']

function readEnv(key) {
  if (!existsSync(envPath)) return null
  const env = readFileSync(envPath, 'utf8')
  const match = env.match(new RegExp(`^${key}=(.+)$`, 'm'))
  return match?.[1]?.trim().replace(/^["']|["']$/g, '') ?? null
}

function quoteMap(quotes) {
  const map = new Map()
  for (const quote of quotes) {
    if (quote?.ticker) map.set(String(quote.ticker).toUpperCase(), quote)
    if (quote?.stockId) map.set(String(quote.stockId).toUpperCase(), quote)
  }
  return map
}

async function fetchEdgeFunction(url, anonKey) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  })

  const text = await response.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = { raw: text.slice(0, 400) }
  }

  return { ok: response.ok, status: response.status, json }
}

async function fetchCacheCount(supabaseUrl, anonKey) {
  const response = await fetch(`${supabaseUrl}/rest/v1/market_quotes_by_ticker?select=ticker`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Prefer: 'count=exact',
    },
  })

  const contentRange = response.headers.get('content-range')
  const count = contentRange?.split('/')?.[1]
  return {
    ok: response.ok,
    status: response.status,
    count: count && count !== '*' ? Number(count) : null,
    note: response.ok ? null : 'Table may be service-role only (expected) or migration 010 not applied.',
  }
}

async function main() {
  const supabaseUrl = readEnv('VITE_SUPABASE_URL')?.replace(/\/$/, '')
  const anonKey = readEnv('VITE_SUPABASE_ANON_KEY')

  console.log('Market data uptime verification')
  console.log('───────────────────────────────')

  if (!supabaseUrl || !anonKey) {
    console.log('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local')
    process.exit(1)
  }

  const edgeUrl = `${supabaseUrl}/functions/v1/dse-market-data`
  const edge = await fetchEdgeFunction(edgeUrl, anonKey)

  console.log(`${edge.ok ? '✅' : '❌'} Edge function (${edge.status})`)
  if (!edge.ok) {
    console.log(`   ${JSON.stringify(edge.json)}`)
    process.exit(1)
  }

  const quotes = Array.isArray(edge.json?.quotes) ? edge.json.quotes : []
  const status = edge.json?.status ?? {}
  const source = status.source ?? (status.fellBackToCache ? 'cache' : status.fellBackToMock ? 'mock' : 'live')
  const byTicker = quoteMap(quotes)

  console.log(`   source=${source}`)
  console.log(`   liveQuotesCount=${status.liveQuotesCount ?? 'n/a'}`)
  console.log(`   cachedQuotesCount=${status.cachedQuotesCount ?? 'n/a'}`)
  console.log(`   returnedQuotesCount=${status.returnedQuotesCount ?? quotes.length}`)
  console.log(`   fellBackToCache=${status.fellBackToCache ?? false}`)
  console.log(`   fellBackToMock=${status.fellBackToMock ?? false}`)
  console.log(`   sourceLabel=${status.sourceLabel ?? 'n/a'}`)
  if (status.cacheAgeMs != null) {
    console.log(`   cacheAgeMinutes=${Math.round(Number(status.cacheAgeMs) / 60_000)}`)
  }

  console.log('')
  console.log('Sample prices:')
  for (const ticker of SAMPLE_TICKERS) {
    const quote = byTicker.get(ticker)
    console.log(`   ${ticker}: ${quote?.lastPrice ?? '—'}`)
  }

  console.log('')
  const cache = await fetchCacheCount(supabaseUrl, anonKey)
  if (cache.ok && cache.count != null) {
    console.log(`✅ market_quotes_by_ticker rows (via REST): ${cache.count}`)
  } else {
    console.log(`⚠️  market_quotes_by_ticker count unavailable (${cache.status})`)
    if (cache.note) console.log(`   ${cache.note}`)
    console.log('   Apply migration 010 and redeploy dse-market-data, then re-run after a successful live fetch.')
  }

  if (quotes.length === 0) {
    console.log('')
    console.log('❌ Edge function returned zero quotes — cache fallback or mock should have prevented this.')
    process.exit(1)
  }

  console.log('')
  console.log('✅ Market data uptime check complete.')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
