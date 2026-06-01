import { type FormEvent, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, CheckCircle2, Mail } from 'lucide-react'
import { CONTACT_EMAIL } from '../../lib/constants'

export function BetaSection() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = email.trim()
    if (!trimmed) return

    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('LenDen beta access request')}&body=${encodeURIComponent(
      `Hi LenDen team,\n\nI'd like to join the closed beta.\n\nEmail: ${trimmed}\n\nThanks!`,
    )}`
    setSubmitted(true)
  }

  return (
    <section id="beta" className="border-t border-white/5 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-lenden-mint/15 bg-gradient-to-br from-lenden-green-dark/80 via-lenden-card to-lenden-black p-8 sm:p-12 glow-green"
        >
          <div
            className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-30 blur-3xl"
            style={{ background: 'radial-gradient(circle, #4ade80 0%, transparent 70%)' }}
            aria-hidden
          />

          <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold tracking-wide text-lenden-mint uppercase">Closed beta</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Ready to try LenDen?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-lenden-muted">
                We&apos;re inviting a small group of testers to explore the prototype on iPhone. You&apos;ll
                get paper-trading flows, portfolio tracking, and a direct line for feedback.
              </p>

              <ul className="mt-6 space-y-3">
                {[
                  'Mock trading only — no real money',
                  'iPhone app via TestFlight (invite required)',
                  'Your feedback shapes what ships next',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-lenden-white/90">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lenden-mint" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/10 bg-lenden-black/60 p-6 backdrop-blur-sm">
              {submitted ? (
                <div className="py-6 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-lenden-mint" />
                  <p className="mt-4 text-lg font-semibold text-white">Opening your email client…</p>
                  <p className="mt-2 text-sm text-lenden-muted">
                    Send the pre-filled message to {CONTACT_EMAIL}, or email us directly.
                  </p>
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="mt-4 inline-block text-sm font-medium text-lenden-mint hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <label htmlFor="beta-email" className="block text-sm font-semibold text-white">
                    Your email
                  </label>
                  <p className="mt-1 text-xs text-lenden-muted">
                    We&apos;ll reply with TestFlight instructions if you&apos;re a fit for this cohort.
                  </p>
                  <div className="relative mt-4">
                    <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-lenden-muted" />
                    <input
                      id="beta-email"
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-2xl border border-white/10 bg-lenden-surface py-3.5 pr-4 pl-11 text-sm text-white placeholder:text-lenden-muted outline-none focus:border-lenden-mint/40"
                    />
                  </div>
                  <button
                    type="submit"
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-lenden-mint py-3.5 text-sm font-bold text-lenden-black transition hover:bg-white"
                  >
                    Request access
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
