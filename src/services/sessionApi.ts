/**
 * Mock session API — Security Settings and auth session foundation.
 */

import { getMockSessionSnapshot, MOCK_TRUSTED_DEVICES } from '../data/mockSessions'
import type {
  LoginHistoryEntry,
  SessionSnapshot,
  SessionStatus,
  TrustedDevice,
  UserPreferences,
} from '../types/session'

const MOCK_DELAY_MS = 80
const MOCK_USER_ID = 'usr_mahathir_001'

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

export async function getSessionSnapshot(): Promise<SessionSnapshot> {
  // return fetch('/api/session').then(...)
  return delay(getMockSessionSnapshot())
}

export async function getSessionStatus(): Promise<SessionStatus> {
  const snapshot = getMockSessionSnapshot()
  return delay({
    authenticated: snapshot.currentSession.isActive,
    userId: MOCK_USER_ID,
    sessionId: snapshot.currentSession.sessionId,
    expiresAt: snapshot.currentSession.expiresAt,
    prototypeMode: true,
  })
}

export async function getTrustedDevices(): Promise<TrustedDevice[]> {
  return delay([...MOCK_TRUSTED_DEVICES])
}

export async function getLoginHistory(): Promise<LoginHistoryEntry[]> {
  return delay(getMockSessionSnapshot().loginHistory)
}

export async function removeTrustedDevice(deviceId: string): Promise<{ removed: boolean }> {
  // return fetch(`/api/session/devices/${deviceId}`, { method: 'DELETE' })
  const exists = MOCK_TRUSTED_DEVICES.some((d) => d.id === deviceId && !d.isCurrent)
  return delay({ removed: exists })
}

export async function getUserPreferences(): Promise<UserPreferences> {
  return delay({
    userId: MOCK_USER_ID,
    locale: 'en',
    currency: 'BDT',
    notificationsEnabled: true,
    marketingOptIn: false,
  })
}
