# V1 gap coverage matrix

Baseline: `57c58603aadcac8d2258d587121be12331bed10a`. This is a planning map, not a test pass report. All 205 existing inventory entries are mapped in [requirements-to-work.json](requirements-to-work.json).

| Module | Existing implementation observed | Remaining work | Work items |
| --- | --- | --- | --- |
| foundation | Scoped memberships, seller records, audit and immutable records exist. | Finish action/resource policy, grants, membership lifecycle, seller assignment, evidence-based activation and recovery. | GAP-001, GAP-002, GAP-003, GAP-004, GAP-005, GAP-006, GAP-008, GAP-032, GAP-033, GAP-034, GAP-035, GAP-037, GAP-038, GAP-039, GAP-040 |
| today | Tasks, exceptions, owner time and dashboard summaries exist. | Calculate whole-dataset KPIs, connect real waiting/SLA events and expose remediation with reconciled owner-time metrics. | GAP-008, GAP-027, GAP-030, GAP-031, GAP-038 |
| crm | Contacts, accounts, lead transitions, activity and lead import exist. | Add transactional identity/merge, complete relationship/follow-up lifecycle and RFQ/order timeline. | GAP-028, GAP-029, GAP-030, GAP-038 |
| catalog | Published snapshots, bulk preview, revisions, collections and exact-image projection exist. | Unify canonical identity, complete media/variant editing and safe rollback; replace capped search. | GAP-006, GAP-010, GAP-014, GAP-015, GAP-016, GAP-017, GAP-019, GAP-021, GAP-022, GAP-023, GAP-033, GAP-036, GAP-038 |
| supplier | Provider registry, local encrypted credentials, CSV/XML staging and mock capability setup exist. | Managed vault, native independent service profiles, full wizard, scheduled evidence refresh and licensed ASI remain incomplete. | GAP-002, GAP-004, GAP-005, GAP-007, GAP-010, GAP-014, GAP-015, GAP-016, GAP-020, GAP-021, GAP-022, GAP-023, GAP-025, GAP-030, GAP-031, GAP-034, GAP-035, GAP-036, GAP-038, GAP-039, GAP-040 |
| configuration | Typed AST, rule analysis, templates, zone records and batch assignments exist. | Bind authoritative family/options/zone revisions to UI, designer, quote and server validation. | GAP-009, GAP-017, GAP-018, GAP-019, GAP-024, GAP-038 |
| creative | Private raster preview, immutable versions, visual proof and synthetic render jobs exist. | Fix exact variant/spec binding; persist/scan assets; complete 2D editing and method-specific production review. | GAP-002, GAP-003, GAP-005, GAP-009, GAP-016, GAP-017, GAP-018, GAP-019, GAP-024, GAP-034, GAP-038, GAP-039 |
| estimating | Decimal component estimates, tiers and margin checks exist. | Fix premature unit rounding and eligible source/policy selection; complete revisions, freight/tax assumptions and approvals. | GAP-010, GAP-013, GAP-021, GAP-027, GAP-038 |
| commerce | Catalog, product options, customer sessions, carts, RFQs, accounts and reorder exist. | Preserve program/kit/artwork identity, server-side pagination/shareable filters and authorized complete commitment flows. | GAP-002, GAP-007, GAP-008, GAP-009, GAP-011, GAP-012, GAP-013, GAP-016, GAP-017, GAP-033, GAP-034, GAP-038, GAP-039, GAP-040 |
| stores | Program types, membership, standalone budget checks/reservations and fundraiser references exist. | Enforce the policy in cart/quote/order, make reservations idempotent across the lifecycle, finish redemption and program closeout. | GAP-005, GAP-006, GAP-011, GAP-013, GAP-032, GAP-038, GAP-039 |
| byob | Template/components, private source proposals and separate calculator costs exist. | Carry kit identity, packing/assembly/freight and component allocations through cart, agreement, jobs and fulfillment. | GAP-012, GAP-038 |
| sales | Costed quotes, margin approvals, issued revisions, acceptance and immutable order lines exist. | Bind seller, credit, tax/freight, exact art/configuration; complete decline/expiry/revision and concurrency behavior. | GAP-006, GAP-007, GAP-009, GAP-010, GAP-011, GAP-012, GAP-013, GAP-027, GAP-028, GAP-031, GAP-032, GAP-038 |
| orders | Jobs, fixed operations, readiness guards, QC and exceptions exist. | Build component/decorator routes, enforce operation dependencies and quantities, and complete decorated production/rework flows. | GAP-006, GAP-007, GAP-012, GAP-018, GAP-024, GAP-025, GAP-026, GAP-038, GAP-039 |
| procurement | Mock PO approval, idempotent submission and UNKNOWN_OUTCOME reconciliation exist. | Purchase by requirement, verify approved payload hashes and implement separately authorized native submit/reconcile profiles. | GAP-018, GAP-020, GAP-024, GAP-025, GAP-036, GAP-038 |
| fulfillment | Mock partial shipments, tracking projections and return/remake requests exist. | Finish provider events, allocation quantities, audited return/remake resolution and duplicate-label prevention. | GAP-007, GAP-012, GAP-020, GAP-024, GAP-026, GAP-027, GAP-036, GAP-038 |
| finance | Immutable actual costs, mock payment/invoice references and profit snapshots exist. | Complete real reference adapter contracts, partial refunds/corrections, actual owner-time closeout and whole-dataset reporting. | GAP-006, GAP-010, GAP-011, GAP-013, GAP-020, GAP-026, GAP-027, GAP-030, GAP-034, GAP-036, GAP-038, GAP-039, GAP-040 |
| marketing | Drafts, consent-filtered local previews and operator attribution exist. | Complete content revisions, approval invalidation, segments, suppression and approved communication contracts. | GAP-005, GAP-028, GAP-029, GAP-031, GAP-038 |
| workflow | Typed AST, dry run, local safe effects, throttling and idempotent runs exist. | Unify real emitted names, durable leases, rule revisions/runtime dependency enforcement and operator recovery. | GAP-007, GAP-022, GAP-029, GAP-031, GAP-035, GAP-038 |
| analytics | Saved report types, freshness views and CSV exports exist. | Use complete scoped aggregates, server paging, KPI definitions, quality remediation and unified safe exports. | GAP-001, GAP-022, GAP-030, GAP-033, GAP-035, GAP-038, GAP-039 |
| future | A Coming Soon directory and backend mutation denial exist. | Preserve all deferred placeholders and negative tests; do not activate AI, 3D, digitization, SaaS, GL/payroll or enterprise MRP. | GAP-001, GAP-040 |

## Full acceptance inventory

A = controlling cross-module suite; T = inherited product-architecture suite; E = inherited blueprint suite. Inherited assertions supplement the controlling suite and do not override its Coming Soon or safety boundaries. Every row remains open until full assertion evidence exists.

| ID | Journey | Work items | Result |
| --- | --- | --- | --- |
| A01 | First launch, synthetic seed | GAP-002, GAP-008, GAP-037, GAP-038 | OPEN |
| A02 | Tenant boundaries | GAP-005, GAP-006, GAP-034 | OPEN |
| A03 | Add simulated supplier | GAP-004, GAP-021, GAP-034 | OPEN |
| A04 | Invalid SOAP supplier auth | GAP-020, GAP-021 | OPEN |
| A05 | Import valid CSV | GAP-014, GAP-015, GAP-021 | OPEN |
| A06 | Import XML with DTD | GAP-015, GAP-020, GAP-034 | OPEN |
| A07 | Malformed/duplicate source | GAP-014, GAP-015 | OPEN |
| A08 | Supplier human edit conflict | GAP-014, GAP-015, GAP-022 | OPEN |
| A09 | Product color swatch | GAP-009, GAP-016, GAP-017 | OPEN |
| A10 | Bulk publish 100 SKUs | GAP-006, GAP-014, GAP-015, GAP-016, GAP-033, GAP-039 | OPEN |
| A11 | Missing cost/freight | GAP-010, GAP-013, GAP-036 | OPEN |
| A12 | MOQ and quantity tiers | GAP-010, GAP-017 | OPEN |
| A13 | Dependent decoration options | GAP-009, GAP-017 | OPEN |
| A14 | Customer uploads logo | GAP-003, GAP-009, GAP-019, GAP-034 | OPEN |
| A15 | Batch mockups | GAP-016, GAP-019, GAP-039 | OPEN |
| A16 | Preflight failed DPI | GAP-003, GAP-017, GAP-018 | OPEN |
| A17 | Revised art after approval | GAP-009, GAP-018 | OPEN |
| A18 | RFQ to issued quote | GAP-010, GAP-013, GAP-028 | OPEN |
| A19 | Price below margin floor | GAP-010, GAP-013, GAP-005 | OPEN |
| A20 | Accepted quote to order | GAP-006, GAP-009, GAP-013, GAP-032 | OPEN |
| A21 | Mixed hats+brochures+tent | GAP-012, GAP-024, GAP-025, GAP-026 | OPEN |
| A22 | Supplier PO timeout | GAP-007, GAP-020, GAP-025 | OPEN |
| A23 | Partial shipment | GAP-024, GAP-026 | OPEN |
| A24 | Outsourced decorated apparel | GAP-010, GAP-018, GAP-024, GAP-025 | OPEN |
| A25 | POD sandbox fulfillment | GAP-020, GAP-026, GAP-036 | OPEN |
| A26 | Company store limits | GAP-005, GAP-011, GAP-013 | OPEN |
| A27 | School fundraiser | GAP-011, GAP-027 | OPEN |
| A28 | BYOB kit | GAP-010, GAP-012, GAP-024 | OPEN |
| A29 | Finance reference | GAP-006, GAP-027, GAP-036 | OPEN |
| A30 | Profit closeout | GAP-010, GAP-027, GAP-030 | OPEN |
| A31 | CRM and marketing | GAP-005, GAP-028, GAP-029 | OPEN |
| A32 | Automation dry-run | GAP-007, GAP-031 | OPEN |
| A33 | Unknown adapter | GAP-020, GAP-021, GAP-023, GAP-036 | OPEN |
| A34 | SSRF attempt | GAP-004, GAP-020, GAP-034 | OPEN |
| A35 | Webhook replay | GAP-007, GAP-027, GAP-034, GAP-036 | OPEN |
| A36 | Coming Soon | GAP-005, GAP-032, GAP-040 | OPEN |
| A37 | Keyboard/mobile UX | GAP-008, GAP-017, GAP-033, GAP-038 | OPEN |
| A38 | Failed provider sync | GAP-014, GAP-016, GAP-022 | OPEN |
| A39 | Restore drill | GAP-002, GAP-003, GAP-004, GAP-035 | OPEN |
| A40 | Fresh install | GAP-002, GAP-006, GAP-037, GAP-039 | OPEN |
| E01 | Customer searches, filters departments and product variants | GAP-014, GAP-016, GAP-033, GAP-038 | OPEN |
| E02 | Customer configures polo color/size + logo, previews then submits RFQ | GAP-009, GAP-011, GAP-013, GAP-017, GAP-019 | OPEN |
| E03 | Admin ingests provider synthetic products (100k seeded variants for performance benchmark) | GAP-014, GAP-015, GAP-033, GAP-039 | OPEN |
| E04 | Two suppliers offer same manufacturer/model | GAP-014, GAP-020, GAP-025 | OPEN |
| E05 | Supplier sync tries to overwrite curated copy and imprint verified by staff | GAP-014, GAP-017, GAP-022 | OPEN |
| E06 | Price estimate mixes blank item, embroidery, rush, setup, freight and tax | GAP-010, GAP-013, GAP-027 | OPEN |
| E07 | Margin below 30% without approval | GAP-005, GAP-010, GAP-013 | OPEN |
| E08 | Quote revision issued then modified | GAP-006, GAP-009, GAP-013 | OPEN |
| E09 | Two first orders prepaid, account terms later Net15 | GAP-013, GAP-027 | OPEN |
| E10 | Approved order with two suppliers and one decorator | GAP-018, GAP-024, GAP-025 | OPEN |
| E11 | Proof not approved then attempt to send supplier PO | GAP-018, GAP-025 | OPEN |
| E12 | Supplier misses ship date | GAP-022, GAP-024, GAP-026, GAP-031 | OPEN |
| E13 | Print order needs bleed/preflight | GAP-017, GAP-018, GAP-040 | OPEN |
| E14 | MOQ1 POD offer not verified | GAP-010, GAP-017, GAP-036 | OPEN |
| E15 | Customer reorder | GAP-009, GAP-013, GAP-033 | OPEN |
| E16 | Import and editing 20 products in one operation | GAP-015, GAP-017, GAP-038 | OPEN |
| E17 | Unauthorized external customer requests another customer's file | GAP-003, GAP-005, GAP-034 | OPEN |
| E18 | Tenant B and venture B read customer or supplier private records | GAP-005, GAP-006, GAP-032, GAP-034 | OPEN |
| E19 | Duplicate supplier order submission or duplicate payment webhook | GAP-007, GAP-025, GAP-027 | OPEN |
| E20 | Coming Soon modules navigation | GAP-005, GAP-032, GAP-040 | OPEN |
| E21 | QuickBooks sandbox invoice or mock external ref | GAP-027, GAP-036 | OPEN |
| E22 | Complete quote→order→job→delivery→profit | GAP-013, GAP-018, GAP-024, GAP-025, GAP-026, GAP-027 | OPEN |
| E23 | 100k+ variant load/search benchmark | GAP-033, GAP-039 | OPEN |
| E24 | Module flag changes to ACTIVE without test evidence | GAP-005, GAP-032, GAP-040 | OPEN |
| E25 | New tenant business seller legal entity changes | GAP-013, GAP-032 | OPEN |
| T01 | Synthetic fresh install | GAP-001, GAP-002, GAP-037 | OPEN |
| T02 | Public product discovery | GAP-009, GAP-014, GAP-016, GAP-033, GAP-038 | OPEN |
| T03 | Product configuration | GAP-010, GAP-017 | OPEN |
| T04 | Customer brand assets | GAP-003, GAP-009, GAP-019 | OPEN |
| T05 | Art previews | GAP-009, GAP-018, GAP-019 | OPEN |
| T06 | Admin template bulk | GAP-015, GAP-017, GAP-019, GAP-038 | OPEN |
| T07 | CSV supplier import | GAP-014, GAP-015, GAP-022 | OPEN |
| T08 | Native PromoStandards contract | GAP-020, GAP-021, GAP-022 | OPEN |
| T09 | Source resolution | GAP-010, GAP-014, GAP-020 | OPEN |
| T10 | Estimate pricing | GAP-010, GAP-013 | OPEN |
| T11 | Quote revision | GAP-006, GAP-009, GAP-013 | OPEN |
| T12 | Customer request to order | GAP-009, GAP-011, GAP-013, GAP-027 | OPEN |
| T13 | Mixed order | GAP-012, GAP-024, GAP-025, GAP-026 | OPEN |
| T14 | Supplier purchase authorization | GAP-007, GAP-018, GAP-025 | OPEN |
| T15 | POD MOQ 1 | GAP-010, GAP-017, GAP-020, GAP-036 | OPEN |
| T16 | Company store | GAP-005, GAP-011, GAP-013 | OPEN |
| T17 | Fundraiser | GAP-011, GAP-027 | OPEN |
| T18 | BYOB bundle | GAP-010, GAP-012, GAP-024, GAP-025 | OPEN |
| T19 | Job MIS | GAP-018, GAP-024, GAP-026 | OPEN |
| T20 | Shipment | GAP-020, GAP-026, GAP-036 | OPEN |
| T21 | Finance | GAP-010, GAP-013, GAP-027, GAP-030 | OPEN |
| T22 | Marketing | GAP-028, GAP-029 | OPEN |
| T23 | Automation | GAP-007, GAP-031 | OPEN |
| T24 | Confidentiality | GAP-004, GAP-014, GAP-016, GAP-034 | OPEN |
| T25 | Security | GAP-005, GAP-006, GAP-034 | OPEN |
| T26 | Coming Soon | GAP-005, GAP-032, GAP-040 | OPEN |
| T27 | Resilience | GAP-007, GAP-022, GAP-025, GAP-031, GAP-035 | OPEN |
| T28 | Accessibility | GAP-008, GAP-038 | OPEN |
| T29 | Scale | GAP-015, GAP-019, GAP-033, GAP-039 | OPEN |
| T30 | Owner workflow | GAP-013, GAP-018, GAP-024, GAP-025, GAP-027, GAP-038, GAP-040 | OPEN |
