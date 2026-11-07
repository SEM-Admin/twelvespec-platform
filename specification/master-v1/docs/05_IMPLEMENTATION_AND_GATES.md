# Codex engineering delivery contract

## One coordinated program; continuous testing
Build all active V1 domains from one controlling package and shared contracts. Do not block owner preview until external API credentials arrive. Engineering may divide work into safe internal milestones, but must not treat one feature as a disconnected one-off project. Commit vertical workflow slices with smoke tests, then final integrated acceptance suite.

## Required first preview
A clean checkout with two apps running, authentication, tenant/workspace scopes, 40 synthetic products (print/promo/apparel/signage/event), supplier offers, 10 demo contacts, visual swatches, quoting draft, fake proofs and job statuses, CSV/XML import, provider registry and Coming Soon navigation. Explicitly mark fake values.

## Execution order and gates
A. Security-first platform: private repo, CI, patched dependencies, tenant RLS, module registry, secrets interface, outbox, synthetic fixtures.
B. Product+commerce+creative: catalog normalization, configurable product options, customer guided designer, bulk mockups, proof, cart/quote.
C. MIS+fulfillment: sales/CRM, estimated costs, approval, immutable quote/order, job/PO/shipments and supplier event orchestration.
D. Business systems: finance refs, company/school stores, BYOB, marketing/CMS, visual automation, exception dashboard.
E. Adapters: CSV/XML real local; native SOAP implementation against sample supplier WSDL and sandbox where authorized, ASI SmartLink interface only after authorized docs, print/POD/shipping accounting sandboxes; no scraping or broker dependency.
F. Final acceptance: all domains pass contract, migration, security, e2e, recovery and human UI tests. Any deferred capability remains clearly Coming Soon, not secretly skipped.

## Required output at every gate
- Exact commit hash, changed modules, environment and deterministic preview instructions.
- Tests actually run, pass/fail and coverage by contract; clearly document mocks.
- Known blockers and owner-only decision requests; don't claim finished without evidence.
- Updated architecture decision record for deviations and test fixtures for bug fixes.

## Installation UX (goal, not currently shipped)
A private admin `Business → Integrations` page accepts account-specific supported supplier credentials; capability wizard runs permitted read-only tests; source/variant mapping preview; publish; later PO write capability requires explicit separate approval. Unknown providers can be imported via CSV/XML and manually fulfilled until new adapter code exists.

## Prompt for Codex Desktop
Read `README.md`, all `docs/`, `modules/`, `contracts/`, `schema/` and `tests/`. Treat this as the controlling product program. Implement the production monorepo described, preserving shared authoritative records and full V1 scope. Make safe routine engineering decisions without interviewing owner. Treat this master ZIP's local Python demo strictly as reference/test fixture; the production service stack is TypeScript/Next.js + PostgreSQL. Do not enter vendor credentials in demos; do not touch existing production TwelveSpec OS, Supabase or public domains. Run tests continuously and report truthfully. Request owner assistance only for licensed access, live credentials, legal/tax rules, spend approval and launch authorization.
