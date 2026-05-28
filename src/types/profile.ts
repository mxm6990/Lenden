/**
 * Compliance-ready foundation for Lenden profile data.
 *
 * NOT legal advice. Final implementation must be reviewed by Bangladeshi
 * legal/compliance experts before production use.
 *
 * Design considerations (BD):
 * - BSEC brokerage compliance
 * - CDBL BO account requirements
 * - KYC / AML requirements
 * - Bangladesh Cyber Security Act 2023
 * - Data privacy and consent requirements
 * - Secure storage of NID and financial data
 * - Audit logs for sensitive actions
 */

export type VerificationStatus =
  | 'not_started'
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'expired'

export type BoAccountStatus =
  | 'not_opened'
  | 'pending'
  | 'active'
  | 'suspended'
  | 'closed'

export type RiskProfileStatus =
  | 'not_assessed'
  | 'conservative'
  | 'moderate'
  | 'aggressive'
  | 'expired'

export type WalletProvider = 'bkash' | 'nagad' | 'rocket' | 'other'

export type LinkedAccountType = 'mobile_wallet' | 'bank' | 'card'

export type ConsentType =
  | 'terms'
  | 'privacy'
  | 'risk_disclosure'
  | 'brokerage_partner'
  | 'data_usage'
  | 'marketing'

export type SupportTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export type SupportTicketCategory =
  | 'general'
  | 'account'
  | 'transaction'
  | 'dispute'
  | 'recovery'
  | 'technical'

export type ProfileRoute =
  | 'kyc-details'
  | 'linked-accounts'
  | 'security-settings'
  | 'legal-documents'
  | 'help-center'
  | 'risk-disclosure'
  | 'support-ticket'

/** users — core identity record */
export interface UserProfile {
  userId: string
  fullName: string
  email: string
  phone: string
  profileInitial: string
  kycStatus: VerificationStatus
  boAccountStatus: BoAccountStatus
  linkedWallet: string | null
  linkedBank: string | null
  nidVerificationStatus: VerificationStatus
  riskProfileStatus: RiskProfileStatus
  lendenId: string
  createdAt: string
  updatedAt: string
}

/** kyc_records — identity verification workflow */
export interface KycRecord {
  id: string
  userId: string
  status: VerificationStatus
  nidNumberMasked: string | null
  submittedAt: string | null
  verifiedAt: string | null
  reviewerNotes: string | null
  amlScreeningStatus: VerificationStatus
  documentExpiry: string | null
}

export interface KycStatus {
  record: KycRecord
  summaryLabel: string
  nextStep: string | null
}

/** linked_accounts — wallets and bank accounts */
export interface LinkedAccount {
  id: string
  userId: string
  type: LinkedAccountType
  provider: string
  providerKey: WalletProvider | 'bank' | 'other'
  accountMask: string
  isPrimary: boolean
  verifiedAt: string | null
  status: VerificationStatus
}

/** bo_accounts — CDBL beneficiary owner account */
export interface BoAccount {
  id: string
  userId: string
  boId: string | null
  status: BoAccountStatus
  depositoryParticipant: string | null
  openedAt: string | null
  cdblReference: string | null
}

/** security_settings — auth and device controls */
export interface SecuritySettings {
  userId: string
  twoFactorEnabled: boolean
  biometricEnabled: boolean
  transactionPinSet: boolean
  passwordLastChangedAt: string | null
  requirePinForTrades: boolean
}

/** device_sessions — active device registry */
export interface DeviceSession {
  id: string
  userId: string
  deviceName: string
  platform: string
  lastActiveAt: string
  ipAddressMasked: string
  isCurrent: boolean
}

/** login_history — audit trail for sign-ins */
export interface LoginHistoryEntry {
  id: string
  userId: string
  timestamp: string
  deviceName: string
  location: string
  success: boolean
  ipAddressMasked: string
}

/** risk_profiles — suitability assessment */
export interface RiskProfile {
  id: string
  userId: string
  status: RiskProfileStatus
  assessedAt: string | null
  expiresAt: string | null
  questionnaireVersion: string
  score: number | null
}

/** legal_consents — consent registry with versioning */
export interface LegalConsent {
  id: string
  userId: string
  type: ConsentType
  version: string
  acceptedAt: string | null
  required: boolean
  documentUrl: string | null
}

/** support_tickets — customer support cases */
export interface SupportTicket {
  id: string
  userId: string
  category: SupportTicketCategory
  subject: string
  description: string
  status: SupportTicketStatus
  createdAt: string
  updatedAt: string
}

/** Aggregated compliance snapshot for profile UI */
export interface ComplianceStatus {
  kyc: KycStatus
  boAccount: BoAccount
  riskProfile: RiskProfile
  tradingPermissions: {
    canViewMarket: boolean
    canPlaceOrders: boolean
    canWithdraw: boolean
    restrictions: string[]
  }
  taxTin: {
    provided: boolean
    tinMasked: string | null
    status: VerificationStatus
  }
  regulatoryDisclosuresAcknowledged: boolean
}

export interface UpdateUserProfilePayload {
  fullName?: string
  email?: string
  phone?: string
}

export interface SubmitSupportTicketPayload {
  category: SupportTicketCategory
  subject: string
  description: string
}
