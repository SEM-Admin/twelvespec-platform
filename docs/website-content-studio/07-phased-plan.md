# Phased implementation plan

**Proposed work, pending review.** This is an extension of the existing platform, not a replacement implementation. No dates or effort estimates are promised before the Phase 1 foundation has been measured. Each phase has an observable exit gate; unsuccessful gates stay open on the implementation checklist.

## Phase 0 — review this packet

- [x] Inspect both applications, all registered modules and shared architecture.
- [x] Separate current capabilities, source-derived defects, proposed features and unverified integrations.
- [x] Compare the current design with the written direction; identify the missing visual reference.
- [x] Propose the content model, component registry, admin wireframes and acceptance matrix.
- [ ] Owner reviews the architecture, provisional visual direction and phased scope. The reference image can refine the visual decision when available.

**Gate:** the review required by section 6 of the uploaded brief. This packet performs no application implementation, content publication, deployment or production changes.

## Phase 1 — persistence, boundaries and migration design

**Preserve:** Better Auth, scoped kernel transactions, existing domain ownership, product-bound image checks, private artwork, audit/outbox and module registry.

**Modify:** add explicit editorial/resource capabilities; resolve manager/Marketing authorization mismatch; require active store membership on private reads; fix the mobile account button accessible name and missing bundle-price presentation. These are inspected issues, not changes already made.

**Add:** confirm the smallest site/release/job/reference schema; typed relation backfills and indexes; append-only revision protections; published-only reader/RLS contract; development database/media durability and recovery. Keep the existing demo setup reproducible.

**Eliminate:** reliance on idle-container memory/files as permanent owner content. Remove ambiguous empty-assortment fallbacks where approved store products are required, after preserving existing intended store types.

**Gate:** scoped cross-tenant/store reads and writes fail closed; no migration discards existing draft/product/design/store data; database plus assets survive a runtime restart and a tested backup restore. No public or privileged database connection is introduced by convenience. Any needed credentials, account change or paid infrastructure has its own applicable authorization.

## Phase 2 — one complete owner editing workflow

**Preserve:** existing storefront routes, cart/configuration sessions and quote/design behavior. Use a feature-gated editorial resolver so a migration can be verified before it becomes the site source.

**Modify:** extract the homepage hero into a registered presentation component with shared public/preview rendering. Preserve the current logo and public-product projection.

**Add:** Website & Content Studio entry, page list, structured hero inspector, draft save, optimistic conflict handling, desktop/tablet/mobile preview, selected-change review, atomic publication, immutable history and page restore/rollback.

**Eliminate:** source-code editing for this first routine content operation only after the complete workflow passes. Do not present a partly functional editor as a replacement for the current homepage.

**Gate:** the owner can change a headline/image, inspect a private preview, publish and restore it without Git, SQL or a deploy. Unrelated drafts remain private; the existing quote/design journey still passes. Complete CMS-001, 018–028, 045, 067–072 and the relevant persistence/privacy cases.

## Phase 3 — reusable sections, media, navigation and brand

**Preserve:** current brand assets, licensed product derivatives and existing asset ownership checks.

**Modify:** progressively replace hardcoded header/footer/navigation and website tokens with approved versioned documents. Keep the existing identity intact while applying white/neutral, charcoal and vermilion to presentation.

**Add:** the required component registry, structured rich text, section ordering/hiding, draft/duplicate/archive/restore, media picker/library, rights and usage graph, image derivatives, global menus/mega menus/mobile navigation and governed brand settings. The media inspector reports why an asset cannot be used.

**Eliminate:** routine hardcoded content and arbitrary body HTML in the website authoring path. Do not delete legacy marketing drafts; migrate or retain them by explicit kind.

**Gate:** all requested ordinary page sections can be edited and previewed; logo preservation, contrast, responsive menus, keyboard section ordering and private-asset denial pass. Video/download/resource components remain unavailable until their file safety/accessibility dependencies pass. No new paid editor or font license is assumed.

## Phase 4 — discovery, canonical merchandising and solutions

**Preserve:** canonical catalog IDs, current publication/rollback guards, exact variants, quote-first rules and source review.

**Modify:** introduce catalog-owned ordered collection memberships with a verified legacy backfill; use server pagination/facets rather than capped client snapshots. Add public descriptions and SEO through the proper catalog/editorial owner.

**Add:** category/brand/industry/occasion/solution associations, collection pages, featured image/variant picks, solution templates, dynamic metadata, canonical paths, redirect review and a published sitemap. Draft sites remain noindex.

**Eliminate:** copied product objects/prices inside content documents and customer-visible zero/price promises where the quote engine has no verified value. Do not expose private supplier intelligence as marketing copy.

**Gate:** a curated collection resolves only eligible canonical products; paused products and revoked media disappear safely; pagination reaches all eligible products/variants. Product configuration and exact design/version binding remain intact.

## Phase 5 — organization sites and dependable scheduling

**Preserve:** store identities, memberships, assortments, brand kits, windows and spending policies.

**Modify:** reuse store/program commands for policy forms; implement scoped editable themes/banners/collections separately from financial or eligibility settings. Add explicit customer/operator Add to Store behavior based on grants.

**Add:** scoped organization site editing, brand inheritance, store collections, program content, UTC/timezone-aware schedule jobs, cancellation, stale-generation checks, reliable executor waking and visible retry/failure handling.

**Eliminate:** any illusion that a queued date on an idle-stopped container is a dependable schedule, or that a CMS banner opens a closed ordering window.

**Gate:** inactive members and other stores cannot read private content/media/metadata; approved assortments and real budget/window policies govern commerce; a scheduled release activates once after a forced executor interruption, or reports a blocked/expired state accurately. New infrastructure or costs require applicable approval before provisioning.

## Phase 6 — campaign and creative reuse

**Preserve:** campaign review, CRM consent boundaries, private customer designs and production-blocked artwork status.

**Modify:** link existing campaign IDs to versioned landing pages and approved reusable media; connect inquiry UI to validated request/CRM commands rather than storing submissions in page JSON.

**Add:** seasonal/event/industry/fundraising templates, approved email/social assets, rights-scoped creative presets, accessible video/resource sections, and lookbook generation from public product projections.

**Eliminate:** duplicate/uncontrolled product copies across channels and implicit sends on content publication. Unimplemented exports, malware scanning or campaign delivery are visibly unavailable.

**Gate:** the same approved asset can be reused within its actual rights scope, revocation has a tested effect, inquiries remain private and no page action sends email/social messages or releases production artwork.

## Phase 7 — complete customer experience and owner acceptance

**Preserve:** all existing working business workflows and disabled Coming Soon modules.

**Modify:** polish all eight customer flows with the approved visual language and consistent status, error, price-pending and approval handoffs. Correct BYOB per-component configuration/shared artwork and exact kit context through the proper business domains, not editorial fields.

**Add:** full content acceptance automation, regression journeys, mobile/keyboard/screen-reader review, security/performance/recovery evidence and the owner's six-task usability session.

**Eliminate:** temporary fallback editing paths only after replacement acceptance; remove misleading controls for unimplemented features, not underlying accepted business functionality.

**Gate:** all agreed CMS tests have recorded passing evidence; the existing business suite remains green; restore/replay/mobile/privacy checks pass; owner tasks need no code, queries or deployments. Resolve any newly discovered failures openly. CMS completion does not close the original 95 master-platform scenarios or sales-activation requirements by implication.

## Definition of completion and later activation

The implementation checklist must retain separate columns for **implemented**, **simulated**, **integration verified**, **failure**, and **activation requirement**. This review packet has no new verified provider integration and does not activate selling.

An implementation is complete only when the live development storefront and OS support the owner workflow and every agreed gate has evidence. Deployment of reviewed changes still requires the applicable authorization. Production sales additionally require the unresolved legal, supplier, pricing, tax/payment, proof/production, fulfillment, finance and operational gates in the existing [selling-readiness report](https://github.com/SEM-Admin/twelvespec-platform/blob/f5cb02511022909edb396dbd79c4be397858f67d/docs/SELLING_READINESS.md) and [master gap backlog](https://github.com/SEM-Admin/twelvespec-platform/blob/f5cb02511022909edb396dbd79c4be397858f67d/docs/planning/gap-backlog.json). PSRESTful remains prohibited.
