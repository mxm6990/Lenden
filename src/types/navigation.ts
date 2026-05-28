export type AuthScreen = 'splash' | 'signup' | 'kyc'

export type MainTab = 'home' | 'market' | 'portfolio' | 'profile'
// | 'learn' — enable tab in BottomNav + App.tsx in a later live update

export type OverlayScreen = 'stock-detail' | 'buy-flow' | 'allocation-detail' | null

export type BuyStep = 'amount' | 'confirm' | 'success'

export interface UserProfile {
  fullName: string
  phone: string
  email: string
  kycVerified: boolean
  bankLinked: string
}
