/**
 * Mock audit logs — replace with append-only audit store in production.
 * Audit logging is critical for regulated fintech operations.
 */

import type { AuditLog } from '../types/audit'

export const MOCK_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'aud_001',
    action: 'LOGIN',
    actorId: 'usr_mahathir_001',
    targetId: null,
    timestamp: '2025-05-27T08:12:00+06:00',
    ipAddress: '203.***.***.42',
    deviceId: 'dev_iphone_001',
    metadata: { method: 'demo', prototype: true },
  },
  {
    id: 'aud_002',
    action: 'KYC_VIEWED',
    actorId: 'usr_mahathir_001',
    targetId: 'kyc_001',
    timestamp: '2025-05-27T08:15:00+06:00',
    ipAddress: '203.***.***.42',
    deviceId: 'dev_iphone_001',
    metadata: { screen: 'kyc-details' },
  },
  {
    id: 'aud_003',
    action: 'ORDER_PREVIEWED',
    actorId: 'usr_mahathir_001',
    targetId: 'gp',
    timestamp: '2025-05-26T11:30:00+06:00',
    ipAddress: '203.***.***.42',
    deviceId: 'dev_iphone_001',
    metadata: { amountBdt: 500, mock: true },
  },
  {
    id: 'aud_004',
    action: 'MOCK_ORDER_SUBMITTED',
    actorId: 'usr_mahathir_001',
    targetId: 'ord_mock_001',
    timestamp: '2025-05-26T11:31:00+06:00',
    ipAddress: '203.***.***.42',
    deviceId: 'dev_iphone_001',
    metadata: { status: 'accepted', prototype: true },
  },
  {
    id: 'aud_005',
    action: 'LEGAL_DOCUMENT_VIEWED',
    actorId: 'usr_mahathir_001',
    targetId: 'terms',
    timestamp: '2025-05-25T09:00:00+06:00',
    ipAddress: '203.***.***.42',
    deviceId: 'dev_iphone_001',
    metadata: { version: '2025.1' },
  },
]
