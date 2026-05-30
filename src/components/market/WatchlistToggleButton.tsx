import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useApp } from '../../context/AppContext'

interface WatchlistToggleButtonProps {
  ticker: string
  className?: string
}

export function WatchlistToggleButton({ ticker, className = '' }: WatchlistToggleButtonProps) {
  const { isInWatchlist, isWatchlistPersisting, toggleWatchlist } = useApp()
  const saved = isInWatchlist(ticker)
  const pending = isWatchlistPersisting(ticker)

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? `Remove ${ticker} from watchlist` : `Add ${ticker} to watchlist`}
      disabled={pending}
      onClick={() => toggleWatchlist(ticker)}
      className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-lenden-surface text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {saved ? (
        <BookmarkCheck className="h-5 w-5 text-lenden-mint" aria-hidden />
      ) : (
        <Bookmark className="h-5 w-5" aria-hidden />
      )}
    </button>
  )
}
