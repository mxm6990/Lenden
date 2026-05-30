import { useEffect, useRef, useState } from 'react'
import { formatBDT } from '../../data/stocks'
import type { SecurityListing } from '../../types/security'
import { ChangeText } from '../ui/Card'
import { MarketDataBadge } from '../trust/ComplianceCopy'
import type { MarketDataBadgeLabel } from '../../types/marketData'

const ROW_HEIGHT = 76
const OVERSCAN = 8

interface VirtualSecurityListProps {
  items: SecurityListing[]
  onSelect: (ticker: string) => void
  className?: string
}

function sourceToBadge(label: string): MarketDataBadgeLabel {
  if (label === 'Experimental DSE Feed') return 'Experimental DSE Feed'
  if (label === 'Licensed Feed') return 'Licensed Feed'
  if (label === 'Prototype Data') return 'Prototype Data'
  return 'Prototype Data'
}

export function VirtualSecurityList({ items, onSelect, className = '' }: VirtualSecurityListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(480)

  useEffect(() => {
    const element = containerRef.current
    if (!element) return

    const updateHeight = () => setViewportHeight(element.clientHeight)
    updateHeight()

    const observer = new ResizeObserver(updateHeight)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  const totalHeight = items.length * ROW_HEIGHT
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + viewportHeight) / ROW_HEIGHT) + OVERSCAN,
  )
  const visibleItems = items.slice(startIndex, endIndex)

  return (
    <div
      ref={containerRef}
      className={`max-h-[min(60vh,520px)] overflow-auto ${className}`}
      onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map((listing, index) => {
          const rowIndex = startIndex + index
          return (
            <button
              key={listing.ticker}
              type="button"
              onClick={() => onSelect(listing.ticker)}
              className="absolute right-0 left-0 flex w-full items-center justify-between rounded-2xl border border-white/5 bg-lenden-card px-4 text-left active:scale-[0.99]"
              style={{
                top: rowIndex * ROW_HEIGHT,
                height: ROW_HEIGHT - 8,
              }}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lenden-green text-xs font-bold text-white">
                  {listing.ticker.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{listing.ticker}</p>
                  <p className="truncate text-[11px] text-lenden-muted">{listing.companyName}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-white">
                  {formatBDT(listing.lastPrice)}
                </p>
                <ChangeText value={listing.change} pct={listing.changePct} />
                <div className="mt-1 flex justify-end">
                  <MarketDataBadge label={sourceToBadge(listing.sourceLabel)} />
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
