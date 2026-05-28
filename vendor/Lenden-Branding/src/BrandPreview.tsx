import {
  brandMarkPaths,
  brandMarkViewBox,
  colors,
  fonts,
  logoLockups,
  taglines,
  typeScale,
} from '../lenden-brand-tokens'

function BrandMark({ size = 36, fill = colors.success }: { size?: number; fill?: string }) {
  const [, , w, h] = brandMarkViewBox.split(' ').map(Number)
  const width = (w / h) * size

  return (
    <svg width={width} height={size} viewBox={brandMarkViewBox} fill="none">
      {brandMarkPaths.map((bar) => (
        <rect key={bar.x} {...bar} fill={fill} />
      ))}
    </svg>
  )
}

function LogoLockup({ id }: { id: keyof typeof logoLockups }) {
  const logo = logoLockups[id]
  const style = typeScale[logo.wordmark.typeStyle]

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: logo.gap }}>
      <BrandMark size={logo.markSize} fill={logo.markFill} />
      {logo.wordmark.text && (
        <span
          style={{
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            letterSpacing: style.letterSpacing,
            color: logo.wordmark.fill,
          }}
        >
          {logo.wordmark.text}
        </span>
      )}
    </div>
  )
}

export function BrandPreview() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.black,
        color: colors.white,
        fontFamily: fonts.sans,
        padding: 48,
      }}
    >
      <h1 style={{ fontFamily: fonts.logo, fontSize: 28, marginBottom: 8 }}>Lenden Branding</h1>
      <p style={{ color: colors.muted, marginBottom: 40 }}>{taglines.primary}</p>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 14, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Growing graph mark
        </h2>
        <div style={{ marginTop: 16, padding: 32, background: colors.surface, borderRadius: 16 }}>
          <BrandMark size={48} />
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 style={{ fontSize: 14, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Logo lockups
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginTop: 16 }}>
          <LogoLockup id="englishDarkLg" />
          <LogoLockup id="englishDark" />
          <LogoLockup id="englishDarkSm" />
          <LogoLockup id="markOnly" />
        </div>
      </section>

      <section>
        <h2 style={{ fontSize: 14, color: colors.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Colors
        </h2>
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          {[['green', colors.green], ['success', colors.success], ['black', colors.black]].map(
            ([name, hex]) => (
              <div key={name} style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 12,
                    background: hex,
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
                <p style={{ fontSize: 12, marginTop: 8, color: colors.muted }}>{name}</p>
                <p style={{ fontSize: 11, color: colors.muted }}>{hex}</p>
              </div>
            ),
          )}
        </div>
      </section>
    </div>
  )
}
