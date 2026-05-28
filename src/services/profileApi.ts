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
  SubmitSupportTicketPayload,
  SupportTicket,
  UpdateUserProfilePayload,
  UserProfile,
} from '../types/profile'

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

let supportTickets: SupportTicket[] = []

export async function getUserProfile(): Promise<UserProfile> {
  return delay({ ...mockUser })
}

export async function updateUserProfile(payload: UpdateUserProfilePayload): Promise<UserProfile> {
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

export async function submitSupportTicket(
  payload: SubmitSupportTicketPayload,
): Promise<SupportTicket> {
  const ticket: SupportTicket = {
    id: `tkt_${Date.now()}`,
    userId: mockUser.userId,
    category: payload.category,
    subject: payload.subject,
    description: payload.description,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  supportTickets = [ticket, ...supportTickets]
  return delay(ticket)
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  // return fetch('/api/support/tickets').then(...)
  return delay([...supportTickets])
}

/** Demo helper — reset tickets between sessions if needed */
export function __resetMockSupportTickets() {
  supportTickets = []
}
