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
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div
        className={`flex h-[var(--bottom-nav-bar-height)] items-center justify-around px-2 ${
          isNativeApp ? 'w-full' : 'mx-auto max-w-[430px]'
        }`}
      >
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className="flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5"
            >
              <Icon
                className={`h-5 w-5 shrink-0 ${active ? 'text-lenden-mint' : 'text-lenden-muted'}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={`text-[10px] font-medium leading-tight ${
                  active ? 'text-lenden-mint' : 'text-lenden-muted'
                }`}
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
