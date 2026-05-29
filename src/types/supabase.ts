/**
 * Supabase row types — snake_case matches Postgres columns.
 */

export interface ProfileRow {
  id: string
  full_name: string
  email: string | null
  phone: string | null
  profile_initial: string | null
  kyc_status: string
  bo_account_status: string
  linked_wallet: string | null
  linked_bank: string | null
  nid_verification_status: string
  risk_profile_status: string
  lenden_id: string | null
  buying_power_available: number
  buying_power_reserved: number
  created_at: string
  updated_at: string
}

export interface TransactionRowDb {
  id: string
  user_id: string
  type: string
  stock_id: string | null
  ticker: string | null
  shares: number | null
  amount: number
  status: string
  note: string | null
  mock_order_id: string | null
  realized_gain_loss: number | null
  created_at: string
}

export interface SubmitMockBuyRpcResult {
  orderId: string
  buyingPowerAfter: number
  filledShares: number
  executionPrice: number
}

export interface SubmitMockSellRpcResult {
  orderId: string
  buyingPowerAfter: number
  filledShares: number
  executionPrice: number
  grossProceeds: number
  feeBdt: number
  netProceeds: number
  costBasis: number
  realizedGainLoss: number
}

export interface SubmitMockBuyRpcArgs {
  p_stock_id: string
  p_symbol: string
  p_side: string
  p_amount_bdt: number
  p_fee_bdt: number
  p_filled_shares: number
  p_execution_price: number
  p_ticker: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Partial<ProfileRow> & { id: string }
        Update: Partial<Omit<ProfileRow, 'id'>>
        Relationships: []
      }
      transactions: {
        Row: TransactionRowDb
        Insert: Partial<TransactionRowDb>
        Update: Partial<TransactionRowDb>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      submit_mock_buy: {
        Args: SubmitMockBuyRpcArgs
        Returns: SubmitMockBuyRpcResult
      }
      submit_mock_sell: {
        Args: {
          p_stock_id: string
          p_symbol: string
          p_ticker: string
          p_shares: number
          p_execution_price: number
          p_fee_bdt: number
        }
        Returns: SubmitMockSellRpcResult
      }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
