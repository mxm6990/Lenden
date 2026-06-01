import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { fonts, taglines } from '@lenden/branding'
import { LendenLogo } from '../LendenLogo'
import { PhoneFrame } from '../PhoneFrame'
import { HomeMockup } from '../mockups/HomeMockup'

type Locale = 'en' | 'bn'

const copy = {
  en: {
    wordmark: 'Lenden',
    wordmarkFont: fonts.logo,
    taglineLead: 'Clarity in',
    taglineAccent: 'every investment.',
    taglineFont: fonts.logo,
  },
  bn: {
    wordmark: 'লেন্দেন',
    wordmarkFont: '"Hind Siliguri", "Noto Sans Bengali", sans-serif',
    taglineLead: 'প্রতিটি বিনিয়োগে',
    taglineAccent: 'স্পষ্টতা।',
    taglineFont: '"Hind Siliguri", "Noto Sans Bengali", sans-serif',
  },
} as const

const localeFade = {
  initial: { opacity: 0, y: 6, filter: 'blur(3px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -6, filter: 'blur(3px)' },
}

const localeTransition = {
  duration: 0.75,
  ease: [0.25, 0.1, 0.25, 1] as const,
}

export function SiteNav() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-white/5 bg-lenden-black/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
        <a href="#" className="shrink-0">
          <LendenLogo variant="default" />
        </a>
        <nav className="hidden items-center gap-8 text-sm font-medium text-lenden-muted md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>
          <a href="#app" className="transition hover:text-white">
            App
          </a>
          <a href="#beta" className="transition hover:text-white">
            Beta
          </a>
        </nav>
        <a
          href="#beta"
          className="inline-flex items-center gap-1.5 rounded-2xl bg-lenden-mint px-4 py-2 text-sm font-semibold text-lenden-black transition hover:bg-white"
        >
          Join beta
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </header>
  )
}

export function HeroSection() {
  const [locale, setLocale] = useState<Locale>('en')
  const text = copy[locale]

  useEffect(() => {
    const interval = setInterval(() => {
      setLocale((current) => (current === 'en' ? 'bn' : 'en'))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <section className="relative overflow-hidden pt-16">
      <div className="site-grid-bg absolute inset-0 opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute top-0 left-1/2 h-[480px] w-[720px] -translate-x-1/2 rounded-full opacity-50 blur-3xl"
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(26, 92, 56, 0.35) 0%, rgba(74, 222, 128, 0.08) 40%, transparent 70%)',
        }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:items-center lg:py-24">
        <div>
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-lenden-mint/20 bg-lenden-mint/8 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-lenden-mint" />
            <span className="text-xs font-semibold tracking-wide text-lenden-mint uppercase">
              Closed beta · Paper trading only
            </span>
          </div>

          <div className="mb-6 flex min-h-[52px] items-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`logo-${locale}`}
                {...localeFade}
                transition={localeTransition}
              >
                <LendenLogo
                  variant="hero"
                  wordmarkText={text.wordmark}
                  wordmarkFontFamily={text.wordmarkFont}
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="min-h-[5.5rem] sm:min-h-[6rem]">
            <AnimatePresence mode="wait">
              <motion.h1
                key={`tagline-${locale}`}
                {...localeFade}
                transition={localeTransition}
                className="max-w-lg text-4xl leading-[1.08] font-extrabold tracking-tight text-white sm:text-5xl lg:text-[3.25rem]"
                style={{ fontFamily: text.taglineFont }}
                aria-label={locale === 'en' ? taglines.primary : taglines.primaryBn}
              >
                {text.taglineLead}{' '}
                <span className="text-lenden-mint">{text.taglineAccent}</span>
              </motion.h1>
            </AnimatePresence>
          </div>

          <p className="mt-5 max-w-md text-base leading-relaxed text-lenden-muted sm:text-lg">
            {taglines.secondary} Built for Bangladesh, designed for your phone.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href="#beta"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-lenden-mint px-6 py-3.5 text-base font-bold text-lenden-black transition hover:bg-white"
            >
              Request beta access
              <ArrowRight className="h-5 w-5" />
            </a>
            <a
              href="#app"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-lenden-surface px-6 py-3.5 text-base font-semibold text-white transition hover:bg-lenden-card"
            >
              See the app
            </a>
          </div>

          <p className="mt-6 max-w-md text-xs leading-relaxed text-lenden-muted/80">
            Prototype environment. Mock trading only — not financial advice. No real money movement
            in this beta.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center lg:justify-end"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <PhoneFrame label="Home">
              <HomeMockup />
            </PhoneFrame>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
