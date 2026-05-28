/**
 * Mock audit API — append-only audit trail foundation.
 * Audit logging is critical for regulated fintech operations.
 */

import { MOCK_AUDIT_LOGS } from '../data/mockAuditLogs'
import type { AuditLog, CreateAuditLogInput } from '../types/audit'

const MOCK_DELAY_MS = 60
let auditStore = [...MOCK_AUDIT_LOGS]

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

export async function getAuditLogs(limit = 50): Promise<AuditLog[]> {
  // return fetch('/api/admin/audit-logs').then(...)
  return delay(auditStore.slice(0, limit))
}

export async function appendAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
  const entry: AuditLog = {
    id: `aud_${Date.now()}`,
    action: input.action,
    actorId: input.actorId,
    targetId: input.targetId ?? null,
    timestamp: new Date().toISOString(),
    ipAddress: '203.***.***.42',
    deviceId: 'dev_iphone_001',
    metadata: { prototype: true, ...input.metadata },
  }
  auditStore = [entry, ...auditStore]
  return delay(entry)
}

export async function getAuditLogsByAction(action: AuditLog['action']): Promise<AuditLog[]> {
  return delay(auditStore.filter((log) => log.action === action))
}
