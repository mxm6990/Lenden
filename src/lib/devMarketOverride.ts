/**
 * Developer-only DSE market hours override for local testing.
 * Never enable in production — ignored in production builds.
 */

export function isDevMarketOverrideActive(): boolean {
  if (import.meta.env.PROD) return false
  return import.meta.env.VITE_FORCE_DSE_MARKET_OPEN === 'true'
}
