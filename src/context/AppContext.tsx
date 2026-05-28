import { createContext, useContext, useState, type ReactNode } from 'react'
import type {
  AuthScreen,
  BuyStep,
  MainTab,
  OverlayScreen,
  UserProfile,
} from '../types/navigation'
import type { ProfileRoute } from '../types/profile'

interface AppState {
  authScreen: AuthScreen
  isDemo: boolean
  activeTab: MainTab
  overlay: OverlayScreen
  profileRoute: ProfileRoute | null
  selectedStockId: string | null
  buyStep: BuyStep
  buyAmount: number
  watchlist: string[]
  balance: number
  user: UserProfile
  isAuthenticated: boolean
}

interface AppContextValue extends AppState {
  goToAuth: (screen: AuthScreen) => void
  enterDemo: () => void
  completeSignUp: (profile?: Pick<UserProfile, 'fullName' | 'phone' | 'email'>) => void
  completeKyc: () => void
  setTab: (tab: MainTab) => void
  openStock: (stockId: string) => void
  openAllocation: () => void
  openProfileRoute: (route: ProfileRoute) => void
  closeProfileRoute: () => void
  closeOverlay: () => void
  startBuy: (stockId?: string) => void
  setBuyStep: (step: BuyStep) => void
  setBuyAmount: (amount: number) => void
  confirmBuy: () => void
  toggleWatchlist: (stockId: string) => void
  resetApp: () => void
  signOut: () => void
}

const defaultUser: UserProfile = {
  fullName: '',
  phone: '',
  email: '',
  kycVerified: false,
  bankLinked: '',
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [authScreen, setAuthScreen] = useState<AuthScreen>('splash')
  const [isDemo, setIsDemo] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<MainTab>('home')
  const [overlay, setOverlay] = useState<OverlayScreen>(null)
  const [profileRoute, setProfileRoute] = useState<ProfileRoute | null>(null)
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null)
  const [buyStep, setBuyStep] = useState<BuyStep>('amount')
  const [buyAmount, setBuyAmount] = useState(500)
  const [watchlist, setWatchlist] = useState(['gp', 'renata', 'marico'])
  const [balance, setBalance] = useState(12450)
  const [user, setUser] = useState<UserProfile>(defaultUser)

  const enterApp = () => {
    setIsAuthenticated(true)
    setActiveTab('home')
  }

  return (
    <AppContext.Provider
      value={{
        authScreen,
        isDemo,
        activeTab,
        overlay,
        profileRoute,
        selectedStockId,
        buyStep,
        buyAmount,
        watchlist,
        balance,
        user,
        isAuthenticated,
        goToAuth: setAuthScreen,
        enterDemo: () => {
          setIsDemo(true)
          setUser({
            fullName: 'Mahathir',
            phone: '+880 17XX-XXX-XXX',
            email: 'demo@lenden.app',
            kycVerified: true,
            bankLinked: 'bKash ··· 4821',
          })
          enterApp()
        },
        completeSignUp: (profile) => {
          if (profile) {
            setUser((u) => ({ ...u, ...profile }))
          }
          setAuthScreen('kyc')
        },
        completeKyc: () => {
          setUser((u) => ({
            ...u,
            kycVerified: true,
            bankLinked: 'Dutch-Bangla Bank ··· 7392',
          }))
          enterApp()
        },
        setTab: (tab) => {
          setActiveTab(tab)
          setOverlay(null)
          setProfileRoute(null)
        },
        openStock: (stockId) => {
          setSelectedStockId(stockId)
          setOverlay('stock-detail')
        },
        openAllocation: () => {
          setOverlay('allocation-detail')
        },
        openProfileRoute: (route) => {
          setProfileRoute(route)
        },
        closeProfileRoute: () => {
          setProfileRoute(null)
        },
        closeOverlay: () => {
          setOverlay(null)
          setBuyStep('amount')
        },
        startBuy: (stockId) => {
          if (stockId) setSelectedStockId(stockId)
          setBuyStep('amount')
          setBuyAmount(500)
          setOverlay('buy-flow')
        },
        setBuyStep,
        setBuyAmount,
        confirmBuy: () => {
          setBalance((b) => b - buyAmount)
          setBuyStep('success')
        },
        toggleWatchlist: (stockId) => {
          setWatchlist((list) =>
            list.includes(stockId) ? list.filter((id) => id !== stockId) : [...list, stockId],
          )
        },
        resetApp: () => {
          setAuthScreen('splash')
          setIsDemo(false)
          setIsAuthenticated(false)
          setActiveTab('home')
          setOverlay(null)
          setProfileRoute(null)
          setSelectedStockId(null)
          setBuyStep('amount')
          setBuyAmount(500)
          setUser(defaultUser)
        },
        signOut: () => {
          setAuthScreen('splash')
          setIsDemo(false)
          setIsAuthenticated(false)
          setActiveTab('home')
          setOverlay(null)
          setProfileRoute(null)
          setSelectedStockId(null)
          setBuyStep('amount')
          setBuyAmount(500)
          setUser(defaultUser)
        },
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
