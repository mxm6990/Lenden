import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { signInWithEmail, isAuthAvailable } from '../../services/authApi'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ScreenHeader } from '../../components/layout/ScreenHeader'
import { TrustState } from '../../components/trust/TrustState'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Email or password is incorrect. Please try again.',
  email_not_confirmed: 'Confirm your email first, then sign in.',
  not_configured: 'Supabase is not configured. Use Explore Demo or add .env.local.',
}

export function SignInScreen() {
  const { goToAuth, enterWithSupabaseSession } = useApp()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <>
      <ScreenHeader title="Sign in" onBack={() => goToAuth('splash')} />
      <div className="px-5 pb-8">
        {!isAuthAvailable() && (
          <TrustState
            variant="info"
            title="Prototype mode"
            message="Add Supabase keys to .env.local to enable sign in, or use Explore Demo on the welcome screen."
            className="mb-4"
          />
        )}

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setLoading(true)
            setError(null)
            const result = await signInWithEmail(form)
            setLoading(false)
            if (!result.ok) {
              setError(
                ERROR_MESSAGES[result.errorCode ?? 'unknown'] ??
                  result.message ??
                  'Could not sign in.',
              )
              return
            }
            await enterWithSupabaseSession()
          }}
        >
          <Input
            label="Email"
            placeholder="you@email.com"
            type="email"
            value={form.email}
            onChange={update('email')}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="Your password"
            value={form.password}
            onChange={update('password')}
            required
          />

          {error && (
            <TrustState variant="warning" title="Sign in failed" message={error} />
          )}

          <Button type="submit" fullWidth size="lg" disabled={loading || !isAuthAvailable()}>
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => goToAuth('signup')}
          className="mt-6 w-full text-center text-sm text-lenden-mint"
        >
          Create an account
        </button>
      </div>
    </>
  )
}
