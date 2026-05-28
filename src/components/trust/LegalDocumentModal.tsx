import { X } from 'lucide-react'
import { COMPLIANCE_COPY } from './ComplianceCopy'
import { Button } from '../ui/Button'

interface LegalDocumentModalProps {
  title: string
  open: boolean
  onClose: () => void
}

export function LegalDocumentModal({ title, open, onClose }: LegalDocumentModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/10 bg-lenden-card p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-lenden-muted hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="text-sm leading-relaxed text-lenden-muted">
          {COMPLIANCE_COPY.draftDocument}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-lenden-muted">
          This placeholder represents where finalized legal text would appear after review by
          Bangladeshi legal and compliance experts. {COMPLIANCE_COPY.brokerageRequired}
        </p>
        <Button fullWidth className="mt-6" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  )
}
