import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PhoneFrame } from '../PhoneFrame'
import { HomeMockup } from '../mockups/HomeMockup'
import { MarketMockup } from '../mockups/MarketMockup'
import { StockMockup } from '../mockups/StockMockup'

const screens = [
  { id: 'home', label: 'Home', description: 'Portfolio summary, DSE status, and watchlist', component: HomeMockup },
  { id: 'market', label: 'Market', description: 'Search and browse all DSE securities', component: MarketMockup },
  { id: 'stock', label: 'Stock detail', description: 'Charts, metrics, and mock buy/sell', component: StockMockup },
] as const

type ScreenId = (typeof screens)[number]['id']

export function ShowcaseSection() {
  const [active, setActive] = useState<ScreenId>('home')
  const current = screens.find((s) => s.id === active)!
  const Mock = current.component

  return (
    <section id="app" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid gap-12 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-semibold tracking-wide text-lenden-mint uppercase">The app</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Same screens your beta testers use
            </h2>
            <p className="mt-4 max-w-lg text-base leading-relaxed text-lenden-muted">
              These mockups mirror the actual LenDen UI — dark surfaces, mint accents, tabular numbers,
              and the growing-graph mark on every header.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              {screens.map((screen) => {
                const selected = active === screen.id
                return (
                  <button
                    key={screen.id}
                    type="button"
                    onClick={() => setActive(screen.id)}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      selected
                        ? 'border-lenden-mint/30 bg-lenden-mint/8'
                        : 'border-white/5 bg-lenden-surface/40 hover:border-white/10'
                    }`}
                  >
                    <p className={`text-sm font-semibold ${selected ? 'text-lenden-mint' : 'text-white'}`}>
                      {screen.label}
                    </p>
                    <p className="mt-0.5 text-xs text-lenden-muted">{screen.description}</p>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.25 }}
              >
                <PhoneFrame label={current.label}>
                  <Mock />
                </PhoneFrame>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-20 hidden gap-6 lg:grid lg:grid-cols-3">
          {screens.map((screen) => {
            const Screen = screen.component
            return (
              <PhoneFrame key={screen.id} label={screen.label}>
                <Screen />
              </PhoneFrame>
            )
          })}
        </div>
      </div>
    </section>
  )
}
