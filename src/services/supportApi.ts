/**
 * Support tickets — Supabase when authenticated, in-memory fallback for demo.
 */

import { isDemoModeActive } from '../lib/demoMode'
import { getAuthenticatedContext } from '../lib/supabaseAuth'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import type { SubmitSupportTicketPayload, SupportTicket } from '../types/profile'
import { appendAuditLog } from './auditApi'

const MOCK_DELAY_MS = 80
const DEMO_USER_ID = 'usr_demo_001'

let mockTickets: SupportTicket[] = []

interface SupportTicketRow {
  id: string
  user_id: string
  category: SupportTicket['category']
  subject: string
  description: string
  status: SupportTicket['status']
  created_at: string
  updated_at: string
}

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_DELAY_MS))
}

function mapSupportTicketRow(row: SupportTicketRow): SupportTicket {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    subject: row.subject,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function submitSupportTicket(
  payload: SubmitSupportTicketPayload,
): Promise<SupportTicket> {
  const ctx = await getAuthenticatedContext()

  if (ctx && !isDemoModeActive() && isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: ctx.userId,
          category: payload.category,
          subject: payload.subject,
          description: payload.description,
          status: 'open',
        })
        .select('*')
        .single()

      if (!error && data) {
        const ticket = mapSupportTicketRow(data as SupportTicketRow)
        await appendAuditLog({
          action: 'SUPPORT_TICKET_CREATED',
          actorId: ctx.userId,
          targetId: ticket.id,
          metadata: { category: payload.category },
        })
        return ticket
      }
    }
  }

  const ticket: SupportTicket = {
    id: `tkt_${Date.now()}`,
    userId: ctx?.userId ?? DEMO_USER_ID,
    category: payload.category,
    subject: payload.subject,
    description: payload.description,
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  mockTickets = [ticket, ...mockTickets]

  await appendAuditLog({
    action: 'SUPPORT_TICKET_CREATED',
    actorId: ticket.userId,
    targetId: ticket.id,
    metadata: { category: payload.category, mock: true },
  })

  return delay(ticket)
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  const ctx = await getAuthenticatedContext()

  if (ctx && !isDemoModeActive() && isSupabaseConfigured()) {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', ctx.userId)
        .order('created_at', { ascending: false })

      if (!error && data) {
        return (data as SupportTicketRow[]).map(mapSupportTicketRow)
      }
    }
  }

  return delay([...mockTickets])
}

export function __resetMockSupportTickets() {
  mockTickets = []
}
