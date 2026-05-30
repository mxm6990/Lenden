/**
 * Unofficial DSE scrape adapter — compatible with ShanjinurIslam/Dhaka-Stock-Exchange routes.
 * Experimental / closed beta only. Verify licensing before production use.
 */

import { parse } from 'node-html-parser'

const DSE_LATEST_URL = 'https://www.dsebd.org/latest_share_price_scroll_l.php'
const CACHE_TTL_MS = 60_000

let cache = {
  fetchedAt: 0,
  payload: null,
}

function parseNumber(value) {
  if (value === null || value === undefined) return null
  const cleaned = String(value).replace(/,/g, '').trim()
  if (!cleaned || cleaned === '-' || cleaned === '—') return null
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

function getStockDetails(stockNode) {
  const rowParent = stockNode.parentNode?.parentNode
  if (!rowParent) return null

  const tradingCode = stockNode.childNodes[0]?.rawText?.trim()
  if (!tradingCode) return null

  const object = { TRADING_CODE: tradingCode }
  const attributes = ['LTP', 'HIGH', 'LOW', 'CLOSEP', 'YCP', 'CHANGE', 'TRADE', 'VALUE', 'VOLUME']

  let attributeIndex = 0
  for (let i = 5; i < rowParent.childNodes.length; i++) {
    const cell = rowParent.childNodes[i]
    if (cell?.childNodes?.length > 0 && attributeIndex < attributes.length) {
      object[attributes[attributeIndex++]] = cell.childNodes[0].rawText?.toString?.() ?? ''
    }
  }

  return object
}

function parseLatestPriceHtml(body) {
  const root = parse(body)
  const stockNodes = root.querySelectorAll('.ab1')
  const stocks = []

  for (let i = 0; i < Math.min(stockNodes.length, 360); i++) {
    const details = getStockDetails(stockNodes[i])
    if (details?.TRADING_CODE) stocks.push(details)
  }

  return {
    date: Date.now(),
    stocks,
  }
}

export async function fetchLatestStockPrice(force = false) {
  const stale = Date.now() - cache.fetchedAt > CACHE_TTL_MS
  if (!force && cache.payload && !stale) {
    return cache.payload
  }

  const response = await fetch(DSE_LATEST_URL, {
    headers: {
      'User-Agent': 'Lenden-Experimental-DSE-Proxy/1.0 (closed-beta; unofficial)',
      Accept: 'text/html,application/xhtml+xml',
    },
  })

  if (!response.ok) {
    throw new Error(`DSE latest price page failed (${response.status})`)
  }

  const body = await response.text()
  const payload = parseLatestPriceHtml(body)

  if (payload.stocks.length === 0) {
    throw new Error('DSE latest price page returned no recognizable rows')
  }

  cache = { fetchedAt: Date.now(), payload }
  return payload
}

export async function fetchSharePrice(ticker) {
  const normalized = ticker.trim().toUpperCase()
  const latest = await fetchLatestStockPrice()
  const match = latest.stocks.find((row) => row.TRADING_CODE?.toUpperCase() === normalized)

  if (!match) {
    throw new Error(`Ticker not found in latest DSE feed: ${normalized}`)
  }

  return match
}

export function clearCache() {
  cache = { fetchedAt: 0, payload: null }
}

export function summarizeQuote(row) {
  return {
    ticker: row.TRADING_CODE,
    ltp: parseNumber(row.LTP),
    change: parseNumber(row.CHANGE),
    ycp: parseNumber(row.YCP),
    volume: parseNumber(row.VOLUME),
  }
}
