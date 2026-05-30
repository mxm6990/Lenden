import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { formatBDT, getStock } from '../data/stocks'
import { fetchSecurityQuote, formatMarketCap, formatRatio, formatVolume } from '../services/securityApi'
import { fetchUserPosition } from '../services/positionApi'
import type { SecurityQuote } from '../types/security'
import type { UserPosition } from '../types/position'
import { YourPositionSection } from '../components/portfolio/YourPositionSection'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { StockHistoryChart } from '../components/charts/StockHistoryChart'
import { ScreenHeader } from '../components/layout/ScreenHeader'
import { BetaScreenLabels, MarketDataNotice, PrototypeBanner } from '../components/trust/ComplianceCopy'

const ACTION_BAR_BUTTON_CLASS = 'h-11 w-full'

function QuoteMetric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-[10px] font-medium text-lenden-muted">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-white">{value}</p>
    </Card>
  )
}

function SellActionSlot({
  positionLoading,
  canSell,
  onSell,
}: {
  positionLoading: boolean
  canSell: boolean
  onSell: () => void
}) {
  return (
    <div className={`min-w-0 flex-1 ${ACTION_BAR_BUTTON_CLASS}`}>
      {positionLoading ? (
        <button
          type="button"
          disabled
          className={`inline-flex ${ACTION_BAR_BUTTON_CLASS} items-center justify-center rounded-2xl border border-white/10 bg-lenden-surface/60 px-3 text-xs font-semibold text-lenden-muted`}
        >
          Checking position…
        </button>
      ) : canSell ? (
        <Button variant="outline" size="md" className={ACTION_BAR_BUTTON_CLASS} onClick={onSell}>
          Sell
        </Button>
      ) : (
        <div className={ACTION_BAR_BUTTON_CLASS} aria-hidden />
      )}
    </div>
  )
}

export function StockDetailScreen() {
  const {
    selectedStockId,
    closeOverlay,
    startBuy,
    startSell,
    watchlist,
    toggleWatchlist,
    portfolioVersion,
    isDemo,
  } = useApp()
  const stock = selectedStockId ? getStock(selectedStockId) : null
  const [quote, setQuote] = useState<SecurityQuote | null>(null)
  const [position, setPosition] = useState<UserPosition | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(true)
  const [positionLoading, setPositionLoading] = useState(true)
  const [canSell, setCanSell] = useState(false)

  useEffect(() => {
    if (!selectedStockId) return

    let cancelled = false
    setQuoteLoading(true)

    fetchSecurityQuote(selectedStockId)
      .then((quoteData) => {
        if (!cancelled) setQuote(quoteData)
      })
      .finally(() => {
        if (!cancelled) setQuoteLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedStockId])

  useEffect(() => {
    if (!selectedStockId) return

    let cancelled = false
    setPositionLoading(true)
    setCanSell(false)

    fetchUserPosition(selectedStockId)
      .then((positionData) => {
        if (cancelled) return
        setPosition(positionData)
        setCanSell(Boolean(positionData && positionData.sharesOwned > 0))
      })
      .finally(() => {
        if (!cancelled) setPositionLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedStockId, portfolioVersion])

  if (!stock) return null

  const inWatchlist = watchlist.includes(stock.id)
  const displayQuote = quote ?? {
    lastPrice: stock.price,
    change: stock.change,
    changePct: stock.changePct,
  }

  const quoteMetrics = quote
    ? [
        { label: 'Value', value: formatBDT(quote.value) },
        { label: 'Volume', value: formatVolume(quote.volume) },
        { label: 'Avg volume', value: formatVolume(quote.averageVolume) },
        { label: 'Open', value: formatBDT(quote.open) },
        { label: "Today's high", value: formatBDT(quote.dayHigh) },
        { label: "Today's low", value: formatBDT(quote.dayLow) },
        { label: 'Market cap', value: formatMarketCap(quote.marketCap) },
        { label: '52-week high', value: formatBDT(quote.week52High) },
        { label: '52-week low', value: formatBDT(quote.week52Low) },
        { label: 'P/E ratio', value: formatRatio(quote.peRatio) },
        { label: 'Dividend yield', value: formatRatio(quote.dividendYield, '%') },
      ]
    : []

  return (
    <>
      <ScreenHeader title={stock.ticker} subtitle={stock.name} onBack={closeOverlay} />
      <div className="px-5 pb-28">
        <PrototypeBanner className="mb-4" />
        <BetaScreenLabels isDemo={isDemo} className="mb-3" />
        <MarketDataNotice className="mb-4" />
        <div className="mb-4">
          <p className="text-3xl font-bold tabular-nums text-white">
            {formatBDT(displayQuote.lastPrice)}
          </p>
          <div className="mt-1">
            <span
              className={`text-sm font-semibold tabular-nums ${displayQuote.change >= 0 ? 'text-lenden-mint' : 'text-red-400'}`}
            >
              {displayQuote.change >= 0 ? '+' : ''}
              {displayQuote.change.toFixed(2)} ({displayQuote.change >= 0 ? '+' : ''}
              {displayQuote.changePct.toFixed(2)}%) today
            </span>
          </div>
        </div>

        <StockHistoryChart ticker={stock.ticker} className="mb-4" />

        {quoteLoading ? (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-lenden-card" />
            ))}
          </div>
        ) : (
          <div className="mb-4 grid grid-cols-2 gap-2">
            {quoteMetrics.map((m) => (
              <QuoteMetric key={m.label} label={m.label} value={m.value} />
            ))}
          </div>
        )}

        {!positionLoading && position && (
          <YourPositionSection position={position} className="mb-6" />
        )}

        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-white">About</p>
          <p className="text-sm leading-relaxed text-lenden-muted">{stock.about}</p>
        </div>

        <div className="fixed right-0 bottom-0 left-0 mx-auto max-w-[430px] border-t border-white/5 bg-lenden-black/95 px-5 pt-3 pb-8 backdrop-blur-xl">
          <div className="flex items-stretch gap-3">
            <Button
              variant="secondary"
              size="md"
              className={`min-w-0 flex-1 ${ACTION_BAR_BUTTON_CLASS}`}
              onClick={() => toggleWatchlist(stock.id)}
            >
              {inWatchlist ? (
                <>
                  <BookmarkCheck className="h-4 w-4 text-lenden-mint" />
                  Watching
                </>
              ) : (
                <>
                  <Bookmark className="h-4 w-4" />
                  Watchlist
                </>
              )}
            </Button>
            <SellActionSlot
              positionLoading={positionLoading}
              canSell={canSell}
              onSell={() => startSell(stock.id)}
            />
            <Button
              size="md"
              className={`min-w-0 flex-[1.4] ${ACTION_BAR_BUTTON_CLASS}`}
              onClick={() => startBuy(stock.id)}
            >
              Buy {stock.ticker}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
