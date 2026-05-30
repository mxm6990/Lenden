# Supabase setup (Lenden)

## 1. Create env file locally

```bash
cp .env.example .env.local
```

Fill in **Project URL** and **anon public** key from Supabase Dashboard → **Settings → API**.

## 2. Run the migration

In Supabase Dashboard → **SQL Editor**, paste and run:

`migrations/001_profiles.sql`

Or with [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

## 3. Verify env locally

```bash
npm run supabase:check
```

## 4. Auth settings (prototype)

Supabase Dashboard → **Authentication → Providers → Email**:

- Enable Email provider
- For easiest prototype testing, **disable “Confirm email”** (re-enable before production)

Add redirect URL if needed: **Authentication → URL Configuration** → `http://localhost:5173`

## 5. Verify

After **Option B (Auth)** is wired, each signed-in user gets a `profiles` row automatically.

Until then, the app falls back to mock profile data when there is no Supabase session.

## 6. Phone number on profiles

If `phone` is NULL in `profiles`, run:

`migrations/002_profile_phone.sql`

This updates the signup trigger and backfills phone from auth user metadata for existing accounts.

## 7. Persistent mock investing (Phase 4)

Run:

`migrations/003_persistent_investing.sql`

This creates `holdings`, `watchlists`, `transactions`, `mock_orders`, `support_tickets`, and `audit_logs` with RLS. It also adds `buying_power_available` / `buying_power_reserved` to `profiles`.

Audit logs are append-only from the client for this prototype. Production should write sensitive audit events server-side.

## 8. Atomic mock buy (Phase 5)

Run:

`migrations/004_schema_integrity_and_atomic_mock_buy.sql`

This adds schema constraints, `transactions.mock_order_id`, indexes, and the `submit_mock_buy` RPC for atomic mock orders.

Verification queries are included at the bottom of the migration file.

## 10. Atomic mock sell + realized P&L

Run:

`migrations/005_submit_mock_sell.sql`

This adds `transactions.realized_gain_loss` and the `submit_mock_sell` RPC for atomic mock sells with realized gain/loss tracking.

## 12. Experimental DSE market data proxy (closed beta)

Run:

`migrations/006_market_quotes_cache.sql`

Deploy Edge Function:

`functions/dse-market-data`

`supabase/config.toml` sets `verify_jwt = false` so the function accepts Supabase **publishable** anon keys via the `apikey` header (no JWT required).

Set secrets:

- `DSE_EXPERIMENTAL_BASE_URL` — Render URL for `services/dse-experimental-api`
- `DSE_MARKET_DATA_MODE=experimental_dse`

Or:

```bash
./scripts/configure-dse-proxy.sh https://YOUR-SERVICE.onrender.com YOUR_PROJECT_REF
node scripts/verify-experimental-dse.mjs https://YOUR-SERVICE.onrender.com
```

Frontend: `VITE_MARKET_DATA_MODE=experimental_dse` (calls the proxy at `/functions/v1/dse-market-data`).

**Unofficial data only.** Not licensed DSE feed. Beta / paper trading prototype — verify licensing before production.

## 11. Optional demo row (manual)

Only after you create a user in **Authentication → Users**, insert a matching profile:

```sql
insert into public.profiles (
  id, full_name, email, phone, kyc_status, bo_account_status,
  nid_verification_status, risk_profile_status, lenden_id,
  linked_wallet, linked_bank
) values (
  'PASTE_AUTH_USER_UUID',
  'Mahathir Mahbub',
  'demo@lenden.app',
  '+880 1712-345678',
  'verified',
  'pending',
  'verified',
  'moderate',
  'LDN-2025-004821',
  'bKash ··· 4821',
  'Dutch-Bangla Bank ··· 7392'
);
```

## Security

- Use **anon key** in the app only with RLS enabled (included in migration).
- Never put **service_role** in the React app or commit it to git.
