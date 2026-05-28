import { useEffect, useState } from 'react'
import { formatBDT } from '../../data/stocks'
import { getTransactionLabel, type PastTransaction } from '../../data/transactions'
import { getPastTransactions } from '../../services/portfolioApi'
import { TrustState } from '../trust/TrustState'

function transactionTitle(tx: PastTransaction): string {
  if (tx.ticker) {
    const shareLabel = tx.shares ? ` · ${tx.shares} sh` : ''
    return `${getTransactionLabel(tx.type)} ${tx.ticker}${shareLabel}`
  }
  return getTransactionLabel(tx.type)
}

interface PastTransactionsSectionProps {
  limit?: number
  className?: string
}

export function PastTransactionsSection({ limit, className = '' }: PastTransactionsSectionProps) {
  const [transactions, setTransactions] = useState<PastTransaction[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getPastTransactions()
      .then((data) => setTransactions(data ? (limit ? data.slice(0, limit) : data) : null))
      .finally(() => setLoading(false))
  }, [limit])

  if (loading) {
    return (
      <section className={className}>
        <p className="mb-3 text-sm font-semibold text-white">Past transactions</p>
        <div className="h-24 animate-pulse rounded-2xl bg-lenden-card" />
      </section>
    )
  }

  if (transactions === null) {
    return (
      <section className={className}>
        <p className="mb-3 text-sm font-semibold text-white">Past transactions</p>
        <TrustState
          variant="warning"
          title="Transaction history unavailable"
          message="We could not load your recent activity. Your portfolio data may still be available."
        />
      </section>
    )
  }

  return (
    <section className={className}>
      <p className="mb-3 text-sm font-semibold text-white">Past transactions</p>
      <div className="space-y-2">
        {transactions.map((tx) => {
          const positive = tx.amount >= 0
          return (
            <div
              key={tx.id}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5 rounded-2xl border border-white/5 bg-lenden-surface px-3.5 py-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{transactionTitle(tx)}</p>
                {tx.note && (
                  <p className="truncate text-[11px] text-lenden-muted">{tx.note}</p>
                )}
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold tabular-nums whitespace-nowrap ${
                    positive ? 'text-lenden-mint' : 'text-white'
                  }`}
                >
                  {positive ? '+' : ''}
                  {formatBDT(Math.abs(tx.amount))}
                </p>
                <p className="text-[10px] text-lenden-muted">{tx.date}</p>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
