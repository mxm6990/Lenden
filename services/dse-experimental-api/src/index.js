/**
 * Experimental DSE API — Dhaka-Stock-Exchange compatible routes for Lenden closed beta.
 * Unofficial data. Not licensed DSE feed. Paper trading prototype only.
 */

import express from 'express'
import { fetchLatestStockPrice, fetchSharePrice } from './dseScraper.js'

const app = express()
const port = Number(process.env.PORT || 3000)

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'lenden-dse-experimental-api' })
})

app.get('/api/latest_price', async (_req, res) => {
  try {
    const payload = await fetchLatestStockPrice()
    res.status(200).json(payload)
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to load latest DSE prices',
    })
  }
})

app.get('/api/share_price', async (req, res) => {
  const name = typeof req.query.name === 'string' ? req.query.name : ''
  if (!name.trim()) {
    res.status(400).json({ error: 'Query param name is required (e.g. ?name=GP)' })
    return
  }

  try {
    const payload = await fetchSharePrice(name)
    res.status(200).json(payload)
  } catch (error) {
    res.status(404).json({
      error: error instanceof Error ? error.message : 'Share price not found',
    })
  }
})

app.get('/api/company_list', (_req, res) => {
  res.status(501).json({
    error: 'Not implemented in Lenden experimental adapter. Use /api/latest_price.',
  })
})

app.listen(port, () => {
  console.log(`lenden-dse-experimental-api listening on :${port}`)
})
