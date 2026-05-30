import { useEffect, useMemo, useState } from 'react'
import { formatBDT } from '../../data/stocks'
import { getStockHistory, type StockHistoryRange } from '../../services/stockHistoryApi'
import type { StockHistorySummary } from '../../types/stockHistory'
import { LoadingSkeleton } from '../trust/TrustState'

const RANGES: StockHistoryRange[] = ['1D', '1W', '1M', '6M', '1Y']

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
    <div className={`rounded-2xl border border-white/5 bg-lenden-card p-4 ${className}`}>
      <div className="mb-3 flex flex-wrap gap-2">
        {RANGES.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setRange(item)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold ${
              range === item
                ? 'bg-lenden-mint text-lenden-black'
                : 'bg-lenden-surface text-lenden-muted'
            }`}
          >
            {item}
          </button>
        ))}
      </div>

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
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
          {summary.sourceLabel}
        </span>
      </div>

      <p className="mt-2 text-[10px] leading-relaxed text-lenden-muted">{summary.sourceDescription}</p>
    </div>
  )
}
