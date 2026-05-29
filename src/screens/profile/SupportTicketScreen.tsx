import { CheckCircle2, Paperclip } from 'lucide-react'
import { useState } from 'react'
import { submitSupportTicket } from '../../services/supportApi'
import type { SupportTicketCategory } from '../../types/profile'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { TrustState } from '../../components/trust/TrustState'
import { ProfileScreenLayout } from './ProfileScreenLayout'

const CATEGORIES: { value: SupportTicketCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'account', label: 'Account' },
  { value: 'transaction', label: 'Transaction' },
  { value: 'dispute', label: 'Dispute' },
  { value: 'recovery', label: 'Account recovery' },
  { value: 'technical', label: 'Technical' },
]

interface SupportTicketScreenProps {
  onBack: () => void
}

export function SupportTicketScreen({ onBack }: SupportTicketScreenProps) {
  const [category, setCategory] = useState<SupportTicketCategory>('general')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ticketId, setTicketId] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return
    setSubmitting(true)
    setFailed(false)
    try {
      const ticket = await submitSupportTicket({
        category,
        subject: subject.trim(),
        description: message.trim(),
      })
      setTicketId(ticket.id)
    } catch {
      setFailed(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (ticketId) {
    return (
      <ProfileScreenLayout title="Support Ticket" subtitle="Contact support" onBack={onBack}>
        <div className="flex flex-col items-center py-8 text-center">
          <CheckCircle2 className="mb-4 h-12 w-12 text-lenden-mint" />
          <p className="text-lg font-bold text-white">Ticket submitted</p>
          <p className="mt-2 text-sm text-lenden-muted">
            Ticket ID: <span className="font-mono text-white">{ticketId}</span>
          </p>
          <p className="mt-2 text-xs text-lenden-muted">
            Your request has been recorded. This prototype does not connect to a live support desk.
          </p>
          <Button fullWidth className="mt-6" onClick={onBack}>
            Back to profile
          </Button>
        </div>
      </ProfileScreenLayout>
    )
  }

  return (
    <ProfileScreenLayout title="Support Ticket" subtitle="Contact support" onBack={onBack}>
      {failed && (
        <TrustState
          variant="error"
          title="Could not submit ticket"
          message="Something went wrong while sending your request. Please try again in a moment."
          className="mb-4"
        />
      )}
      <Card className="space-y-4 p-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-lenden-muted">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
            className="w-full rounded-xl border border-white/10 bg-lenden-surface px-3 py-2.5 text-sm text-white outline-none focus:border-lenden-mint/40"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <Input
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary of your issue"
        />
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-lenden-muted">Message</span>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Describe your issue..."
            className="w-full rounded-xl border border-white/10 bg-lenden-surface px-3 py-2.5 text-sm text-white placeholder:text-lenden-muted outline-none focus:border-lenden-mint/40"
          />
        </label>
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 py-3 text-xs text-lenden-muted"
        >
          <Paperclip className="h-4 w-4" />
          Attach file (placeholder)
        </button>
        <Button
          fullWidth
          disabled={submitting || !subject.trim() || !message.trim()}
          onClick={handleSubmit}
        >
          {submitting ? 'Submitting…' : 'Submit ticket'}
        </Button>
      </Card>
    </ProfileScreenLayout>
  )
}
