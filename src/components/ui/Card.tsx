import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/5 bg-lenden-card ${className}`}>
      {children}
    </div>
  )
}

export function ChangeText({
  value,
  pct,
  className = 'text-sm',
}: {
  value: number
  pct: number
  className?: string
}) {
  const positive = value >= 0
  return (
    <span className={`font-semibold ${className} ${positive ? 'text-lenden-mint' : 'text-red-400'}`}>
      {positive ? '+' : ''}
      {value.toFixed(2)} ({positive ? '+' : ''}
      {pct.toFixed(2)}%)
    </span>
  )
}

export function MiniChart({ points, className = 'h-16' }: { points: number[]; className?: string }) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const w = 100 / (points.length - 1)
  const coords = points
    .map((p, i) => `${i * w},${36 - ((p - min) / range) * 32}`)
    .join(' ')

  return (
    <svg viewBox="0 0 100 36" className={`w-full ${className}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="miniFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ade80" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${coords} 100,36 0,36`} fill="url(#miniFill)" />
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
