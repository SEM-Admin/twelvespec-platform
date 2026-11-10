# Codex amendment: native PromoStandards supplier connector

**Override any earlier integration recommendation:** Do not use PSRESTful at all. No PSRESTful package, account, middleware, runtime endpoint, credentials, mention in executable app configuration, or paywall assumption.

## Supplier data topology
Each supplier publishes the endpoints it supports. The connector registry is a per-supplier/per-service map, **not** one central PromoStandards catalog. Build SOAP/WSDL interoperability against approved supplier hosts with version-specific schemas and normalization. Use the official PromoStandards PHP/Yii sample as an explanatory reference only: https://github.com/promostandards/productDemoPhp. Keep the platform in TypeScript/Next.js; do not port the application to the legacy Yii 1.1 example framework.

## Interface contracts (implementation targets)
```ts
type Service = 'product_data' | 'pricing_configuration' | 'media_content' | 'inventory' | 'order_status' | 'shipment_notice' | 'purchase_order' | 'invoice' | 'compliance' | 'order_management';
type SupplierEndpoint = { supplierId: string; service: Service; serviceVersion: string; environment: 'sandbox'|'production'; wsdlUrl: string; endpointUrl: string; authMode: 'soap_id_password'|'oauth_client_credentials'|'supplier_custom'; credentialRef: string; enabled: boolean; writesAllowed: boolean; verifiedAt?: string; };
interface SupplierProtocolAdapter {
  checkService(endpoint: SupplierEndpoint): Promise<{ok:boolean; latencyMs?:number; fault?:string}>;
  fetchProducts(input: {supplierId:string; changedSince?:string; cursor?:string}): Promise<{items:unknown[]; nextCursor?:string}>;
  fetchPricing(input: {supplierId:string; productId:string; partIds?:string[]; quantity?:number}): Promise<unknown>;
  fetchInventory(input: {supplierId:string; productId:string; partIds?:string[]}): Promise<unknown>;
  fetchMedia(input: {supplierId:string; productId:string}): Promise<unknown>;
  previewPurchaseOrder(input: {supplierId:string; orderId:string}): Promise<unknown>;
}
````

Design note: interfaces above are conceptual and must be adapted to exact operation signatures in each supplier's WSDL; unavailable services return `UNSUPPORTED` rather than fabricated results. PO transmission requires separate explicit enablement and authorization.

## Data model additions
- supplier_endpoints (tenant/workspace/supplier/service/version/environment; url allowlist; verification status)
- supplier_connection_secrets (reference only; vault-backed)
- supplier_capabilities (service, effective versions, enabled ops, last verified, limits)
- supplier_sync_runs and supplier_sync_records (correlation, state, attempts, errors, provenance)
- supplier_raw_observations (private payload pointer, integrity hash, validity, source timestamps)
- supplier_source_products, supplier_source_variants, supplier_source_price_schedules, supplier_source_inventory, supplier_source_media
- canonical_product_supplier_offers and identity-review queue
- supplier_write_authorizations and audit events

Never put service credentials, raw supplier cost, or supplier identity in the customer-facing API. Store private partner identities internally; consumer brands may be shown if allowed.

## Tests
1. Read product and part IDs from fixture; do not derive identity from title/color.
2. Handle different supported service versions and absent endpoints.
3. Reject SOAP faults, invalid XML, incorrect namespace, malformed monetary data, wrong currency and corrupted part mapping.
4. Reject unapproved hosts, redirects to unapproved hosts, oversized responses, timeouts and retries beyond budget.
5. Preserve curated product overrides across supplier sync; quarantine discrepancies; safe idempotent replays.
6. Confirm financial and supplier-private fields never leak in public JSON, HTML, SEO or image metadata.
7. Confirm PO write is disabled by default; authenticated authorization and sandbox tests required.
8. Demonstrate supplier registration, credentials reference, service test, dry-run product import, mapping review and publication completely through the admin UI.

## External references
- https://promostandards.org/how-promostandards-makes-your-business-better/
- https://github.com/promostandards/productDemoPhp
- https://promostandards.ssactivewear.com/
- https://api.stregisgrp.com/documentation/promostandards/
- https://www.yiiframework.com/release-cycle
