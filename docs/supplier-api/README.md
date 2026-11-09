# SAGE and SinaLite metered supplier catalogs

Status: implemented and tested locally on 2026-11-09. Hosted preview deployment and real-account activation are separate, pending actions. This extension does not establish launch readiness or close the original active V1 acceptance suite.

## Implemented functionality

- Commerce OS → Integration Center → **Metered supplier APIs**: create SAGE/SinaLite connections, configure call/unit/spending caps, inspect usage and receipts, pause a login, replace encrypted credentials, run bounded reads, and select source records for private catalog review.
- Per-login daily/monthly/minute/run call limits and monthly weighted-unit limits. A shared account spending ceiling applies across SAGE login keys. Monetary ceilings default to $0; unknown overage rates are blocked. A positive ceiling requires an owner approval statement for the current billing month and an audit reason.
- Committed PostgreSQL reservations occur **before** network dispatch. Parallel requests serialize against the same billing group. Failed, malformed and uncertain responses retain conservative reservations; later import rollback cannot erase usage. No automatic retries or refunds. These are reserved ceilings, not a supplier invoice.
- Named-user monthly credits and System/Public one-time credits are separate. One-time usage remains in the lifetime balance across calendar rollover. Duplicate connections, key replacement and leading-zero account aliases do not create another allowance. Current balance confirmation is required for fee-based SAGE modules; allocations never automatically renew.
- SAGE v130 profiles 101 (categories), 103 (product search), 104 (basic detail), 105 (full detail with supplier information) follow the owner's supplied contracts. Search handles `name`/`prName`; product identity uses `prodEId`/documented `prodEid`. Basic detail does not invent net cost from discount codes. Full detail retains explicit net tiers privately, keeps unknown freight/tax unknown and distinguishes blank-image candidates from branded references.
- SinaLite fixed read profiles: catalog, general product, exact store-specific print options, configuration price and client-credentials exchange. Store 9/USD and 6/CAD remain distinct. Pricing requires a current option cache and exactly one visible choice in each group; returned configuration must match the requested IDs. Uncontracted pricing/debug fields are discarded.
- HTTPS with certificate verification, fixed official hosts/paths, public DNS checks, pinned direct DNS, bounded response/time and rejected redirects. Managed environments use their configured HTTPS proxy and CA. No arbitrary endpoint, WSDL, provider write, supplier order or payment operation is available.
- Credentials use AES-256-GCM database ciphertext and tenant/workspace/connection/account/version authenticated context. The server encryption key stays outside the database. A dedicated 32-byte base64 `TWELVESPEC_SUPPLIER_VAULT_KEY` can be provisioned; otherwise a purpose-separated key is derived from the stable server authentication secret. Master-key changes fail closed and require credential re-entry; automatic key-ring rotation is not implemented. No keys/tokens/ciphertext are returned to the browser or placed in product caches.
- Forced RLS protects billing groups, login budgets, receipts, caches and secrets. Customers cannot read them. Named-user SAGE research is restricted to its configured staff identity and cannot create a public catalog draft. Selected imports preserve evidence and remain private drafts; expired SAGE detail cannot create a draft. Generic mock sync/credential commands cannot bypass native controls.
- Preview networking has explicit flags, both off by default. `PREVIEW_CATALOG_READS_ENABLED` permits only the public SinaLite sandbox. Real account reads require a separate approved flag and the approved persistent development database. Merely setting a durability toggle cannot enable an ephemeral preview meter. Startup checks every shipped migration, including 010.

## Simulated functionality

Mock SAGE and SinaLite connections return synthetic contract fixtures with `MOCKED` evidence and make no supplier requests. Automated financial-boundary tests simulate tiny fees and never purchase API usage. Existing supplier purchase orders, payments, shipping, Shopify imports and other unactivated provider workflows remain simulated. The SAGE fixture is synthetic and is not a real supplier offer or a photo license.

## Verified integrations

The [SinaLite sandbox evidence](evidence/sinalite-sandbox.json) records a real unauthenticated read test through this connector: 192 products, 176 enabled, 18 US print-option records, a matching configured price response, three privately staged print sources and a cache hit. Sandbox product 1/store 9 returned USD 8.8200 for the tested exact IDs; **this is not a live supplier quote or a selling price**. Four conservative call reservations include the first unsuccessful network probe; the proxy-aware transport then completed the three real read operations. Approved API fees: $0. Supplier orders: 0. Published products: 0. Images/templates verified: false.

SAGE contracts are verified against owner-supplied documentation and tested fixtures. **No authenticated SAGE request or live SinaLite account request has been verified.** Earlier PCNA/S&S research remains separate evidence and is not automatically imported by these connectors.

## Test evidence

[Verification summary](evidence/verification.json) records the current backend suite, browser journeys, optimized builds and original specification checks. The backend suite covers concurrency, default zero spend, exact decimal boundaries, unknown fees, current-month approval, per-login/lifetime credits, immutable receipts, rollback recovery, cache expiry, auth-cache behavior, credential rotation and cross-tenant/customer denials. Browser tests configure a cap, stage a print source, reuse cache, hit the cap, inspect its persisted receipt, pause calls, and exercise SAGE category/search/detail review.

The full 13-browser-journey run also covers owned catalog publication, customer RFQ, private operator costing and issued customer quotes, scoped administration, CSV rollback, Coming Soon denials, Creative proofs, Shopify simulation and automated accessibility. Passing these implemented journeys does **not** prove all 95 original acceptance scenarios pass. The existing six dynamic filesystem tracing warnings in Creative remain non-fatal build warnings.

## Outstanding failures and incomplete features

- The SinaLite signup email contains staging portal login information. This workspace's proxy rejects the portal hostname with CONNECT HTTP 400; this does not prove the vendor portal is down or the credentials are invalid. No API client ID/secret or live credentials were established from that email. A sent request for live API credentials was found, but no live credential response was verified.
- Exact SAGE service fees and provider-side limit semantics still require confirmation. The supplied portal screenshots show paid-query limits of 100 for System/Public and unlimited for the named user; neither is proof of a zero-dollar ceiling. A visible authentication key should be rotated before live use. It was not copied into source or used for network calls.
- Hosted previews still run the previous application image with temporary PostgreSQL/files and outbound networking disabled. The new implementation is not on those URLs yet. The approved Supabase project is not declared healthy or durable from this work. Real metered keys and reads remain blocked until that connection and migrations are verified.
- Native reads and selected source staging are implemented. Automatic scheduled native synchronization, provider balance reconciliation, automatic supplier media/template downloads, source-option selectors published onto the storefront, automatic net-tier costing, supplier order submission and live purchases are **not activated**. Operators can test private options/prices and use the existing reviewed quote workflow; do not describe that as an automatic SinaLite/SAGE checkout.
- Blank-image references are candidates. Photo reuse rights, exact variant/print mappings, artwork templates, current costs/availability, freight and delivery must be reviewed before real products are published or sold.

## Remaining activation requirements

1. Approve the isolated development preview update and its public sandbox outbound-read flag. It affects only the two existing preview Workers/runtime; no production domain or supplier account changes. Replacing its container resets temporary synthetic state. Retain the old image digest and flags for rollback.
2. Verify the approved persistent development database `mtihnarlkprmyahbxlrl`, verified TLS, restricted application role, all migrations and backup/recovery. Provision stable server encryption material and private durable artwork storage. Enable real-account preview reads only after that separate review.
3. Enter a rotated SAGE login-specific API key and SinaLite client ID/secret through the authenticated backend. Never use a website password as an assumed API secret. Confirm active API entitlement, tenant-specific cache/display rights and current service documents.
4. For SAGE, verify each login's remaining credits, billing month/timezone and provider-side stopping behavior. Start with a small local allocation and zero paid ceiling. Cache free categories, search narrowly, then fetch full detail only for selected products when net cost is needed; avoid paying for both basic and full detail without a reason. Do not route anonymous requests through a named user.
5. Verify licensed images/templates, live exact product/option coverage and supplier quote terms. Curate draft products and customer quote choices, then run authorized test-mode order/quote journeys. Paid supplier ordering, payments and production launch remain separate approvals.

## Run locally

```sh
npm run setup
npm run dev
npm run typecheck
npm test
npm run test:e2e
node --import tsx scripts/verify-supplier-sandbox.ts
```

The last command makes at most three unauthenticated sandbox reads plus a cache check and stages three sources in the **local** database only. It refuses a remote database and never accepts supplier keys, production endpoints or order requests. Repeated execution can reuse valid cached data and remains capped.

See [research and requirements](RESEARCH_AND_REQUIREMENTS.md), [traceability](TRACEABILITY.csv), [preview proposal](PREVIEW_UPDATE.md), [master inventory](../module-inventory.json) and [launch readiness](../LAUNCH_READINESS_2026-11-09.md). PSRESTful remains prohibited.
