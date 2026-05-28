import { useEffect, useState } from 'react'
import { getSecuritySettings } from '../../services/profileApi'
import { getSessionSnapshot, removeTrustedDevice } from '../../services/sessionApi'
import type { LoginHistoryEntry, TrustedDevice } from '../../types/session'
import type { SecuritySettings } from '../../types/profile'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { LoadingSkeleton, TrustState } from '../../components/trust/TrustState'
import { ProfileScreenLayout } from './ProfileScreenLayout'

interface SecuritySettingsScreenProps {
  onBack: () => void
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm text-lenden-muted">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  )
}

export function SecuritySettingsScreen({ onBack }: SecuritySettingsScreenProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [settings, setSettings] = useState<SecuritySettings | null>(null)
  const [devices, setDevices] = useState<TrustedDevice[]>([])
  const [history, setHistory] = useState<LoginHistoryEntry[]>([])

  useEffect(() => {
    Promise.all([getSecuritySettings(), getSessionSnapshot()])
      .then(([sec, session]) => {
        setSettings(sec)
        setDevices(session.trustedDevices)
        setHistory(session.loginHistory.slice(0, 3))
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const handleRemoveDevice = async (deviceId: string) => {
    await removeTrustedDevice(deviceId)
    const updated = await getSessionSnapshot()
    setDevices(updated.trustedDevices)
  }

  return (
    <ProfileScreenLayout title="Security Settings" subtitle="Account protection" onBack={onBack}>
      {loading && <LoadingSkeleton rows={5} />}
      {error && (
        <TrustState
          variant="error"
          title="Security settings unavailable"
          message="We could not load your security preferences. Please try again."
        />
      )}
      {!loading && !error && settings && (
        <>
          <Card className="mb-4 divide-y divide-white/5 px-4">
            <Row
              label="Password"
              value={
                settings.passwordLastChangedAt
                  ? `Updated ${new Date(settings.passwordLastChangedAt).toLocaleDateString('en-BD')}`
                  : 'Not set'
              }
            />
            <Row label="Two-factor authentication" value={settings.twoFactorEnabled ? 'On' : 'Off'} />
            <Row label="Transaction PIN" value={settings.transactionPinSet ? 'Set' : 'Not set'} />
            <Row label="Biometric login" value={settings.biometricEnabled ? 'On' : 'Off'} />
          </Card>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-lenden-muted">
            Trusted devices
          </p>
          <Card className="mb-4 divide-y divide-white/5">
            {devices.map((device) => (
              <div key={device.id} className="flex items-start justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-white">
                    {device.deviceName}
                    {device.isCurrent && (
                      <span className="ml-2 text-[10px] text-lenden-mint">This device</span>
                    )}
                  </p>
                  <p className="text-[11px] text-lenden-muted">
                    {device.platform} · {device.ipAddressMasked}
                  </p>
                </div>
                {!device.isCurrent && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDevice(device.id)}
                    className="text-xs font-medium text-red-400"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </Card>

          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-lenden-muted">
            Login history
          </p>
          <Card className="mb-4 divide-y divide-white/5">
            {history.map((entry) => (
              <div key={entry.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm text-white">{entry.deviceName}</p>
                  <span className={entry.success ? 'text-lenden-mint' : 'text-red-400'}>
                    {entry.success ? 'Success' : 'Failed'}
                  </span>
                </div>
                <p className="text-[11px] text-lenden-muted">
                  {entry.location} · {new Date(entry.timestamp).toLocaleString('en-BD')}
                </p>
              </div>
            ))}
          </Card>

          <Button variant="secondary" fullWidth>
            Sign out from all devices (placeholder)
          </Button>
        </>
      )}
    </ProfileScreenLayout>
  )
}
