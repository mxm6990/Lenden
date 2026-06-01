/** When false, signup proceeds without blocking on email confirmation (Supabase confirm should also be off for beta). */
export function isEmailConfirmationRequired(): boolean {
  return import.meta.env.VITE_REQUIRE_EMAIL_CONFIRMATION !== 'false'
}
