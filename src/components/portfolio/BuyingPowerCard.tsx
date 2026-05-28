import { formatBDT } from '../../data/stocks'
import type { BuyingPower } from '../../data/portfolio'
import { Card } from '../ui/Card'

interface BuyingPowerCardProps {
  buyingPower: BuyingPower
  className?: string
}

export function BuyingPowerCard({ buyingPower, className = '' }: BuyingPowerCardProps) {
  return (
    <Card className={`p-5 ${className}`}>
      <p className="text-sm font-medium text-lenden-muted">Buying power</p>
      <p className="mt-1 text-3xl font-bold tracking-tight tabular-nums text-white">
        {formatBDT(buyingPower.available)}
      </p>
      <p className="mt-1 text-xs leading-snug text-lenden-muted">
        Cash in BO account · available for orders
      </p>
      {buyingPower.reserved > 0 && (
        <p className="mt-2 text-[11px] text-lenden-muted">
          {formatBDT(buyingPower.reserved)} reserved for pending orders
        </p>
      )}
    </Card>
  )
}
