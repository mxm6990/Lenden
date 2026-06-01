import { Search } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getDseSummary, getMarketStatus } from '../services/marketApi'
import { loadSecurityListingsWithMeta } from '../services/securityCatalogApi'
import { getMarketSnapshot } from '../services/marketDataProvider'
import { Card, ChangeText } from '../components/ui/Card'
import { VirtualSecurityList } from '../components/market/VirtualSecurityList'
import { CompactAppHeader } from '../components/layout/CompactAppHeader'
import { MarketFeedBanner } from '../components/trust/ComplianceCopy'
import { LoadingSkeleton, TrustState } from '../components/trust/TrustState'
import type { SecurityListing } from '../types/security'

export function MarketScreen() {
  const { openStock } = useApp()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SecurityListing[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [dseValue, setDseValue] = useState(0)
  const [dseChange, setDseChange] = useState({ value: 0, pct: 0 })
  const [marketStatus, setMarketStatus] = useState<Awaited<ReturnType<typeof getMarketStatus>> | null>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [pricesUnavailable, setPricesUnavailable] = useState(false)
  const [quoteMeta, setQuoteMeta] = useState({ quotesCount: 0, matchedCount: 0 })
  const searchAnchorRef = useRef<HTMLDivElement>(null)
  const listTopRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    Promise.all([getDseSummary(), getMarketStatus(), getMarketSnapshot(), loadSecurityListingsWithMeta('')])
      .then(([dse, market, snapshot, listingLoad]) => {
        setUnavailable(market.unavailable)
        setMarketStatus(market)
        setPricesUnavailable(listingLoad.pricesUnavailable)
        setQuoteMeta({
          quotesCount: listingLoad.quotesCount || snapshot.quotes.length,
          matchedCount: listingLoad.matchedCount,
        })
        if (dse) {
          setDseValue(dse.value)
          setDseChange({ value: dse.change, pct: dse.changePct })
        }
        setResults(listingLoad.listings)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading) return
    setSearching(true)
    const timer = setTimeout(() => {
      loadSecurityListingsWithMeta(query)
        .then((listingLoad) => {
          setResults(listingLoad.listings)
          setPricesUnavailable(listingLoad.pricesUnavailable)
          setQuoteMeta({
            quotesCount: listingLoad.quotesCount,
            matchedCount: listingLoad.matchedCount,
          })
        })
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
          {pricesUnavailable && (
            <div className="mx-5 mb-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
              <p className="text-sm font-semibold text-amber-200">Market prices unavailable</p>
              <p className="mt-1 text-xs text-amber-100/80">
                Live DSE quotes could not be matched to the securities list
                {quoteMeta.quotesCount > 0
                  ? ` (${quoteMeta.matchedCount} of ${results.length} matched from ${quoteMeta.quotesCount} quotes).`
                  : ' (quote feed returned no usable prices).'}
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
