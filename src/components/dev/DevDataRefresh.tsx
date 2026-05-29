import { useEffect } from 'react'
import { useApp } from '../../context/AppContext'

declare global {
  interface Window {
    __lendenRefreshSupabaseData?: () => Promise<void>
  }
}

/** Development-only control to re-fetch Supabase-backed user data. */
export function DevDataRefresh() {
  const { refreshAllUserData, dataRefreshing, isDemo } = useApp()

  useEffect(() => {
    if (!import.meta.env.DEV) return
    window.__lendenRefreshSupabaseData = refreshAllUserData
    return () => {
      delete window.__lendenRefreshSupabaseData
    }
  }, [refreshAllUserData])

  if (!import.meta.env.DEV || isDemo) return null

  return (
    <button
      type="button"
      onClick={() => void refreshAllUserData()}
      disabled={dataRefreshing}
      className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-3 z-50 rounded-full border border-sky-400/30 bg-sky-500/15 px-3 py-1.5 text-[10px] font-semibold text-sky-200 shadow-lg backdrop-blur-sm disabled:opacity-60"
      aria-label="Refresh Supabase Data"
    >
      {dataRefreshing ? 'Refreshing…' : 'Refresh Supabase Data'}
    </button>
  )
}
