# CIA-TRUST-001 — Customer Trust, Marketing, Website & E-Commerce Truth Contract
**Status:** proposed architectural contract; implementation and live launch not yet verified.  
**Companions:** [CIA commercial intelligence](ARCHITECTURE_AND_IMPLEMENTATION_CONTRACT.md), [product & manufacturing lifecycle](PRODUCT_LIFECYCLE_AND_MANUFACTURING_INTELLIGENCE.md).  
**Priority:** V1 customer-facing credibility, lead capture, qualification, requests for quote and accurate catalog ahead of advanced automated transactions.

## Core business objective

The website is TwelveSpec's principal public proof of capability, customer acquisition channel and future commerce surface. It must express the actual TwelveSpec offering accurately and convincingly: *precision print, promotional merchandise, branded apparel, marketing materials and related managed sourcing/production*; use the brand descriptor/tagline approved in current brand source of truth; focus on relevant B2B/customer use cases and outcomes, not internal supplier feeds or aspirational platform technologies.

**Never market a proposed engine or unverified production capability as live operational functionality.** The current new-build selling readiness document says NO-GO for paid production orders. Quote-first and approved request workflows may be represented only to the extent actually tested and deployed. A non-deployed feature is not a customer capability.

## Bidirectional CIA contract

**CIA contributes to public marketing/commerce:**
- approved product, category, brand and exact variant attributes and imagery with use/redistribution rights;
- current, supplier/product-specific material, imprint, method, MOQ, delivery and compatibility restrictions and their confidence/readiness;
- authorized customer-visible availability and price/quote-eligibility; no wholesale leaks;
- industry use cases, campaign merchandising, product discovery/search, content and FAQs grounded in verified facts;
- approved original-product specifications, published brand claims, creative assets, mockups and product listings;
- marketing quality, customer education and quote recommendations based on actual signals.

**Marketing and commerce contribute back to CIA:**
- consented/authorized traffic acquisition and attribution, discoverability queries, product/category interest, conversions, RFQ fields, abandoned requests and reasons, campaign responses, customer feedback, product/page discrepancies, estimated vs fulfilled commercial performance;
- aggregated channel data with consent and appropriate retention; no indiscriminate customer profiling or scraping;
- editorial approvals, claim corrections, customer support themes and verified outcomes.

**Authority:** Brand/marketing owns approved narrative, claims, presentation and channel campaign publication; catalog owns approved published product/variant projections; commerce/sales owns eligibility, RFQ, issued offers and checkout gate; finance owns tax/price/terms; CIA supplies evidence, recommendation and validation. Never silently auto-publish AI text, prices, claims or products.

## Public truth-status and proof

For each *customer-visible claim* establish:
- claim ID, statement and context, proof/source, source rights, reviewer, effective date, last verified date, applicable product/service/geo/process, expiration, confidence, permitted channel;
- statuses: `VERIFIED_AVAILABLE`, `CONDITIONAL_OR_QUOTE_FIRST`, `PLANNED_NOT_AVAILABLE`, `UNVERIFIED_DO_NOT_PUBLISH`, `RETIRED`;
- no false promises about in-house production, direct manufacturing, stock, pricing, delivery guarantees, technical file exports, embroidery digitizing, AI design, 3D, CAD, autonomous ordering, integration connectivity or original-product engineering;
- clear distinction between TwelveSpec **managing/arranging** specialist production through suppliers and **owning/operating** specific manufacturing facilities/equipment.

The site may showcase inspiration or renderings if correctly labeled and licensed; do not depict a simulated product as a finished, tested sample. Remove or update stale content promptly via source/claim invalidation.

## Website information architecture and journeys

Customer pathways should support:
1. **Discover** via industry/use case, product category, product/recognized brand and event/program needs.
2. **Understand** what TwelveSpec delivers, customization options, process, limitations, proofs and customer responsibilities.
3. **Trust** through accurate capabilities, visible business identity/contact and straightforward policies, legitimate examples/case studies only with rights and consent; never invent testimonials, logos, credentials or delivery statistics.
4. **Act** through clear request-a-quote/consultation/brief intake and transparent next steps; online purchase only for authorized, verified eligible product types after launch gates.
5. **Repeat** via account history, reorder, company programs and self-service where implemented and secure.

Navigation/content schemas should cover primary offerings (commercial print, promotional merchandise, apparel/headwear, signage/displays, packaging/labels where actually serviceable), customer industries (energy/industrial/manufacturing/distribution, corporate, schools, real estate, healthcare subject to actual qualifications), and programs (company stores, bundles, events, fundraising when ready). Each industry page must represent a *real applicable offer*, not an unverified claim of industry certification.

## Brand & content system

Use the actual approved TwelveSpec design system; premium, expressive, clear and credible—not generic supplier catalog pages or internal OS jargon. CMS should let authorized staff edit approved narrative, navigation, SEO metadata, claims, brand kits, promotions, FAQs, product curation, calls to action, policies and media **without editing code**, with preview, revisions, scheduling, permissions and rollback. Preserve the existing original 80 CMS case set as a distinct acceptance target.

Generate derivative marketing assets from approved product identity/variant/color/placement specifications. AI-assisted writing and imagery must be labeled for review, cannot create unverifiable performance claims and cannot directly publish without authorization.

## E-commerce readiness and honesty

Every sellable item must have approved product identity, valid rights, exact option/variant, current commercial terms, production route/limitations, shipping/lead-time expectations and tax/payment/fulfillment controls. Price can be `REQUEST_QUOTE`, `INDICATIVE_FROM` with transparent scope, or binding only when fully authorized. Do not use standard catalog MSRP as cost or invent checkout prices.

Separate:
- `DISCOVERY_ONLY` (browse, not committed),
- `QUOTE_REQUEST_ELIGIBLE` (collect requirements),
- `QUOTABLE_AFTER_REVIEW`,
- `DIRECT_CHECKOUT_ELIGIBLE` (all live gates satisfied for that exact configured SKU).
No price or add-to-cart UI bypasses eligibility. Preserve confidential supplier/decorator identities, wholesale rates, private agreements. Distinguish MOQ 1 POD *only when source verified* from generic personalization.

## Acquisition, customer trust and commercial measurement

Instrument privacy-conscious funnel events: qualified visitor -> relevant page/category -> RFQ start -> RFQ complete -> response -> quoted -> won/lost -> fulfilled -> repeat. Record source/channel/campaign where consent allows and avoid fake attribution. Combine website metrics with realized gross profit, response time, customer satisfaction, repeat orders, owner minutes per lead/quote, cost to acquire customer, and net contribution. Do not optimize page views in isolation.

**Initial success path:** Show clear and true TwelveSpec offerings, trusted contact and service process, selected verified showcase products, usable quote workflow and measured customer inquiries. This is the shortest path to first paying customer while advanced engines mature.

## Codex deliverables — in order

1. Audit storefront, OS/CMS, brand design, product discovery, categories, navigation, SEO, content models, RFQ, account, checkout-gating, permissions, analytics, and deployed preview status with exact code/test proof. Inspect existing brand instructions rather than inventing refreshed colors/copy.
2. Map website/commerce **consumes / contributes** CIA data and source ownership; define approved public projection allowlists and product/service/claim truth-status policies.
3. Compare actual public website content against what the new platform can genuinely deliver *today*. Produce a truthful capability/claim matrix: `LIVE_AND_VERIFIED`, `EXTERNAL_HUMAN_DELIVERY`, `QUOTE_FIRST`, `PLANNED`, `BLOCKED`. Report inaccurate/missing marketing claims for editorial approval.
4. Create a customer journey and information architecture audit (search/discovery -> credibility -> lead/RFQ -> quote -> order -> reorder), with user-friendly content revision workflows and accessibility, mobile and performance checks.
5. Specify minimum incremental fixes and tests. Avoid rewriting the storefront or overwriting approved marketing content without user authorization.
6. Design customer-trust/SEO/content, product-publication, quote eligibility and acquisition/ROI evaluation tests. Include license/media rights, deceptive claims, provider visibility, stale catalogs, shopping eligibility, privacy and consent.
7. Deliver staged, small implementation PRs: prioritize validated lead conversion and product discovery, then safe commerce, then advanced merchandising and reusable retail capabilities.

## Mandatory acceptance examples

- An AI-generated claim of in-house embroidery when unverified is blocked from publication.
- Customer may browse a qualified product and request a quote even if automated checkout is gated.
- Private supplier account net and producer identity cannot be exposed by listing, search, structured data, sitemap, social card, marketing exports or page metadata.
- Different product variants cannot inherit artwork size, in-stock status, MOQ, manufacturing capabilities or binding prices without verified applicability.
- Approved marketing text is editable and reversible through CMS; no code deployment required for routine approved content changes where CMS support exists.
- Stale supplier feed flags affected item for review without erasing approved historical catalog evidence.
- Mockup is not represented as a physically verified sample; font/image/brand usage rights are checked.
- Accessibility, mobile conversion, SEO metadata, contact/lead forms, spam protection and RFQ submission have repeatable browser test coverage.
- Original V1/CMS acceptance gates and live-selling NO-GO conditions remain in effect until actual release evidence proves otherwise.

## Compatibility with existing CIA

CIA-001: evidence, published vs net pricing, seven-dimensional ontology, tenant security and decision trace unchanged.

CIA-PRODUCT-001: approved products, original product definitions, visual/design/manufacturing versions are source facts; CIA-TRUST-001 publishes **only approved public projections**. No 3D/digitizing/engineering feature is represented as live unless separately accepted.

**No conflicts intended:** brand/website is the commercial presentation and acquisition surface; CIA informs it; operational owners authorize it. Codex must audit any conflicting actual source code or current marketing claim before proposing changes.
