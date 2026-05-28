/**
 * Future auth API contracts — not live.
 */

import type { ApiResponse } from './common.contract'

export interface LoginRequest {
  email: string
  password: string
  deviceId?: string
}

export interface LoginResponse {
  userId: string
  sessionId: string
  expiresAt: string
}

export type LoginApiResponse = ApiResponse<LoginResponse>
