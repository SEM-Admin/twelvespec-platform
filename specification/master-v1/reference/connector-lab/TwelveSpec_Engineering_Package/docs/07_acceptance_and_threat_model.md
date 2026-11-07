# Security, acceptance criteria and release gates

## Tests for Integration Center

- Supplier connection created with metadata only; credentials cannot be retrieved via admin list, browser response, logs or backups in plaintext.
- Unknown/auth-invalid provider yields `AUTH_REQUIRED`/`LICENSE_REQUIRED` without claiming success.
- PromoStandards provider X can support product data but not PO; capability matrix preserves difference, disables PO action.
- Credential rotation invalidates old reference and records who/when; only privileged role can rotate.
- Custom endpoint rejects loopback, metadata, private range, disallowed redirects and DNS rebinding; allowlisted external hosts only.
- ASI SmartLink connector remains unconfigured until licensed; adding ordinary ESP+ browser credentials must not be treated as proof of authorization.
- CSV handles quoted commas, embedded newlines, BOM; duplicate rows and missing required fields are held for review.
- XML rejects DOCTYPE/ENTITY/external links; excessive payload, depth, rows and strings fail safely.
- Mapping stores source value, source file hash, time and chosen canonical mapping; approved overrides are preserved.
- Publish action is authenticated, tenant-scoped, audited and reversible; imported price alone cannot bypass margin gate.

## Full customer+operations scenarios

1. Import 100 variants -> map -> review exceptions -> publish only approved records -> search storefront.
2. Configure size/color/decoration -> valid quantity break -> pricing snapshot -> draft quote.
3. Upload art -> edit -> proof approval -> production preflight; approved revision immutable.
4. Multi-supplier order -> two POs -> supplier partial ack -> split shipment -> financial closeout.
5. Duplicate PO webhook/event -> one processing effect; unknown timed-out submit reconciles before retry.
6. Company store restricts buyers, products and budget; customer never sees supplier identity/cost.
7. Broken supplier inventory feed triggers stale status and quote-only behavior rather than false live stock.
8. Pricing floor violation triggers approval; 40% margin is computed from costs using cost/(1-.40).
9. End-to-end auth/RLS attempts from second tenant denied for every data class, including files.
10. Startup from clean clone + migrations + seed + test suite + preview independent of production accounts.

## Threat model highlights

Secret theft, lateral tenant access, upload malware, XML external entities, server-side request forgery, poisoned supplier product content, leaked private cost in public JSON, insecure webhook signature processing, replayed payment/PO commands, CSV formula injection, overprivileged integration tokens, product-data licensing misuse. Prioritize at server boundary, not merely UI state.

## Operational guarantees and SLOs to define before live

Restore test frequency, audit retention, sync freshness by service type, queue retry schedule with backoff, explicit manual override approvals, structured support tickets with correlation IDs, data removal/export behavior, and alert escalation owners. Defaults in prototype are illustrative only.
