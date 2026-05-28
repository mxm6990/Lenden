import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'
import { isNativeApp } from '../../utils/platform'

const shellWidth = isNativeApp ? 'w-full max-w-none' : 'mx-auto max-w-[430px]'

interface AppShellProps {
  children: ReactNode
  showNav?: boolean
}

export function AppShell({ children, showNav = true }: AppShellProps) {
  return (
    <div className={`${shellWidth} flex h-svh max-h-svh flex-col overflow-hidden bg-lenden-black`}>
      <main
        className={`min-h-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] ${
          showNav ? 'main-scroll-padding' : 'safe-bottom-lg'
        }`}
      >
        {children}
      </main>
      {showNav && <BottomNav />}
    </div>
  )
}

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className={`${shellWidth} h-svh max-h-svh overflow-hidden bg-lenden-black`}>
      <div className="flex h-full min-h-0 flex-col">{children}</div>
    </div>
  )
}
