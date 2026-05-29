/**
 * Shared compliance and prototype messaging.
 * Avoid implying live licensing, BSEC approval, or real trading.
 */

export const COMPLIANCE_COPY = {
  prototypeBanner:
    'Prototype environment · Mock trading only · Market data shown for demonstration only',
  notFinancialAdvice: 'Not financial advice.',
  brokerageRequired:
    'Securities services require licensed brokerage partnerships and regulatory approval.',
  legalReview:
    'Final compliance implementation requires review by Bangladeshi legal and regulatory experts.',
  mockTrading: 'Mock trading only — no real order routing.',
  draftDocument:
    'Draft document for prototype only. Final text requires legal review.',
} as const

export function PrototypeBanner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-200/90 ${className}`}
    >
      {COMPLIANCE_COPY.prototypeBanner}
    </div>
  )
}

export function PrototypeModeBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-amber-200 uppercase ${className}`}
    >
      Prototype mode
    </span>
  )
}

export function DevMarketOverrideBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-sky-400/40 bg-sky-500/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-sky-200 uppercase ${className}`}
    >
      Dev Market Override Active
    </span>
  )
}

export function ComplianceFooter({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center text-[10px] leading-relaxed text-lenden-muted ${className}`}>
      {COMPLIANCE_COPY.notFinancialAdvice} {COMPLIANCE_COPY.brokerageRequired}
    </p>
  )
}
