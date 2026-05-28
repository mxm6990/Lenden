import { useEffect, useState } from 'react'
import { getComplianceStatus } from '../../services/profileApi'
import { Card } from '../../components/ui/Card'
import { COMPLIANCE_COPY } from '../../components/trust/ComplianceCopy'
import { LoadingSkeleton, TrustState } from '../../components/trust/TrustState'
import { ProfileScreenLayout } from './ProfileScreenLayout'

const RISK_POINTS = [
  'Stock investments carry risk. Prices can go up or down, and you may lose part or all of your invested capital.',
  'Past performance does not guarantee future returns.',
  'Market data in this app is mock/prototype data and may not reflect live DSE prices.',
  'Lenden is not providing financial advice. Investment decisions are your responsibility.',
  'Real securities services require licensed brokerage partnerships and regulatory approval.',
  'Final compliance implementation requires review by Bangladeshi legal and regulatory experts.',
]

interface RiskDisclosureScreenProps {
  onBack: () => void
}

export function RiskDisclosureScreen({ onBack }: RiskDisclosureScreenProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [riskProfile, setRiskProfile] = useState('')
  const [restrictions, setRestrictions] = useState<string[]>([])

  useEffect(() => {
    getComplianceStatus()
      .then((status) => {
        setRiskProfile(status.riskProfile.status)
        setRestrictions(status.tradingPermissions.restrictions)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  return (
    <ProfileScreenLayout title="Risk Disclosure" subtitle="Investment risks" onBack={onBack}>
      {loading && <LoadingSkeleton rows={3} />}
      {error && (
        <TrustState
          variant="error"
          title="Risk disclosure unavailable"
          message="We could not load compliance details. Core risk information is still shown below."
        />
      )}
      <Card className="mb-4 p-4">
        <ul className="space-y-3">
          {RISK_POINTS.map((point) => (
            <li key={point} className="text-sm leading-relaxed text-lenden-muted">
              · {point}
            </li>
          ))}
        </ul>
      </Card>
      {!loading && !error && (
        <Card className="p-4">
          <p className="text-xs text-lenden-muted">Your assessed risk profile</p>
          <p className="mt-1 text-sm font-semibold capitalize text-white">{riskProfile.replace(/_/g, ' ')}</p>
          <ul className="mt-3 space-y-2">
            {restrictions.map((r) => (
              <li key={r} className="text-xs text-lenden-muted">
                · {r}
              </li>
            ))}
          </ul>
        </Card>
      )}
      <p className="mt-4 text-center text-[10px] text-lenden-muted">{COMPLIANCE_COPY.mockTrading}</p>
    </ProfileScreenLayout>
  )
}
