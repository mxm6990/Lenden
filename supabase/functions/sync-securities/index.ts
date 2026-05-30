/**
 * Sync DSE securities universe from experimental upstream into public.securities.
 * Unofficial data — closed beta only.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { extractDseRows } from '../_shared/normalizeQuotes.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CompanyListEntry {
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
      const record = entry as CompanyListEntry & { id?: number }
      const ticker = normalizeTicker(record.name)
      if (ticker) names.set(ticker, ticker)
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

    for (const row of rows) {
      const ticker = normalizeTicker(row.TRADING_CODE ?? row.trading_code ?? row.ticker)
      if (!ticker) {
        skipped++
        continue
      }

      const companyName = companyNames.get(ticker) ?? ticker

      const { data: existing, error: selectError } = await supabase
        .from('securities')
        .select('id, company_name, sector, is_active')
        .eq('ticker', ticker)
        .maybeSingle()

      if (selectError) {
        skipped++
        continue
      }

      if (!existing) {
        const { error: insertError } = await supabase.from('securities').insert({
          ticker,
          company_name: companyName,
          exchange: 'DSE',
          is_active: true,
        })
        if (insertError) skipped++
        else inserted++
        continue
      }

      const needsUpdate =
        existing.company_name !== companyName ||
        existing.is_active !== true ||
        existing.sector === null

      if (!needsUpdate) {
        skipped++
        continue
      }

      const { error: updateError } = await supabase
        .from('securities')
        .update({
          company_name: companyName,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)

      if (updateError) skipped++
      else updated++
    }

    const summary = {
      ok: true,
      inserted,
      updated,
      skipped,
      totalProcessed: rows.length,
      syncedAt: new Date().toISOString(),
    }

    console.log('sync-securities summary', summary)
    return jsonResponse(summary)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Sync failed'
    return jsonResponse({ ok: false, inserted: 0, updated: 0, skipped: 0, error: message }, 500)
  }
})
