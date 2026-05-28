import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getLinkedAccounts } from '../../services/profileApi'
import type { LinkedAccount } from '../../types/profile'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { LoadingSkeleton, TrustState } from '../../components/trust/TrustState'
import { ProfileScreenLayout, StatusBadge } from './ProfileScreenLayout'

interface LinkedAccountsScreenProps {
  onBack: () => void
}

export function LinkedAccountsScreen({ onBack }: LinkedAccountsScreenProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [accounts, setAccounts] = useState<LinkedAccount[]>([])

  useEffect(() => {
    getLinkedAccounts()
      .then(setAccounts)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  const pending = accounts.filter((a) => a.status === 'pending')

  return (
    <ProfileScreenLayout title="Linked Accounts" subtitle="Wallets and banks" onBack={onBack}>
      {loading && <LoadingSkeleton rows={3} />}
      {error && (
        <TrustState
          variant="error"
          title="Linked accounts unavailable"
          message="We could not load your linked accounts. Your verification status may still be processing."
        />
      )}
      {!loading && !error && accounts.length === 0 && (
        <TrustState
          variant="empty"
          title="No linked accounts"
          message="Link a bKash, Nagad, Rocket, or bank account in your own name to prepare for funding flows."
          action={
            <Button variant="secondary" size="sm">
              <Plus className="h-4 w-4" />
              Add account (placeholder)
            </Button>
          }
        />
      )}
      {!loading && !error && accounts.length > 0 && (
        <>
          {pending.length > 0 && (
            <TrustState
              variant="warning"
              title="Verification pending"
              message="One or more linked accounts are awaiting verification. This is normal during prototype onboarding."
              className="mb-4"
            />
          )}
          <div className="space-y-3">
            {accounts.map((account) => (
              <Card key={account.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{account.provider}</p>
                    <p className="text-xs capitalize text-lenden-muted">
                      {account.type.replace(/_/g, ' ')} · {account.accountMask}
                    </p>
                  </div>
                  {account.isPrimary && (
                    <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-lenden-muted">
                      Primary
                    </span>
                  )}
                </div>
                <div className="mt-3 border-t border-white/5 pt-3">
                  <StatusBadge label="Verification" status={account.status} />
                </div>
              </Card>
            ))}
          </div>
          <Card className="mt-4 border border-amber-500/20 bg-amber-500/5 p-4">
            <p className="text-xs leading-relaxed text-amber-200/90">
              Only link accounts registered in your own name. Third-party accounts cannot be used
              for deposits or withdrawals.
            </p>
          </Card>
          <Button variant="secondary" fullWidth className="mt-4">
            <Plus className="h-4 w-4" />
            Add account (placeholder)
          </Button>
        </>
      )}
    </ProfileScreenLayout>
  )
}
