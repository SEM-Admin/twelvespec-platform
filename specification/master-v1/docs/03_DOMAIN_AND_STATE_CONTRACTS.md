# Domain invariants, state machines and formula contracts

## Required state machines
- Lead `NEW→QUALIFIED→OPPORTUNITY→WON|LOST` with reopen permissions.
- Import `UPLOADED→PARSING→STAGED→VALIDATED→REVIEWED→COMMITTED|REJECTED`; committed changes carry revision/rollback manifest.
- Listing `DRAFT→IN_REVIEW→PUBLISHED→PAUSED|ARCHIVED`; no publish without allowable public projection and sellability check.
- Artwork `UPLOADED→EDITABLE→PREFLIGHT_PENDING→PROOF_PENDING→APPROVED|CHANGES_REQUESTED`; revision invalidates existing approval.
- Quote `DRAFT→COSTED→APPROVAL_REQUIRED|READY_TO_ISSUE→ISSUED→ACCEPTED|EXPIRED|DECLINED`.
- Order `DRAFT→AWAITING_PAYMENT|CONFIRMED→ALLOCATED→IN_PRODUCTION→PARTIALLY_FULFILLED→FULFILLED→CLOSED`; cancellation/remake are separate recorded flows.
- Provider purchase `DRAFT→APPROVAL_PENDING→AUTHORIZED→SUBMITTING→ACKNOWLEDGED|REJECTED|UNKNOWN_OUTCOME`; no automatic retry after unknown outcome without reconciliation.
- Job `PLANNED→READY→IN_PROGRESS→QC_PENDING→COMPLETE|REWORK|BLOCKED`.
- Payment reference `PENDING→AUTHORIZED→SETTLED|FAILED|REFUNDED` but receipt state controlled by gateway webhook reconciliation.

## Quote component pricing (currency fixed precision)
For each quote line: `material_cost + decoration_run_cost + setup + prepress + outsourced_labor + packaging + allocated_freight + other_direct_cost = landed_cost`. Gross margin percent = `(sell_price - landed_cost) / sell_price × 100` (not markup). For target margin m, baseline sell price = `landed_cost / (1-m)` with Decimal, m < 1. Then apply configured pricing tiers, eligible discounts and rounding rule; recompute after discounts and fees. Sales tax is separately determined by a jurisdiction-aware external calculation/approved rule and never counted as sales revenue or profit. Cost source, timestamp, quote validity, assumptions and currency are immutable snapshots. Client may see estimated range only when evidence exists; otherwise `Request Quote`.

## Rules engine
Store typed JSON AST, not executable user-entered JavaScript. Allowed logical nodes `and`, `or`, `not`, comparisons, `in`, numerical thresholds; only declared inputs e.g. method/color/quantity/material/stock/status/ship region. Static analyze for contradictions and cycles. Each rule carries owner, published revision, effective date and simulation fixtures. Deterministic evaluation on client for guidance and always re-evaluate on server for authoritative quotes.

## Art and print readiness
Customer artwork: original, metadata, copyright/usage assertion, layers and product placement, version hash. Mockup: raster preview with disclaimer. Production readiness is an independent method-specific preflight: physical size, effective image DPI, actual file color profile/spot identifiers, font embedding/outlining, bleed/cut contour, transparency/overprint handling, approved location, embroidery stitch/digitization status, licensing and proof binding. Never turn a traced bitmap into an unqualified manufacturing SVG or assume hex swatch equals validated Pantone. PDF/X is a method-specific export profile, not a universal print requirement.

## Multi-provider order decomposition
For a composite order: capture line-level requirements and quote snapshot → generate fulfillment demands per line → evaluate provider capability+timing+landed cost+geography → lock route revision → create separately approved purchase requirements and production jobs → emit supplier POs through idempotent command → reconcile acknowledgments and QC → shipments per fulfillment allocation → finance actual costs and closeout. Backorders and partial shipments update the customer order's projected status without rewriting its original agreement.

## Store program policies
One store engine parameterized as `CORPORATE_ON_GOING|POPUP|SCHOOL|FUNDRAISER|REDEMPTION|EVENT`. Per-store catalog, buyer eligibility, approval budget, tax/legal seller, campaign deadline, cost center, redemption allowance, funded versus customer-paid handling. BYOB components retain per-SKU allocations and separate pack/kit operation costs.
