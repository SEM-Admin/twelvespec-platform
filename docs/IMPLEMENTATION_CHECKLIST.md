# Visible implementation checklist

November 22 QC continuation: [explicit inspection controls, traceability and remaining manufacturing requirements](QUALITY_INSPECTION.md). Missing inspections can no longer default to a pass. Results are immutable and bound to the job, operator and revision; completion and shipment validate them again. Full production routing and independent validation remain open.

- [x] Require explicit checks, preserve failed/rework evidence and reject stale/concurrent inspection submissions.
- [x] Gate job completion and fulfillment on current inspection evidence and existing financial/artwork release requirements.
- [x] Add audited reinspection for unshipped jobs; preserve shipped/closed history.
- [x] Pass local backend regression (391 tests / 51 files), focused operator browser workflow, both builds, TypeScript and integrity checks. Require exact-head CI to repeat the complete 29-browser suite and isolated production-container check before integration.
- [ ] Deploy migrations 016–017 and verify hosted workflows only after deployment authorization.

November 22 source continuation: [durable originals/derivatives, requirements-to-code-to-test mapping and remaining gates](DURABLE_ASSETS.md). New Creative uploads, safe previews, mockups and owned-catalog photos use the existing canonical PostgreSQL asset registry. Generic metadata responses omit file bytes. The storage milestone is merged in [PR #12](https://github.com/SEM-Admin/twelvespec-platform/pull/12) after [both CI jobs passed](https://github.com/SEM-Admin/twelvespec-platform/actions/runs/44999431578); its migration is source/local only pending approved hosted rollout; independent malware scanning, legacy-file migration and production file release remain open.

- [x] Preserve exact private originals and separate safe derivatives in the domain transaction.
- [x] Verify new-process recovery, failed-transaction rollback, buyer/workspace isolation, immutable identities, checksum failures and legacy filesystem reads with synthetic data.
- [x] Pass the full local regression: 374 backend tests / 50 files, all 28 browser journeys, TypeScript, both builds and specification/research integrity. Exact-head GitHub CI is required before merge; its receipt belongs on the pull request.
- [ ] Deploy migration 016 and verify hosted file persistence after authorization.
- [ ] Activate independent malware scanning, retention/quotas and managed file recovery before production release.

November 18 hosted continuation: [actual deployment, browser verification and remaining gates](supplier-api/HOSTED_VERIFICATION_2026-11-18.md), [machine-readable evidence](supplier-api/evidence/hosted-preview-2026-11-18.json), and [pilot traceability](supplier-api/SAGE_PILOT.md). The owner-approved protected previews now use the isolated Supabase development database: 15 migrations, 114 application + 9 public-schema tables, 40 synthetic products, 120 variants and four demo users. Actual HTTPS customer/operator sign-in, a reviewed $200 synthetic quote, hosted SAGE mock metering/cache/caps, session/data persistence through restart and scoped encrypted-credential recovery pass. Temporary test Access credentials/policy were removed and revocation verified. Application source CI passes 364 backend tests and 27 browser tests plus the isolated production-container acceptance. Real SAGE credentials, current credit/tariff/provider-stop confirmation, supplier media rights and live data remain unverified. Hosted guest inquiry remains disabled by its existing activation gate. No DNS, ASI production site, supplier orders or payments changed; the original full V1 and production-release gates remain open.

- [x] Attach only the approved isolated Supabase development project and verify real application writes and restart persistence.
- [x] Verify the protected storefront → customer request → private operator review → issued customer quote in a real browser.
- [x] Verify hosted synthetic SAGE reservations, cache reuse, hard cap, pause, private staging and zero extra calls from storefront browsing.
- [x] Recover hosted synthetic credential ciphertext with the existing source resolver and stable key; reject wrong keys and scope.
- [x] Remove the one-hour test Access policy/token, restore owner-only policies and verify old credentials return HTTP 401.
- [ ] Configure a current SAGE System/Public key securely and confirm entitlement, query weights, remaining credits and provider paid-query stopping behavior.
- [ ] Verify a narrow real SAGE read, licensed selected products/media and their own curated catalog-to-quote journey before DNS cutover.
- [ ] Activate and verify hosted guest inquiry with production identity, real spam protection, notifications/review coverage and public-release approval. The protected signed-in quote flow is verified separately.

The dated entries below retain their original measurement scope and do not supersede the hosted evidence above.

Curated catalog / one quote workflow continuation: [decision, original-file audit, requirements and activation dependencies](catalog-curation/ONE_QUOTE_WORKFLOW.md) and [verification evidence and limits](catalog-curation/VERIFICATION.md). All five uploaded files are retained; JSON, CSV and workbook agree on 106 unverified product families, 54 research methods and 24 sources. The fresh local regression passes **361 backend tests / 48 files and all 27 browser journeys**, TypeScript, both optimized builds and all specification/research/provenance checks. Final-head GitHub CI is required before integration; its receipt belongs on the pull request. ASI SmartLink entitlement/current contracts remain unconfirmed; no live supplier API, deployment or production change is made.

Final review also restricts the Sales intake panel to authorized staff. TypeScript and both inquiry journeys pass again after this presentation correction, including actual customer sign-in and direct API denial. The full local measurements above precede that correction; final-head CI must repeat the complete suite.

November 17 quote-first continuation: [requirements → code → verification and domain cutover gates](QUOTE_FIRST_LAUNCH.md) and [verification evidence and limitations](QUOTE_FIRST_VERIFICATION.md). The fresh local run passes **354 backend tests / 46 files and all 26 browser journeys**, TypeScript, both optimized builds and all specification/research integrity checks. Public activation is off; no remote database, deployed application, domain or mail routing was changed. Integration must verify the final GitHub CI head; its receipt is recorded on the pull request.

- [x] Add account-free inquiry persistence to the existing private CRM, with a linked Today review task, minimal transactional receipts and idempotent retries.
- [x] Preserve unverified contact identity, requested-project permission, existing contacts, financial controls and the authenticated quote workflow.
- [x] Add a paged protected inbox, reviewed status/notes, concurrency checks and rolling request caps.
- [x] Finish local browser/build verification; provide a reviewable GitHub pull request and require final-head CI before integration.
- [ ] Complete persistent hosted storage and production identity/notification/privacy requirements, verify real spam protection and deploy an approved quote-first candidate.
- [ ] Export/approve the full DNS diff and rollback; authorize and verify the domain cutover without changing email routing.

Previous CIA continuation: [service-claim requirements/code/test matrix](cia/CLAIM_PUBLICATION_PLAN.md), [verification, operating instructions and remaining gates](cia/CLAIM_PUBLICATION_VERIFICATION.md), plus the [connected workflow](cia/CONNECTED_QUALIFICATION_PLAN.md), [compatibility audit](cia/CODEBASE_COMPATIBILITY_AUDIT.md) and [customer-trust audit](cia/CUSTOMER_TRUST_AUDIT.md). That fresh-data local run passed all 346 backend tests / 45 files and all 24 browser journeys. PRs #4–#6 are merged; [final PR #6 GitHub CI passed](https://github.com/SEM-Admin/twelvespec-platform/actions/runs/43579066711). Structured service claims reuse CMS approvals and current source rights; complete local database restore includes CIA and supplier-metering state. No hosted/production activation is implied. Free-text/product-specific claims, manufacturing engines and the original full V1/80 CMS acceptance remain open.

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
- [x] Bind color changes after a design save to a new variant-specific project/revision; verified before the November 18 hosted rollout. Production artwork activation remains independently blocked.
- [x] Activate the approved Supabase development Session pooler with trusted TLS and verify persistent state; November 18 hosted receipt above supersedes the former temporary-database limitation.
- [ ] Deploy and verify the new durable artwork source milestone. Scoped PostgreSQL credential ciphertext/key recovery is verified for synthetic credentials; real accounts still require secure setup and provider/financial checks.
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
