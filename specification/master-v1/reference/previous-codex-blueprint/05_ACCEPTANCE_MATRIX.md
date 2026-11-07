# Full-Platform Acceptance Matrix — Codex Must Execute
**Standard:** One final consolidated system acceptance after the V1 implementation, backed by automated tests throughout. No approval to launch implied by passing tests. CI and preview must use synthetic data, fake/sandbox payments, fake supplier credentials and no outbound commercial effects.

## Automated verification gates
A. Format/lint, typecheck, dependency audit with zero unwaived critical/high findings, pinned dependencies and lockfile; reproducible build.
B. Fresh disposable DB migration up/down/replay or independently validated forward-only state; RLS and grants for EVERY exposed table; SQL unit/constraint tests, cross-tenant isolation and anonymous privacy checks.
C. Provider mocks, contract fixtures, pagination, rate limits, retry/backoff, lost credential, provider downtime, stale evidence, webhook signature and idempotency.
D. Domain unit tests for quote margin, decimal arithmetic, pricing tier boundaries, variants, delivery, terms, duplicate avoidance, immutable snapshots, state transitions and blocked purchase rules.
E. Playwright desktop/mobile for customer and staff; authenticated/unauthenticated, accessibility basics, errors, empty and loading states.
F. Security scan for leaks into JSON, HTML, SEO metadata, image alt text, logs, source maps, emails, PDFs and public search. Manufacturer display brands allowed only if valid.

## End-to-end scenarios (all required)
| ID | Scenario | Required result |
|---|---|---|
| E01 | Customer searches, filters departments and product variants | URL/shareable filters work; no manual collection necessary for broad catalog; no wholesale supplier details |
| E02 | Customer configures polo color/size + logo, previews then submits RFQ | Same immutable design version visible to admin; all selected variants, artwork and imprint zones retained |
| E03 | Admin ingests provider synthetic products (100k seeded variants for performance benchmark) | Dry-run, validation, staged review, bulk edit, publish preview and rollback; no duplicated variant identity |
| E04 | Two suppliers offer same manufacturer/model | One canonical public listing; two private offers; authorized admin can compare; identity mismatches not auto-merged |
| E05 | Supplier sync tries to overwrite curated copy and imprint verified by staff | Overridden fields retained; supplier evidence timestamped; exception recorded |
| E06 | Price estimate mixes blank item, embroidery, rush, setup, freight and tax | Distinct cost components; no float errors; source freshness; missing cost blocks quote issuance |
| E07 | Margin below 30% without approval | Send blocked, review task shown and audited; 30–40% warning; 40% target visible |
| E08 | Quote revision issued then modified | Old revision preserved, new revision created; customer accepts exact revision |
| E09 | Two first orders prepaid, account terms later Net15 | Terms guard, payment verified via sandbox webhook, duplicate webhook safe; no false Paid status |
| E10 | Approved order with two suppliers and one decorator | Single customer job, separate draft vendor POs and ops, verified source, proof and payment gates |
| E11 | Proof not approved then attempt to send supplier PO | Blocked. After approval, still requires explicit safe send capability/approval; sandbox only |
| E12 | Supplier misses ship date | Job at-risk notification, owner exception and customer status differentiated, no automated unsupported promise |
| E13 | Print order needs bleed/preflight | Missing bleed flags manual review; professional PDF/X function shown Coming Soon without fake validation |
| E14 | MOQ1 POD offer not verified | Cannot present self-service paid checkout; optional quote inquiry only |
| E15 | Customer reorder | Preserve design/legacy commercial history; refresh current availability and pricing for new order |
| E16 | Import and editing 20 products in one operation | Grid preview, validation, partial reject, audit and undo for pre-publication mutation |
| E17 | Unauthorized external customer requests another customer's file | 403/no data; no guessing signed storage URLs |
| E18 | Tenant B and venture B read customer or supplier private records | Denied; permitted shared generic template only by explicit resource grant |
| E19 | Duplicate supplier order submission or duplicate payment webhook | Exactly-once external side effect simulated with idempotency; historical traces retained |
| E20 | Coming Soon modules navigation | Every placeholder opens labelled page, no dead link, no claim of active sales/PO/AI capability |
| E21 | QuickBooks sandbox invoice or mock external ref | External reference mapped once; no duplicate GL; fails closed if disconnected |
| E22 | Complete quote→order→job→delivery→profit | Actual vs estimated cost and gross margin calculated, customer view shows only appropriate progress |
| E23 | 100k+ variant load/search benchmark | Establish documented P95 budgets, paging, indexing, CPU/cost and consistent results; fail benchmark with remediation plan, not invented pass |
| E24 | Module flag changes to ACTIVE without test evidence | Denied, audited, no hidden active route/transaction |
| E25 | New tenant business seller legal entity changes | Existing quote/order seller snapshots unchanged; future transactions use new eligible seller assignment |

## Final human review (single owner interview if necessary)
Demonstrate 3 realistic scenarios (embroidered apparel, commercial print, mixed-supplier event kit) with admin no-code operations; ask owner to approve storefront look, public brand wording, credit/margin exceptions, provider payments and public launch only. The full acceptance report separates `PASS`, `FAIL`, `BLOCKED_EXTERNAL`, `COMING_SOON` with logs/links and reproducible commands. No partial or unverified system should be described as ready for production.

## Release decision
- `DEVELOPMENT_COMPLETE`: all ACTIVE_V1 tests pass in isolated dev.
- `PILOT_READY`: owner-reviewed, authenticated preview, successful sandbox workflows, external contract/licensing blockers listed.
- `PRODUCTION_READY`: explicit owner signoff, legal and tax review, verified backups, approved credentials, integration/provider tests, actual production payment and order safeguards, staged rollout/rollback.
These are distinct; don't skip from local passing tests to live storefront.
