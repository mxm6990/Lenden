import { TrendingUp } from 'lucide-react'
import { MockBottomNav } from './MockChrome'
import { LendenLogo } from '../LendenLogo'
import { ChangeText, MiniChart, MockCard } from './shared'

const watchlist = [
  { ticker: 'GP', name: 'Grameenphone', price: 298.5, change: 4.2, changePct: 1.43 },
  { ticker: 'BRACBANK', name: 'BRAC Bank', price: 52.8, change: 0.3, changePct: 0.57 },
]

export function HomeMockup() {
  return (
    <div className="relative h-full bg-lenden-black text-[11px]">
      <header className="border-b border-white/5 px-4 pt-3 pb-2">
        <div className="flex items-center gap-2">
          <LendenLogo variant="compact" markSize={18} />
          <span className="rounded-full border border-lenden-mint/25 bg-lenden-mint/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-lenden-mint">
            Paper beta
          </span>
        </div>
      </header>

      <div className="overflow-hidden px-4 pb-14 pt-3" style={{ height: 'calc(100% - 3.5rem)' }}>
        <p className="text-[11px] font-medium text-lenden-muted">Good morning, Rahim</p>
        <h2 className="text-lg font-bold tracking-tight text-white">Your portfolio</h2>

        <MockCard className="mt-3 p-4 pb-3">
          <p className="text-[10px] font-medium text-lenden-muted">Portfolio value</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-white">৳45,820</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-lenden-mint/15 px-2 py-1 text-[10px] font-semibold text-lenden-mint">
              <TrendingUp className="h-3 w-3" />
              +৳620 today
            </span>
            <span className="text-[10px] text-lenden-muted">+1.37%</span>
          </div>
          <div className="mt-3">
            <MiniChart className="h-14" />
          </div>
        </MockCard>

        <MockCard className="mt-3 p-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-medium text-lenden-muted">DSE Market</p>
              <p className="text-xl font-bold tabular-nums text-white">6,324</p>
              <ChangeText value={26.42} pct={0.42} className="text-[10px]" />
            </div>
            <div className="text-right">
              <span className="inline-flex rounded-full bg-lenden-mint/15 px-2 py-1 text-[10px] font-semibold text-lenden-mint">
                Open
              </span>
              <p className="mt-1 text-[9px] leading-snug text-lenden-muted">Sun–Thu · 10:00–2:30</p>
            </div>
          </div>
        </MockCard>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[11px] font-semibold text-white">Watchlist</p>
            <span className="text-[10px] font-medium text-lenden-mint">See all</span>
          </div>
          <div className="space-y-1.5">
            {watchlist.map((stock) => (
              <div
                key={stock.ticker}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-lenden-surface p-2.5"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-lenden-green text-[8px] font-bold text-white">
                    {stock.ticker.slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-white">{stock.ticker}</p>
                    <p className="text-[9px] text-lenden-muted">{stock.name.split(' ')[0]}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold tabular-nums text-white">৳{stock.price}</p>
                  <ChangeText value={stock.change} pct={stock.changePct} className="text-[9px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <MockBottomNav activeTab="home" />
    </div>
  )
}
