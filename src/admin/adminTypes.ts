/**
 * Internal admin concept — NOT exposed in main app navigation.
 * Developer-only operational planning surface for future back-office tooling.
 */

export type AdminReviewStatus = 'pending' | 'in_review' | 'resolved'

export interface AdminKycReview {
  id: string
  userId: string
  fullName: string
  status: AdminReviewStatus
  submittedAt: string
}

export interface AdminSupportTicket {
  id: string
  subject: string
  category: string
  status: AdminReviewStatus
  createdAt: string
}

export interface AdminFlaggedAccount {
  id: string
  userId: string
  reason: string
  severity: 'low' | 'medium' | 'high'
}

export interface AdminMockOrder {
  orderId: string
  symbol: string
  amountBdt: number
  status: string
  createdAt: string
}

export interface AdminLinkedAccountReview {
  id: string
  provider: string
  accountMask: string
  status: AdminReviewStatus
}

export interface AdminDashboardMetrics {
  pendingKyc: number
  openTickets: number
  flaggedAccounts: number
  mockOrdersToday: number
  auditEventsToday: number
  linkedAccountReviews: number
}
