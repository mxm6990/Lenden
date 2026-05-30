import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { DevDataRefresh } from '../dev/DevDataRefresh'
import { DevMarketOverrideBadge } from '../trust/ComplianceCopy'
import { isDevMarketOverrideActive } from '../../lib/devMarketOverride'
import { isNativeApp } from '../../utils/platform'

const shellWidth = isNativeApp ? 'w-full max-w-none' : 'mx-auto max-w-[430px]'

interface AppShellProps {
  children: ReactNode
  showNav?: boolean
}

export function AppShell({ children, showNav = true }: AppShellProps) {
  const devMarketOverride = isDevMarketOverrideActive()

  return (
    <div className={`${shellWidth} flex min-h-dvh flex-col bg-lenden-black`}>
      {devMarketOverride && (
        <div className="shrink-0 border-b border-sky-400/20 bg-sky-500/10 px-4 py-2 text-center">
          <DevMarketOverrideBadge />
        </div>
      )}
      <main
        className={`min-h-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] ${
          showNav ? 'main-scroll-padding' : 'safe-bottom-lg'
        }`}
      >
        {children}
      </main>
      {showNav && <BottomNav />}
      <DevDataRefresh />
    </div>
  )
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className={`${shellWidth} min-h-dvh bg-lenden-black`}>
      <div className="flex min-h-dvh flex-col">{children}</div>
    </div>
  )
}
