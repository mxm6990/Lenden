/**
 * Mock user API — identity and session-facing user data.
 * Replace with authenticated HTTP when backend is live.
 */

import { getUserProfile as getProfileRecord } from './profileApi'
import { getSessionStatus, getUserPreferences } from './sessionApi'
import type { UserProfile } from '../types/profile'
import type { SessionStatus, UserPreferences } from '../types/session'

export async function getCurrentUser(): Promise<UserProfile> {
  // return fetch('/api/user/me').then(...)
  return getProfileRecord()
}

export { getSessionStatus, getUserPreferences }

export type { UserProfile, SessionStatus, UserPreferences }
