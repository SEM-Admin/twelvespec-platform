# Operational states, pricing, configuration and production rules

## Product and publication

`raw -> staged -> needs_review -> validated -> approved -> published -> retired`. Reject invalid transition, retain source and public revisions. Publish eligibility: identity, variant and quantity constraints, commercial price policy, compliant imagery/rights, supported decoration/artwork path, shipping/lead-time disclosure. Incomplete items are quote-only, never instant checkout.

## Quote and order

`draft -> estimated -> priced -> ready_for_review -> issued -> accepted | expired | declined`. Accepted quote revision is immutable; any changed selection/price creates a new revision. `accepted -> awaiting_payment -> authorized -> in_fulfillment -> partly_shipped -> fulfilled -> closed`, with cancellation/refund exceptions. First two real orders prepaid by default; eligible Net15 requires explicit approval/credit application. Customer-visible quote excludes private supplier identity and costs.

## Pricing

Inputs per line: blank costs by qty, decoration unit charge by method/location/colors/stitches/setup, art/prepress, packaging, freight, tax policy, waste/spoilage, rush charge, fees, currency and provenance. Calculate in integer minor units or Decimal, never IEEE float; line-level quantity breaks, per-provider quote expiry. Target gross margin 40%, floor 30%; margin = `(net_revenue - estimated_direct_cost)/net_revenue`. To target margin 40%, sell price = cost / 0.60 (NOT cost*1.4). Apply rounding policy only at final commercial price. Below floor -> approval; missing freight/decoration -> quote only. Tax computed by authorized provider/jurisdiction rules, not a flat invented rate. Save source+timestamp+versions+validity window.

## Product configurator

One constraint engine resolves selected supplier SKU/size/color, quantity, base and decoration method, zones, minimums, physical dimensions, bleed, art limits, packaging and provider capability. Constraints are declarative validated rules (`requires`, `excludes`, `min`, `max`, `one_of`) with stable version. If supplier-specific configuration cannot be verified, disable automatic checkout and create RFQ.

## Creative and production

Artwork progression: `uploaded -> preflight -> edit_required | proof_ready -> customer_approved -> production_validated -> released`. A mockup is never a production-ready asset. Keep original upload immutable, editable JSON/SVG design revision, customer approval reference, and printer-specific export separately. Require file safety, fonts/outlines/bleed, dimensions, print process, spot color IDs and rights check as applicable. Never promise automated embroidery digitizing from simple vector traces.

## Fulfillment

One order -> multiple fulfillment allocations -> multiple jobs/purchase requirements -> POs/shipments. PO states `draft -> approved -> dispatching -> submitted -> acknowledged -> partially_received -> complete`; `failed_or_unknown` must reconcile with supplier before retry. Use unique `(tenant_id, provider_id, idempotency_key)` plus external PO ref. Require approval before production PO and real money movement. Support split shipments, replacements, remakes, returns and provider failure.

## Automation

Versioned event -> conditions -> dry-run effects -> authorized actions. Every rule has scope, priority, idempotency, safety tier, owner, last run, and error queue. Read-only/notification can auto-run. Payment capture, supplier purchases, financial postings and sending customer content require explicit policies and approval gates.
