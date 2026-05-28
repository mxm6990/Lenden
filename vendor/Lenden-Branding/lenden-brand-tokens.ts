/**
 * Lenden brand design tokens
 * Source of truth — sync from https://github.com/mxm6990/Lenden-Branding
 */

export const colors = {
  green: '#1A5C38',
  greenDark: '#0F3D24',
  greenLight: '#2D7A4A',
  success: '#4ADE80',
  black: '#080A09',
  dark: '#0F1412',
  surface: '#141A17',
  card: '#1A221E',
  border: '#2A3530',
  white: '#F8FAF9',
  muted: '#8A9A92',
  error: '#F87171',
  warning: '#FBBF24',
} as const

export const fonts = {
  /** Logo wordmark — Outfit display cut */
  logo: '"Outfit", "DM Sans", system-ui, sans-serif',
  sans: '"DM Sans", system-ui, sans-serif',
  mono: '"IBM Plex Mono", ui-monospace, monospace',
} as const

export const typeScale = {
  logo: {
    fontFamily: fonts.logo,
    fontSize: '1.625rem',
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1,
  },
  logoSm: {
    fontFamily: fonts.logo,
    fontSize: '1.125rem',
    fontWeight: 700,
    letterSpacing: '-0.025em',
    lineHeight: 1,
  },
  logoLg: {
    fontFamily: fonts.logo,
    fontSize: '2rem',
    fontWeight: 800,
    letterSpacing: '-0.035em',
    lineHeight: 1,
  },
  h1: { fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1 },
  h2: { fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.15 },
  body: { fontSize: '0.9375rem', fontWeight: 400, lineHeight: 1.5 },
  caption: { fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.4 },
} as const

/** Growing graph brand mark — ascending bars (viewBox 0 0 32 28) */
export const brandMarkPaths = [
  { x: 0, y: 21, width: 4.5, height: 7, rx: 1.25 },
  { x: 6.5, y: 16, width: 4.5, height: 12, rx: 1.25 },
  { x: 13, y: 10, width: 4.5, height: 18, rx: 1.25 },
  { x: 19.5, y: 4, width: 4.5, height: 24, rx: 1.25 },
  { x: 26, y: 0, width: 4.5, height: 28, rx: 1.25 },
] as const

export const brandMarkViewBox = '0 0 32 28'

export interface LogoLockup {
  id: string
  wordmark: {
    text: string
    fill: string
    typeStyle: keyof Pick<typeof typeScale, 'logo' | 'logoSm' | 'logoLg'>
  }
  markFill: string
  markSize: number
  gap: number
}

export const logoLockups = {
  englishDark: {
    id: 'englishDark',
    wordmark: {
      text: 'Lenden',
      fill: colors.white,
      typeStyle: 'logo',
    },
    markFill: colors.success,
    markSize: 28,
    gap: 10,
  },
  englishDarkSm: {
    id: 'englishDarkSm',
    wordmark: {
      text: 'Lenden',
      fill: colors.white,
      typeStyle: 'logoSm',
    },
    markFill: colors.success,
    markSize: 20,
    gap: 8,
  },
  englishDarkLg: {
    id: 'englishDarkLg',
    wordmark: {
      text: 'Lenden',
      fill: colors.white,
      typeStyle: 'logoLg',
    },
    markFill: colors.success,
    markSize: 36,
    gap: 12,
  },
  markOnly: {
    id: 'markOnly',
    wordmark: {
      text: '',
      fill: colors.white,
      typeStyle: 'logoSm',
    },
    markFill: colors.success,
    markSize: 28,
    gap: 0,
  },
} as const satisfies Record<string, LogoLockup>

export type LogoLockupKey = keyof typeof logoLockups

export const taglines = {
  primary: 'Clarity in every investment.',
  primaryBn: 'প্রতিটি বিনিয়োগে স্পষ্টতা।',
  secondary:
    'Track, learn, and invest in DSE stocks through a clean mobile-first platform.',
  short: 'Built for Bangladesh',
} as const

export const lendenTailwindPreset = {
  '--font-sans': fonts.sans,
  '--font-logo': fonts.logo,
  '--font-mono': fonts.mono,
  '--color-lenden-green': colors.green,
  '--color-lenden-green-dark': colors.greenDark,
  '--color-lenden-green-light': colors.greenLight,
  '--color-lenden-mint': colors.success,
  '--color-lenden-black': colors.black,
  '--color-lenden-dark': colors.dark,
  '--color-lenden-surface': colors.surface,
  '--color-lenden-card': colors.card,
  '--color-lenden-border': colors.border,
  '--color-lenden-white': colors.white,
  '--color-lenden-muted': colors.muted,
} as const
