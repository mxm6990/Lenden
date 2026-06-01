import { formatBDT } from '../data/stocks'
import type { SecurityListing } from '../types/security'

export function formatMarketListingPrice(
  listing: Pick<SecurityListing, 'hasQuote' | 'lastPrice'>,
): string {
  if (!listing.hasQuote || listing.lastPrice === null) return '—'
  return formatBDT(listing.lastPrice)
}

export function isNoTradeQuote(listing: Pick<SecurityListing, 'hasQuote' | 'lastPrice'>): boolean {
  return listing.hasQuote && listing.lastPrice === 0
}
