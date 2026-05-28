import type {
  AdminDashboardMetrics,
  AdminFlaggedAccount,
  AdminKycReview,
  AdminLinkedAccountReview,
  AdminMockOrder,
  AdminSupportTicket,
} from './adminTypes'

export const MOCK_ADMIN_METRICS: AdminDashboardMetrics = {
  pendingKyc: 3,
  openTickets: 5,
  flaggedAccounts: 1,
  mockOrdersToday: 12,
  auditEventsToday: 48,
  linkedAccountReviews: 2,
}

export const MOCK_PENDING_KYC: AdminKycReview[] = [
  {
    id: 'kyc_rev_001',
    userId: 'usr_demo_002',
    fullName: 'Ayesha Rahman',
    status: 'pending',
    submittedAt: '2025-05-26T14:00:00+06:00',
  },
  {
    id: 'kyc_rev_002',
    userId: 'usr_demo_003',
    fullName: 'Karim Hassan',
    status: 'in_review',
    submittedAt: '2025-05-25T09:30:00+06:00',
  },
]

export const MOCK_ADMIN_TICKETS: AdminSupportTicket[] = [
  {
    id: 'tkt_admin_001',
    subject: 'BO account status inquiry',
    category: 'account',
    status: 'pending',
    createdAt: '2025-05-27T08:00:00+06:00',
  },
]

export const MOCK_FLAGGED: AdminFlaggedAccount[] = [
  {
    id: 'flag_001',
    userId: 'usr_demo_004',
    reason: 'Multiple failed login attempts',
    severity: 'medium',
  },
]

export const MOCK_ADMIN_ORDERS: AdminMockOrder[] = [
  {
    orderId: 'ord_mock_001',
    symbol: 'GP',
    amountBdt: 500,
    status: 'accepted',
    createdAt: '2025-05-27T10:15:00+06:00',
  },
]

export const MOCK_LINKED_REVIEWS: AdminLinkedAccountReview[] = [
  {
    id: 'la_rev_001',
    provider: 'Nagad',
    accountMask: '··· 9012',
    status: 'pending',
  },
]
