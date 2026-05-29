import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { isAuthAvailable, signUpWithEmail } from '../../services/authApi'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ScreenHeader } from '../../components/layout/ScreenHeader'
import { TrustState } from '../../components/trust/TrustState'

export function SignUpScreen() {
  const { goToAuth, completeSignUp } = useApp()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <>
      <ScreenHeader title="Create account" onBack={() => goToAuth('splash')} />
      <div className="px-5 pb-8">
        <p className="mb-6 text-sm text-lenden-muted">
          Join Lenden to start investing in DSE stocks. It only takes a few minutes.
        </p>

        {!isAuthAvailable() && (
          <TrustState
            variant="info"
            title="Local signup mode"
            message="Without Supabase keys, this form uses the prototype flow only. Add .env.local for real accounts."
            className="mb-4"
          />
        )}

        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setLoading(true)
            setError(null)
            setInfo(null)

            if (isAuthAvailable()) {
              const result = await signUpWithEmail({
                email: form.email,
                password: form.password,
                fullName: form.name,
                phone: form.phone,
              })
              setLoading(false)

              if (!result.ok) {
                setError(result.message ?? 'Could not create account.')
                return
              }

              if (result.needsEmailConfirmation) {
                setInfo(result.message ?? 'Check your email to confirm your account.')
                return
              }

              completeSignUp({
                fullName: form.name,
                phone: form.phone,
                email: form.email,
              })
              return
            }

            completeSignUp({
              fullName: form.name,
              phone: form.phone,
              email: form.email,
            })
            setLoading(false)
          }}
        >
          <Input label="Full Name" placeholder="Your full name" value={form.name} onChange={update('name')} required />
          <Input
            label="Phone Number"
            placeholder="+880 1XXX-XXXXXX"
            type="tel"
            value={form.phone}
            onChange={update('phone')}
          />
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
            placeholder="Create a password"
            type="password"
            value={form.password}
            onChange={update('password')}
            required
            minLength={6}
          />

          {info && <TrustState variant="info" title="Confirm your email" message={info} />}
          {error && <TrustState variant="warning" title="Sign up failed" message={error} />}

          <div className="pt-4">
            <Button type="submit" fullWidth size="lg" disabled={loading}>
              {loading ? 'Creating account…' : 'Continue'}
            </Button>
          </div>
        </form>

        <button
          type="button"
          onClick={() => goToAuth('signin')}
          className="mt-6 w-full text-center text-sm text-lenden-mint"
        >
          Already have an account? Sign in
        </button>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-lenden-muted">
          By continuing, you agree to Lenden&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </>
  )
}
