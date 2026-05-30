import { CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatBDT } from '../data/stocks'
import { parseAmountInput } from '../lib/parseAmountInput'
import {
  previewOrder,
  submitMockOrder,
  type OrderFailureReason,
} from '../services/tradingApi'
import { getBuyingPowerResult } from '../services/portfolioApi'
import { getStockById } from '../services/marketApi'
import { getTradeQuoteDisplay, type TradeQuoteDisplay } from '../lib/tradeQuote'
import type { MockOrderReceipt } from '../types/trading'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { BetaScreenLabels, PrototypeBanner } from '../components/trust/ComplianceCopy'
import { TrustState } from '../components/trust/TrustState'

const PRESET_AMOUNTS = [500, 1000, 2500, 5000]

const FAILURE_COPY: Record<OrderFailureReason, { title: string; message: string }> = {
  insufficient_buying_power: {
    title: 'Not enough buying power',
    message: 'This order exceeds your buying power.',
  },
  insufficient_shares: {
    title: 'Not enough shares',
    message: 'You cannot sell more shares than you own.',
  },
  market_closed: {
    title: 'Market closed',
    message: 'DSE is closed. Mock orders can only be placed during trading hours in this prototype.',
  },
  preview_failed: {
    title: 'Could not preview order',
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
  auth_required: {
    title: 'Sign in required',
    message: 'Sign in with your account to place persistent mock orders.',
  },
  persist_failed: {
    title: 'Could not save order',
    message: 'Something went wrong while saving your mock order.',
  },
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-lenden-muted">{label}</span>
      <span className="text-right font-semibold text-white">{value}</span>
    </div>
  )
}

export function BuyFlowScreen() {
  const {
    selectedStockId,
    buyStep,
    setBuyStep,
    closeOverlay,
    isDemo,
    refreshAllUserData,
    portfolioVersion,
  } = useApp()

  const [stock, setStock] = useState<Awaited<ReturnType<typeof getStockById>>>(null)
  const [tradeQuote, setTradeQuote] = useState<TradeQuoteDisplay | null>(null)
  const [buyingPower, setBuyingPower] = useState(0)
  const [buyingPowerError, setBuyingPowerError] = useState<string | null>(null)
  const [amountInput, setAmountInput] = useState('')
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewOrder>> | null>(null)
  const [failure, setFailure] = useState<OrderFailureReason | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [receipt, setReceipt] = useState<MockOrderReceipt | null>(null)

  useEffect(() => {
    if (!selectedStockId) return
    Promise.all([getStockById(selectedStockId), getTradeQuoteDisplay(selectedStockId)]).then(
      ([stockData, quoteData]) => {
        setStock(stockData)
        setTradeQuote(quoteData)
      },
    )
  }, [selectedStockId])

  useEffect(() => {
    getBuyingPowerResult().then((result) => {
      if (result.error) {
        setBuyingPowerError(result.error)
        setBuyingPower(0)
        return
      }
      setBuyingPowerError(null)
      setBuyingPower(result.data.available)
    })
  }, [portfolioVersion, buyStep])

  if (!stock) return null

  const parsedAmount = parseAmountInput(amountInput)
  const showPreview = buyStep === 'confirm' && preview && preview.ok

  const handleContinue = async () => {
    setFailure(null)
    setErrorMessage(null)
    setPreview(null)

    if (!amountInput.trim()) {
      setErrorMessage('Enter an amount to invest.')
      return
    }

    if (parsedAmount === null || parsedAmount <= 0) {
      setErrorMessage('Enter a valid amount greater than zero.')
      return
    }

    if (parsedAmount > buyingPower) {
      setFailure('insufficient_buying_power')
      setErrorMessage('This order exceeds your buying power.')
      return
    }

    const result = await previewOrder(
      { stockId: stock.id, side: 'buy', amountBdt: parsedAmount },
      buyingPower,
    )

    setPreview(result)
    if (!result.ok) {
      setFailure(result.reason)
      setErrorMessage(result.errorMessage ?? FAILURE_COPY[result.reason].message)
      return
    }

    setBuyStep('confirm')
  }

  const handleConfirm = async () => {
    if (!parsedAmount || parsedAmount <= 0) return

    setSubmitting(true)
    setFailure(null)
    setErrorMessage(null)

    const result = await submitMockOrder({
      previewId: 'mock_preview',
      stockId: stock.id,
      side: 'buy',
      amountBdt: parsedAmount,
    })

    setSubmitting(false)

    if (!result.ok) {
      setFailure(result.reason)
      setErrorMessage(result.errorMessage ?? FAILURE_COPY[result.reason].message)
      return
    }

    setReceipt(result.receipt)
    setBuyingPower(result.receipt.buyingPowerAfter)
    await refreshAllUserData()
    setBuyStep('success')
  }

  if (buyStep === 'success' && receipt) {
    return (
      <div className="px-5 pb-8 pt-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lenden-mint/15">
              <CheckCircle2 className="h-8 w-8 text-lenden-mint" />
            </div>
            <h2 className="text-2xl font-bold text-white">Mock order filled</h2>
            <p className="mt-1 text-sm text-lenden-muted">Status: Mock Filled</p>
          </div>

          <Card className="mb-4 space-y-3 p-5">
            <ReceiptRow label="Order ID" value={receipt.orderId.slice(0, 8) + '…'} />
            <ReceiptRow label="Ticker" value={receipt.ticker} />
            <ReceiptRow label="Side" value={receipt.side.toUpperCase()} />
            <ReceiptRow label="Amount invested" value={formatBDT(receipt.amountInvested)} />
            <ReceiptRow label="Estimated shares" value={`~${receipt.estimatedShares}`} />
            <ReceiptRow label="Price used" value={formatBDT(receipt.priceUsed)} />
            <ReceiptRow label="Fees" value={formatBDT(receipt.fees)} />
            <ReceiptRow label="Total required" value={formatBDT(receipt.totalRequired)} />
            <ReceiptRow label="Buying power after" value={formatBDT(receipt.buyingPowerAfter)} />
            <ReceiptRow
              label="Timestamp"
              value={new Date(receipt.timestamp).toLocaleString('en-GB', {
                dateStyle: 'medium',
                timeStyle: 'short',
              })}
            />
          </Card>

          <p className="mb-6 text-center text-[11px] leading-relaxed text-lenden-muted">
            Mock order only — no real securities transaction occurred.
          </p>

          <Button fullWidth size="lg" onClick={closeOverlay}>
            Back to Home
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <>
      <ScreenHeader
        title={`Buy ${stock.ticker}`}
        onBack={buyStep === 'confirm' ? () => setBuyStep('amount') : closeOverlay}
      />
      <div className="px-5 pb-8">
        <PrototypeBanner className="mb-4" />
        <BetaScreenLabels isDemo={isDemo} className="mb-3" />

        {(failure || errorMessage) && (
          <TrustState
            variant="warning"
            title={failure ? FAILURE_COPY[failure].title : 'Check your order'}
            message={errorMessage ?? (failure ? FAILURE_COPY[failure].message : '')}
            className="mb-4"
          />
        )}

        {buyingPowerError && (
          <TrustState
            variant="error"
            title="Buying power unavailable"
            message={buyingPowerError}
            className="mb-4"
          />
        )}

        <Card className="mb-4 p-5">
          <p className="text-sm font-medium text-lenden-muted">Current price</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-white">
            {formatBDT(tradeQuote?.lastPrice ?? stock.price)}
          </p>
          <p className="mt-1 text-xs text-lenden-muted">
            Source: {tradeQuote?.sourceLabel ?? 'Prototype Data'}
            {tradeQuote?.asOf
              ? ` · Updated ${new Date(tradeQuote.asOf).toLocaleString('en-GB', {
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}`
              : ''}
          </p>
        </Card>

        <Card className="mb-4 p-5">
          <p className="text-sm font-medium text-lenden-muted">Buying Power</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-white">{formatBDT(buyingPower)}</p>
          <p className="mt-1 text-xs text-lenden-muted">Available to invest in this prototype</p>
        </Card>

        {buyStep === 'amount' && (
          <>
            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-medium text-lenden-muted">
                Amount to invest (BDT)
              </span>
              <div className="relative">
                <span className="absolute top-1/2 left-4 -translate-y-1/2 text-lg font-bold text-lenden-muted">
                  ৳
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountInput}
                  placeholder="Enter amount"
                  onChange={(e) => {
                    setAmountInput(e.target.value)
                    setErrorMessage(null)
                    setFailure(null)
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-lenden-card py-4 pr-4 pl-10 text-2xl font-bold text-white outline-none placeholder:text-lenden-muted/50 focus:border-lenden-mint/40"
                />
              </div>
            </label>

            <div className="mb-5 flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmountInput(String(amt))}
                  className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                    parsedAmount === amt
                      ? 'bg-lenden-mint text-lenden-black'
                      : 'bg-lenden-surface text-lenden-muted'
                  }`}
                >
                  ৳{amt.toLocaleString()}
                </button>
              ))}
            </div>

            <Button fullWidth size="lg" onClick={handleContinue}>
              Preview order
            </Button>
          </>
        )}

        {showPreview && (
          <>
            <Card className="mb-4 space-y-3 p-5">
              <p className="text-sm font-semibold text-white">Order preview</p>
              <ReceiptRow label="Amount to invest" value={formatBDT(preview.preview.amountBdt)} />
              <ReceiptRow label="Estimated shares" value={`~${preview.preview.estimatedShares}`} />
              <ReceiptRow label="Estimated price" value={formatBDT(preview.preview.pricePerShare)} />
              <ReceiptRow label="Price source" value={tradeQuote?.sourceLabel ?? 'Prototype Data'} />
              {tradeQuote?.asOf && (
                <ReceiptRow
                  label="Quote updated"
                  value={new Date(tradeQuote.asOf).toLocaleString('en-GB', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                />
              )}
              <ReceiptRow label="Estimated fees" value={formatBDT(preview.preview.feeBdt)} />
              <ReceiptRow label="Total required" value={formatBDT(preview.preview.totalBdt)} />
              <ReceiptRow
                label="Buying power after purchase"
                value={formatBDT(preview.buyingPowerAfter)}
              />
            </Card>

            <p className="mb-4 text-center text-[11px] leading-relaxed text-lenden-muted">
              Mock trading only — no real order is submitted. Not financial advice.
            </p>

            <Button fullWidth size="lg" disabled={submitting} onClick={handleConfirm}>
              {submitting ? 'Confirming…' : 'Confirm mock purchase'}
            </Button>
          </>
        )}
      </div>
    </>
  )
}
