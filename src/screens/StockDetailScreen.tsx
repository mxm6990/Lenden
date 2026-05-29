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

function QuoteMetric({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-3">
      <p className="text-[10px] font-medium text-lenden-muted">{label}</p>
      <p className="mt-0.5 text-sm font-bold tabular-nums text-white">{value}</p>
    </Card>
  )
}

export function StockDetailScreen() {
  const { selectedStockId, closeOverlay, startBuy, watchlist, toggleWatchlist, portfolioVersion } =
    useApp()
  const stock = selectedStockId ? getStock(selectedStockId) : null
  const [quote, setQuote] = useState<SecurityQuote | null>(null)
  const [position, setPosition] = useState<UserPosition | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!selectedStockId) return

    let cancelled = false
    setLoading(true)

    Promise.all([fetchSecurityQuote(selectedStockId), fetchUserPosition(selectedStockId)])
      .then(([quoteData, positionData]) => {
        if (cancelled) return
        setQuote(quoteData)
        setPosition(positionData)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
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

        {loading ? (
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

        {!loading && position && (
          <YourPositionSection position={position} className="mb-6" />
        )}

        <div className="mb-6">
          <p className="mb-2 text-sm font-semibold text-white">About</p>
          <p className="text-sm leading-relaxed text-lenden-muted">{stock.about}</p>
        </div>

        <div className="fixed right-0 bottom-0 left-0 mx-auto max-w-[430px] border-t border-white/5 bg-lenden-black/95 px-5 pt-3 pb-8 backdrop-blur-xl">
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
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
            <Button className="flex-[2]" size="lg" onClick={() => startBuy(stock.id)}>
              Buy {stock.ticker}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
