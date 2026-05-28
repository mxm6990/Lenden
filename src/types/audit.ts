/**
 * Audit logging types — critical for regulated fintech operations.
 * Audit logging is critical for regulated fintech operations.
 */

export type AuditAction =
  | 'LOGIN'
  | 'LOGOUT'
  | 'KYC_VIEWED'
  | 'PROFILE_UPDATED'
  | 'ORDER_PREVIEWED'
  | 'MOCK_ORDER_SUBMITTED'
  | 'LEGAL_DOCUMENT_VIEWED'
  | 'SUPPORT_TICKET_CREATED'
  | 'DEVICE_REMOVED'

export interface AuditLog {
  id: string
  action: AuditAction
  actorId: string
  targetId: string | null
  timestamp: string
  ipAddress: string
  deviceId: string
  metadata: Record<string, string | number | boolean | null>
}

export interface CreateAuditLogInput {
  action: AuditAction
  actorId: string
  targetId?: string | null
  metadata?: Record<string, string | number | boolean | null>
}
