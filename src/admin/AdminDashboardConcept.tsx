/**
 * AdminDashboardConcept — internal ops planning only.
 * Not imported by main user app navigation.
 * To preview during development, temporarily import in App.tsx (commented by default).
 */

import {
  MOCK_ADMIN_METRICS,
  MOCK_ADMIN_ORDERS,
  MOCK_ADMIN_TICKETS,
  MOCK_FLAGGED,
  MOCK_LINKED_REVIEWS,
  MOCK_PENDING_KYC,
} from './mockAdminData'

function AdminCard({ title, value, subtitle }: { title: string; value: number | string; subtitle?: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-lenden-card p-4">
      <p className="text-xs text-lenden-muted">{title}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
      {subtitle && <p className="mt-1 text-[11px] text-lenden-muted">{subtitle}</p>}
    </div>
  )
}

export function AdminDashboardConcept() {
  return (
    <div className="min-h-svh bg-lenden-black px-5 py-10 text-white">
      <p className="text-xs uppercase tracking-wide text-amber-400">Internal concept only</p>
      <h1 className="mt-2 text-2xl font-bold">Lenden Ops Dashboard</h1>
      <p className="mt-2 text-sm text-lenden-muted">
        Future back-office view for KYC, support, compliance, and mock order monitoring.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <AdminCard title="Pending KYC" value={MOCK_ADMIN_METRICS.pendingKyc} />
        <AdminCard title="Support tickets" value={MOCK_ADMIN_METRICS.openTickets} />
        <AdminCard title="Flagged accounts" value={MOCK_ADMIN_METRICS.flaggedAccounts} />
        <AdminCard title="Mock orders today" value={MOCK_ADMIN_METRICS.mockOrdersToday} />
        <AdminCard title="Audit events" value={MOCK_ADMIN_METRICS.auditEventsToday} />
        <AdminCard title="Linked account reviews" value={MOCK_ADMIN_METRICS.linkedAccountReviews} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold">Pending KYC reviews</h2>
        {MOCK_PENDING_KYC.map((item) => (
          <div key={item.id} className="mb-2 rounded-xl border border-white/5 bg-lenden-surface p-3 text-sm">
            {item.fullName} · {item.status}
          </div>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold">Recent mock orders</h2>
        {MOCK_ADMIN_ORDERS.map((o) => (
          <div key={o.orderId} className="mb-2 rounded-xl border border-white/5 bg-lenden-surface p-3 text-sm">
            {o.symbol} · {o.amountBdt} BDT · {o.status}
          </div>
        ))}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold">Support & compliance queues</h2>
        {MOCK_ADMIN_TICKETS.map((t) => (
          <div key={t.id} className="mb-2 rounded-xl border border-white/5 bg-lenden-surface p-3 text-sm">
            {t.subject}
          </div>
        ))}
        {MOCK_FLAGGED.map((f) => (
          <div key={f.id} className="mb-2 rounded-xl border border-white/5 bg-lenden-surface p-3 text-sm">
            Flagged: {f.reason}
          </div>
        ))}
        {MOCK_LINKED_REVIEWS.map((l) => (
          <div key={l.id} className="mb-2 rounded-xl border border-white/5 bg-lenden-surface p-3 text-sm">
            {l.provider} review · {l.status}
          </div>
        ))}
      </section>
    </div>
  )
}

// Developer note: import AdminDashboardConcept in App.tsx only for local ops UI experiments.
