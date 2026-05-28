import { getPortfolioSummary } from './portfolio'
import type { EnrichedHolding } from './stocks'

/** Stable industry keys — align with future API `industryKey` field */
export type IndustryKey =
  | 'telecom'
  | 'retail'
  | 'pharmaceuticals'
  | 'financial_services'
  | 'other'

export const INDUSTRY_LABELS: Record<IndustryKey, string> = {
  telecom: 'Telecom',
  retail: 'Retail',
  pharmaceuticals: 'Pharmaceuticals',
  financial_services: 'Financial Services',
  other: 'Other',
}

/** Maps DSE stock `sector` strings to portfolio industry buckets */
export function mapSectorToIndustry(sector: string): IndustryKey {
  const normalized = sector.trim().toLowerCase()
  if (normalized === 'telecom') return 'telecom'
  if (normalized === 'consumer') return 'retail'
  if (normalized === 'pharma') return 'pharmaceuticals'
  if (normalized === 'banking') return 'financial_services'
  return 'other'
}

export interface AllocationSegment {
  id: IndustryKey
  label: string
  value: number
  pct: number
  color: string
  colorClass: string
  holdingCount: number
  tickers: string[]
}

/** Shape expected from `GET /api/portfolio/allocation` */
export interface PortfolioAllocationApiResponse {
  asOf: string
  totalValue: number
  segments: Array<{
    industryKey: IndustryKey
    label?: string
    value: number
    weight: number
    holdings?: Array<{ symbol: string; value: number }>
  }>
}

const ALLOCATION_PALETTE: Record<IndustryKey, { color: string; colorClass: string }> = {
  telecom: { color: '#6366f1', colorClass: 'bg-indigo-500' },
  retail: { color: '#f59e0b', colorClass: 'bg-amber-500' },
  pharmaceuticals: { color: '#a855f7', colorClass: 'bg-purple-500' },
  financial_services: { color: '#0ea5e9', colorClass: 'bg-sky-500' },
  other: { color: '#64748b', colorClass: 'bg-slate-500' },
}

const INDUSTRY_ORDER: IndustryKey[] = [
  'telecom',
  'financial_services',
  'pharmaceuticals',
  'retail',
  'other',
]

function groupHoldingsByIndustry(holdings: EnrichedHolding[]) {
  const groups = new Map<IndustryKey, { value: number; tickers: string[] }>()

  for (const holding of holdings) {
    const industry = mapSectorToIndustry(holding.stock.sector)
    const existing = groups.get(industry) ?? { value: 0, tickers: [] }
    existing.value += holding.currentValue
    existing.tickers.push(holding.stock.ticker)
    groups.set(industry, existing)
  }

  return groups
}

/** Local aggregation — replace body of `fetchPortfolioAllocation` when API is live */
export function buildAllocationFromHoldings(): AllocationSegment[] {
  const { holdings, totalValue } = getPortfolioSummary()
  const groups = groupHoldingsByIndustry(holdings)

  return INDUSTRY_ORDER.filter((key) => groups.has(key)).map((id) => {
    const group = groups.get(id)!
    const palette = ALLOCATION_PALETTE[id]
    const pct = totalValue > 0 ? (group.value / totalValue) * 100 : 0

    return {
      id,
      label: INDUSTRY_LABELS[id],
      value: group.value,
      pct,
      color: palette.color,
      colorClass: palette.colorClass,
      holdingCount: group.tickers.length,
      tickers: group.tickers,
    }
  })
}

export function normalizeAllocationResponse(
  payload: PortfolioAllocationApiResponse,
): AllocationSegment[] {
  return payload.segments
    .map((segment) => {
      const id = segment.industryKey
      const palette = ALLOCATION_PALETTE[id] ?? ALLOCATION_PALETTE.other
      const pct = segment.weight <= 1 ? segment.weight * 100 : segment.weight

      return {
        id,
        label: segment.label ?? INDUSTRY_LABELS[id],
        value: segment.value,
        pct,
        color: palette.color,
        colorClass: palette.colorClass,
        holdingCount: segment.holdings?.length ?? 0,
        tickers: segment.holdings?.map((h) => h.symbol) ?? [],
      }
    })
    .sort(
      (a, b) =>
        INDUSTRY_ORDER.indexOf(a.id) - INDUSTRY_ORDER.indexOf(b.id) || b.pct - a.pct,
    )
}

/**
 * Portfolio allocation by industry.
 * Swap the implementation to `fetch('/api/portfolio/allocation')` when backend is ready.
 */
export async function fetchPortfolioAllocation(): Promise<AllocationSegment[]> {
  // const res = await fetch('/api/portfolio/allocation')
  // if (!res.ok) throw new Error('Failed to load allocation')
  // return normalizeAllocationResponse(await res.json())
  return buildAllocationFromHoldings()
}

/** Sync helper for current demo UI — mirrors `fetchPortfolioAllocation` locally */
export function getPortfolioAllocationByIndustry(): AllocationSegment[] {
  return buildAllocationFromHoldings()
}

export function getIndustryForHolding(sector: string): IndustryKey {
  return mapSectorToIndustry(sector)
}

export function getIndustryLabel(sector: string): string {
  return INDUSTRY_LABELS[mapSectorToIndustry(sector)]
}
