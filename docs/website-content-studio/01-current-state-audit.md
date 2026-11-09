# Current-state audit

**Audit only.** Source baseline `f5cb025`; local synthetic development UI. The original master handoff and its 20-module/95-scenario scope remain controlling for business workflows. The new content requirements extend that architecture.

## Architecture already present

| Layer | Inspected implementation | Implication |
| --- | --- | --- |
| Applications | `apps/shop` and `apps/os`, both Next.js 16.4.5/React 19.2.3; separate origins. | Keep both applications. Add an OS workspace, not another admin application. |
| Shared domains | `packages/*`, common command handlers/contracts and PostgreSQL transactions. | Reuse business commands and identifiers. Do not embed pricing or manufacturing logic in page blocks. |
| Identity | Better Auth, workspace membership, server `currentActor`, module authorization. | Reuse authentication. Add action/resource capabilities and tests; do not introduce a parallel CMS login. |
| Data | 97 registered application tables; six migrations; scoped foreign keys and RLS. | Use the existing database and migration process. CMS relationship/immutability changes still need explicit migrations after review. |
| Browser data boundary | `packages/server/src/index.ts`, public product/quote/asset projections, customer command allowlist. | Preserve projection boundaries. Never serve raw staff/editorial records as public page data. |
| Background processing | Existing worker/outbox and deterministic mock providers. | Reuse the worker, but do not promise scheduled publication while its hosted container can stop after inactivity. |
| Storage | Local PostgreSQL, artwork, catalog derivatives and encrypted development vault; hosted persistence not activated. | Owner content is not durable yet. Backup/restore and reliable storage are a release dependency. |
| Deployment/source | Existing protected development Workers; full source/history published on the approved GitHub branch. | No production infrastructure or domain change is part of this audit. |

Sources: [E01–E04, E08–E10, E17–E20](sources.md#repository-evidence).

## Current content-management capability

| Area | Working now | Missing for the requested studio |
| --- | --- | --- |
| Homepage/site shell | Hero, value strip, catalog grid, project CTA, header/footer and responsive layout. | All are code-driven. No page CRUD, section registry, draft page preview, owner publication or rollback. |
| Marketing | Owner can create campaigns, plain content drafts and segments. A content draft receives an initial revision. Campaign review/approval and local preview publication exist. | No general content editing/reapproval/history UI, page renderer or landing-page route. Campaign preview is not website publication. |
| Brand kits | Creative records can store hex colors and asset IDs. | They do not control website colors, fonts, buttons, logos or headers. No token/palette governance. |
| Product catalog | Source evidence, canonical drafts/variants, approved image derivatives, publication checks/snapshots and rollback are implemented. | No full website merchandising/taxonomy editor; collection membership is currently an ID array with no ordering/variant curation UI. |
| Media | Private customer upload/read path and product-bound public derivatives exist. | No reusable website-media library with scoped rights, tags, usage graph, expiry, campaign derivatives and deletion protection. |
| Navigation | A hardcoded responsive main menu and footer links. | No backend menu editor, mega-menu configuration or featured menu media. |
| Organization stores | Store types, product assignments, brand-kit links, membership, windows and budget checks. | Store-specific page themes, banners/navigation, curated collections and a customer-facing Add to Store path are absent. |
| Website SEO | Generic preview title/description and noindex are configured. | No per-page/product dynamic SEO, editorial canonical URLs, redirect lifecycle or website sitemap publishing. |

Evidence: [E05–E16](sources.md#repository-evidence). A field named `LANDING_PAGE` in a generic content form is not an implemented landing-page experience.

## Eight customer workflows

| Workflow | Current status and evidence | Preserve | Required extension |
| --- | --- | --- | --- |
| 1. Homepage | **Partial:** working hardcoded hero/catalog/CTA [E05]. | Header identity, catalog cards, responsive shell and quote entry. | Structured hero, service/solution/brand/campaign/collection sections; publication-bound owner editing. |
| 2. Discovery | **Partial:** client search, category/brand/decoration/MOQ filters, swatches and client pagination [E05/E08]. | Existing published-product projection and accessible filter controls. | Industries/occasions/solutions/attribute taxonomy, curated collection routes, real featured order and paginated server queries. Current public queries cap products and variants at 1,000 independently. |
| 3. Configuration | **Working synthetic subset:** color/size, quantity, method/location, line specifications and server validation [E06/E11]. | Exact variant IDs, stale-publication checks and quote-first unknowns. | Rule-driven materials/options/imprint-zone compatibility. CMS may explain options; it must not invent production rules or enable checkout. |
| 4. Creative Studio | **Working preview subset:** private uploads, editable design layers, saved versions, mockups, visual proofs and account history [E12]. | Customer ownership, version hashes, proof binding and production-blocked status. | Approved template discovery, reusable public presets and private-asset UX. Production geometry/prepress remains a separate open dependency. |
| 5. BYOB | **Partial:** kit templates/component quantities, save/estimate services and quote-cart entry [E13]. | Canonical component IDs and separate kitting/packaging cost semantics. | Per-component variants/specifications/shared-artwork binding, durable kit identity in the agreement, accurate unknown-price presentation. The current `money()` fallback can display a missing illustrative total as zero. |
| 6. Organization stores | **Partial:** assigned products, membership-based read policy, budgets/windows/brand-kit links [E14/E15]. | Server eligibility and canonical assortment assignments. | Scoped page/theme/banner controls, inactive-member read protection, explicit Add to Store UX and store collections. An empty assignment list currently falls back to all products in the UI; remove that ambiguity for approved assortments. |
| 7. Solutions | **Absent dedicated experience:** no solution-page content resolver or outcome taxonomy [E05/E08]. | Existing public products and quote intake. | Outcome pages/templates connected to canonical collections: trade shows, uniforms, gifting, fundraising and industrial branding. |
| 8. Quote/proof/order/reorder | **Working reviewed quote subset:** saved cart/RFQ brief, exact line snapshots, operator costs/issued quotes, visual proofs and backend reorder [E11/E12/E16]. | All existing consent, pricing/privacy, design and transaction guards. | Cohesive navigation/status handoffs, pending-price labels, actual transaction readiness and freshly validated reorder configurations. Real checkout/payment/shipping activation is still blocked. |

## Fresh development-browser evidence

Nine screenshots are in [evidence](evidence/). Catalog read at audit time returned 57 published synthetic products, one anonymous-visible store and two bundle templates. These are mutable development fixtures, not the production catalog or proof of supplier availability. Owner module reads returned HTTP 200; the four sampled API reads took 341–439 ms. This sample is not a load test, p95 result or production SLA.

- Desktop homepage at 1440 px: no violations in the automated WCAG A/AA rules exercised; no horizontal overflow.
- Mobile homepage at 390 px: one critical `button-name` violation; no horizontal overflow. The `.account-action` button has no accessible name when its label is hidden. The exact node is recorded in [supplemental mobile evidence](evidence/mobile-accessibility.json).
- No JavaScript page errors were recorded in the captured views.
- No content mutation was attempted; the guard allows local authentication only. No public or production content was published.

The older 11-journey suite includes desktop accessibility checks and mobile navigation behavior; that does not imply that every mobile state was previously covered. New acceptance must include mobile accessible names and all editorial states.

## All registered modules: preservation inventory

| Existing module | Website/content relationship |
| --- | --- |
| Foundation/administration | Preserve membership, governance and audit. Add scoped editorial capabilities and approved brand controls. |
| Today | Preserve operator overview and exception routing; surface failed/scheduled website jobs through existing work handling. |
| CRM | Preserve contacts/consent; inquiry submissions remain CRM/request data, never CMS document bodies. |
| Catalog | Sole source of products, variants, collection membership and publication eligibility. |
| Supplier | Keep credentials, raw feeds, prices and native integrations private and separate. |
| Configuration | Sole owner of compatible options/imprint requirements; CMS cannot override them. |
| Creative | Preserve private artwork/design/proof documents; share only explicitly approved derivatives/templates. |
| Estimating | Preserve costing/approval rules; page-builder settings cannot set transaction totals. |
| Commerce | Preserve cart/RFQ intake; page forms hand off through validated business commands. |
| Company stores | Reuse store IDs, assortments, memberships, windows and budget rules. |
| BYOB | Reuse kit/component IDs; content presentation cannot substitute a kit agreement. |
| Sales | Preserve reviewed quote publication, expiry and customer projection. |
| Print MIS/orders | Preserve job/production state; editorial publication cannot release artwork or production. |
| Purchasing | Preserve authorized PO workflow; no supplier-order side effect from publishing pages. |
| Fulfillment | Preserve shipment/return/remake workflow; avoid decorative delivery promises without operational evidence. |
| Finance | Preserve financial references; no charges/refunds/settlement from CMS actions. |
| Marketing | Extend current editorial records with the studio; keep campaigns/consent/sends logically separate. |
| Automation/workflow | Reuse outbox/worker mechanics for reviewed publication jobs; prove durable waking and replay. |
| Analytics | Add editorial audit/usage metrics without claiming current capped summaries are complete analytics. |
| Coming Soon | Retain disabled placeholders. A content card must not activate a future module. |

Exact source paths/hashes are in [source inventory](evidence/source-inventory.json). The proposal does not declare all active V1 requirements implemented.

## Priority findings before a website-content release

1. **Durability:** the current hosted demo can reset after inactivity; source content and uploaded media need persistent storage and recovery first.
2. **Authorization:** add action/resource-level editorial permissions; repair the manager/marketing approval mismatch. Inactive/revoked store membership must not qualify private content reads.
3. **Public/private separation:** current editorial tables are staff-only; customer artwork remains private; approved catalog images are bound to their exact product snapshot. Do not weaken those rules to build a media picker.
4. **Accuracy:** keep quote-first and unknown prices explicit; the bundle missing-total display and exact kit/design context require acceptance work.
5. **Scale and accessibility:** replace capped public snapshots with proper paginated reads and fix the mobile button label. The new vermilion theme needs contrast-safe label combinations.
6. **Scheduling:** use durable publication jobs plus a reliable wake/execution mechanism. An approved timestamp alone is not functioning scheduling.
