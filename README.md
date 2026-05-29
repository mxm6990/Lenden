# Lenden App Prototype

Mobile-first investing app UI for Bangladesh (DSE stocks).

## Run

```bash
npm install
npm run dev
```

Open the URL shown in your terminal. Best viewed at mobile width (~430px) or using browser dev tools device mode.

## Run on iPhone (Xcode)

This project uses [Capacitor](https://capacitorjs.com) to wrap the web app as a native iPhone shell.

**Requirements:** Xcode, Xcode Command Line Tools, CocoaPods (`brew install cocoapods`)

### 1. Check your setup

```bash
npm run ios:doctor
```

If it reports a missing iOS simulator runtime, install it before trying to run:

```bash
npm run ios:install-platform
```

Or in Xcode: **Settings → Platforms → iOS 26.2 → Get**

> **Why sync succeeds but Run fails:** `cap sync` only copies web assets into `ios/`. Building/running in Xcode also needs the **iOS simulator runtime** that matches your Xcode version.

### 2. Build and launch

**Option A — one command (builds + opens Simulator):**

```bash
npm run ios:run
```

**Option B — open Xcode manually:**

```bash
npm run ios
```

Then in Xcode:
1. Open **`ios/App/App.xcworkspace`** (not the `.xcodeproj`)
2. Select an iPhone simulator (e.g. iPhone 16)
3. Press **Run** (▶)

After UI changes, sync again before re-running:

```bash
npm run ios:sync
```

## Screens

- **Splash / Welcome** — Create Account or Explore Demo
- **Sign Up** — Registration form
- **KYC** — Verification steps
- **Home** — Portfolio, DSE status, watchlist, quick actions
- **Market** — DSE index, search, stock list
- **Stock Detail** — Chart, metrics, buy / watchlist
- **Buy Flow** — Amount entry, fee preview, confirmation
- **Portfolio** — Holdings, performance, allocation
- **Learn** — Beginner investing lessons
- **Profile** — Account, security, support

## Branding

Tokens live in `vendor/Lenden-Branding` (package `@lenden/branding`) — growing graph mark + Outfit logo wordmark.

Preview branding kit:

```bash
npm run branding
```

Sync from GitHub when the remote repo is available:

```bash
npm run sync-branding
```

## Stack

React · TypeScript · Tailwind CSS · Framer Motion · lucide-react · Capacitor (iOS) · Supabase (optional backend)

## Supabase (optional)

1. Copy `.env.example` → `.env.local` and add your project URL + anon key  
2. Run `supabase/migrations/001_profiles.sql` in the Supabase SQL Editor  
3. See `supabase/README.md` for full setup  

Without `.env.local`, the app uses mock data. With Supabase configured but no auth session, profile still uses mock data until **Option B (Auth)** is wired.
