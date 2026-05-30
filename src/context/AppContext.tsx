import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  AuthScreen,
  BuyStep,
  MainTab,
  OverlayScreen,
  UserProfile,
} from '../types/navigation'
import type { ProfileRoute } from '../types/profile'
import { isDemoModeActive, setDemoModeActive } from '../lib/demoMode'
import { getUserProfileResult } from '../services/profileApi'
import { refreshMarketQuotes } from '../services/marketDataProvider'
import { refreshSecurityCatalog } from '../services/securityCatalogApi'
import {
  addWatchlistStock,
  getWatchlistStockIds,
  removeWatchlistStock,
} from '../services/portfolioApi'
import {
  getAuthSession,
  signOutFromSupabase,
  subscribeToAuthChanges,
} from '../services/authApi'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  canonicalWatchlistTicker,
  isWatchlistMember,
  withWatchlistMember,
  withoutWatchlistMember,
} from '../lib/watchlistState'

interface AppState {
  authScreen: AuthScreen
  isDemo: boolean
  activeTab: MainTab
  overlay: OverlayScreen
  profileRoute: ProfileRoute | null
  selectedStockId: string | null
  buyStep: BuyStep
  sellStep: BuyStep
  buyAmount: number
  watchlist: string[]
  user: UserProfile
  isAuthenticated: boolean
  authReady: boolean
  portfolioVersion: number
  profileVersion: number
  dataRefreshing: boolean
}

interface AppContextValue extends AppState {
  goToAuth: (screen: AuthScreen) => void
  enterDemo: () => void
  enterWithSupabaseSession: () => Promise<void>
  completeSignUp: (profile?: Pick<UserProfile, 'fullName' | 'phone' | 'email'>) => void
  completeKyc: () => void
  setTab: (tab: MainTab) => void
  openStock: (stockId: string) => void
  openAllocation: () => void
  openProfileRoute: (route: ProfileRoute) => void
  closeProfileRoute: () => void
  closeOverlay: () => void
  startBuy: (stockId?: string) => void
  startSell: (stockId?: string) => void
  setBuyStep: (step: BuyStep) => void
  setSellStep: (step: BuyStep) => void
  setBuyAmount: (amount: number) => void
  toggleWatchlist: (stockId: string) => void
  isInWatchlist: (stockId: string) => boolean
  isWatchlistPersisting: (stockId: string) => boolean
  refreshPortfolio: () => void
  refreshProfile: () => void
  refreshAllUserData: () => Promise<void>
  resetApp: () => void
  signOut: () => Promise<void>
}

const defaultUser: UserProfile = {
  fullName: '',
  phone: '',
  email: '',
  kycVerified: false,
  bankLinked: '',
}

const AppContext = createContext<AppContextValue | null>(null)

function mapProfileToNavUser(profile: Awaited<ReturnType<typeof getUserProfileResult>>['data']): UserProfile {
  if (!profile) return defaultUser
  return {
    fullName: profile.fullName,
    phone: profile.phone,
    email: profile.email,
    kycVerified: profile.kycStatus === 'verified',
    bankLinked: profile.linkedBank ?? profile.linkedWallet ?? '',
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [authScreen, setAuthScreen] = useState<AuthScreen>('splash')
  const [isDemo, setIsDemo] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured())
  const [activeTab, setActiveTab] = useState<MainTab>('home')
  const [overlay, setOverlay] = useState<OverlayScreen>(null)
  const [profileRoute, setProfileRoute] = useState<ProfileRoute | null>(null)
  const [selectedStockId, setSelectedStockId] = useState<string | null>(null)
  const [buyStep, setBuyStep] = useState<BuyStep>('amount')
  const [sellStep, setSellStep] = useState<BuyStep>('amount')
  const [buyAmount, setBuyAmount] = useState(500)
  const [watchlist, setWatchlist] = useState(['GP', 'RENATA', 'MARICO'])
  const [user, setUser] = useState<UserProfile>(defaultUser)
  const [portfolioVersion, setPortfolioVersion] = useState(0)
  const [profileVersion, setProfileVersion] = useState(0)
  const [dataRefreshing, setDataRefreshing] = useState(false)
  const [watchlistPersisting, setWatchlistPersisting] = useState<string[]>([])
  const watchlistPersistInFlight = useRef(new Set<string>())
  const refreshInFlight = useRef<Promise<void> | null>(null)

  const refreshPortfolio = useCallback(() => {
    setPortfolioVersion((v) => v + 1)
  }, [])

  const refreshProfile = useCallback(() => {
    setProfileVersion((v) => v + 1)
  }, [])

  const isInWatchlist = useCallback(
    (stockId: string) => isWatchlistMember(watchlist, stockId),
    [watchlist],
  )

  const isWatchlistPersisting = useCallback(
    (stockId: string) => watchlistPersisting.includes(canonicalWatchlistTicker(stockId)),
    [watchlistPersisting],
  )

  const refreshAllUserData = useCallback(async () => {
    if (refreshInFlight.current) {
      return refreshInFlight.current
    }

    const run = (async () => {
      setDataRefreshing(true)
      try {
        await Promise.all([refreshMarketQuotes(true), refreshSecurityCatalog(true)])

        if (!isDemoModeActive() && isSupabaseConfigured()) {
          const [profileResult, watchlistIds] = await Promise.all([
            getUserProfileResult(),
            getWatchlistStockIds(),
          ])

          if (profileResult.data) {
            setUser(mapProfileToNavUser(profileResult.data))
          }

          setWatchlist(watchlistIds)
        }

        setPortfolioVersion((v) => v + 1)
        setProfileVersion((v) => v + 1)
      } finally {
        setDataRefreshing(false)
        refreshInFlight.current = null
      }
    })()

    refreshInFlight.current = run
    return run
  }, [])

  const enterApp = () => {
    setIsAuthenticated(true)
    setActiveTab('home')
  }

  const resetLocalState = () => {
    setDemoModeActive(false)
    setAuthScreen('splash')
    setIsDemo(false)
    setIsAuthenticated(false)
    setActiveTab('home')
    setOverlay(null)
    setProfileRoute(null)
    setSelectedStockId(null)
    setBuyStep('amount')
    setSellStep('amount')
    setBuyAmount(500)
    setWatchlist(['GP', 'RENATA', 'MARICO'])
    setUser(defaultUser)
    setPortfolioVersion(0)
    setProfileVersion(0)
    setDataRefreshing(false)
  }

  const enterWithSupabaseSession = async () => {
    setIsDemo(false)
    setDemoModeActive(false)
    try {
      await refreshAllUserData()
      enterApp()
    } catch {
      enterApp()
    }
  }

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setAuthReady(true)
      return
    }

    let cancelled = false

    async function bootstrap() {
      await Promise.all([refreshMarketQuotes(), refreshSecurityCatalog()])
      const session = await getAuthSession()
      if (cancelled) return
      if (session) {
        await enterWithSupabaseSession()
      }
      setAuthReady(true)
    }

    bootstrap()

    const unsubscribe = subscribeToAuthChanges((signedIn) => {
      if (signedIn && !isAuthenticated) {
        void enterWithSupabaseSession()
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bootstrap once on mount
  }, [])

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
        sellStep,
        buyAmount,
        watchlist,
        user,
        isAuthenticated,
        authReady,
        portfolioVersion,
        profileVersion,
        dataRefreshing,
        goToAuth: setAuthScreen,
        enterDemo: () => {
          setDemoModeActive(true)
          setIsDemo(true)
          setWatchlist(['GP', 'RENATA', 'MARICO'])
          setUser({
            fullName: 'Mahathir',
            phone: '+880 17XX-XXX-XXX',
            email: 'demo@lenden.app',
            kycVerified: true,
            bankLinked: 'bKash ··· 4821',
          })
          enterApp()
        },
        enterWithSupabaseSession,
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

          if (!isDemo && isSupabaseConfigured()) {
            if (tab === 'home' || tab === 'portfolio') {
              refreshPortfolio()
            }
            if (tab === 'profile') {
              refreshProfile()
            }
          }
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
          setSellStep('amount')
        },
        startBuy: (stockId) => {
          if (stockId) setSelectedStockId(stockId)
          setBuyStep('amount')
          setOverlay('buy-flow')
        },
        startSell: (stockId) => {
          if (stockId) setSelectedStockId(stockId)
          setSellStep('amount')
          setOverlay('sell-flow')
        },
        setBuyStep,
        setSellStep,
        setBuyAmount,
        toggleWatchlist: (stockId) => {
          const canonical = canonicalWatchlistTicker(stockId)
          if (watchlistPersistInFlight.current.has(canonical)) return

          const removing = isWatchlistMember(watchlist, canonical)
          const previous = [...watchlist]

          setWatchlist((list) =>
            removing ? withoutWatchlistMember(list, canonical) : withWatchlistMember(list, canonical),
          )

          if (isDemo) return

          watchlistPersistInFlight.current.add(canonical)
          setWatchlistPersisting((pending) =>
            pending.includes(canonical) ? pending : [...pending, canonical],
          )

          void (async () => {
            try {
              if (removing) {
                await removeWatchlistStock(canonical)
              } else {
                await addWatchlistStock(canonical)
              }
              const updated = await getWatchlistStockIds()
              setWatchlist(updated.map((id) => canonicalWatchlistTicker(id)))
            } catch {
              setWatchlist(previous)
            } finally {
              watchlistPersistInFlight.current.delete(canonical)
              setWatchlistPersisting((pending) => pending.filter((id) => id !== canonical))
            }
          })()
        },
        isInWatchlist,
        isWatchlistPersisting,
        refreshPortfolio,
        refreshProfile,
        refreshAllUserData,
        resetApp: resetLocalState,
        signOut: async () => {
          if (isSupabaseConfigured() && !isDemo) {
            await signOutFromSupabase()
          }
          resetLocalState()
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
