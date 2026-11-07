# Research-to-code-to-test traceability

This design overlay preserves all 20 modules, 205 inventory entries and 95 original acceptance scenarios. All application acceptance remains open. A planning intersection is a dependency to review, not evidence of implementation.

The full [machine-readable trace](traceability.json) retains each module/screen/command entry, its gap IDs and related feature packs. The workbook exposes the same inventory and proposed tests.

## Module coverage

| Module | Availability | Feature packs | Existing source |
| --- | --- | --- | --- |
| foundation | ACTIVE_V1_SPEC | F09, F16, F21, F26, F28, F29, F30, F32 | [packages/foundation/src/index.ts](../../packages/foundation/src/index.ts) |
| today | ACTIVE_V1_SPEC | F20, F24, F26, F27, F34, F35 | [packages/today/src/index.ts](../../packages/today/src/index.ts) |
| crm | ACTIVE_V1_SPEC | F01, F08, F09, F23, F25, F27, F34 | [packages/crm/src/index.ts](../../packages/crm/src/index.ts) |
| catalog | ACTIVE_V1_SPEC | F01, F02, F03, F15, F16, F17, F18, F25, F29, F30 | [packages/catalog/src/index.ts](../../packages/catalog/src/index.ts) |
| supplier | ACTIVE_V1_SPEC | F03, F16, F17, F18, F19, F28, F29, F32 | [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts) |
| configuration | ACTIVE_V1_SPEC | F02, F05, F06, F17, F19, F31 | [packages/configuration/src/index.ts](../../packages/configuration/src/index.ts) |
| creative | ACTIVE_V1_SPEC | F05, F06, F07, F25, F31, F32 | [packages/creative/src/index.ts](../../packages/creative/src/index.ts) |
| estimating | ACTIVE_V1_SPEC | F02, F04, F08, F13, F14, F18, F24, F31 | [packages/estimating/src/index.ts](../../packages/estimating/src/index.ts) |
| commerce | ACTIVE_V1_SPEC | F01, F02, F05, F09, F10, F11, F12, F13, F15, F22, F30 | [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts) |
| stores | ACTIVE_V1_SPEC | F06, F09, F10, F11, F12, F30 | [packages/stores/src/index.ts](../../packages/stores/src/index.ts) |
| byob | ACTIVE_V1_SPEC | F13 | [packages/byob/src/index.ts](../../packages/byob/src/index.ts) |
| sales | ACTIVE_V1_SPEC | F04, F08, F10, F14, F15, F34 | [packages/sales/src/index.ts](../../packages/sales/src/index.ts) |
| orders | ACTIVE_V1_SPEC | F07, F10, F11, F13, F14, F20, F21, F22, F23, F31, F35 | [packages/orders/src/index.ts](../../packages/orders/src/index.ts) |
| procurement | ACTIVE_V1_SPEC | F16, F19, F20, F21, F35 | [packages/procurement/src/index.ts](../../packages/procurement/src/index.ts) |
| fulfillment | ACTIVE_V1_SPEC | F07, F13, F19, F20, F22, F23, F35 | [packages/fulfillment/src/index.ts](../../packages/fulfillment/src/index.ts) |
| finance | ACTIVE_V1_SPEC | F04, F10, F12, F14, F19, F21, F23, F24, F27, F28 | [packages/finance/src/index.ts](../../packages/finance/src/index.ts) |
| marketing | ACTIVE_V1_SPEC | F06, F25, F34 | [packages/marketing/src/index.ts](../../packages/marketing/src/index.ts) |
| workflow | ACTIVE_V1_SPEC | F18, F26, F28, F32 | [packages/workflows/src/index.ts](../../packages/workflows/src/index.ts) |
| analytics | ACTIVE_V1_SPEC | F24, F27 | [packages/analytics/src/index.ts](../../packages/analytics/src/index.ts) |
| future | COMING_SOON | F33 | [packages/contracts/src/index.ts](../../packages/contracts/src/index.ts) |

## Original acceptance dependencies

| ID | Journey | Gap work | Feature dependency |
| --- | --- | --- | --- |
| A01 | First launch, synthetic seed | GAP-002, GAP-008, GAP-037, GAP-038 | F01, F02, F08, F15, F27, F30, F32, F33, F34 |
| A02 | Tenant boundaries | GAP-005, GAP-006, GAP-034 | F09, F10, F14, F16, F20, F21, F25, F28, F29, F32, F34 |
| A03 | Add simulated supplier | GAP-004, GAP-021, GAP-034 | F16, F28, F29, F32 |
| A04 | Invalid SOAP supplier auth | GAP-020, GAP-021 | F16, F18, F19, F29 |
| A05 | Import valid CSV | GAP-014, GAP-015, GAP-021 | F02, F03, F16, F17, F29 |
| A06 | Import XML with DTD | GAP-015, GAP-020, GAP-034 | F03, F16, F17, F18, F19, F28, F29, F32 |
| A07 | Malformed/duplicate source | GAP-014, GAP-015 | F02, F03, F17 |
| A08 | Supplier human edit conflict | GAP-014, GAP-015, GAP-022 | F02, F03, F16, F17, F18, F29 |
| A09 | Product color swatch | GAP-009, GAP-016, GAP-017 | F01, F02, F03, F05, F06, F07, F15, F17, F25, F31 |
| A10 | Bulk publish 100 SKUs | GAP-006, GAP-014, GAP-015, GAP-016, GAP-033, GAP-039 | F01, F02, F03, F09, F10, F14, F17, F20, F21, F25, F27, F28, F30, F32 |
| A11 | Missing cost/freight | GAP-010, GAP-013, GAP-036 | F02, F04, F08, F10, F12, F13, F14, F15, F18, F19, F21, F22, F24 |
| A12 | MOQ and quantity tiers | GAP-010, GAP-017 | F02, F04, F05, F06, F13, F14, F18, F19, F24, F31 |
| A13 | Dependent decoration options | GAP-009, GAP-017 | F02, F05, F06, F07, F15, F31 |
| A14 | Customer uploads logo | GAP-003, GAP-009, GAP-019, GAP-034 | F05, F06, F07, F15, F16, F25, F28, F29, F31, F32 |
| A15 | Batch mockups | GAP-016, GAP-019, GAP-039 | F01, F03, F05, F06, F17, F25, F30, F32 |
| A16 | Preflight failed DPI | GAP-003, GAP-017, GAP-018 | F02, F05, F06, F07, F20, F31, F32, F35 |
| A17 | Revised art after approval | GAP-009, GAP-018 | F05, F07, F15, F20, F31, F35 |
| A18 | RFQ to issued quote | GAP-010, GAP-013, GAP-028 | F01, F02, F04, F08, F09, F10, F12, F13, F14, F15, F18, F19, F21, F23, F24, F26, F27, F34 |
| A19 | Price below margin floor | GAP-010, GAP-013, GAP-005 | F02, F04, F08, F09, F10, F12, F13, F14, F15, F16, F18, F19, F21, F24, F25, F28, F34 |
| A20 | Accepted quote to order | GAP-006, GAP-009, GAP-013, GAP-032 | F04, F05, F07, F08, F09, F10, F12, F14, F15, F20, F21, F24, F28, F31, F33 |
| A21 | Mixed hats+brochures+tent | GAP-012, GAP-024, GAP-025, GAP-026 | F07, F11, F13, F19, F20, F21, F22, F23, F31, F35 |
| A22 | Supplier PO timeout | GAP-007, GAP-020, GAP-025 | F16, F18, F19, F20, F21, F26, F29, F32, F35 |
| A23 | Partial shipment | GAP-024, GAP-026 | F07, F11, F13, F19, F20, F22, F23, F31, F35 |
| A24 | Outsourced decorated apparel | GAP-010, GAP-018, GAP-024, GAP-025 | F02, F04, F07, F11, F13, F14, F18, F19, F20, F21, F22, F24, F31, F35 |
| A25 | POD sandbox fulfillment | GAP-020, GAP-026, GAP-036 | F13, F16, F18, F19, F20, F22, F23, F24, F29, F35 |
| A26 | Company store limits | GAP-005, GAP-011, GAP-013 | F04, F06, F08, F09, F10, F11, F12, F14, F15, F16, F21, F24, F25, F28, F34 |
| A27 | School fundraiser | GAP-011, GAP-027 | F04, F06, F09, F10, F11, F12, F15, F21, F23, F24, F27 |
| A28 | BYOB kit | GAP-010, GAP-012, GAP-024 | F02, F04, F07, F11, F13, F14, F18, F19, F20, F22, F24, F31, F35 |
| A29 | Finance reference | GAP-006, GAP-027, GAP-036 | F04, F09, F10, F12, F14, F19, F20, F21, F22, F23, F24, F27, F28 |
| A30 | Profit closeout | GAP-010, GAP-027, GAP-030 | F02, F04, F12, F13, F14, F18, F19, F21, F23, F24, F27, F34, F35 |
| A31 | CRM and marketing | GAP-005, GAP-028, GAP-029 | F01, F06, F08, F09, F14, F16, F21, F23, F25, F26, F27, F28, F34 |
| A32 | Automation dry-run | GAP-007, GAP-031 | F11, F18, F20, F26, F32 |
| A33 | Unknown adapter | GAP-020, GAP-021, GAP-023, GAP-036 | F16, F18, F19, F22, F24, F29 |
| A34 | SSRF attempt | GAP-004, GAP-020, GAP-034 | F16, F18, F19, F28, F29, F32 |
| A35 | Webhook replay | GAP-007, GAP-027, GAP-034, GAP-036 | F04, F12, F16, F18, F19, F20, F21, F22, F23, F24, F26, F27, F28, F29, F32 |
| A36 | Coming Soon | GAP-005, GAP-032, GAP-040 | F09, F14, F16, F21, F25, F28, F32, F33, F34 |
| A37 | Keyboard/mobile UX | GAP-008, GAP-017, GAP-033, GAP-038 | F01, F02, F05, F06, F08, F15, F27, F30, F31, F33, F34 |
| A38 | Failed provider sync | GAP-014, GAP-016, GAP-022 | F01, F02, F03, F16, F17, F18, F25, F29 |
| A39 | Restore drill | GAP-002, GAP-003, GAP-004, GAP-035 | F05, F16, F26, F28, F29, F32 |
| A40 | Fresh install | GAP-002, GAP-006, GAP-037, GAP-039 | F09, F10, F14, F20, F21, F28, F30, F32 |
| E01 | Customer searches, filters departments and product variants | GAP-014, GAP-016, GAP-033, GAP-038 | F01, F02, F03, F08, F15, F17, F25, F27, F30, F33, F34 |
| E02 | Customer configures polo color/size + logo, previews then submits RFQ | GAP-009, GAP-011, GAP-013, GAP-017, GAP-019 | F02, F04, F05, F06, F07, F08, F09, F10, F11, F12, F14, F15, F21, F24, F25, F31 |
| E03 | Admin ingests provider synthetic products (100k seeded variants for performance benchmark) | GAP-014, GAP-015, GAP-033, GAP-039 | F01, F02, F03, F17, F27, F30, F32 |
| E04 | Two suppliers offer same manufacturer/model | GAP-014, GAP-020, GAP-025 | F02, F03, F16, F17, F18, F19, F20, F21, F29, F35 |
| E05 | Supplier sync tries to overwrite curated copy and imprint verified by staff | GAP-014, GAP-017, GAP-022 | F02, F03, F05, F06, F16, F17, F18, F29, F31 |
| E06 | Price estimate mixes blank item, embroidery, rush, setup, freight and tax | GAP-010, GAP-013, GAP-027 | F02, F04, F08, F10, F12, F13, F14, F15, F18, F19, F21, F23, F24, F27 |
| E07 | Margin below 30% without approval | GAP-005, GAP-010, GAP-013 | F02, F04, F08, F09, F10, F12, F13, F14, F15, F16, F18, F19, F21, F24, F25, F28, F34 |
| E08 | Quote revision issued then modified | GAP-006, GAP-009, GAP-013 | F04, F05, F07, F08, F09, F10, F12, F14, F15, F20, F21, F24, F28, F31 |
| E09 | Two first orders prepaid, account terms later Net15 | GAP-013, GAP-027 | F04, F08, F10, F12, F14, F15, F21, F23, F24, F27 |
| E10 | Approved order with two suppliers and one decorator | GAP-018, GAP-024, GAP-025 | F07, F11, F13, F19, F20, F21, F22, F31, F35 |
| E11 | Proof not approved then attempt to send supplier PO | GAP-018, GAP-025 | F07, F19, F20, F21, F31, F35 |
| E12 | Supplier misses ship date | GAP-022, GAP-024, GAP-026, GAP-031 | F07, F11, F13, F16, F17, F18, F19, F20, F22, F23, F26, F29, F31, F35 |
| E13 | Print order needs bleed/preflight | GAP-017, GAP-018, GAP-040 | F02, F05, F06, F07, F20, F31, F32, F33, F35 |
| E14 | MOQ1 POD offer not verified | GAP-010, GAP-017, GAP-036 | F02, F04, F05, F06, F13, F14, F18, F19, F22, F24, F31 |
| E15 | Customer reorder | GAP-009, GAP-013, GAP-033 | F01, F04, F05, F07, F08, F10, F12, F14, F15, F21, F24, F27, F30, F31 |
| E16 | Import and editing 20 products in one operation | GAP-015, GAP-017, GAP-038 | F01, F02, F03, F05, F06, F08, F15, F17, F30, F31, F33, F34 |
| E17 | Unauthorized external customer requests another customer's file | GAP-003, GAP-005, GAP-034 | F05, F09, F14, F16, F21, F25, F28, F29, F32, F34 |
| E18 | Tenant B and venture B read customer or supplier private records | GAP-005, GAP-006, GAP-032, GAP-034 | F09, F10, F14, F16, F20, F21, F25, F28, F29, F32, F33, F34 |
| E19 | Duplicate supplier order submission or duplicate payment webhook | GAP-007, GAP-025, GAP-027 | F04, F12, F18, F19, F20, F21, F23, F24, F26, F27, F32, F35 |
| E20 | Coming Soon modules navigation | GAP-005, GAP-032, GAP-040 | F09, F14, F16, F21, F25, F28, F32, F33, F34 |
| E21 | QuickBooks sandbox invoice or mock external ref | GAP-027, GAP-036 | F04, F12, F19, F21, F22, F23, F24, F27 |
| E22 | Complete quote→order→job→delivery→profit | GAP-013, GAP-018, GAP-024, GAP-025, GAP-026, GAP-027 | F04, F07, F08, F10, F11, F12, F13, F14, F15, F19, F20, F21, F22, F23, F24, F27, F31, F35 |
| E23 | 100k+ variant load/search benchmark | GAP-033, GAP-039 | F01, F27, F30, F32 |
| E24 | Module flag changes to ACTIVE without test evidence | GAP-005, GAP-032, GAP-040 | F09, F14, F16, F21, F25, F28, F32, F33, F34 |
| E25 | New tenant business seller legal entity changes | GAP-013, GAP-032 | F04, F08, F09, F10, F12, F14, F15, F21, F24, F28, F33 |
| T01 | Synthetic fresh install | GAP-001, GAP-002, GAP-037 | F32, F33 |
| T02 | Public product discovery | GAP-009, GAP-014, GAP-016, GAP-033, GAP-038 | F01, F02, F03, F05, F07, F08, F15, F17, F25, F27, F30, F31, F33, F34 |
| T03 | Product configuration | GAP-010, GAP-017 | F02, F04, F05, F06, F13, F14, F18, F19, F24, F31 |
| T04 | Customer brand assets | GAP-003, GAP-009, GAP-019 | F05, F06, F07, F15, F25, F31, F32 |
| T05 | Art previews | GAP-009, GAP-018, GAP-019 | F05, F06, F07, F15, F20, F25, F31, F35 |
| T06 | Admin template bulk | GAP-015, GAP-017, GAP-019, GAP-038 | F01, F02, F03, F05, F06, F08, F15, F17, F25, F30, F31, F33, F34 |
| T07 | CSV supplier import | GAP-014, GAP-015, GAP-022 | F02, F03, F16, F17, F18, F29 |
| T08 | Native PromoStandards contract | GAP-020, GAP-021, GAP-022 | F16, F17, F18, F19, F29 |
| T09 | Source resolution | GAP-010, GAP-014, GAP-020 | F02, F03, F04, F13, F14, F16, F17, F18, F19, F24, F29 |
| T10 | Estimate pricing | GAP-010, GAP-013 | F02, F04, F08, F10, F12, F13, F14, F15, F18, F19, F21, F24 |
| T11 | Quote revision | GAP-006, GAP-009, GAP-013 | F04, F05, F07, F08, F09, F10, F12, F14, F15, F20, F21, F24, F28, F31 |
| T12 | Customer request to order | GAP-009, GAP-011, GAP-013, GAP-027 | F04, F05, F06, F07, F08, F09, F10, F11, F12, F14, F15, F21, F23, F24, F27, F31 |
| T13 | Mixed order | GAP-012, GAP-024, GAP-025, GAP-026 | F07, F11, F13, F19, F20, F21, F22, F23, F31, F35 |
| T14 | Supplier purchase authorization | GAP-007, GAP-018, GAP-025 | F07, F18, F19, F20, F21, F26, F31, F32, F35 |
| T15 | POD MOQ 1 | GAP-010, GAP-017, GAP-020, GAP-036 | F02, F04, F05, F06, F13, F14, F16, F18, F19, F22, F24, F29, F31 |
| T16 | Company store | GAP-005, GAP-011, GAP-013 | F04, F06, F08, F09, F10, F11, F12, F14, F15, F16, F21, F24, F25, F28, F34 |
| T17 | Fundraiser | GAP-011, GAP-027 | F04, F06, F09, F10, F11, F12, F15, F21, F23, F24, F27 |
| T18 | BYOB bundle | GAP-010, GAP-012, GAP-024, GAP-025 | F02, F04, F07, F11, F13, F14, F18, F19, F20, F21, F22, F24, F31, F35 |
| T19 | Job MIS | GAP-018, GAP-024, GAP-026 | F07, F11, F13, F19, F20, F22, F23, F31, F35 |
| T20 | Shipment | GAP-020, GAP-026, GAP-036 | F13, F16, F18, F19, F20, F22, F23, F24, F29, F35 |
| T21 | Finance | GAP-010, GAP-013, GAP-027, GAP-030 | F02, F04, F08, F10, F12, F13, F14, F15, F18, F19, F21, F23, F24, F27, F34, F35 |
| T22 | Marketing | GAP-028, GAP-029 | F01, F06, F08, F09, F23, F25, F26, F27, F34 |
| T23 | Automation | GAP-007, GAP-031 | F11, F18, F20, F26, F32 |
| T24 | Confidentiality | GAP-004, GAP-014, GAP-016, GAP-034 | F01, F02, F03, F16, F17, F25, F28, F29, F32 |
| T25 | Security | GAP-005, GAP-006, GAP-034 | F09, F10, F14, F16, F20, F21, F25, F28, F29, F32, F34 |
| T26 | Coming Soon | GAP-005, GAP-032, GAP-040 | F09, F14, F16, F21, F25, F28, F32, F33, F34 |
| T27 | Resilience | GAP-007, GAP-022, GAP-025, GAP-031, GAP-035 | F11, F16, F17, F18, F19, F20, F21, F26, F28, F29, F32, F35 |
| T28 | Accessibility | GAP-008, GAP-038 | F01, F02, F08, F15, F27, F30, F33, F34 |
| T29 | Scale | GAP-015, GAP-019, GAP-033, GAP-039 | F01, F03, F05, F06, F17, F25, F27, F30, F32 |
| T30 | Owner workflow | GAP-013, GAP-018, GAP-024, GAP-025, GAP-027, GAP-038, GAP-040 | F01, F02, F04, F07, F08, F10, F11, F12, F13, F14, F15, F19, F20, F21, F22, F23, F24, F27, F30, F31, F32, F33, F34, F35 |

## Evidence boundaries

- Existing source paths and tests have been checked for existence; their presence does not satisfy a feature or scenario.
- Feature-pack test assertions are proposed and explicitly NOT RUN. They supplement the original suite.
- No original acceptance requirement, Coming Soon boundary or external activation requirement was removed.
