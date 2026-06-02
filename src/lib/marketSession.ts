import { isDemoModeActive } from './demoMode'
import { getAuthenticatedContext } from './supabaseAuth'
import { isSupabaseConfigured } from './supabase'

export async function shouldUseSupabase(): Promise<boolean> {
  if (isDemoModeActive() || !isSupabaseConfigured()) return false
  const ctx = await getAuthenticatedContext()
  return Boolean(ctx)
}

export function isDemoMode(): boolean {
  return isDemoModeActive()
}
