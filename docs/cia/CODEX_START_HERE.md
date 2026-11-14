# Codex launch handoff — CIA-001 + CIA-PRODUCT-001 + CIA-TRUST-001
**Read first.** Work on `SEM-Admin/twelvespec-platform`; CIA planning branch `planning/cia-intelligence-core-20261112`, draft PR #3; issue #2. Main remains original V1 platform and live-service gates. **This file and its three companion contracts are the consolidated authoritative CIA handoff.** If Codex was started before this update, it must read the new customer-trust companion before locking architecture or altering storefront/commerce.

## Required reading (in order)
1. `docs/cia/ARCHITECTURE_AND_IMPLEMENTATION_CONTRACT.md`
2. `docs/cia/PRODUCT_LIFECYCLE_AND_MANUFACTURING_INTELLIGENCE.md`
3. `docs/cia/CUSTOMER_TRUST_MARKETING_AND_COMMERCE.md`
4. `docs/SELLING_READINESS.md`, `docs/GAP_CLOSURE_PLAN.md`, `docs/IMPLEMENTATION_CHECKLIST.md`, `docs/DECISIONS.md`
5. `docs/business-research/DATA_MODEL.md`, `docs/industry-research/README.md`, `docs/industry-research/SUPPLIER_DATA_ACCESS.md`, `docs/planning/COVERAGE_MATRIX.md`
6. Current source, migrations, APIs, CI and all source-of-truth product specification documents.

## User goal

TwelveSpec CIA is the intelligence layer that **feeds the entire commerce, creative, engineering, manufacturing, marketing, merchandising, financial and e-commerce ecosystem bidirectionally**, and can support other MCALCO businesses with strict isolation. It must ultimately support decorating existing products, configurable existing products, original product creation and engineering of new products. One canonical set of product identities/revisions and evidence-linked models should produce coherent specifications, creative outputs, producer-specific manufacturing instructions, 3D presentations, commercial listings and measured business outcomes. Do not collapse these into one naive file converter.

CIA does not replace existing operational ownership; AI recommendations do not authorize purchases, payment, published promises, engineering signoff or manufacturing release. Prioritize a first paying TwelveSpec customer and progressively reduced owner operating time.

## Immediate execution steps

**A. Verify baseline and resolve conflicts before implementation.**
- Confirm target branch, head, latest main and existing open work.
- Trace existing `packages/creative` design format, `packages/configuration` rules, supplier catalog/pricing, evidence, orders/procurement/finance and any producer preflight/CAD/3D subsystems.
- Create `docs/cia/CODEBASE_COMPATIBILITY_AUDIT.md` with: actual path/type/schema/status, authoritative owner, contract proposed change, compatibility judgement, migration/release impact, tests, data/source rights and gaps labeled VERIFIED/PARTIAL/RESEARCH_ONLY/MISSING/BLOCKED.
- Flag conflicts in proposed CIA documents and describe minimal corrections rather than rewriting domain models by default.
- Inspect existing code for unit-price rounding before changing it; retain source unit precision and apply documented rounding at amount extension.

**B. Document one unified integration architecture.**
- CIA seven-dimensional entity/relationship map; product definitions, revisions, variants, assets, design intent, CAD/BOM and engineering records, process profiles, release manifests, costs, supplier published price observations and customer outcomes.
- Dependency and system-of-record matrix for each active/future module: contributes / consumes / authoritative owner / access / event or API / freshness / contract version / activation gate.
- TypeScript interfaces and minimal SQL contract proposal, RLS boundaries, migration/backfill and rollback path; no paid infrastructure assumptions.
- Distinguish 3D visualization from technical simulation and actual physical verification; original CAD solids not substituted by editable illustration JSON.

**C. Implement only the first proven vertical slices, with testing.**
- CIA evidence registry, immutable published price observations, authorized quote cost distinct from MSRP/MAP/list, precise Decimal math and source rights.
- One versioned product identity/digital thread and manufacturing process profile, compatible with existing design/proof/catalog definitions; validate correct producer, variant, substrate, zone and method.
- Explainable qualification and decision audit for a 48-cap embroidered quote. Unknowns BLOCK; use authorized data or explicitly labeled synthetic fixtures.
- Proof-focused design outputs for three distinct modes (embroidered cap, printed/cut sticker, commercial brochure) and an original retail product *prototype/specification*, without claiming production-ready files or compliance.
- Add deterministic golden fixtures and integration/security tests. No actual factory submission.

**D. Customer trust, marketing and e-commerce (CIA-TRUST-001).**
- Audit live and preview-facing claims against verifiable capabilities, supplier fulfillment, service categories, product imagery rights and quote/direct checkout eligibility.
- Create approved public projections and a claims/availability truth-status model. Never promise live AI design, machine files, in-house manufacturing, instant stock or checkout when unverified.
- Preserve current brand and CMS, improve customer pathways from product discovery to trusted RFQ/quote, and feed qualified inquiry/outcome analytics back into CIA.
- Include SEO, mobile, accessibility, content management and conversion acceptance tests; avoid exposing wholesale sources via metadata/search.
- Prioritize getting the first paying customer through an honest, functional website without expanding the V1 live-selling gate.

**E. Research specialized engines separately and recommend staged delivery.**
Evaluate embroidery digitization/stitch planning, commercial print PDF/X and producer profiles, cut/engrave vectors, vector graphics/geometry, CAD/PLM/BOM, 3D visualization/UV/materials, packaging/dielines, imposition, cost modeling and channel publishing. Compare verified APIs, libraries, commercial licenses/AGPL obligations, maintenance burden, actual producer acceptance, and owner-hours saved. Do not force Python/Rust/GPU/Redis/Blender unless proven needed.

## Release / safety rules
- Current `docs/SELLING_READINESS.md`: **NO-GO for paid production orders on new build**. Do not imply CIA changes that.
- V1 product scope, existing 251 backend / 18 browser baseline (reverify current counts), original 95 scenarios / 80 CMS case set remain visible as separate acceptance coverage.
- No new paid service or live supplier/production API, payment, production file release, deployment or credential changes without explicit approval.
- Repository is **public**: no supplier net-price agreements, secrets, private customer data, licensed catalogs or other confidential documents committed.
- Human-reviewed controlled production files where necessary; actual stitchout, press checks, process QC and producer technical acceptance required before `PRODUCTION_READY`.
- No universal DPI, bleed, embroidery text minima, ICC conversions, DST stitch correctness or 3D physics claims without process evidence.
- Customer/public projections must suppress private supplier identities and wholesale economics.

## First completed handoff report should answer
1. What already works, exactly where and with what test evidence?
2. What architecture decisions conflict with current implementation and how will you resolve each?
3. What is the minimal reliable extension shared by commercial intelligence and original product creation?
4. Which versioned contracts are ready and which need manufacturer/proprietary information?
5. How will we demonstrate 48-cap quotation + the original product digital thread safely and measurably?
6. Which tasks can be implemented and tested immediately, and which require owner permission?
7. What is the likely added owner workload, ongoing service cost and scope impact?

## Delivery expectations

Document the baseline and conflicts first; then proceed with safe, small, independently tested and reviewable code PRs if no conflicting owner decisions are required. Do not merge an unreviewed architecture PR or silently expand V1 launch scope. Give a report in the end with exact changes, tests, genuine outstanding blockers and the next measurable milestone.
