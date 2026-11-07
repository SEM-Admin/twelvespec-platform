# TwelveSpec Platform

A greenfield Next.js, TypeScript and PostgreSQL implementation with separate customer storefront and Commerce OS applications. Development uses synthetic data and simulated providers. No existing TwelveSpec production service is used.

The controlling handoff is preserved under `specification/master-v1`. See the [module inventory](docs/module-inventory.json), [requirements traceability](docs/TRACEABILITY.md), [implementation checklist](docs/IMPLEMENTATION_CHECKLIST.md) and [preview status](docs/DEVELOPMENT_PREVIEWS.md). Active V1 acceptance remains open; Coming Soon modules stay disabled.

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
```

Protected Cloudflare previews and their limitations are documented in [development previews](docs/DEVELOPMENT_PREVIEWS.md). Remote demo passwords and deployment credentials are generated separately and excluded from source. Supplier access, authorized ASI SmartLink, financial activation and production deployment require their respective credentials, licensing and approvals. PSRESTful is prohibited.
