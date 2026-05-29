import { getSupabaseClient, isSupabaseConfigured } from './supabase'

export interface AuthenticatedContext {
  userId: string
  email: string | null
}

/** Returns authenticated user when Supabase session exists. */
export async function getAuthenticatedContext(): Promise<AuthenticatedContext | null> {
  if (!isSupabaseConfigured()) return null

  const supabase = getSupabaseClient()
  if (!supabase) return null

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  return { userId: user.id, email: user.email ?? null }
}

export async function getAuthenticatedUserId(): Promise<string | null> {
  const ctx = await getAuthenticatedContext()
  return ctx?.userId ?? null
}
