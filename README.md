# TwelveSpec Platform

**Development status — November 10, 2026:** the source now includes the owner Website & Content Studio and shared published storefront renderer. Paid production orders remain blocked by durable hosting, commercial/provider activation and full V1 acceptance gates. See the [branch integration checklist](docs/integration/2026-11-10.md), [launch readiness](docs/LAUNCH_READINESS_2026-11-09.md) and [content implementation](docs/website-content-studio/IMPLEMENTATION.md).

A greenfield Next.js, TypeScript and PostgreSQL implementation with separate customer storefront and Commerce OS applications. Development uses synthetic data and simulated providers. No existing TwelveSpec production service is used.

The original platform checkpoint and development history remain on [build/owned-catalog-shopify-ab8e81e](https://github.com/SEM-Admin/twelvespec-platform/tree/build/owned-catalog-shopify-ab8e81e). The earlier content-backend and launch-readiness checkpoint is published on [build/website-content-studio-20261109](https://github.com/SEM-Admin/twelvespec-platform/tree/build/website-content-studio-20261109). This branch includes the storefront, Commerce OS, shared services, migrations, tests, original specification and research. See the [delivery status](docs/DELIVERY_STATUS.md) for implemented functionality, verified behavior and remaining activation requirements.

The controlling handoff is preserved under `specification/master-v1`. See the [module inventory](docs/module-inventory.json), [requirements traceability](docs/TRACEABILITY.md), [implementation checklist](docs/IMPLEMENTATION_CHECKLIST.md) and [preview status](docs/DEVELOPMENT_PREVIEWS.md). The [researched gap closure plan](docs/GAP_CLOSURE_PLAN.md) maps every module and all 95 acceptance scenarios to the next implementation work. Active V1 acceptance remains open; Coming Soon modules stay disabled.

The [17-company feature research](docs/business-research/README.md) translates public product patterns into 35 original TwelveSpec designs, 104 proposed behavior tests and a logical data model. It includes a filterable offline viewer, a downloadable workbook and mappings to the existing code and gap plan. These are implementation designs; research does not establish feature or integration acceptance.

The [industry supplement](docs/industry-research/README.md) adds PPAI, PRINTING United Alliance and specialist sources across 16 relevant business domains. It links data, workflow and exception requirements to all 19 active modules. Preliminary artwork checks now distinguish measured values from unverified producer requirements; production approval remains blocked pending a verified profile and review path.

The [owned catalog and reviewed quote workflow](docs/OWNED_CATALOG_AND_RFQ.md) lets operators stage source-only supplier facts, curate their own products and exact variants, upload approved photos and review publication. Customers submit immutable product specifications and project briefs; operators cost and issue reviewed quotes without exposing internal costs or unissued prices. Known supplier candidates stay private until reviewed. Current supplier prices/stock and production activation remain separate requirements.

The [Shopify connector foundation](docs/SHOPIFY_CONNECTOR.md) adds merchant-scoped development channels, private synthetic catalog imports and a versioned read-only Admin GraphQL adapter. Real merchant installation and sales actions remain blocked. The [selling readiness assessment](docs/SELLING_READINESS.md) records why this new build is not yet approved for paid production orders.

The [SAGE/SinaLite metered catalog extension](docs/supplier-api/README.md) adds backend call caps, zero-default API spending, separate SAGE login allowances, committed private receipts, encrypted credentials and selected source imports. SinaLite's public sandbox catalog/options/configuration-price reads are verified. SAGE v130 contracts are tested; authenticated SAGE/live SinaLite, media rights and hosted verification of the [approved supplier preview rollout](docs/supplier-api/PREVIEW_UPDATE.md) remain separate activation gates. Its supplier checkpoint is on [build/sage-sinalite-metering-20261109](https://github.com/SEM-Admin/twelvespec-platform/tree/build/sage-sinalite-metering-20261109).

The functional content editor is available in Commerce OS at `/website`. It writes versioned database drafts, previews exact saved revisions, and publishes selected approved changes; routine content editing needs no source changes after deployment. Registered video/download components and scheduled publication remain unavailable. Company-store content uses the existing membership, program and catalog records.

Run locally with Node.js 24:

```sh
npm ci
npm run dev
```

The development command starts the isolated local PostgreSQL instance, applies migrations and seeds synthetic data before launching the storefront on port 3000 and Commerce OS on port 3001. It also starts the simulated background worker.

```sh
npm run setup
npm run typecheck
npm test
npm run test:e2e
npm run check:spec
npm run check:plan
```

Protected Cloudflare previews and their limitations are documented in [development previews](docs/DEVELOPMENT_PREVIEWS.md). Remote demo passwords and deployment credentials are generated separately and excluded from source. Supplier access, authorized ASI SmartLink, financial activation and production deployment require their respective credentials, licensing and approvals. PSRESTful is prohibited.

The full `npm run test:e2e` command requires ports 3000 and 3001 to be free and uses a fresh disposable local database. Stop `npm run dev` first. Saved preview data remains unchanged; restart the development command afterward. Focused `npx playwright test` can explicitly test an already running synthetic preview.
