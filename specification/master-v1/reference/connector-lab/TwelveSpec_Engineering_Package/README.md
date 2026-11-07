# TwelveSpec — Engineering Architecture + Runnable Connector Lab (v0.1)

**Status: implementation foundation and handoff, NOT finished commercial software.** Built 2026-11-05 from documented external standards. The `prototype` is an intentionally local-only, no-network supplier-connection and file-import lab. It is **not safe for public deployment or real API credentials**; the production credential vault, authentication, tenant authorization, external SOAP and SmartLink adapters remain implementation contracts.

## Test now (no dependencies)

```bash
cd prototype
python3 server.py
# Open http://127.0.0.1:8765
```

Demo can register mock providers (metadata only), inspect active capabilities, import CSV/XML products, inspect errors, and publish valid products to a local SQLite demo database. It never communicates with vendors or submits supplier purchase orders. Use synthetic credentials only. Restart does not erase data; remove `prototype/demo.db` to reset.

Run tests: `python3 -m unittest discover -s tests -v` from package root.

## Package contents

- `docs/01_research_standards.md` verified standards and ESP+/SmartLink access distinction.
- `docs/02_product_architecture.md` workspaces, module boundaries, end-to-end journeys.
- `docs/03_integrations_and_secrets.md` visual connector UX, security, provider compatibility, ingestion stages.
- `docs/04_state_machines_rules.md` pricing/configuration/quoting/fulfillment and exception rules.
- `docs/05_codex_build_contract.md` ordered execution, no interviews for routine choices, delivery gates.
- `docs/06_capability_matrix.md` 17 benchmark systems -> native requirements.
- `docs/07_acceptance_and_threat_model.md` testable scenarios/security gates.
- `db/001_core.sql` PostgreSQL schema proposal with tenant isolation and per-provider capability records.
- `db/002_rls.sql` PostgreSQL RLS strategy example; not production-deployed.
- `api/openapi.yaml` initial OpenAPI 3.1 contract.
- `contracts/provider_contract.ts` strongly typed adapter interface and capability model.
- `prototype/` runnable local demo / CSV and XML staging / manual publish.
- `fixtures/` sample inputs; `tests/` executable foundation tests.

## Hard limits

- The code here is not a complete storefront, production-ready MIS, managed secret vault, live SmartLink integration, or live PromoStandards SOAP client.
- ESP+ website/account credentials are **not** automatically credentials for SmartLink. Access and data rights must be obtained from ASI.
- Direct SOAP suppliers have service/version/account variations; do not infer PO support from catalog support.
- CSV/XML upload is not a route to arbitrary executable code or unrestricted remote URL fetching.
- Live order placement, payments, tax calculation and financial posting are gated OFF.

## Owner decisions to request only when needed

Vendor-approved API credentials; licensing and catalog redistribution permission; payment/tax/legal policy approval; production deployment approval; supplier auto-order authority. Everything else should be implemented using safe documented defaults and tests.
