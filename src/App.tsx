import { AppProvider, useApp } from './context/AppContext'
import { AppShell, AuthShell } from './components/layout/AppShell'
import { isNativeApp } from './utils/platform'
import { SplashScreen } from './screens/auth/SplashScreen'
import { SignUpScreen } from './screens/auth/SignUpScreen'
import { SignInScreen } from './screens/auth/SignInScreen'
import { KycScreen } from './screens/auth/KycScreen'
import { HomeScreen } from './screens/HomeScreen'
import { MarketScreen } from './screens/MarketScreen'
import { PortfolioScreen } from './screens/PortfolioScreen'
// import { LearnScreen } from './screens/LearnScreen' // enable in a later live update
import { ProfileScreen } from './screens/ProfileScreen'
import { StockDetailScreen } from './screens/StockDetailScreen'
import { AllocationDetailScreen } from './screens/AllocationDetailScreen'
import { ProfileRouteScreen } from './screens/profile/ProfileRouteScreen'
import { BuyFlowScreen } from './screens/BuyFlowScreen'

// import { AdminDashboardConcept } from './admin/AdminDashboardConcept' // dev-only ops concept

function MainApp() {
  const { activeTab, overlay, profileRoute, closeProfileRoute } = useApp()

  if (overlay === 'buy-flow') {
    return (
      <AppShell showNav={false}>
        <BuyFlowScreen />
      </AppShell>
    )
  }

  if (overlay === 'stock-detail') {
    return (
      <AppShell showNav={false}>
        <StockDetailScreen />
      </AppShell>
    )
  }

  if (overlay === 'allocation-detail') {
    return (
      <AppShell showNav={false}>
        <AllocationDetailScreen />
      </AppShell>
    )
  }

  if (profileRoute) {
    return (
      <AppShell showNav={false}>
        <ProfileRouteScreen route={profileRoute} onBack={closeProfileRoute} />
      </AppShell>
    )
  }

  const screens = {
    home: <HomeScreen />,
    market: <MarketScreen />,
    portfolio: <PortfolioScreen />,
    // learn: <LearnScreen />, // enable in a later live update
    profile: <ProfileScreen />,
  }

  return <AppShell>{screens[activeTab] ?? <HomeScreen />}</AppShell>
}

function AuthFlow() {
  const { authScreen, authReady } = useApp()

  if (!authReady) {
    return (
      <AuthShell>
        <div className="flex min-h-svh items-center justify-center px-6">
          <p className="text-sm text-lenden-muted">Loading…</p>
        </div>
      </AuthShell>
    )
  }

  const screens = {
    splash: <SplashScreen />,
    signup: <SignUpScreen />,
    signin: <SignInScreen />,
    kyc: <KycScreen />,
  }

  return <AuthShell>{screens[authScreen]}</AuthShell>
}

function AppRouter() {
  const { isAuthenticated } = useApp()
  return isAuthenticated ? <MainApp /> : <AuthFlow />
}

function App() {
  return (
    <div className={`min-h-svh ${isNativeApp ? 'bg-lenden-black' : 'bg-[#050706]'}`}>
      <div
        className={`mx-auto min-h-svh ${
          isNativeApp ? 'w-full max-w-none' : 'max-w-[430px] shadow-2xl shadow-black/50'
        }`}
      >
        <AppProvider>
          <AppRouter />
        </AppProvider>
      </div>
    </div>
  )
}

export default App
