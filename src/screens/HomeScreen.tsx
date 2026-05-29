import { ChevronRight, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatBDT, stocks, type Stock } from '../data/stocks'
import { getPortfolioBundle, type PortfolioBundle } from '../services/portfolioApi'
import type { PortfolioHistoryPoint } from '../data/portfolio'
import { DSE_STATUS_STYLES, getDseSummary, getMarketStatus, getStocks } from '../services/marketApi'
import { Card, ChangeText } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { LendenLogo } from '../components/brand/LendenLogo'
import { PortfolioChart } from '../components/charts/PortfolioChart'
import { BuyingPowerCard } from '../components/portfolio/BuyingPowerCard'
import { HoldingRow } from '../components/portfolio/HoldingRow'
import { PastTransactionsSection } from '../components/portfolio/PastTransactionsSection'
import { PrototypeBanner, PrototypeModeBadge } from '../components/trust/ComplianceCopy'
import { LoadingSkeleton, TrustState } from '../components/trust/TrustState'

export function HomeScreen() {
  const { watchlist, openStock, startBuy, setTab, user, isDemo, portfolioVersion, dataRefreshing } =
    useApp()
  const [scrubbedPoint, setScrubbedPoint] = useState<PortfolioHistoryPoint | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const [portfolioValue, setPortfolioValue] = useState(0)
  const [portfolioHistory, setPortfolioHistory] = useState<PortfolioHistoryPoint[]>([])
  const [todayGain, setTodayGain] = useState({ amount: 0, pct: 0, sourceLabel: null as string | null })
  const [holdings, setHoldings] = useState<PortfolioBundle['holdings']>([])
  const [buyingPower, setBuyingPower] = useState<PortfolioBundle['buyingPower']>(null)
  const [dseValue, setDseValue] = useState(0)
  const [dseChange, setDseChange] = useState({ value: 0, pct: 0 })
  const [marketStatus, setMarketStatus] = useState<Awaited<ReturnType<typeof getMarketStatus>> | null>(null)
  const [watchlistStocks, setWatchlistStocks] = useState<Stock[]>([])
  const [marketUnavailable, setMarketUnavailable] = useState(false)
  const [portfolioError, setPortfolioError] = useState<string | null>(null)
  const [buyingPowerError, setBuyingPowerError] = useState<string | null>(null)
  const loadSeq = useRef(0)

  const firstName = user.fullName.trim().split(/\s+/)[0] ?? ''
  const greeting = firstName ? `Good morning, ${firstName}` : 'Good morning'
  const displayedValue = scrubbedPoint?.value ?? portfolioValue
  const showInitialSkeleton = initialLoad

  useEffect(() => {
    const seq = ++loadSeq.current

    Promise.all([getPortfolioBundle(), getDseSummary(), getMarketStatus(), getStocks()])
      .then(([bundle, dse, market, allStocks]) => {
        if (seq !== loadSeq.current) return

        setPortfolioError(bundle.error)
        setBuyingPowerError(bundle.buyingPowerError)
        setPortfolioValue(bundle.summary.totalValue)
        setPortfolioHistory(bundle.history)
        setTodayGain(bundle.dayChange)
        setHoldings(bundle.holdings)
        setBuyingPower(bundle.buyingPower)
        setMarketStatus(market)
        setMarketUnavailable(market.unavailable)
        if (dse) {
          setDseValue(dse.value)
          setDseChange({ value: dse.change, pct: dse.changePct })
        }
        setWatchlistStocks(
          watchlist
            .map((id) => allStocks.find((s) => s.id === id))
            .filter((s): s is Stock => Boolean(s)),
        )
      })
      .finally(() => {
        if (seq === loadSeq.current) {
          setInitialLoad(false)
        }
      })
  }, [watchlist, portfolioVersion])

  return (
    <div className="px-5 pt-14 pb-4">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <PrototypeBanner className="mb-4" />
        {isDemo && <PrototypeModeBadge className="mb-3" />}
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-medium text-lenden-muted">{greeting}</p>
            <h1 className="text-3xl font-bold tracking-tight text-white">Your portfolio</h1>
          </div>
          <LendenLogo lockup="englishDark" className="shrink-0" />
        </div>

        {showInitialSkeleton ? (
          <LoadingSkeleton rows={4} className="mt-5" />
        ) : (
          <>
            {dataRefreshing && (
              <p className="mt-3 text-center text-[10px] text-lenden-muted">Refreshing portfolio…</p>
            )}
            {portfolioError && (
              <TrustState
                variant="error"
                title="Portfolio data unavailable"
                message={portfolioError}
                className="mt-4"
              />
            )}
            <Card className="mt-5 p-5 pb-4">
              <p className="text-sm font-medium text-lenden-muted">
                {scrubbedPoint ? scrubbedPoint.label : 'Portfolio value'}
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tight tabular-nums text-white">
                {formatBDT(displayedValue)}
              </p>
              {!scrubbedPoint && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-lenden-mint/15 px-3 py-1.5 text-sm font-semibold tabular-nums text-lenden-mint">
                    <TrendingUp className="h-4 w-4 shrink-0" />
                    +{formatBDT(todayGain.amount)} today
                  </span>
                  <span className="text-sm tabular-nums text-lenden-muted">
                    {todayGain.pct >= 0 ? '+' : ''}
                    {todayGain.pct.toFixed(2)}%
                  </span>
                  {todayGain.sourceLabel && (
                    <span className="text-[10px] text-lenden-muted">{todayGain.sourceLabel}</span>
                  )}
                </div>
              )}
              <div className="mt-5">
                <PortfolioChart data={portfolioHistory} onScrub={setScrubbedPoint} />
              </div>
            </Card>

            {buyingPower ? (
              <BuyingPowerCard buyingPower={buyingPower} className="mt-4" />
            ) : (
              <TrustState
                variant="warning"
                title="Buying power unavailable"
                message={
                  buyingPowerError ??
                  'We could not load your BO account cash balance right now.'
                }
                className="mt-4"
              />
            )}

            {marketUnavailable ? (
              <TrustState
                variant="error"
                title="Market data unavailable"
                message="DSE market data is temporarily unavailable. Displayed values may be outdated."
                className="mt-4"
              />
            ) : (
              <Card className="mt-4 flex items-start justify-between gap-3 p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-lenden-muted">DSE Market</p>
                  <p className="mt-0.5 text-3xl font-bold tracking-tight text-white">
                    {dseValue.toLocaleString()}
                  </p>
                  <ChangeText value={dseChange.value} pct={dseChange.pct} className="text-base" />
                  {marketStatus?.isDelayed && (
                    <p className="mt-2 text-[10px] text-lenden-muted">Delayed data · demonstration only</p>
                  )}
                </div>
                {marketStatus && (
                  <div className="max-w-[42%] shrink-0 text-right">
                    <span
                      className={`inline-flex rounded-full px-3 py-1.5 text-sm font-semibold ${DSE_STATUS_STYLES[marketStatus.status]}`}
                    >
                      {marketStatus.status}
                    </span>
                    <p className="mt-2 text-xs leading-snug text-lenden-muted">
                      {marketStatus.sessionLabel}
                    </p>
                  </div>
                )}
              </Card>
            )}

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Your Portfolio</p>
                <button
                  onClick={() => setTab('portfolio')}
                  className="text-xs font-medium text-lenden-mint"
                >
                  See all
                </button>
              </div>
              {holdings.length === 0 ? (
                <TrustState
                  variant="empty"
                  title="No holdings yet"
                  message="When you invest in DSE stocks, your positions will appear here."
                />
              ) : (
                <div className="space-y-2">
                  {holdings.map((holding) => (
                    <HoldingRow
                      key={holding.stockId}
                      holding={holding}
                      onClick={() => openStock(holding.stockId)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Watchlist</p>
                <button
                  onClick={() => setTab('market')}
                  className="text-xs font-medium text-lenden-mint"
                >
                  See all
                </button>
              </div>
              <div className="space-y-2">
                {watchlistStocks.slice(0, 3).map((stock) => (
                  <button
                    key={stock.id}
                    onClick={() => openStock(stock.id)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-lenden-surface p-3.5 text-left transition active:scale-[0.99]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lenden-green text-[10px] font-bold text-white">
                        {stock.ticker.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">{stock.ticker}</p>
                        <p className="truncate text-[11px] text-lenden-muted">
                          {stock.name.split(' ')[0]}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold tabular-nums text-white">
                        {formatBDT(stock.price)}
                      </p>
                      <ChangeText value={stock.change} pct={stock.changePct} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <Card className="mt-6 p-4">
              <div className="flex min-w-0 items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">Ready to invest?</p>
                  <p className="text-xs text-lenden-muted">Start with ৳500 in top DSE picks</p>
                </div>
                <Button size="sm" className="shrink-0" onClick={() => startBuy(stocks[0].id)}>
                  Buy
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </Card>

            <PastTransactionsSection className="mt-6" />
          </>
        )}
      </motion.div>
    </div>
  )
}
