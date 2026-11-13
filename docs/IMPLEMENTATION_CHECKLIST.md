# Visible implementation checklist

Latest CIA continuation: [service-claim requirements/code/test matrix](cia/CLAIM_PUBLICATION_PLAN.md), [verification, operating instructions and remaining gates](cia/CLAIM_PUBLICATION_VERIFICATION.md), plus the [connected workflow](cia/CONNECTED_QUALIFICATION_PLAN.md), [compatibility audit](cia/CODEBASE_COMPATIBILITY_AUDIT.md) and [customer-trust audit](cia/CUSTOMER_TRUST_AUDIT.md). **The final fresh-data local run passes all 346 backend tests / 45 files and all 24 browser journeys.** TypeScript, both builds, integrity and legacy migration checks pass. Structured service claims now reuse CMS approvals and current source rights; the complete local database restore includes CIA and supplier-metering state. PRs #4 and #5 are merged; this continuation requires final-head GitHub CI before integration. No hosted/production activation is implied. Free-text/product-specific claims, manufacturing engines and the original full V1/80 CMS acceptance remain open.

The following dated entries retain their historical measurement scope; they do not supersede the latest CIA evidence above.

Current integration: 251 backend tests and the complete 18-journey local browser suite pass. The five CMS journeys also pass after the final refresh-control review. Both builds and TypeScript pass. Original launch acceptance remains open. See [November 10 branch inventory, traceability and verification checklist](integration/2026-11-10.md).

Latest supplier extension: [metered SAGE/SinaLite implementation and activation gates](supplier-api/README.md). 250 backend tests and 13 local browser journeys pass; authenticated account integrations and hosted rollout are not implied.

Latest measured status: [November 9 launch readiness](LAUNCH_READINESS_2026-11-09.md) and [content-studio implementation](website-content-studio/IMPLEMENTATION.md). Backend/contract checks do not close the original 95 scenarios.

The [gap closure plan](GAP_CLOSURE_PLAN.md), [40-work-package audit](planning/GAP_AUDIT.md) and [complete coverage matrix](planning/COVERAGE_MATRIX.md) govern the remaining active V1 work. Research/planning completion does not mean implementation completion.

- [x] Add evidence-backed service/workflow assertions to the existing Website Studio, with separate public-use rights, exact revision approval, current source checks, Coming Soon controls, private projections and read-time withholding. Full customer-trust coverage is still partial.
- [x] Repair the local synthetic restore drill to include all 114 application tables and eight identity tables, including supplier budget/cache/ciphertext and CIA citations. Verify database-native contents, exact price/time values, binary fields, scope and foreign keys. Managed backups, original files and usable vault-key recovery are not verified.

- [x] Research 30 primary sources and audit all 20 module contracts.
- [x] Map 205 inventory entries and all 95 A/T/E acceptance scenarios; reproduce pricing, program-context and approval-role defects.
- [x] Research all 17 requested companies for features to adapt into original TwelveSpec software; deliver [35 feature designs, data requirements and proposed tests](business-research/README.md).
- [x] Expand public industry research to 16 business domains using 36 association, standards and specialist sources; link all 19 active modules in the [industry supplement](industry-research/README.md).
- [x] Review official ASI SmartLink/ESP Updates distinctions and SAGE Connect access/usage requirements in the [supplier access assessment](industry-research/SUPPLIER_DATA_ACCESS.md); account correspondence remains in a private owner evidence packet.
- [x] Verify PCNA staging Product Data 2.0.0 and Media Content 1.1.0 with issued staging credentials; retrieve a blank photo and raster template preview. Verify SinaLite public sandbox catalog/detail reads. Account-specific evidence stays private; application synchronization is still simulated.
- [x] Reconcile current 4over, Rivers Promo and S&S access requirements, licensed data/media routes and credential gaps; keep account-specific eligibility decisions private. None of these three is marked authenticated from this development build.
- [x] Retrieve S&S Categories/Styles workbooks and one style image through the supplier's public download route without credentials. Preserve private source evidence; account API authentication and storefront ingestion remain open.
- [x] Build the [owned catalog and reviewed quote workflow](OWNED_CATALOG_AND_RFQ.md): source staging/pagination, curated product/variant editing, publication-bound image uploads, immutable request lines, customer briefs and private operator costing. Stage 5,643 supplier candidates privately; 158 automated tests and ten local browser journeys pass. Supplier candidates require curation before customer publication.
- [x] Verify the owned-catalog workflow on both protected HTTPS previews, including the 5,643-record private upload, draft/public image access, customer brief, private costs and issued quote. Fix and regression-test overlapping catalog saves; remove temporary Access test credentials afterward.
- [x] Add the [Shopify read-only connector foundation](SHOPIFY_CONNECTOR.md): per-merchant configuration, strict store/version/scope checks, official Admin GraphQL client and synthetic private imports. Real installations, OAuth/refresh/webhooks, order/publishing writes and multi-merchant distribution remain unimplemented and blocked.
- [x] Verify 169 current automated checks across 31 files and all 11 local browser journeys. Validate all three Shopify read queries against the official Admin GraphQL 2026-10 schema; no live Shopify store accessed.
- [x] Deploy the gated Shopify panel to the existing protected development previews and verify merchant configuration, mock capabilities, private source imports and live-action denials through HTTPS. Reverify the complete owned-catalog/customer-quote journey on that image; restore owner-only Access after testing.
- [ ] Pass the [selling readiness gates](SELLING_READINESS.md), including persistent database/media, verified commercial product facts, real payment/tax/production workflows and the full V1 acceptance suite. Paid production sales are not approved.
- [ ] Wire reviewed native supplier profiles into the Integration Center and worker with durable secrets/assets, exact media mapping and independent capability tests; GAP-020–022 remain open.
- [x] Correct preliminary preflight to report unverified producer DPI/bleed requirements without invented defaults; 143 automated tests and nine local browser journeys pass. No new preview deployment was made for this correction.
- [ ] Implement versioned producer profiles, exact design/configuration binding, qualified review and validated production output; GAP-018 remains open.
- [ ] Implement the researched feature designs in the existing application and execute their behavioral tests; preserve Coming Soon scope.
- [ ] Execute GAP-002–040 with commit-specific tests and explicit external activation gates.

- [x] Locate greenfield repository and supplied handoff.
- [x] Inventory all 85 supplied files and all 20 registered modules.
- [x] Create requirements-to-code-to-test matrix before implementation.
- [ ] Gate A: scoped identity, database, RLS, secrets interface, audit, outbox, CI.
- [x] First browser preview: both apps, 40 products, 10 contacts, imports.
- [x] Isolated Cloudflare Workers previews and owner-only Access applications.
- [x] Real HTTPS browser verification: customer sign-in, exact variant, saved cart/RFQ, owner sign-in and saved CRM contact.
- [x] Empty Supabase development project provisioned: 96 application tables, RLS, no anonymous table grants, restricted application login, zero security-advisor findings.
- [x] 139 automated unit, security and PostgreSQL integration tests; type checking and production builds.
- [x] Publish the final contrast correction and verify both restored HTTPS interfaces in a real browser.
- [x] Correct Classic Camp Cap artwork for all three synthetic colors; local browser save/proof approval regression passes.
- [ ] Bind color changes after an existing design save to a new variant-specific project/revision before production artwork activation.
- [ ] Activate the configured Supabase Session pooler after receiving its trusted CA certificate; verify persistent state. Current previews use temporary synthetic PostgreSQL.
- [ ] Replace temporary artwork and credential storage before claiming durable storage or accepting live credentials.
- [ ] Gate B: catalog/configuration/creative/commerce.
- [ ] Gate C: CRM, estimates/quotes, orders, jobs, POs, fulfillment.
- [ ] Gate D: finance, stores, BYOB, marketing, automation, analytics.
- [ ] Gate E: file imports, native SOAP fixture contracts, licensed ASI interface.
- [ ] Gate F: integrated A01–A40, inherited T01–T30 and E01–E25 evidence.
- [ ] Production activation (credentials, licensing, security, legal/finance and deployment approval).

## Metered supplier API extension — November 9

- [x] Inventory extension requirements before implementation; preserve all 20 original modules and 95 acceptance scenarios.
- [x] Implement per-login call/unit limits, shared account USD ceilings, immutable committed reservations, cache and encrypted write-only credentials.
- [x] Implement no-code Commerce OS settings, usage/receipt review, pause controls and bounded read/private source selection.
- [x] Keep monthly named-user and one-time System/Public SAGE credits separate; test duplicate connections and month rollover.
- [x] Implement/test owner-supplied SAGE v130101/103/104/105 contracts without making authenticated SAGE requests.
- [x] Verify real public SinaLite sandbox catalog, options and configuration-price reads; stage three PRINT sources privately.
- [x] Pass 250 backend checks, full 13 browser journeys, TypeScript, both optimized builds, specification and gap-plan integrity.
- [x] Deploy owner-approved supplier source `916160b` to the existing protected preview runtime; read back image, flags and owner-only Access policies.
- [ ] Verify authenticated hosted workflows for that image. November 10 CMS changes require a separate preview update.
- [ ] Verify durable approved development PostgreSQL and storage before real metered accounts.
- [ ] Obtain rotated SAGE and SinaLite API credentials through secure backend entry; confirm tariffs, limits and data rights.
- [ ] Implement/activate native scheduled sync, licensed automatic media/template downloads, customer source-option selectors and automatic supplier costing.
- [ ] Verify live account product/option/image coverage and reviewed public catalog/quote test runs before real sales.

See [supplier API traceability](supplier-api/TRACEABILITY.csv). These checkboxes do not close the original active V1 or launch gates.
