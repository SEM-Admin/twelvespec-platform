# TwelveSpec — Unified Reverse-Engineering & Product Blueprint
**Research synthesis | v1.0 | November 4, 2026 | Codex planning reference — not implemented**

## 0. Purpose, evidence rules, non-goals
Build TwelveSpec's own business management, print MIS, creative design, and B2B/POD storefront product, using researched competitors as **functional benchmarks** and directly documented protocols as **technical references**. Do not copy proprietary code, branding, or internal designs. Do not integrate PSRESTful; it is a benchmark for supplier normalization only. Do not replace existing production systems, clone live data, or connect live purchases/payments without approval.

Every requirement is labeled: **V1 build** (implemented with persistent synthetic data and real rules), **adapter/mock** (functional interface with mock), **Coming Soon** (visible but genuinely disabled), **vendor-dependent** (needs verified right or credentials). Distinguish verified published provider behavior from our proposed solution.

## 1. Cross-vendor reverse-engineering matrix
| Source | Documented/observed pattern | TwelveSpec requirement | How our design improves it |
|---|---|---|---|
| Shopify | Structured extensible records (metaobjects/metafields); asynchronous bulk read/write, configurable commerce | Typed product/attribute definitions, bulk edit, versioned import | One canonical product across all commerce channels, preview+rollback for changes, no supplier exposure |
| OnPrintShop | Master product options, price formulas, designer rules, masks, multi-page PDFs, product/print options, production job board | Reusable configuration schema and price calculators, design surfaces, templates, proofing | One shared rules engine for apparel, print, banners, custom goods, configurable visually and assigned in bulk |
| DecoNetwork | Online designer, decorating workflows, production/shop MIS, APIs for products/orders/PO/inventory | Imprint locations, decoration capacity/rules, job routing, product template management | No separate customer and shop artwork copies; production approval and pricing trace through one order |
| OrderMyGear | Company/pop-up/redemption/POD stores, school/fundraiser programs | Store programs, budgets, allowances, approvals, campaign windows | One multi-program engine with templates, role-controlled stores, no duplicate catalog per store |
| Supply Master | Full-variant supplier imports, incremental stock/price sync, pricing formulas, bulk filters; ordering support depends on supplier | Feed control plane with per-capability indicator, catalog staging and selective publishing | Source/provider separation, normalized offer identity, no silent destructive overwrites |
| LogoMagic | Logo once -> cross-color mockup/variant publishing; saved brand presets, SKU-to-image association | Brand-kit library, reusable render zones and transformations, batch mockup jobs | One same artwork program powering admin merchandising, customer preview, proof, and production lineage |
| PromoStandards | Supplier-side product/media/availability/pricing/PO/status/invoice service families; different WSDLs/versions | Native SOAP and version adapters; discovery + credentials + capability registry | Protocol conformance tests, fallback, provenance and commercial evidence gating |
| PSRESTful | Aggregator normalizes many supplier endpoints | Study common facade/service normalization only | Native open supplier adapter layer, zero PSRESTful runtime or subscription dependency |
| Fulfill Engine | Automated blank sourcing, scan-to-print, decoration outsourcing, shop production & 3PL | Production tasks, work centers, barcode/QR job tickets, stock and provider allocation | One routing planner for in-house, contract decorators, POD, dropship and hybrid supply chains |
| Order Desk | Rule=event+filters+actions; item/order/shipment routing, splits, scheduled & manual triggers | Safe no-code workflow rules and order allocation | Dry-run and impact simulation, versioned rules, conflict detection, financial approval guards |
| Cloudprinter | Print buyer orders, prices, production templates and sandbox signals | Commercial print fulfillment adapter, provider quote validity and signals | One normalized shipping/production event history across providers |
| Printful | Product placements, mockup queue, variant-specific art, order/webhooks, POD | Provider mockup and MOQ1 capability, mockup cache | Pricing/readiness separate from attractive preview, optimized batch generation |
| Scalable Press | Quote-only vs order-ready states, test order API, design creation | Explicit purchase readiness, immutable quote token snapshot | Single readiness policy across all suppliers and methods |
| Shippo | Shipment rating, async labels, normalized tracking/webhooks | Shipment state machine and carrier adapter | Only generate a label when we own the shipment; ingest supplier tracking otherwise |
| CI HUB | Partner SDK for browse/search/read DAM, renditions/versions | Optional enterprise brand asset source | Rights/expiry, selected assets promoted into internal immutable asset revisions |
| The Print Life | Unified shop CRM, estimating, jobs, apparel suppliers, payment, marketing | Compact operating shell with Today, Sales, Catalog, Jobs, Business | Exception-first owner operations and handoff playbooks instead of constant follow-up |
| RushOrderTees | Simple custom apparel purchasing / artwork approvals / rush | Guided product configuration and rush options | Show constraints and delivery confidence before customer invests design effort |

**Evidence links:** https://shopify.dev/docs/api/admin-graphql/latest/mutations/productSet ; https://onprintshop.com/release-notes ; https://www.deconetwork.com/developer-resources/ ; https://www.ordermygear.com/online-stores/ ; https://www.comstack.com/apps/supply-master ; https://logomagicapp.com/shopify ; https://promostandards.org/how-promostandards-makes-your-business-better/ ; https://promostandards.ssactivewear.com/ ; https://dev.stahls.com/fulfill-engine ; https://www.orderdesk.com/using-order-desk/order-desk-rule-builder-101-everything-you-need-to-know/ ; https://docs.cloudprinter.com/client/how-to-test-the-integration ; https://developers.printful.com/docs/ ; https://scalablepress.com/docs/ ; https://support.goshippo.com/hc/en-us/articles/4404415886491-Get-started-with-the-Shippo-API ; https://developer.ci-hub.com/access ; https://www.theprintlife.com/integrations

## 2. Distinctive experience — what 'better' means
**Customer**: shop by outcome or product; unified search with category, brand, size, color swatches, lead time, MOQ, personalization, and delivery area. Compare genuine configurable offers, not dozens of duplicate supplier listings. Upload one company brand kit; instantly see approved products in selected colors and print zones. Design with guided constraints; receive accurate quote or clear quote-required state. Save configurations and reorder in one click. Company stores have budgets, allowances, team approvals, and fundraisers have attribution/closeout.

**Owner/staff**: one product library and one job workspace; visual spreadsheet bulk editing; CSV import staged, diffed and reversible; save filter/segment then bulk-assign category, template, brand, imprint rule or pricing strategy. One shared artwork/project lineage. A single Today dashboard raises only actions needing judgment. Every action has source, confidence, timestamps, audit, preview, and permission. No technical terminal required for merchandising or supplier configuration.

**Developer**: single business kernel, typed extension packs, provider adapters, reproducible synthetic seed & test harness. New connector is a manifest + adapters + verification tests, not a new parallel catalog. Coming Soon routes always visible and safely disabled. No hard-coded provider credentials or catalog mappings.

## 3. Main applications and navigation
Monorepo with two deployable apps, shared packages:
- `apps/storefront`: Home, Catalog, Search, Brands, Industries, Solutions, BYOB Bundles, Design Studio, Cart/Request Quote, Checkout (only when ready), Company/School/Event Store, Account/Reorder, Help/Custom Sourcing.
- `apps/commerce-os`: **Today** (exceptions, tasks, KPI), **Sales** (accounts, CRM, opportunity, RFQ, quote), **Catalog** (master, suppliers, variants, media, pricing, templates, stores), **Jobs** (orders, artwork approvals, buying, routing, receiving, production, shipments, returns), **Business** (finance references, marketing, automation, reports, integrations, roles, settings).
- Future navigation entries use module registry: `COMING_SOON` for advanced 3D, AI generative art, automatic digitizing, shop-floor planning, factory MRP, advanced inventory forecasting, multi-venture customer SaaS subscriptions, autonomous purchasing. Each route clearly says 'Coming Soon', explains purpose and cannot make writes/payments.

## 4. Core model principles
1. Start fresh with **isolated** Supabase: tenant, venture, workspace, legal seller, brand separate. Tenant/venture scoping in every business record; workspace membership and composite FKs, RLS, no cross-tenant leakage.
2. `canonical_product` represents sellable identity; `canonical_variant` its variants; `source_product/source_variant` preserve supplier truth; `supplier_offer` holds supplier, vendor-account, quantity, configuration, price and time evidence. One canonical product can have many offers. No automatic merge on fuzzy name alone.
3. `product_template` and `config_schema` define attributes, option groups, conditional compatibility, imprint locations, artwork requirements, price calculators, production routing; store assignments reference templates rather than duplicating them.
4. `design_project` references scoped assets; `design_revision` immutable JSON scene with physical units and transforms; `mockup_render` derivative; `proof_revision` approved/rejected independent; `production_asset` requires method-specific preflight. Never equate bitmap mockup with production-ready SVG/PDF/embroidery stitch file.
5. Sales spine: `party/account -> opportunity -> request -> estimate_revision -> quote_revision -> accepted_order -> order_line -> job_component -> operation -> purchase_requirement -> purchase_order -> shipment -> cost_actual`; contracts freeze seller, price, taxes, freight, terms, config and source evidence.
6. Store programs: `store -> store_program -> catalog_assignment -> buyer_role -> budget/allowance -> campaign -> redemption/attribution`. Track program owner, approver, legal seller, funding, returns and settlement.
7. Integrations: `provider -> connection -> capability -> sync_run -> staged_record -> mapping -> source_observation -> event -> error/dead_letter`. Capability statuses `NOT_SUPPORTED`, `MOCKED`, `SANDBOX_VERIFIED`, `LIVE_READ_VERIFIED`, `LIVE_WRITE_VERIFIED`, `DISABLED`.
8. Money NUMERIC(18,4)/currency; source-specific landed cost (blank+decoration+setup+freight+fees+tax assumptions+scrap/handling). Gross margin `(sale - direct_cost)/sale`; 40% target, 30% floor without authorized override; UNKNOWN cost is NOT zero.
9. Every external write idempotent via `(tenant,provider,environment,operation,idempotency_key)` plus response hash and durable outbox. Retries require reconciliation after ambiguous timeouts.
10. All customer-facing data passes a publication projection/allowlist. **Never expose supplier names, source SKUs, cost, partner addresses, vendor logos, secrets or private metadata**, except permitted consumer manufacturer brands.

## 5. Product & pricing rules engine
- Define configurable `product_family`: `PROMO`, `APPAREL`, `PRINT`, `SIGNAGE`, `PACKAGING`, `CUSTOM`, `SERVICE`, `BUNDLE`.
- `option_definition`: data type, unit, required, min/max, allowed values, dependency expression, scope, validation, translated label.
- `rule` AST (typed condition tree) rather than arbitrary user-editable executable JavaScript. Evaluate pure deterministic predicates and derived price components on server, with simulation traces.
- Decoration: product fabric/substrate compatibility; method and zones; dimensions in physical units; color count; stitches/based-on-verification; MOQ; position; rush and lead-time effects; sample/approval requirements; print bleed and DPI checks.
- Estimate snapshot stores each cost component and provider quote evidence/expiry; checkout allowed only if full chain is order-ready. Distinguish `QUOTE_ONLY`, `CONFIGURATION_VALID`, `ARTWORK_APPROVED`, `ORDER_READY`, `PURCHASE_AUTHORIZED`.
- Price rules auto-refresh when raw supplier cost changes; if material change affects published price, enter review or approved bounded auto-rule. Never mutate accepted quote/order.

## 6. Artwork engine
- Shared creative kernel for storefront and admin: upload PNG/JPEG/SVG/PDF, source ownership/rights and version history, brand palettes and logo variants; visual canvas, vector import, transforms, layers, text, color, print zones, background removal/vectorization as future capability when production validated.
- Admin features: save placement presets by product family and compatible decoration zone; apply to 100+ products in batch; queue generated colorway mockups; review result gallery; approval then publish. Render jobs are idempotent and cache by design revision + product variant + render style.
- Customer: restricted edit region, permitted colors/fonts/art, live preview; no private supplier exposure. Submit same design project ID to quote/job.
- Preflight policy by method: file format, minimum effective resolution, physical dimensions, bleed, safe area, fonts, transparency, vector path widths, Pantone/spot swatch metadata; fail closed or manual proof. Avoid claiming fully automatic digitizing or precise Pantone reproduction without separate approved service.
- 3D preview `COMING_SOON`: future calibrated physical geometry/templates, textures, licensing and renderer; no generic 3D promise.

## 7. Supplier hub and sync
- Native PromoStandards, direct SOAP/WSDL + per supplier service/version; REST/CSV, SAGE/ASI optional licensed discovery interfaces. No PSRESTful runtime dependency.
- Staging workflow: endpoint capability discovery -> read -> raw immutable evidence -> schema validate -> normalize -> match candidate -> confidence + human review for fuzzy match -> source observation -> offer selection -> publish projection. Imports simulate, diff, apply with reversible changes. Curated product overrides are never overwritten.
- Separate `Product Data`, `Media`, `Inventory`, `Pricing and Config`, `Purchase Order`, `Order Status`, `Ship Notice`, `Invoice`; not every provider supports all.
- Provider fallback: if no API/cost/stock, enable manual sourcing and quote-required, not fabricated price/inventory. Never automate live PO until eligible real provider credentials, approvals, delivery terms and test evidence.

## 8. Order/job/production orchestration
- Order is customer legal agreement, job is operational work, job step is production action, PO is legal commitment to supplier, shipment is physical fulfillment; each is distinct and may have many-to-many linkages.
- Assignment engine evaluates: capabilities, exact SKU config, decoration method, MOQ, landed cost, route/time, stock confidence, geography, customer preferences, QC and capacity. Keep ordered candidates with decision trace. Automatic route only when every gate passes, otherwise exception task.
- Operational job states: intake -> planning -> waiting artwork -> proof approval -> authorized -> procurement -> production -> QC -> dispatched -> delivered -> closed; independent supplier PO and shipment states.
- Scan-to-print/QR job tickets, capacity planning placeholders, proofs and QC failure/remake actions, kitting and split shipments; external vendor never gains access to unrelated customer/financial data.
- Simulate partial shipments, provider cancellation, vendor response mismatch, damage claim and replacement order.

## 9. Automation engine
`automation_rule(id, event_type, scope=ORDER|LINE|JOB|SHIPMENT, filter_ast, action_spec, enabled, priority, version, dry_run, needs_approval)`.
- Configurable no-code `WHEN -> IF -> THEN` with explainability, stop conditions, owner approval gates, preview/simulation, test mode, audit; rule replay is explicit and never silently retroactive.
- Examples: source cost stale -> internal quote exception; proof approved + deposit verified -> create PO draft; job shipped -> notify customer; delivery issue -> owner alert; company store threshold exceeded -> approval; aging quote -> follow-up draft, no auto-send initially.
- Prevent loops, conflicting actions, duplicate supplier POs, self-trigger storms; queued outbox, dedupe and DLQ.

## 10. Complete test package for Codex
Test the integrated V1 at the end after automated per-change tests during building. Seed ~300 products, 3 providers, 4 customers, 2 stores, mixed suppliers, variants, template rules, intentionally duplicate SKUs, missing costs, stale inventory and 30 synthetic jobs.
**Golden paths:**
1. Customer search polo by brand/color + variant circle swatches, customize logo, quote, approve, mock payment -> job -> PO draft -> QC -> tracking -> realized margin.
2. One customer order: 48 decorated hats from 2 providers, 100 brochures, tent, different suppliers and split shipments; preserve cost/approval.
3. POD MOQ1 mock order, provider quote and mockup, simulated fulfillment, tracking; if provider not capable, checkout disabled.
4. Bulk import 10k source variants + de-dupe and 100 product visual edits; source sync does not overwrite curated copy; rollback one batch.
5. Customer company store budget approval, employee order, re-order without redraw; school fundraiser campaign attribution and closeout.
6. Direct PromoStandards fixture service-version mismatch, partial data, stock0, stale price, invalid XML, timeout, duplicate PO, ambiguous submit response.
7. Artwork upload PNG to editable placement, color mockups, proof revision and restricted production approval. Fuzzy vectorization result not claimed press-ready.
8. Customer A and workspace B cannot read each other's files, price/source costs, jobs, or brand assets. Public SEO/API leaks scanned.
9. Automation event/filter/action, dry-run, conflict, idempotent retries, task escalation and Coming Soon no-write tests.
10. Mobile, desktop, keyboard, accessibility, image dimensions, performance search 100k variants, first-page load, and pending async statuses.

**Release pass:** DB fresh migrate/seed works; lint/typecheck/unit/integration/Playwright pass; validated mock/sandbox contracts; owner can complete all flows via browser with no coding; no production calls; test evidence and known gaps published; coming soon flags truthful; owner approval required before live activation.

## 11. Codex execution contract
Create a clean private monorepo (or worktree if authorized) with `apps/storefront`, `apps/commerce-os`, `packages/contracts`, `packages/catalog`, `packages/config-engine`, `packages/artwork`, `packages/pricing`, `packages/workflows`, `packages/connectors`, `packages/ui`, `supabase/migrations`, `tests/{unit,integration,e2e,contracts}`, `docs`.
- Use patched/pinned dependencies; do not copy vulnerable legacy lockfile.
- Create an immediately accessible development preview with synthetic data; V1 modules built as coordinated whole with shared types and migrations; Coming Soon stubs safe.
- Generate OpenAPI contracts, Zod schemas, seed fixtures, DB RLS and dependency tests; no remote provider account necessary to run mock mode.
- Ask user only about unavoidable paid access, legal seller/live policy, paid subscription, credentials or production publication. Document safe defaults rather than interviews.
- Do not add PSRESTful as dependency. Do not use existing populated Supabase or historic migration chain. Do not publish domain or initiate real commercial transaction.
