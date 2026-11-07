# Requirements → code → tests

Controlling source: `specification/master-v1`. Inventory created before application implementation. The initial inventory was recorded before implementation. Current source and verification statuses are in `module-inventory.json` and `ACCEPTANCE_EVIDENCE.md`; no acceptance claim is implied. Scope is 20 modules: 19 active V1 plus one Coming Soon registry.

| Module | Navigation | Planned service | Planned UI | Test | Future (disabled) |
|---|---|---|---|---|---|
| foundation: Governance, identity and settings | Business | packages/foundation | /foundation | tests/modules/foundation.test.ts | SaaS onboarding |
| today: Executive dashboard | Today | packages/today | /today | tests/modules/today.test.ts | AI advisor |
| crm: CRM and sales pipeline | Sales | packages/crm | /crm | tests/modules/crm.test.ts | AI outreach |
| catalog: Canonical catalog and publishing | Catalog | packages/catalog | /catalog | tests/modules/catalog.test.ts | autonomous enrichment |
| supplier: Integration Center | Business | packages/supplier | /supplier | tests/modules/supplier.test.ts | AI mapper |
| configuration: Product rules and visual options | Catalog | packages/configuration | /configuration | tests/modules/configuration.test.ts | CAD configure-to-engineer |
| creative: Creative Studio | Catalog | packages/creative | /creative | tests/modules/creative.test.ts | AI design, 3D, embroidery digitization |
| estimating: Pricing and estimating | Sales | packages/estimating | /estimating | tests/modules/estimating.test.ts | machine learning price optimization |
| commerce: Customer storefront and checkout | Shop | packages/commerce | /commerce | tests/modules/commerce.test.ts | subscriptions |
| stores: Company, school and event stores | Business | packages/stores | /stores | tests/modules/stores.test.ts | complex fund settlement |
| byob: Build Your Own Bundle | Catalog | packages/byob | /byob | tests/modules/byob.test.ts | AI bundle suggestions |
| sales: RFQ, quote and approvals | Sales | packages/sales | /sales | tests/modules/sales.test.ts | autonomous negotiation |
| orders: Orders and job tickets | Jobs | packages/orders | /orders | tests/modules/orders.test.ts | enterprise MRP |
| procurement: Purchasing and supplier POs | Jobs | packages/procurement | /procurement | tests/modules/procurement.test.ts | autonomous procurement |
| fulfillment: Production, QC, shipping, returns | Jobs | packages/fulfillment | /fulfillment | tests/modules/fulfillment.test.ts | fleet and warehouse optimization |
| finance: Finance and profitability | Business | packages/finance | /finance | tests/modules/finance.test.ts | full GL and payroll |
| marketing: Marketing and content management | Business | packages/marketing | /marketing | tests/modules/marketing.test.ts | advanced omnichannel AI |
| workflow: Automation and notifications | Business | packages/workflows | /workflow | tests/modules/workflow.test.ts | self-editing autonomous agents |
| analytics: Reporting and data quality | Business | packages/analytics | /analytics | tests/modules/analytics.test.ts | predictive forecasting |
| future: Reserved module slots | Business | packages/future | /future | tests/modules/future.test.ts | 3D, digitization, manufacturing engineering, external SaaS |

## Cross-module acceptance

# Integrated acceptance contracts — all V1 modules

## General test design
Each scenario has setup, action, observable UI result, authoritative DB and emitted-event assertions, role and negative-path checks. Must execute against an ephemeral DB with deterministic fixtures; Playwright browser tests for customer/staff and Vitest/contract tests for services. Mock API success is not labeled LIVE_VERIFIED.

## Scenario matrix
| ID | User journey | Required assertion |
|---|---|---|
| A01 | First launch, synthetic seed | Shop and OS authenticate, 40 products, modules and Coming Soon nav render |
| A02 | Tenant boundaries | Workspace A cannot read B contacts or assets even by guessed UUID |
| A03 | Add simulated supplier | Masked credential metadata; no secret in API/browser/log |
| A04 | Invalid SOAP supplier auth | Service marked BLOCKED, other service statuses unaffected |
| A05 | Import valid CSV | Staged rows, mapping version, variant candidates; no auto publish |
| A06 | Import XML with DTD | Rejected before entity resolution, no outbound fetch |
| A07 | Malformed/duplicate source | Reject or dedupe, keep raw evidence and issues |
| A08 | Supplier human edit conflict | Curated title preserved; merge review created |
| A09 | Product color swatch | Visible circle corresponds to selected actual variant image, accessible label |
| A10 | Bulk publish 100 SKUs | Preview counts, authorization, revision and rollback manifest |
| A11 | Missing cost/freight | Item quote-only; no unverified checkout price |
| A12 | MOQ and quantity tiers | Server rejects invalid quantity, accurate price tier recalculation |
| A13 | Dependent decoration options | Method/location incompatible choices disabled and server rejects bypass |
| A14 | Customer uploads logo | Private original asset, versioned design, no exposed signed URL leak |
| A15 | Batch mockups | One preset to eligible products, queued images, image/variant linkage |
| A16 | Preflight failed DPI | Proof not production-ready; vendor dispatch blocked |
| A17 | Revised art after approval | Prior approval invalidated for changed revision |
| A18 | RFQ to issued quote | Source cost snapshot frozen and approval checks enforced |
| A19 | Price below margin floor | Approval required, audit who/why, no auto issue |
| A20 | Accepted quote to order | Immutable lines, legal seller and art revision frozen |
| A21 | Mixed hats+brochures+tent | One customer order, distinct jobs, provider POs and shipments |
| A22 | Supplier PO timeout | UNKNOWN_OUTCOME; no duplicate submission until reconciliation |
| A23 | Partial shipment | Customer sees partial fulfillment; tracking mapped to correct lines |
| A24 | Outsourced decorated apparel | Separate blank, decorator costs, operations and QC events |
| A25 | POD sandbox fulfillment | Provider event reflected; simulated tracking not called live |
| A26 | Company store limits | Wrong buyer/budget/brand kit blocked on server |
| A27 | School fundraiser | Correct campaign allocations and cutoff date with test clock |
| A28 | BYOB kit | Each component mapped to correct source, plus kitting cost |
| A29 | Finance reference | External webhook dedupe, no duplicate payment settlement |
| A30 | Profit closeout | Actual versus estimated landed cost, profit/owner hour report |
| A31 | CRM and marketing | Contact permission, campaign publishing approval and attribution |
| A32 | Automation dry-run | Event/filter/action simulation shows intended effects, no side effects |
| A33 | Unknown adapter | UI shows unsupported capability; permits file/manual fallback |
| A34 | SSRF attempt | Disallowed private host and redirect rejected |
| A35 | Webhook replay | Signed event accepted once; invalid/replayed ignored and logged |
| A36 | Coming Soon | All deferred routes visible only as truthful, disabled placeholders |
| A37 | Keyboard/mobile UX | Search/filter/configurator usable with keyboard and mobile viewport |
| A38 | Failed provider sync | Stale status displays, storefront retains last safe published revision |
| A39 | Restore drill | Backup restored into fresh staging environment; tenant counts match |
| A40 | Fresh install | One documented setup creates usable demo without existing vendor account |

No acceptance claim unless each scenario has a test file, fixture, last result, environment and actionable failure report. This table is contractual specification, not a claim these automated tests all exist yet.

## Current regression evidence: cap image and proof

A09 maps `scripts/seed-illustration.ts`, the three `apps/shop/public/products/TS-0003-*.svg` images and `infra/cloudflare/gateway.mjs` to `tests/e2e/shop.spec.ts` (Clay cap selection, immutable save, matching proof image and approval) and `tests/cloudflare/preview.test.ts` (asset Access enforcement and runtime fallback). `scripts/cloudflare-verify.mjs` checks all three cap images over HTTPS, the saved proof, storefront cart/RFQ and Commerce OS CRM. The illustrations remain synthetic; supplier image licensing and manufacturing preflight are separate activation gates.

Changing color after a project has already been saved still needs project/variant rebinding and exact proof-version lookup regression coverage. This is an open creative acceptance item, not established by the new-project cap test.
