import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { formatBDT } from '../../data/stocks'
import { getTransactionLabel, type PastTransaction } from '../../data/transactions'
import { getPastTransactionsResult } from '../../services/portfolioApi'
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
  const { portfolioVersion } = useApp()
  const [transactions, setTransactions] = useState<PastTransaction[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [initialLoad, setInitialLoad] = useState(true)
  const loadSeq = useRef(0)

  useEffect(() => {
    const seq = ++loadSeq.current

    getPastTransactionsResult()
      .then((result) => {
        if (seq !== loadSeq.current) return
        setLoadError(result.error)
        const data = limit ? result.data.slice(0, limit) : result.data
        setTransactions(data)
      })
      .finally(() => {
        if (seq === loadSeq.current) {
          setInitialLoad(false)
        }
      })
  }, [limit, portfolioVersion])

  if (initialLoad) {
    return (
      <section className={className}>
        <p className="mb-3 text-sm font-semibold text-white">Past transactions</p>
        <div className="h-24 animate-pulse rounded-2xl bg-lenden-card" />
      </section>
    )
  }

  if (loadError) {
    return (
      <section className={className}>
        <p className="mb-3 text-sm font-semibold text-white">Past transactions</p>
        <TrustState
          variant="warning"
          title="Transaction history unavailable"
          message={loadError}
        />
      </section>
    )
  }

  if (transactions.length === 0) {
    return (
      <section className={className}>
        <p className="mb-3 text-sm font-semibold text-white">Past transactions</p>
        <TrustState
          variant="empty"
          title="No transactions yet"
          message="Your mock buy and sell activity will appear here."
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
