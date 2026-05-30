import type { ReactNode } from 'react'
import { LendenLogo } from '../branding/LendenLogo'
import { PaperTradingBetaPill } from '../trust/ComplianceCopy'

interface CompactAppHeaderProps {
  title?: string
  subtitle?: string
  right?: ReactNode
  showLogo?: boolean
  showBetaPill?: boolean
  className?: string
}

export function CompactAppHeader({
  title,
  subtitle,
  right,
  showLogo = true,
  showBetaPill = true,
  className = '',
}: CompactAppHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-30 min-h-[var(--app-header-height)] border-b border-white/5 bg-lenden-black/95 backdrop-blur-xl ${className}`}
    >
      <div className="flex min-h-[2.75rem] items-center justify-between gap-3 px-5 pt-3 pb-2">
        <div className="flex min-w-0 items-center gap-2.5">
          {showLogo && <LendenLogo variant="compact" className="shrink-0" />}
          {showBetaPill && <PaperTradingBetaPill />}
        </div>
        {right}
      </div>
      {title && (
        <div className="px-5 pb-3">
          <h1 className="truncate text-lg font-bold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-lenden-muted">{subtitle}</p>}
        </div>
      )}
    </header>
  )
}
