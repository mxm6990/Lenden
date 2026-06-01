#!/usr/bin/env node
/**
 * Quick local check — verifies Supabase env vars are set (not placeholder).
 * Usage: npm run supabase:check
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const envPath = resolve(process.cwd(), '.env.local')

if (!existsSync(envPath)) {
  console.log('❌ .env.local not found')
  console.log('   Run: cp .env.example .env.local')
  console.log('   Then add keys from Supabase Dashboard → Settings → API')
  process.exit(1)
}

const env = readFileSync(envPath, 'utf8')
const url = env.match(/^VITE_SUPABASE_URL=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '')
const key = env.match(/^VITE_SUPABASE_ANON_KEY=(.+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '')

function validateUrl(url) {
  if (!url || url.includes('YOUR_PROJECT')) return { ok: false, reason: 'placeholder' }
  try {
    const parsed = new URL(url)
    if (!parsed.hostname.endsWith('.supabase.co')) {
      return { ok: false, reason: 'host must end with .supabase.co' }
    }
    if (parsed.pathname !== '/' && parsed.pathname !== '') {
      return {
        ok: false,
        reason: `use project root only (remove "${parsed.pathname}")`,
      }
    }
    return { ok: true, host: parsed.hostname }
  } catch {
    return { ok: false, reason: 'invalid URL' }
  }
}

const urlCheck = validateUrl(url)
const keyOk = key && !key.includes('your_anon')

console.log('Supabase setup check')
console.log('────────────────────')
console.log(` .env.local:     found`)
console.log(` URL configured: ${urlCheck.ok ? '✅' : '❌ (' + urlCheck.reason + ')'}`)
console.log(` Anon key:       ${keyOk ? '✅' : '❌ (still placeholder)'}`)

if (!urlCheck.ok || !keyOk) {
  console.log('\nNext: Supabase Dashboard → Settings → API → copy URL + anon public key')
  process.exit(1)
}

console.log(` Host:           ${urlCheck.host}`)
console.log('\n✅ Env looks ready. Next:')
console.log('   1. Run supabase/migrations/001_profiles.sql in SQL Editor')
console.log('   2. Auth → Providers → Email → disable "Confirm email" for prototype')
console.log('   3. npm run dev')
