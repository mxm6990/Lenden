/**
 * Mock profile API — compliance-ready foundation.
 *
 * Replace implementations with authenticated HTTP calls when backend is live.
 * All sensitive fields (NID, TIN, full account numbers) must be encrypted at rest
 * and access-logged per Bangladesh Cyber Security Act 2023 expectations.
 *
 * NOT legal advice. Requires review by BD legal/compliance experts.
 */

import type {
  ComplianceStatus,
  KycStatus,
  LegalConsent,
  LinkedAccount,
  SecuritySettings,
  UpdateUserProfilePayload,
  UserProfile,
} from '../types/profile'
import type { ProfileServiceResult } from '../types/profileService'
import type { ProfileRow } from '../types/supabase'
import { isDemoModeActive } from '../lib/demoMode'
import { mapProfileRowToUserProfile, mapUserProfileToRowUpdate } from '../lib/profileMapper'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'

const MOCK_DELAY_MS = 120

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(value), MOCK_DELAY_MS)
  })
}

const mockUser: UserProfile = {
  userId: 'usr_mahathir_001',
  fullName: 'Mahathir Mahbub',
  email: 'demo@lenden.app',
  phone: '+880 1712-345678',
  profileInitial: 'MM',
  kycStatus: 'verified',
  boAccountStatus: 'pending',
  linkedWallet: 'bKash ··· 4821',
  linkedBank: 'Dutch-Bangla Bank ··· 7392',
  nidVerificationStatus: 'verified',
  riskProfileStatus: 'moderate',
  lendenId: 'LDN-2025-004821',
  createdAt: '2025-01-15T08:30:00+06:00',
  updatedAt: '2025-05-20T14:22:00+06:00',
}

const mockKyc: KycStatus = {
  record: {
    id: 'kyc_001',
    userId: mockUser.userId,
    status: 'verified',
    nidNumberMasked: '•••• •••• 1234',
    submittedAt: '2025-01-16T10:00:00+06:00',
    verifiedAt: '2025-01-18T16:45:00+06:00',
    reviewerNotes: null,
    amlScreeningStatus: 'verified',
    documentExpiry: '2030-12-31',
  },
  summaryLabel: 'Verified',
  nextStep: null,
}

const mockLinkedAccounts: LinkedAccount[] = [
  {
    id: 'la_001',
    userId: mockUser.userId,
    type: 'mobile_wallet',
    provider: 'bKash',
    providerKey: 'bkash',
    accountMask: '··· 4821',
    isPrimary: true,
    verifiedAt: '2025-01-20T09:00:00+06:00',
    status: 'verified',
  },
  {
    id: 'la_002',
    userId: mockUser.userId,
    type: 'bank',
    provider: 'Dutch-Bangla Bank',
    providerKey: 'bank',
    accountMask: '··· 7392',
    isPrimary: true,
    verifiedAt: '2025-02-01T11:30:00+06:00',
    status: 'verified',
  },
]

const mockSecurity: SecuritySettings = {
  userId: mockUser.userId,
  twoFactorEnabled: false,
  biometricEnabled: true,
  transactionPinSet: true,
  passwordLastChangedAt: '2025-04-10T08:00:00+06:00',
  requirePinForTrades: true,
}

const mockConsents: LegalConsent[] = [
  {
    id: 'lc_001',
    userId: mockUser.userId,
    type: 'terms',
    version: '2025.1',
    acceptedAt: '2025-01-15T08:35:00+06:00',
    required: true,
    documentUrl: null,
  },
  {
    id: 'lc_002',
    userId: mockUser.userId,
    type: 'privacy',
    version: '2025.1',
    acceptedAt: '2025-01-15T08:35:00+06:00',
    required: true,
    documentUrl: null,
  },
  {
    id: 'lc_003',
    userId: mockUser.userId,
    type: 'risk_disclosure',
    version: '2025.1',
    acceptedAt: '2025-01-18T17:00:00+06:00',
    required: true,
    documentUrl: null,
  },
  {
    id: 'lc_004',
    userId: mockUser.userId,
    type: 'data_usage',
    version: '2025.1',
    acceptedAt: '2025-01-15T08:35:00+06:00',
    required: true,
    documentUrl: null,
  },
  {
    id: 'lc_005',
    userId: mockUser.userId,
    type: 'brokerage_partner',
    version: '2025.1',
    acceptedAt: null,
    required: false,
    documentUrl: null,
  },
]

const mockCompliance: ComplianceStatus = {
  kyc: mockKyc,
  boAccount: {
    id: 'bo_001',
    userId: mockUser.userId,
    boId: null,
    status: 'pending',
    depositoryParticipant: 'Pending partner assignment',
    openedAt: null,
    cdblReference: null,
  },
  riskProfile: {
    id: 'rp_001',
    userId: mockUser.userId,
    status: 'moderate',
    assessedAt: '2025-01-19T12:00:00+06:00',
    expiresAt: '2026-01-19T12:00:00+06:00',
    questionnaireVersion: 'BD-SUIT-v1',
    score: 62,
  },
  tradingPermissions: {
    canViewMarket: true,
    canPlaceOrders: false,
    canWithdraw: false,
    restrictions: [
      'Live trading requires active BO account and licensed brokerage partnership.',
      'Order placement disabled in demo mode.',
    ],
  },
  taxTin: {
    provided: false,
    tinMasked: null,
    status: 'not_started',
  },
  regulatoryDisclosuresAcknowledged: true,
}

function formatProfileError(error: unknown): string {
  if (error && typeof error === 'object') {
    const record = error as { message?: string; details?: string; code?: string }
    return [record.message, record.details, record.code].filter(Boolean).join(' · ')
  }
  return 'Could not load profile from the database.'
}

function profileInitialsFromName(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

async function recoverMissingProfileRow(user: {
  id: string
  email?: string | null
  user_metadata?: Record<string, unknown>
}): Promise<UserProfile | null> {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const metaName = (user.user_metadata?.full_name as string | undefined)?.trim() ?? ''
  const metaPhone = (user.user_metadata?.phone as string | undefined)?.trim() ?? ''
  const fullName = metaName || 'Lenden User'

  const { error: insertError } = await supabase.from('profiles').insert({
    id: user.id,
    email: user.email ?? null,
    full_name: fullName,
    phone: metaPhone || null,
    profile_initial: profileInitialsFromName(fullName),
    lenden_id: `LDN-${user.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`,
  })

  if (insertError && insertError.code !== '23505') {
    if (import.meta.env.DEV) {
      console.debug('profile recovery insert failed', insertError.message)
    }
    return null
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error || !data) return null
  return mapProfileRowToUserProfile(data as ProfileRow)
}

async function fetchUserProfileFromSupabase(): Promise<ProfileServiceResult> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Supabase is not configured.', source: 'supabase' }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return { data: null, error: 'Supabase client unavailable.', source: 'supabase' }
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    return { data: null, error: formatProfileError(authError), source: 'supabase' }
  }

  if (!user) {
    return { data: null, error: 'Not signed in.', source: 'supabase' }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    return { data: null, error: formatProfileError(error), source: 'supabase' }
  }

  if (!data) {
    const recovered = await recoverMissingProfileRow(user)
    if (recovered) {
      return { data: recovered, error: null, source: 'recovered' }
    }
    return { data: null, error: 'Profile row missing and could not be recovered.', source: 'supabase' }
  }

  const profile = mapProfileRowToUserProfile(data as ProfileRow)
  const metaPhone = (user.user_metadata?.phone as string | undefined)?.trim()
  const metaName = (user.user_metadata?.full_name as string | undefined)?.trim()

  if (!profile.phone && metaPhone) {
    profile.phone = metaPhone
    void syncSignupProfileToDatabase({
      fullName: profile.fullName || metaName || '',
      phone: metaPhone,
      email: profile.email || user.email || '',
    })
  }

  return { data: profile, error: null, source: 'supabase' }
}

/** Writes signup form fields to profiles after auth account is created */
export async function syncSignupProfileToDatabase(input: {
  fullName: string
  phone: string
  email: string
}): Promise<void> {
  if (!isSupabaseConfigured()) return

  const supabase = getSupabaseClient()
  if (!supabase) return

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  const fullName = input.fullName.trim()
  const phone = input.phone.trim()

  await supabase
    .from('profiles')
    .update({
      full_name: fullName || undefined,
      phone: phone || null,
      email: input.email.trim() || user.email,
      profile_initial: fullName
        ? fullName
            .split(/\s+/)
            .map((part) => part[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
        : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
}

export async function getUserProfileResult(): Promise<ProfileServiceResult> {
  if (isDemoModeActive() || !isSupabaseConfigured()) {
    return { data: { ...mockUser }, error: null, source: 'mock' }
  }

  return fetchUserProfileFromSupabase()
}

export async function getUserProfile(): Promise<UserProfile> {
  const result = await getUserProfileResult()
  if (result.data) return result.data
  if (isDemoModeActive() || !isSupabaseConfigured()) {
    return delay({ ...mockUser })
  }
  throw new Error(result.error ?? 'Profile unavailable.')
}

export async function updateUserProfile(payload: UpdateUserProfilePayload): Promise<UserProfile> {
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .update(mapUserProfileToRowUpdate(payload))
          .eq('id', user.id)
          .select('*')
          .maybeSingle()

        if (!error && data) {
          return mapProfileRowToUserProfile(data as ProfileRow)
        }
      }
    }
  }

  Object.assign(mockUser, payload, { updatedAt: new Date().toISOString() })
  if (payload.fullName) {
    mockUser.profileInitial = payload.fullName
      .split(/\s+/)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }
  return delay({ ...mockUser })
}

export async function getKycStatus(): Promise<KycStatus> {
  return delay(structuredClone(mockKyc))
}

export async function getLinkedAccounts(): Promise<LinkedAccount[]> {
  return delay(structuredClone(mockLinkedAccounts))
}

export async function getSecuritySettings(): Promise<SecuritySettings> {
  return delay({ ...mockSecurity })
}

export async function getLegalConsents(): Promise<LegalConsent[]> {
  return delay(structuredClone(mockConsents))
}

export async function getComplianceStatus(): Promise<ComplianceStatus> {
  return delay(structuredClone(mockCompliance))
}

export { submitSupportTicket, getSupportTickets } from './supportApi'
