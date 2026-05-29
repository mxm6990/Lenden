/**
 * Supabase `profiles` table row — snake_case matches Postgres columns.
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
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'> & {
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Omit<ProfileRow, 'id'>>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
