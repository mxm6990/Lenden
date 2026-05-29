/**
 * Supabase Auth service — email/password for prototype.
 * Falls back gracefully when Supabase env vars are missing.
 */

import { appendAuditLog } from './auditApi'
import { syncSignupProfileToDatabase } from './profileApi'
import { getSupabaseClient, isSupabaseConfigured } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export interface AuthCredentials {
  email: string
  password: string
}

export interface SignUpInput extends AuthCredentials {
  fullName: string
  phone: string
}

export type AuthErrorCode =
  | 'not_configured'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_exists'
  | 'weak_password'
  | 'network_error'
  | 'unknown'

export interface AuthResult {
  ok: boolean
  user: User | null
  needsEmailConfirmation: boolean
  errorCode?: AuthErrorCode
  message?: string
}

function mapAuthError(message: string): AuthErrorCode {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) return 'invalid_credentials'
  if (lower.includes('email not confirmed')) return 'email_not_confirmed'
  if (lower.includes('already registered') || lower.includes('already exists')) {
    return 'user_exists'
  }
  if (lower.includes('password')) return 'weak_password'
  return 'unknown'
}

export function isAuthAvailable(): boolean {
  return isSupabaseConfigured()
}

export async function getAuthSession() {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function signUpWithEmail(input: SignUpInput): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, user: null, needsEmailConfirmation: false, errorCode: 'not_configured' }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return { ok: false, user: null, needsEmailConfirmation: false, errorCode: 'not_configured' }
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email.trim(),
    password: input.password,
    options: {
      data: {
        full_name: input.fullName.trim(),
        phone: input.phone.trim(),
      },
    },
  })

  if (error) {
    return {
      ok: false,
      user: null,
      needsEmailConfirmation: false,
      errorCode: mapAuthError(error.message),
      message: error.message,
    }
  }

  const needsEmailConfirmation = !data.session && Boolean(data.user)

  if (data.user && data.session) {
    await syncSignupProfileToDatabase({
      fullName: input.fullName,
      phone: input.phone,
      email: input.email,
    })
    await appendAuditLog({
      action: 'LOGIN',
      actorId: data.user.id,
      metadata: { method: 'signup' },
    })
  }

  return {
    ok: Boolean(data.user),
    user: data.user,
    needsEmailConfirmation,
    message: needsEmailConfirmation
      ? 'Check your email to confirm your account, then sign in.'
      : undefined,
  }
}

export async function signInWithEmail(input: AuthCredentials): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { ok: false, user: null, needsEmailConfirmation: false, errorCode: 'not_configured' }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return { ok: false, user: null, needsEmailConfirmation: false, errorCode: 'not_configured' }
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email.trim(),
    password: input.password,
  })

  if (error) {
    return {
      ok: false,
      user: null,
      needsEmailConfirmation: false,
      errorCode: mapAuthError(error.message),
      message: error.message,
    }
  }

  if (data.user) {
    await appendAuditLog({
      action: 'LOGIN',
      actorId: data.user.id,
      metadata: { method: 'password' },
    })
  }

  return { ok: true, user: data.user, needsEmailConfirmation: false }
}

export async function signOutFromSupabase(): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const userId = (await supabase.auth.getUser()).data.user?.id
  await supabase.auth.signOut()

  if (userId) {
    await appendAuditLog({ action: 'LOGOUT', actorId: userId })
  }
}

export function subscribeToAuthChanges(
  onSession: (signedIn: boolean) => void,
): () => void {
  const supabase = getSupabaseClient()
  if (!supabase) return () => {}

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    onSession(Boolean(session))
  })

  return () => subscription.unsubscribe()
}
