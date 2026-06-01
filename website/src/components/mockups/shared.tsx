import type { ReactNode } from 'react'

const chartPoints = [42000, 42800, 43100, 42950, 43600, 44100, 43800, 44500, 45200, 45820]

export function MiniChart({ className = 'h-16' }: { className?: string }) {
  const min = Math.min(...chartPoints)
  const max = Math.max(...chartPoints)
  const range = max - min || 1
  const w = 100 / (chartPoints.length - 1)
  const coords = chartPoints
    .map((p, i) => `${i * w},${36 - ((p - min) / range) * 32}`)
    .join(' ')

  return (
    <svg viewBox="0 0 100 36" className={`w-full ${className}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="siteMiniFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${coords} 100,36 0,36`} fill="url(#siteMiniFill)" />
      <polyline
        points={coords}
        fill="none"
        stroke="#4ade80"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function StockChart({ className = 'h-24' }: { className?: string }) {
  const points = [280, 285, 282, 288, 291, 289, 295, 298, 296, 298.5]
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const w = 100 / (points.length - 1)
  const coords = points.map((p, i) => `${i * w},${40 - ((p - min) / range) * 36}`).join(' ')

  return (
    <svg viewBox="0 0 100 40" className={`w-full ${className}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="siteStockFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${coords} 100,40 0,40`} fill="url(#siteStockFill)" />
      <polyline points={coords} fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ChangeText({
  value,
  pct,
  className = 'text-xs',
}: {
  value: number
  pct: number
  className?: string
}) {
  const positive = value >= 0
  return (
    <span className={`font-semibold tabular-nums ${positive ? 'text-lenden-mint' : 'text-red-400'} ${className}`}>
      {positive ? '+' : ''}
      {value.toFixed(2)} ({positive ? '+' : ''}
      {pct.toFixed(2)}%)
    </span>
  )
}

export function MockCard({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-lenden-card ${className}`}>{children}</div>
  )
}
