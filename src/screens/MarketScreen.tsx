import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { getDseSummary, getMarketStatus } from '../services/marketApi'
import { getSecurityCount, getSecurityListings } from '../services/securityCatalogApi'
import { Card, ChangeText } from '../components/ui/Card'
import { VirtualSecurityList } from '../components/market/VirtualSecurityList'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import {
  BetaScreenLabels,
  MarketDataNotice,
  MarketStatisticsBanner,
  PrototypeBanner,
} from '../components/trust/ComplianceCopy'
import { LoadingSkeleton, TrustState } from '../components/trust/TrustState'
import type { SecurityListing } from '../types/security'

export function MarketScreen() {
  const { openStock, isDemo } = useApp()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SecurityListing[]>([])
  const [securityCount, setSecurityCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [dseValue, setDseValue] = useState(0)
  const [dseChange, setDseChange] = useState({ value: 0, pct: 0 })
  const [marketStatus, setMarketStatus] = useState<Awaited<ReturnType<typeof getMarketStatus>> | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    Promise.all([getDseSummary(), getMarketStatus(), getSecurityListings('')])
      .then(([dse, market, listings]) => {
        setUnavailable(market.unavailable)
        setMarketStatus(market)
        if (dse) {
          setDseValue(dse.value)
          setDseChange({ value: dse.change, pct: dse.changePct })
        }
        setResults(listings)
        setSecurityCount(getSecurityCount())
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setSearching(true)
    const timer = setTimeout(() => {
      getSecurityListings(query)
        .then((listings) => {
          setResults(listings)
          if (!query.trim()) setSecurityCount(getSecurityCount())
        })
        .finally(() => setSearching(false))
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  return (
    <>
      <ScreenHeader title="Market" subtitle="Dhaka Stock Exchange" large />
      <div className="px-5 pb-4">
        <PrototypeBanner className="mb-4" />
        <BetaScreenLabels isDemo={isDemo} className="mb-3" />
        <MarketStatisticsBanner count={securityCount} className="mb-3" />
        <MarketDataNotice className="mb-4" />

        {loading ? (
          <LoadingSkeleton rows={4} />
        ) : unavailable ? (
          <TrustState
            variant="error"
            title="Market data unavailable"
            message="We could not load DSE market data. Please try again shortly."
          />
        ) : (
          <>
            <Card className="mb-4 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-lenden-muted">DSEX Index</p>
                  <p className="text-2xl font-bold text-white">{dseValue.toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <ChangeText value={dseChange.value} pct={dseChange.pct} />
                  <p className="mt-1 text-[10px] text-lenden-muted">Dhaka Stock Exchange</p>
                </div>
              </div>
              {marketStatus?.status === 'Closed' && (
                <TrustState
                  variant="info"
                  title="DSE market closed"
                  message={`Trading hours: ${marketStatus.hoursLabel}. Quotes shown are for demonstration only.`}
                  className="mt-3"
                />
              )}
              {marketStatus?.isDelayed && marketStatus.status !== 'Closed' && (
                <p className="mt-3 text-[10px] text-lenden-muted">
                  Delayed data notice · Market data shown for demonstration only
                </p>
              )}
            </Card>

            <div className="relative mb-4">
              <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-lenden-muted" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search ticker or company name..."
                className="w-full rounded-2xl border border-white/10 bg-lenden-surface py-3 pr-4 pl-11 text-sm text-white placeholder:text-lenden-muted outline-none focus:border-lenden-mint/40"
              />
            </div>

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
          </>
        )}
      </div>
    </>
  )
}
