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

export function BrandMark({
  size = 28,
  fill = colors.success,
  className,
}: {
  size?: number
  fill?: string
  className?: string
}) {
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

export type LendenLogoVariant = 'hero' | 'default' | 'compact'

const VARIANT_LOCKUP: Record<LendenLogoVariant, LogoLockupKey> = {
  hero: 'englishDarkLg',
  default: 'englishDark',
  compact: 'englishDarkSm',
}

export function LendenLogo({
  variant = 'default',
  markSize,
  wordmarkText,
  wordmarkFontFamily,
  className = '',
}: {
  variant?: LendenLogoVariant
  markSize?: number
  wordmarkText?: string
  wordmarkFontFamily?: string
  className?: string
}) {
  const logo = logoLockups[VARIANT_LOCKUP[variant]]
  const style = typeScale[logo.wordmark.typeStyle]
  const size = markSize ?? logo.markSize
  const text = wordmarkText ?? logo.wordmark.text

  return (
    <div
      className={`inline-flex items-center ${className}`}
      style={{ gap: text.length > 0 ? logo.gap : 0 }}
      role="img"
      aria-label="LenDen"
    >
      <BrandMark size={size} fill={logo.markFill} />
      {text.length > 0 && (
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
