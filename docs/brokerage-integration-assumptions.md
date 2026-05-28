# Lenden — Brokerage Integration Assumptions

## Product role

Lenden is likely to begin as an **investing UX and education layer** for Bangladeshi retail investors, not as a standalone licensed broker on day one.

## Execution requires partners

Live order execution would require:

- A **licensed brokerage partner** aligned with BSEC requirements
- **Order routing** to exchange or broker OMS
- **Settlement** and custody workflows via CDBL
- **BO account** opening through a Depository Participant

## What the prototype models

- Mock buy flow and order preview
- Portfolio and allocation views from mock holdings
- Buying power as BO cash placeholder
- Compliance/trust center for KYC and legal consents

## What the prototype does not do

- Route orders to DSE
- Move real funds
- Open real BO accounts
- Provide investment advice

## Next integration steps (future)

1. Define broker API contract for quotes and orders
2. Align BO onboarding with DP partner
3. Connect KYC provider and AML screening
4. Replace mock services in `src/services/` with authenticated APIs
