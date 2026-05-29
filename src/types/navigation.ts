export type AuthScreen = 'splash' | 'signup' | 'signin' | 'kyc'

export type MainTab = 'home' | 'market' | 'portfolio' | 'profile'
// | 'learn' — enable tab in BottomNav + App.tsx in a later live update

export type OverlayScreen = 'stock-detail' | 'buy-flow' | 'sell-flow' | 'allocation-detail' | null

export type BuyStep = 'amount' | 'confirm' | 'success'

/** Reused for buy and sell flow steps */
export type TradeStep = BuyStep

export interface UserProfile {
  fullName: string
  phone: string
  email: string
  kycVerified: boolean
  bankLinked: string
}
