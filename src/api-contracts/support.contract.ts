/**
 * Future support API contracts — not live.
 */

import type { ApiResponse } from './common.contract'
import type { SupportTicket, SupportTicketCategory } from '../types/profile'

export interface SupportTicketRequest {
  category: SupportTicketCategory
  subject: string
  description: string
  attachmentIds?: string[]
}

export type SupportTicketResponse = ApiResponse<SupportTicket>
