import { ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getLegalConsents } from '../../services/profileApi'
import { appendAuditLog } from '../../services/auditApi'
import { getAuthenticatedUserId } from '../../lib/supabaseAuth'
import type { LegalConsent } from '../../types/profile'
import { Card } from '../../components/ui/Card'
import { LegalDocumentModal } from '../../components/trust/LegalDocumentModal'
import { LoadingSkeleton, TrustState } from '../../components/trust/TrustState'
import { ProfileScreenLayout } from './ProfileScreenLayout'

const LEGAL_LABELS: Record<string, string> = {
  terms: 'Terms & Conditions',
  privacy: 'Privacy Policy',
  risk_disclosure: 'Risk Disclosure',
  brokerage_partner: 'Brokerage Partner Disclosure',
  data_usage: 'Data Usage Consent',
  marketing: 'Marketing Consent',
}

const EXTRA_LEGAL = [
  'Complaints & Grievance Process',
  'Regulatory Information',
]

interface LegalDocumentsScreenProps {
  onBack: () => void
}

export function LegalDocumentsScreen({ onBack }: LegalDocumentsScreenProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [consents, setConsents] = useState<LegalConsent[]>([])
  const [modalTitle, setModalTitle] = useState<string | null>(null)
  const [missingConsent, setMissingConsent] = useState(false)

  useEffect(() => {
    getLegalConsents()
      .then((items) => {
        setConsents(items)
        setMissingConsent(items.some((c) => c.required && !c.acceptedAt))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const openDoc = (title: string, type?: string) => {
    setModalTitle(title)
    if (type) {
      void (async () => {
        const actorId = (await getAuthenticatedUserId()) ?? 'usr_demo_001'
        await appendAuditLog({
          action: 'LEGAL_DOCUMENT_VIEWED',
          actorId,
          targetId: type,
        })
      })()
    }
  }

  return (
    <ProfileScreenLayout title="Legal Documents" subtitle="Terms and consents" onBack={onBack}>
      {loading && <LoadingSkeleton rows={4} />}
      {error && (
        <TrustState
          variant="error"
          title="Legal documents unavailable"
          message="We could not load consent records. Please try again later."
        />
      )}
      {!loading && !error && missingConsent && (
        <TrustState
          variant="warning"
          title="Legal consent missing"
          message="Some required consents are not yet recorded. Accept updated documents when onboarding goes live."
          className="mb-4"
        />
      )}
      {!loading && !error && (
        <Card className="divide-y divide-white/5 overflow-hidden">
          {consents.map((consent) => (
            <button
              key={consent.id}
              type="button"
              onClick={() => openDoc(LEGAL_LABELS[consent.type] ?? consent.type, consent.type)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <div>
                <p className="text-sm font-medium text-white">
                  {LEGAL_LABELS[consent.type] ?? consent.type}
                </p>
                <p className="text-[11px] text-lenden-muted">
                  v{consent.version} · {consent.acceptedAt ? 'Accepted' : 'Pending'}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-lenden-muted" />
            </button>
          ))}
          {EXTRA_LEGAL.map((title) => (
            <button
              key={title}
              type="button"
              onClick={() => openDoc(title)}
              className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
            >
              <p className="text-sm font-medium text-white">{title}</p>
              <ChevronRight className="h-4 w-4 shrink-0 text-lenden-muted" />
            </button>
          ))}
        </Card>
      )}
      <LegalDocumentModal
        title={modalTitle ?? ''}
        open={Boolean(modalTitle)}
        onClose={() => setModalTitle(null)}
      />
    </ProfileScreenLayout>
  )
}
