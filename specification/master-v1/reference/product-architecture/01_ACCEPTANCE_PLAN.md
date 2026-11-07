# Full-System Acceptance Contract — TwelveSpec v1.0

## Engineering QA is continuous; owner acceptance is consolidated
All V1 modules are developed together against shared contracts and schemas. Codex must still run tests continuously during implementation; defer only the **owner's** full journey test until all active V1 modules integrate. Avoid manual owner questions except account access/licensing, legal/tax policy, production publication or live spending.

## Test inventory
| ID | Journey | Verify |
|---|---|---|
| T01 | Synthetic fresh install | migrations, seeds, secure mock login, reproducible scripts |
| T02 | Public product discovery | color circles, facets, brand, size, mobile/desktop, canonical dedupe |
| T03 | Product configuration | valid combinations, invalid option conflicts, typed rules, quantity breaks |
| T04 | Customer brand assets | import/upload, private scope, design revision save/reload |
| T05 | Art previews | zone accuracy, physical units, render queue, versioned mockups, no supplier assets leaked |
| T06 | Admin template bulk | assign rule to 100 compatible products, conflict queue, revert nonbinding updates |
| T07 | CSV supplier import | 10k variants stage/diff/dedupe, scoped vendor evidence, curated copy preserved |
| T08 | Native PromoStandards contract | service/version per supplier; malformed XML, empty stock, partial price, timeouts |
| T09 | Source resolution | same manufacturer SKU across 3 suppliers -> 1 public product, 3 private offers |
| T10 | Estimate pricing | tier+setup+decoration+freight, UNKNOWN cost blocks automated price |
| T11 | Quote revision | issue immutable revision, revise with history, approve exact version |
| T12 | Customer request to order | real persisted config + design to quote/order with sandbox payment ref |
| T13 | Mixed order | hats + print + tent -> jobs, separate PO drafts, split shipments |
| T14 | Supplier purchase authorization | no submission before required approvals; ambiguous timeout deduped |
| T15 | POD MOQ 1 | only verified product/variant/placement/supplier route checkout; else quote |
| T16 | Company store | employee budget, approval and brand restriction, cross-store privacy |
| T17 | Fundraiser | campaign window, allocations, closeout draft, no unverified payouts |
| T18 | BYOB bundle | component quantity, minimums, pack/assembly, multi-provider freight |
| T19 | Job MIS | ticket, proof, QC, failure/remake, external production event handling |
| T20 | Shipment | provider tracking vs own label; no double labels, partial shipments |
| T21 | Finance | estimated/actual direct cost, gross margin, external invoice/payment references |
| T22 | Marketing | draft campaign, audience rights and consent, no send from test |
| T23 | Automation | dry run, approval gates, cycle detection, replay and idempotency |
| T24 | Confidentiality | SEO/API/source code/view/export cannot reveal supplier names/cost/IDs |
| T25 | Security | cross-tenant + role negative tests (data/files/artwork/costs/orders) |
| T26 | Coming Soon | routes visible with clear label; backend denies action; no false claims |
| T27 | Resilience | provider outage, replay, late events, retry budget, DLQ and exception queue |
| T28 | Accessibility | keyboard, screen reader labels, color contrast, responsive use |
| T29 | Scale | search 100k variants, bulk update 100 records, async 500 render jobs |
| T30 | Owner workflow | no-code catalog edit, quote, proof, PO draft, closeout; measure clicks/time |

## Definition of done
- All ACTIVE_V1 behavior persisted and tested; no fake buttons or inert forms.
- Contract tests cover capability matrix and exact external operation semantics in mock mode.
- New database bootstraps repeatably; no access to original populated database.
- Every provider clearly labeled `MOCKED`, `SANDBOX_VERIFIED`, `LIVE_READ_VERIFIED`, `LIVE_WRITE_VERIFIED`, `NOT_SUPPORTED` or `DISABLED`.
- Blocked/Coming Soon behavior accurately represented; no unverified auto-order, direct checkout, digitizing, 3D, or preflight claims.
- No live payment, real supplier PO, email send or DNS cutover; these require separate explicit approval.
- Developer provides readable release notes, demonstration URLs or local commands, screenshots, failing test report, known risks and operator guide.
