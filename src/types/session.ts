/**
 * Session and device management types — mock foundation for Security Settings.
 */

export interface UserSession {
  sessionId: string
  userId: string
  deviceId: string
  createdAt: string
  expiresAt: string
  refreshTokenPlaceholder: string
  isActive: boolean
}

export interface TrustedDevice {
  id: string
  userId: string
  deviceName: string
  platform: string
  lastActiveAt: string
  ipAddressMasked: string
  isCurrent: boolean
}

export interface LoginHistoryEntry {
  id: string
  userId: string
  timestamp: string
  deviceName: string
  location: string
  success: boolean
  ipAddressMasked: string
}

export interface SessionSnapshot {
  currentSession: UserSession
  trustedDevices: TrustedDevice[]
  loginHistory: LoginHistoryEntry[]
}

export interface UserPreferences {
  userId: string
  locale: 'en' | 'bn'
  currency: 'BDT'
  notificationsEnabled: boolean
  marketingOptIn: boolean
}

export interface SessionStatus {
  authenticated: boolean
  userId: string | null
  sessionId: string | null
  expiresAt: string | null
  prototypeMode: true
}
