import { Search } from 'lucide-react'
import { MockHeader } from './MockChrome'
import { ChangeText, MockCard } from './shared'

const securities = [
  { ticker: 'GP', name: 'Grameenphone Ltd.', price: 298.5, change: 4.2, changePct: 1.43 },
  { ticker: 'BRACBANK', name: 'BRAC Bank Ltd.', price: 52.8, change: 0.3, changePct: 0.57 },
  { ticker: 'SQURPHARMA', name: 'Square Pharmaceuticals', price: 215.0, change: -1.2, changePct: -0.56 },
]

export function MarketMockup() {
  return (
    <div className="relative h-full bg-lenden-black text-[11px]">
      <MockHeader title="Market" subtitle="Dhaka Stock Exchange" activeTab="market" />

      <div className="overflow-hidden px-4 pb-14 pt-2" style={{ height: 'calc(100% - 6.5rem)' }}>
        <MockCard className="mb-2 p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[9px] font-medium text-lenden-muted">DSEX Index</p>
              <p className="text-lg font-bold tabular-nums text-white">6,324</p>
            </div>
            <ChangeText value={26.42} pct={0.42} />
          </div>
        </MockCard>

        <div className="relative mb-3">
          <Search className="absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-lenden-muted" />
          <div className="rounded-2xl border border-white/10 bg-lenden-surface py-2.5 pr-3 pl-9 text-[10px] text-lenden-muted">
            Search ticker or company name...
          </div>
        </div>

        <p className="mb-2 text-[9px] font-semibold tracking-wide text-lenden-muted uppercase">
          DSE Securities · {securities.length} results
        </p>

        <div className="space-y-1.5">
          {securities.map((stock) => (
            <div
              key={stock.ticker}
              className="flex items-center justify-between rounded-2xl border border-white/5 bg-lenden-surface px-2.5 py-2"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-lenden-green text-[8px] font-bold text-white">
                  {stock.ticker.slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold text-white">{stock.ticker}</p>
                  <p className="truncate text-[9px] text-lenden-muted">{stock.name}</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-semibold tabular-nums text-white">৳{stock.price}</p>
                <ChangeText value={stock.change} pct={stock.changePct} className="text-[9px]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
