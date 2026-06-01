/**
 * Supabase Auth service — email/password for prototype.
 * Falls back gracefully when Supabase env vars are missing.
 */

import { appendAuditLog } from './auditApi'
import { syncSignupProfileToDatabase } from './profileApi'
import { isEmailConfirmationRequired } from '../lib/authConfig'
import { getAuthCallbackUrl } from '../lib/authRedirect'
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
      emailRedirectTo: getAuthCallbackUrl(),
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

  const needsEmailConfirmation =
    isEmailConfirmationRequired() && !data.session && Boolean(data.user)

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

const AUTH_CALLBACK_ERROR_KEY = 'lenden_auth_error'

export function storeAuthCallbackError(message: string): void {
  sessionStorage.setItem(AUTH_CALLBACK_ERROR_KEY, message)
}

export function consumeAuthCallbackError(): string | null {
  const message = sessionStorage.getItem(AUTH_CALLBACK_ERROR_KEY)
  if (message) sessionStorage.removeItem(AUTH_CALLBACK_ERROR_KEY)
  return message
}

/** Exchange Supabase email-confirmation redirect (PKCE code or hash session) for a session. */
export async function completeAuthCallbackFromUrl(): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      user: null,
      needsEmailConfirmation: false,
      errorCode: 'not_configured',
      message: 'Supabase is not configured.',
    }
  }

  const supabase = getSupabaseClient()
  if (!supabase) {
    return {
      ok: false,
      user: null,
      needsEmailConfirmation: false,
      errorCode: 'not_configured',
      message: 'Supabase is not configured.',
    }
  }

  const url = new URL(window.location.href)
  const authError =
    url.searchParams.get('error_description') ??
    url.searchParams.get('error') ??
    url.hash.match(/error_description=([^&]+)/)?.[1]

  if (authError) {
    return {
      ok: false,
      user: null,
      needsEmailConfirmation: false,
      errorCode: 'unknown',
      message: decodeURIComponent(authError.replace(/\+/g, ' ')),
    }
  }

  const code = url.searchParams.get('code')
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) {
      return {
        ok: false,
        user: null,
        needsEmailConfirmation: false,
        errorCode: mapAuthError(error.message),
        message: error.message,
      }
    }

    if (data.session?.user) {
      await syncSignupProfileToDatabase({
        fullName: String(data.session.user.user_metadata?.full_name ?? ''),
        phone: String(data.session.user.user_metadata?.phone ?? ''),
        email: data.session.user.email ?? '',
      })
      await appendAuditLog({
        action: 'LOGIN',
        actorId: data.session.user.id,
        metadata: { method: 'email_confirmation' },
      })
      return { ok: true, user: data.session.user, needsEmailConfirmation: false }
    }
  }

  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
  if (sessionError) {
    return {
      ok: false,
      user: null,
      needsEmailConfirmation: false,
      errorCode: mapAuthError(sessionError.message),
      message: sessionError.message,
    }
  }

  if (sessionData.session?.user) {
    await syncSignupProfileToDatabase({
      fullName: String(sessionData.session.user.user_metadata?.full_name ?? ''),
      phone: String(sessionData.session.user.user_metadata?.phone ?? ''),
      email: sessionData.session.user.email ?? '',
    })
    await appendAuditLog({
      action: 'LOGIN',
      actorId: sessionData.session.user.id,
      metadata: { method: 'email_confirmation' },
    })
    return { ok: true, user: sessionData.session.user, needsEmailConfirmation: false }
  }

  return {
    ok: false,
    user: null,
    needsEmailConfirmation: false,
    errorCode: 'unknown',
    message: 'Email confirmation link is invalid or expired. Request a new link and try again.',
  }
}
