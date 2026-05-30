import { useEffect, useMemo, useState } from 'react'
import { formatBDT } from '../../data/stocks'
import { getStockHistory, type StockHistoryRange } from '../../services/stockHistoryApi'
import type { StockHistorySummary } from '../../types/stockHistory'
import { LoadingSkeleton } from '../trust/TrustState'

const RANGES: StockHistoryRange[] = ['1D', '1W', '1M', '6M', '1Y']

const SOURCE_BADGE_STYLES: Record<StockHistorySummary['sourceLabel'], string> = {
  'Historical data': 'border-lenden-mint/35 bg-lenden-mint/10 text-lenden-mint',
  'Session estimate': 'border-amber-400/35 bg-amber-500/10 text-amber-200',
  'Prototype estimate': 'border-orange-400/35 bg-orange-500/10 text-orange-200',
  'Prototype history': 'border-white/15 bg-white/5 text-lenden-muted',
}

interface StockHistoryChartProps {
  ticker: string
  className?: string
}

export function StockHistoryChart({ ticker, className = '' }: StockHistoryChartProps) {
  const [range, setRange] = useState<StockHistoryRange>('1D')
  const [summary, setSummary] = useState<StockHistorySummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getStockHistory(ticker, range)
      .then((data) => {
        if (!cancelled) setSummary(data)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [ticker, range])

  useEffect(() => {
    setRange('1D')
  }, [ticker])

  const coords = useMemo(() => {
    if (!summary || summary.points.length === 0) return ''
    const prices = summary.points.map((point) => point.price)
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    const spread = max - min || 1
    const step = 100 / Math.max(summary.points.length - 1, 1)
    return summary.points
      .map((point, index) => {
        const x = index * step
        const y = 36 - ((point.price - min) / spread) * 32
        return `${x},${y}`
      })
      .join(' ')
  }, [summary])

  const enabledRanges = summary?.enabledRanges ?? ['1D']

  if (loading) {
    return <LoadingSkeleton rows={3} className={className} />
  }

  if (!summary || summary.points.length === 0) {
    return (
      <div className={`rounded-xl border border-white/5 p-4 text-center text-xs text-lenden-muted ${className}`}>
        Chart unavailable for this security.
      </div>
    )
  }

  return (
    <div
      className={`rounded-2xl border bg-lenden-card p-4 ${
        summary.hasRealHistory ? 'border-white/5' : 'border-amber-400/20'
      } ${className}`}
    >
      <div className="mb-2">
        <p className="text-xs font-semibold text-white">{summary.sourceLabel}</p>
        <p className="mt-1 text-[10px] leading-relaxed text-lenden-muted">{summary.sourceDescription}</p>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {RANGES.map((item) => {
          const enabled = enabledRanges.includes(item)
          return (
            <button
              key={item}
              type="button"
              disabled={!enabled}
              onClick={() => enabled && setRange(item)}
              title={enabled ? undefined : 'History unavailable'}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
                range === item && enabled
                  ? 'bg-lenden-mint text-lenden-black'
                  : enabled
                    ? 'bg-lenden-surface text-lenden-muted'
                    : 'cursor-not-allowed bg-lenden-surface/50 text-lenden-muted/50'
              }`}
            >
              {item}
              {!enabled && <span className="sr-only"> History unavailable</span>}
            </button>
          )
        })}
      </div>

      {!summary.hasRealHistory && (
        <p className="mb-3 text-[10px] text-amber-200/90">
          Longer ranges are unavailable until licensed historical data is connected.
        </p>
      )}

      <svg viewBox="0 0 100 36" className="h-32 w-full" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`stockHistoryFill-${ticker}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={`${coords} 100,36 0,36`} fill={`url(#stockHistoryFill-${ticker})`} />
        <polyline points={coords} fill="none" stroke="#4ade80" strokeWidth="1.5" />
      </svg>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-lenden-muted">Start</p>
          <p className="font-semibold text-white">{formatBDT(summary.startPrice)}</p>
        </div>
        <div>
          <p className="text-lenden-muted">End</p>
          <p className="font-semibold text-white">{formatBDT(summary.endPrice)}</p>
        </div>
        <div>
          <p className="text-lenden-muted">High</p>
          <p className="font-semibold text-white">{formatBDT(summary.high)}</p>
        </div>
        <div>
          <p className="text-lenden-muted">Low</p>
          <p className="font-semibold text-white">{formatBDT(summary.low)}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 text-[10px] text-lenden-muted">
        <span>
          Last updated{' '}
          {new Date(summary.lastUpdated).toLocaleString('en-GB', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${SOURCE_BADGE_STYLES[summary.sourceLabel]}`}
        >
          {summary.sourceLabel}
        </span>
      </div>
    </div>
  )
}
