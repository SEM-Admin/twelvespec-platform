# TWELVESPEC — MASTER PLATFORM PACKAGE v1.0
**2026-11-05 | Greenfield engineering specification + reference implementation lab**

## What is in this ZIP
This ZIP consolidates **the entire planned platform scope** across customer commerce, CRM, catalog, supplier integrations, visual product configuration, creative/prepress, sales/quotes, company stores, BYOB, print MIS, purchasing, fulfillment, finance, marketing, automation, reporting, security, infrastructure, QA and future placeholders.

This is an **implementation handoff**, **NOT a complete production-ready running platform**. It contains detailed module contracts, schemas, rules, test definitions, executable pure-function examples and a working local supplier CSV/XML import lab. Neither live supplier secrets, live ESP+/SmartLink, customer payments, live purchase orders nor the full production Next.js interfaces are implemented. The latter are specified as Codex work.

### Start here
1. `docs/00_SCOPE_AND_DECISIONS.md` — immutable decisions, definitions and scope.
2. `docs/01_SYSTEM_ARCHITECTURE.md` — architecture, ownership, events and boundaries.
3. `docs/02_INTEGRATION_CENTER_AND_IMPORTS.md` — credentials, ESP+/SmartLink, direct PromoStandards and CSV/XML.
4. `docs/03_DOMAIN_AND_STATE_CONTRACTS.md` — data rules/state machines and precision.
5. `docs/04_SECURITY_OPERATIONS.md` — tenancy, RLS, vault, SSRF, security and deployment.
6. `docs/05_IMPLEMENTATION_AND_GATES.md` — sequenced Codex build contract and definition of done.
7. `docs/06_ACCEPTANCE_SUITES.md` — explicit cross-module user journeys.
8. `docs/07_SOURCES_AND_EVIDENCE.md` — standards/research, evidence confidence.
9. `modules/*.md` — detailed module-specific screen/action/event/permission contracts, for ALL modules.
10. `schema/001_domain_extensions.sql`, `schema/002_security_patterns.sql` — illustrative SQL to merge into the fresh reviewed database; **not ready to apply without review**.
11. `contracts/*.json`, `contracts/*.ts`, `spec/openapi.yaml` — machine-readable sample manifest, states, API and TypeScript design.
12. `tests/test_master_contracts.py` — runnable contract baseline tests.
13. `runnable-connector-lab/` — tested isolated prototype supplied in previous engineering package.
14. `reference/` — previous architecture/research packages for full continuity.

### Run the working local test lab
From `runnable-connector-lab/` run `python3 server.py` inside the `prototype/` folder, then open `http://127.0.0.1:8765`. **Never enter live secrets** into this lab. From repository root run `python3 -m unittest discover -s tests -v`; then run the inherited lab tests from inside `runnable-connector-lab`.

### Non-negotiable
No PSRESTful dependency. Native PromoStandards per supplier. ESP+ login does **not** imply authorized SmartLink access. Wholesale providers and costs never enter public projections. Separate demo, sandbox, and live capability reporting. Every Coming Soon route is a truthful placeholder. Live money/PO/communications disabled until audited and explicitly approved.
