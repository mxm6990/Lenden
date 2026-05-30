import {
  brandMarkPaths,
  brandMarkViewBox,
  colors,
  logoLockups,
  typeScale,
  type LogoLockupKey,
} from '@lenden/branding'

function parseViewBox(viewBox: string) {
  const [, , w, h] = viewBox.split(' ').map(Number)
  return { w, h }
}

interface BrandMarkProps {
  size?: number
  fill?: string
  className?: string
}

export function BrandMark({ size = 28, fill = colors.success, className }: BrandMarkProps) {
  const { w, h } = parseViewBox(brandMarkViewBox)
  const width = (w / h) * size

  return (
    <svg
      width={width}
      height={size}
      viewBox={brandMarkViewBox}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      {brandMarkPaths.map((bar) => (
        <rect key={bar.x} {...bar} fill={fill} />
      ))}
    </svg>
  )
}

/** Size presets — same asset, colors, and typography everywhere; only scale changes. */
export type LendenLogoVariant = 'hero' | 'default' | 'compact'

const VARIANT_LOCKUP: Record<LendenLogoVariant, LogoLockupKey> = {
  hero: 'englishDarkLg',
  default: 'englishDark',
  compact: 'englishDarkSm',
}

interface LendenLogoProps {
  /** @deprecated Prefer `variant` */
  lockup?: LogoLockupKey
  variant?: LendenLogoVariant
  markSize?: number
  wordmarkText?: string
  wordmarkFontFamily?: string
  className?: string
}

export function LendenLogo({
  lockup,
  variant = 'default',
  markSize,
  wordmarkText,
  wordmarkFontFamily,
  className = '',
}: LendenLogoProps) {
  const resolvedLockup = lockup ?? VARIANT_LOCKUP[variant]
  const logo = logoLockups[resolvedLockup]
  const style = typeScale[logo.wordmark.typeStyle]
  const size = markSize ?? logo.markSize
  const text = wordmarkText ?? logo.wordmark.text
  const showWordmark = text.length > 0

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ gap: showWordmark ? logo.gap : 0 }}
      role="img"
      aria-label="Lenden"
    >
      <BrandMark size={size} fill={logo.markFill} />
      {showWordmark && (
        <span
          style={{
            fontFamily: wordmarkFontFamily ?? style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            letterSpacing: style.letterSpacing,
            lineHeight: style.lineHeight,
            color: logo.wordmark.fill,
          }}
        >
          {text}
        </span>
      )}
    </div>
  )
}
