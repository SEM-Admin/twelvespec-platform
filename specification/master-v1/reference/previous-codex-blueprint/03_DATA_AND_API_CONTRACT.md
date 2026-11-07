# Data Schema, Domain Ownership, APIs and Code Contracts
**Proposed fresh physical schema.** This is NOT a migration script for the old populated TwelveSpec OS. Reconcile with MCALCO Phase 2 master-data v0.3; no automatic production migration.

## Foundation schema (preserve 34 logical MCALCO entities)
Existing v0.3 dictionary: `tenants`, `portfolios`, `legal_entities`, `ventures`, `venture_legal_assignments`, `brands`, `venture_brand_assignments`, `workspaces`, `channels`, `user_profiles`, `tenant_memberships`, `workspace_memberships`, `resource_grants`, `parties`, `party_contacts`, `business_relationships`, `offerings`, `offering_versions`, `requests`, `request_lines`, `quotes`, `quote_revisions`, `quote_lines`, `orders`, `order_lines`, `invoice_references`, `payment_references`, `documents`, `document_versions`, `integration_connections`, `audit_events`, `outbox_events`, `idempotency_keys`, `work_items`.

Contract requirements: UUID IDs; `tenant_id` and `workspace_id` non-null for scoped objects; composite FK matching scopes; effective-dated seller assignments; tenant denial by default. Immutable legal seller snapshot (name/registered address/terms) on quote issuance, accepted order and binding PO; mutable brand separate. External systems authoritative for payment processing and GL. Prefer `numeric(18,4)` for money, ISO currency, explicit tax/freight/fees; do not use JS floating-point to calculate money.

## TwelveSpec commerce + MIS extensions (normalized tables; no duplicative masters)
**Catalog**
- `product_families(id,tenant_id,workspace_id,manufacturer,manufacturer_model,canonical_key,review_state)` — optional grouping; no anonymous cross-tenant sharing.
- `product_variants(id,tenant_id,workspace_id,offering_id,sku,variant_key,attributes_json,gtin?,active)` — combination of color/size/pack/finish; unique (workspace, offering, variant_key).
- `product_attributes`, `product_attribute_options`, `categories`, `category_edges` (detect cycles), `product_categories`, `collections`, `collection_rules`, `collection_memberships`, `search_synonyms`.
- `channel_publications(id,tenant_id,workspace_id,channel_id,offering_id,version_id,state,public_slug,approved_by,approved_at)` — publish allowlist only.
- `product_field_overrides(id,offering_id,field_path,value_json,override_reason,approved_by,revision)` and `product_data_quality_issues` — durable curated ownership.
**Suppliers / source**
- `suppliers` as `parties + business_relationships(role=SUPPLIER)`; no second party master.
- `supplier_source_products(id,workspace_id,connection_id,external_product_key,raw_snapshot_ref,observed_at)`; `supplier_source_variants(id,source_product_id,external_part_key,attributes_json,gtin?)`.
- `supplier_offers(id,workspace_id,source_variant_id,canonical_variant_id?,supplier_party_id,currency,moq,lead_time_days,priority,approved_status)`; `supplier_price_breaks(id,offer_id,min_qty,max_qty?,unit_cost,setup_cost,effective_from,effective_until,observed_at)`; `supplier_stock_observations` with location/time/available/allocated; `supplier_media_assets`, `supplier_decorations` with evidence and license.
- `source_identity_matches(id,source_variant_id,canonical_variant_id,match_confidence,method,status,reviewer_id)`; **never** auto-merge uncertain.
- `feed_batches(id,connection_id,source_checksum,stage,state,dry_run,started_at,finished_at)`, `feed_batch_rows(id,batch_id,source_key,raw_json,normalized_json,validation_errors,decision)`, `sync_checkpoints`, `provider_capabilities`, `provider_rate_limits`, `integration_attempts`.
**Pricing / commerce**
- `decorating_methods`, `imprint_zones(id,variant_or_family_id,method_id,width_mm,height_mm,zone_geometry,verified_by,verified_at)`, `decoration_charge_rules`, `price_rule_sets`, `price_rule_versions`, `customer_price_agreements`, `estimate_components`, `estimate_snapshots`.
- Use core `requests`, `quotes`, `quote_revisions`, `orders` instead of parallel tables. Add `quote_approvals`, `order_payment_requirements`, `return_requests`, `reorder_links` as typed extensions only.
**Creative / prepress**
- `creative_projects(id,workspace_id,customer_party_id?,linked_request_id?,linked_order_line_id?,state)`; `creative_asset_versions(id,project_id,document_version_id,role,license_state)`; `design_versions(id,project_id,revision,scene_json,schema_version,created_by,created_at,locked_at?)`; `design_elements(id,design_version_id,asset_version_id?,surface_id?,element_type,transform_json,style_json,editable)`; `design_surfaces(id,product_variant_id,zone_id,template_version_id?,coordinate_system,physical_dimensions)`; `render_jobs`, `render_outputs`, `proofs`, `proof_versions`, `proof_approvals`, `production_artifacts`, `artwork_preflight_results`.
- Scene JSON is an internal versioned document; renderer-specific Fabric/Three JSON is an adapter projection. Versions and approved proofs immutable. A render output cannot masquerade as source or certified production artwork.
**MIS / operations**
- `jobs(id,workspace_id,order_id,job_number,state,required_by,route_type)`, `job_lines(id,job_id,order_line_id,quantity,production_route)`, `job_operations(id,job_line_id,operation_type,sequence,state,assigned_supplier_id?,scheduled_at?,completed_at?)`, `job_tickets`, `job_materials`, `quality_checks`, `job_cost_entries`, `job_cost_allocations`, `vendor_purchase_orders`, `vendor_purchase_order_lines`, `vendor_po_versions`, `vendor_acknowledgments`, `shipments`, `shipment_packages`, `shipment_events`, `delivery_confirmations`.
- PO seller context immutable at commitment, approval gates before provider send. Different lines can route to different external vendors and decorators. Job costs separated estimated/actual, editable corrections appended and audited.
**CRM, business, stores and later capability reservations**
- `opportunities`, `opportunity_activities`, `customer_credit_policies`, `campaigns`, `campaign_assets`, `consent_records`, `task_rules`, `notification_subscriptions`, `notification_deliveries`, `automation_rules`, `automation_runs`, `business_metric_snapshots`, `storefronts`, `storefront_memberships`, `storefront_catalog_rules`, `module_registry`, `module_dependencies`, `module_activation_evidence`.
- Coming Soon tables may be minimal (module registry + config) until enabled; **do not create false financial or operational tables solely for placeholder pages.**

## Entity invariants & indexes
1. Scope foreign keys must include `(tenant_id, workspace_id)` for workspace child refs, or equivalent composite unique parent index. Validate existence and scope server-side.
2. `UNIQUE (workspace_id, supplier_connection_id, external_product_key)` for supplier product keys; variant uniqueness within source product.
3. `UNIQUE (workspace_id, offering_id, variant_key)` canonical variants; optional GTIN not sole uniqueness criterion.
4. `UNIQUE (workspace_id, quote_id, version)` and `(workspace_id, creative_project_id, revision)`.
5. `UNIQUE (workspace_id, provider_connection_id, provider_event_id)` for webhook event inbox; unique `(workspace_id,operation,idempotency_key)` for commands.
6. Append-only `audit_events`, `document_versions`, issued `quote_revisions`, approved `proof_versions`, accepted `order_snapshots`, `vendor_po_versions` after issuance.
7. Indexed common filters: tenant/workspace, state, timestamps, seller, category, supplier, source; GIN full text and trigram normalized names; index stock by observation freshness and part.
8. Soft archive ordinary data; retention/right-to-delete policies documented, and financial record holds respected.

## Authorization policy skeleton (illustration, not full executable migration)
```sql
-- Template only; replace helper implementation and add composite FKs, grants and tests.
CREATE TABLE app.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  title text NOT NULL,
  lifecycle text NOT NULL CHECK (lifecycle IN ('DRAFT','REVIEW','PUBLISHED','ARCHIVED')),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE app.catalog_items ENABLE ROW LEVEL SECURITY;
-- Do not grant direct browser access to 'app' schema without exact authorization review.
-- Public requests use a narrow, audited server projection, never SELECT *.
```
- With exposed Supabase tables use explicit grants + RLS; policies rely on `(select auth.uid())`, active memberships, workspace and capabilities, not user-editable metadata. Security-invoker views; default deny; separate service worker role with audited purpose. See https://supabase.com/docs/guides/database/postgres/row-level-security .
- Sensitive docs use storage authorization on every signed-URL issue, not pathname-only access.

## TypeScript domain contracts (illustrative compilable types)
```ts
export type UUID = string & { readonly __brand: 'uuid' };
export type Currency = 'USD' | 'CAD' | (string & {});
export type Money = { amountMinor: bigint; currency: Currency }; // Currency exponent handling centralized.
export type ProviderCapability = 'catalog.read'|'catalog.sync'|'price.read'|'inventory.read'|'order.draft'|'order.send'|'order.status'|'shipment.read';
export type ProviderSource = { provider: string; connectionId: UUID; capturedAt: string; sourceId: string; rights: 'PUBLIC_DISPLAY'|'PRIVATE_ONLY'|'UNCLEARED' };
export type SourceProduct = { externalProductId: string; manufacturer?: string; model?: string; title: string; source: ProviderSource; variants: SourceVariant[] };
export type SourceVariant = { externalPartId: string; gtin?: string; options: Record<string,string>; mediaRefs: string[] };
export type SupplierOffer = { sourceVariantId: UUID; canonicalVariantId?: UUID; supplierPartyId: UUID; moq: number; currency: Currency; tiers: { minQuantity: number; unitCostMinor: bigint; setupCostMinor?: bigint }[]; capturedAt: string };
export interface SupplierAdapter {
  readonly provider: string;
  capabilities(connectionId: UUID): Promise<ReadonlySet<ProviderCapability>>;
  listProducts(ctx: {connectionId:UUID; cursor?:string; limit:number}): Promise<{items:SourceProduct[];cursor?:string}>;
  getPrice(ctx: {connectionId:UUID;externalPartId:string;quantity:number;configuration:unknown}): Promise<SupplierOffer|null>;
  getAvailability(ctx: {connectionId:UUID;externalPartId:string}): Promise<{available:number|null;asOf:string}|null>;
  draftPurchaseOrder(ctx: {connectionId:UUID;purchaseOrderId:UUID}): Promise<{preview:unknown}>;
  submitPurchaseOrder?(ctx: {connectionId:UUID;purchaseOrderId:UUID;approvalToken:string;idempotencyKey:string}): Promise<{externalId:string}>;
}
export type ModuleState = 'ACTIVE'|'BETA'|'COMING_SOON'|'DISABLED';
export type ModuleDescriptor = {key:string; label:string;state:ModuleState;route:string;capabilities:string[];dependsOn:string[]};
export type DesignScene = {version:1;units:'mm';surfaces:{id:UUID;zoneId:UUID;elements:{id:UUID;kind:'image'|'vector'|'text';assetVersionId?:UUID;matrix:[number,number,number,number,number,number]}[]}[]};
```

## API commands and events
- `GET /api/v1/catalog/search?q=&category=&brand=&cursor=` public allowlist only; `GET /api/v1/catalog/products/:slug` public projection.
- `POST /api/v1/admin/catalog/imports` staged file/provider job; `GET /api/v1/admin/catalog/imports/:id/diff`; `POST /api/v1/admin/catalog/imports/:id/commit` with approval; `POST /api/v1/admin/catalog/bulk-preview` and `/bulk-apply` version checked and reversible where legally possible.
- `GET/PUT /api/v1/admin/products/:id`; `POST /api/v1/admin/products/:id/submit-review`; `POST /api/v1/admin/products/:id/publish` publish gate.
- `POST /api/v1/design/projects`, `POST /api/v1/design/projects/:id/versions` append immutable, `POST /api/v1/design/projects/:id/renders`, `POST /api/v1/proofs/:id/approve` authorized customer signer.
- `POST /api/v1/requests`, `POST /api/v1/quotes/:id/issue`, `POST /api/v1/quotes/revisions/:id/accept`, `POST /api/v1/orders/from-quote`, `POST /api/v1/jobs/:id/transition`, `POST /api/v1/purchasing/po/:id/approve`.
- `POST /api/v1/webhooks/:provider` validates signature, stores event ID, deduplicates, queues processing. Provider-specific configured public webhook route accepts only documented signed events.
- Every mutating command has `Idempotency-Key`, actor, `workspace_id` derived from auth, expected resource version and correlation ID. Return typed validation errors; no network request inside an unbounded DB transaction.
- Events: `catalog.import.staged`, `catalog.offer.updated`, `product.published`, `design.version.saved`, `proof.approved`, `quote.issued`, `order.accepted`, `payment.verified`, `job.created`, `purchase.authorized`, `shipment.updated`, `job.closed`. Outbox delivery at-least-once; consumers idempotent.

## State machines
`Product: DRAFT→REVIEW→PUBLISHED→ARCHIVED` (re-publish requires gates); `Quote: DRAFT→ISSUED→ACCEPTED|EXPIRED|DECLINED`, change issued quote by new revision; `Order: PENDING_APPROVAL→AWAITING_PAYMENT→AUTHORIZED→IN_FULFILLMENT→COMPLETE` with `CANCELLED` gated by stage; `Proof: DRAFT→SENT→APPROVED|REVISION_REQUESTED` immutable approved; `Job: READY→AWAITING_ART→AWAITING_PROOF→PURCHASING→IN_PRODUCTION→QC→SHIPPED→CLOSED` (per-line overrides and exceptions); `PO: DRAFT→REVIEW→AUTHORIZED→SENT→ACKNOWLEDGED→RECEIVED` with guard before SENT; `Module: COMING_SOON→BETA→ACTIVE` gated by evidence.

## Privacy/non-disclosure tests
Automated public API serialization must reject exact/private names/keys, supplier IDs, cost, markup, account numbers, credentials, supplier URLs and private metadata. Manufacturer customer-facing brand is separately whitelisted. Channel-specific provenance/image rights govern publishing.
