# TwelveSpec Commerce OS + Storefront — Codex Implementation Contract
**Blueprint 1.0 | 2026-11-04 | design-and-handoff only**

## Mission
Build the **entire defined V1** in a clean, isolated development environment, with customer storefront and whole-business Commerce OS as separate applications sharing governed data and APIs. Build all V1 modules as one coordinated implementation, not repeated owner interviews. Install visible, safe **Coming Soon** placeholders for all future features. Owner wants a single comprehensive functional acceptance after implementation; engineers must nevertheless run automated checks continuously, because deferring all testing is high risk. Do not activate real supplier purchases, charges, customer messages, or the live domain.

**Read in order:** `01_RESEARCH_AND_STACK.md` → `02_FUNCTIONAL_BLUEPRINT.md` → `03_DATA_AND_API_CONTRACT.md` → `04_CODEX_EXECUTION.md` → `05_ACCEPTANCE_MATRIX.md`.

## Decisions already established
- TwelveSpec is the first deployment; MCALCO is the reusable business-platform foundation. This OS is *leaner* than a general multi-business SaaS and print MIS, but must be genuine whole-business management.
- Internal MCALCO tenant with venture workspaces; external SaaS tenants are later. Brand is not legal seller; binding transactions freeze legal seller identity and terms.
- Frontend: customer discovery, search, configurator, creative studio, quote/order, account, company/event storefronts.
- Backend: Today, Sales, Catalog, Jobs, Business with CRM, estimating, supplier procurement, artwork, MIS, finance references, marketing and automation.
- Visual bulk product editing and CSV preview/undo; no owner coding required. One public canonical product can have many private supplier offers.
- Supplier, decorator, printer and fulfillment identities, private pricing, margins and partner metadata never appear in public output.
- Shared *editable* artwork project between customer and staff, distinct from preview/render, proof, and production output. AI/3D capabilities have honest Coming Soon placeholders until validated.
- Quote-first default until reliable decorated pricing, shipping, taxes, and fulfillment are verified. POD MOQ-1 storefront restricted to verified sources.
- Margin guideline: 40% gross margin target, 30% general floor subject to approved exceptions. First two orders prepaid; Net 15 only after qualifying approvals and credit application. Never assume payment was received.
- Avoid unnecessary owner work; automate normal paths and surface exceptions.

## Existing assets & safety
Source repositories: `SEM-Admin/twelvespec-os` (complex operational reference; do not merge blindly); `SEM-Admin/twelvespec-web` (separate storefront reference). Candidate new private development repo: `SEM-Admin/twelvespec-platform`. Existing `twelvespec-os` contains real business data, production integrations, historical migrations, and unresolved PR #291; **NO live database clone, credential copy, migration replay, destructive reset, branch merge or domain switch**. Construct a fresh schema with synthetic seed data and independently review reusable logic. If creating a repo or external resources is not authorized within Codex's session, produce patches and exact owner approval requests instead.

## Owner interview protocol
Do not ask the owner questions when a safe reversible engineering default exists. Maintain `OPEN_DECISIONS.md` for vendor access, account-specific licensing, payment/tax/legal choices, domain cutover, production financial writes, and launch approval. Request owner input only for a real irreversible, financial, credential, compliance, or customer-facing decision. All integration code must run with mocks or sandbox settings while blocked.

## Delivery standard
The handoff is complete only when Codex outputs a repo, reproducible local installation, isolated database schema/migrations, all V1 screens and commands, integration adapter interfaces with verified mocks, a runnable test suite, a test-results report, and a single full-system demonstration. Any capability not implemented must be visibly gated `COMING_SOON` and excluded from pricing/publishing/purchase actions; never claim it is live.

**Owner instruction 2026-11-04:** PSRESTful is explicitly excluded. Direct supplier PromoStandards integration is mandatory; see 01_RESEARCH_AND_STACK.md. No dependency on a third-party PromoStandards REST broker.
