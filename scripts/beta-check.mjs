#!/usr/bin/env node
/**
 * Closed beta sanity check — env, migrations, and build.
 * Usage: npm run beta:check
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = process.cwd()
const envPath = resolve(root, '.env.local')
const migrationsDir = resolve(root, 'supabase/migrations')

const REQUIRED_MIGRATIONS = [
  '001_profiles.sql',
  '002_profile_phone.sql',
  '003_persistent_investing.sql',
  '004_schema_integrity_and_atomic_mock_buy.sql',
  '005_submit_mock_sell.sql',
]

const checks = []

function pass(label, detail = '') {
  checks.push({ ok: true, label, detail })
}

function fail(label, detail = '') {
  checks.push({ ok: false, label, detail })
}

function readEnvValue(key) {
  if (!existsSync(envPath)) return null
  const env = readFileSync(envPath, 'utf8')
  const match = env.match(new RegExp(`^${key}=(.+)$`, 'm'))
  return match?.[1]?.trim().replace(/^["']|["']$/g, '') ?? null
}

console.log('Lenden closed beta check')
console.log('──────────────────────')

if (!existsSync(envPath)) {
  fail('.env.local exists', 'Run: cp .env.example .env.local')
} else {
  pass('.env.local exists')

  const url = readEnvValue('VITE_SUPABASE_URL')
  const anonKey = readEnvValue('VITE_SUPABASE_ANON_KEY')
  const marketOverride = readEnvValue('VITE_FORCE_DSE_MARKET_OPEN')
  const marketMode = readEnvValue('VITE_MARKET_DATA_MODE')

  if (url && !url.includes('YOUR_PROJECT')) {
    pass('VITE_SUPABASE_URL configured', url)
  } else {
    fail('VITE_SUPABASE_URL configured', 'Still placeholder or missing')
  }

  if (anonKey && !anonKey.includes('your_anon')) {
    pass('VITE_SUPABASE_ANON_KEY configured')
  } else {
    fail('VITE_SUPABASE_ANON_KEY configured', 'Still placeholder or missing')
  }

  if (marketOverride !== null && marketOverride !== undefined && marketOverride !== '') {
    pass('VITE_FORCE_DSE_MARKET_OPEN present', marketOverride)
  } else {
    fail('VITE_FORCE_DSE_MARKET_OPEN present', 'Add to .env.local (true or false)')
  }

  if (marketMode) {
    pass('VITE_MARKET_DATA_MODE present', marketMode)
  } else {
    pass('VITE_MARKET_DATA_MODE present', 'not set — app defaults to mock (add to .env.local recommended)')
  }

  const envText = readFileSync(envPath, 'utf8')
  if (/service_role/i.test(envText)) {
    fail('No service_role key in .env.local', 'Remove service_role — anon key only')
  } else {
    pass('No service_role key in .env.local')
  }
}

if (!existsSync(migrationsDir)) {
  fail('Migrations folder exists')
} else {
  const files = readdirSync(migrationsDir)
  for (const migration of REQUIRED_MIGRATIONS) {
    if (files.includes(migration)) {
      pass(`Migration ${migration}`)
    } else {
      fail(`Migration ${migration}`, 'Missing from supabase/migrations/')
    }
  }
}

console.log('\nRunning production build…')
const build = spawnSync('npm', ['run', 'build'], {
  cwd: root,
  stdio: 'pipe',
  encoding: 'utf8',
})

if (build.status === 0) {
  pass('npm run build')
} else {
  fail('npm run build', (build.stderr || build.stdout || 'Build failed').slice(0, 400))
}

console.log('')
for (const check of checks) {
  const icon = check.ok ? '✅' : '❌'
  const detail = check.detail ? ` — ${check.detail}` : ''
  console.log(`${icon} ${check.label}${detail}`)
}

const failed = checks.filter((check) => !check.ok)
console.log('')

if (failed.length === 0) {
  console.log('✅ All beta checks passed.')
  process.exit(0)
}

console.log(`❌ ${failed.length} check(s) failed. See docs/closed-beta-runbook.md`)
process.exit(1)
