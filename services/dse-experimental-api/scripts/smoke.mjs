#!/usr/bin/env node

const baseUrl = (process.argv[2] ?? 'http://localhost:3000').replace(/\/$/, '')

async function check(path) {
  const url = `${baseUrl}${path}`
  const response = await fetch(url)
  const text = await response.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    json = text.slice(0, 200)
  }
  return { url, status: response.status, json }
}

async function main() {
  console.log(`Smoke testing ${baseUrl}`)

  const health = await check('/health')
  console.log('GET /health', health.status, health.json)

  const latest = await check('/api/latest_price')
  const stockCount = Array.isArray(latest.json?.stocks) ? latest.json.stocks.length : 0
  console.log('GET /api/latest_price', latest.status, `stocks=${stockCount}`)

  const gp = await check('/api/share_price?name=GP')
  console.log('GET /api/share_price?name=GP', gp.status, gp.json?.TRADING_CODE ?? gp.json)

  if (health.status !== 200 || latest.status !== 200 || gp.status !== 200 || stockCount === 0) {
    process.exit(1)
  }

  console.log('✅ Smoke tests passed')
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
