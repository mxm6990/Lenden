import type { ReactNode } from 'react'
import { AlertCircle, Inbox, WifiOff } from 'lucide-react'
import { Card } from '../ui/Card'

type TrustStateVariant = 'empty' | 'error' | 'warning' | 'info'

const VARIANTS: Record<
  TrustStateVariant,
  { icon: typeof Inbox; iconClass: string; borderClass: string }
> = {
  empty: { icon: Inbox, iconClass: 'text-lenden-muted', borderClass: 'border-white/5' },
  error: { icon: WifiOff, iconClass: 'text-red-400', borderClass: 'border-red-500/20' },
  warning: { icon: AlertCircle, iconClass: 'text-amber-400', borderClass: 'border-amber-500/20' },
  info: { icon: AlertCircle, iconClass: 'text-sky-400', borderClass: 'border-sky-500/20' },
}

interface TrustStateProps {
  variant?: TrustStateVariant
  title: string
  message: string
  action?: ReactNode
  className?: string
}

export function TrustState({
  variant = 'info',
  title,
  message,
  action,
  className = '',
}: TrustStateProps) {
  const { icon: Icon, iconClass, borderClass } = VARIANTS[variant]

  return (
    <Card className={`border ${borderClass} p-4 ${className}`}>
      <div className="flex gap-3">
        <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconClass}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">{title}</p>
          <p className="mt-1 text-xs leading-relaxed text-lenden-muted">{message}</p>
          {action && <div className="mt-3">{action}</div>}
        </div>
      </div>
    </Card>
  )
}

export function LoadingSkeleton({ rows = 3, className = '' }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-2xl bg-lenden-card" />
      ))}
    </div>
  )
}
