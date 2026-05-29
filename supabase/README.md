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

## 3. Verify

After **Option B (Auth)** is wired, each signed-in user gets a `profiles` row automatically.

Until then, the app falls back to mock profile data when there is no Supabase session.

## 4. Optional demo row (manual)

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
