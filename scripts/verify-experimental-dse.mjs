#!/usr/bin/env node
/**
 * Verify experimental DSE pipeline:
 * 1) optional upstream DSE API (Render)
 * 2) Supabase Edge Function proxy
 *
 * Usage:
 *   node scripts/verify-experimental-dse.mjs
 *   node scripts/verify-experimental-dse.mjs https://your-dse-api.onrender.com
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()
const envPath = resolve(root, '.env.local')

function readEnv(key) {
  if (!existsSync(envPath)) return null
  const env = readFileSync(envPath, 'utf8')
  const match = env.match(new RegExp(`^${key}=(.+)$`, 'm'))
  return match?.[1]?.trim().replace(/^["']|["']$/g, '') ?? null
}

async function checkUrl(label, url, headers = {}) {
  try {
    const response = await fetch(url, { headers })
    const text = await response.text()
    let json
    try {
      json = JSON.parse(text)
    } catch {
      json = text.slice(0, 300)
    }
    return { label, ok: response.ok, status: response.status, json }
  } catch (error) {
    return {
      label,
      ok: false,
      status: 0,
      json: error instanceof Error ? error.message : 'request failed',
    }
  }
}

async function main() {
  const upstreamBase = (process.argv[2] ?? readEnv('DSE_EXPERIMENTAL_BASE_URL') ?? '').replace(/\/$/, '')
  const supabaseUrl = readEnv('VITE_SUPABASE_URL')?.replace(/\/$/, '')
  const anonKey = readEnv('VITE_SUPABASE_ANON_KEY')

  console.log('Experimental DSE verification')
  console.log('───────────────────────────')

  if (upstreamBase) {
    const latest = await checkUrl('upstream /api/latest_price', `${upstreamBase}/api/latest_price`)
    const gp = await checkUrl('upstream /api/share_price?name=GP', `${upstreamBase}/api/share_price?name=GP`)
    console.log(`${latest.ok ? '✅' : '❌'} ${latest.label} (${latest.status})`)
    if (latest.ok) {
      const count = Array.isArray(latest.json?.stocks) ? latest.json.stocks.length : 0
      console.log(`   stocks=${count}`)
    } else {
      console.log(`   ${JSON.stringify(latest.json)}`)
    }
    console.log(`${gp.ok ? '✅' : '❌'} ${gp.label} (${gp.status})`)
    if (gp.ok) console.log(`   ticker=${gp.json?.TRADING_CODE ?? 'n/a'} ltp=${gp.json?.LTP ?? 'n/a'}`)
  } else {
    console.log('⚠️  No upstream base URL provided (arg or DSE_EXPERIMENTAL_BASE_URL in .env.local)')
  }

  if (supabaseUrl && anonKey) {
    const headers = {
      Accept: 'application/json',
      apikey: anonKey,
    }
    if (anonKey.startsWith('eyJ')) {
      headers.Authorization = `Bearer ${anonKey}`
    }

    const proxy = await checkUrl(
      'edge /functions/v1/dse-market-data',
      `${supabaseUrl}/functions/v1/dse-market-data`,
      headers,
    )
    console.log(`${proxy.ok ? '✅' : '❌'} ${proxy.label} (${proxy.status})`)
    if (proxy.ok) {
      const count = Array.isArray(proxy.json?.quotes) ? proxy.json.quotes.length : 0
      console.log(`   quotes=${count} badge=${proxy.json?.status?.badge ?? 'n/a'}`)
      console.log(`   fellBackToMock=${proxy.json?.status?.fellBackToMock ?? 'n/a'}`)
      console.log(`   sourceUnavailable=${proxy.json?.status?.sourceUnavailable ?? 'n/a'}`)
    } else {
      console.log(`   ${JSON.stringify(proxy.json)}`)
    }
  } else {
    console.log('⚠️  Supabase env missing in .env.local — skipping edge function check')
  }

  console.log('')
}

main()
