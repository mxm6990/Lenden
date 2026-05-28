interface SparklineProps {
  points: number[]
  positive: boolean
  className?: string
}

export function Sparkline({ points, positive, className = 'h-10 w-20' }: SparklineProps) {
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = 100 / (points.length - 1)
  const coords = points.map((p, i) => `${i * step},${32 - ((p - min) / range) * 28}`).join(' ')

  const stroke = positive ? '#4ade80' : '#f87171'
  const fill = positive ? 'rgba(74, 222, 128, 0.15)' : 'rgba(248, 113, 113, 0.12)'

  return (
    <svg viewBox="0 0 100 32" className={className} preserveAspectRatio="none" aria-hidden>
      <polygon points={`${coords} 100,32 0,32`} fill={fill} />
      <polyline
        points={coords}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}
