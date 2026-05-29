import type { UserProfile } from './profile'

export interface ProfileServiceResult {
  data: UserProfile | null
  error: string | null
  source: 'supabase' | 'mock' | 'recovered'
}
