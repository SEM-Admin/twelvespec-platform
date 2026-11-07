# Connection Center — product requirements and security contract

## UX: Settings > Integrations > Add Connection

1. Select source/provider family: **PromoStandards direct**, **ASI SmartLink**, **Custom REST**, **CSV Upload**, **XML Upload**, **Production**, **Shipping**, **Accounting**.
2. Select known supplier/vendor, choose environment `mock | sandbox | production`. For PromoStandards choose company and discovered service WSDL URL/version; for SmartLink obtain an independent authorized developer account (not ordinary ESP+ website sign-in); for CSV/XML choose upload and mapping profile.
3. Show fields appropriate to provider: account/ASI identifier, username, password, key/token, OAuth or certificate, optional service URLs. Mask existing secrets; UI can *replace*, *rotate*, *revoke* but cannot read back.
4. Validate endpoint policy; save credential via privileged server to managed secret store with a **secret reference only** in relational DB.
5. `Test connection` performs safe read-only health/identity request, reporting which services actually work and the timestamp. Never test by sending a production purchase order.
6. `Discover capabilities` shows per-service `available | unsupported | credential_required | license_required | failed | unverified` with version and test evidence.
7. `Map fields` shows left source keys and right canonical keys, sample values, transformations (typed, allowlisted), confidence and locked merchandising overrides.
8. `Preview import` stages raw records, validates, detects duplicates and conflicts, reports failures. `Publish selected` is an explicit admin step, records audit and can be reverted with a publish revision.
9. Sync policy per integration: manual, scheduled, and on-demand; run history, stale-data alerts, errors and retry/dead-letter queue.

## Secrets and OAuth boundary

Production: managed vault or KMS-backed envelope encryption, separate per-tenant access policy, server-only use, rotation/revoke, break-glass audit, never send secret values in GET/list responses, never include in job payloads/logs. The sample local demo DOES NOT implement secret saving. No provider auth value should be entered into it. Use isolated OAuth apps per environment where applicable.

## Provider SDK operation contract

`testConnection`, `discoverCapabilities`, `fetchCatalog`, `fetchVariants`, `fetchMedia`, `fetchPricing`, `fetchInventory`, `quoteFulfillment`, `validateArtwork`, `submitPurchaseOrder`, `getOrderStatus`, `listShipments`, `cancelOrder`, `handleWebhook`. Each operation carries version, auth scope, idempotency and timeout policy; unsupported capabilities must return structured `UNSUPPORTED` rather than silently succeeding.

## Data integrity

Keep `source_product`, `source_variant`, `source_observation`, `canonical_product`, `canonical_variant`, `supplier_offer`, and `field_override` separate. Supplier imports never directly overwrite manually curated public text, images, category or price. Pricing freshness differs from catalog freshness; stock may expire quicker than product metadata.

## Remote endpoint safety

For custom URLs, enforce HTTPS except explicit local mocks, owned/verified allowlisted hosts and redirect checks. Resolve and reject private/loopback/link-local/internal metadata IPs at connection and request time, protect against DNS rebinding, egress allowlist, size/time limits. XML import disallows DTD/entities. API uploads are size-limited and scanned; CSV formula-like values escaped on export. Validate image/media URLs independently.

## Missing provider authorization

If an ASI SmartLink key/license is absent, UI should show `License/access required`, provide documented contact instructions and permit CSV import. An ESP+ user/password field without the authorized API access path must not be presented as a working integration. The same principle applies to service-specific PromoStandards trading permissions.
