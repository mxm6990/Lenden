# Lenden Closed Alpha — Manual Test Script

**Duration:** ~25–35 minutes  
**Tester profile:** One person with a fresh Supabase test account  
**Environment:** Local dev (`npm run dev`) or TestFlight/web build with Supabase configured

## Before you start

1. Confirm operator ran Supabase migrations **001 through 005** (see `supabase/README.md`).
2. Confirm `.env.local` has valid `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
3. For off-hours testing, set `VITE_FORCE_DSE_MARKET_OPEN=true` in `.env.local` and restart dev server.
4. Use a **new email** you can access (or disable email confirmation in Supabase Auth settings).
5. Keep a notes doc open for **confusion points** (section 10).

---

## 1. Welcome & compliance (2 min)

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Open app | Splash shows Lenden hero |
| 1.2 | Read footer above buttons | “Not financial advice…” + brokerage disclaimer visible |
| 1.3 | Note overall first impression | Prototype feels intentional, not like a live broker |

**Confusion?** Note if splash feels like real investing without enough warning.

---

## 2. Sign up (5 min)

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Tap **Create Account** | Sign-up form loads |
| 2.2 | Fill name, phone, email, password | Fields accept input |
| 2.3 | Submit | Success → KYC screen **or** email confirmation message |
| 2.4 | If email confirmation required | Confirm email, return, tap **Sign in** |
| 2.5 | On KYC screen, tap **Complete Verification** | Enters main app (Home tab) |

**Pass if:** You reach Home without crash.  
**Fail if:** Infinite loading, blank screen, or unrecoverable error.

---

## 3. Sign in (3 min) — optional if still signed in

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Profile → Sign Out | Returns to splash |
| 3.2 | **Sign in** with same credentials | Enters Home; portfolio loads |
| 3.3 | Enter wrong password once | Clear error message, no crash |

---

## 4. Home & buying power (3 min)

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | On Home, read prototype banner | “Mock trading only…” visible |
| 4.2 | Check **Buying Power** card | Shows BDT amount (not blank/error) |
| 4.3 | Check portfolio value + chart | Skeleton briefly, then data or empty state |
| 4.4 | Scroll to Past transactions | Empty state or prior activity |

**Confusion?** Note if buying power vs portfolio value relationship is unclear.

---

## 5. Buy a stock (5 min)

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Market tab → pick a stock (e.g. GP) | Stock detail opens |
| 5.2 | Confirm prototype banner on stock detail | Amber banner at top |
| 5.3 | Tap **Buy {TICKER}** | Buy flow opens |
| 5.4 | Enter **500** BDT (or preset) → Continue | Preview shows fees, shares, mock warning |
| 5.5 | Confirm order | Success receipt “Mock order filled” |
| 5.6 | Return Home | Buying power **decreased**; holding may appear |

**Pass if:** Order completes and Home refreshes.  
**Fail if:** “Market closed” without override, persist error, or buying power unchanged after success.

---

## 6. Sell a stock (5 min)

| Step | Action | Expected |
|------|--------|----------|
| 6.1 | Portfolio tab → find holding from step 5 | Row shows shares > 0 |
| 6.2 | Tap **Sell** on holding | Sell flow opens for correct ticker |
| 6.3 | Enter **1** share (or 25% preset) → Continue | Preview shows proceeds + realized G/L |
| 6.4 | Confirm | Success receipt “Mock sell filled” |
| 6.5 | Return Portfolio | Shares reduced; buying power increased |

**Oversell test:** Try selling more shares than owned → blocked with clear message.

---

## 7. Portfolio & allocation (3 min)

| Step | Action | Expected |
|------|--------|----------|
| 7.1 | Portfolio tab | Total invested / current value shown |
| 7.2 | Tap **Allocation** | Breakdown screen loads with segments |
| 7.3 | On holding row, tap **View** | Opens stock detail for that ticker |
| 7.4 | Tap **Buy** on another holding row | Buy flow opens for correct ticker |

---

## 8. Transactions (2 min)

| Step | Action | Expected |
|------|--------|----------|
| 8.1 | Home → Past transactions | Buy and sell from steps 5–6 appear |
| 8.2 | Check amounts and dates | Readable labels (Buy/Sell + ticker) |

---

## 9. Profile (3 min)

| Step | Action | Expected |
|------|--------|----------|
| 9.1 | Profile tab | Loads name/email (not infinite skeleton) |
| 9.2 | Open **KYC Status** or **Security** sub-screen | Opens without crash |
| 9.3 | Read prototype banner on profile | Present |
| 9.4 | Sign out | Returns to splash |

**Error test (optional):** Turn off network, open Profile → error + **Retry** appears.

---

## 10. Report confusion

For each issue, record:

| Field | Your notes |
|-------|------------|
| **Screen** | e.g. Buy flow, Portfolio |
| **What you tried** | |
| **What happened** | |
| **What you expected** | |
| **Severity** | Blocker / Confusing / Cosmetic |

### Common confusion prompts

- Did mock vs real trading feel clear enough?
- Was buying power obvious before buying?
- Did sell feel scary or appropriately neutral?
- Any layout jump on stock detail (sell button)?
- Anything that implied BSEC approval or live brokerage?

---

## Pass / Fail Summary

| Area | Pass? (Y/N) | Notes |
|------|-------------|-------|
| Sign up / sign in | | |
| Buy flow | | |
| Sell flow + oversell block | | |
| Buying power updates | | |
| Portfolio / allocation | | |
| Transactions | | |
| Profile | | |
| Compliance messaging | | |

**Overall alpha recommendation:** Pass / Fail / Pass with notes

---

## Demo mode smoke test (5 min, optional)

| Step | Action | Expected |
|------|--------|----------|
| D.1 | Splash → **Explore Demo** | Enters app as demo user |
| D.2 | Complete a buy + sell | Receipts work |
| D.3 | Check Portfolio after refresh | **Known limitation:** holdings may not change — note if confusing |

Demo mode validates UI flows only; persistent portfolio requires authenticated Supabase account.
