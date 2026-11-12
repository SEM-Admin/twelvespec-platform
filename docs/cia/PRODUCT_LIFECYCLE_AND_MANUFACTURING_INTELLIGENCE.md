# CIA-PRODUCT-001 — Unified Product Creation, Engineering & Manufacturing Digital Thread
**Status:** proposed, research-backed *target architecture*; not implemented or approved for manufacturing release.  
**Companion contract:** [ARCHITECTURE_AND_IMPLEMENTATION_CONTRACT.md](ARCHITECTURE_AND_IMPLEMENTATION_CONTRACT.md)  
**Priority:** shared data/identity/rights/revision foundations now; specialization and activation only after technical and commercial validation.

## 0. Architectural decision and compatibility with CIA-001

CIA remains the cross-cutting **commercial intelligence** layer. This extension establishes **Product & Manufacturing Intelligence** (PMI) as a domain capability within CIA, not a replacement CIA, a separate second brain, a forced rewrite, or a new standalone product.

The common foundation serves **existing supplier items and original products**, **marketing/merchandising/e-commerce and engineering/manufacturing**:
- CIA owns/coordinates evidence, ontology, reasoning, constraint interpretation, source/provenance, explainable decision traces, cross-domain intelligence.
- Existing catalog/PIM owns published sellable product records and channel projections; Creative Studio/DAM owns editable visual design, assets and proofs; engineering/PLM-like domain owns released original-product technical definitions, CAD references, component revisions, BOM, engineering changes; production domain owns routings, work instructions, QC and released manufacturing packages; pricing/finance owns transaction costs and terms; commerce owns offers/orders. Ownership follows actual audited services, not names invented in this document.
- The **digital thread** is the joined, versioned identity and revision links among these authoritative models. A creative scene graph is only one representation in that thread, **not** a replacement for CAD solids, manufacturing process plans, or commercial product records.
- Reusable software capabilities and appropriately licensed generic market knowledge can support later MCALCO businesses. Account prices, customer data, legal entities, order history, confidential designs, IP and proprietary product definitions remain tenant/business isolated; shared rights must be explicit.
- CIA-001's immutable supplier price evidence, source rights, audit, qualification and transaction gates remain binding. Do not delete, relax or silently supersede them.

## 1. Supported product creation modes and lifecycle

Modes are distinct workflows with different readiness:
1. **DECORATE_EXISTING**: known blank/SKU + compatible decoration method + imprint geometry + approved artwork.
2. **CONFIGURE_EXISTING**: manufacturer-permitted material/color/size/parts or personalization options, with exact options/eligibility.
3. **DEVELOP_ORIGINAL**: original concept, product/visual design, requirements, materials/components/size/spec and prototype, with manufacturer feasibility review.
4. **ENGINEER_NEW**: functional/novel product requiring CAD/CAE, tolerances, standards, testing, responsible engineering signoff and design control.

Lifecycle: discover -> requirements/market hypothesis -> concept -> design -> engineering -> prototype -> verify -> industrialize -> commercialize -> produce/fulfill -> post-sale learn/change. Every transition requires explicit status and approval evidence; generated renderings or AI confidence never substitute for test results.

**Creation modes must not silently escalate:** a custom decorated stock cap cannot be declared an engineered new cap; a 3D preview cannot be declared engineering verification.

## 2. Canonical digital thread: minimum identity and revision model

Conceptual identities (reuse existing entities where possible; avoid duplicate authoritative tables):
- ProductConcept, ProductFamily, ProductDefinition, ProductRevision, VariantDefinition, SKU/Offer, ProductRequirement, RequirementRevision.
- ComponentDefinition, MaterialSpec, BOMRevision, SupplierPartReference, SourceEvidence, TechnicalStandard, ComplianceClaim, QualityPlan, TestResult, EngineeringChange.
- VisualDesignIntent, SceneGraphRevision, ArtworkAssetRevision, BrandColorIntent, DesignInterpretationRevision, VisualizationAsset.
- CADModelReference (native, STEP, drawings, coordinate/unit conventions), GeometryRevision, DielineRevision, ImprintZoneRevision, ToolingReference, ManufacturingProcessProfile, ProductionRouteRevision, Machine/FacilityCapability, WorkInstructionRevision, ManufacturingPackageRelease.
- MarketingClaim, MerchandisingAsset, ChannelListingRevision, ChannelPrice/Offer, PricingEvidence, Quote/Order/Batch/Shipment, ActualProductionOutcome, Return/Defect and AuditDecision.

Relationship semantics: DERIVED_FROM, REVISES, APPLIES_TO_VARIANT, AUTHORIZED_BY, SATISFIES_REQUIREMENT, MANUFACTURED_BY, COMPOSED_OF, DEPENDS_ON, USES_MATERIAL, USES_TOOLING, PRODUCED_USING, APPROVED_FOR, RENDERED_FROM, MARKETED_AS, COSTED_FROM, RELEASED_AS, FULFILLED_AS, OBSERVED_AS. Preserve typed IDs, scope, effective/observed timestamps, source and version.

A **canonical identity is not a canonical file format**. No claim that editable design JSON is sufficient for CAD, fabrication, simulation or inspection.

## 3. Intent-first scene graph: design source without false portability

Extend the existing `packages/creative/src/index.ts` basic `DesignDocument` (text/image/shape, normalized 0..1000 coordinates, physical placement and method) via versioning, compatibility/migrations and test fixtures.

Target capabilities:
- Units, physical coordinate system, transform hierarchy and physical-to-display conversion.
- Editable vector paths (curves, fills, strokes, clipping and winding), raster assets with pixel extent/rights, text (font identity/license, shaping/outlines), object/compound IDs, semantic tags, accessibility/metadata.
- Original brand color intent plus print/device/thread/spot-color mappings with measured tolerances and approval evidence. Color mappings are approximations until producer/physical proof.
- Constraints refer to exact product revision + variant + substrate/material + process profile + production zone + producer/device/facility; never embed universal embroidery heights, generic DPI/bleed thresholds, global UV mappings, or arbitrary CMYK mappings as verified production rules.
- Retain **one editable creative master**, with immutable *method-specific interpretations* and output revision lineage. No promise that every process can reproduce identical gradients, fine lines, textures, colors or physical appearance.
- Preserve source uploads and original artwork even when producing a derived vector/stitch/image export.

## 4. Distinct engines/services and contract boundaries

A. **Design/Marketing engine**: editable graphics, design variants, approved merchandising copy/claims, channel output and DAM. Marketing outputs derive from approved product facts/visual identity; do not publish unverified specifications or generated claims.

B. **Engineering/Product Definition engine**: dimensional drawings/solid models, material requirements, tolerance stack, multi-level BOM, change control, engineering validity, safety/regulatory requirements. CAD and physical validation are specialized tools, not inferred from scene graphs.

C. **Manufacturing Rules & Preflight engine**: deterministic producer-specific requirements, compatibility, exact scale/zone, substrate/method, color, layers, text, effective raster resolution, machine envelopes, dielines, safety, QC. Must emit PASS/FAIL/UNVERIFIED with applicable versioned evidence; an UNVERIFIED requirement cannot authorize release.

D. **Method-Specific Compilers** (separate adapters with declared input/output/limitations):
- embroidery machine formats, stitch plan, color/thread sheet, pull/push compensation, registration, test sew-out;
- DTG/DTF/screen print separations, underbase/white/spot layers and producer acceptance;
- digital/offset/wide format PDF/X output intent, color profile, transparency, trim/bleed/finishing;
- vinyl/laser cut/engrave vectors and device-specific path/units/operations;
- packaging, labels, dielines, creases, adhesive, tooling, sheet/roll and barcode;
- additive/subtractive fabrication or other engineered production only with independently verified machinery and safety needs.
A valid binary/PDF does **not** by itself mean production-ready. Include signed manifest with exact source revisions, output profile, validation and human release evidence.

E. **3D Visualization engine**: link actual product asset/model revision, material approximation, UV/decal/decoration zone and visual scene. Distinguish `PRODUCT_MOCKUP`, `PROCESS_APPROXIMATION`, `ENGINEERING_SIMULATION`, `PHYSICAL_VERIFIED`; do not present shader realism or dynamic normal maps as verified physical testing. 2D/3D edits must reconcile to the same validated placement/units rather than silently changing approved geometry.

F. **Manufacturing Economics & Optimization engine**: estimate/measure ink coverage, stitches/color changes, prep time, equipment runtime, imposition/nesting, substrate waste, tooling, setup, spoilage, quality, packaging, freight and service cost. All outputs link to evidence and distinguish theoretical/simulated/calibrated/quoted/realized. Compare fully compatible routes and margin at actual order quantities; never allow hypothetical direct machine costs to replace actual supplier net costs.

G. **Commerce orchestration**: existing storefront/CRM/quotes/procurement/orders/fulfillment use only approved projections, explicit seller and channel scope, existing financial gates and permissions.

Use native existing runtime/worker patterns first. New Python/Rust/C++ services, queues, managed GPU services, Blender workers or dedicated graph storage require measured technical bottleneck, maintenance/licensing/security review and owner approval for paid or production activation.

## 5. Controlled release lifecycle and rights

Represent at least: IDEA -> DRAFT -> TECHNICAL_REVIEW -> PROTOTYPE -> TESTED -> APPROVED_DEFINITION -> RELEASED_FOR_PRODUCTION -> RETIRED/SUPERSEDED, with separate dimensions for commercial channel publication and supplier offer eligibility. Prevent accidental status conflation.

- Prototype, rendered marketing proof, customer-approved visual proof, technical preflight, engineering approval and actual manufacturing-release authorization are **different** records.
- Design revision, product revision, exact SKU/variant, supplier/producer, process profile, output binary hash and approved proof must be linked at release.
- Supplier terms, images, fonts, CAD models, Pantone/color references, machine libraries, generated art and software licensing require provenance and usable permissions.
- Public marketing must not reveal confidential net prices, hidden suppliers/decorators, sensitive specifications, internal costs or third-party proprietary designs.

## 6. Phased, evidence-gated implementation

**P0 — Repository audit (Codex first):** Verify actual code/migrations/CI and supplier/creative/preflight gaps; compare both CIA contract files with existing `docs/SELLING_READINESS.md`, `docs/GAP_CLOSURE_PLAN.md`, `docs/industry-research/README.md`, `docs/business-research/DATA_MODEL.md` and source-of-truth specs. No contradictory new schema until ownership clarified.

**P1 — Shared contracts and validated minimum:** Product/revision/digital-thread identities, source and process profiles, design-intent scene graph migration, cross-module event/interface audit, rights, preflight status vocabulary, 3D and CAD references (not fake CAD), scoped and immutable outputs. Test additively; don't destabilize quote-first V1. This phase does not require implementing every specialized engine.

**P2 — Working narrow pilots (isolated):**
1. Stock **embroidered cap**: true variant and manufacturing profile, placement, preliminary stitch estimate and preview; stitch package must stay UNVERIFIED until test-sew/qualified review.
2. **Printed/die-cut sticker**: specified media and verified printer profile, vector, spot/dieline/cut path, correct color profile, tool validation; producer review before release.
3. **Commercial brochure**: trim/binding/stock, page geometry, output condition, producer-validated PDF and finishing.
4. **Original retail product prototype**: concept -> requirement -> component/material/BOM -> original design -> 3D visualization -> engineering/prototype review -> approved merchandising listing draft. No automatic compliance claims or fabrication.
Use authorized/synthetic example evidence and disclose its status.

**P3 — Production compilers and rendering:** Enable one method at a time after acceptance, required licensing and production-quality validation. Add real 3D asset handling, color management, cost calibration and manufacturing simulation as separate proof-based increments.

**P4 — Intelligent automation:** Use observed transactions and quality outcomes to justify auto routing/pricing/marketing, with explicit approval thresholds, monitoring, kill switch and audit. Do not permit autonomous live purchasing, production release or payment by default.

## 7. What to verify in pilot acceptance

1. Changes to original product revision invalidate dependent approvals/marketing claims/production package as appropriate.
2. Same master logo yields separate immutable method-specific revisioned interpretations and manifests; original source always recoverable.
3. Manufacturer-specific min stitch heights, DPI/bleed, color-profile, cut tolerances and machine limits are evidence-backed; unknown remains UNVERIFIED.
4. 3D mockup unit scale and UV/decals tied to approved physical placement; no 3D approval silently creates machine approval.
5. Filename/extension/binary validity alone never yields `RELEASED_FOR_PRODUCTION`.
6. Multiple suppliers with similar items and different profiles do not share unsupported rules.
7. BOM costs, source pricing, engineering costs, setup and actuals remain distinguished.
8. Marketing and e-commerce publication use approved product facts, licensed media and seller/channel scopes; cross-business/customer access denied.
9. Economic estimate reconciles to real orders, records deviation/rework/owner minutes and can explain assumptions.
10. Source/tool licensing (including commercial/AGPL where applicable), confidentiality, media rights and audit pass before enabling a compiler.
11. Existing V1 browser/backend tests, original acceptance coverage, production gates, shop and OS remain intact.

## 8. Research and tool-selection standards

Research digital-document standards (SVG, PDF/X producer requirements, ICC), product lifecycle systems, CAD/BOM/change control, embroidery machine format and stitch-quality validation, commercial print/finishing, signage/labels/packaging, process coloring, 3D glTF/PBR/UV, manufacturing economics and e-commerce PIM/DAM. Cite versioned, current standards/provider manuals; beware oversimplified claims (e.g. universal 300 DPI/3 mm bleed, automatic DST quality, exact screen-to-thread color, universal PDF/X-1a, photoreal 3D as machine validation). Vendor/tool candidate comparisons must include compatibility, licensing, security, operational burden, cost and exit/portability.

Do not assume entitlement to paid proprietary formats, producer templates, source catalogs, fonts, patents, simulation models or branded design assets.

## 9. Codex handoff deliverables, in order

1. **Conflict/compatibility report** comparing CIA-001 vs CIA-PRODUCT-001 and current source of truth; identify and resolve ambiguity in a reviewed architectural decision record.
2. Current-code and migration audit with precise paths, tests and VERIFIED/PARTIAL/RESEARCH_ONLY/MISSING/BLOCKED classification.
3. Domain ownership and seven-dimensional product ecosystem map; entity ID/revision and event graph; access controls for separate businesses.
4. Minimal additive TypeScript/SQL contracts and reversible migrations with no fictional completion.
5. Scene-graph and production-profile specs; producer profile evidence/validity model.
6. Method adapter interfaces and release gates; 3D/CAD integration contracts.
7. Technology choice/licensing evaluation, cost/time/complexity and V1 launch dependency impact.
8. Four pilot acceptance test specifications and runnable golden fixtures where feasible.
9. Incremental implementation PR plan with clear unit/end-to-end/security test evidence.
10. An objective first demonstration of an evaluated qualified product/configuration/production path, without actual manufacturing release.

**Priority constraint:** First paying customer remains the immediate TwelveSpec business objective. Do not turn product research and future retail work into an indefinite V1 blocker. No full CAD suite, general product simulator, auto-digitizer, predictive AI or photoreal 3D engine simply to satisfy a speculative architecture brief.

## 10. Explicit compatibility matrix

| Existing CIA-001 rule | Product/manufacturing extension | Conflict? |
|---|---|---|
| CIA knowledge/decision authority; business services own transactions | PMI provides design/process interpretation, specialized domain owns product/engineering release | None; preserves domain authority |
| Supplier published price history distinct from account net/actual | BOM, tooling, manufacturing cost and retail offers link to those distinct layers | None; extends evidence types |
| Seven-dimensional who/what/why/where/when/how/how much | Apply to lifecycle, creators, materials, facilities, methods, beneficiaries and costs | None; scope expansion |
| Supplier-source evidence, rights, confidentiality | Adds font, design, CAD, 3D, tech-pack and industrial IP rights | None; stricter rights |
| Decorated 48-cap decision mission | Embroidered-cap design/manufacturing pilot uses qualification evidence; production release remains gated | None; do not conflate two acceptance milestones |
| Reuse across MCALCO companies with tenant isolation | Original retail product and channel capabilities share code, not confidential data | None |
| No unauthorized supplier purchases, payments, production release | No unvalidated manufacturing compilers, CAD claims, marketing compliance, automated release | None; stronger gate |
| No parallel standalone CIA app or broad rewrite | Extend existing creative/catalog/production modules via versioned contracts and adapters | None |
| Preserve V1 and CMS acceptance gates | New architecture is additive and separately staged | None |

## Definition of Done for *this* architecture update

The owner can inspect one coherent proposed CIA architecture (CIA-001 and this companion doc) and send Codex one link. **Documentation and planning do not imply technical implementation, production readiness, or proven physical manufacturability.**
