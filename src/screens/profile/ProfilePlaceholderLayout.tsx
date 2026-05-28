import type { ReactNode } from 'react'
import { ScreenHeader } from '../../components/layout/ScreenHeader'
import { Card } from '../../components/ui/Card'

interface ProfilePlaceholderLayoutProps {
  title: string
  subtitle: string
  onBack: () => void
  children?: ReactNode
}

export function ProfilePlaceholderLayout({
  title,
  subtitle,
  onBack,
  children,
}: ProfilePlaceholderLayoutProps) {
  return (
    <>
      <ScreenHeader title={title} subtitle={subtitle} onBack={onBack} />
      <div className="px-5 pb-4">
        <Card className="mb-4 border-lenden-mint/20 bg-lenden-mint/5 p-4">
          <p className="text-xs leading-relaxed text-lenden-muted">
            Compliance-ready foundation — not live functionality. Final flows require
            Bangladeshi legal/compliance review, licensed brokerage partnerships, and
            regulatory approval before production.
          </p>
        </Card>
        {children}
        <Card className="p-5 text-center">
          <p className="text-sm font-semibold text-white">Coming soon</p>
          <p className="mt-1 text-xs leading-relaxed text-lenden-muted">
            This screen is a placeholder for the full {title.toLowerCase()} experience.
          </p>
        </Card>
      </div>
    </>
  )
}
