import type { ReactNode } from 'react'
import { formatBDT } from '../../data/stocks'
import type { UserPosition } from '../../types/position'
import { Card } from '../ui/Card'

interface YourPositionSectionProps {
  position: UserPosition
  className?: string
}

function PositionMetric({
  label,
  value,
  subValue,
}: {
  label: string
  value: string
  subValue?: ReactNode
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-medium text-lenden-muted">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-white">{value}</p>
      {subValue && <div className="mt-0.5 text-xs font-semibold tabular-nums">{subValue}</div>}
    </div>
  )
}

function returnPctLabel(amount: number, pct: number): ReactNode {
  const positive = amount >= 0
  return (
    <span className={positive ? 'text-lenden-mint' : 'text-red-400'}>
      {positive ? '+' : ''}
      {pct.toFixed(2)}%
    </span>
  )
}

export function YourPositionSection({ position, className = '' }: YourPositionSectionProps) {
  const totalPositive = position.totalReturn.amount >= 0
  const todayPositive = position.todayReturn.amount >= 0

  return (
    <section className={className}>
      <p className="mb-3 text-sm font-semibold text-white">Your position</p>
      <Card className="grid grid-cols-2 gap-x-4 gap-y-4 p-4">
        <PositionMetric label="Shares owned" value={position.sharesOwned.toLocaleString('en-BD')} />
        <PositionMetric label="Market value" value={formatBDT(position.marketValue)} />
        <PositionMetric label="Average cost" value={formatBDT(position.averageCost)} />
        <PositionMetric
          label="Portfolio %"
          value={`${position.portfolioWeightPct.toFixed(1)}%`}
        />
        <PositionMetric
          label="Total return"
          value={`${totalPositive ? '+' : ''}${formatBDT(position.totalReturn.amount)}`}
          subValue={returnPctLabel(position.totalReturn.amount, position.totalReturn.pct)}
        />
        <PositionMetric
          label="Today's return"
          value={`${todayPositive ? '+' : ''}${formatBDT(position.todayReturn.amount)}`}
          subValue={returnPctLabel(position.todayReturn.amount, position.todayReturn.pct)}
        />
      </Card>
    </section>
  )
}
