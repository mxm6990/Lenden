/**
 * Future profile / KYC API contracts — not live.
 */

import type { ApiResponse } from './common.contract'
import type { KycStatus, LinkedAccount, UserProfile } from '../types/profile'

export type UserProfileResponse = ApiResponse<UserProfile>
export type KycStatusResponse = ApiResponse<KycStatus>
export type LinkedAccountsResponse = ApiResponse<LinkedAccount[]>
