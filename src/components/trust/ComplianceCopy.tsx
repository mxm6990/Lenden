/**
 * Shared compliance and prototype messaging.
 * Avoid implying live licensing, BSEC approval, or real trading.
 */

import { getMarketDataStatus, isExperimentalMarketDataMode } from '../../services/marketDataProvider'
import { getSecurityCount } from '../../services/securityCatalogApi'
import { getMarketFeedStatusLabel } from '../../lib/marketQuoteFreshness'
import { MARKET_DATA_DISCLAIMER, type MarketDataBadgeLabel } from '../../types/marketData'

export const COMPLIANCE_COPY = {
  prototypeBanner:
    'Closed beta prototype · Mock trading only · Market data shown for demonstration only',
  closedBetaLabel: 'Closed Beta Prototype',
  paperTradingBeta: 'Paper Trading Beta',
  notFinancialAdvice: 'Not financial advice.',
  brokerageRequired:
    'Securities services require licensed brokerage partnerships and regulatory approval.',
  legalReview:
    'Final compliance implementation requires review by Bangladeshi legal and regulatory experts.',
  mockTrading: 'Mock trading only — no real order routing.',
  draftDocument:
    'Draft document for prototype only. Final text requires legal review.',
  marketDataNotice: MARKET_DATA_DISCLAIMER,
} as const

const BADGE_STYLES: Record<MarketDataBadgeLabel, string> = {
  'Prototype Data': 'border-white/15 bg-white/5 text-lenden-muted',
  'Experimental Feed': 'border-amber-400/35 bg-amber-500/10 text-amber-200',
  'Experimental DSE Feed': 'border-amber-400/35 bg-amber-500/10 text-amber-200',
  'Cached Experimental DSE Feed': 'border-sky-400/30 bg-sky-500/10 text-sky-200',
  'Licensed Feed': 'border-lenden-mint/35 bg-lenden-mint/10 text-lenden-mint',
  'Delayed Data': 'border-sky-400/30 bg-sky-500/10 text-sky-200',
  'Data Unavailable': 'border-red-500/25 bg-red-500/10 text-red-300',
}

export function ClosedBetaBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-violet-400/35 bg-violet-500/10 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-violet-200 uppercase ${className}`}
    >
      {COMPLIANCE_COPY.closedBetaLabel}
    </span>
  )
}

export function PaperTradingBetaPill({ className = '' }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-amber-400/35 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-amber-200 uppercase ${className}`}
    >
      {COMPLIANCE_COPY.paperTradingBeta}
    </span>
  )
}

export function MarketFeedBanner({ className = '' }: { className?: string }) {
  const status = getMarketDataStatus()
  const feedLabel =
    status.badge === 'Cached Experimental DSE Feed'
      ? 'Cached Experimental DSE Feed'
      : status.badge === 'Experimental DSE Feed'
        ? 'Experimental DSE Feed'
        : status.sourceLabel || 'Prototype Data'
  const feedStatus = getMarketFeedStatusLabel(status)

  return (
    <div
      className={`mx-5 mb-3 rounded-xl border border-amber-400/25 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-100/90 ${className}`}
    >
      <span className="font-semibold text-amber-100">{feedLabel}</span>
      <span className="text-amber-200/80"> · Paper Trading</span>
      {status.fellBackToCache && (
        <span className="ml-1 rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-200">
          Using cached prices
        </span>
      )}
      <span className="mt-1 block text-[10px] text-amber-200/70">
        {getSecurityCount().toLocaleString()} DSE securities · {COMPLIANCE_COPY.mockTrading}
      </span>
      {feedStatus !== 'Live experimental DSE feed' && (
        <span className="mt-1 block text-[10px] text-amber-200/80">{feedStatus}</span>
      )}
    </div>
  )
}

export function MarketDataBadge({
  label,
  className = '',
}: {
  label?: MarketDataBadgeLabel
  className?: string
}) {
  const badge = label ?? getMarketDataStatus().badge
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold tracking-wide uppercase ${BADGE_STYLES[badge]} ${className}`}
    >
      {badge}
    </span>
  )
}

export function ExperimentalMarketDataBadge({ className = '' }: { className?: string }) {
  if (!isExperimentalMarketDataMode()) return null

  return (
    <span
      className={`inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-amber-200 uppercase ${className}`}
    >
      Experimental market data
    </span>
  )
}

export function BetaScreenLabels({
  isDemo = false,
  showMarketData = true,
  className = '',
}: {
  isDemo?: boolean
  showMarketData?: boolean
  className?: string
}) {
  const status = getMarketDataStatus()

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <ClosedBetaBadge />
      {isDemo && <PrototypeModeBadge />}
      {showMarketData && <MarketDataBadge label={status.badge} />}
      <ExperimentalMarketDataBadge />
    </div>
  )
}

export function MarketDataNotice({ className = '' }: { className?: string }) {
  const status = getMarketDataStatus()

  return (
    <div className={className}>
      <p className="text-[10px] leading-relaxed text-lenden-muted">{COMPLIANCE_COPY.marketDataNotice}</p>
      {status.configurationError && (
        <p className="mt-1 text-[10px] leading-relaxed text-amber-200/90">{status.configurationError}</p>
      )}
    </div>
  )
}

export function MarketStatisticsBanner({
  count,
  className = '',
}: {
  count?: number
  className?: string
}) {
  const securitiesCount = count ?? getSecurityCount()

  return (
    <div
      className={`rounded-xl border border-white/10 bg-lenden-surface/80 px-3 py-2.5 ${className}`}
    >
      <p className="text-xs font-semibold text-white">
        DSE Securities Available: {securitiesCount.toLocaleString()}
      </p>
    </div>
  )
}

export function PrototypeBanner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-[11px] leading-snug text-amber-200/90 ${className}`}
    >
      {COMPLIANCE_COPY.prototypeBanner}
    </div>
  )
}

export function EmailVerificationBetaBanner({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-xl border border-sky-400/25 bg-sky-500/10 px-3 py-2 text-[11px] leading-snug text-sky-100/90 ${className}`}
    >
      <span className="font-semibold text-sky-100">Beta auth mode</span>
      <span className="mt-1 block text-[10px] text-sky-200/80">
        Email verification is disabled for this build. Accounts can sign in immediately after signup.
      </span>
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
