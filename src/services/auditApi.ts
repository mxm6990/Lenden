/**
 * Audit API — append-only trail. Supabase when authenticated, in-memory fallback.
 * Production should log sensitive actions server-side (Edge Functions / backend).
 */

import { MOCK_AUDIT_LOGS } from '../data/mockAuditLogs'
import { isDemoModeActive } from '../lib/demoMode'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import type { AuditLog, CreateAuditLogInput } from '../types/audit'

const MOCK_DELAY_MS = 60
/** Collapse duplicate client logs from Strict Mode / concurrent calls within this window. */
const CLIENT_AUDIT_DEDUPE_MS = 2000

let auditStore = [...MOCK_AUDIT_LOGS]

type ClientAuditDedupeSlot = {
  expiresAt: number
  entry?: AuditLog
  inFlight?: Promise<AuditLog>
}

/** Module-level dedupe: actorId + action + targetId + stable metadata JSON. */
const recentClientAuditEntries = new Map<string, ClientAuditDedupeSlot>()

interface AuditLogRow {
  id: string
  user_id: string
  action: AuditLog['action']
  target_id: string | null
  metadata: Record<string, string | number | boolean | null>
  ip_address: string | null
  device_id: string | null
  created_at: string
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

function stableMetadataKey(metadata: CreateAuditLogInput['metadata']): string {
  if (!metadata || Object.keys(metadata).length === 0) return '{}'
  const sorted = Object.keys(metadata)
    .sort()
    .reduce<Record<string, string | number | boolean | null>>((acc, key) => {
      acc[key] = metadata[key] ?? null
      return acc
    }, {})
  return JSON.stringify(sorted)
}

function buildClientAuditDedupeKey(input: CreateAuditLogInput): string {
  return [
    input.actorId,
    input.action,
    input.targetId ?? '',
    stableMetadataKey(input.metadata),
  ].join('|')
}

function pruneExpiredClientAuditDedupeEntries(now = Date.now()) {
  for (const [key, cached] of recentClientAuditEntries) {
    if (now >= cached.expiresAt) {
      recentClientAuditEntries.delete(key)
    }
  }
}

function logSkippedDuplicateAuditEvent(input: CreateAuditLogInput) {
  if (import.meta.env.DEV) {
    console.debug('Skipped duplicate audit event', {
      action: input.action,
      actorId: input.actorId,
      targetId: input.targetId ?? null,
    })
  }
}

function resolveClientAuditDuplicate(
  dedupeKey: string,
  input: CreateAuditLogInput,
  now = Date.now(),
): AuditLog | Promise<AuditLog> | null {
  pruneExpiredClientAuditDedupeEntries(now)
  const cached = recentClientAuditEntries.get(dedupeKey)
  if (!cached || now >= cached.expiresAt) return null

  logSkippedDuplicateAuditEvent(input)
  if (cached.entry) return cached.entry
  if (cached.inFlight) return cached.inFlight
  return null
}

function rememberClientAuditEntry(dedupeKey: string, entry: AuditLog) {
  recentClientAuditEntries.set(dedupeKey, {
    entry,
    expiresAt: Date.now() + CLIENT_AUDIT_DEDUPE_MS,
  })
}

function reserveClientAuditInFlight(dedupeKey: string, inFlight: Promise<AuditLog>) {
  recentClientAuditEntries.set(dedupeKey, {
    inFlight,
    expiresAt: Date.now() + CLIENT_AUDIT_DEDUPE_MS,
  })
}

function buildLocalEntry(input: CreateAuditLogInput): AuditLog {
  return {
    id: `aud_${Date.now()}`,
    action: input.action,
    actorId: input.actorId,
    targetId: input.targetId ?? null,
    timestamp: new Date().toISOString(),
    ipAddress: '203.***.***.42',
    deviceId: 'dev_iphone_001',
    metadata: { prototype: true, ...input.metadata },
  }
}

function mapAuditRow(row: AuditLogRow): AuditLog {
  return {
    id: row.id,
    action: row.action,
    actorId: row.user_id,
    targetId: row.target_id,
    timestamp: row.created_at,
    ipAddress: row.ip_address ?? 'unknown',
    deviceId: row.device_id ?? 'unknown',
    metadata: row.metadata ?? {},
  }
}

async function insertAuditLogUncached(input: CreateAuditLogInput): Promise<AuditLog> {
  const localEntry = buildLocalEntry(input)

  // Append-only from client — production requires server-side logging.
  if (!isDemoModeActive() && isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: input.actorId,
          action: input.action,
          target_id: input.targetId ?? null,
          metadata: { prototype: true, clientSide: true, ...input.metadata },
          ip_address: localEntry.ipAddress,
          device_id: localEntry.deviceId,
        })
        .select('*')
        .single()

      if (!error && data) {
        return mapAuditRow(data as AuditLogRow)
      }
    }
  }

  auditStore = [localEntry, ...auditStore]
  return delay(localEntry)
}

export async function getAuditLogs(limit = 50): Promise<AuditLog[]> {
  if (!isDemoModeActive() && isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (!error && data) {
        return (data as AuditLogRow[]).map(mapAuditRow)
      }
    }
  }

  return delay(auditStore.slice(0, limit))
}

export async function appendAuditLog(input: CreateAuditLogInput): Promise<AuditLog> {
  const dedupeKey = buildClientAuditDedupeKey(input)
  const now = Date.now()
  const duplicate = resolveClientAuditDuplicate(dedupeKey, input, now)
  if (duplicate) {
    return duplicate instanceof Promise ? duplicate : Promise.resolve(duplicate)
  }

  const inFlight = insertAuditLogUncached(input)
    .then((entry) => {
      rememberClientAuditEntry(dedupeKey, entry)
      return entry
    })
    .catch((error) => {
      recentClientAuditEntries.delete(dedupeKey)
      throw error
    })

  reserveClientAuditInFlight(dedupeKey, inFlight)
  return inFlight
}

export async function getAuditLogsByAction(action: AuditLog['action']): Promise<AuditLog[]> {
  const logs = await getAuditLogs(200)
  return logs.filter((log) => log.action === action)
}

/** Test helper — reset dedupe cache between runs */
export function __resetClientAuditDedupeCache() {
  recentClientAuditEntries.clear()
}
