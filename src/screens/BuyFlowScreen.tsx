import { CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatBDT } from '../data/stocks'
import { previewOrder, submitMockOrder, type OrderFailureReason } from '../services/tradingApi'
import { getBuyingPower } from '../services/portfolioApi'
import { getStockById } from '../services/marketApi'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { PrototypeBanner } from '../components/trust/ComplianceCopy'
import { TrustState } from '../components/trust/TrustState'

const PRESET_AMOUNTS = [500, 1000, 2500, 5000]

const FAILURE_COPY: Record<OrderFailureReason, { title: string; message: string }> = {
  insufficient_buying_power: {
    title: 'Insufficient buying power',
    message: 'Your BO account does not have enough available cash for this mock order.',
  },
  market_closed: {
    title: 'Market closed',
    message: 'DSE is closed. Mock orders can only be previewed during trading hours in this prototype.',
  },
  preview_failed: {
    title: 'Order preview failed',
    message: 'We could not prepare your order preview. Please try again.',
  },
  confirmation_timeout: {
    title: 'Confirmation timed out',
    message: 'The mock order confirmation took too long. No order was placed.',
  },
  order_rejected: {
    title: 'Mock order rejected',
    message: 'This demonstration order was rejected. No real securities were purchased.',
  },
}

export function BuyFlowScreen() {
  const {
    selectedStockId,
    buyStep,
    buyAmount,
    setBuyAmount,
    setBuyStep,
    closeOverlay,
  } = useApp()

  const [stock, setStock] = useState<Awaited<ReturnType<typeof getStockById>>>(null)
  const [buyingPowerAvailable, setBuyingPowerAvailable] = useState(0)
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewOrder>> | null>(null)
  const [failure, setFailure] = useState<OrderFailureReason | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedStockId) return
    getStockById(selectedStockId).then(setStock)
    getBuyingPower().then((bp) => setBuyingPowerAvailable(bp?.available ?? 0))
  }, [selectedStockId])

  if (!stock) return null

  const fee = preview && preview.ok ? preview.preview.feeBdt : Math.round(buyAmount * 0.0015 * 100) / 100
  const estimatedShares =
    preview && preview.ok
      ? preview.preview.estimatedShares
      : Math.floor(((buyAmount - fee) / stock.price) * 100) / 100

  const handleReview = async () => {
    setFailure(null)
    const result = await previewOrder(
      { stockId: stock.id, side: 'buy', amountBdt: buyAmount },
      buyingPowerAvailable,
    )
    setPreview(result)
    if (!result.ok) {
      setFailure(result.reason)
      return
    }
    setBuyStep('confirm')
  }

  const handleConfirm = async () => {
    setSubmitting(true)
    setFailure(null)
    const result = await submitMockOrder({
      previewId: 'mock_preview',
      stockId: stock.id,
      side: 'buy',
      amountBdt: buyAmount,
    })
    setSubmitting(false)
    if (!result.ok) {
      setFailure(result.reason)
      return
    }
    setOrderId(result.order.orderId)
    setBuyStep('success')
  }

  if (buyStep === 'success') {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-lenden-mint/15"
        >
          <CheckCircle2 className="h-10 w-10 text-lenden-mint" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white">Mock order placed</h2>
        <p className="mt-2 text-sm text-lenden-muted">
          ~{estimatedShares} shares of {stock.ticker} · {formatBDT(buyAmount)}
        </p>
        {orderId && (
          <p className="mt-1 text-xs text-lenden-muted">Reference: {orderId}</p>
        )}
        <p className="mt-3 text-[11px] text-lenden-muted">Mock trading only — no real order routing.</p>
        <div className="mt-8 w-full space-y-3">
          <Button fullWidth size="lg" onClick={closeOverlay}>
            Back to Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <ScreenHeader
        title={buyStep === 'confirm' ? 'Confirm order' : 'Buy stock'}
        onBack={buyStep === 'confirm' ? () => setBuyStep('amount') : closeOverlay}
      />
      <div className="px-5 pb-8">
        <PrototypeBanner className="mb-4" />

        {failure && (
          <TrustState
            variant="warning"
            title={FAILURE_COPY[failure].title}
            message={FAILURE_COPY[failure].message}
            className="mb-4"
          />
        )}

        <Card className="mb-4 flex items-center gap-3 p-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lenden-green text-xs font-bold text-white">
            {stock.ticker.slice(0, 2)}
          </div>
          <div className="flex-1">
            <p className="font-bold text-white">{stock.ticker}</p>
            <p className="text-xs text-lenden-muted">{formatBDT(stock.price)} per share</p>
          </div>
        </Card>

        {buyStep === 'confirm' ? (
          <>
            <Card className="mb-4 p-5">
              <div className="space-y-3">
                {[
                  { label: 'Order amount', value: formatBDT(buyAmount) },
                  { label: 'Estimated shares', value: `~${estimatedShares}` },
                  { label: 'Price per share', value: formatBDT(stock.price) },
                  { label: 'Trading fee', value: formatBDT(fee) },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-lenden-muted">{row.label}</span>
                    <span className="font-semibold text-white">{row.value}</span>
                  </div>
                ))}
              </div>
            </Card>
            <p className="mb-6 text-center text-[11px] text-lenden-muted">
              Mock trading only. Not financial advice. Review carefully before confirming.
            </p>
            <Button fullWidth size="lg" disabled={submitting} onClick={handleConfirm}>
              {submitting ? 'Confirming…' : 'Confirm mock purchase'}
            </Button>
          </>
        ) : (
          <>
            <div className="mb-5 rounded-2xl border border-white/5 bg-lenden-surface p-4">
              <p className="text-xs text-lenden-muted">Buying power (BO account)</p>
              <p className="text-xl font-bold text-white">{formatBDT(buyingPowerAvailable)}</p>
            </div>

            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-medium text-lenden-muted">Amount (BDT)</span>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-lg font-bold text-lenden-muted">
                  ৳
                </span>
                <input
                  type="number"
                  value={buyAmount}
                  onChange={(e) => setBuyAmount(Number(e.target.value) || 0)}
                  className="w-full rounded-2xl border border-white/10 bg-lenden-card py-4 pr-4 pl-10 text-2xl font-bold text-white outline-none focus:border-lenden-mint/40"
                />
              </div>
            </label>

            <div className="mb-5 flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setBuyAmount(amt)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    buyAmount === amt
                      ? 'bg-lenden-mint text-lenden-black'
                      : 'bg-lenden-surface text-lenden-muted'
                  }`}
                >
                  ৳{amt.toLocaleString()}
                </button>
              ))}
            </div>

            <Button
              fullWidth
              size="lg"
              disabled={buyAmount <= 0 || buyAmount > buyingPowerAvailable}
              onClick={handleReview}
            >
              Review order
            </Button>
          </>
        )}
      </div>
    </>
  )
}
