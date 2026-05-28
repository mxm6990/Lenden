import { useEffect, useState } from 'react'
import { getComplianceStatus, getKycStatus, getUserProfile } from '../../services/profileApi'
import { appendAuditLog } from '../../services/auditApi'
import { Card } from '../../components/ui/Card'
import { LoadingSkeleton, TrustState } from '../../components/trust/TrustState'
import { ProfileScreenLayout, StatusBadge, TimelineItem } from './ProfileScreenLayout'

interface KycDetailsScreenProps {
  onBack: () => void
}

export function KycDetailsScreen({ onBack }: KycDetailsScreenProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [kycLabel, setKycLabel] = useState('')
  const [nidStatus, setNidStatus] = useState('')
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [boStatus, setBoStatus] = useState('')
  const [riskStatus, setRiskStatus] = useState('')

  useEffect(() => {
    let cancelled = false
    Promise.all([getKycStatus(), getComplianceStatus(), getUserProfile()])
      .then(([kyc, compliance, user]) => {
        if (cancelled) return
        setKycLabel(kyc.summaryLabel)
        setNidStatus(user.nidVerificationStatus)
        setPhoneVerified(user.kycStatus === 'verified')
        setBoStatus(compliance.boAccount.status)
        setRiskStatus(compliance.riskProfile.status)
        appendAuditLog({ action: 'KYC_VIEWED', actorId: user.userId, targetId: kyc.record.id })
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <ProfileScreenLayout title="KYC Details" subtitle="Identity verification" onBack={onBack}>
      {loading && <LoadingSkeleton rows={4} />}
      {error && (
        <TrustState
          variant="error"
          title="Could not load KYC details"
          message="We could not retrieve your verification status right now. Please try again shortly."
        />
      )}
      {!loading && !error && (
        <>
          <Card className="mb-4 divide-y divide-white/5 p-4">
            <StatusBadge label="KYC status" status={kycLabel.toLowerCase()} />
            <StatusBadge label="NID verification" status={nidStatus} />
            <StatusBadge label="Phone verification" status={phoneVerified ? 'verified' : 'pending'} />
            <StatusBadge label="BO account" status={boStatus} />
            <StatusBadge label="Risk profile" status={riskStatus} />
          </Card>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-lenden-muted">
            Verification timeline
          </p>
          <Card className="mb-4 p-4">
            <TimelineItem
              title="Account created"
              date="15 Jan 2025"
              status="verified"
              note="Welcome to Lenden prototype."
            />
            <TimelineItem
              title="NID submitted"
              date="16 Jan 2025"
              status="verified"
            />
            <TimelineItem
              title="AML screening"
              date="18 Jan 2025"
              status="verified"
            />
            <TimelineItem
              title="BO account opening"
              date="In progress"
              status="pending"
              note="Requires licensed depository participant alignment."
            />
          </Card>

          <Card className="mb-4 p-4">
            <p className="mb-2 text-xs font-semibold text-white">Reference states (prototype)</p>
            <TimelineItem title="Example: KYC pending review" date="Demo" status="pending" />
            <TimelineItem
              title="Example: KYC rejected — document unclear"
              date="Demo"
              status="rejected"
              note="User would re-upload NID in production flow."
            />
          </Card>
        </>
      )}
    </ProfileScreenLayout>
  )
}
