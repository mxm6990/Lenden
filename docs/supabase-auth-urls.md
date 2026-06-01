# Supabase Auth URL configuration (LenDen)

Email confirmation links must return to the same origin where the user signed up (localhost, Vercel production, or a preview deployment).

## 1. Supabase Dashboard

**Authentication → URL Configuration**

### Site URL

Set to your **production** Vercel URL (primary deployment), for example:

```
https://lenden.vercel.app
```

Replace with your actual production domain after the first Vercel deploy. Do not use `localhost` as Site URL.

### Redirect URLs

Add every origin that should accept auth callbacks:

```
https://YOUR_PRODUCTION_VERCEL_URL/**
https://*-mxm6990s-projects.vercel.app/**
http://localhost:5173/**
http://localhost:3000/**
```

Notes:

- The `/**` wildcard allows paths such as `/auth/callback`.
- Preview pattern `https://*-mxm6990s-projects.vercel.app/**` covers Vercel preview deployments for this project.
- Add a custom domain redirect URL if you attach one in Vercel.

## 2. Email template (optional check)

**Authentication → Email Templates → Confirm signup**

The default link uses `{{ .ConfirmationURL }}`, which respects `emailRedirectTo` from the client. No template change is required if redirect URLs above are configured.

## 3. Email confirmation toggle (beta)

**Authentication → Providers → Email**

| Mode | Dashboard | App env |
|------|-----------|---------|
| Beta (instant access) | Disable **Confirm email** | `VITE_REQUIRE_EMAIL_CONFIRMATION=false` |
| Production | Enable **Confirm email** | `VITE_REQUIRE_EMAIL_CONFIRMATION=true` (default) |

## 4. Vercel environment variables

Set in **Project → Settings → Environment Variables** for Production and Preview:

| Variable | Example |
|----------|---------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | anon public key |
| `VITE_REQUIRE_EMAIL_CONFIRMATION` | `true` or `false` |
| `VITE_SITE_URL` | optional; production URL for build-time docs only |

The app derives redirect URLs from `window.location.origin` at runtime — no localhost URLs are hardcoded in signup code.

## 5. Callback route

LenDen handles confirmation at:

```
/auth/callback
```

Signup sends:

```
emailRedirectTo: ${window.location.origin}/auth/callback
```

The callback exchanges the PKCE `code`, establishes a session, syncs profile metadata, and routes the user into the app.

## 6. Manual test checklist

- [ ] Sign up on `http://localhost:5173` → email link opens localhost callback → logged in
- [ ] Sign up on production Vercel URL → email link opens production callback → logged in
- [ ] Sign up on a preview deployment → email link opens same preview origin → logged in
- [ ] Invalid/expired link → redirected to Sign in with error message
- [ ] With `VITE_REQUIRE_EMAIL_CONFIRMATION=false` and Supabase confirm off → signup enters app without email step
