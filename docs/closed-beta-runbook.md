# Lenden Closed Beta Runbook

Operator guide for inviting 3–5 testers to the closed beta prototype.

## Prerequisites

- Node.js 20+
- Supabase project (free tier is fine)
- Testers understand this is **mock trading only** — no real brokerage or payments

---

## 1. Environment setup (`.env.local`)

```bash
cp .env.example .env.local
```

Fill in from **Supabase Dashboard → Settings → API**:

| Variable | Value |
|----------|--------|
| `VITE_SUPABASE_URL` | Project root URL only (e.g. `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | **anon public** key — never use `service_role` in the app |

Optional for closed beta testing:

| Variable | Purpose |
|----------|---------|
| `VITE_FORCE_DSE_MARKET_OPEN=true` | Treat DSE as open outside trading hours (dev builds only) |
| `VITE_MARKET_DATA_MODE=mock` | Default prototype quotes (recommended for beta) |
| `VITE_DSE_MARKET_DATA_ENDPOINT=` | Leave empty unless testing experimental feed |
| `VITE_DSE_MARKET_DATA_API_KEY=` | Licensed/experimental feed key — never commit |

Verify:

```bash
npm run supabase:check
npm run beta:check
```

---

## 2. Required Supabase migrations (001–005)

Run each file in **Supabase Dashboard → SQL Editor**, in order:

| # | File | Purpose |
|---|------|---------|
| 001 | `supabase/migrations/001_profiles.sql` | Profiles + RLS |
| 002 | `supabase/migrations/002_profile_phone.sql` | Phone on profiles |
| 003 | `supabase/migrations/003_persistent_investing.sql` | Holdings, transactions, buying power, watchlists, audit |
| 004 | `supabase/migrations/004_schema_integrity_and_atomic_mock_buy.sql` | `submit_mock_buy` RPC |
| 005 | `supabase/migrations/005_submit_mock_sell.sql` | `submit_mock_sell` RPC + realized P&L |

See `supabase/README.md` for verification queries.

---

## 3. Market hours override (testing)

DSE mock orders are rejected when market status is not **Open** (Sun–Thu 10:00–14:30 Asia/Dhaka).

For off-hours beta sessions:

```env
VITE_FORCE_DSE_MARKET_OPEN=true
```

Restart dev server after changing `.env.local`. This flag is **ignored in production builds**.

---

## 4. Auth settings for testers

**Authentication → Providers → Email:**

- Enable Email provider
- For smoothest beta: **disable “Confirm email”** (re-enable before public launch)

**Authentication → URL Configuration:**

- Add `http://localhost:5173` for local testing

---

## 5. Creating tester accounts

**Option A — testers self-sign-up**

1. Share app URL
2. Tester taps **Create Account**
3. Completes simulated KYC → enters app
4. Profile row created via signup trigger (migration 001/002)

**Option B — operator creates accounts**

1. Supabase Dashboard → **Authentication → Users → Add user**
2. Tester signs in with provided credentials

**Demo mode (UI-only):**

- Splash → **Explore Demo** — no Supabase required
- Trades show receipts but **do not persist** holdings to portfolio UI

---

## 6. Resetting test data

Per-user reset (SQL Editor — replace `USER_ID`):

```sql
-- Replace with test user's UUID
delete from audit_logs where actor_id = 'USER_ID';
delete from mock_orders where user_id = 'USER_ID';
delete from transactions where user_id = 'USER_ID';
delete from holdings where user_id = 'USER_ID';
delete from watchlists where user_id = 'USER_ID';

update profiles
set buying_power_available = 10000,
    buying_power_reserved = 0,
    updated_at = now()
where id = 'USER_ID';
```

Full project reset: create a fresh Supabase project or truncate all app tables (destructive).

---

## 7. Verifying data after a test trade

**Holdings**

```sql
select stock_id, shares, avg_cost, updated_at
from holdings
where user_id = 'USER_ID'
order by updated_at desc;
```

**Transactions**

```sql
select type, ticker, shares, amount, realized_gain_loss, created_at
from transactions
where user_id = 'USER_ID'
order by created_at desc
limit 20;
```

**Buying power**

```sql
select buying_power_available, buying_power_reserved
from profiles
where id = 'USER_ID';
```

**Audit logs**

```sql
select action, target_id, metadata, created_at
from audit_logs
where actor_id = 'USER_ID'
order by created_at desc
limit 20;
```

In-app: Home / Portfolio should refresh after buy/sell; Past transactions section lists activity.

---

## 8. Known limitations

| Limitation | Notes |
|------------|-------|
| Mock trading only | No real order routing, payments, or BO account |
| Demo mode | Buy/sell receipts work; portfolio holdings stay on static mocks |
| Market hours | Orders blocked when DSE closed unless dev override |
| Market data | Default `mock` mode — not licensed live DSE feed |
| Experimental feed | Requires your own endpoint; falls back to mock if missing/failing |
| KYC / linked accounts | Simulated UI only |
| Learn tab | Disabled in this build |
| Email confirmation | Can block sign-in if enabled in Supabase |

---

## 9. Pre-invite checklist

- [ ] Migrations 001–005 applied
- [ ] `.env.local` configured; `npm run beta:check` passes
- [ ] One operator dry-run via `docs/alpha-test-script.md`
- [ ] Testers received `docs/tester-feedback-form.md`
- [ ] Testers told: mock trading, no real money, closed beta prototype

---

## 10. Support

Collect feedback using `docs/tester-feedback-form.md`. For bugs, note:

- Screen / flow
- Auth vs demo mode
- Time (Dhaka) if market-closed errors appear
- Supabase user id (not password)
