import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'
import {
  completeAuthCallbackFromUrl,
  storeAuthCallbackError,
} from '../../services/authApi'
import { AuthShell } from '../../components/layout/AppShell'
import { TrustState } from '../../components/trust/TrustState'

export function AuthCallbackScreen() {
  const { enterWithSupabaseSession, goToAuth } = useApp()

  useEffect(() => {
    let cancelled = false

    void (async () => {
      const result = await completeAuthCallbackFromUrl()
      if (cancelled) return

      if (result.ok) {
        window.history.replaceState({}, document.title, '/')
        await enterWithSupabaseSession()
        return
      }

      const errorMessage =
        result.message ?? 'Email confirmation failed. Please sign in or sign up again.'
      storeAuthCallbackError(errorMessage)
      window.history.replaceState({}, document.title, '/')
      goToAuth('signin')
    })()

    return () => {
      cancelled = true
    }
  }, [enterWithSupabaseSession, goToAuth])

  return (
    <AuthShell>
      <div className="flex min-h-svh flex-col items-center justify-center px-6">
        <TrustState variant="info" title="Signing you in" message="Confirming your email…" />
      </div>
    </AuthShell>
  )
}
