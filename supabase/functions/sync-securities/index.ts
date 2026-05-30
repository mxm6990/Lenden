/**
 * Sync DSE securities universe from experimental upstream into public.securities.
 * Unofficial data — closed beta only.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { findCatalogEntry } from '../_shared/lendenCatalog.ts'
import { extractDseRows } from '../_shared/normalizeQuotes.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompanyListEntry {
  TRADING_CODE?: string
  trading_code?: string
  ticker?: string
  COMPANY_NAME?: string
  company_name?: string
  name?: string
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

function normalizeTicker(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const ticker = value.trim().toUpperCase()
  return ticker.length > 0 ? ticker : null
}

function asString(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function deriveTicker(row: Record<string, unknown>): string | null {
  return normalizeTicker(
    row.TRADING_CODE ?? row.trading_code ?? row.ticker ?? row.Ticker ?? row.SYMBOL ?? row.symbol,
  )
}

function deriveCompanyName(
  row: Record<string, unknown>,
  ticker: string,
  companyNames: Map<string, string>,
): string {
  const catalogEntry = findCatalogEntry({ ticker })
  return (
    catalogEntry?.name ??
    companyNames.get(ticker) ??
    asString(row.COMPANY_NAME) ??
    asString(row.company_name) ??
    asString(row.name) ??
    asString(row.COMPANY) ??
    asString(row.company) ??
    ticker
  )
}

async function fetchUpstream(path: string): Promise<unknown> {
  const baseUrl = Deno.env.get('DSE_EXPERIMENTAL_BASE_URL')?.replace(/\/$/, '')
  if (!baseUrl) throw new Error('DSE_EXPERIMENTAL_BASE_URL is not configured.')

  const response = await fetch(`${baseUrl}${path}`, { headers: { Accept: 'application/json' } })
  if (!response.ok) {
    throw new Error(`Upstream request failed (${response.status}) for ${path}`)
  }
  return response.json()
}

async function loadCompanyNames(): Promise<Map<string, string>> {
  const names = new Map<string, string>()

  try {
    const payload = await fetchUpstream('/api/company_list')
    if (!Array.isArray(payload)) return names

    for (const entry of payload) {
      if (!entry || typeof entry !== 'object') continue
      const record = entry as CompanyListEntry
      const ticker = normalizeTicker(record.TRADING_CODE ?? record.trading_code ?? record.ticker)
      if (!ticker) continue

      const companyName =
        asString(record.COMPANY_NAME) ??
        asString(record.company_name) ??
        asString(record.name) ??
        ticker

      names.set(ticker, companyName)
    }
  } catch (error) {
    console.warn('company_list unavailable', error)
  }

  return names
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST' && req.method !== 'GET') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const mode = Deno.env.get('DSE_MARKET_DATA_MODE')?.trim() ?? 'mock'
  if (mode !== 'experimental_dse') {
    return jsonResponse({
      ok: false,
      inserted: 0,
      updated: 0,
      skipped: 0,
      totalProcessed: 0,
      firstFiveSkippedReasons: [],
      sampleAcceptedRows: [],
      message: 'Set DSE_MARKET_DATA_MODE=experimental_dse to run sync.',
    })
  }

  try {
    const supabase = getAdminClient()
    const [latestPayload, companyNames] = await Promise.all([
      fetchUpstream('/api/latest_price'),
      loadCompanyNames(),
    ])

    const rows = extractDseRows(latestPayload)
    let inserted = 0
    let updated = 0
    let skipped = 0
    const firstFiveSkippedReasons: string[] = []
    const sampleAcceptedRows: Array<{ ticker: string; company_name: string }> = []

    const recordSkip = (reason: string) => {
      skipped++
      if (firstFiveSkippedReasons.length < 5) {
        firstFiveSkippedReasons.push(reason)
      }
    }

    for (const row of rows) {
      const ticker = deriveTicker(row)
      if (!ticker) {
        recordSkip('missing_ticker')
        continue
      }

      const companyName = deriveCompanyName(row, ticker, companyNames)
      const now = new Date().toISOString()

      const { data: existing, error: selectError } = await supabase
        .from('securities')
        .select('id, company_name, sector, exchange, is_active')
        .eq('ticker', ticker)
        .maybeSingle()

      if (selectError) {
        recordSkip(`select_error:${selectError.message}`)
        continue
      }

      const payload = {
        ticker,
        company_name: companyName,
        sector: existing?.sector ?? null,
        exchange: 'DSE',
        is_active: true,
        updated_at: now,
      }

      const { error: upsertError } = await supabase
        .from('securities')
        .upsert(payload, { onConflict: 'ticker' })

      if (upsertError) {
        recordSkip(`upsert_error:${ticker}:${upsertError.message}`)
        continue
      }

      if (existing) {
        const unchanged =
          existing.company_name === companyName &&
          existing.exchange === 'DSE' &&
          existing.is_active === true

        if (!unchanged) {
          updated++
        }
      } else {
        inserted++
      }

      if (sampleAcceptedRows.length < 5) {
        sampleAcceptedRows.push({ ticker, company_name: companyName })
      }
    }

    const summary = {
      ok: true,
      inserted,
      updated,
      skipped,
      totalProcessed: rows.length,
      firstFiveSkippedReasons,
      sampleAcceptedRows,
      syncedAt: new Date().toISOString(),
    }

    console.log('sync-securities summary', summary)
    return jsonResponse(summary)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed'
    return jsonResponse(
      {
        ok: false,
        inserted: 0,
        updated: 0,
        skipped: 0,
        totalProcessed: 0,
        firstFiveSkippedReasons: [message],
        sampleAcceptedRows: [],
        error: message,
      },
      500,
    )
  }
})
