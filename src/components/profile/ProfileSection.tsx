import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Card } from '../ui/Card'

interface ProfileSectionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

export function ProfileSection({ title, defaultOpen = true, children }: ProfileSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="mb-4">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="mb-2 flex w-full items-center justify-between gap-2 text-left"
      >
        <p className="text-xs font-semibold tracking-wide text-lenden-muted uppercase">
          {title}
        </p>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-lenden-muted transition ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <Card className="divide-y divide-white/5 overflow-hidden">{children}</Card>}
    </section>
  )
}

interface ProfileCardRowProps {
  label: string
  value?: string
  highlight?: boolean
  onClick?: () => void
}

export function ProfileCardRow({ label, value, highlight, onClick }: ProfileCardRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition active:bg-white/[0.02]"
    >
      <span className="min-w-0 flex-1 text-sm text-white">{label}</span>
      {value && (
        <span
          className={`max-w-[45%] truncate text-xs ${
            highlight ? 'font-semibold text-lenden-mint' : 'text-lenden-muted'
          }`}
        >
          {value}
        </span>
      )}
      <ChevronRight className="h-4 w-4 shrink-0 text-lenden-muted" />
    </button>
  )
}

interface ProfileIdentityHeaderProps {
  fullName: string
  email: string
  profileInitial: string
  lendenId: string
  kycVerified: boolean
}

export function ProfileIdentityHeader({
  fullName,
  email,
  profileInitial,
  lendenId,
  kycVerified,
}: ProfileIdentityHeaderProps) {
  return (
    <div className="mb-6 rounded-2xl border border-white/5 bg-lenden-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-lenden-green text-xl font-bold text-white">
          {profileInitial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-bold text-white">{fullName}</p>
          <p className="truncate text-sm text-lenden-muted">{email}</p>
          {kycVerified && (
            <span className="mt-2 inline-flex items-center rounded-full bg-lenden-mint/15 px-2.5 py-1 text-[10px] font-semibold text-lenden-mint">
              Verified
            </span>
          )}
        </div>
      </div>
      <div className="mt-4 border-t border-white/5 pt-4">
        <p className="text-[10px] font-medium tracking-wide text-lenden-muted uppercase">
          Lenden ID
        </p>
        <p className="mt-0.5 font-mono text-sm text-white">{lendenId}</p>
      </div>
    </div>
  )
}
