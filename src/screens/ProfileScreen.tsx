import { LogOut, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import {
  ProfileCardRow,
  ProfileIdentityHeader,
  ProfileSection,
} from '../components/profile/ProfileSection'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import {
  getComplianceStatus,
  getSecuritySettings,
  getUserProfileResult,
} from '../services/profileApi'
import { appendAuditLog } from '../services/auditApi'
import { getAuthenticatedUserId } from '../lib/supabaseAuth'
import { PrototypeBanner, PrototypeModeBadge } from '../components/trust/ComplianceCopy'
import { LoadingSkeleton, TrustState } from '../components/trust/TrustState'
import { Button } from '../components/ui/Button'
import type { ProfileRoute, SecuritySettings, UserProfile, VerificationStatus } from '../types/profile'

function statusLabel(status: VerificationStatus | string): string {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function boLabel(status: UserProfile['boAccountStatus']): string {
  const map: Record<UserProfile['boAccountStatus'], string> = {
    not_opened: 'Not opened',
    pending: 'Pending',
    active: 'Active',
    suspended: 'Suspended',
    closed: 'Closed',
  }
  return map[status]
}

function riskLabel(status: UserProfile['riskProfileStatus']): string {
  const map: Record<UserProfile['riskProfileStatus'], string> = {
    not_assessed: 'Not assessed',
    conservative: 'Conservative',
    moderate: 'Moderate',
    aggressive: 'Aggressive',
    expired: 'Expired',
  }
  return map[status]
}

type ProfileLoadState = 'loading' | 'success' | 'error'

/** Survives Strict Mode remount — one PROFILE_VIEWED audit per session per user. */
const profileViewAuditLoggedSessionKeys = new Set<string>()

export function ProfileScreen() {
  const { openProfileRoute, signOut, isDemo, profileVersion } = useApp()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [security, setSecurity] = useState<SecuritySettings | null>(null)
  const [kycPending, setKycPending] = useState(false)
  const [boPending, setBoPending] = useState(false)
  const [loadState, setLoadState] = useState<ProfileLoadState>('loading')
  const [loadError, setLoadError] = useState<string | null>(null)
  const profileViewLoggedRef = useRef(false)

  const loadProfile = useCallback(async () => {
    setLoadState('loading')
    setLoadError(null)

    if (import.meta.env.DEV) {
      console.debug('profile load started')
    }

    try {
      const authUserId = await getAuthenticatedUserId()
      if (import.meta.env.DEV) {
        console.debug('auth user id', authUserId)
      }

      const [profileResult, compliance, securitySettings] = await Promise.all([
        getUserProfileResult(),
        getComplianceStatus(),
        getSecuritySettings(),
      ])

      if (profileResult.error || !profileResult.data) {
        const message = profileResult.error ?? 'Could not load your profile.'
        if (import.meta.env.DEV) {
          console.debug('profile load failed', message)
        }
        setProfile(null)
        setLoadError(message)
        setLoadState('error')
        return
      }

      if (import.meta.env.DEV) {
        console.debug('profile loaded', { source: profileResult.source, userId: profileResult.data.userId })
      }

      setProfile(profileResult.data)
      setSecurity(securitySettings)
      setKycPending(compliance.kyc.record.status === 'pending')
      setBoPending(compliance.boAccount.status === 'pending')
      setLoadState('success')

      if (!profileViewLoggedRef.current) {
        profileViewLoggedRef.current = true
        const actorId = authUserId ?? profileResult.data.userId
        const sessionKey = `${actorId}:${profileResult.data.userId}`
        if (!profileViewAuditLoggedSessionKeys.has(sessionKey)) {
          profileViewAuditLoggedSessionKeys.add(sessionKey)
          await appendAuditLog({
            action: 'PROFILE_VIEWED',
            actorId,
            targetId: profileResult.data.userId,
          })
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not load your profile.'
      if (import.meta.env.DEV) {
        console.debug('profile load failed', message)
      }
      setProfile(null)
      setLoadError(message)
      setLoadState('error')
    }
  }, [])

  useEffect(() => {
    void loadProfile()
  }, [loadProfile, profileVersion])

  const open = (route: ProfileRoute) => () => openProfileRoute(route)

  if (loadState === 'loading') {
    return (
      <>
        <ScreenHeader title="Profile" subtitle="Account & compliance" large />
        <div className="px-5 pb-4">
          <LoadingSkeleton rows={4} />
        </div>
      </>
    )
  }

  if (loadState === 'error' || !profile) {
    return (
      <>
        <ScreenHeader title="Profile" subtitle="Account & compliance" large />
        <div className="px-5 pb-4">
          <PrototypeBanner className="mb-4" />
          <TrustState
            variant="error"
            title="Profile unavailable"
            message={
              loadError ??
              'We could not load your account profile. Check your connection and try again.'
            }
          />
          <Button fullWidth className="mt-4" onClick={() => void loadProfile()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          {!isDemo && (
            <button
              type="button"
              onClick={signOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-3.5 text-sm font-semibold text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          )}
        </div>
      </>
    )
  }

  const kycVerified = profile.kycStatus === 'verified'

  return (
    <>
      <ScreenHeader title="Profile" subtitle="Account & compliance" large />
      <div className="px-5 pb-4">
        <PrototypeBanner className="mb-4" />
        {isDemo && <PrototypeModeBadge className="mb-3" />}
        {kycPending && (
          <TrustState
            variant="warning"
            title="KYC review in progress"
            message="Your identity verification is being reviewed. Some features remain limited in this prototype."
            className="mb-4"
          />
        )}
        {boPending && !kycPending && (
          <TrustState
            variant="info"
            title="BO account pending"
            message="Your Beneficiary Owner account opening is in progress and requires licensed partner alignment."
            className="mb-4"
          />
        )}
        <ProfileIdentityHeader
          fullName={profile.fullName}
          email={profile.email}
          profileInitial={profile.profileInitial}
          lendenId={profile.lendenId}
          kycVerified={kycVerified}
        />

        <ProfileSection title="Account" defaultOpen>
          <ProfileCardRow
            label="KYC Status"
            value={statusLabel(profile.kycStatus)}
            highlight={kycVerified}
            onClick={open('kyc-details')}
          />
          <ProfileCardRow
            label="BO Account Status"
            value={boLabel(profile.boAccountStatus)}
            highlight={profile.boAccountStatus === 'active'}
            onClick={open('kyc-details')}
          />
          <ProfileCardRow
            label="Linked bKash / Nagad / Rocket"
            value={profile.linkedWallet ?? 'Not linked'}
            onClick={open('linked-accounts')}
          />
          <ProfileCardRow
            label="Linked Bank Account"
            value={profile.linkedBank ?? 'Not linked'}
            onClick={open('linked-accounts')}
          />
          <ProfileCardRow label="Phone Number" value={profile.phone} onClick={open('kyc-details')} />
          <ProfileCardRow label="Email" value={profile.email} onClick={open('kyc-details')} />
          <ProfileCardRow
            label="NID Verification"
            value={statusLabel(profile.nidVerificationStatus)}
            highlight={profile.nidVerificationStatus === 'verified'}
            onClick={open('kyc-details')}
          />
        </ProfileSection>

        <ProfileSection title="Investor Compliance" defaultOpen={false}>
          <ProfileCardRow
            label="Investor Risk Profile"
            value={riskLabel(profile.riskProfileStatus)}
            onClick={open('risk-disclosure')}
          />
          <ProfileCardRow
            label="Suitability Questionnaire"
            value="BD-SUIT-v1"
            onClick={open('risk-disclosure')}
          />
          <ProfileCardRow label="Tax / TIN Information" value="Not provided" onClick={open('kyc-details')} />
          <ProfileCardRow label="Trading Permissions" value="View only" onClick={open('risk-disclosure')} />
          <ProfileCardRow
            label="Beneficiary Owner Account"
            value={boLabel(profile.boAccountStatus)}
            onClick={open('kyc-details')}
          />
          <ProfileCardRow
            label="Regulatory Disclosures"
            value="Acknowledged"
            onClick={open('legal-documents')}
          />
        </ProfileSection>

        <ProfileSection title="Security" defaultOpen={false}>
          <ProfileCardRow label="Change Password" onClick={open('security-settings')} />
          <ProfileCardRow
            label="Two-Factor Authentication"
            value={security?.twoFactorEnabled ? 'On' : 'Off'}
            onClick={open('security-settings')}
          />
          <ProfileCardRow label="Device Management" onClick={open('security-settings')} />
          <ProfileCardRow label="Login History" onClick={open('security-settings')} />
          <ProfileCardRow
            label="Transaction PIN"
            value={security?.transactionPinSet ? 'Set' : 'Not set'}
            onClick={open('security-settings')}
          />
          <ProfileCardRow
            label="Biometric Login"
            value={security?.biometricEnabled ? 'On' : 'Off'}
            onClick={open('security-settings')}
          />
        </ProfileSection>

        <ProfileSection title="Support" defaultOpen={false}>
          <ProfileCardRow label="Help Center" onClick={open('help-center')} />
          <ProfileCardRow label="Contact Support" onClick={open('support-ticket')} />
          <ProfileCardRow label="Report a Problem" onClick={open('support-ticket')} />
          <ProfileCardRow label="Dispute a Transaction" onClick={open('support-ticket')} />
          <ProfileCardRow label="Account Recovery" onClick={open('support-ticket')} />
          <ProfileCardRow label="Investor Education" onClick={open('help-center')} />
        </ProfileSection>

        <ProfileSection title="Legal" defaultOpen={false}>
          <ProfileCardRow label="Terms & Conditions" onClick={open('legal-documents')} />
          <ProfileCardRow label="Privacy Policy" onClick={open('legal-documents')} />
          <ProfileCardRow label="Risk Disclosure" onClick={open('risk-disclosure')} />
          <ProfileCardRow label="Brokerage Partner Disclosure" onClick={open('legal-documents')} />
          <ProfileCardRow label="Data Usage Consent" onClick={open('legal-documents')} />
          <ProfileCardRow label="Regulatory Information" onClick={open('legal-documents')} />
          <ProfileCardRow label="Complaints & Grievance Process" onClick={open('support-ticket')} />
        </ProfileSection>

        <button
          type="button"
          onClick={signOut}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 py-3.5 text-sm font-semibold text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>

        <p className="mt-5 text-center text-[10px] leading-relaxed text-lenden-muted">
          Lenden is a financial technology platform. Securities services require licensed
          brokerage partnerships and regulatory approval.
        </p>
        <p className="mt-2 text-center text-[10px] text-lenden-muted">
          Lenden v0.1 · Compliance-ready foundation
        </p>
      </div>
    </>
  )
}
