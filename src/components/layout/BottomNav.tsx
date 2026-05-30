import { Home, PieChart, TrendingUp, User } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import type { MainTab } from '../../types/navigation'
import { isNativeApp } from '../../utils/platform'

const tabs: { id: MainTab; label: string; icon: typeof Home }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'market', label: 'Market', icon: TrendingUp },
  { id: 'portfolio', label: 'Portfolio', icon: PieChart },
  { id: 'profile', label: 'Profile', icon: User },
]

export function BottomNav() {
  const { activeTab, setTab, overlay } = useApp()

  if (overlay) return null

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-30 border-t border-white/5 bg-lenden-black/95 backdrop-blur-xl"
      style={{ height: 'var(--bottom-nav-height)' }}
    >
      <div
        className={`flex h-full items-center justify-around px-2 pt-1 nav-safe-bottom ${
          isNativeApp ? 'w-full' : 'mx-auto max-w-[430px]'
        }`}
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 py-0.5"
            >
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                  active ? 'bg-lenden-mint/15 text-lenden-mint' : 'text-lenden-muted'
                }`}
              >
                <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 2} />
              </div>
              <span
                className={`text-[10px] font-medium leading-none ${active ? 'text-lenden-mint' : 'text-lenden-muted'}`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
