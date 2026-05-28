/**
 * Future compliance API contracts — not live.
 */

import type { ApiResponse } from './common.contract'
import type { ComplianceStatus } from '../types/profile'

export type ComplianceStatusResponse = ApiResponse<ComplianceStatus>
