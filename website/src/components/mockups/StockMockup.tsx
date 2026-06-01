import { ChevronLeft, Star } from 'lucide-react'
import { ChangeText, MockCard, StockChart } from './shared'

export function StockMockup() {
  return (
    <div className="relative flex h-full flex-col bg-lenden-black text-[11px]">
      <header className="border-b border-white/5 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <ChevronLeft className="h-4 w-4 text-lenden-muted" />
          <div className="text-center">
            <p className="text-sm font-bold text-white">GP</p>
            <p className="text-[9px] text-lenden-muted">Grameenphone Ltd.</p>
          </div>
          <Star className="h-4 w-4 text-lenden-mint" fill="currentColor" />
        </div>
      </header>

      <div className="flex-1 overflow-hidden px-4 pb-16 pt-3">
        <div className="text-center">
          <p className="text-2xl font-bold tabular-nums text-white">৳298.50</p>
          <ChangeText value={4.2} pct={1.43} className="text-[11px]" />
        </div>

        <div className="mt-3">
          <StockChart className="h-20" />
        </div>

        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {[
            { label: 'Market cap', value: '৳401B' },
            { label: 'P/E', value: '14.2' },
            { label: 'Dividend', value: '5.8%' },
          ].map((metric) => (
            <MockCard key={metric.label} className="p-2">
              <p className="text-[8px] font-medium text-lenden-muted">{metric.label}</p>
              <p className="mt-0.5 text-[11px] font-bold text-white">{metric.value}</p>
            </MockCard>
          ))}
        </div>

        <MockCard className="mt-3 p-3">
          <p className="text-[10px] font-semibold text-white">Your position</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] text-lenden-muted">Shares</p>
              <p className="text-sm font-bold text-white">25</p>
            </div>
            <div>
              <p className="text-[9px] text-lenden-muted">Avg cost</p>
              <p className="text-sm font-bold text-white">৳285.00</p>
            </div>
          </div>
          <div className="mt-2 border-t border-white/5 pt-2">
            <p className="text-[9px] text-lenden-muted">Unrealized P&L</p>
            <ChangeText value={337.5} pct={4.74} className="text-[11px]" />
          </div>
        </MockCard>

      </div>

      <div className="absolute right-0 bottom-0 left-0 border-t border-white/5 bg-lenden-black/95 px-4 py-3">
        <div className="flex gap-2">
          <button
            type="button"
            className="flex-1 rounded-2xl border border-lenden-mint/35 bg-lenden-surface/40 py-2.5 text-[11px] font-semibold text-lenden-mint"
          >
            Sell
          </button>
          <button
            type="button"
            className="flex-[2] rounded-2xl bg-lenden-mint py-2.5 text-[11px] font-bold text-lenden-black"
          >
            Buy GP
          </button>
        </div>
      </div>
    </div>
  )
}
