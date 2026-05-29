/**
 * Mock portfolio API — Supabase when authenticated, mock data in demo mode.
 * Authenticated reads surface errors instead of silently falling back to mock data.
 */

import { buildAllocationFromEnrichedHoldings } from '../data/allocation'
import {
  getBuyingPower as getBuyingPowerLocal,
  getCombinedPnL,
  getPortfolioDayChange,
  getPortfolioHistory,
  getPortfolioSummary as getPortfolioSummaryLocal,
  getRealizedPnL,
  type BuyingPower,
  type PortfolioHistoryPoint,
  type PortfolioSummary,
} from '../data/portfolio'
import { getEnrichedHoldings, type EnrichedHolding } from '../data/stocks'
import {
  getPastTransactions as getPastTransactionsLocal,
  type PastTransaction,
} from '../data/transactions'
import type { AllocationSegment } from '../data/allocation'
import { isDemoModeActive } from '../lib/demoMode'
import { getStockPrice } from '../services/marketDataProvider'
import { getAuthenticatedContext } from '../lib/supabaseAuth'
import {
  buildBuyingPowerFromProfile,
  computePortfolioSummary,
  enrichHoldings,
  mapTransactionRow,
  type HoldingRow,
  type TransactionRow,
} from '../lib/portfolioMappers'
import {
  buildPortfolioHistoryFromHoldings,
  generatePrototypeHistoryFromValue,
} from '../lib/portfolioCalculations'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import type {
  CombinedPnLData,
  PortfolioBundle,
  PortfolioDataSource,
  PortfolioDayChange,
  PortfolioServiceResult,
  RealizedPnLData,
} from '../types/portfolioService'
import { appendAuditLog } from './auditApi'

const MOCK_DELAY_MS = 80

let simulateBuyingPowerUnavailable = false
let simulateTransactionsUnavailable = false

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

function formatSupabaseError(error: unknown): string {
  if (error && typeof error === 'object') {
    const record = error as { message?: string; details?: string; code?: string }
    return [record.message, record.details, record.code].filter(Boolean).join(' · ')
  }
  return 'Could not load portfolio data from the database.'
}

async function shouldUseSupabase(): Promise<boolean> {
  if (isDemoModeActive() || !isSupabaseConfigured()) return false
  const ctx = await getAuthenticatedContext()
  return ctx !== null
}

async function fetchHoldingsFromSupabase(
  userId: string,
): Promise<{ data: EnrichedHolding[] | null; error: string | null }> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { data: null, error: 'Supabase client unavailable.' }
  }

  const { data, error } = await supabase
    .from('holdings')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) return { data: null, error: formatSupabaseError(error) }
  return { data: enrichHoldings(data as HoldingRow[]), error: null }
}

async function fetchBuyingPowerFromSupabase(
  userId: string,
): Promise<{ data: BuyingPower | null; error: string | null }> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { data: null, error: 'Supabase client unavailable.' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('buying_power_available, buying_power_reserved')
    .eq('id', userId)
    .maybeSingle()

  if (error) return { data: null, error: formatSupabaseError(error) }
  if (!data) return { data: null, error: 'Profile not found.' }

  return {
    data: buildBuyingPowerFromProfile(
      Number(data.buying_power_available ?? 0),
      Number(data.buying_power_reserved ?? 0),
    ),
    error: null,
  }
}

async function fetchTransactionsFromSupabase(
  userId: string,
): Promise<{ data: PastTransaction[] | null; error: string | null }> {
  const supabase = getSupabaseClient()
  if (!supabase) {
    return { data: null, error: 'Supabase client unavailable.' }
  }

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { data: null, error: formatSupabaseError(error) }
  return { data: (data as TransactionRow[]).map(mapTransactionRow), error: null }
}

interface HoldingsDataset {
  source: PortfolioDataSource
  holdings: EnrichedHolding[]
  error: string | null
}

async function resolveHoldingsDataset(): Promise<HoldingsDataset> {
  if (await shouldUseSupabase()) {
    const ctx = await getAuthenticatedContext()
    if (ctx) {
      const { data, error } = await fetchHoldingsFromSupabase(ctx.userId)
      return { source: 'supabase', holdings: data ?? [], error }
    }
  }

  return {
    source: 'demo',
    holdings: await delay(getEnrichedHoldings()),
    error: null,
  }
}

function buildHistoryFromHoldings(holdings: EnrichedHolding[]): PortfolioHistoryPoint[] {
  if (holdings.length === 0) return []

  const history = buildPortfolioHistoryFromHoldings(holdings)
  if (history.length >= 2) return history

  const summary = computePortfolioSummary(holdings)
  return generatePrototypeHistoryFromValue(summary.totalValue)
}

function computeDayChangeFromHistory(history: PortfolioHistoryPoint[]): PortfolioDayChange {
  if (history.length < 2) {
    return { amount: 0, pct: 0, sourceLabel: 'Not enough history.' }
  }

  const latest = history[history.length - 1]?.value ?? 0
  const previous = history[history.length - 2]?.value ?? latest
  const amount = latest - previous
  const pct = previous > 0 ? (amount / previous) * 100 : 0

  return { amount, pct, sourceLabel: null }
}

function deriveCombinedPnL(
  summary: PortfolioSummary,
  source: PortfolioDataSource,
  realizedPnL: RealizedPnLData,
): CombinedPnLData {
  if (source === 'demo') {
    const demo = getCombinedPnL()
    return {
      unrealized: demo.unrealized,
      realized: demo.realized,
      total: demo.total,
    }
  }

  return {
    unrealized: { amount: summary.totalGain, pct: summary.totalGainPct },
    realized: realizedPnL.total,
    total: summary.totalGain + realizedPnL.total,
  }
}

function deriveRealizedPnLFromTransactions(
  transactions: PastTransaction[],
  source: PortfolioDataSource,
): RealizedPnLData {
  if (source === 'demo') {
    return getRealizedPnL()
  }

  const entries = transactions
    .filter(
      (tx) =>
        tx.type === 'sell' && tx.realizedGainLoss !== null && tx.realizedGainLoss !== undefined,
    )
    .map((tx) => ({
      id: tx.id,
      date: tx.date,
      ticker: tx.ticker ?? '—',
      type: 'sell' as const,
      amount: tx.realizedGainLoss ?? 0,
      note: tx.note ?? 'Mock sell order',
    }))

  const total = entries.reduce((sum, entry) => sum + entry.amount, 0)
  return { total, entries }
}

async function resolveTransactionsDataset(
  source: PortfolioDataSource,
): Promise<PastTransaction[]> {
  if (source === 'demo') {
    return delay(getPastTransactionsLocal())
  }

  const ctx = await getAuthenticatedContext()
  if (!ctx) return []

  const { data } = await fetchTransactionsFromSupabase(ctx.userId)
  return data ?? []
}

function emptySummary(): PortfolioSummary {
  return { holdings: [], totalInvested: 0, totalValue: 0, totalGain: 0, totalGainPct: 0 }
}

function logPortfolioBundleAudit(bundle: PortfolioBundle) {
  if (!import.meta.env.DEV) return

  console.group('Portfolio Bundle Audit')
  console.log('source:', bundle.source)
  console.log(
    'holdings:',
    bundle.holdings.map((holding) => ({
      stockId: holding.stockId,
      ticker: holding.stock.ticker,
      shares: holding.shares,
      avgCost: holding.avgCost,
    })),
  )
  console.log(
    'prices:',
    bundle.holdings.map((holding) => ({
      stockId: holding.stockId,
      price: getStockPrice(holding.stockId),
    })),
  )
  console.log(
    'costBasis:',
    bundle.holdings.map((holding) => ({
      stockId: holding.stockId,
      invested: holding.invested,
    })),
  )
  console.log(
    'marketValue:',
    bundle.holdings.map((holding) => ({
      stockId: holding.stockId,
      currentValue: holding.currentValue,
    })),
  )
  console.log('buyingPower:', bundle.buyingPower)
  console.log('accountValue:', bundle.accountValue)
  console.log('allocation:', bundle.allocation)
  console.log('dayChange:', bundle.dayChange)
  console.log('combinedPnL:', bundle.combinedPnL)
  if (bundle.error) console.warn('error:', bundle.error)
  if (bundle.buyingPowerError) console.warn('buyingPowerError:', bundle.buyingPowerError)
  console.groupEnd()
}

export async function getPortfolioBundle(): Promise<PortfolioBundle> {
  const dataset = await resolveHoldingsDataset()
  const buyingPowerResult = await getBuyingPowerResult()

  if (dataset.error && dataset.source === 'supabase') {
    const bundle: PortfolioBundle = {
      source: dataset.source,
      summary: emptySummary(),
      holdings: [],
      allocation: [],
      history: [],
      dayChange: { amount: 0, pct: 0, sourceLabel: 'Not enough history.' },
      combinedPnL: { unrealized: { amount: 0, pct: 0 }, realized: 0, total: 0 },
      realizedPnL: { total: 0, entries: [] },
      buyingPower: buyingPowerResult.error ? null : buyingPowerResult.data,
      buyingPowerError: buyingPowerResult.error,
      accountValue: buyingPowerResult.error ? 0 : buyingPowerResult.data.available,
      error: dataset.error,
    }
    logPortfolioBundleAudit(bundle)
    return bundle
  }

  const summary =
    dataset.source === 'demo'
      ? await delay(getPortfolioSummaryLocal())
      : computePortfolioSummary(dataset.holdings)

  const allocation = buildAllocationFromEnrichedHoldings(summary.holdings)
  const history =
    dataset.source === 'demo'
      ? await delay(getPortfolioHistory())
      : buildHistoryFromHoldings(dataset.holdings)

  const dayChange =
    dataset.source === 'demo'
      ? { ...(await delay(getPortfolioDayChange())), sourceLabel: null }
      : computeDayChangeFromHistory(history)

  const transactions = await resolveTransactionsDataset(dataset.source)
  const realizedPnL = deriveRealizedPnLFromTransactions(transactions, dataset.source)
  const combinedPnL = deriveCombinedPnL(summary, dataset.source, realizedPnL)

  const buyingPower = buyingPowerResult.error ? null : buyingPowerResult.data
  const accountValue = summary.totalValue + (buyingPower?.available ?? 0)

  const bundle: PortfolioBundle = {
    source: dataset.source,
    summary,
    holdings: summary.holdings,
    allocation,
    history,
    dayChange,
    combinedPnL,
    realizedPnL,
    buyingPower,
    buyingPowerError: buyingPowerResult.error,
    accountValue,
    error: null,
  }

  logPortfolioBundleAudit(bundle)
  return bundle
}

export async function getPortfolioSummary(): Promise<PortfolioServiceResult<PortfolioSummary>> {
  const dataset = await resolveHoldingsDataset()
  if (dataset.error && dataset.source === 'supabase') {
    return { data: emptySummary(), error: dataset.error }
  }

  const summary =
    dataset.source === 'demo'
      ? await delay(getPortfolioSummaryLocal())
      : computePortfolioSummary(dataset.holdings)

  return { data: summary, error: null }
}

export async function getHoldings(): Promise<PortfolioServiceResult<EnrichedHolding[]>> {
  const dataset = await resolveHoldingsDataset()
  if (dataset.error && dataset.source === 'supabase') {
    return { data: [], error: dataset.error }
  }

  const summary =
    dataset.source === 'demo'
      ? await delay(getPortfolioSummaryLocal())
      : computePortfolioSummary(dataset.holdings)

  return { data: summary.holdings, error: null }
}

export async function getWatchlistStockIds(): Promise<string[]> {
  if (await shouldUseSupabase()) {
    const ctx = await getAuthenticatedContext()
    if (ctx) {
      const supabase = getSupabaseClient()
      if (supabase) {
        const { data, error } = await supabase
          .from('watchlists')
          .select('stock_id')
          .eq('user_id', ctx.userId)
          .order('created_at', { ascending: true })

        if (!error && data) return data.map((row) => row.stock_id as string)
      }
    }
  }
  return delay(['gp', 'renata', 'marico'])
}

export async function addWatchlistStock(stockId: string): Promise<string[]> {
  const ctx = await getAuthenticatedContext()
  if (!ctx || isDemoModeActive()) return []

  const supabase = getSupabaseClient()
  if (!supabase) return []

  await supabase.from('watchlists').upsert(
    { user_id: ctx.userId, stock_id: stockId },
    { onConflict: 'user_id,stock_id' },
  )

  await appendAuditLog({
    action: 'WATCHLIST_UPDATED',
    actorId: ctx.userId,
    targetId: stockId,
    metadata: { operation: 'add' },
  })

  return getWatchlistStockIds()
}

export async function removeWatchlistStock(stockId: string): Promise<string[]> {
  const ctx = await getAuthenticatedContext()
  if (!ctx || isDemoModeActive()) return []

  const supabase = getSupabaseClient()
  if (!supabase) return []

  await supabase.from('watchlists').delete().eq('user_id', ctx.userId).eq('stock_id', stockId)

  await appendAuditLog({
    action: 'WATCHLIST_UPDATED',
    actorId: ctx.userId,
    targetId: stockId,
    metadata: { operation: 'remove' },
  })

  return getWatchlistStockIds()
}

export async function getBuyingPower(): Promise<BuyingPower | null> {
  const result = await getBuyingPowerResult()
  if (result.error) return null
  return result.data
}

export async function getBuyingPowerResult(): Promise<PortfolioServiceResult<BuyingPower>> {
  const emptyBuyingPower: BuyingPower = {
    available: 0,
    reserved: 0,
    currency: 'BDT',
    boAccountId: null,
    asOf: new Date().toISOString(),
  }

  if (simulateBuyingPowerUnavailable) {
    return { data: emptyBuyingPower, error: 'Buying power unavailable.' }
  }

  if (await shouldUseSupabase()) {
    const ctx = await getAuthenticatedContext()
    if (ctx) {
      const result = await fetchBuyingPowerFromSupabase(ctx.userId)
      if (result.error || !result.data) {
        return {
          data: emptyBuyingPower,
          error: result.error ?? 'Buying power unavailable.',
        }
      }
      return { data: result.data, error: null }
    }
  }
  return { data: await delay(getBuyingPowerLocal()), error: null }
}

export async function getPastTransactions(): Promise<PastTransaction[] | null> {
  const result = await getPastTransactionsResult()
  if (result.error) return null
  return result.data
}

export async function getPastTransactionsResult(): Promise<
  PortfolioServiceResult<PastTransaction[]>
> {
  if (simulateTransactionsUnavailable) {
    return { data: [], error: 'Transaction history unavailable.' }
  }

  if (await shouldUseSupabase()) {
    const ctx = await getAuthenticatedContext()
    if (ctx) {
      const { data, error } = await fetchTransactionsFromSupabase(ctx.userId)
      if (error) return { data: [], error }
      return { data: data ?? [], error: null }
    }
  }
  return { data: await delay(getPastTransactionsLocal()), error: null }
}

export async function getAllocationBreakdown(): Promise<
  PortfolioServiceResult<AllocationSegment[]>
> {
  const bundle = await getPortfolioBundle()
  return { data: bundle.allocation, error: bundle.error }
}

export async function getPortfolioHistoryData(): Promise<
  PortfolioServiceResult<PortfolioHistoryPoint[]>
> {
  const bundle = await getPortfolioBundle()
  return { data: bundle.history, error: bundle.error }
}

export async function getPortfolioDayChangeData(): Promise<PortfolioDayChange> {
  const bundle = await getPortfolioBundle()
  return bundle.dayChange
}

export async function getCombinedPnLData(): Promise<CombinedPnLData> {
  const bundle = await getPortfolioBundle()
  return bundle.combinedPnL
}

export async function getRealizedPnLData(): Promise<RealizedPnLData> {
  const bundle = await getPortfolioBundle()
  return bundle.realizedPnL
}

export function __setBuyingPowerUnavailable(unavailable: boolean) {
  simulateBuyingPowerUnavailable = unavailable
}

export function __setTransactionsUnavailable(unavailable: boolean) {
  simulateTransactionsUnavailable = unavailable
}

export type { PortfolioSummary, BuyingPower, PastTransaction, AllocationSegment, EnrichedHolding }
export type {
  CombinedPnLData,
  PortfolioBundle,
  PortfolioDayChange,
  PortfolioServiceResult,
  RealizedPnLData,
} from '../types/portfolioService'
