/**
 * Mock session data — wire Security Settings to this layer.
 */

import type { LoginHistoryEntry, SessionSnapshot, TrustedDevice, UserSession } from '../types/session'

const MOCK_USER_ID = 'usr_mahathir_001'

export const MOCK_CURRENT_SESSION: UserSession = {
  sessionId: 'sess_demo_001',
  userId: MOCK_USER_ID,
  deviceId: 'dev_iphone_001',
  createdAt: '2025-05-27T08:12:00+06:00',
  expiresAt: '2025-05-27T20:12:00+06:00',
  refreshTokenPlaceholder: 'rt_mock_placeholder_not_real',
  isActive: true,
}

export const MOCK_TRUSTED_DEVICES: TrustedDevice[] = [
  {
    id: 'dev_iphone_001',
    userId: MOCK_USER_ID,
    deviceName: 'iPhone 17 Pro',
    platform: 'iOS 26',
    lastActiveAt: '2025-05-27T08:12:00+06:00',
    ipAddressMasked: '203.***.***.42',
    isCurrent: true,
  },
  {
    id: 'dev_mac_001',
    userId: MOCK_USER_ID,
    deviceName: 'MacBook Pro',
    platform: 'macOS Safari',
    lastActiveAt: '2025-05-24T19:40:00+06:00',
    ipAddressMasked: '103.***.***.18',
    isCurrent: false,
  },
]

export const MOCK_LOGIN_HISTORY: LoginHistoryEntry[] = [
  {
    id: 'lh_001',
    userId: MOCK_USER_ID,
    timestamp: '2025-05-27T08:12:00+06:00',
    deviceName: 'iPhone 17 Pro',
    location: 'Dhaka, BD',
    success: true,
    ipAddressMasked: '203.***.***.42',
  },
  {
    id: 'lh_002',
    userId: MOCK_USER_ID,
    timestamp: '2025-05-24T19:40:00+06:00',
    deviceName: 'MacBook Pro',
    location: 'Dhaka, BD',
    success: true,
    ipAddressMasked: '103.***.***.18',
  },
  {
    id: 'lh_003',
    userId: MOCK_USER_ID,
    timestamp: '2025-05-20T07:55:00+06:00',
    deviceName: 'Unknown device',
    location: 'Chittagong, BD',
    success: false,
    ipAddressMasked: '118.***.***.91',
  },
]

export function getMockSessionSnapshot(): SessionSnapshot {
  return {
    currentSession: MOCK_CURRENT_SESSION,
    trustedDevices: [...MOCK_TRUSTED_DEVICES],
    loginHistory: [...MOCK_LOGIN_HISTORY],
  }
}
