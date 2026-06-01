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
| `VITE_MARKET_DATA_MODE=mock` | Default prototype quotes (recommended for most beta testers) |
| `VITE_MARKET_DATA_MODE=experimental_dse` | Use Supabase Edge Function proxy for unofficial DSE quotes |
| `VITE_DSE_MARKET_DATA_ENDPOINT=` | Licensed-mode vendor URL only — **not** used for experimental DSE |

**Important:** The React app never calls unofficial DSE hosts directly. Experimental mode calls:

`{VITE_SUPABASE_URL}/functions/v1/dse-market-data`

Upstream configuration lives in Supabase Edge Function secrets (see §2b below).

Verify:

```bash
npm run supabase:check
npm run beta:check
```

---

## 2. Required Supabase migrations (001–006)

Run each file in **Supabase Dashboard → SQL Editor**, in order:

| # | File | Purpose |
|---|------|---------|
| 001 | `supabase/migrations/001_profiles.sql` | Profiles + RLS |
| 002 | `supabase/migrations/002_profile_phone.sql` | Phone on profiles |
| 003 | `supabase/migrations/003_persistent_investing.sql` | Holdings, transactions, buying power, watchlists, audit |
| 004 | `supabase/migrations/004_schema_integrity_and_atomic_mock_buy.sql` | `submit_mock_buy` RPC |
| 005 | `supabase/migrations/005_submit_mock_sell.sql` | `submit_mock_sell` RPC + realized P&L |
| 006 | `supabase/migrations/006_market_quotes_cache.sql` | Server cache for experimental DSE proxy fallback |

See `supabase/README.md` for verification queries.

---

## 2b. Experimental DSE market data (optional, closed beta only)

**Unofficial source:** community API style from [ShanjinurIslam/Dhaka-Stock-Exchange](https://github.com/ShanjinurIslam/Dhaka-Stock-Exchange).

> **Warning:** This is **not** licensed DSE market data. Use for paper-trading prototype evaluation only. Self-host or deploy your own instance — do **not** rely on deprecated public hosts in production.

### Deploy the upstream DSE API (Render)

LenDen ships a Mongo-free compatible adapter at `services/dse-experimental-api/` (same routes as [Dhaka-Stock-Exchange](https://github.com/ShanjinurIslam/Dhaka-Stock-Exchange)).

1. Push repo to GitHub
2. Render → **New** → **Blueprint** → select LenDen repo
3. Confirm service `lenden-dse-experimental-api` deploys from `services/dse-experimental-api/render.yaml`
4. Copy URL, e.g. `https://lenden-dse-experimental-api.onrender.com`
5. Smoke test:

```bash
npm run dse:smoke -- https://YOUR-SERVICE.onrender.com
```

Expected: `/api/latest_price` returns `{ date, stocks[] }` and `/api/share_price?name=GP` returns a GP row.

> **Unofficial source only.** Not licensed DSE data. Beta / paper trading prototype.

### Server-side secrets (Supabase Dashboard → Edge Functions → Secrets)

| Secret | Example | Purpose |
|--------|---------|---------|
| `DSE_EXPERIMENTAL_BASE_URL` | `https://your-self-hosted-dse-api.example.com` | Base URL of your deployed Dhaka-Stock-Exchange API |
| `DSE_MARKET_DATA_MODE` | `experimental_dse` | Enables upstream fetch in the proxy |

**Do not** put `DSE_EXPERIMENTAL_BASE_URL` in `.env.local` or frontend code.

### Deploy the proxy function

```bash
supabase functions deploy dse-market-data
```

Or run:

```bash
chmod +x scripts/configure-dse-proxy.sh
./scripts/configure-dse-proxy.sh https://YOUR-SERVICE.onrender.com fnxpdpxbiinnddftysqq
node scripts/verify-experimental-dse.mjs https://YOUR-SERVICE.onrender.com
```

`supabase/config.toml` sets `verify_jwt = false` on `dse-market-data` so publishable anon keys work with the `apikey` header.

### Upstream routes used by the proxy

| Route | Purpose |
|-------|---------|
| `GET /api/latest_price` | Bulk latest quotes (primary) |
| `GET /api/share_price?name=GP` | Single ticker refresh (`stockId` query on proxy) |
| `GET /api/company_list` | Not used by Lenden v1 |
| `GET /api/company_details?name=GP` | Not used by Lenden v1 |
| `GET /api/company_data?name=GP&type=price&duration=24` | Not used by Lenden v1 |

### Frontend toggle (after proxy is deployed)

```env
VITE_MARKET_DATA_MODE=experimental_dse
```

Restart `npm run dev`. UI shows **Experimental DSE Feed** badge and disclaimer:

> Experimental DSE data for paper trading only. Verify licensing before production use.

### Fallback behavior

1. Proxy calls upstream `/api/latest_price`
2. On failure → reads `market_quotes_cache` if younger than 5 minutes
3. On cache miss → returns prototype mock quotes with `sourceUnavailable` status

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
| Experimental DSE feed | Unofficial community API via Supabase proxy only; not licensed; falls back to cache/mock |
| KYC / linked accounts | Simulated UI only |
| Learn tab | Disabled in this build |
| Email confirmation | Can block sign-in if enabled in Supabase |

---

## 9. Pre-invite checklist

- [ ] Migrations 001–006 applied
- [ ] `.env.local` configured; `npm run beta:check` passes
- [ ] If using experimental DSE: `dse-market-data` function deployed + secrets set
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
