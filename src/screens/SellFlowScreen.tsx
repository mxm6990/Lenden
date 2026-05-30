import { CheckCircle2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatBDT } from '../data/stocks'
import { parseSharesInput } from '../lib/parseAmountInput'
import { getPortfolioBundle } from '../services/portfolioApi'
import {
  previewSellOrder,
  submitMockSell,
  type OrderFailureReason,
} from '../services/tradingApi'
import { getStockById } from '../services/marketApi'
import { getTradeQuoteDisplay, type TradeQuoteDisplay } from '../lib/tradeQuote'
import type { MockOrderReceipt } from '../types/trading'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { BetaScreenLabels, PrototypeBanner } from '../components/trust/ComplianceCopy'
import { TrustState } from '../components/trust/TrustState'

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
    message: 'We could not prepare your sell preview. Please try again.',
  },
  confirmation_timeout: {
    title: 'Confirmation timed out',
    message: 'The mock order confirmation took too long. No order was placed.',
  },
  order_rejected: {
    title: 'Mock order rejected',
    message: 'This demonstration order was rejected. No real securities were sold.',
  },
  auth_required: {
    title: 'Sign in required',
    message: 'Sign in with your account to place persistent mock orders.',
  },
  persist_failed: {
    title: 'Could not save order',
    message: 'Something went wrong while saving your mock sell.',
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

function formatSignedBdt(value: number): string {
  const prefix = value >= 0 ? '+' : ''
  return `${prefix}${formatBDT(Math.abs(value))}`
}

export function SellFlowScreen() {
  const {
    selectedStockId,
    sellStep,
    setSellStep,
    closeOverlay,
    isDemo,
    refreshAllUserData,
    portfolioVersion,
  } = useApp()

  const [stock, setStock] = useState<Awaited<ReturnType<typeof getStockById>>>(null)
  const [tradeQuote, setTradeQuote] = useState<TradeQuoteDisplay | null>(null)
  const [sharesOwned, setSharesOwned] = useState(0)
  const [avgCost, setAvgCost] = useState(0)
  const [sharesInput, setSharesInput] = useState('')
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewSellOrder>> | null>(null)
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
    if (!selectedStockId) return
    getPortfolioBundle().then((bundle) => {
      const holding = bundle.holdings.find((h) => h.stockId === selectedStockId)
      setSharesOwned(holding?.shares ?? 0)
      setAvgCost(holding?.avgCost ?? 0)
    })
  }, [selectedStockId, portfolioVersion, sellStep])

  if (!stock) return null

  const parsedShares = parseSharesInput(sharesInput)
  const showPreview = sellStep === 'confirm' && preview && preview.ok

  const handleContinue = async () => {
    setFailure(null)
    setErrorMessage(null)
    setPreview(null)

    if (!sharesInput.trim()) {
      setErrorMessage('Enter the number of shares to sell.')
      return
    }

    if (parsedShares === null || parsedShares <= 0) {
      setErrorMessage('Enter a valid share amount greater than zero.')
      return
    }

    if (parsedShares > sharesOwned) {
      setFailure('insufficient_shares')
      setErrorMessage(`You only own ${sharesOwned} shares.`)
      return
    }

    const result = await previewSellOrder(stock.id, parsedShares)
    setPreview(result)

    if (!result.ok) {
      setFailure(result.reason)
      setErrorMessage(result.errorMessage ?? FAILURE_COPY[result.reason].message)
      return
    }

    setSellStep('confirm')
  }

  const handleConfirm = async () => {
    if (!parsedShares || parsedShares <= 0) return

    setSubmitting(true)
    setFailure(null)
    setErrorMessage(null)

    const result = await submitMockSell(stock.id, parsedShares)
    setSubmitting(false)

    if (!result.ok) {
      setFailure(result.reason)
      setErrorMessage(result.errorMessage ?? FAILURE_COPY[result.reason].message)
      return
    }

    setReceipt(result.receipt)
    await refreshAllUserData()
    setSellStep('success')
  }

  if (sellStep === 'success' && receipt) {
    return (
      <div className="px-5 pb-8 pt-4">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-lenden-mint/15">
              <CheckCircle2 className="h-8 w-8 text-lenden-mint" />
            </div>
            <h2 className="text-2xl font-bold text-white">Mock sell filled</h2>
            <p className="mt-1 text-sm text-lenden-muted">Status: Mock Filled</p>
          </div>

          <Card className="mb-4 space-y-3 p-5">
            <ReceiptRow label="Order ID" value={receipt.orderId.slice(0, 8) + '…'} />
            <ReceiptRow label="Ticker" value={receipt.ticker} />
            <ReceiptRow label="Side" value={receipt.side.toUpperCase()} />
            <ReceiptRow label="Shares sold" value={`${receipt.estimatedShares}`} />
            <ReceiptRow label="Price used" value={formatBDT(receipt.priceUsed)} />
            <ReceiptRow label="Gross proceeds" value={formatBDT(receipt.grossProceeds ?? 0)} />
            <ReceiptRow label="Fees" value={formatBDT(receipt.fees)} />
            <ReceiptRow label="Net proceeds" value={formatBDT(receipt.netProceeds ?? receipt.totalRequired)} />
            <ReceiptRow label="Cost basis" value={formatBDT(receipt.costBasis ?? 0)} />
            <ReceiptRow
              label="Realized gain/loss"
              value={formatSignedBdt(receipt.realizedGainLoss ?? 0)}
            />
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
        title={`Sell ${stock.ticker}`}
        onBack={sellStep === 'confirm' ? () => setSellStep('amount') : closeOverlay}
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
          <p className="text-sm font-medium text-lenden-muted">Your position</p>
          <p className="mt-1 text-3xl font-bold tabular-nums text-white">
            {sharesOwned.toLocaleString('en-BD')} shares
          </p>
          <p className="mt-1 text-xs text-lenden-muted">Avg cost {formatBDT(avgCost)}</p>
        </Card>

        {sellStep === 'amount' && (
          <>
            <label className="mb-3 block">
              <span className="mb-1.5 block text-xs font-medium text-lenden-muted">
                Shares to sell
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={sharesInput}
                placeholder="Enter shares"
                onChange={(e) => {
                  setSharesInput(e.target.value)
                  setErrorMessage(null)
                  setFailure(null)
                }}
                className="w-full rounded-2xl border border-white/10 bg-lenden-card py-4 px-4 text-2xl font-bold text-white outline-none placeholder:text-lenden-muted/50 focus:border-lenden-mint/40"
              />
            </label>

            <div className="mb-5 flex flex-wrap gap-2">
              {[0.25, 0.5, 1].map((fraction) => {
                const preset =
                  fraction === 1
                    ? sharesOwned
                    : Math.floor(sharesOwned * fraction * 100) / 100
                if (preset <= 0) return null
                return (
                  <button
                    key={fraction}
                    type="button"
                    onClick={() => setSharesInput(String(preset))}
                    className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${
                      parsedShares === preset
                        ? 'bg-lenden-mint text-lenden-black'
                        : 'bg-lenden-surface text-lenden-muted'
                    }`}
                  >
                    {fraction === 1 ? 'Sell all' : `${fraction * 100}%`}
                  </button>
                )
              })}
            </div>

            <Button fullWidth size="lg" onClick={handleContinue} disabled={sharesOwned <= 0}>
              Preview sell
            </Button>
          </>
        )}

        {showPreview && (
          <>
            <Card className="mb-4 space-y-3 p-5">
              <p className="text-sm font-semibold text-white">Sell preview</p>
              <ReceiptRow label="Shares to sell" value={`${preview.preview.sharesToSell}`} />
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
              <ReceiptRow label="Gross proceeds" value={formatBDT(preview.preview.grossProceeds)} />
              <ReceiptRow label="Estimated fees" value={formatBDT(preview.preview.feeBdt)} />
              <ReceiptRow label="Net proceeds" value={formatBDT(preview.preview.netProceeds)} />
              <ReceiptRow label="Cost basis" value={formatBDT(preview.preview.costBasis)} />
              <ReceiptRow
                label="Est. realized gain/loss"
                value={formatSignedBdt(preview.preview.realizedGainLoss)}
              />
              <ReceiptRow
                label="Buying power after sell"
                value={formatBDT(preview.buyingPowerAfter)}
              />
            </Card>

            <p className="mb-4 text-center text-[11px] leading-relaxed text-lenden-muted">
              Mock trading only — no real order is submitted. Not financial advice.
            </p>

            <Button fullWidth size="lg" disabled={submitting} onClick={handleConfirm}>
              {submitting ? 'Confirming…' : 'Confirm mock sell'}
            </Button>
          </>
        )}
      </div>
    </>
  )
}
