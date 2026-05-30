import { LEGACY_STOCK_ID_MAP, matchesStockId, normalizeSecurityKey } from './securityListing'

export function canonicalWatchlistTicker(stockId: string): string {
  return normalizeSecurityKey(stockId)
}

/** Treat gp === GP, brac === BRACBANK, legacy slugs === canonical tickers. */
export function matchesWatchlistId(candidate: string, target: string): boolean {
  return matchesStockId(candidate, target)
}

export function isWatchlistMember(watchlist: string[], stockId: string): boolean {
  return watchlist.some((id) => matchesWatchlistId(id, stockId))
}

export function withoutWatchlistMember(watchlist: string[], stockId: string): string[] {
  return watchlist.filter((id) => !matchesWatchlistId(id, stockId))
}

export function withWatchlistMember(watchlist: string[], stockId: string): string[] {
  const canonical = canonicalWatchlistTicker(stockId)
  return [...withoutWatchlistMember(watchlist, canonical), canonical]
}

/** Canonical tickers only, preserving first-seen order. */
export function normalizeWatchlistIds(ids: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const id of ids) {
    const canonical = canonicalWatchlistTicker(id)
    if (seen.has(canonical)) continue
    seen.add(canonical)
    normalized.push(canonical)
  }

  return normalized
}

/** All Supabase stock_id values that represent the same watchlist entry. */
export function getWatchlistDeleteIds(stockId: string): string[] {
  const canonical = canonicalWatchlistTicker(stockId)
  const legacySlugs = Object.entries(LEGACY_STOCK_ID_MAP)
    .filter(([, ticker]) => ticker === canonical)
    .map(([slug]) => slug)

  return [...new Set([canonical, stockId.trim(), ...legacySlugs])]
}

export function getWatchlistLegacyAliases(canonical: string): string[] {
  return Object.entries(LEGACY_STOCK_ID_MAP)
    .filter(([, ticker]) => ticker === canonical)
    .map(([slug]) => slug)
}
