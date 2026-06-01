import { Home, PieChart, TrendingUp, User } from 'lucide-react'
import { LendenLogo } from '../LendenLogo'

type Tab = 'home' | 'market' | 'portfolio' | 'profile'

export function MockHeader({
  title,
  subtitle,
  activeTab = 'home',
}: {
  title?: string
  subtitle?: string
  activeTab?: Tab
}) {
  return (
    <>
      <header className="border-b border-white/5 bg-lenden-black/95 px-4 pt-3 pb-2">
        <div className="flex min-h-[2.25rem] items-center gap-2">
          <LendenLogo variant="compact" markSize={18} />
          <span className="rounded-full border border-lenden-mint/25 bg-lenden-mint/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-lenden-mint">
            Paper beta
          </span>
        </div>
        {title && (
          <div className="mt-2 pb-1">
            <h2 className="text-base font-bold text-white">{title}</h2>
            {subtitle && <p className="text-[10px] text-lenden-muted">{subtitle}</p>}
          </div>
        )}
      </header>
      <MockBottomNav activeTab={activeTab} />
    </>
  )
}

export function MockBottomNav({ activeTab }: { activeTab: Tab }) {
  const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'market', label: 'Market', icon: TrendingUp },
    { id: 'portfolio', label: 'Portfolio', icon: PieChart },
    { id: 'profile', label: 'Profile', icon: User },
  ]

  return (
    <nav className="absolute right-0 bottom-0 left-0 border-t border-white/5 bg-lenden-black/95">
      <div className="flex h-14 items-center justify-around px-1">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = activeTab === id
          return (
            <div key={id} className="flex flex-1 flex-col items-center gap-0.5">
              <Icon
                className={`h-4 w-4 ${active ? 'text-lenden-mint' : 'text-lenden-muted'}`}
                strokeWidth={active ? 2.5 : 2}
              />
              <span className={`text-[9px] font-medium ${active ? 'text-lenden-mint' : 'text-lenden-muted'}`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </nav>
  )
}
