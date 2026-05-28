/**
 * User position types — aligned with future `GET /api/portfolio/positions/:symbol`.
 * Positions are derived from ledger / transaction history on the backend.
 */

export interface PositionReturn {
  amount: number
  pct: number
}

export interface UserPosition {
  userId: string
  stockId: string
  symbol: string
  asOf: string
  sharesOwned: number
  averageCost: number
  marketValue: number
  portfolioWeightPct: number
  totalReturn: PositionReturn
  todayReturn: PositionReturn
}

/** Expected API envelope */
export interface UserPositionApiResponse {
  userId: string
  asOf: string
  position: Omit<UserPosition, 'userId' | 'asOf'> | null
}
