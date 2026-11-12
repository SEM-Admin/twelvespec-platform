# TwelveSpec CIA — Commercial Intelligence Architecture
**Status:** proposed architecture and implementation contract, not live capability  
**Baseline:** main at `3c221f697a3bd9631ccb7ecabaaa8e3c2c5d9649` (November 12, 2026)  
**Owner objective:** profitable repeatable TwelveSpec operations with progressively fewer owner hours; reusable foundations for a *separate future retail brand*.

## 1. Non-negotiable principles

1. **CIA feeds every applicable domain bidirectionally**, but does not replace their authoritative transaction services. Catalog owns product publication; sales owns accepted quote snapshots; finance owns financial references; authorized prepress releases production files; integrations own secrets and supplier access.
2. **Seven questions for every consequential relationship:** WHO (parties/roles/beneficiaries), WHAT (products/assets/specifications), WHY (intent/incentives), WHERE (facilities/routes/jurisdiction), WHEN (validity/history/deadline), HOW (methods/processes/dependencies), HOW MUCH (list/net/actual price, freight, margins, credit, risk).
3. **Separate facts from claims, estimates, inferences, and recommendations**. Preserve original-source values, timestamps, licensing and transformations. Unknown is not zero.
4. **Published catalog prices are permanent history.** Never overwrite edition or tier observations; never confuse catalog list/retail/MSRP/MAP with distributor net, contract price, quote, or realized cost.
5. **One immutable decision trace**: request, actor/tenant, evidence versions, rules/model versions, alternatives, exclusions, uncertainties, approval, action references, observed outcomes.
6. **Hard boundaries:** no live supplier purchases, payment, production-file release, public price publishing, new paid services, or deferred autonomous AI without existing gates and owner authorization. Do not expose wholesale suppliers, costs, or decorators in customer projections.
7. **Future retail reuse** is architectural only. Shared code/ontology is allowed; customer, price agreements, brand intellectual property, financials, legal seller, permissions, and tenant storage are isolated. No retail storefront launch in this work.

## 2. What exists and should be reused

- `packages/kernel`: scoped transactions, tables, audit/events, idempotency.
- `packages/catalog`, `packages/configuration`, `packages/supplier`, `packages/providers`: product/variant identity, source staging, supplier interfaces, reviewed publishing.
- `packages/pricing`, `packages/estimating`, `packages/sales`: Decimal-based pricing, quote costing, approval paths and snapshots.
- `packages/creative`, `packages/orders`, `packages/procurement`, `packages/fulfillment`, `packages/finance`: production and economic lifecycle.
- `packages/workflows`, `apps/worker`, `packages/analytics`, `packages/today`: business events, processing and reporting foundation.
- `docs/industry-research`, `docs/business-research`, `docs/planning`: existing source evidence, 16-domain research, proposed logical entities, 40 gap packages and 95 original acceptance journeys.

This is a **target contract**, not evidence that every capability listed above is fully operational. Audit the exact current code and database migrations before changing schemas. Existing V1 and 80 CMS case acceptance remains in effect.

## 3. Core semantic graph (PostgreSQL-first, no new graph database by default)

**Entities**: organization; person/role; legal seller; supplier/distributor/manufacturer/decorator/fulfillment provider; facility/location; brand; product family; manufacturer item; canonical product; exact variant; component/material; decoration/print method; production zone/template/dieline; supplier offer; price observation; tier/charge; capability; specification; source document; evidence claim; customer requirement; opportunity; configuration revision; design/proof revision; quote/quote line; job/requirement/PO/shipment; invoice/cost; decision/outcome.

**Relationships** require typed endpoints, tenant/workspace scope where applicable, provenance, applicable time interval, and verified/unverified/conflicted status. Examples: MADE_BY, SOLD_BY, SUPPLIED_FROM, DECORATED_BY, HAS_VARIANT, REQUIRES_METHOD, COMPATIBLE_WITH, HAS_ZONE, HAS_PRICE_EVIDENCE, FULFILLED_BY, REQUESTED_BY, QUOTED_IN, PRODUCED_AS, SHIPPED_TO, INCURRED_COST, BENEFITED_PARTY. A brand is not synonymous with manufacturer; a distributor is not automatically a producer. Two visually similar variants are not automatically equivalent.

Use ordinary relational tables and views first. Additional graph/vector infrastructure requires a documented query bottleneck or evaluation result.

## 4. Evidence record contract (conceptual, adapt to current schema)

```json
{
  "evidence_id": "uuid",
  "subject_ref": {"type": "supplier_variant", "id": "uuid"},
  "predicate": "published_catalog_unit_price",
  "original_value": "0.0250",
  "normalized_value": "0.0250",
  "unit": "USD/each",
  "price_class": "PUBLISHED_LIST",
  "source": {"provider_id": "uuid", "document_id": "uuid", "edition": "2026", "page_or_row": "p12/tier3", "uri": null},
  "rights": {"ingest": "AUTHORIZED", "redistribute": "NOT_GRANTED", "retention": "VERIFY"},
  "valid_time": {"from": "2026-01-01", "to": null},
  "observed_at": "2026-11-12T00:00:00Z",
  "verified_at": null,
  "verification": "UNVERIFIED",
  "revision": 1,
  "supersedes_evidence_id": null
}
```

The JSON example is a schema illustration, **not an actual supplier price**. Do not store raw secrets, confidential agreements or unlicensed PDF bytes in public source control. Distinguish valid/effective time from the time TwelveSpec observed a claim. Preserve conflicts and original unit, currency, price code, pack size, min quantity, inclusive/exclusive decoration, tooling, fees and tax/freight conditions.

## 5. Pricing intelligence contract (CIA-PRICE-001)

Represent one complete supplier published catalog price observation with:
- source document/page/row and file digest where authorized; supplier account scope; publication/catalog edition; date effective and date captured; permissions and redistribution limits;
- manufacturer SKU, supplier SKU, canonical variant match confidence, color/size/spec revision, quantity minimum, price-break schedule, pack basis, unit of measure, currency and precision;
- price classification (PUBLISHED_LIST, MSRP, MAP, DISTRIBUTOR_NET, ACCOUNT_NET, NEGOTIATED, MARKET_OBSERVATION, ESTIMATED_LANDED, TWELVESPEC_SELL, ACTUAL_COST); preserve supplier native names/codes;
- decoration/setup/prepress/run charges as separate condition-bearing observations, never silently combined into generic unit prices;
- scope for each price (customer/account/territory/channel, validity, expiration, eligible quantities), with access controls.

**Rules**:
- Immutable history: new catalog editions append observations; issued quote snapshots remain unchanged.
- Compare equivalent offers only after validating exact variant/options/quantity/unit, coverage, production method, in-hand date, tax and freight assumptions.
- For net price decisions, explicitly select a current *authorized* offer for that account; published list is contextual intelligence unless explicitly eligible.
- Use arbitrary-precision decimal arithmetic; select eligible tier at full supplier unit precision; extend by quantity, then round at documented financial boundaries. Test 0.0250 × 1000 = 25.00; do not round unit first to 0.03.
- Unknown cost, availability, production requirements or rights mean blocked/unverified recommendation, not an invented zero or automatic approval.
- Customer-facing projections must hide supplier/decorator identity when private, net rates, cost evidence, agreements and account credentials.

## 6. Data acquisition and quality

Source connectors (public websites where permitted, licensed account APIs, authorized documents, CSV/XML, manufacturer manuals, operations) must be versioned, rate-limited, auditable, license-aware and reversible. Maintain a source registry with `source_id, owner, domain, authority, edition, accessed_at, terms, permitted_operations, refresh_cadence, parser_version, verification_state`.

Quality dimensions: identity resolution, completeness, currency, provenance, consistency, right-to-use, applicability, confidence, timeliness, and conflict rate. Measure *verified sellable catalog coverage*, not only number of raw imported records. Existing 5,643 staged product candidates are not published facts.

First documented public sources to evaluate (do not claim authenticated access):
- S&S PromoStandards service directory https://promostandards.ssactivewear.com/ — Product Data 2.0, Media Content 1.1, Pricing & Configuration 1.0, Inventory, PO, Order Status and Invoice endpoints.
- S&S electronic integration page https://www.ssactivewear.com/marketing/edi — JSON/XML REST product, price, inventory, and ordering capabilities; API key is account-specific.
- SanMar Data Library reference https://www.sanmar.com/resources/electronicintegration/sanmardatalibrary — product data; SanMar FTP Integration Guide v21.3 lists piece/dozen/case/MSRP/MAP price classifications.
- Existing `docs/industry-research/SOURCES.md` and supplier-access assessment — reconcile and deduplicate sources, not re-research without checking what is already recorded.

## 7. Decision interface and audit

`qualifyCommercialRequirement(request, context)` should accept requirement IDs, exact quantities, color/size distribution, decoration method, target delivery, ship-to area, brand constraints, optional budget, and invoking actor/workspace. Return structured:
- requirement completeness; candidate exact variants; qualified producer/source routes; non-qualifying reasons;
- provenance-linked catalog prices and current authorized costs (internal only), source freshness, complete landed cost scenarios;
- explicit MOQ/capability/deadline feasibility and UNKNOWN/BLOCKED statuses;
- ranked *qualified* alternatives with traceable deterministic criteria, never hidden assumptions;
- recommendation and required human review; contract/version/decision IDs to persist outcome feedback.

**No direct purchase, payment capture, production file export, automatic customer-visible price promise or approval bypass**. Recommendations do not supersede transactional validation. All exposure paths must have deny-by-default field allowlists and cross-tenant tests.

## 8. Initial evaluation — Mission CIA-001, decorated apparel

Use an **authorized or synthetic clearly labeled** 48-cap embroidered RFQ to test the service. Exact variant and location-specific imprint method are mandatory. Evaluate supplier/blank/decorator route separately, pricing tiers, setup, freight, in-hand deadline, and approved art constraints. A human-approved costed quote can be proposed but not issued without sales authority.

Evidence output should include candidate comparison, excluded options with reasons, confidence/verification state, cost-to-sell calculations, and a saved decision record. After a controlled actual order, link realized costs, delivery outcome, defects and owner minutes; never fabricate outcomes.

## 9. Acceptance tests / exit evidence

1. Supplier's 2025 and 2026 edition prices remain independently queryable and cited; re-import dedupes by source/version rather than erasing history.
2. Catalog list, MSRP, MAP, account net, negotiated, actual cost never silently substitute for each other.
3. 0.0250 × 1000 = 25.00 with explicit rounding; tier boundaries/MOQ, currency and packing basis checked.
4. Unknown freight/tax/decoration/producer spec blocks final commitment rather than presenting valid $0.
5. Duplicate product names and ambiguous part IDs do not merge without review.
6. Source revocation/expired license changes rights to use/publish without deleting valid historical internal audit data when retention is permitted.
7. Multi-tenant customer and net-price access denied in queries, event payloads, analytics, exports, logs and storefront projections.
8. Stale source facts carry freshness and conflict flags; competing claims retain provenance.
9. No producer artwork release from customer proof approval; correct variant/design/proof identity enforced.
10. Decision record includes all evidence and rule versions, alternatives, approvals, feedback link.
11. Existing 251 backend and 18 local browser baseline is maintained or regressions explained; original 95 and 80 CMS scenarios remain tracked as open until separately evidenced.
12. No live endpoint calls/charges, new services or production changes without approval.

## 10. Work sequence / Codex responsibilities

**CIA-A Audit:** Map existing exact code paths and migrations to the semantic graph, source register, prices, evidence and decision system; classify VERIFIED/PARTIAL/RESEARCH_ONLY/MISSING/BLOCKED. Produce delta rather than generic blueprint.

**CIA-B Design:** Propose minimal additive SQL/TypeScript types, ownership and RLS, source/evidence lifecycle, versioned decision interface, cross-tenant/privacy controls. Include migration compatibility and backfill plan.

**CIA-C Build:** Implement immutable price evidence ingestion and retrieval first; deterministic unit/tier arithmetic; seed authorized or synthetic test evidence with explicit labels; no live API activation.

**CIA-D Demonstrate:** Implement CIA-001 qualifier against existing catalog/pricing/quote foundation, with incomplete evidence blocking, decision audit and end-to-end browser coverage.

**CIA-E Evaluate:** Connect observed order economics and labor time when available, establish data-quality dashboard and outcome measurements; do not claim predictive AI until data supports it.

Prepare isolated PRs with commit-specific tests. Escalate only data rights, account access, paid resources, financial/legal choices, and production deployment permission. Retain V1 launch blockers and avoid a parallel standalone CIA app.

## 11. Commercial success measures

Verified sellable SKU coverage; price evidence completeness/freshness; source mismatch count; quote time and accuracy; realized gross profit/contribution; on-time and defect rates; conversion/reorder outcomes; owner minutes per quote/order; recurring contribution per owner hour. Publish baselines only from actual data; no fabricated targets.

**Key rule:** TwelveSpec executes. CIA integrates evidence, reasoning and feedback across the ecosystem, subject to the owning modules' authority.
