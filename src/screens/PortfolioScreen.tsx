import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { formatBDT } from '../data/stocks'
import { getPortfolioBundle, type PortfolioBundle } from '../services/portfolioApi'
import type { PortfolioHistoryPoint } from '../data/portfolio'
import type { AllocationSegment } from '../data/allocation'
import { Card, ChangeText } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { CompactAppHeader } from '../components/layout/CompactAppHeader'
import { PortfolioChart } from '../components/charts/PortfolioChart'
import { PrototypeBanner } from '../components/trust/ComplianceCopy'
import { LoadingSkeleton, TrustState } from '../components/trust/TrustState'
import { useApp } from '../context/AppContext'

export function PortfolioScreen() {
  const { openStock, openAllocation, startBuy, startSell, portfolioVersion, dataRefreshing } =
    useApp()
  const [scrubbedPoint, setScrubbedPoint] = useState<PortfolioHistoryPoint | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const [summary, setSummary] = useState<PortfolioBundle['summary'] | null>(null)
  const [history, setHistory] = useState<PortfolioHistoryPoint[]>([])
  const [allocation, setAllocation] = useState<AllocationSegment[]>([])
  const [holdings, setHoldings] = useState<PortfolioBundle['holdings']>([])
  const [portfolioError, setPortfolioError] = useState<string | null>(null)
  const loadSeq = useRef(0)

  useEffect(() => {
    const seq = ++loadSeq.current

    getPortfolioBundle()
      .then((bundle) => {
        if (seq !== loadSeq.current) return

        setPortfolioError(bundle.error)
        setSummary(bundle.summary)
        setHistory(bundle.history)
        setAllocation(bundle.allocation)
        setHoldings(bundle.holdings)
      })
      .finally(() => {
        if (seq === loadSeq.current) {
          setInitialLoad(false)
        }
      })
  }, [portfolioVersion])

  const displayedValue = scrubbedPoint?.value ?? summary?.totalValue ?? 0
  const showInitialSkeleton = initialLoad && !summary

  return (
    <>
      <CompactAppHeader title="Portfolio" subtitle="Your DSE holdings" />
      <div className="px-5 pb-4">
        <PrototypeBanner className="mb-3" />
        {portfolioError && (
          <TrustState
            variant="error"
            title="Portfolio data unavailable"
            message={portfolioError}
            className="mb-4"
          />
        )}
        {dataRefreshing && (
          <p className="mb-3 text-center text-[10px] text-lenden-muted">Refreshing portfolio…</p>
        )}
        {showInitialSkeleton ? (
          <LoadingSkeleton rows={5} />
        ) : summary ? (
          <>
            <Card className="mb-4 p-5 pb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-lenden-muted">Total invested</p>
                  <p className="text-xl font-bold text-white">{formatBDT(summary.totalInvested)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-lenden-muted">
                    {scrubbedPoint ? scrubbedPoint.label : 'Current value'}
                  </p>
                  <p className="text-xl font-bold text-white">{formatBDT(displayedValue)}</p>
                </div>
              </div>
              {!scrubbedPoint && (
                <div className="mt-4 border-t border-white/5 pt-4">
                  <p className="text-sm font-medium text-lenden-muted">All-time return</p>
                  <ChangeText
                    value={summary.totalGain}
                    pct={summary.totalGainPct}
                    className="text-base"
                  />
                </div>
              )}
              <div className="mt-5">
                <PortfolioChart data={history} onScrub={setScrubbedPoint} />
              </div>
            </Card>

            <button
              type="button"
              onClick={openAllocation}
              className="mb-5 w-full rounded-2xl border border-white/5 bg-lenden-card p-4 text-left transition active:scale-[0.99]"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">Allocation</p>
                  <p className="mt-0.5 text-xs text-lenden-muted">
                    {allocation.length} industries · tap to view breakdown
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-lenden-muted" />
              </div>
              <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-white/5">
                {allocation.map((slice) => (
                  <div
                    key={slice.id}
                    className="h-full"
                    style={{ width: `${slice.pct}%`, backgroundColor: slice.color }}
                  />
                ))}
              </div>
            </button>

            <p className="mb-3 text-xs font-semibold tracking-wide text-lenden-muted uppercase">
              Holdings · {holdings.length}
            </p>
            {holdings.length === 0 ? (
              <TrustState
                variant="empty"
                title="No holdings yet"
                message="Your DSE positions will appear here once you invest."
              />
            ) : (
              <div className="space-y-2">
                {holdings.map((h, i) => (
                  <motion.div
                    key={h.stockId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-2xl border border-white/5 bg-lenden-card p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lenden-green text-[10px] font-bold text-white">
                          {h.stock.ticker.slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-white">{h.stock.ticker}</p>
                          <p className="text-[11px] text-lenden-muted">
                            {h.shares} shares · avg {formatBDT(h.avgCost)}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-white">{formatBDT(h.currentValue)}</p>
                        <ChangeText value={h.returnAmount} pct={h.returnPct} />
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/5 pt-3">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => startBuy(h.stockId)}
                      >
                        Buy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={h.shares <= 0}
                        onClick={() => startSell(h.stockId)}
                      >
                        Sell
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="w-full"
                        onClick={() => openStock(h.stockId)}
                      >
                        View
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        ) : (
          <TrustState
            variant="empty"
            title="Portfolio unavailable"
            message="We could not load your portfolio summary."
          />
        )}
      </div>
    </>
  )
}
