import { Search } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatBDT, type Stock } from '../data/stocks'
import { getDseSummary, getMarketStatus, searchStocks } from '../services/marketApi'
import { Card, ChangeText } from '../components/ui/Card'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { BetaScreenLabels, MarketDataNotice, PrototypeBanner } from '../components/trust/ComplianceCopy'
import { LoadingSkeleton, TrustState } from '../components/trust/TrustState'

export function MarketScreen() {
  const { openStock, isDemo } = useApp()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)
  const [dseValue, setDseValue] = useState(0)
  const [dseChange, setDseChange] = useState({ value: 0, pct: 0 })
  const [marketStatus, setMarketStatus] = useState<Awaited<ReturnType<typeof getMarketStatus>> | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    Promise.all([getDseSummary(), getMarketStatus(), searchStocks('')])
      .then(([dse, market, stocks]) => {
        setUnavailable(market.unavailable)
        setMarketStatus(market)
        if (dse) {
          setDseValue(dse.value)
          setDseChange({ value: dse.change, pct: dse.changePct })
        }
        setResults(stocks)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setSearching(true)
    const timer = setTimeout(() => {
      searchStocks(query)
        .then(setResults)
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
                placeholder="Search stocks..."
                className="w-full rounded-2xl border border-white/10 bg-lenden-surface py-3 pr-4 pl-11 text-sm text-white placeholder:text-lenden-muted outline-none focus:border-lenden-mint/40"
              />
            </div>

            <p className="mb-3 text-xs font-semibold tracking-wide text-lenden-muted uppercase">
              DSE Stocks · {results.length} results
            </p>

            {searching && <LoadingSkeleton rows={2} className="mb-3" />}

            {!searching && results.length === 0 && (
              <TrustState
                variant="empty"
                title="No stocks found"
                message="Try a different ticker or company name."
              />
            )}

            <div className="space-y-2">
              {results.map((stock, i) => (
                <motion.button
                  key={stock.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => openStock(stock.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-lenden-card p-4 text-left active:scale-[0.99]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lenden-green text-xs font-bold text-white">
                      {stock.ticker.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{stock.ticker}</p>
                      <p className="text-[11px] text-lenden-muted">{stock.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{formatBDT(stock.price)}</p>
                    <ChangeText value={stock.change} pct={stock.changePct} />
                  </div>
                </motion.button>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  )
}
