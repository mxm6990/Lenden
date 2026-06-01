import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatMarketListingPrice } from '../lib/marketListingFormat'
import { matchesWatchlistId } from '../lib/watchlistState'
import { getSecurityListings } from '../services/securityCatalogApi'
import { WatchlistToggleButton } from '../components/market/WatchlistToggleButton'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { ChangeText } from '../components/ui/Card'
import { LoadingSkeleton, TrustState } from '../components/trust/TrustState'
import type { SecurityListing } from '../types/security'

export function WatchlistScreen() {
  const { watchlist, openStock, closeOverlay } = useApp()
  const [loading, setLoading] = useState(true)
  const [listings, setListings] = useState<SecurityListing[]>([])

  useEffect(() => {
    let cancelled = false

    getSecurityListings('')
      .then((results) => {
        if (cancelled) return
        setListings(results)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const watchlistItems = useMemo(() => {
    return watchlist
      .map((id) => listings.find((listing) => matchesWatchlistId(listing.ticker, id)))
      .filter((listing): listing is SecurityListing => Boolean(listing))
  }, [listings, watchlist])

  return (
    <>
      <ScreenHeader title="Watchlist" subtitle="Saved securities" onBack={closeOverlay} />
      <div className="px-5 pt-4 pb-6">
        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : watchlist.length === 0 ? (
          <TrustState
            variant="empty"
            title="No stocks in your watchlist yet"
            message="Add stocks from Market or Stock Detail."
          />
        ) : watchlistItems.length === 0 ? (
          <LoadingSkeleton rows={3} />
        ) : (
          <div className="space-y-2">
            {watchlistItems.map((listing) => (
              <div
                key={listing.ticker}
                className="flex items-center gap-2 rounded-2xl border border-white/5 bg-lenden-card pr-2"
              >
                <button
                  type="button"
                  onClick={() => openStock(listing.ticker)}
                  className="flex min-h-[80px] min-w-0 flex-1 items-center justify-between px-4 py-3 text-left active:scale-[0.99]"
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
                    {listing.hasQuote && listing.change !== null && listing.changePct !== null && (
                      <ChangeText value={listing.change} pct={listing.changePct} />
                    )}
                  </div>
                </button>
                <WatchlistToggleButton ticker={listing.ticker} className="mr-1" />
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
