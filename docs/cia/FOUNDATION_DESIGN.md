# CIA M1 — minimal implementation design and traceability

Status at audit commit: **PROPOSED; implementation/test results recorded separately below.** This design follows [the compatibility audit](CODEBASE_COMPATIBILITY_AUDIT.md). It does not activate the broader proposal in PR #3.

## Boundary and minimal physical model

Add a server-only `packages/intelligence` package, called from existing Supplier and Sales commands. It owns evidence/assessment history only. It has no standalone module, public storefront projection, provider HTTP client, secret store or state-changing quote/pricing policy authority.

Add migration 011 with scoped immutable records:

- `intelligence_sources`: source key/version, publisher/edition/URI, content hash, origin, permitted uses and retention deadline, owner/actor. Optional FK to an existing supplier source record. Raw imports remain in `source_records`; this is their attributable rights/edition manifest, not a second import pipeline.
- `intelligence_restrictions`: source FK, reason, actor, timestamp. Append-only revocation. A later rights grant requires a new manifest/version; historical observations are not rewritten.
- `price_observations`: source FK, exact canonical product/variant and captured revisions, optional CRM account, explicit price class, original decimal text and `numeric(22,8)`, currency, unit/pack and MOQ/increment/tier scope, territory/channel, observation/effective/expiry dates and operator-review reference. No title matching or list-to-net conversion.
- `price_assessments`: draft quote/observation FKs, immutable request, pricing/assessment version, exclusions, eligibility and arithmetic result, actor. A saved assessment proposes no price and grants no manufacturing readiness.

All FKs include tenant/workspace. A composite `(tenant_id,workspace_id,product_id,id)` key on variants prevents wrong-product evidence. RLS uses the existing `app.scope_ok` membership function, **not** Supabase `auth.uid()`. Internal authorized roles read; only source stewards append manifests/observations/restrictions; Sales roles append assessments. No customer policy, UPDATE/DELETE grant or generic kernel table registration. Existing `app.reject_mutation` protects history. Scope+source/date and quote indexes support bounded queries; list-page limits never define totals.

No automatic backfill: legacy offers are not verified evidence. Old publication/quote/order/design rows are unchanged. Local test DB runs all migrations fresh. Roll back code by stopping new commands; retain new tables for audit. Any future data migration/retention purge needs its own reviewed plan and external rights requirements.

## Public TypeScript boundaries

`PriceClass` retains list/MSRP/MAP, distributor/account/negotiated net, market observation, estimated landed, TwelveSpec sell and actual cost as distinct classes. `assessPriceObservation` returns eligibility reasons plus precise extension; only authorized net classes are potentially usable for a new quote cost. Synthetic and unreviewed values never qualify as verified commercial costs. Exact revision, account, currency, territory/channel, effective/freshness, source rights, MOQ and pack checks are deterministic. `null` means unavailable, never zero.

`assess_quote_price` is a Sales command, takes a draft quote/line and selected observation, and freezes the financial assessment without modifying the quote. The requested account/territory/channel remain explicit context, not inferred rights. The assessment reports only the material component and cannot declare a full landed quote or production route qualified. Existing issue/accept/margin/payment/proof/release paths remain authoritative.

Existing `tierCost` and non-tier `costLine` must retain unit precision through multiplication. Preserve 2-decimal presentation of ordinary tier units where exact, but never round a sub-cent unit. New source arithmetic accepts up to 8 decimals; commercial currency totals use explicit HALF_UP only after extension. No binary-float calculations or silent currency conversion.

## Requirements → code → tests (planned before implementation)

| ID / contract | Smallest code change | Behavioral verification / exit |
| --- | --- | --- |
| CIA-A / all V1 modules | Audit above; original inventory/coverage retained | `check:spec`, `check:plan`; original 20 modules and 95 scenarios not relabeled passed |
| CIA-B / single authority | Existing kernel/Supplier/Sales commands; no new app/queue/catalog | Typecheck/build; negative customer command and DB reads; no public projection changes |
| CIA-C1 / source editions | Migration 011 sources/observations, `packages/intelligence/src` | 2025 and 2026 coexist, original raw value/edition retained, retries dedupe, conflicting key rejected |
| CIA-C2 / price classes | Typed class and scope evaluator | Historical/list/MSRP/MAP/actual/estimated values cannot become current authorized net |
| CIA-C3 / precision | `packages/pricing`, `packages/sales` | `.0250 ×1000 =25.00` via tier and non-tier real Sales costing; precision >4 retained; invalid/negative/nonfinite rejected |
| CIA-C4 / applicability | Exact typed product/variant, account/currency/territory/channel, dates/MOQ/pack | Wrong variant/product/workspace/account, stale/revoked/future/missing review, pack mismatch excluded; valid zero retained as explicit fact |
| CIA-C5 / immutable evidence | Append-only grants/triggers/FKs | UPDATE/DELETE denied, cross-scope insert/reference denied, duplicate replay safe; restricted source no longer eligible without history mutation |
| CIA-D0 / first financial slice | Existing Sales draft-line assessment and immutable receipt | Assessed line remains DRAFT, internal cost not customer-visible, no quote/order/PO/payment/proof mutation; input/rule/evidence versions retained |
| CIA-D / full 48-cap qualifier | NEXT: not implemented by M1 | Complete blank+decorator+setup/freight/timing/zone/profile evidence; explanatory browser flow and unknown blocking |
| CIA-E / actual outcomes | NEXT: original analytics and actual-cost/time owners | >1000-row full-data aggregates, no fabricated outcomes; not closed by M1 |
| CIA-F / integration | Supplier manifest/observation → exact catalog → pricing → Sales assessment | Isolated DB integration and API authorization tests, full baseline regression |
| CIA-G / product thread and pilots | NEXT: production-owned profile/revisions plus existing design adapter | Exact applicability/invalidation; cap/sticker/brochure/prototype proof-only fixtures and producer gates; not closed by M1 |

## Visible milestone checklist

- [x] Read both contracts, handoff and required current documentation; pin refs.
- [x] Inventory current domain authority, conflicts and dependencies before implementation.
- [x] Re-run baseline: 251 backend tests / 36 files.
- [ ] Implement additive evidence/rights/assessment schema and scoped commands.
- [ ] Correct existing unit extension and preserve source decimal precision.
- [ ] Verify financial assessment, immutable history, source restrictions and privacy.
- [ ] Re-run all baseline suites, browser journeys, builds and integrity checks.
- [ ] Publish small reviewable implementation PR; keep PR #3 unmerged.
- [ ] M2: full 48-cap qualification and browser workflow.
- [ ] M3/M4: exact digital thread, producer profiles, four proof/prototype pilots and qualified engines.
- [ ] M5: full-dataset outcomes and consistent event processing.
- [ ] V1 selling/release gates and separately authorized production activation.

No new service or API expense is needed for M1. No networking, deployment, supplier API request, payment, purchase or manufacturing file submission is part of it. Human work is source review and handling exclusions; measure touches/time during later real pilots before predicting savings.
