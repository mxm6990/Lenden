import type { ReactNode } from 'react'
import { ScreenHeader } from '../../components/layout/ScreenHeader'
import { ComplianceFooter, PrototypeBanner } from '../../components/trust/ComplianceCopy'

interface ProfileScreenLayoutProps {
  title: string
  subtitle: string
  onBack: () => void
  children: ReactNode
}

export function ProfileScreenLayout({
  title,
  subtitle,
  onBack,
  children,
}: ProfileScreenLayoutProps) {
  return (
    <>
      <ScreenHeader title={title} subtitle={subtitle} onBack={onBack} />
      <div className="px-5 pb-8">
        <PrototypeBanner className="mb-4" />
        {children}
        <ComplianceFooter className="mt-6" />
      </div>
    </>
  )
}

function statusColor(status: string): string {
  if (status === 'verified' || status === 'active' || status === 'moderate') {
    return 'text-lenden-mint'
  }
  if (status === 'rejected' || status === 'suspended') return 'text-red-400'
  if (status === 'pending') return 'text-amber-400'
  return 'text-lenden-muted'
}

export function StatusBadge({ label, status }: { label: string; status: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="text-sm text-lenden-muted">{label}</span>
      <span className={`text-sm font-semibold capitalize ${statusColor(status)}`}>{status.replace(/_/g, ' ')}</span>
    </div>
  )
}

export function TimelineItem({
  title,
  date,
  status,
  note,
}: {
  title: string
  date: string
  status: 'verified' | 'pending' | 'rejected'
  note?: string
}) {
  const dotColor =
    status === 'verified' ? 'bg-lenden-mint' : status === 'rejected' ? 'bg-red-400' : 'bg-amber-400'

  return (
    <div className="flex gap-3 pb-4 last:pb-0">
      <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dotColor}`} />
      <div className="min-w-0 flex-1 border-b border-white/5 pb-4 last:border-0">
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="text-[11px] text-lenden-muted">{date}</p>
        {note && <p className="mt-1 text-xs text-lenden-muted">{note}</p>}
      </div>
    </div>
  )
}
