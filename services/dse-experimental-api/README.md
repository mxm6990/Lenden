# Lenden Experimental DSE API

Unofficial **closed-beta** adapter with routes compatible with [ShanjinurIslam/Dhaka-Stock-Exchange](https://github.com/ShanjinurIslam/Dhaka-Stock-Exchange).

> **Not licensed DSE data.** Paper-trading prototype only. Verify licensing before production.

## Routes

| Method | Path | Notes |
|--------|------|-------|
| GET | `/health` | Render health check |
| GET | `/api/latest_price` | Bulk latest quotes (`{ date, stocks[] }`) |
| GET | `/api/share_price?name=GP` | Single ticker row |

## Local run

```bash
cd services/dse-experimental-api
npm install
npm start
npm run smoke -- http://localhost:3000
```

## Deploy to Render

1. Push this repo to GitHub
2. Render → **New** → **Blueprint**
3. Select the LenDen repo (uses `services/dse-experimental-api/render.yaml`)
4. Deploy and copy the service URL, e.g. `https://lenden-dse-experimental-api.onrender.com`
5. Verify:

```bash
npm run smoke -- https://YOUR-SERVICE.onrender.com
```

## Wire to Supabase Edge Function

```bash
supabase secrets set DSE_MARKET_DATA_MODE=experimental_dse
supabase secrets set DSE_EXPERIMENTAL_BASE_URL=https://YOUR-SERVICE.onrender.com
supabase functions deploy dse-market-data --project-ref YOUR_PROJECT_REF
```

Frontend stays on `VITE_MARKET_DATA_MODE=experimental_dse` and calls only `/functions/v1/dse-market-data`.
