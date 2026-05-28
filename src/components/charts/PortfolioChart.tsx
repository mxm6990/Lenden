import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { formatBDT } from '../../data/stocks'
import type { PortfolioHistoryPoint } from '../../data/portfolioHistory'

const PLOT_HEIGHT = 152
const PLOT_INSET_X = 10
const MIN_X_LABEL_GAP = 52
const Y_AXIS_MIN_WIDTH = 36
const Y_AXIS_MAX_WIDTH = 56
const Y_PADDING_RATIO = 0.08

function formatAxisBDT(value: number, range: number): string {
  if (range >= 5000 || value >= 10000) {
    return `৳${Math.round(value / 1000)}K`
  }
  if (range >= 1500 || value >= 1000) {
    return `৳${(value / 1000).toFixed(1)}K`
  }
  return formatBDT(value, true)
}

function buildYTicks(min: number, max: number, tickCount = 4): number[] {
  const range = max - min || 1
  const rawStep = range / tickCount
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = Math.ceil(rawStep / magnitude) * magnitude
  const start = Math.floor(min / step) * step
  const ticks: number[] = []

  for (let v = start; v <= max + step * 0.01; v += step) {
    ticks.push(v)
  }

  if (ticks.length < 3) {
    return [min, min + range / 2, max].map((v) => Math.round(v))
  }

  return ticks
}

function getXLabelIndices(length: number, plotWidth: number): number[] {
  const maxLabels = Math.max(3, Math.min(length, Math.floor(plotWidth / MIN_X_LABEL_GAP)))
  if (length <= maxLabels) {
    return Array.from({ length }, (_, i) => i)
  }
  const step = (length - 1) / (maxLabels - 1)
  const indices = Array.from({ length: maxLabels }, (_, i) => Math.round(i * step))
  return [...new Set(indices)]
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

interface PortfolioChartProps {
  data: PortfolioHistoryPoint[]
  onScrub?: (point: PortfolioHistoryPoint | null) => void
  className?: string
}

export function PortfolioChart({ data, onScrub, className = '' }: PortfolioChartProps) {
  const clipId = useId().replace(/:/g, '')
  const plotRef = useRef<HTMLDivElement>(null)
  const [plotWidth, setPlotWidth] = useState(280)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [isScrubbing, setIsScrubbing] = useState(false)

  useLayoutEffect(() => {
    const el = plotRef.current
    if (!el) return

    const update = () => setPlotWidth(el.clientWidth)
    update()

    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const values = data.map((d) => d.value)
  const dataMin = Math.min(...values)
  const dataMax = Math.max(...values)
  const dataRange = dataMax - dataMin || 1

  const plotYMin = dataMin - dataRange * Y_PADDING_RATIO
  const plotYMax = dataMax + dataRange * Y_PADDING_RATIO
  const yRange = plotYMax - plotYMin

  const yTicks = useMemo(() => buildYTicks(plotYMin, plotYMax), [plotYMin, plotYMax])

  const yAxisLabels = useMemo(
    () => yTicks.map((tick) => formatAxisBDT(tick, yRange)),
    [yTicks, yRange],
  )
  const yAxisWidth = Math.min(
    Y_AXIS_MAX_WIDTH,
    Math.max(Y_AXIS_MIN_WIDTH, Math.max(...yAxisLabels.map((l) => l.length)) * 7 + 8),
  )

  const plotInnerWidth = Math.max(plotWidth - PLOT_INSET_X * 2, 1)

  const xLabelIndices = useMemo(
    () => getXLabelIndices(data.length, plotInnerWidth),
    [data.length, plotInnerWidth],
  )

  const getPointCoords = useCallback(
    (index: number) => {
      const x = PLOT_INSET_X + (index / (data.length - 1)) * plotInnerWidth
      const rawY = ((plotYMax - data[index].value) / yRange) * PLOT_HEIGHT
      const y = clamp(rawY, 0, PLOT_HEIGHT)
      return { x, y }
    },
    [data, plotInnerWidth, plotYMax, yRange],
  )

  const plotPoints = useMemo(
    () => data.map((_, i) => getPointCoords(i)),
    [data, getPointCoords],
  )

  const updateScrub = useCallback(
    (clientX: number) => {
      const el = plotRef.current
      if (!el) return

      const rect = el.getBoundingClientRect()
      const x = clientX - rect.left - PLOT_INSET_X
      const ratio = clamp(x / plotInnerWidth, 0, 1)
      const index = Math.round(ratio * (data.length - 1))

      setActiveIndex(index)
      onScrub?.(data[index])
    },
    [data, onScrub, plotInnerWidth],
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsScrubbing(true)
    e.currentTarget.setPointerCapture(e.pointerId)
    updateScrub(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return
    updateScrub(e.clientX)
  }

  const endScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbing) return
    setIsScrubbing(false)
    setActiveIndex(null)
    onScrub?.(null)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
  }

  const svgPath = plotPoints.map((p) => `${p.x},${p.y}`).join(' ')
  const areaPath = `${svgPath} ${PLOT_INSET_X + plotInnerWidth},${PLOT_HEIGHT} ${PLOT_INSET_X},${PLOT_HEIGHT}`
  const activePoint = activeIndex !== null ? plotPoints[activeIndex] : null

  const getXLabelStyle = (index: number): React.CSSProperties => {
    const pct = (index / (data.length - 1)) * 100
    const isFirst = index === 0
    const isLast = index === data.length - 1

    if (isFirst) {
      return { left: `${pct}%`, transform: 'translateX(0)' }
    }
    if (isLast) {
      return { left: `${pct}%`, transform: 'translateX(-100%)' }
    }
    return { left: `${pct}%`, transform: 'translateX(-50%)' }
  }

  return (
    <div className={`select-none overflow-hidden ${className}`}>
      <div className="flex gap-1.5">
        <div className="relative shrink-0" style={{ width: yAxisWidth, height: PLOT_HEIGHT }}>
          {yTicks
            .slice()
            .reverse()
            .map((tick, i) => {
              const top = clamp(((plotYMax - tick) / yRange) * 100, 0, 100)
              return (
                <span
                  key={tick}
                  className="absolute right-0 -translate-y-1/2 text-[10px] leading-none text-lenden-muted tabular-nums"
                  style={{ top: `${top}%`, fontSize: plotWidth < 300 ? 9 : 10 }}
                >
                  {yAxisLabels[yTicks.length - 1 - i]}
                </span>
              )
            })}
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div
            ref={plotRef}
            className="relative touch-none overflow-hidden"
            style={{ height: PLOT_HEIGHT }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endScrub}
            onPointerCancel={endScrub}
          >
            {yTicks.map((tick) => {
              const top = clamp(((plotYMax - tick) / yRange) * 100, 0, 100)
              return (
                <div
                  key={`grid-${tick}`}
                  className="pointer-events-none absolute border-t border-white/5"
                  style={{
                    top: `${top}%`,
                    left: PLOT_INSET_X,
                    right: PLOT_INSET_X,
                  }}
                />
              )
            })}

            <svg
              width={plotWidth}
              height={PLOT_HEIGHT}
              className="pointer-events-none absolute inset-0 max-w-full"
              overflow="hidden"
            >
              <defs>
                <clipPath id={clipId}>
                  <rect
                    x={PLOT_INSET_X}
                    y={0}
                    width={plotInnerWidth}
                    height={PLOT_HEIGHT}
                  />
                </clipPath>
                <linearGradient id={`${clipId}-fill`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4ade80" stopOpacity="0.18" />
                  <stop offset="100%" stopColor="#4ade80" stopOpacity="0" />
                </linearGradient>
              </defs>

              <g clipPath={`url(#${clipId})`}>
                <polygon points={areaPath} fill={`url(#${clipId}-fill)`} />
                <polyline
                  points={svgPath}
                  fill="none"
                  stroke="#4ade80"
                  strokeWidth="2"
                  strokeLinecap="butt"
                  strokeLinejoin="miter"
                  vectorEffect="non-scaling-stroke"
                />
              </g>
            </svg>

            {activePoint && (
              <>
                <div
                  className="pointer-events-none absolute w-px bg-white/35"
                  style={{
                    left: clamp(activePoint.x, PLOT_INSET_X, PLOT_INSET_X + plotInnerWidth),
                    top: 0,
                    height: PLOT_HEIGHT,
                  }}
                />
                <div
                  className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-lenden-black bg-lenden-mint"
                  style={{
                    left: clamp(activePoint.x, PLOT_INSET_X, PLOT_INSET_X + plotInnerWidth),
                    top: clamp(activePoint.y, 0, PLOT_HEIGHT),
                  }}
                />
              </>
            )}
          </div>

          <div
            className="relative mt-2 h-5 overflow-hidden"
            style={{ paddingLeft: PLOT_INSET_X, paddingRight: PLOT_INSET_X }}
          >
            {xLabelIndices.map((index) => {
              const style = getXLabelStyle(index)
              return (
                <span
                  key={`${data[index].label}-${index}`}
                  className="absolute top-0 max-w-[4.5rem] truncate whitespace-nowrap text-lenden-muted"
                  style={{
                    ...style,
                    fontSize: plotWidth < 300 ? 9 : 10,
                  }}
                >
                  {data[index].label}
                </span>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
