# Proposed content model and relationships

**Proposal only.** No migration, table, permission or runtime schema has been changed. The companion JSON schema is an illustrative document contract for review, not an installed validator or proof that the CMS is implemented.

## Reuse before adding

| Existing record | Proposed extension/reuse | Guard |
| --- | --- | --- |
| `content_assets` | Editorial document identities: website pages, navigation, site brand/footer settings and organization content. Add typed site scope and document-kind/schema fields. | Existing COPY/EMAIL_DRAFT/SOCIAL_DRAFT records remain separate kinds. A legacy LANDING_PAGE body never becomes public automatically. |
| `content_revisions` | Append-only structured revision snapshots, content hash, author/reason and schema version; typed scoped `content_id`/`site_id` FKs. | Existing initial-revision behavior is not yet immutable history. Add uniqueness/immutability rules and a safe legacy migration after review. |
| `assets` | Original/derivative linkage, MIME/dimensions, tags, use class, rights scope/expiry/review and retention metadata. | Private artwork/supplier originals stay private. Only explicitly approved web derivatives can be referenced publicly. |
| `brand_kits` | Reuse a kit ID when an organization is authorized to use its approved logo/colors. | It is not automatically a public global brand library; website tokens are separate versioned editorial settings. |
| `products`, `variants` | Canonical identities and existing published snapshots. | No copied editable products/prices/stock in page documents. |
| `collections` | Canonical merchandising identity, title/description/taxonomy/SEO and publication state. | Existing ID-array memberships require a reviewed backfill; do not discard or silently publish them. |
| `stores`, `store_products`, `store_memberships` | Program ownership, assortments, access, budgets and windows. | Store CMS content never overrides eligibility or spending policy. |
| `campaigns`, `publications` | Link campaign identity and approved creative to landing content. | Existing publications hold private campaign/audience metadata and are not a public website-release DTO. |
| `audit_events`, `outbox_events` | Content changes, review, activation, rollback, failed dependencies and job results. | Website events do not send external marketing or create financial transactions. |

## Minimal new records proposed

| Record | Important columns/relations | Purpose |
| --- | --- | --- |
| `websites` | `id`, tenant/workspace, `kind`, optional scoped `store_id`, locale/timezone, lifecycle, `active_release_id`, generation/row revision. | One primary site or an organization site anchored to the existing store. No independent domain registration/deployment. |
| `website_releases` | Site/tenant/workspace, immutable manifest/hash, supported component-registry version, creator/approver/reason, previous release ID. | Pin page, navigation, footer and brand revision IDs into one coherent release. |
| `website_publish_jobs` | Scoped site/release IDs, UTC run time and chosen display timezone, expected active release/generation, expiry, status, idempotency key and attempt/error metadata. | Durable scheduled activation with stale-job protection, cancellation and exactly-once effect. Reuse the existing worker/outbox for execution. |
| `content_references` | Scoped site/content-revision IDs; typed nullable target columns for product, variant, collection, asset, store, brand kit or approved template document; reference kind and placement key. | Explicit dependency graph, FK enforcement, rights validation and asset-use/deletion checks. Exactly the target columns required by its kind must be present. |
| `collection_products` (Catalog-owned) | Scoped collection/product IDs, rank, featured/hidden flag, optional product-bound featured variant ID. | Canonical curation and order. This is an association table, not another product database. |

Every new relation needs tenant/workspace and, where applicable, site/store-scoped keys, RLS `USING` and `WITH CHECK`, supporting indexes and least-privilege grants. Use existing membership-based application identity; do not copy Supabase `auth.uid()` policies into a Better Auth system without an identity mapping. Do not expose editorial/private tables through anonymous Data API grants.

The proposed five tables are an initial design. Phase 1 must confirm the smallest sufficient schema against the existing migrations before writing one. A trusted reader/projection policy is a deliverable, not an assumed privilege bypass.

## Document shape

See [proposed-content-schema.json](proposed-content-schema.json). Conceptually:

```json
{
  "schemaVersion": 1,
  "documentType": "WEBSITE_PAGE",
  "siteId": "site-uuid",
  "title": "Homepage",
  "path": "/",
  "seo": {"title": "TwelveSpec", "description": "Approved public copy", "noIndex": true},
  "sections": [
    {
      "id": "stable-section-uuid",
      "type": "hero",
      "visible": true,
      "variant": "split",
      "content": {"heading": "Make your next big idea tangible.", "body": "Approved editorial copy", "imageAssetId": "approved-derivative-uuid"}
    },
    {
      "id": "another-stable-section-uuid",
      "type": "product_carousel",
      "visible": true,
      "variant": "standard",
      "content": {"heading": "Make it yours", "collectionId": "canonical-collection-uuid", "limit": 8}
    }
  ]
}
```

The UUID strings above are explanatory placeholders; actual contracts validate UUIDs and references. Use discriminated schemas per block. Unknown properties, unknown blocks, unsupported versions, raw HTML, arbitrary CSS/scripts and unapproved remote media URLs are rejected. Rich text uses a bounded semantic AST with permitted marks/links. Reordering keeps section IDs stable.

The example JSON Schema describes a complete publication candidate. Phase 1 must also specify how incomplete but authorized drafts are persisted and shown with field errors, without allowing them to publish or accept unsafe references. Document shape validation never substitutes for database scope, rights, availability or permission checks.

`row.revision` is the optimistic concurrency version; content revision identity/version is the immutable history; `schemaVersion` describes document structure. These must not be conflated. Two editors saving the same base revision receive a conflict/diff workflow, not a silent last-writer-wins overwrite.

## Navigation and brand documents

- Navigation has stable group/item IDs, a maximum supported depth, semantic internal targets (page, collection, solution, store) or approved HTTPS external links, and optional approved featured-image IDs. Desktop mega menu and mobile navigation render the same document.
- Page paths are unique within a site and checked against a reserved route registry: APIs, auth, products, designer, cart, account, bundles, stores and Coming Soon cannot be overwritten by editor slugs. Slug changes offer reviewed redirect entries in the release manifest.
- Theme documents contain approved palette/font/style IDs, semantic token values, logo-variant references and inheritance rules. They do not accept raw CSS or replace an existing logo by default.
- Organization overrides inherit the primary system's allowed structure. An organization editor cannot alter another store, global navigation, checkout rules, supplier data or financial settings.

## Reference resolution and public projection

Editorial documents store stable IDs, not copied price/cost/variant objects. A product block resolves the canonical **current published** projection. If a referenced product is later paused or its derivative revoked, the public resolver removes/blocks that card safely; it does not resurrect the snapshot just because the page release is older. Quote lines retain their own immutable business snapshots and existing stale-revision checks.

Public page DTOs contain only approved text, resolved safe links, permitted theme values and approved derivative URLs/product projections. They exclude tenant-internal metadata, author emails, supplier names/credentials, wholesale costs, raw source payloads, campaign audiences, private asset keys and original artwork.

The published-only reader is a separate server-only repository contract. It must prove public-site visibility or current active organization membership before rendering page metadata, data or assets. An anonymous request must not inherit a seeded demo customer's private-store membership. The exact reader role/RLS implementation is an explicit Phase 1 security test.

## Media contract

Metadata includes asset kind, original/derivative hash/version, owner/scope, dimensions/duration, alt text/caption, tags, focal point, rights status/scope/evidence reference/expiry and publication dependencies. Rights evidence remains private. Uploads are validated and quarantined; reusable public images are optimized, metadata-stripped derivatives. Product-specific catalog derivatives retain their exact product binding.

Private customer originals cannot be made public by inserting an asset ID into a hero or brand block. The picker filters permitted classes; the server and database validate the same rules. Approving a reusable marketing derivative is a deliberate action with a usage scope. Revocation and expiry block future reads/publication/rollback and trigger cache invalidation under a defined policy. No system can retract copies a visitor has already downloaded; do not claim instantaneous erasure of prior public downloads.

## Campaigns, forms and downloadable material

- Campaign pages reference `campaign_id`; changing content invalidates the relevant editorial approval without changing recipient consent or sending mail.
- Project forms use the existing request/CRM domains. Submissions, attachments and personal data never become editable website-page JSON. Public inquiry support requires its own anti-abuse/privacy contract; existing authenticated RFQ remains the first supported handoff.
- Design presets are approved reusable template documents/derivatives, not public copies of private customer projects. Manufacturing profiles remain Configuration/Creative/MIS records.
- Downloadable PDFs/lookbooks reference approved derivatives generated from approved public content/product projections. Unsupported files, unscanned uploads and unimplemented export jobs remain unavailable until their tests pass.

## Scheduling and lifecycle

Store scheduling instants in UTC plus the owner's selected display timezone. Resolve ambiguous/nonexistent daylight-saving times explicitly. Require an approved immutable release and expected current site generation; edit/cancel/revoke invalidates the queued job. Lock jobs and site activation transactionally, record idempotent effects, and surface late/expired jobs instead of silently publishing expired promotions.

Archive removes a document through a reviewed release, checking inbound navigation/references and redirects. Restore creates a new draft. Neither operation deletes audit history or reverses customer quotes, orders or payments. Durable backup/restore must recover the database, media and reference graph together.
