# Lenden — API Contracts

## Architecture

```
UI screen → service layer (src/services/) → mock data (src/data/) → future backend
```

Screens should consume typed async functions from `src/services/` rather than importing raw mock arrays directly.

## Contract definitions

Future HTTP request/response shapes live in `src/api-contracts/`:

| File | Domain |
|------|--------|
| `common.contract.ts` | `ApiResponse`, `ApiError`, `PaginationMeta`, `AuthSession` |
| `auth.contract.ts` | Login/session |
| `profile.contract.ts` | Profile, KYC, linked accounts |
| `market.contract.ts` | DSE summary, stock list |
| `portfolio.contract.ts` | Holdings, buying power, allocation |
| `trading.contract.ts` | Order preview/submit |
| `support.contract.ts` | Support tickets |
| `compliance.contract.ts` | Compliance snapshots |

## Mock API layer

Current services return `Promise<T>` with simulated latency. Swap implementations to:

```typescript
const res = await fetch('/api/...')
const payload: ApiResponse<T> = await res.json()
return payload.data
```

## Services map

| Service | Key functions |
|---------|----------------|
| `userApi.ts` | `getCurrentUser`, `getSessionStatus`, `getUserPreferences` |
| `marketApi.ts` | `getDseSummary`, `getStocks`, `searchStocks`, `getMarketStatus` |
| `portfolioApi.ts` | `getPortfolioSummary`, `getHoldings`, `getBuyingPower`, `getPastTransactions` |
| `tradingApi.ts` | `previewOrder`, `submitMockOrder`, `getOrderHistory` |
| `profileApi.ts` | `getUserProfile`, `getKycStatus`, `getLinkedAccounts`, `submitSupportTicket` |
| `sessionApi.ts` | `getSessionSnapshot`, `getTrustedDevices`, `getLoginHistory` |
| `auditApi.ts` | `appendAuditLog`, `getAuditLogs` |
