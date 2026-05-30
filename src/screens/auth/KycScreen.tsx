import { CheckCircle2, Circle, CreditCard, Phone, Shield, User } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ScreenHeader } from '../../components/layout/ScreenHeader'
import {
  ClosedBetaBadge,
  ComplianceFooter,
  PrototypeBanner,
} from '../../components/trust/ComplianceCopy'
import { TrustState } from '../../components/trust/TrustState'

const steps = [
  {
    icon: Shield,
    title: 'NID Verification (simulated)',
    description: 'Prototype UI only — no real NID is uploaded or verified',
    done: true,
  },
  {
    icon: Phone,
    title: 'Phone Verification (simulated)',
    description: 'Prototype UI only — no OTP is sent in this closed beta',
    done: true,
  },
  {
    icon: CreditCard,
    title: 'Wallet / Bank Link (simulated)',
    description: 'No real bKash, Nagad, Rocket, or bank account is linked',
    done: false,
  },
  {
    icon: User,
    title: 'Investor Profile (simulated)',
    description: 'Placeholder questions only — not used for real suitability review',
    done: false,
  },
]

export function KycScreen() {
  const { completeKyc } = useApp()

  return (
    <>
      <ScreenHeader
        title="Prototype verification"
        subtitle="Closed beta — simulated onboarding only"
      />
      <div className="px-5 pb-8">
        <ClosedBetaBadge className="mb-3" />
        <PrototypeBanner className="mb-4" />
        <TrustState
          variant="info"
          title="No real KYC or brokerage account"
          message="This screen is for demonstration only. No identity documents are submitted, no Beneficiary Owner account is opened, and no real securities trading is enabled."
          className="mb-4"
        />

        <div className="mb-6 rounded-2xl border border-white/10 bg-lenden-card p-4">
          <p className="text-sm font-semibold text-white">Prototype onboarding preview</p>
          <p className="mt-1 text-xs text-lenden-muted">
            Tap below to continue into the mock investing experience. Mock trading only — no real
            orders or payments.
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-lenden-border">
            <div className="h-full w-1/2 rounded-full bg-lenden-mint/70" />
          </div>
          <p className="mt-1.5 text-[10px] text-lenden-muted">2 of 4 simulated steps shown</p>
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <Card key={step.title} className="flex items-start gap-3 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lenden-green/40 text-lenden-mint">
                <step.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-lenden-mint" />
                  ) : (
                    <Circle className="h-4 w-4 text-lenden-border" />
                  )}
                </div>
                <p className="mt-0.5 text-xs text-lenden-muted">{step.description}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="pt-6">
          <Button fullWidth size="lg" onClick={completeKyc}>
            Continue to mock app
          </Button>
          <ComplianceFooter className="mt-4" />
        </div>
      </div>
    </>
  )
}
