# Gap audit and work packages

Reviewed application source at `57c58603aadcac8d2258d587121be12331bed10a`. This is a source and business-rule audit, supplemented by three pure-function reproductions; it is not a penetration test or an exhaustive defect-discovery claim. Additional findings must join this backlog as acceptance runs uncover them. No application fix, database migration or deployment is performed by this planning work.

P0 means integrity, durability, authorization or release-gate work. P1 means required active V1 completeness. A later milestone does not reduce the priority of a release gate. Dependencies describe engineering prerequisites; an external activation gate may block hosted verification while local implementation continues.

Evidence files: [baseline](baseline.json), [reproductions](audit-reproductions.json), [event-name audit](event-contract-audit.json), [all-module/scenario coverage](COVERAGE_MATRIX.md).

## GAP-001: Repair traceability and preserve the controlling scope

Priority **P0** · Milestone **M0** · Status **COMPLETE_PLANNING_ONLY** · Modules: foundation, analytics, future.

Observed: The inventory has malformed command paths, a nonexistent future service/test, stale run labels and no E01-E25 mapping.

Code: [docs/module-inventory.json](../../docs/module-inventory.json), [docs/TRACEABILITY.md](../../docs/TRACEABILITY.md), [docs/acceptance-evidence.json](../../docs/acceptance-evidence.json).

Implementation:

- Correct source references without promoting acceptance
- Map all 205 inventory entries and 95 scenarios
- Separate source existence, observed test results and external verification

Close only when:

- All 20 modules, 86 screens, 99 commands and 95 scenarios map to work and a verification target
- Future commands remain required denials, not planned active implementations

Dependencies: None. Research: [R10](RESEARCH_DECISIONS.md#r10-postgresql-row-security), [R27](RESEARCH_DECISIONS.md#r27-wcag-22).

External activation gates: None for local synthetic implementation.

## GAP-002: Make the approved development database durable

Priority **P0** · Milestone **M1** · Status **OPEN** · Modules: foundation, commerce, creative, supplier.

Observed: Previews currently use container PostgreSQL; the Supabase connection remains disabled after SELF_SIGNED_CERT_IN_CHAIN. Product IDs and sessions can disappear on reseed.

Code: [packages/kernel/src/database-config.ts](../../packages/kernel/src/database-config.ts), [scripts/preview-runtime.ts](../../scripts/preview-runtime.ts), [infra/cloudflare/runtime.mjs](../../infra/cloudflare/runtime.mjs), [scripts/setup.ts](../../scripts/setup.ts).

Implementation:

- Install the approved CA with hostname verification and the restricted runtime role
- Run migrations through a separate migration identity
- Separate startup readiness from migrations/seeding and persist stable records across image changes

Close only when:

- Create a cart, design and CRM contact; restart the preview container and read the same IDs and hashes
- Connection failures produce a bounded health error without disabling TLS

Planned verification targets (not yet implemented by this plan): `tests/integration/persistent-preview.test.ts`.

Dependencies: GAP-001. Research: [R04](RESEARCH_DECISIONS.md#r04-supabase-postgres-ssl-enforcement), [R05](RESEARCH_DECISIONS.md#r05-cloudflare-containers-filesystem-lifecycle), [R09](RESEARCH_DECISIONS.md#r09-supabase-backup-coverage), [R30](RESEARCH_DECISIONS.md#r30-supabase-cli-v3-breaking-changes).

External activation gates: EXT-DB-CA.

## GAP-003: Persist and scan private artwork and derivatives

Priority **P0** · Milestone **M1** · Status **OPEN** · Modules: creative, foundation.

Observed: Originals and raster previews are local files; no independent malware scanner is configured, and file writes can outlive failed database transactions.

Code: [packages/creative/src/index.ts](../../packages/creative/src/index.ts), [packages/server/src/index.ts](../../packages/server/src/index.ts).

Implementation:

- Add an object-store interface with a dedicated private development bucket
- Track upload, quarantine, scan, derivative and retention states
- Garbage-collect orphan uploads and bind object hashes to scoped metadata

Close only when:

- Artwork survives container replacement and is denied to other buyers/workspaces
- Unscanned/failed-scan files cannot become production derivatives; restore verifies bytes and hashes

Planned verification targets (not yet implemented by this plan): `tests/integration/asset-storage.test.ts`.

Dependencies: GAP-005, GAP-006. Research: [R06](RESEARCH_DECISIONS.md#r06-cloudflare-r2-bucket-exposure), [R09](RESEARCH_DECISIONS.md#r09-supabase-backup-coverage), [R14](RESEARCH_DECISIONS.md#r14-owasp-file-upload-defenses).

External activation gates: EXT-STORAGE.

## GAP-004: Replace the local credential vault with a scoped managed broker

Priority **P0** · Milestone **M1** · Status **OPEN** · Modules: supplier, foundation.

Observed: Supplier secrets use a local AES-GCM file store with its key on the same temporary filesystem.

Code: [packages/providers/src/index.ts](../../packages/providers/src/index.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts).

Implementation:

- Keep the local implementation for tests only
- Implement server-only managed-vault resolution, replacement, revocation and rotation
- Preserve structured provider fields and masked metadata without browser retrieval

Close only when:

- No raw credentials in GET, logs, receipts, exports or client bundles
- Replaced credentials cannot be used and cross-scope resolution is denied; restore/rotation are exercised

Planned verification targets (not yet implemented by this plan): `tests/security/managed-vault.test.ts`.

Dependencies: GAP-005, GAP-006. Research: [R07](RESEARCH_DECISIONS.md#r07-supabase-vault), [R08](RESEARCH_DECISIONS.md#r08-cloudflare-secrets-store-access-control), [R13](RESEARCH_DECISIONS.md#r13-owasp-secrets-lifecycle).

External activation gates: EXT-STORAGE, EXT-SUPPLIER.

## GAP-005: Align action, role and resource authorization

Priority **P0** · Milestone **M1** · Status **OPEN** · Modules: foundation, marketing, stores, creative, supplier.

Observed: Authorization is mostly module-level; resource grants are explicitly unenforced. A manager is allowed by the marketing approval handler but rejected by central module authorization.

Code: [packages/kernel/src/index.ts](../../packages/kernel/src/index.ts), [packages/server/src/index.ts](../../packages/server/src/index.ts), [packages/foundation/src/index.ts](../../packages/foundation/src/index.ts), [packages/marketing/src/index.ts](../../packages/marketing/src/index.ts).

Implementation:

- Create a typed command/permission registry with deny-by-default resource rules
- Apply the same policy to API, service and UI affordances, including aliases
- Add scoped grant expiry/revocation and production session/recovery controls

Close only when:

- A role-by-action/resource matrix covers every command and denied side effects
- Manager campaign approval behaves consistently with policy; customer and cross-venture escalation attempts fail

Planned verification targets (not yet implemented by this plan): `tests/security/permission-matrix.test.ts`.

Dependencies: GAP-001. Research: [R10](RESEARCH_DECISIONS.md#r10-postgresql-row-security), [R28](RESEARCH_DECISIONS.md#r28-nist-digital-identity-revision-4).

External activation gates: None for local synthetic implementation.

## GAP-006: Constrain authoritative domain relationships and revisions

Priority **P0** · Milestone **M1** · Status **OPEN** · Modules: foundation, catalog, sales, orders, stores, finance.

Observed: Scoped foreign keys and immutable triggers exist, but many business relationships, quantities and money values remain unconstrained JSON; update revision checks are optional.

Code: [database/migrations/001_initial.sql](../../database/migrations/001_initial.sql), [database/migrations/003_domain_references.sql](../../database/migrations/003_domain_references.sql), [packages/kernel/src/index.ts](../../packages/kernel/src/index.ts).

Implementation:

- Promote critical business keys, relationships, numeric values and state constraints to typed columns incrementally
- Add uniqueness for source/variant, buyer budget, contact identity and provider references
- Require optimistic revisions and canonical command digests where editing can conflict

Close only when:

- Invalid cross-product or cross-aggregate links fail in the database
- Concurrent edits and duplicate/reordered commands cannot silently replace agreements or create duplicate obligations

Planned verification targets (not yet implemented by this plan): `tests/integration/domain-constraints.test.ts`.

Dependencies: GAP-001. Research: [R10](RESEARCH_DECISIONS.md#r10-postgresql-row-security), [R11](RESEARCH_DECISIONS.md#r11-postgresql-concurrency-control), [R12](RESEARCH_DECISIONS.md#r12-postgresql-exact-numeric-types).

External activation gates: None for local synthetic implementation.

## GAP-007: Unify emitted events and durable processing

Priority **P0** · Milestone **M1** · Status **OPEN** · Modules: workflow, sales, commerce, orders, fulfillment, supplier.

Observed: Emitters use request.submitted, quote.issued, quote.accepted, job.ready and shipment.dispatched, while several workflow subscriptions use different names. The worker has row locks but no durable lease contract or dedicated system identity.

Code: [packages/kernel/src/index.ts](../../packages/kernel/src/index.ts), [packages/workflows/src/index.ts](../../packages/workflows/src/index.ts), [apps/worker/src/tick.ts](../../apps/worker/src/tick.ts).

Implementation:

- Define a shared versioned event registry and payload schemas
- Propagate request correlation and origin actor
- Add bounded claims, lease recovery, backoff, dead letters and audited replay with a dedicated worker identity

Close only when:

- An actual customer command emits an event that triggers its matching published rule exactly once
- Kill a worker after claiming an event; recovery preserves safe effects and does not replay ambiguous external writes

Planned verification targets (not yet implemented by this plan): `tests/integration/emitted-events.test.ts`, `tests/integration/worker-recovery.test.ts`.

Dependencies: GAP-005, GAP-006. Research: [R11](RESEARCH_DECISIONS.md#r11-postgresql-concurrency-control), [R21](RESEARCH_DECISIONS.md#r21-stripe-webhook-delivery-semantics), [R22](RESEARCH_DECISIONS.md#r22-quickbooks-webhook-recovery).

External activation gates: None for local synthetic implementation.

## GAP-008: Repair preview navigation and actionable failure states

Priority **P0** · Milestone **M1** · Status **OPEN** · Modules: foundation, commerce, today.

Observed: Commerce OS Open storefront points at localhost. Generic controls and status labels do not establish all contracted views or role affordances.

Code: [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [infra/cloudflare/gateway.mjs](../../infra/cloudflare/gateway.mjs).

Implementation:

- Resolve cross-app links from validated environment origins
- Show permission-aware actions and human-readable remediation
- Preserve form drafts and provide loading, stale, empty, conflict and retry states

Close only when:

- Every cross-app link opens the correct HTTPS preview
- A denied or expired session preserves user work and exposes the next safe action

Planned verification targets (not yet implemented by this plan): `tests/e2e/navigation-errors.spec.ts`.

Dependencies: GAP-005. Research: [R27](RESEARCH_DECISIONS.md#r27-wcag-22).

External activation gates: None for local synthetic implementation.

## GAP-009: Bind every design and proof to its exact product variant

Priority **P0** · Milestone **M1** · Status **OPEN** · Modules: creative, configuration, commerce, sales.

Observed: The designer does not rebind an existing project when color changes; proof lookup falls back to a non-unique document hash, and cart validation only checks that a design version exists.

Code: [apps/shop/components/designer.tsx](../../apps/shop/components/designer.tsx), [apps/shop/components/account.tsx](../../apps/shop/components/account.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/creative/src/index.ts](../../packages/creative/src/index.ts), [packages/sales/src/index.ts](../../packages/sales/src/index.ts).

Implementation:

- Store an immutable product/variant/method/zone specification snapshot on each version
- Restore the saved variant and start/rebind a variant-specific project safely
- Resolve proofs by exact version and specification, and validate line ownership and compatibility
- Preserve order-bound historical evidence; use explicit change-order holds and reapproval for intended order changes

Close only when:

- Save Clay, switch to Midnight, save and reload: each proof and cart line retains its own color
- Identical text on two products never loads or approves the other product proof
- Draft editing cannot rewrite accepted artwork; an intended order change records a hold and accepted amendment

Planned verification targets (not yet implemented by this plan): `tests/integration/design-binding.test.ts`, `tests/e2e/design-revisions.spec.ts`.

Dependencies: GAP-005, GAP-006. Research: [R19](RESEARCH_DECISIONS.md#r19-ghent-workgroup-printing-pdf-guidance), [R20](RESEARCH_DECISIONS.md#r20-ghent-workgroup-signdisplay-profile).

External activation gates: None for local synthetic implementation.

## GAP-010: Correct precision, pricing policy and source eligibility

Priority **P0** · Milestone **M1** · Status **OPEN** · Modules: estimating, sales, catalog, supplier, finance.

Observed: tierCost rounds unit prices to two decimals before extension; a 0.0250 unit cost for 1,000 becomes 30.00 instead of 25.00. costLine excludes only DISABLED offers, so ROLLED_BACK offers are not excluded. Margin floors are hard-coded rather than bound to configured policy.

Code: [packages/pricing/src/index.ts](../../packages/pricing/src/index.ts), [packages/sales/src/index.ts](../../packages/sales/src/index.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts).

Implementation:

- Retain four-place supplier unit precision through extension and round totals deliberately
- Select explicit eligible source/variant/service evidence and reject rolled-back/stale sources
- Apply versioned policy, component completeness and exact residual allocation

Close only when:

- Tier, quantity and rounding boundary tests reproduce and close the 25-versus-30 defect
- A newer rolled-back offer is never chosen; configured floors and unknown costs cannot be bypassed

Planned verification targets (not yet implemented by this plan): `tests/integration/pricing-evidence.test.ts`.

Dependencies: GAP-006. Research: [R01](RESEARCH_DECISIONS.md#r01-ss-promostandards-service-directory), [R11](RESEARCH_DECISIONS.md#r11-postgresql-concurrency-control), [R12](RESEARCH_DECISIONS.md#r12-postgresql-exact-numeric-types).

External activation gates: None for local synthetic implementation.

## GAP-011: Enforce store policies through the real cart and order lifecycle

Priority **P0** · Milestone **M2** · Status **OPEN** · Modules: stores, commerce, sales, finance.

Observed: Store checks exist as standalone commands, but safeLines drops storeId and brandKitId. Cart/RFQ/quote acceptance do not enforce the program; budget reservations are not tied to spend/release/cancel transitions.

Code: [packages/stores/src/index.ts](../../packages/stores/src/index.ts), [packages/sales/src/index.ts](../../packages/sales/src/index.ts), [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts), [apps/shop/components/programs.tsx](../../apps/shop/components/programs.tsx).

Implementation:

- Preserve and validate program references on every line
- Calculate budget commitments from authoritative reviewed prices, not a buyer-entered amount
- Implement approval, reserve, capture, release, redemption and fundraiser-reference transitions with locks
- Bind approval to the recorded policy/quote/amount revision and return existing receipts before reevaluating a duplicate reservation

Close only when:

- Calling cart/RFQ APIs directly cannot bypass membership, assignment, deadline, brand, seller or budget
- Two concurrent accepted quotes cannot overspend; retry and cancellation restore the correct reservation once

Planned verification targets (not yet implemented by this plan): `tests/integration/store-commerce.test.ts`, `tests/e2e/store-programs.spec.ts`.

Dependencies: GAP-005, GAP-006, GAP-010. Research: [R10](RESEARCH_DECISIONS.md#r10-postgresql-row-security), [R11](RESEARCH_DECISIONS.md#r11-postgresql-concurrency-control).

External activation gates: EXT-FINANCE.

## GAP-012: Carry kit identity and packing costs into the agreement

Priority **P0** · Milestone **M2** · Status **OPEN** · Modules: byob, commerce, sales, orders, fulfillment.

Observed: The bundle calculator records packaging and assembly separately, but the storefront flattens a saved kit into ordinary product cart lines and loses the kit configuration and operations.

Code: [packages/byob/src/index.ts](../../packages/byob/src/index.ts), [apps/shop/components/programs.tsx](../../apps/shop/components/programs.tsx), [packages/sales/src/index.ts](../../packages/sales/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts).

Implementation:

- Persist a kit line plus immutable component/variant/quantity selections
- Price packaging, assembly and multi-source freight in the quote
- Decompose component requirements and a separate kitting operation from the same snapshot

Close only when:

- A saved kit reaches quote/order/jobs with unchanged component ratios and packing/assembly costs
- Missing required components, wrong variants and component MOQ/availability changes block commitment

Planned verification targets (not yet implemented by this plan): `tests/integration/bundle-commerce.test.ts`, `tests/e2e/bundle-to-order.spec.ts`.

Dependencies: GAP-006, GAP-010, GAP-017. Research: [R18](RESEARCH_DECISIONS.md#r18-cip4-job-and-process-separation), [R25](RESEARCH_DECISIONS.md#r25-printful-variant-and-artwork-api).

External activation gates: None for local synthetic implementation.

## GAP-013: Complete issued agreement, seller, credit and expiry logic

Priority **P0** · Milestone **M2** · Status **OPEN** · Modules: sales, commerce, estimating, finance, stores.

Observed: Immutable revisions exist, but draft quote edits do not synchronize quote_lines, seller selection uses the first legal entity, and credit exposure is checked at issuance rather than reserved at concurrent acceptance. Decline/expiry/cancel and tax evidence need complete workflows.

Code: [packages/sales/src/index.ts](../../packages/sales/src/index.ts), [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts), [packages/finance/src/index.ts](../../packages/finance/src/index.ts).

Implementation:

- Resolve seller and venture explicitly and keep draft/revision/line projections consistent
- Bind pricing, configuration, artwork and tax/freight assumptions to the issued revision
- Add decline/expiry/revision flows and atomic credit/prepay commitment checks
- Allow eligible sandbox checkout only with verified exact route, artwork, stock, freight and tax evidence; default to Request Quote

Close only when:

- Two simultaneous acceptances cannot exceed a credit limit
- An expired or mismatched revision cannot be accepted; changing the seller later leaves old agreements intact; unknown tax does not become a false settled charge

Planned verification targets (not yet implemented by this plan): `tests/integration/quote-agreement.test.ts`, `tests/e2e/quote-acceptance.spec.ts`.

Dependencies: GAP-009, GAP-010, GAP-011, GAP-032. Research: [R11](RESEARCH_DECISIONS.md#r11-postgresql-concurrency-control), [R12](RESEARCH_DECISIONS.md#r12-postgresql-exact-numeric-types), [R21](RESEARCH_DECISIONS.md#r21-stripe-webhook-delivery-semantics).

External activation gates: EXT-FINANCE, EXT-LEGAL.

## GAP-014: Unify canonical identity and source ownership

Priority **P1** · Milestone **M2** · Status **OPEN** · Modules: catalog, supplier.

Observed: A catalog identity helper requires brand, while import matching uses a separate SQL path that can match an empty brand. GTIN checks are mostly format checks; source-to-product linking and field ownership are incomplete.

Code: [packages/catalog/src/index.ts](../../packages/catalog/src/index.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts).

Implementation:

- Use one verified identity resolver across imports and adapters
- Separate supplier product and part IDs from canonical variant IDs
- Add reviewed merge/split, curated-field ownership and provenance for every changed field

Close only when:

- One manufacturer model across three suppliers becomes one product with three distinct private offers
- Empty/ambiguous brand or mismatched color/size never auto-merges; split/merge retains source lineage

Planned verification targets (not yet implemented by this plan): `tests/integration/canonical-sources.test.ts`.

Dependencies: GAP-006. Research: [R01](RESEARCH_DECISIONS.md#r01-ss-promostandards-service-directory), [R29](RESEARCH_DECISIONS.md#r29-gs1-gtin-validation-guidance).

External activation gates: None for local synthetic implementation.

## GAP-015: Finish streaming import mapping, review and reversible changes

Priority **P1** · Milestone **M2** · Status **OPEN** · Modules: supplier, catalog.

Observed: CSV parsing is bounded, but the whole upload is buffered; XML only accepts flat product rows. Import rollback tracks created records but not all before-images of updated records.

Code: [packages/supplier/src/imports.ts](../../packages/supplier/src/imports.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts), [apps/os/components/integrations.tsx](../../apps/os/components/integrations.tsx).

Implementation:

- Add private multipart staging, encoding checks and bounded streaming parsing
- Support approved nested/namespace-aware XML selectors with inferred mapping previews
- Store full row diffs, field overrides, resumable chunks and conflict-aware rollback manifests

Close only when:

- A 10,000-variant import stages, reviews and commits without auto-publication or leaked raw data
- Reject entity/DTD/depth attacks; rollback restores changed values without overwriting later human edits

Planned verification targets (not yet implemented by this plan): `tests/integration/import-recovery.test.ts`, `tests/e2e/xml-mapping.spec.ts`.

Dependencies: GAP-004, GAP-006, GAP-014. Research: [R14](RESEARCH_DECISIONS.md#r14-owasp-file-upload-defenses), [R15](RESEARCH_DECISIONS.md#r15-owasp-ssrf-defenses), [R16](RESEARCH_DECISIONS.md#r16-owasp-xml-entity-controls), [R17](RESEARCH_DECISIONS.md#r17-owasp-spreadsheet-formula-injection).

External activation gates: None for local synthetic implementation.

## GAP-016: Create licensed media and publication projections

Priority **P1** · Milestone **M2** · Status **OPEN** · Modules: catalog, supplier, creative, commerce.

Observed: Cap imagery is corrected, but other synthetic families use generic category drawings; imported external image URLs are not an approved local derivative pipeline.

Code: [packages/catalog/src/index.ts](../../packages/catalog/src/index.ts), [packages/providers/src/index.ts](../../packages/providers/src/index.ts), [scripts/seed-illustration.ts](../../scripts/seed-illustration.ts).

Implementation:

- Ingest permitted media to private originals and approved public derivatives
- Bind exact color, view, source rights and expiry to each image
- Compute publication eligibility independently of sync success and preserve the prior safe revision

Close only when:

- A nontechnical administrator can map and publish a licensed exact-variant image
- Unlicensed, wrong-color or stale media cannot silently become the public image; failed sync retains the last safe publication

Planned verification targets (not yet implemented by this plan): `tests/integration/media-publication.test.ts`.

Dependencies: GAP-003, GAP-014. Research: [R01](RESEARCH_DECISIONS.md#r01-ss-promostandards-service-directory), [R15](RESEARCH_DECISIONS.md#r15-owasp-ssrf-defenses), [R25](RESEARCH_DECISIONS.md#r25-printful-variant-and-artwork-api).

External activation gates: EXT-LEGAL.

## GAP-017: Join configuration families, options and actual imprint zones

Priority **P1** · Milestone **M2** · Status **OPEN** · Modules: configuration, catalog, creative, commerce.

Observed: Rules and zones can be saved, but zones are not bound to exact variant/method/view validation; configure can accept a supplied template rather than resolving the authoritative product assignment.

Code: [packages/configuration/src/index.ts](../../packages/configuration/src/index.ts), [apps/os/components/studio.tsx](../../apps/os/components/studio.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx).

Implementation:

- Persist typed option groups, values, method/variant compatibility and versioned zones
- Resolve effective templates server-side and share deterministic guidance with the UI
- Validate lead times, MOQ and dimensions against the same immutable configuration

Close only when:

- Direct API calls cannot select a different template to bypass the assigned constraints
- Invalid method/location/size combinations are visibly disabled and rejected; 100-product assignments have preview and safe revert

Planned verification targets (not yet implemented by this plan): `tests/integration/configuration-authority.test.ts`, `tests/e2e/configuration-matrix.spec.ts`.

Dependencies: GAP-006, GAP-014. Research: [R01](RESEARCH_DECISIONS.md#r01-ss-promostandards-service-directory), [R19](RESEARCH_DECISIONS.md#r19-ghent-workgroup-printing-pdf-guidance), [R20](RESEARCH_DECISIONS.md#r20-ghent-workgroup-signdisplay-profile).

External activation gates: None for local synthetic implementation.

## GAP-018: Implement audited method-specific production review

Priority **P0** · Milestone **M3** · Status **OPEN** · Modules: creative, configuration, orders, procurement.

Observed: preflightDesign always returns BLOCKED and release_production_asset always fails; decorated production cannot complete through supported user commands.

Code: [packages/creative/src/index.ts](../../packages/creative/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts), [apps/os/components/studio.tsx](../../apps/os/components/studio.tsx).

Implementation:

- Add versioned provider/method profiles and checks against actual files and zones
- Add an authorized manual prepress review of a scanned, immutable production derivative with evidence and reason
- Preserve separate visual approval and production release; automated digitization/3D/PDF-X automation remain deferred where specified

Close only when:

- A synthetic reviewed print derivative completes the decorated order route through public application commands
- Missing fonts/profile/bleed/stitch evidence or changed variant/file blocks production and supplier dispatch; no client boolean can forge a pass

Planned verification targets (not yet implemented by this plan): `tests/integration/prepress-release.test.ts`, `tests/e2e/decorated-order.spec.ts`.

Dependencies: GAP-003, GAP-009, GAP-017. Research: [R14](RESEARCH_DECISIONS.md#r14-owasp-file-upload-defenses), [R18](RESEARCH_DECISIONS.md#r18-cip4-job-and-process-separation), [R19](RESEARCH_DECISIONS.md#r19-ghent-workgroup-printing-pdf-guidance), [R20](RESEARCH_DECISIONS.md#r20-ghent-workgroup-signdisplay-profile).

External activation gates: EXT-LEGAL, EXT-SUPPLIER.

## GAP-019: Finish shared editor, brand-kit and batch rendering behavior

Priority **P1** · Milestone **M3** · Status **OPEN** · Modules: creative, catalog, configuration.

Observed: Designer, account proof and worker renderer use different placement geometry; batch renders use a generic rounded rectangle rather than the product image. Brand-kit and layer editing are limited.

Code: [packages/creative/src/index.ts](../../packages/creative/src/index.ts), [apps/shop/components/designer.tsx](../../apps/shop/components/designer.tsx), [apps/os/components/studio.tsx](../../apps/os/components/studio.tsx).

Implementation:

- Share one versioned scene/placement model and renderer
- Support the active 2D layer, brand-kit, version history and batch review operations
- Add queue progress, partial failures, cancellation and exact product/variant derivatives

Close only when:

- Designer, saved proof and batch output place the same artwork in the same product zone
- 500 queued jobs retain exact variant/version identity and expose failures without declaring production readiness

Planned verification targets (not yet implemented by this plan): `tests/integration/render-consistency.test.ts`, `tests/e2e/creative-operations.spec.ts`.

Dependencies: GAP-003, GAP-009, GAP-016, GAP-017. Research: [R14](RESEARCH_DECISIONS.md#r14-owasp-file-upload-defenses), [R19](RESEARCH_DECISIONS.md#r19-ghent-workgroup-printing-pdf-guidance), [R20](RESEARCH_DECISIONS.md#r20-ghent-workgroup-signdisplay-profile).

External activation gates: None for local synthetic implementation.

## GAP-020: Implement the provider SDK and reviewed PromoStandards profiles

Priority **P1** · Milestone **M3** · Status **OPEN** · Modules: supplier, procurement, fulfillment, finance.

Observed: Only one bundled Product Data v1 fixture adapter exists. Admin connection tests are simulated; media, inventory, pricing, PO, status, ASN and invoice native operations are not implemented and wired.

Code: [packages/providers/src/index.ts](../../packages/providers/src/index.ts), [packages/providers/profiles/promostandards-product-v1.wsdl](../../packages/providers/profiles/promostandards-product-v1.wsdl), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts).

Implementation:

- Implement the shared adapter SDK with typed errors, pagination, rate limits and independent operations
- Register approved supplier WSDL/XSD profiles and exact service versions
- Join product, part, location, FOB, charge and currency evidence without assuming universal schemas

Close only when:

- Each supported operation passes its own positive/negative fixture contract and preserves redacted correlation evidence
- An authorized read-only sandbox test is recorded before its capability can become SANDBOX_VERIFIED; writes require separate authorization

Planned verification targets (not yet implemented by this plan): `tests/contracts/promostandards-services.test.ts`.

Dependencies: GAP-004, GAP-005, GAP-006. Research: [R01](RESEARCH_DECISIONS.md#r01-ss-promostandards-service-directory), [R15](RESEARCH_DECISIONS.md#r15-owasp-ssrf-defenses), [R16](RESEARCH_DECISIONS.md#r16-owasp-xml-entity-controls).

External activation gates: EXT-SUPPLIER.

## GAP-021: Complete the nontechnical integration setup wizard

Priority **P1** · Milestone **M3** · Status **OPEN** · Modules: supplier, catalog, estimating.

Observed: Provider cards, mapping, price policy and mock diagnostics exist, but supported API setup is incomplete without per-service profiles, structured credential forms and end-to-end sample checks.

Code: [apps/os/components/integrations.tsx](../../apps/os/components/integrations.tsx), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts).

Implementation:

- Deliver all nine controlling wizard steps with provider-specific fields
- Show per-operation readiness, mapping, effective prices, freshness and safe remediation
- Configure known supported supplier accounts without source edits; unsupported proprietary protocols remain explicit adapter work

Close only when:

- A fresh administrator configures a supported supplier, rotates a secret, maps variants, changes pricing, previews and publishes eligible products without source edits
- Wrong auth, unsupported schema, rate limit or stale cost produces a specific next action and no false success

Planned verification targets (not yet implemented by this plan): `tests/e2e/integration-onboarding.spec.ts`.

Dependencies: GAP-005, GAP-010, GAP-015, GAP-020. Research: [R01](RESEARCH_DECISIONS.md#r01-ss-promostandards-service-directory), [R02](RESEARCH_DECISIONS.md#r02-asi-developer-api-families), [R03](RESEARCH_DECISIONS.md#r03-asi-smartlink-product-description), [R13](RESEARCH_DECISIONS.md#r13-owasp-secrets-lifecycle).

External activation gates: EXT-SUPPLIER, EXT-ASI.

## GAP-022: Honor independent synchronization and freshness policies

Priority **P1** · Milestone **M3** · Status **OPEN** · Modules: supplier, catalog, analytics, workflow.

Observed: The UI stores separate schedules, but the worker advances only a catalog interval and sync_now records a synthetic result without updating service-specific evidence.

Code: [apps/worker/src/tick.ts](../../apps/worker/src/tick.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts), [packages/analytics/src/index.ts](../../packages/analytics/src/index.ts).

Implementation:

- Schedule product/media, price, inventory and status jobs independently
- Add cursors, checkpoints, contract-aware throttles and freshness windows
- Keep merge reviews and publication independent of upstream refresh

Close only when:

- Advancing a test clock triggers only the due service and does not overrun rate limits
- A failed inventory/price refresh marks only affected evidence stale while preserving approved public data

Planned verification targets (not yet implemented by this plan): `tests/integration/service-scheduler.test.ts`.

Dependencies: GAP-007, GAP-014, GAP-020. Research: [R01](RESEARCH_DECISIONS.md#r01-ss-promostandards-service-directory), [R11](RESEARCH_DECISIONS.md#r11-postgresql-concurrency-control).

External activation gates: EXT-SUPPLIER.

## GAP-023: Complete licensed ASI SmartLink and separate ESP interfaces

Priority **P1** · Milestone **M3** · Status **OPEN** · Modules: supplier, catalog.

Observed: ASI currently exposes activation requirements and BLOCKED capabilities; no account-authorized SmartLink client exists.

Code: [packages/providers/src/index.ts](../../packages/providers/src/index.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts), [apps/os/components/integrations.tsx](../../apps/os/components/integrations.tsx).

Implementation:

- Obtain entitled account documentation and explicit catalog/image terms
- Build the authorized search/detail adapter and its mapping, rate and retention rules
- Keep ESP Updates and Connect distinct, with only approved requested operations available

Close only when:

- Without entitlement, the interface stays accurately blocked and never sends an ESP+ UI password
- With authorized sandbox credentials and schema, independently verify supported search/detail operations and licensed projection

Planned verification targets (not yet implemented by this plan): `tests/contracts/asi-smartlink.test.ts`.

Dependencies: GAP-020, GAP-021. Research: [R02](RESEARCH_DECISIONS.md#r02-asi-developer-api-families), [R03](RESEARCH_DECISIONS.md#r03-asi-smartlink-product-description).

External activation gates: EXT-ASI, EXT-LEGAL.

## GAP-024: Finish multi-source MIS routing and operation execution

Priority **P1** · Milestone **M4** · Status **OPEN** · Modules: orders, configuration, creative, procurement, fulfillment.

Observed: Current allocation creates one job per order line and a fixed operation list. Operations, resources, production events and QC are not a complete component/decorator route.

Code: [packages/orders/src/index.ts](../../packages/orders/src/index.ts), [packages/production/src/records.ts](../../packages/production/src/records.ts), [apps/os/components/actions.tsx](../../apps/os/components/actions.tsx).

Implementation:

- Create versioned fulfillment demands, source routes, materials and decorator operations
- Enforce readiness, dependency, time, quantity, waste and QC transitions
- Add blocked/rework/cancellation recovery without rewriting the agreement

Close only when:

- An embroidered cap, commercial print item and event kit create distinct source/decorator/kit operations and jobs
- Skipping required operations or QC, using stale approval, or changing a locked route is rejected and remediable

Planned verification targets (not yet implemented by this plan): `tests/integration/mis-routing.test.ts`, `tests/e2e/job-operations.spec.ts`.

Dependencies: GAP-012, GAP-013, GAP-017, GAP-018. Research: [R18](RESEARCH_DECISIONS.md#r18-cip4-job-and-process-separation), [R19](RESEARCH_DECISIONS.md#r19-ghent-workgroup-printing-pdf-guidance), [R20](RESEARCH_DECISIONS.md#r20-ghent-workgroup-signdisplay-profile).

External activation gates: None for local synthetic implementation.

## GAP-025: Authorize and reconcile POs at purchase-requirement level

Priority **P1** · Milestone **M4** · Status **OPEN** · Modules: procurement, orders, supplier.

Observed: One active PO per job prevents a blank supplier and decorator PO for the same job; approval authorizationHash is recorded but not verified on submission. External submission is mock only.

Code: [packages/procurement/src/index.ts](../../packages/procurement/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts).

Implementation:

- Source and purchase by requirement/operation, including blank and decorator suppliers
- Bind approval to exact payload, source, cost, route and artwork
- Persist provider write intent before sending; reconcile UNKNOWN_OUTCOME before any retry

Close only when:

- One job can have independently approved blank and decorator POs without duplicate requirements
- Mutating an approved payload invalidates authorization; timeout/crash/replay creates at most one simulated external purchase

Planned verification targets (not yet implemented by this plan): `tests/integration/purchase-authorization.test.ts`.

Dependencies: GAP-004, GAP-020, GAP-024. Research: [R01](RESEARCH_DECISIONS.md#r01-ss-promostandards-service-directory), [R11](RESEARCH_DECISIONS.md#r11-postgresql-concurrency-control), [R18](RESEARCH_DECISIONS.md#r18-cip4-job-and-process-separation).

External activation gates: EXT-SUPPLIER, EXT-FINANCE.

## GAP-026: Complete shipments, tracking, returns and remakes

Priority **P1** · Milestone **M4** · Status **OPEN** · Modules: fulfillment, orders, finance.

Observed: Partial shipment projection works, but returns/remakes only create requests and do not validate the full line/quantity lifecycle. Carrier labels and supplier events remain blocked/simulated.

Code: [packages/fulfillment/src/index.ts](../../packages/fulfillment/src/index.ts), [apps/shop/components/account.tsx](../../apps/shop/components/account.tsx).

Implementation:

- Add line-level return/remake authorization, quantities, receipt/QC and resolution
- Normalize monotonic provider tracking with late-event reconciliation
- Separate supplier tracking, own labels, cancellations and financial/budget adjustments

Close only when:

- Split shipments and returns conserve quantities across allocations
- Another order line cannot be returned; duplicate/late events and label retries create no extra shipment, purchase or refund

Planned verification targets (not yet implemented by this plan): `tests/integration/fulfillment-lifecycle.test.ts`, `tests/e2e/returns-remakes.spec.ts`.

Dependencies: GAP-024, GAP-025. Research: [R21](RESEARCH_DECISIONS.md#r21-stripe-webhook-delivery-semantics), [R24](RESEARCH_DECISIONS.md#r24-easypost-tracking-versus-label-purchase).

External activation gates: EXT-SUPPLIER, EXT-FINANCE.

## GAP-027: Reconcile finance references and complete direct-profit closeout

Priority **P1** · Milestone **M4** · Status **OPEN** · Modules: finance, estimating, sales, fulfillment, today.

Observed: References are mock-only; partial refunds, adjustments and reconciliation exceptions are incomplete. Actual-cost fallback keys can collapse distinct identical costs; closeout accepts manually supplied owner hours.

Code: [packages/finance/src/index.ts](../../packages/finance/src/index.ts), [packages/pricing/src/index.ts](../../packages/pricing/src/index.ts).

Implementation:

- Use explicit source document/line identities and correction entries
- Reconcile authorized/settled/failed/refunded provider amounts and currencies without treating OS as a ledger
- Close against complete actual-cost evidence and linked owner time, with unresolved discrepancies visible

Close only when:

- Distinct equal-value costs remain distinct while a replayed source document remains single
- Partial refund, credit, canceled PO and remake reconcile without double counting revenue, tax or direct cost; GL/payroll stay Coming Soon

Planned verification targets (not yet implemented by this plan): `tests/integration/finance-closeout.test.ts`.

Dependencies: GAP-010, GAP-013, GAP-026. Research: [R12](RESEARCH_DECISIONS.md#r12-postgresql-exact-numeric-types), [R21](RESEARCH_DECISIONS.md#r21-stripe-webhook-delivery-semantics), [R22](RESEARCH_DECISIONS.md#r22-quickbooks-webhook-recovery), [R23](RESEARCH_DECISIONS.md#r23-quickbooks-sandbox-credentials).

External activation gates: EXT-FINANCE, EXT-LEGAL.

## GAP-028: Complete CRM identity, relationships and follow-through

Priority **P1** · Milestone **M4** · Status **OPEN** · Modules: crm, sales, marketing.

Observed: Contact duplicate detection scans only 1,000 rows and is not a unique transactional key; account relationships and follow-ups have limited lifecycle/UI linkage.

Code: [packages/crm/src/index.ts](../../packages/crm/src/index.ts), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx).

Implementation:

- Constrain normalized identities and support reviewed merge without losing history/consent
- Add account/contact roles, activity timeline and owned follow-up state transitions
- Link lead, RFQ, quote and order records while keeping marketing permission separate

Close only when:

- Concurrent duplicate creation cannot split the same scoped contact
- Import/merge preserves provenance and opt-out; a follow-up opens its linked customer/quote and can be completed or rescheduled

Planned verification targets (not yet implemented by this plan): `tests/integration/crm-lifecycle.test.ts`, `tests/e2e/crm-pipeline.spec.ts`.

Dependencies: GAP-005, GAP-006, GAP-013. Research: [R10](RESEARCH_DECISIONS.md#r10-postgresql-row-security), [R11](RESEARCH_DECISIONS.md#r11-postgresql-concurrency-control), [R26](RESEARCH_DECISIONS.md#r26-ftc-commercial-email-guidance).

External activation gates: None for local synthetic implementation.

## GAP-029: Complete content revisions, audience rights and suppression

Priority **P1** · Milestone **M4** · Status **OPEN** · Modules: marketing, crm, workflow.

Observed: Marketing publishes a local preview only. Content editing/reapproval, segment logic, unsubscribe/suppression and durable attribution are incomplete; regex content checking is not a future HTML sanitization pipeline.

Code: [packages/marketing/src/index.ts](../../packages/marketing/src/index.ts), [apps/os/components/actions.tsx](../../apps/os/components/actions.tsx).

Implementation:

- Add immutable content revisions and approval invalidation on edits
- Model consent/withdrawal, suppression and recipient eligibility at send time
- Keep test sending blocked and implement a provider-neutral approved communication interface
- Add approved content-revision publication to the private preview CMS with sanitized structured content

Close only when:

- An edited approved campaign cannot publish its old approval; opted-out contacts are always excluded
- Test accounts produce no outbound mail; draft, review, rejection, scheduled preview and attribution are usable

Planned verification targets (not yet implemented by this plan): `tests/integration/marketing-consent.test.ts`, `tests/e2e/campaign-review.spec.ts`.

Dependencies: GAP-005, GAP-007, GAP-028. Research: [R14](RESEARCH_DECISIONS.md#r14-owasp-file-upload-defenses), [R26](RESEARCH_DECISIONS.md#r26-ftc-commercial-email-guidance).

External activation gates: EXT-COMMS, EXT-LEGAL.

## GAP-030: Calculate whole-dataset KPIs and honest exports

Priority **P1** · Milestone **M5** · Status **OPEN** · Modules: analytics, today, finance, supplier, crm.

Observed: Reports sum at most 1,000 fetched rows; Today also limits records without a whole-dataset aggregate. Saved report columns are not a complete scoped report builder.

Code: [packages/analytics/src/index.ts](../../packages/analytics/src/index.ts), [packages/today/src/index.ts](../../packages/today/src/index.ts).

Implementation:

- Use indexed scoped SQL aggregates with explicit periods, currency and metric definitions
- Build drill-down reports, waiting/SLA queues and data-quality remediation
- Use one hardened paged/streamed export path and saved view schema

Close only when:

- Adding the 1,001st matching record changes the correct total and drill-down count
- CSV/export privacy and formula controls match the displayed scope; owner-time and profit metrics reconcile to authoritative records

Planned verification targets (not yet implemented by this plan): `tests/integration/report-aggregation.test.ts`, `tests/e2e/reports-dashboard.spec.ts`.

Dependencies: GAP-022, GAP-024, GAP-027, GAP-028, GAP-033. Research: [R12](RESEARCH_DECISIONS.md#r12-postgresql-exact-numeric-types), [R17](RESEARCH_DECISIONS.md#r17-owasp-spreadsheet-formula-injection).

External activation gates: None for local synthetic implementation.

## GAP-031: Finish versioned automation, approval and replay UX

Priority **P1** · Milestone **M5** · Status **OPEN** · Modules: workflow, today, marketing, supplier, sales.

Observed: Typed AST and local safe effects exist, but real event wiring is incomplete, definitions are stored in automation_runs, and dependencies/maxDepth are not a complete runtime execution contract.

Code: [packages/workflows/src/index.ts](../../packages/workflows/src/index.ts), [packages/workflows/src/rules.ts](../../packages/workflows/src/rules.ts), [apps/worker/src/tick.ts](../../apps/worker/src/tick.ts), [apps/os/components/actions.tsx](../../apps/os/components/actions.tsx).

Implementation:

- Add immutable rule revisions, effective dates, fixtures and traceable execution context
- Enforce cycles, depth, throttles, human approvals and bounded escalation
- Add operator simulation, disable, inspect, retry and dead-letter recovery

Close only when:

- Publishing requires the exact tested definition and replay does not duplicate an effect
- A real missed-supplier-date or approved-proof event produces the intended safe task/exception and cannot authorize spend or external sends

Planned verification targets (not yet implemented by this plan): `tests/integration/automation-runtime.test.ts`, `tests/e2e/automation-recovery.spec.ts`.

Dependencies: GAP-007, GAP-024, GAP-027, GAP-029. Research: [R11](RESEARCH_DECISIONS.md#r11-postgresql-concurrency-control), [R21](RESEARCH_DECISIONS.md#r21-stripe-webhook-delivery-semantics), [R22](RESEARCH_DECISIONS.md#r22-quickbooks-webhook-recovery).

External activation gates: None for local synthetic implementation.

## GAP-032: Complete governance and legal seller assignments

Priority **P1** · Milestone **M2** · Status **OPEN** · Modules: foundation, sales, stores.

Observed: Role editing and legal entities exist, but invitations/revocation, venture assignments, effective grants and evidence-backed module activation are incomplete.

Code: [packages/foundation/src/index.ts](../../packages/foundation/src/index.ts), [packages/server/src/auth.ts](../../packages/server/src/auth.ts), [packages/contracts/src/index.ts](../../packages/contracts/src/index.ts).

Implementation:

- Add scoped membership lifecycle and explicit seller/venture/channel assignments
- Keep owner recovery and last-owner protection
- Validate module enablement against accepted capabilities and leave future actions denied

Close only when:

- Changing a future seller assignment leaves issued agreements unchanged
- Revoked membership cannot act; no module flag activates unimplemented transactions or bypasses acceptance gates

Planned verification targets (not yet implemented by this plan): `tests/integration/governance.test.ts`.

Dependencies: GAP-005, GAP-006. Research: [R10](RESEARCH_DECISIONS.md#r10-postgresql-row-security), [R28](RESEARCH_DECISIONS.md#r28-nist-digital-identity-revision-4).

External activation gates: EXT-LEGAL, EXT-GIT.

## GAP-033: Replace capped snapshots with paginated query APIs

Priority **P1** · Milestone **M2** · Status **OPEN** · Modules: catalog, commerce, analytics, foundation.

Observed: Server list limits are 200/1,000 while both interfaces paginate/filter already-fetched data. The storefront cannot search a 100k-variant catalog reliably.

Code: [packages/kernel/src/index.ts](../../packages/kernel/src/index.ts), [packages/server/src/index.ts](../../packages/server/src/index.ts), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx).

Implementation:

- Add cursor-based scoped listing/search/facets with whitelisted sort/filter fields
- Index canonical product, variant, source, date and status keys
- Persist shareable customer filters and stable product routing; handle retired/changed product references explicitly

Close only when:

- Search finds a product beyond the first 1,000 variants with stable next/previous cursors
- Filters survive URL reload and no public search document leaks private source data

Planned verification targets (not yet implemented by this plan): `tests/integration/query-pagination.test.ts`, `tests/e2e/catalog-search.spec.ts`.

Dependencies: GAP-006, GAP-014. Research: [R10](RESEARCH_DECISIONS.md#r10-postgresql-row-security), [R11](RESEARCH_DECISIONS.md#r11-postgresql-concurrency-control).

External activation gates: None for local synthetic implementation.

## GAP-034: Close security, confidentiality and migration gates

Priority **P0** · Milestone **M6** · Status **OPEN** · Modules: foundation, supplier, creative, commerce, finance.

Observed: RLS/immutable-record tests exist, but all-resource role coverage, public-surface leak checks and SCA/SAST/secret scanning are not established by the 139-test baseline.

Code: [tests/security/isolation.test.ts](../../tests/security/isolation.test.ts), [database/migrations/001_initial.sql](../../database/migrations/001_initial.sql), [packages/server/src/index.ts](../../packages/server/src/index.ts), [.github/workflows/ci.yml](../../.github/workflows/ci.yml).

Implementation:

- Add command/resource/column confidentiality tests across APIs, HTML, SEO, images, logs, CSV and generated documents
- Harden webhook ingress, uploads and endpoint aliases
- Add dependency, static, secret and migration checks with reviewed exceptions

Close only when:

- Every critical command has unauthorized, cross-scope, stale revision, duplicate and rollback tests
- No unwaived critical/high security finding; staging runs with the actual restricted identities and no production credentials

Planned verification targets (not yet implemented by this plan): `tests/security/public-surfaces.test.ts`, `tests/security/command-matrix.test.ts`.

Dependencies: GAP-002, GAP-003, GAP-004, GAP-005, GAP-007, GAP-013, GAP-023, GAP-025, GAP-026, GAP-029, GAP-033. Research: [R10](RESEARCH_DECISIONS.md#r10-postgresql-row-security), [R13](RESEARCH_DECISIONS.md#r13-owasp-secrets-lifecycle), [R14](RESEARCH_DECISIONS.md#r14-owasp-file-upload-defenses), [R15](RESEARCH_DECISIONS.md#r15-owasp-ssrf-defenses), [R16](RESEARCH_DECISIONS.md#r16-owasp-xml-entity-controls), [R17](RESEARCH_DECISIONS.md#r17-owasp-spreadsheet-formula-injection), [R28](RESEARCH_DECISIONS.md#r28-nist-digital-identity-revision-4).

External activation gates: None for local synthetic implementation.

## GAP-035: Make observability and recovery operational

Priority **P0** · Milestone **M1** · Status **OPEN** · Modules: foundation, analytics, workflow, supplier.

Observed: A local synthetic database restore passed, but combined hosted database/object/vault restore, actionable alerts, incident runbooks and durable diagnostics remain unverified.

Code: [packages/kernel/src/backup.ts](../../packages/kernel/src/backup.ts), [packages/kernel/src/index.ts](../../packages/kernel/src/index.ts), [infra/cloudflare/runtime.mjs](../../infra/cloudflare/runtime.mjs), [apps/worker/src/tick.ts](../../apps/worker/src/tick.ts).

Implementation:

- Propagate correlation IDs and redacted typed failure causes
- Monitor freshness, queue leases, ambiguous POs, failed scans and reconciliation
- Exercise isolated database/object/secret restoration and a safe preview rollback

Close only when:

- A fault can be traced from browser command to transaction, worker and provider fixture
- Restore into a separate development target verifies IDs, hashes, scopes, object bytes and role access within documented recovery objectives

Planned verification targets (not yet implemented by this plan): `tests/integration/combined-restore.test.ts`.

Dependencies: GAP-002, GAP-003, GAP-007. Research: [R04](RESEARCH_DECISIONS.md#r04-supabase-postgres-ssl-enforcement), [R05](RESEARCH_DECISIONS.md#r05-cloudflare-containers-filesystem-lifecycle), [R09](RESEARCH_DECISIONS.md#r09-supabase-backup-coverage), [R13](RESEARCH_DECISIONS.md#r13-owasp-secrets-lifecycle).

External activation gates: EXT-STORAGE, EXT-DEPLOY.

## GAP-036: Implement supported POD, shipping and accounting adapters

Priority **P1** · Milestone **M4** · Status **OPEN** · Modules: supplier, fulfillment, finance, procurement, catalog.

Observed: Provider registry entries currently expose simulators or activation blocks rather than complete selected-provider clients.

Code: [packages/providers/src/index.ts](../../packages/providers/src/index.ts), [packages/finance/src/index.ts](../../packages/finance/src/index.ts), [packages/fulfillment/src/index.ts](../../packages/fulfillment/src/index.ts).

Implementation:

- Implement versioned provider-neutral contracts and selected reviewed adapter profiles
- Add OAuth/refresh, signatures, pagination, recovery and sandbox-specific routing as applicable
- Keep quote-only/manual fallback for unsupported or disconnected services
- Resolve callback tenant/connection from registered authority, never the demo tenant or untrusted payload; keep administrative Access protection separate

Close only when:

- Mocks cover the exact supported operations and negative cases without external effects
- Authorized sandbox tests verify each operation separately; disconnected services never show Paid, label purchased or order transmitted

Planned verification targets (not yet implemented by this plan): `tests/contracts/business-adapters.test.ts`.

Dependencies: GAP-020. Research: [R21](RESEARCH_DECISIONS.md#r21-stripe-webhook-delivery-semantics), [R22](RESEARCH_DECISIONS.md#r22-quickbooks-webhook-recovery), [R23](RESEARCH_DECISIONS.md#r23-quickbooks-sandbox-credentials), [R24](RESEARCH_DECISIONS.md#r24-easypost-tracking-versus-label-purchase), [R25](RESEARCH_DECISIONS.md#r25-printful-variant-and-artwork-api).

External activation gates: EXT-SUPPLIER, EXT-FINANCE.

## GAP-037: Deliver recoverable GitHub source and actual CI evidence

Priority **P0** · Milestone **M0** · Status **OPEN** · Modules: foundation.

Observed: The selected GitHub repository is public and has only its initial main branch; no implementation workflow runs exist. The working build/greenfield-v1 branch is local.

Code: [README.md](../../README.md), [.github/workflows/ci.yml](../../.github/workflows/ci.yml), [docs/DECISIONS.md](../../docs/DECISIONS.md).

Implementation:

- Prepare a privacy-reviewed branch/PR with no credentials or private operational files
- Resolve repository confidentiality before publishing the supplied handoff
- Execute pinned CI checks and retain commit-specific artifacts outside the ephemeral preview

Close only when:

- The implementation commit is reachable in the authorized repository and a real CI run is linked
- A clean checkout reproduces both apps and tests; branch rules and deployment permissions preserve human launch authorization

Dependencies: GAP-001. Research: [R13](RESEARCH_DECISIONS.md#r13-owasp-secrets-lifecycle), [R30](RESEARCH_DECISIONS.md#r30-supabase-cli-v3-breaking-changes).

External activation gates: EXT-GIT.

## GAP-038: Finish all contracted operator screens and accessibility states

Priority **P1** · Milestone **M6** · Status **OPEN** · Modules: foundation, today, crm, catalog, supplier, configuration, creative, estimating, commerce, stores, byob, sales, orders, procurement, fulfillment, finance, marketing, workflow, analytics.

Observed: A shared records UI is useful, but it does not prove each of the 86 required screens and named workflows is complete or usable for its intended role.

Code: [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/os/components/actions.tsx](../../apps/os/components/actions.tsx), [apps/os/components/studio.tsx](../../apps/os/components/studio.tsx), [apps/os/components/integrations.tsx](../../apps/os/components/integrations.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx).

Implementation:

- Build task-specific typed editors and detail views from shared authoritative services
- Finish loading/empty/error/denied/stale/conflict states, server pagination and saved views
- Review keyboard, focus, labels, touch sizing and mobile read/edit paths for each screen

Close only when:

- Every screen inventory entry has a concrete component/route and browser assertion
- Owner, sales, integration admin, operations, finance, marketing and customer journeys are independently usable without JSON editing

Planned verification targets (not yet implemented by this plan): `tests/e2e/module-screens.spec.ts`, `tests/e2e/role-accessibility.spec.ts`.

Dependencies: GAP-008, GAP-019, GAP-021, GAP-024, GAP-027, GAP-029, GAP-030, GAP-031, GAP-032. Research: [R27](RESEARCH_DECISIONS.md#r27-wcag-22).

External activation gates: None for local synthetic implementation.

## GAP-039: Execute all cross-module, inherited and scale acceptance

Priority **P1** · Milestone **M6** · Status **OPEN** · Modules: foundation, analytics, commerce, creative, supplier, orders, stores, finance.

Observed: 139 tests and nine earlier browser journeys are useful evidence, but do not establish all A01-A40, T01-T30 or inherited E01-E25 assertions.

Code: [docs/ACCEPTANCE_EVIDENCE.md](../../docs/ACCEPTANCE_EVIDENCE.md), [tests/e2e/os.spec.ts](../../tests/e2e/os.spec.ts), [tests/e2e/shop.spec.ts](../../tests/e2e/shop.spec.ts).

Implementation:

- Create deterministic full-context acceptance fixtures and a per-assertion evidence runner
- Run migration/security/domain/browser/recovery suites and measured load
- Preserve PASS/FAIL/BLOCKED_EXTERNAL/COMING_SOON separately with exact commits and commands

Close only when:

- All 95 scenario rows have their full assertions and observed results, not just a matching test filename
- Measure 100k-variant search, 100 bulk updates and 500 queued renders; an unmet budget produces a failure and remediation

Planned verification targets (not yet implemented by this plan): `tests/acceptance/v1-journeys.spec.ts`, `tests/performance/v1-load.spec.ts`.

Dependencies: GAP-018, GAP-023, GAP-024, GAP-025, GAP-026, GAP-027, GAP-031, GAP-033, GAP-034, GAP-035, GAP-036, GAP-038. Research: [R27](RESEARCH_DECISIONS.md#r27-wcag-22).

External activation gates: EXT-SUPPLIER, EXT-ASI, EXT-FINANCE.

## GAP-040: Consolidate owner acceptance and explicit activation

Priority **P0** · Milestone **M7** · Status **OPEN** · Modules: future, foundation, commerce, supplier, finance.

Observed: Full active V1 acceptance remains open. Working previews do not authorize live suppliers, money, communications, domains or future modules.

Code: [docs/IMPLEMENTATION_CHECKLIST.md](../../docs/IMPLEMENTATION_CHECKLIST.md), [docs/OPEN_DECISIONS.md](../../docs/OPEN_DECISIONS.md), [packages/contracts/src/modules.json](../../packages/contracts/src/modules.json).

Implementation:

- Demonstrate apparel, commercial print and mixed-event-kit journeys with measured operator effort
- Publish separate implementation, simulation, verified integration, failure and activation reports
- Produce a reviewed staging/launch/rollback change set and keep all future features disabled

Close only when:

- A consolidated owner review sees complete durable workflows and remaining external blockers
- Production readiness requires the exact approved deployment and legal/financial/licensing evidence; no production mutation is implied

Planned verification targets (not yet implemented by this plan): `tests/acceptance/owner-journey.spec.ts`.

Dependencies: GAP-037, GAP-039. Research: [R02](RESEARCH_DECISIONS.md#r02-asi-developer-api-families), [R03](RESEARCH_DECISIONS.md#r03-asi-smartlink-product-description), [R09](RESEARCH_DECISIONS.md#r09-supabase-backup-coverage), [R13](RESEARCH_DECISIONS.md#r13-owasp-secrets-lifecycle), [R26](RESEARCH_DECISIONS.md#r26-ftc-commercial-email-guidance), [R27](RESEARCH_DECISIONS.md#r27-wcag-22), [R28](RESEARCH_DECISIONS.md#r28-nist-digital-identity-revision-4).

External activation gates: EXT-SUPPLIER, EXT-ASI, EXT-FINANCE, EXT-COMMS, EXT-LEGAL, EXT-DEPLOY.
