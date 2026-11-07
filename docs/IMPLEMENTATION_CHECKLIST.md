# Visible implementation checklist

The [gap closure plan](GAP_CLOSURE_PLAN.md), [40-work-package audit](planning/GAP_AUDIT.md) and [complete coverage matrix](planning/COVERAGE_MATRIX.md) govern the remaining active V1 work. Research/planning completion does not mean implementation completion.

- [x] Research 30 primary sources and audit all 20 module contracts.
- [x] Map 205 inventory entries and all 95 A/T/E acceptance scenarios; reproduce pricing, program-context and approval-role defects.
- [x] Research all 17 requested companies for features to adapt into original TwelveSpec software; deliver [35 feature designs, data requirements and proposed tests](business-research/README.md).
- [x] Expand public industry research to 16 business domains using 36 association, standards and specialist sources; link all 19 active modules in the [industry supplement](industry-research/README.md).
- [x] Review official ASI SmartLink/ESP Updates distinctions and SAGE Connect access/usage requirements in the [supplier access assessment](industry-research/SUPPLIER_DATA_ACCESS.md); account correspondence remains in a private owner evidence packet.
- [x] Verify PCNA staging Product Data 2.0.0 and Media Content 1.1.0 with issued staging credentials; retrieve a blank photo and raster template preview. Verify SinaLite public sandbox catalog/detail reads. Account-specific evidence stays private; application synchronization is still simulated.
- [x] Reconcile current 4over, Rivers Promo and S&S access requirements, licensed data/media routes and credential gaps; keep account-specific eligibility decisions private. None of these three is marked authenticated from this development build.
- [x] Retrieve S&S Categories/Styles workbooks and one style image through the supplier's public download route without credentials. Preserve private source evidence; account API authentication and storefront ingestion remain open.
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
