import { CheckCircle2, Circle, CreditCard, Phone, Shield, User } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ScreenHeader } from '../../components/layout/ScreenHeader'

const steps = [
  {
    icon: Shield,
    title: 'NID Verification',
    description: 'Upload your National ID to verify identity',
    done: true,
  },
  {
    icon: Phone,
    title: 'Phone Verification',
    description: 'Confirm your mobile number with OTP',
    done: true,
  },
  {
    icon: CreditCard,
    title: 'Bank Account / Mobile Wallet',
    description: 'Link bKash, Nagad, or bank account for deposits',
    done: false,
  },
  {
    icon: User,
    title: 'Basic Investor Profile',
    description: 'Tell us your experience level and goals',
    done: false,
  },
]

export function KycScreen() {
  const { completeKyc } = useApp()

  return (
    <>
      <ScreenHeader
        title="Verify your account"
        subtitle="Required to invest on the DSE"
      />
      <div className="px-5 pb-8">
        <div className="mb-6 rounded-2xl border border-lenden-mint/20 bg-lenden-mint/5 p-4">
          <p className="text-sm font-semibold text-white">Almost there</p>
          <p className="mt-1 text-xs text-lenden-muted">
            Complete verification to unlock buying and selling. Your data is encrypted and secure.
          </p>
          <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-lenden-border">
            <div className="h-full w-1/2 rounded-full bg-lenden-mint" />
          </div>
          <p className="mt-1.5 text-[10px] text-lenden-muted">2 of 4 steps complete</p>
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
            Complete Verification
          </Button>
        </div>
      </div>
    </>
  )
}
