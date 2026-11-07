# Functional Blueprint — Entire V1 and Reserved Future Modules

## Product thesis
A customer can discover, configure, decorate, request/approve pricing and track fulfillment. Internally, one business OS can manage a lead through quote → approved order → outsourced/in-house/hybrid job → buying → proof → delivery → profit → reorder. Employees and owner operate through visual admin, not code. All future modules have navigation presence, honest Coming Soon status, stable module IDs, and can be activated by feature flag in future without reworking customer/order identities.

## Frontend information architecture
Top nav: Products, Print on Demand, Solutions, Industries, Build Your Own Bundle, Company Stores, About, Request Quote, Account. Global accessible search, cart/quote basket, brand-aware logo library, and order status. Six product departments: (1) Apparel & Headwear, (2) Promotional Merchandise, (3) Print & Marketing, (4) Signs & Displays, (5) Trade Shows & Events, (6) Specialty & Custom. Each has declarative subcategories (not thousands of manual collections) and server query filters. Dedicated custom-sourcing inquiry always reachable.

Customer routes (V1 real): `/`, `/products`, `/products/[slug]`, `/categories/[slug]`, `/search`, `/solutions`, `/industries`, `/design/[projectId]`, `/quote`, `/request-quote`, `/account`, `/account/orders/[id]`, `/company-stores` index (info + request), `/contact`. V1 quote cart and quote checkout; instant paid checkout gated by per-offering capability and payment-provider activation. Product page: selected options, tier quantity, available imprint zones, estimated production time if verified, logo upload/placement, quote CTA, clear estimate disclaimers and missing-info prompts. All URLs SEO-safe, canonical tags and no private metadata.

Future customer routes (skeleton + Coming Soon, no broken links or fake purchase CTA): `/print-on-demand` (show explanation and interest capture unless verified items exist), `/bundles/builder`, `/company-stores/[slug]` self-service purchasing, `/schools`, `/fundraising`, `/events`, `/design/3d`, `/custom-manufacturing`, `/subscriptions`, `/ai-design`. Public menu may display future items labelled Coming Soon rather than implying purchase functionality.

## Operator navigation (five places)
- **Today**: action queue, overdue, proof waiting, expiring quote, supplier delay, overdue invoice, profitable/loss-making at-risk jobs; KPI cards for owner hours, gross profit per owner hour, repeat revenue, margin and routine automation. No second source of truth; projections only.
- **Sales**: leads, pipeline, parties/accounts, requests/RFQs, estimates, quotes/revisions, opportunities, account history, customer communication record, credit status, reorders.
- **Catalog**: canonical products/services, variations, supplier offers, live evidence, categories/collections, artwork zones/templates, configurable pricing, CSV staging, bulk spreadsheet edits, preview/publish, source-health inbox.
- **Jobs**: approved sales orders, electronic tickets, parts, proof and art status, outsourced/in-house/hybrid routing, PO drafts, vendor acknowledgments, inbound/outbound shipment, QC, delivery, returns, costing.
- **Business**: QuickBooks references and reconciliation, finance dashboard, marketing/content (basic campaign assets & task tracking), stores/admin, role/security settings, integration connections and health, automation definitions and history, audit, help and setup checklist.

## Module inventory and implementation state
`ACTIVE_V1`: foundation/identity, business settings, CRM, accounts, requests, catalog, variants, supplier-source/offer ingestion and comparison, taxonomy, collections, pricing rules, quote estimating/revisions, order intake, artwork 2D editor + saved projects, mockup/proof approval, job ticket/outsourced routing, purchase-order drafting, shipment records/manual tracking, job costs, finance read-model and QuickBooks sandbox adapter, basic marketing assets/campaign tracking, notification templates (sandbox only), task/exception engine, reporting, module registry, integrations registry, audit and import/export.

`COMING_SOON_V1_PLACEHOLDER`: autonomous supplier PO submission, multi-destination advanced shipment labels, in-house shop-floor machine scheduler, detailed raw inventory/warehouse management, production floor barcode scanning, labor time clock/payroll, client self-service company-store builder, school/team fundraising checkout, fully automated POD MOQ1 (until fulfillment provider verified), AI image generation, advanced vectorization, specialized embroidery digitization, professional PDF/X preflight, 3D rendering, CAD/BOM manufacturing, AI sourcing agent, supplier portal, workflow builder, marketing social posting automation, general SaaS tenant signup/billing, subscription management, advanced reporting/BI, multi-company shared library marketplace, agentic procurement.

Every placeholder must have a visible name/description, estimated dependency list, noncommittal 'Coming Soon' copy, disabled action, `module_registry.status='COMING_SOON'`, and no accidental route-to-live side effects. A capability toggle may become ACTIVE only after automated, integration, and human acceptance evidence.

## Key business workflows
1. **Lead to revenue:** Lead → Account/Contact → RFQ + artwork → scoped supplier alternatives → estimate cost components → quote revision → authorized send → acceptance → prepaid/deposit verification → order → proof → PO draft → vendor ack → delivery → invoice/reconciliation → actual job profitability → reorder.
2. **Print job:** file/dieline/spec intake, material/size/bleed/finishing/quantity, outsource vs in-house, stages (prepress, print, finish, pack, ship), assigned vendor/resources, proof approval, QC, delivery. No precision preflight claims without licensed tool.
3. **Apparel job:** size/color matrix, blank availability, decoration locations/methods, digitizing/setup and per-placement run costs, quantity breaks, proof and size breakdown, optional decorator shipping, consolidated fulfillment.
4. **Promotion job:** item+variant+supplier offering+PPC pricing/config, artwork area and setup, quantity-break support, vendor PO and order status, drop-ship tracking.
5. **Custom manufacturing:** custom line without SKU + requirements and sourcing review; CAD/BOM/engineering coming soon, not silently projected onto catalog SKU.
6. **POD one unit:** only show checkout for product/part/decorator path with explicit MOQ1, landed cost, shipping, production time, artwork validation and transactional provider contract, otherwise quote-first.
7. **Repeat order:** duplicate approved design configuration and new fresh price/stock check, not clone prior costs as current. Historical proof and accepted terms immutable.

## Business rules (enforced server-side, not only UI)
- Tenant/workspace membership + capability + record classification + business state authorize each operation; all unknown actions denied.
- Issued quote revisions frozen; amendment creates revision N+1. Accepted order seller/legal brand/terms, quantities, prices and art spec frozen as snapshots.
- No quote send if cost unknown/expired unless explicit documented exception workflow and owner signature. Unknown is NULL, never $0. Supplier cost, setup, decoration, shipping, taxes all separately modeled.
- Margin = `(net sales excluding tax - direct landed cost) / net sales excluding tax`. Target 40%, lower than 30% blocked pending owner/approved exception; between 30–40% review note. Free freight still counted as cost. Price rounding and tax rules configurable; no guessed rates.
- Two first customer orders prepaid; later Net 15 only upon account policy/credit approval. Payment authorization/capture verified via provider event, not UI success redirect. Deposit and balances explicit.
- No supplier PO transmitted without accepted order + payment authorization per terms + approved proof where required + confirmed source/configuration + current price/stock or documented authorized override.
- Product manufacturer/brand may be public, supplier/decorator/fulfiller identities not. Render public API from explicit `public_product_projection` with allowlist, not direct DB row serialization.
- Manual overrides to curated name/copy/category/imprint rules survive supplier sync; inherited supplier facts carry provenance + freshness; updates mark exceptions not overwrite user-reviewed fields.
- Product identity: manufacturer/model + approved GTIN/variant characteristics; fuzzy suggestions never auto-merge uncertain items. Distinct supplier offers map many-to-one canonical product; never delete source evidence on merge.
- Supplier feeds staged by import batch with preview/diff/validation; row-level acceptance/rejection, reversible publication and audit. Technical rollback can undo unpublished imports, but may not rewrite binding history.
- Art assets licensed/owner-approved; original upload immutable; editable design project version distinct from rendered preview; approved proof immutable; production handoff gets validated version and zone geometry. File scans, type/MIME restrictions, quota, signed URLs, and tenant isolation required.
- Inventories with stale timestamps show 'verify availability'; do not imply real-time stock. Fulfillment promise uses proven supplier lead time + decoration + shipping assumptions.
- Customer data, finance and artwork cannot be shared across ventures by default. Shared templates and public assets may be granted or safely copied explicitly.
- Every financial/production-relevant write has idempotency key, audit event and outbox event where downstream actions follow.
- Owner attention: exception-first notifications; default digest rather than repeated interruptive notifications, with urgent financial/deadline exceptions only.

## No-code operator requirements
Editable grids: filter/sort/search, column selection, multi-select, batch change preview, validation errors by row, dry-run price impacts, versioned change log, scheduled/undo for unbound data, CSV export/import with templates, manual product entry, category remapping, bulk artwork zone/templates, channel-specific publication, supplier precedence, live-vs-draft comparison, save draft and approve publish. Do not require SQL, GitHub, spreadsheets outside OS or supplier portal copy-paste for normal operations.

## MVP design principle
Build complete screens and commands for all `ACTIVE_V1` functional units at once, backed by synthetic records and mocks. Placeholder screens for all named later modules; avoid fake data outside clearly marked demo mode. The initial full acceptance tests a single coherent cross-module transaction, while automated unit/contract/security tests run throughout engineering.
