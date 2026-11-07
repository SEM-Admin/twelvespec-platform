# Codex Desktop Build Directive

Read `00_PRODUCT_ARCHITECTURE.md` and `01_ACCEPTANCE_PLAN.md` completely. Treat them as the v1.0 architecture design baseline, along with companion `TwelveSpec_Reverse_Engineering_Blueprint_v1.md` when provided. Implement a greenfield private monorepo with two deployables (storefront and Commerce OS), modular business kernel, isolated synthetic Supabase DB, provider interfaces and mock/sandbox registry, durable worker/outbox, single shared configuration/artwork data model, and one full integrated owner-acceptance build.

**Do not reuse the legacy production migrations or populated DB; protect existing `twelvespec-os` and `twelvespec-web` repos and public domains.** Don't copy proprietary vendor implementations or expose supplier cost/identity. No PSRESTful dependency.

**Execution steps without owner interviews:**
1. Produce `DECISIONS.md`, implementation architecture map and fresh schema crosswalk from MCALCO logical model; note assumptions without waiting.
2. Scaffold repo, pinned patched packages, database migrations, synthetic seed, login, navigation and working browser preview. Every module route must exist; out-of-scope pages display Coming Soon honestly.
3. Parallel-build all ACTIVE_V1 domains against same contracts; implement real persisted admin CRUD and user flows, not visual-only prototypes.
4. Implement configuration engine, one shared design revision model with customer/admin UI, quoting, routing and job cost lineage before adding broad supplier fixtures.
5. Develop native PromoStandards SOAP adapter and supplier REST/CSV provider SDK with deterministic mocks; use no external credentials until owner grants.
6. Add provider capability, source evidence, staged import, product matching, publishing approvals, bulk editor and template assignment.
7. Implement fulfillment, PO draft, job operations, external finance references, company/event stores, marketing drafts and safe automation.
8. Run continuous code/DB/provider security tests and a full end-to-end owner demo after entire V1 is integrated. Report uncovered gaps honestly, classify all vendor links by verification level.

**Only ask owner for** legal/tax/payment/live pricing policy, accounts/API permissions or fees, public launch/domain, live financial or supplier writes, uncertain business decisions that materially alter customer commitments. All other decisions default to safe, reversible mock-first implementation.

**Deliver:** repository link, reproducible local start + preview, current feature-status matrix, DB ERD/migrations, API schemas, provider fixture suite, final full-system test results, operations guide, unresolved decisions list, and an explicit request for approval before any production cutover.
