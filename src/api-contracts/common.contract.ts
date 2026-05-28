/**
 * Shared API contract types for future Lenden backend integration.
 * These are NOT live integrations — documentation for service swap.
 */

export interface ApiResponse<T> {
  success: boolean
  data: T
  meta?: PaginationMeta
  requestId?: string
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string>
  retryable?: boolean
}

export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNextPage: boolean
}

export interface AuthSession {
  sessionId: string
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: string
  deviceId: string
  issuedAt: string
}
