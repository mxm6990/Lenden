import { BarChart3, LineChart, Search, Shield, Smartphone, Wallet } from 'lucide-react'
import { motion } from 'framer-motion'

const features = [
  {
    icon: LineChart,
    title: 'Portfolio at a glance',
    description:
      'See your total value, today’s change, and performance history on one screen — with the same chart interactions as the app.',
  },
  {
    icon: Search,
    title: 'Browse DSE securities',
    description:
      'Search tickers and company names across the Dhaka Stock Exchange. Index status, session hours, and live-style quotes in one feed.',
  },
  {
    icon: Wallet,
    title: 'Practice buy & sell',
    description:
      'Walk through order preview, fees, and confirmation with mock trading. No real brokerage routing in this beta.',
  },
  {
    icon: BarChart3,
    title: 'Holdings & allocation',
    description:
      'Track positions, unrealized P&L, and sector breakdown. Drill into any stock for charts, metrics, and your cost basis.',
  },
  {
    icon: Smartphone,
    title: 'Mobile-first, bilingual',
    description:
      'Built for iPhone with Bengali and English throughout — logo, tagline, and key flows switch naturally between locales.',
  },
  {
    icon: Shield,
    title: 'Trust by design',
    description:
      'Paper-trading badges, market data notices, and risk disclosures are visible where they matter — not buried in settings.',
  },
]

export function FeatureSection() {
  return (
    <section id="features" className="border-t border-white/5 bg-lenden-dark/50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-lenden-mint uppercase">Features</p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Everything you need to explore DSE investing
          </h2>
          <p className="mt-4 text-base leading-relaxed text-lenden-muted">
            LenDen is a closed-beta prototype focused on clarity — clean screens, honest labels, and
            flows that feel ready for real markets when the time comes.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.article
              key={feature.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.05 }}
              className="rounded-2xl border border-white/5 bg-lenden-card p-6 transition hover:border-lenden-mint/20"
            >
              <div className="mb-4 inline-flex rounded-xl bg-lenden-green/20 p-2.5">
                <feature.icon className="h-5 w-5 text-lenden-mint" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-white">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-lenden-muted">{feature.description}</p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
