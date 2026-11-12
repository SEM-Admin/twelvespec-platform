# Product creation thread — next-slice proposal

**RESEARCH_ONLY / not an applied schema or activated feature.** The three companion contracts in PR #3 remain under review. This proposal identifies the minimum technical extension after the price-evidence foundation and exact designer/proof binding repair. It does not create a second PIM, editor, CAD engine, rules DSL or job lifecycle.

## Keep the authorities separate

Catalog retains canonical products/variants and their customer publication. Creative retains original private assets, the current `DesignDocument` and immutable versions/proofs. Orders/production owns process profiles, routings and technical release. Sales owns agreements; Finance owns reconciled actual costs. A digital thread stores typed links to those owners. It is not a universal mutable product document.

The current database has no released engineering definition or revisioned producer profile. Do not reinterpret a published catalog snapshot, a proof approval, a supplier JPG, a marketing render or a BYOB kit as one.

Minimal interfaces for review (not exports consumed by the application yet):

```ts
type Scope = { tenantId: string; workspaceId: string };
type RecordRevision = { id: string; revision: number; hash: string };
type DevelopmentMode = 'DECORATE_EXISTING' | 'CONFIGURE_EXISTING'
  | 'DEVELOP_ORIGINAL' | 'ENGINEER_NEW';
type TechnicalLifecycle = 'IDEA' | 'DRAFT' | 'TECHNICAL_REVIEW' | 'PROTOTYPE'
  | 'TESTED' | 'APPROVED_DEFINITION' | 'RELEASED_FOR_PRODUCTION'
  | 'RETIRED' | 'SUPERSEDED';

type ProductDefinitionRevision = Scope & {
  id: string; productId: string; previousRevisionId: string | null;
  mode: DevelopmentMode; lifecycle: TechnicalLifecycle;
  requirements: Array<{ id: string; sourceEvidenceId: string; text: string }>;
  // Descriptive engineering references only until that owner is implemented.
  engineeringDefinitionRef: string | null;
  catalogPublicationRef: RecordRevision | null;
};

type ProcessProfileVersion = Scope & {
  id: string; previousVersionId: string | null;
  producerRef: string; facilityRef: string; method: string;
  productDefinitionRevisionId: string; variantId: string;
  substrateRef: string; zoneRevisionRef: RecordRevision;
  outputContractRef: string; evidenceIds: string[];
  verification: 'UNVERIFIED' | 'QUALIFIED_REVIEW' | 'PHYSICAL_VERIFIED';
  validFrom: string; validUntil: string;
};

type MethodInterpretation = Scope & {
  id: string; masterDesignVersionId: string; masterHash: string;
  productDefinitionRevisionId: string; variantId: string;
  configurationRevisionRef: RecordRevision;
  profileVersionId: string; interpretationVersion: string;
  artifactIds: string[]; manifestHash: string;
  checks: Array<{ code: string; result: 'PASS' | 'FAIL' | 'UNVERIFIED';
    evidenceId: string | null; reviewerId: string | null }>;
  productionReleaseId: string | null;
};

type VisualizationReference = Scope & {
  assetId: string; productDefinitionRevisionId: string; variantId: string;
  interpretationId: string | null;
  kind: 'PRODUCT_MOCKUP' | 'PROCESS_APPROXIMATION'
    | 'ENGINEERING_SIMULATION' | 'PHYSICAL_VERIFIED';
  geometryRevisionHash: string; evidenceIds: string[];
};
```

Producer, facility, substrate, zone, configuration and engineering references must become typed scoped foreign keys to their actual owning records before persistence. Strings above are unresolved owner contracts, not permission to create unrestricted polymorphic links. If the producer/facility identity is unknown, a profile remains UNVERIFIED. A nullable engineering reference does not implement CAD/PLM.

## Additive SQL shape to validate before migration

Use the existing domain tables/FKs, with only the missing immutable revision/profile/interpretation joins. Example constraints for the next reviewed migration:

```sql
-- Proposal only: owned by Catalog/production/Creative respectively.
-- product_definition_revisions: scoped product FK, predecessor FK,
-- immutable hash, explicit development mode + technical lifecycle evidence.
-- process_profile_versions: scoped definition/variant, producer/facility,
-- substrate/zone revision FKs, evidence, output contract and validity.
-- method_interpretations: scoped design_version + definition/variant/profile,
-- configuration revision, immutable manifest hash and technical checks.

-- Every existing endpoint is scoped, for example:
foreign key (tenant_id, workspace_id, master_design_version_id)
  references app.design_versions(tenant_id, workspace_id, id);
foreign key (tenant_id, workspace_id, product_id, variant_id)
  references app.variants(tenant_id, workspace_id, product_id, id);
```

Review the lifecycle storage carefully: immutable definition contents and append-only review/release decisions should be separate from a derived current-state projection. A lifecycle enum on a mutable content blob is insufficient. No production release can be created simply by setting the enum. New rows get forced RLS and domain/action permissions; no automatic backfill of approvals or profile validity. Rollback disables consumers and preserves history.

## Existing 2D document compatibility

Keep the V1 normalized 0–1000 layer coordinates and explicit physical millimeters. The adapter labels legacy documents `design-document/1` without changing bytes or hashes. A later version adds typed vector roles, licensed font identity, transforms and original color intent with explicit approximations per output route. It retains the original and creates immutable method interpretations. It never converts a raster trace or generic text object into an engineering or manufacturing approval.

Before the adapter is used for production, fix the actual saved-project variant rebinding and design-version product/variant columns, scope proof deduplication by exact version/specification identity, and verify approval invalidation when any manufacturing input changes. Catalog publication changes, technical changes and customer visual decisions remain independent.

## Four bounded pilots and evidence exits

| Pilot | Reused records / deliverable | Required evidence before any production claim |
| --- | --- | --- |
| 48 embroidered caps | Existing RFQ/quote, exact cap variant, design/proof; blank + decorator route proposal | Actual producer cap/zone/fabric/hoop profile, digitization and sew-out, current complete costs, inventory/delivery, qualified release. No invented stitch rules. |
| Printed/cut sticker | Product configuration, master design, separate print/cut interpretation references | Exact substrate/adhesive/application, producer contour/bleed/spot semantics and registration acceptance; PDF/SVG existence alone does not pass. |
| Brochure | Stock/dimensions/pages/binding configuration, versioned art and proof | Producer output condition/ICC/PDF contract, trim/bleed/fonts/finishing checks, accepted file and attributable release. |
| Original retail prototype | Concept/requirements, component/BOM proposal, private design and optional visualization references, listing draft | Engineering owner and tests; manufacturer review and any applicable compliance evidence. No automatic fabrication, certification or independent-brand publication. |

Each pilot needs deterministic synthetic fixtures, exact revision/identity mismatch failures, independent visual/technical/release states and an end-to-end demonstration through existing records. No synthetic sew-out, calibration, compliance certificate, actual cost or manufacturer acceptance is seeded as real evidence. None of the four production pilots is implemented by the M1 price ledger.

## Engine-selection gate

Evaluate one method at a time against the actual partner's accepted output. Record public API/format documentation, source/license/version (including copyleft/AGPL obligations where applicable), maintenance/security, fixture fidelity, manufacturer/physical acceptance, service cost and measured operator time. Embroidery, print preflight/color, cut paths/tooling, CAD/BOM and 3D/UV are different contracts. Do not choose another language, GPU service or paid tool merely because one is common in that field.

The present architecture has no selected engine, approved integration license or producer acceptance for those capabilities. [The initial public-source comparison](ENGINE_RESEARCH.md) records documented license facts and unresolved evidence; it does not establish production suitability. Keep advanced capabilities Coming Soon and retain the V1 launch gates independently.
