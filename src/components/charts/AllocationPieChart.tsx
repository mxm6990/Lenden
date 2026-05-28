import { useMemo, useState } from 'react'
import type { AllocationSegment } from '../../data/allocation'
import { formatBDT } from '../../data/stocks'

interface AllocationPieChartProps {
  data: AllocationSegment[]
  size?: number
  className?: string
}

interface ArcSegment {
  slice: AllocationSegment
  startAngle: number
  endAngle: number
}

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  }
}

function describeDonutArc(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, endAngle)
  const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle)
  const innerStart = polarToCartesian(cx, cy, innerRadius, endAngle)
  const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 1 ${innerStart.x} ${innerStart.y}`,
    'Z',
  ].join(' ')
}

function buildSegments(data: AllocationSegment[]): ArcSegment[] {
  let cursor = 0
  return data.map((slice) => {
    const sweep = (slice.pct / 100) * 360
    const segment = { slice, startAngle: cursor, endAngle: cursor + sweep }
    cursor += sweep
    return segment
  })
}

export function AllocationPieChart({ data, size = 280, className = '' }: AllocationPieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const segments = useMemo(() => buildSegments(data), [data])
  const active = activeIndex !== null ? data[activeIndex] : null

  const cx = size / 2
  const cy = size / 2
  const outerRadius = size * 0.46
  const innerRadius = size * 0.3

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block touch-none"
          role="img"
          aria-label="Portfolio allocation by industry"
        >
          {segments.map(({ slice, startAngle, endAngle }, index) => {
            const isActive = activeIndex === index

            return (
              <path
                key={slice.id}
                d={describeDonutArc(cx, cy, outerRadius, innerRadius, startAngle, endAngle)}
                fill={slice.color}
                opacity={activeIndex === null || isActive ? 1 : 0.4}
                className="cursor-pointer transition-opacity duration-150"
                onPointerEnter={() => setActiveIndex(index)}
                onPointerLeave={() => setActiveIndex(null)}
                onPointerDown={() => setActiveIndex(index)}
              />
            )
          })}
        </svg>

        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center px-6"
          style={{ paddingInline: innerRadius * 0.35 }}
        >
          <div className="max-w-[9.5rem] text-center">
            {active ? (
              <>
                <p className="text-xs font-medium text-lenden-muted">{active.label}</p>
                <p className="mt-0.5 text-3xl font-bold tracking-tight text-white">
                  {active.pct.toFixed(1)}%
                </p>
                <p className="mt-1 text-sm text-lenden-muted">{formatBDT(active.value)}</p>
                {active.tickers.length > 0 && (
                  <p className="mt-1 text-[10px] leading-snug text-lenden-muted">
                    {active.tickers.join(' · ')}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-lenden-muted">By industry</p>
                <p className="mt-0.5 text-2xl font-bold tracking-tight text-white">100%</p>
                <p className="mt-1 text-[11px] leading-snug text-lenden-muted">
                  Tap or hover a slice
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 w-full space-y-2">
        {data.map((slice, index) => (
          <button
            key={slice.id}
            type="button"
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
              activeIndex === index
                ? 'border-white/20 bg-white/5'
                : 'border-transparent bg-transparent'
            }`}
            onPointerEnter={() => setActiveIndex(index)}
            onPointerLeave={() => setActiveIndex(null)}
            onClick={() => setActiveIndex((current) => (current === index ? null : index))}
          >
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: slice.color }}
            />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-white">
              {slice.label}
            </span>
            <span className="text-sm font-semibold text-white">{slice.pct.toFixed(1)}%</span>
            <span className="text-xs text-lenden-muted">{formatBDT(slice.value)}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
