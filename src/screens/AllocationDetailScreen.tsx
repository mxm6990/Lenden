import { useState } from 'react'
import { TrendingUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { formatBDT } from '../data/stocks'
import {
  getIndustryForHolding,
  getPortfolioAllocationByIndustry,
} from '../data/allocation'
import {
  getCombinedPnL,
  getPortfolioHistory,
  getPortfolioSummary,
  getRealizedPnL,
  type PortfolioHistoryPoint,
} from '../data/portfolio'
import { AllocationPieChart } from '../components/charts/AllocationPieChart'
import { HoldingRow } from '../components/portfolio/HoldingRow'
import { PastTransactionsSection } from '../components/portfolio/PastTransactionsSection'
import { PortfolioChart } from '../components/charts/PortfolioChart'
import { Card, ChangeText } from '../components/ui/Card'
import { ScreenHeader } from '../components/layout/ScreenHeader'

export function AllocationDetailScreen() {
  const { closeOverlay, openStock } = useApp()
  const [scrubbedPoint, setScrubbedPoint] = useState<PortfolioHistoryPoint | null>(null)

  const summary = getPortfolioSummary()
  const allocation = getPortfolioAllocationByIndustry()
  const history = getPortfolioHistory()
  const { unrealized, realized, total } = getCombinedPnL()
  const { entries: realizedEntries } = getRealizedPnL()

  return (
    <>
      <ScreenHeader
        title="Allocation"
        subtitle="By industry"
        onBack={closeOverlay}
      />

      <div className="px-5 pb-4">
        <Card className="mb-5 p-5">
          <AllocationPieChart data={allocation} size={280} />
        </Card>

        <p className="mb-3 text-xs font-semibold tracking-wide text-lenden-muted uppercase">
          Profit & loss
        </p>
        <div className="mb-5 grid grid-cols-3 gap-2">
          <Card className="p-3">
            <p className="text-[10px] font-medium text-lenden-muted">Unrealized</p>
            <ChangeText
              value={unrealized.amount}
              pct={unrealized.pct}
              className="mt-1 block text-sm"
            />
          </Card>
          <Card className="p-3">
            <p className="text-[10px] font-medium text-lenden-muted">Realized</p>
            <p className="mt-1 text-sm font-bold text-lenden-mint">+{formatBDT(realized)}</p>
          </Card>
          <Card className="p-3">
            <p className="text-[10px] font-medium text-lenden-muted">Combined</p>
            <p className="mt-1 text-sm font-bold text-white">+{formatBDT(total)}</p>
          </Card>
        </div>

        <p className="mb-3 text-xs font-semibold tracking-wide text-lenden-muted uppercase">
          Realized history
        </p>
        <Card className="mb-5 divide-y divide-white/5 overflow-hidden">
          {realizedEntries.map((entry) => (
            <div key={entry.id} className="flex items-start justify-between gap-3 px-4 py-3.5">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{entry.ticker}</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium text-lenden-muted capitalize">
                    {entry.type}
                  </span>
                </div>
                <p className="mt-0.5 text-[11px] text-lenden-muted">{entry.note}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-lenden-mint">+{formatBDT(entry.amount)}</p>
                <p className="text-[10px] text-lenden-muted">{entry.date}</p>
              </div>
            </div>
          ))}
        </Card>

        <p className="mb-3 text-xs font-semibold tracking-wide text-lenden-muted uppercase">
          Portfolio history
        </p>
        <Card className="mb-5 p-5 pb-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-lenden-muted">
                {scrubbedPoint ? scrubbedPoint.label : 'Current value'}
              </p>
              <p className="text-xl font-bold text-white">
                {formatBDT(scrubbedPoint?.value ?? summary.totalValue)}
              </p>
            </div>
            {!scrubbedPoint && (
              <span className="inline-flex items-center gap-1 rounded-full bg-lenden-mint/15 px-2.5 py-1 text-xs font-semibold text-lenden-mint">
                <TrendingUp className="h-3.5 w-3.5" />
                {unrealized.pct.toFixed(1)}%
              </span>
            )}
          </div>
          <PortfolioChart data={history} onScrub={setScrubbedPoint} />
        </Card>

        <p className="mb-3 text-xs font-semibold tracking-wide text-lenden-muted uppercase">
          Current holdings · {summary.holdings.length}
        </p>
        <div className="space-y-2">
          {summary.holdings.map((holding) => {
            const industry = getIndustryForHolding(holding.stock.sector)
            const slice = allocation.find((s) => s.id === industry)
            return (
              <HoldingRow
                key={holding.stockId}
                holding={holding}
                showSparkline={false}
                onClick={() => openStock(holding.stockId)}
                leading={
                  <span
                    className="h-10 w-1 shrink-0 rounded-full"
                    style={{ backgroundColor: slice?.color ?? '#4ade80' }}
                  />
                }
              />
            )
          })}
        </div>

        <PastTransactionsSection className="mt-6" />
      </div>
    </>
  )
}
