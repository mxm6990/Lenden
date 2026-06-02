import { formatVolume } from '../../services/securityApi'
import { formatMarketListingPrice, isNoTradeQuote } from '../../lib/marketListingFormat'
import { getQuoteFreshnessLabel } from '../../lib/marketQuoteFreshness'
import type { SecurityListing } from '../../types/security'
import { ChangeText } from '../ui/Card'

const ROW_HEIGHT = 88

interface SecurityListProps {
  items: SecurityListing[]
  onSelect: (ticker: string) => void
  className?: string
}

export function VirtualSecurityList({ items, onSelect, className = '' }: SecurityListProps) {
  return (
    <div className={className} style={{ minHeight: items.length * ROW_HEIGHT }}>
      <div className="space-y-2">
        {items.map((listing) => (
          <button
            key={listing.ticker}
            type="button"
            onClick={() => onSelect(listing.ticker)}
            className="flex min-h-[80px] w-full items-center justify-between rounded-2xl border border-white/5 bg-lenden-card px-4 py-3 text-left active:scale-[0.99]"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lenden-green text-xs font-bold text-white">
                {listing.ticker.slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">{listing.ticker}</p>
                <p className="truncate text-[11px] text-lenden-muted">{listing.companyName}</p>
              </div>
            </div>
            <div className="shrink-0 pl-3 text-right">
              <p className="text-sm font-bold tabular-nums text-white">
                {formatMarketListingPrice(listing)}
              </p>
              {isNoTradeQuote(listing) && (
                <p className="text-[10px] text-lenden-muted">No trade</p>
              )}
              {listing.hasQuote && listing.change !== null && listing.changePct !== null && (
                <ChangeText value={listing.change} pct={listing.changePct} />
              )}
              {listing.hasQuote && getQuoteFreshnessLabel(listing.quoteTradeTime) && (
                <p className="mt-0.5 text-[10px] text-amber-200/80">
                  {getQuoteFreshnessLabel(listing.quoteTradeTime)}
                </p>
              )}
              {listing.volume !== null && listing.volume > 0 && (
                <p className="mt-0.5 text-[10px] tabular-nums text-lenden-muted">
                  Vol {formatVolume(listing.volume)}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

export { ROW_HEIGHT as SECURITY_ROW_HEIGHT }
