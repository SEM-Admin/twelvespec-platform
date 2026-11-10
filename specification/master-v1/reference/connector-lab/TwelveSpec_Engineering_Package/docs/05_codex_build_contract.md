# Codex Engineering Contract — Greenfield implementation

## Role / operating protocol

Build a new, isolated TwelveSpec platform. Treat this package as a controlling starting baseline, not as finished production code. Existing prior repos are reference-only. Keep the first browser preview usable throughout development. Choose routine technical defaults without interviews. Never create supplier orders or access existing production accounts without explicit owner authorization.

## Target repository

```
apps/shop/                 Next.js customer app
apps/os/                   Next.js Commerce OS
packages/core/             product, pricing, fulfillment, ownership, lifecycle
packages/connectors/       adapter SDK + mocks + PromoStandards + licensed ASI
packages/artwork/          editor document, renderer, proof/preflight
packages/contracts/        OpenAPI 3.1 and JSON schemas
packages/ui/               design system
packages/worker/           sync, render, outbox, import and retry
supabase/migrations/       repeatable physical schema and RLS
fixtures/                  synthetic data
scripts/                   bootstrap, reset, diagnose
```

## Delivery sequencing — continuous testability

1. Scaffold two apps + Postgres + login/RBAC + seed + CI and browser preview. Customer and admin accounts in isolated demo DB. Every navigation module visible; future features Coming Soon.
2. Implement core tenant/legal seller, party, catalog, versions, supplier offers, config and pricing contracts; test cross-tenant security and price precision.
3. Implement Integration Center and secure vault-backed save/test/rotate flows with mock adapters first; no credential value round-trip. CSV/XML preview and import mapping visual workflow. Direct PromoStandards SOAP/WSDL adapter per service and fixtures with auth/version differences. ASI SmartLink adapter only after licensed documentation/credentials, otherwise honest disabled placeholder.
4. Add customer shopping/search/configure/design, quote-first cart and persistent shared artwork records; make admin product template management visually bulk-editable.
5. Add CRM, quotes/orders, jobs/POs, shipping/finance references, store programs, exception-based Today screen; connect shared data model end-to-end.
6. Add automated event engine, sandbox connectors, monitoring and delivery diagnostics; all payments/PO side effects disabled in demo.
7. Run full E2E pass, adversarial import tests, security audit, vendor sandbox contract tests and manual owner acceptance. Publish no live site without production readiness checklist.

Do not interpret 'build all modules together' as permission to skip continuous tests. Prioritize verified end-to-end flows over decorative module checklists. All mocks must have `SIMULATED` banners and feature status.

## Required engineering artifacts

- Version-controlled migrations, JSON schemas and OpenAPI with generated typed clients.
- Field-level source ownership rules, field mapping and data quality queue.
- Connector manifests with capability declarations and protocol conformance fixtures.
- Fully detailed component-level screen contracts, loading/empty/error states, WCAG checks.
- Domain state-machine transition tests, idempotency and rollback/reconciliation tests.
- Threat model for credentials, uploads, SSRF, XML entity attacks, webhook replay, RLS leakage and cross-store access.
- CI: format, lint, typecheck, unit, SQL migration, RLS, API contract, E2E, dependency scan, seeded demo smoke.
- Test evidence matrix `MOCKED / SANDBOX_VERIFIED / LIVE_VERIFIED / BLOCKED`; no conflation.

## Hard stop for owner input

Only ask about credentials/licensing; tax/legal/payment configuration; sending real transactions or customer messages; granting live deployment; paid services; irreversible migrations. Otherwise choose conservative defaults and document them.

## Completion definition

`Demo ready`: one-command reproducible environment, seeded product import, supplier test UI (mock), browse/configure/quote/proof/PO draft, persistent records, CI green. `Integration ready`: authorized external test accounts, provider-specific conformance and version tests. `Production ready`: legal/tax/payment/shipping/fulfillment testing, independent security review, backup/restore validation, operator training, go-live signoff.
