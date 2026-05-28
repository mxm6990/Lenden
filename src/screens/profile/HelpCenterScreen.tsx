import { useApp } from '../../context/AppContext'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { COMPLIANCE_COPY } from '../../components/trust/ComplianceCopy'
import { ProfileScreenLayout } from './ProfileScreenLayout'

const FAQ_CATEGORIES = [
  {
    title: 'Account setup',
    items: ['Creating your Lenden account', 'Demo vs full registration', 'Updating profile details'],
  },
  {
    title: 'KYC & BO account',
    items: ['What is KYC?', 'NID verification steps', 'Opening a CDBL BO account'],
  },
  {
    title: 'Deposits & withdrawals',
    items: ['Linking bKash or bank (prototype)', 'Funding timeline expectations', 'Withdrawal placeholders'],
  },
  {
    title: 'Market data',
    items: ['DSE trading hours', 'Delayed data notice', 'Understanding DSEX index'],
  },
  {
    title: 'Investing basics',
    items: ['What is a share?', 'Portfolio diversification', 'Reading stock detail metrics'],
  },
]

interface HelpCenterScreenProps {
  onBack: () => void
}

export function HelpCenterScreen({ onBack }: HelpCenterScreenProps) {
  const { openProfileRoute } = useApp()

  return (
    <ProfileScreenLayout title="Help Center" subtitle="Support resources" onBack={onBack}>
      <div className="space-y-4">
        {FAQ_CATEGORIES.map((category) => (
          <Card key={category.title} className="p-4">
            <p className="mb-2 text-sm font-semibold text-white">{category.title}</p>
            <ul className="space-y-1.5">
              {category.items.map((item) => (
                <li key={item} className="text-xs leading-relaxed text-lenden-muted">
                  · {item}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <Card className="mt-4 p-4">
        <p className="text-sm text-lenden-muted">
          {COMPLIANCE_COPY.notFinancialAdvice} Support content is for prototype onboarding only.
        </p>
        <Button fullWidth className="mt-4" onClick={() => openProfileRoute('support-ticket')}>
          Contact support
        </Button>
      </Card>
    </ProfileScreenLayout>
  )
}
