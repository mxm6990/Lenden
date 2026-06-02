import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getDseSummary, getMarketStatus } from '../services/marketApi'
import { loadSecurityListingsWithMeta } from '../services/securityCatalogApi'
import { Card, ChangeText } from '../components/ui/Card'
import { VirtualSecurityList } from '../components/market/VirtualSecurityList'
import { CompactAppHeader } from '../components/layout/CompactAppHeader'
import { MarketFeedBanner } from '../components/trust/ComplianceCopy'
import { LoadingSkeleton, TrustState } from '../components/trust/TrustState'
import type { MarketDataStatus } from '../types/marketData'
import type { SecurityListing } from '../types/security'

export function MarketScreen() {
  const { openStock, isDemo, isAuthenticated, dataRefreshing, portfolioVersion } = useApp()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SecurityListing[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [dseValue, setDseValue] = useState(0)
  const [dseChange, setDseChange] = useState({ value: 0, pct: 0 })
  const [marketStatus, setMarketStatus] = useState<Awaited<ReturnType<typeof getMarketStatus>> | null>(null)
  const [quoteStatus, setQuoteStatus] = useState<MarketDataStatus | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [pricesUnavailable, setPricesUnavailable] = useState(false)
  const [usingCachedPrices, setUsingCachedPrices] = useState(false)
  const [stalePrices, setStalePrices] = useState(false)
  const [quoteMeta, setQuoteMeta] = useState({ quotesCount: 0, matchedCount: 0 })
  const searchAnchorRef = useRef<HTMLDivElement>(null)
  const listTopRef = useRef<HTMLDivElement>(null)

  function applyListingLoad(listingLoad: Awaited<ReturnType<typeof loadSecurityListingsWithMeta>>) {
    setQuoteStatus(listingLoad.status)
    setPricesUnavailable(listingLoad.pricesUnavailable)
    setUsingCachedPrices(listingLoad.usingCachedPrices)
    setStalePrices(listingLoad.stalePrices)
    setQuoteMeta({
      quotesCount: listingLoad.quotesCount,
      matchedCount: listingLoad.matchedCount,
    })
    setResults(listingLoad.listings)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    Promise.all([getDseSummary(), getMarketStatus(), loadSecurityListingsWithMeta('')])
      .then(([dse, market, listingLoad]) => {
        if (cancelled) return
        setUnavailable(market.unavailable)
        setMarketStatus(market)
        applyListingLoad(listingLoad)
        if (dse) {
          setDseValue(dse.value)
          setDseChange({ value: dse.change, pct: dse.changePct })
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [isDemo, isAuthenticated, dataRefreshing, portfolioVersion])

  useEffect(() => {
    if (loading) return
    setSearching(true)
    const timer = setTimeout(() => {
      loadSecurityListingsWithMeta(query)
        .then((listingLoad) => applyListingLoad(listingLoad))
        .finally(() => setSearching(false))
    }, 150)

    return () => clearTimeout(timer)
  }, [query, loading])

  useEffect(() => {
    if (!query.trim()) return
    listTopRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [query])

  return (
    <div className="screen-content-padding">
      <CompactAppHeader title="Market" subtitle="Dhaka Stock Exchange" />
      <MarketFeedBanner />

      {loading ? (
        <div className="px-5 pt-2">
          <LoadingSkeleton rows={4} />
        </div>
      ) : unavailable ? (
        <div className="px-5 pt-2">
          <TrustState
            variant="error"
            title="Market data unavailable"
            message="We could not load DSE market data. Please try again shortly."
          />
        </div>
      ) : (
        <>
          {usingCachedPrices && !pricesUnavailable && (
            <div className="mx-5 mb-3 rounded-2xl border border-sky-400/30 bg-sky-500/10 px-4 py-3">
              <p className="text-sm font-semibold text-sky-100">Using cached prices</p>
              <p className="mt-1 text-xs text-sky-100/80">
                Live DSE upstream is temporarily unavailable. Showing the last successful quote snapshot
                {quoteStatus?.cacheAgeMs
                  ? ` from ${Math.round(quoteStatus.cacheAgeMs / 60_000)} minutes ago.`
                  : '.'}
              </p>
            </div>
          )}

          {stalePrices && !pricesUnavailable && (
            <div className="mx-5 mb-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <p className="text-sm font-semibold text-amber-200">Stale cached prices</p>
              <p className="mt-1 text-xs text-amber-100/80">
                Cached quotes are older than 24 hours. Prices are shown for continuity but may not reflect
                today&apos;s market.
              </p>
            </div>
          )}

          {pricesUnavailable && (
            <div className="mx-5 mb-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <p className="text-sm font-semibold text-amber-200">Market prices unavailable</p>
              <p className="mt-1 text-xs text-amber-100/80">
                Live DSE quotes and cached prices are unavailable
                {quoteMeta.quotesCount > 0
                  ? ` (${quoteMeta.matchedCount} of ${results.length} matched from ${quoteMeta.quotesCount} quotes).`
                  : '.'}
              </p>
            </div>
          )}

          <Card className="mx-5 mb-3 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium text-lenden-muted">DSEX Index</p>
                <p className="text-xl font-bold text-white">{dseValue.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <ChangeText value={dseChange.value} pct={dseChange.pct} />
              </div>
            </div>
            {marketStatus?.status === 'Closed' && (
              <p className="mt-2 text-[10px] text-lenden-muted">
                Market closed · {marketStatus.hoursLabel}
              </p>
            )}
          </Card>

          <div
            ref={searchAnchorRef}
            className="sticky top-[calc(var(--app-header-height)+0.25rem)] z-20 border-b border-white/5 bg-lenden-black/95 px-5 py-2.5 backdrop-blur-xl"
          >
            <div className="relative">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-lenden-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search ticker or company name..."
                enterKeyHint="search"
                autoCorrect="off"
                autoCapitalize="characters"
                className="w-full rounded-2xl border border-white/10 bg-lenden-surface py-3.5 pr-4 pl-11 text-base text-white placeholder:text-lenden-muted outline-none focus:border-lenden-mint/40"
              />
            </div>
          </div>

          <div ref={listTopRef} className="px-5 pt-3">
            <p className="mb-3 text-xs font-semibold tracking-wide text-lenden-muted uppercase">
              DSE Securities · {results.length} results
            </p>

            {searching && <LoadingSkeleton rows={2} className="mb-3" />}

            {!searching && results.length === 0 && (
              <TrustState
                variant="empty"
                title="No securities found"
                message="Try a different ticker or company name."
              />
            )}

            {!searching && results.length > 0 && (
              <VirtualSecurityList items={results} onSelect={openStock} />
            )}
          </div>
        </>
      )}
    </div>
  )
}
