import { matchesStockId, normalizeSecurityKey } from './securityListing'

export function canonicalWatchlistTicker(stockId: string): string {
  return normalizeSecurityKey(stockId)
}

export function isWatchlistMember(watchlist: string[], stockId: string): boolean {
  return watchlist.some((id) => matchesStockId(id, stockId))
}

export function withoutWatchlistMember(watchlist: string[], stockId: string): string[] {
  return watchlist.filter((id) => !matchesStockId(id, stockId))
}

export function withWatchlistMember(watchlist: string[], stockId: string): string[] {
  const canonical = canonicalWatchlistTicker(stockId)
  return [...withoutWatchlistMember(watchlist, canonical), canonical]
}
