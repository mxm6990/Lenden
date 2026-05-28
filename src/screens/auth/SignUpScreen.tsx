import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { ScreenHeader } from '../../components/layout/ScreenHeader'

export function SignUpScreen() {
  const { goToAuth, completeSignUp } = useApp()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <>
      <ScreenHeader title="Create account" onBack={() => goToAuth('splash')} />
      <div className="px-5 pb-8">
        <p className="mb-6 text-sm text-lenden-muted">
          Join Lenden to start investing in DSE stocks. It only takes a few minutes.
        </p>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            completeSignUp({
              fullName: form.name,
              phone: form.phone,
              email: form.email,
            })
          }}
        >
          <Input label="Full Name" placeholder="Your full name" value={form.name} onChange={update('name')} />
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
          />
          <Input
            label="Password"
            placeholder="Create a password"
            type="password"
            value={form.password}
            onChange={update('password')}
          />

          <div className="pt-4">
            <Button type="submit" fullWidth size="lg">
              Continue
            </Button>
          </div>
        </form>

        <p className="mt-6 text-center text-[11px] leading-relaxed text-lenden-muted">
          By continuing, you agree to Lenden&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </>
  )
}
