import type {
  BoAccountStatus,
  RiskProfileStatus,
  UserProfile,
  VerificationStatus,
} from '../types/profile'
import type { ProfileRow } from '../types/supabase'

function asVerificationStatus(value: string): VerificationStatus {
  const allowed: VerificationStatus[] = [
    'not_started',
    'pending',
    'verified',
    'rejected',
    'expired',
  ]
  return allowed.includes(value as VerificationStatus)
    ? (value as VerificationStatus)
    : 'not_started'
}

function asBoStatus(value: string): BoAccountStatus {
  const allowed: BoAccountStatus[] = [
    'not_opened',
    'pending',
    'active',
    'suspended',
    'closed',
  ]
  return allowed.includes(value as BoAccountStatus) ? (value as BoAccountStatus) : 'not_opened'
}

function asRiskStatus(value: string): RiskProfileStatus {
  const allowed: RiskProfileStatus[] = [
    'not_assessed',
    'conservative',
    'moderate',
    'aggressive',
    'expired',
  ]
  return allowed.includes(value as RiskProfileStatus)
    ? (value as RiskProfileStatus)
    : 'not_assessed'
}

function initialsFromName(fullName: string): string {
  return fullName
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function mapProfileRowToUserProfile(row: ProfileRow): UserProfile {
  const fullName = row.full_name?.trim() || 'Lenden User'

  return {
    userId: row.id,
    fullName,
    email: row.email ?? '',
    phone: row.phone ?? '',
    profileInitial: row.profile_initial?.trim() || initialsFromName(fullName),
    kycStatus: asVerificationStatus(row.kyc_status),
    boAccountStatus: asBoStatus(row.bo_account_status),
    linkedWallet: row.linked_wallet,
    linkedBank: row.linked_bank,
    nidVerificationStatus: asVerificationStatus(row.nid_verification_status),
    riskProfileStatus: asRiskStatus(row.risk_profile_status),
    lendenId: row.lenden_id ?? `LDN-${row.id.slice(0, 8).toUpperCase()}`,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function mapUserProfileToRowUpdate(
  payload: Partial<UserProfile>,
): Partial<ProfileRow> {
  const update: Partial<ProfileRow> = { updated_at: new Date().toISOString() }

  if (payload.fullName !== undefined) {
    update.full_name = payload.fullName
    update.profile_initial = initialsFromName(payload.fullName)
  }
  if (payload.email !== undefined) update.email = payload.email
  if (payload.phone !== undefined) update.phone = payload.phone

  return update
}
