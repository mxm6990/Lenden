import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'

interface ScreenHeaderProps {
  title?: string
  subtitle?: string
  onBack?: () => void
  right?: ReactNode
  large?: boolean
  className?: string
}

export function ScreenHeader({
  title,
  subtitle,
  onBack,
  right,
  large,
  className = '',
}: ScreenHeaderProps) {
  return (
    <header
      className={`sticky top-0 z-20 border-b border-white/5 bg-lenden-black/90 px-5 pt-2 pb-2.5 backdrop-blur-xl ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lenden-surface text-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="min-w-0">
            {title && (
              <h1 className={`truncate font-bold text-white ${large ? 'text-xl' : 'text-lg'}`}>
                {title}
              </h1>
            )}
            {subtitle && <p className="text-xs text-lenden-muted">{subtitle}</p>}
          </div>
        </div>
        {right}
      </div>
    </header>
  )
}
