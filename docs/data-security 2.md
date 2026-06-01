# Lenden — Data Security

> Planning document for production security posture. Not an implemented security audit.

## Principles

- **Encryption in transit** — TLS for all client/server communication.
- **Encryption at rest** — Sensitive fields (NID, TIN, full account numbers) encrypted in database/storage.
- **Secure NID handling** — Mask in UI; store encrypted; access logged.
- **Audit logs** — Append-only trail for sensitive actions (see `src/services/auditApi.ts`).
- **Least privilege** — Role-based access for ops/admin tooling.
- **Device/session management** — Trusted devices, login history, session expiry (see `src/services/sessionApi.ts`).
- **Data retention** — Policy placeholder; define retention windows with legal counsel before launch.

## Prototype limitations

The current app stores mock data in memory/local modules only. No production encryption or secure enclave is implemented yet.

## Sensitive actions to audit

- Login / logout
- KYC viewed / updated
- Order preview / mock submit
- Legal document viewed
- Support ticket created
- Device removed
