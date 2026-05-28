import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { formatBDT } from '../data/stocks'
import {
  getAllocationBreakdown,
  getHoldings,
  getPortfolioHistoryData,
  getPortfolioSummary,
} from '../services/portfolioApi'
import type { PortfolioHistoryPoint } from '../data/portfolio'
import type { AllocationSegment } from '../data/allocation'
import { Card, ChangeText } from '../components/ui/Card'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { PortfolioChart } from '../components/charts/PortfolioChart'
import { PrototypeBanner } from '../components/trust/ComplianceCopy'
import { LoadingSkeleton, TrustState } from '../components/trust/TrustState'
import { useApp } from '../context/AppContext'

export function PortfolioScreen() {
  const { openStock, openAllocation } = useApp()
  const [scrubbedPoint, setScrubbedPoint] = useState<PortfolioHistoryPoint | null>(null)
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<Awaited<ReturnType<typeof getPortfolioSummary>> | null>(null)
  const [history, setHistory] = useState<PortfolioHistoryPoint[]>([])
  const [allocation, setAllocation] = useState<AllocationSegment[]>([])
  const [holdings, setHoldings] = useState<Awaited<ReturnType<typeof getHoldings>>>([])

  useEffect(() => {
    Promise.all([
      getPortfolioSummary(),
      getPortfolioHistoryData(),
      getAllocationBreakdown(),
      getHoldings(),
    ]).then(([s, h, a, holdingsData]) => {
      setSummary(s)
      setHistory(h)
      setAllocation(a)
      setHoldings(holdingsData)
      setLoading(false)
    })
  }, [])

  const displayedValue = scrubbedPoint?.value ?? summary?.totalValue ?? 0

  return (
    <>
      <ScreenHeader title="Portfolio" subtitle="Your DSE holdings" large />
      <div className="px-5 pb-4">
        <PrototypeBanner className="mb-4" />
        {loading || !summary ? (
          <LoadingSkeleton rows={5} />
        ) : (
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
                  <motion.button
                    key={h.stockId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => openStock(h.stockId)}
                    className="flex w-full items-center justify-between rounded-2xl border border-white/5 bg-lenden-card p-4 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-lenden-green text-[10px] font-bold text-white">
                        {h.stock.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">{h.stock.ticker}</p>
                        <p className="text-[11px] text-lenden-muted">
                          {h.shares} shares · avg {formatBDT(h.avgCost)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{formatBDT(h.currentValue)}</p>
                      <ChangeText value={h.returnAmount} pct={h.returnPct} />
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
