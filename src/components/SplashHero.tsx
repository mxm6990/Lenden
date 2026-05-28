import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { fonts, taglines } from '@lenden/branding'
import { LendenLogo } from '../components/brand/LendenLogo'

type Locale = 'en' | 'bn'

const splashCopy = {
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

const fade = {
  initial: { opacity: 0, y: 10, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(4px)' },
}

export function SplashHero() {
  const [locale, setLocale] = useState<Locale>('en')
  const copy = splashCopy[locale]

  useEffect(() => {
    const interval = setInterval(() => {
      setLocale((current) => (current === 'en' ? 'bn' : 'en'))
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-8 flex min-h-[52px] items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`logo-${locale}`}
            {...fade}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <LendenLogo
              lockup="englishDarkLg"
              wordmarkText={copy.wordmark}
              wordmarkFontFamily={copy.wordmarkFont}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="min-h-[72px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={`tagline-${locale}`}
            {...fade}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] as const }}
            className="text-2xl leading-snug font-semibold tracking-tight text-white"
            style={{ fontFamily: copy.taglineFont }}
            aria-label={locale === 'en' ? taglines.primary : taglines.primaryBn}
          >
            {copy.taglineLead} {copy.taglineAccent}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  )
}
