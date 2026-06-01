# Lenden Alpha Readiness Checklist

**Audit date:** 2026-05-27  
**Scope:** Closed alpha (authenticated Supabase users + optional demo mode)  
**Method:** Static codebase audit + `npm run build`. Items marked **NEEDS MANUAL TEST** require a human tester with Supabase configured.

**Legend:** ✅ PASS · ❌ FAIL · 🧪 NEEDS MANUAL TEST

---

## Core User Flow

| Item | Status | Notes |
|------|--------|-------|
| Welcome / splash entry (Create Account, Sign in, Explore Demo) | ✅ PASS | `src/screens/auth/SplashScreen.tsx` — all entry paths wired |
| Sign up with Supabase | 🧪 NEEDS MANUAL TEST | `src/screens/auth/SignUpScreen.tsx`, `src/services/authApi.ts` — email confirmation flow depends on Supabase settings |
| Sign up without Supabase (local prototype) | ✅ PASS | Falls back to KYC placeholder flow |
| Sign in with error handling | ✅ PASS | `SignInScreen.tsx` — `TrustState` for invalid credentials, not configured |
| Session bootstrap on reload | ✅ PASS | `AppContext.tsx` — `getAuthSession()` + `enterWithSupabaseSession()` |
| Demo mode entry | ✅ PASS | `enterDemo()` sets mock user and skips auth |
| KYC placeholder screen | ✅ PASS | `KycScreen.tsx` — skips to app via `completeKyc()` |
| Home portfolio summary | ✅ PASS | `HomeScreen.tsx` — `getPortfolioBundle()`, skeleton + error states |
| Market browse + search | ✅ PASS | `MarketScreen.tsx` |
| Stock detail (quote, chart, buy/sell/watchlist) | ✅ PASS | `StockDetailScreen.tsx` — reserved sell slot, async position check |
| Buy flow (amount → preview → confirm → receipt) | ✅ PASS | `BuyFlowScreen.tsx` — `previewOrder` / `submitMockOrder`, `refreshAllUserData()` |
| Sell flow (shares → preview → confirm → receipt) | ✅ PASS | `SellFlowScreen.tsx` — oversell blocked client + server |
| Portfolio holdings + allocation | ✅ PASS | `PortfolioScreen.tsx`, `AllocationDetailScreen.tsx` |
| Holdings Buy / Sell / View actions | ✅ PASS | `PortfolioScreen.tsx` — `startBuy`, `startSell`, `openStock` |
| Past transactions on Home | ✅ PASS | `PastTransactionsSection.tsx` — empty, error, and list states |
| Profile load + retry | ✅ PASS | `ProfileScreen.tsx` — loading / error / success with Retry |
| Sign out | ✅ PASS | `AppContext.tsx` — `signOutFromSupabase()` + local reset |
| Tab refresh (home/portfolio/profile) | ✅ PASS | `setTab()` bumps `portfolioVersion` / `profileVersion` |

---

## Trust & Compliance

| Item | Status | Notes |
|------|--------|-------|
| Prototype banner on Home, Market, Portfolio | ✅ PASS | `PrototypeBanner` in each screen |
| Prototype banner on Buy / Sell flows | ✅ PASS | Includes inline mock-trading copy on confirm steps |
| Prototype banner on Stock Detail | ✅ PASS | Added in alpha audit fix |
| Welcome screen compliance footer | ✅ PASS | `ComplianceFooter` on splash |
| Demo mode badge when in demo | ✅ PASS | `PrototypeModeBadge` on main authenticated screens |
| Buy/sell receipt mock-only language | ✅ PASS | Success screens state “Mock order filled” |
| Profile sub-route legal copy | ✅ PASS | `ProfileScreenLayout.tsx` — banner + footer |
| Risk disclosure screen | ✅ PASS | `RiskDisclosureScreen.tsx` |
| KYC screen avoids prototype disclaimer | ❌ FAIL | See failures below |
| No implied live brokerage / BSEC approval in trading flows | ✅ PASS | Warnings in preview + banners |

---

## Technical

| Item | Status | Notes |
|------|--------|-------|
| `npm run build` (tsc + vite) | ✅ PASS | Verified 2026-05-27 |
| TypeScript project references | ✅ PASS | `tsc -b` clean |
| Supabase graceful degradation | ✅ PASS | `isSupabaseConfigured()` guards throughout |
| `refreshAllUserData()` after buy/sell | ✅ PASS | Both flows await refresh on success |
| Atomic buy RPC (`submit_mock_buy`) | 🧪 NEEDS MANUAL TEST | Requires migration `004` applied |
| Atomic sell RPC (`submit_mock_sell`) | 🧪 NEEDS MANUAL TEST | Requires migration `005` applied |
| Oversell protection (RPC + UI) | ✅ PASS | `tradingApi.ts`, `SellFlowScreen.tsx`, disabled Sell when shares ≤ 0 |
| Auth profile recovery on missing row | ✅ PASS | `profileApi.ts` — insert recovery path |
| Portfolio bundle single source of truth | ✅ PASS | `getPortfolioBundle()` used by Home/Portfolio/Allocation |
| Authenticated reads do not silently fall back to mock | ✅ PASS | `portfolioApi.ts` — surfaces `error` for Supabase failures |
| Audit log duplicate suppression | ✅ PASS | `auditApi.ts` — in-flight dedupe |
| Dev-only market override | ✅ PASS | `VITE_FORCE_DSE_MARKET_OPEN` (dev builds only) |
| Debug console logs in sell RPC path | ❌ FAIL | See failures below |

---

## Mobile UX

| Item | Status | Notes |
|------|--------|-------|
| Mobile-first layout (~430px web shell) | ✅ PASS | `App.tsx`, `AppShell.tsx` |
| Capacitor iOS scripts present | ✅ PASS | `package.json` — `ios:run`, `ios:sync` |
| iOS simulator run | 🧪 NEEDS MANUAL TEST | Requires Xcode + simulator runtime |
| Bottom nav + safe area padding | ✅ PASS | `BottomNav.tsx`, `safe-bottom-lg` |
| Stock detail sell button — no layout shift | ✅ PASS | Reserved slot + “Checking position…” skeleton |
| Loading skeletons (Home, Portfolio, Profile) | ✅ PASS | `LoadingSkeleton`, pulse placeholders |
| Error states — Home portfolio | ✅ PASS | `TrustState` for portfolio + buying power errors |
| Error states — Portfolio tab | ✅ PASS | `TrustState` for bundle errors |
| Error states — Profile | ✅ PASS | Error + Retry button |
| Error states — Buy flow buying power | ✅ PASS | Added in alpha audit fix |
| Error states — Past transactions | ✅ PASS | Warning + empty states |
| Portfolio holding action hierarchy (Buy/Sell/View) | ✅ PASS | Primary / outline / secondary variants |

---

## Supabase / Data

| Item | Status | Notes |
|------|--------|-------|
| `.env.example` documents required vars | ✅ PASS | URL, anon key, market override, data mode |
| `npm run supabase:check` script | ✅ PASS | `scripts/check-supabase.mjs` |
| Migration docs in `supabase/README.md` | ✅ PASS | Covers 001–005 |
| Root `README.md` migration steps | ❌ FAIL | Still references only `001_profiles.sql` |
| Signup profile sync trigger | 🧪 NEEDS MANUAL TEST | Migrations 001 + 002 |
| Persistent holdings / transactions (003) | 🧪 NEEDS MANUAL TEST | Must be applied for auth trading |
| Atomic buy (004) + sell (005) | 🧪 NEEDS MANUAL TEST | Required for persistent mock orders |
| RLS policies on user tables | ✅ PASS | Defined in migrations |
| Demo mode portfolio after buy/sell | ❌ FAIL | Demo trades do not mutate mock holdings — see failures |
| Realized P&L from sell transactions | 🧪 NEEDS MANUAL TEST | Requires migration 005 + sell flow |

---

## Known Blockers

| Item | Status | Notes |
|------|--------|-------|
| DSE market-hours gate on orders | ❌ FAIL | Buy/sell rejected when DSE status ≠ Open unless dev override |
| All Supabase migrations applied in target project | 🧪 NEEDS MANUAL TEST | Operational prerequisite |
| Email confirmation enabled in Supabase | 🧪 NEEDS MANUAL TEST | Can block sign-in after signup |
| Learn tab disabled | ✅ PASS (intentional) | Commented out in `App.tsx` — not an alpha blocker |
| Admin dashboard disabled | ✅ PASS (intentional) | Dev concept only |

---

## Failures — Detail & Recommended Fixes

### ❌ KYC screen lacks prototype disclaimer

- **File:** `src/screens/auth/KycScreen.tsx`
- **Why:** Copy says “Required to invest on the DSE” without mock/prototype qualifier — could imply live brokerage.
- **Recommended fix:** Add `PrototypeBanner` or one-line “Prototype — verification is simulated” above the steps. No code change required for closed alpha if testers use Explore Demo or skip KYC quickly; fix before public beta.

### ❌ Debug console logs in production sell path

- **File:** `src/services/tradingApi.ts` (`submitMockSellViaRpc`)
- **Why:** `console.group` / `console.log` with user IDs runs on every authenticated sell.
- **Recommended fix:** Wrap in `import.meta.env.DEV` guard or remove before production. Not a closed-alpha functional blocker.

### ❌ Root README migration steps outdated

- **File:** `README.md`
- **Why:** Documents only migration 001; alpha requires 003–005 for trading.
- **Recommended fix:** Point to `supabase/README.md` sections 7–10. Documentation-only.

### ❌ Demo mode trades do not update portfolio UI

- **Files:** `src/services/tradingApi.ts` (`submitDemoMockOrder`, `submitDemoMockSell`), `src/services/portfolioApi.ts` (demo source uses static mock data)
- **Why:** Demo orders append to in-memory `orderHistory` but holdings/buying power always come from static mocks (`data/portfolio.ts`). After buy/sell in demo, Home/Portfolio holdings unchanged.
- **Recommended fix:** Either document “demo trades are receipt-only” for alpha testers, or wire demo order state into a module-level demo portfolio store. **Closed alpha should prefer authenticated Supabase testers.**

### ❌ DSE market-hours gate blocks orders outside trading window

- **Files:** `src/services/tradingApi.ts`, `src/data/dseMarket.ts`
- **Why:** `getDSEMarketInfo().status !== 'Open'` returns `market_closed`. Alpha testers outside Sun–Thu 10:00–14:30 Asia/Dhaka cannot place orders.
- **Recommended fix:** For alpha cohort, set `VITE_FORCE_DSE_MARKET_OPEN=true` in `.env.local` (dev builds) or schedule manual tests during market hours. Document in alpha test script.

---

## Alpha Verdict

| Criterion | Result |
|-----------|--------|
| Build passes | ✅ Yes |
| Critical code blockers fixed in this audit | ✅ Stock detail disclaimer, splash footer, buy-flow buying-power error |
| Ready for closed alpha (authenticated Supabase) | **Conditional YES** — if migrations 003–005 are applied and testers can trade (market open or dev override) |
| Ready for demo-only alpha | **Conditional NO** — demo trades do not persist to portfolio UI |

---

## Pre-Invite Checklist (Operator)

- [ ] Run migrations 001–005 in Supabase SQL Editor
- [ ] Copy `.env.example` → `.env.local` with project keys
- [ ] Disable email confirmation (or instruct testers to confirm email)
- [ ] Set `VITE_FORCE_DSE_MARKET_OPEN=true` for off-hours testing (dev builds only)
- [ ] Run `npm run supabase:check`
- [ ] Run `npm run build`
- [ ] Execute `docs/alpha-test-script.md` with one tester account
