# TwelveSpec Platform

A greenfield Next.js, TypeScript and PostgreSQL implementation with separate customer storefront and Commerce OS applications. Development uses synthetic data and simulated providers. No existing TwelveSpec production service is used.

The controlling handoff is preserved under `specification/master-v1`. See the [module inventory](docs/module-inventory.json), [requirements traceability](docs/TRACEABILITY.md), [implementation checklist](docs/IMPLEMENTATION_CHECKLIST.md) and [preview status](docs/DEVELOPMENT_PREVIEWS.md). The [researched gap closure plan](docs/GAP_CLOSURE_PLAN.md) maps every module and all 95 acceptance scenarios to the next implementation work. Active V1 acceptance remains open; Coming Soon modules stay disabled.

The [17-company feature research](docs/business-research/README.md) translates public product patterns into 35 original TwelveSpec designs, 104 proposed behavior tests and a logical data model. It includes a filterable offline viewer, a downloadable workbook and mappings to the existing code and gap plan. These are implementation designs; research does not establish feature or integration acceptance.

The [industry supplement](docs/industry-research/README.md) adds PPAI, PRINTING United Alliance and specialist sources across 16 relevant business domains. It links data, workflow and exception requirements to all 19 active modules. Preliminary artwork checks now distinguish measured values from unverified producer requirements; production approval remains blocked pending a verified profile and review path.

The [owned catalog and reviewed quote workflow](docs/OWNED_CATALOG_AND_RFQ.md) lets operators stage source-only supplier facts, curate their own products and exact variants, upload approved photos and review publication. Customers submit immutable product specifications and project briefs; operators cost and issue reviewed quotes without exposing internal costs or unissued prices. Known supplier candidates stay private until reviewed. Current supplier prices/stock and production activation remain separate requirements.

The [Shopify connector foundation](docs/SHOPIFY_CONNECTOR.md) adds merchant-scoped development channels, private synthetic catalog imports and a versioned read-only Admin GraphQL adapter. Real merchant installation and sales actions remain blocked. The [selling readiness assessment](docs/SELLING_READINESS.md) records why this new build is not yet approved for paid production orders.

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
