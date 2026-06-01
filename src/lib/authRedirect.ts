export const AUTH_CALLBACK_PATH = '/auth/callback'

/** Supabase email confirmation redirect — always derived from runtime origin on web. */
export function getAuthCallbackUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}${AUTH_CALLBACK_PATH}`
  }

  const siteUrl = import.meta.env.VITE_SITE_URL?.trim()
  if (siteUrl) {
    return `${siteUrl.replace(/\/$/, '')}${AUTH_CALLBACK_PATH}`
  }

  return AUTH_CALLBACK_PATH
}

export function isAuthCallbackPath(pathname = window.location.pathname): boolean {
  const normalized = pathname.replace(/\/$/, '') || '/'
  return normalized === AUTH_CALLBACK_PATH || normalized.endsWith(AUTH_CALLBACK_PATH)
}
