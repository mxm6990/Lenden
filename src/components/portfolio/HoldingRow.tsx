import type { ReactNode } from 'react'
import type { EnrichedHolding } from '../../data/stocks'
import { formatBDT } from '../../data/stocks'
import { Sparkline } from '../ui/Sparkline'

interface HoldingRowProps {
  holding: EnrichedHolding
  onClick: () => void
  showSparkline?: boolean
  leading?: ReactNode
}

export function HoldingRow({
  holding,
  onClick,
  showSparkline = true,
  leading,
}: HoldingRowProps) {
  const isProfit = holding.returnAmount >= 0
  const returnColor = isProfit ? 'text-lenden-mint' : 'text-red-400'

  const gridCols = leading
    ? showSparkline
      ? 'grid-cols-[auto_auto_minmax(0,1fr)_auto]'
      : 'grid-cols-[auto_auto_minmax(0,1fr)]'
    : showSparkline
      ? 'grid-cols-[auto_minmax(0,1fr)_auto]'
      : 'grid-cols-[auto_minmax(0,1fr)]'

  return (
    <button
      type="button"
      onClick={onClick}
      className={`grid w-full ${gridCols} items-center gap-3 rounded-2xl border border-white/5 bg-lenden-surface p-3.5 text-left transition active:scale-[0.99]`}
    >
      {leading}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lenden-green text-[10px] font-bold text-white">
        {holding.stock.ticker.slice(0, 2)}
      </div>

      <div className="min-w-0 grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-0.5">
        <p className="truncate text-sm font-semibold text-white">{holding.stock.ticker}</p>
        <p className="text-right text-sm font-semibold tabular-nums text-white">
          {formatBDT(holding.currentValue)}
        </p>
        <p className="truncate text-[11px] text-lenden-muted">
          {holding.shares} shares · avg {formatBDT(holding.avgCost)}
        </p>
        <p className={`text-right text-xs font-semibold tabular-nums whitespace-nowrap ${returnColor}`}>
          {isProfit ? '+' : ''}
          {formatBDT(holding.returnAmount)} ({isProfit ? '+' : ''}
          {holding.returnPct.toFixed(1)}%)
        </p>
      </div>

      {showSparkline && (
        <Sparkline
          points={holding.stock.chartPoints}
          positive={isProfit}
          className="h-10 w-14 shrink-0 sm:w-16"
        />
      )}
    </button>
  )
}
