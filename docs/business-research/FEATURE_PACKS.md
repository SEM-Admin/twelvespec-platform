# Original feature implementation packs

35 feature packs, 104 proposed behavior tests. **All are design work; none is newly implemented or test-passed by this research.** Existing code and test paths are starting points. Conceptual commands/events require alignment with the existing server and event registry before implementation.

| ID | Feature | Priority | Scope | Gap work |
| --- | --- | --- | --- | --- |
| [F01](#f01) | Guided discovery and assisted handoff | P1 | ACTIVE_V1_DESIGN | GAP-016, GAP-028, GAP-033, GAP-038 |
| [F02](#f02) | Dependent options and apparel quantity matrix | P1 | ACTIVE_V1_DESIGN | GAP-010, GAP-014, GAP-017, GAP-038 |
| [F03](#f03) | Canonical products, supplier offers and media rights | P0 | ACTIVE_V1_DESIGN | GAP-014, GAP-015, GAP-016 |
| [F04](#f04) | Component pricing with quantity precision | P0 | ACTIVE_V1_DESIGN | GAP-010, GAP-013, GAP-027 |
| [F05](#f05) | Shared 2D design project and private assets | P0 | ACTIVE_V1_DESIGN | GAP-003, GAP-009, GAP-017, GAP-019 |
| [F06](#f06) | Brand-controlled editable templates | P1 | ACTIVE_V1_DESIGN | GAP-011, GAP-017, GAP-019, GAP-029 |
| [F07](#f07) | Version-bound proof and method-specific prepress | P0 | ACTIVE_V1_DESIGN | GAP-009, GAP-018, GAP-024 |
| [F08](#f08) | Assisted RFQ and commercial intake | P1 | ACTIVE_V1_DESIGN | GAP-013, GAP-028, GAP-038 |
| [F09](#f09) | B2B company, location and buyer permissions | P0 | ACTIVE_V1_DESIGN | GAP-005, GAP-006, GAP-011, GAP-028, GAP-032 |
| [F10](#f10) | Company-store budgets through checkout | P0 | ACTIVE_V1_DESIGN | GAP-006, GAP-011, GAP-013 |
| [F11](#f11) | Campaign close and group quantity collection | P1 | ACTIVE_V1_DESIGN | GAP-011, GAP-024, GAP-031 |
| [F12](#f12) | Redemption and allowance identity | P1 | ACTIVE_V1_DESIGN | GAP-011, GAP-013, GAP-027 |
| [F13](#f13) | BYOB kits with assembly and multi-source cost | P0 | ACTIVE_V1_DESIGN | GAP-010, GAP-012, GAP-024, GAP-026 |
| [F14](#f14) | Immutable quote, acceptance and approved terms | P0 | ACTIVE_V1_DESIGN | GAP-005, GAP-006, GAP-010, GAP-013, GAP-032 |
| [F15](#f15) | Saved carts, account history and safe reorder | P1 | ACTIVE_V1_DESIGN | GAP-008, GAP-009, GAP-011, GAP-013, GAP-038 |
| [F16](#f16) | Nontechnical Integration Center wizard | P0 | ACTIVE_V1_DESIGN | GAP-004, GAP-005, GAP-020, GAP-021, GAP-022, GAP-034 |
| [F17](#f17) | CSV/XML mapping, staged review and rollback | P1 | ACTIVE_V1_DESIGN | GAP-014, GAP-015, GAP-016, GAP-022 |
| [F18](#f18) | Independent inventory, pricing and status freshness | P1 | ACTIVE_V1_DESIGN | GAP-007, GAP-010, GAP-020, GAP-022 |
| [F19](#f19) | Provider-neutral POD routing proposals | P1 | ACTIVE_V1_DESIGN | GAP-010, GAP-020, GAP-024, GAP-025, GAP-036 |
| [F20](#f20) | Per-line job orchestration and holds | P0 | ACTIVE_V1_DESIGN | GAP-006, GAP-007, GAP-018, GAP-024, GAP-025, GAP-026 |
| [F21](#f21) | Purchase approvals and uncertain outcome reconciliation | P0 | ACTIVE_V1_DESIGN | GAP-005, GAP-006, GAP-013, GAP-025, GAP-027 |
| [F22](#f22) | Split shipments, blind shipping and tracking | P1 | ACTIVE_V1_DESIGN | GAP-024, GAP-026, GAP-036 |
| [F23](#f23) | Returns, claims, remakes and customer resolution | P1 | ACTIVE_V1_DESIGN | GAP-026, GAP-027, GAP-028 |
| [F24](#f24) | Estimated versus actual direct profit and references | P1 | ACTIVE_V1_DESIGN | GAP-010, GAP-013, GAP-027, GAP-030, GAP-036 |
| [F25](#f25) | CMS, licensed assets and controlled marketing | P1 | ACTIVE_V1_DESIGN | GAP-005, GAP-016, GAP-019, GAP-029 |
| [F26](#f26) | Versioned automation with a durable event contract | P0 | ACTIVE_V1_DESIGN | GAP-007, GAP-028, GAP-029, GAP-031, GAP-035 |
| [F27](#f27) | Operational dashboard and full-dataset analytics | P1 | ACTIVE_V1_DESIGN | GAP-008, GAP-027, GAP-028, GAP-030, GAP-033 |
| [F28](#f28) | Administration, delegated authority and audit | P0 | ACTIVE_V1_DESIGN | GAP-004, GAP-005, GAP-006, GAP-032, GAP-034, GAP-035 |
| [F29](#f29) | Direct supplier standards and licensed ASI interfaces | P1 | ACTIVE_V1_DESIGN | GAP-004, GAP-020, GAP-021, GAP-022, GAP-023, GAP-034 |
| [F30](#f30) | Complete usable screens and query behavior | P1 | ACTIVE_V1_DESIGN | GAP-008, GAP-033, GAP-038, GAP-039 |
| [F31](#f31) | Print-specific specifications and file roles | P1 | ACTIVE_V1_DESIGN | GAP-009, GAP-017, GAP-018, GAP-024 |
| [F32](#f32) | Durable development, storage and recovery foundations | P0 | ACTIVE_V1_DESIGN | GAP-002, GAP-003, GAP-004, GAP-007, GAP-034, GAP-035, GAP-037, GAP-039, GAP-040 |
| [F33](#f33) | Reserved future capabilities | RESERVED | COMING_SOON_ONLY | GAP-001, GAP-032, GAP-038, GAP-040 |
| [F34](#f34) | CRM relationships, ownership and follow-through | P1 | ACTIVE_V1_DESIGN | GAP-005, GAP-028, GAP-029, GAP-030, GAP-038 |
| [F35](#f35) | Production execution and quality checkpoints | P1 | ACTIVE_V1_DESIGN | GAP-018, GAP-024, GAP-025, GAP-026, GAP-030 |

<a id="f01"></a>
## F01 — Guided discovery and assisted handoff

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Custom Ink, Imprint.com, 4imprint.
**Sources:** [S01: Custom Ink: how it works](https://www.customink.com/how-it-works), [S08: Imprint.com catalog and design assistance](https://imprint.com/), [S11: 4imprint ordering, proof, payment and delivery FAQ](https://www.4imprint.com/info/faq).

**Customer flow:** Browse by product or purpose, filter available variants, save a shortlist and ask for help without retyping selections.

**Operator flow:** Receive the same configuration, deadline and customer context in an assigned inquiry queue.

**Logical records:** `catalog_query`, `saved_shortlist`, `inquiry`, `account_assignment`.

**Required rules and edge handling:**

- Search and counts use server pagination across the entire scoped catalog.
- A failed query is an error state, not an empty catalog.
- Anonymous discovery never reveals source costs or credentials.

**Proposed commands:** `catalog.search`, `inquiry.submit`.
**Proposed events:** `inquiry.submitted`.

**Behavioral acceptance additions — NOT RUN:**

- **F01-T01:** Given more than 1,000 variants, a matching item beyond the first page is discoverable.
- **F01-T02:** Submitting twice with the same request key creates one inquiry.
- **F01-T03:** A customer response contains no supplier costs or credential fields.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/catalog/src/index.ts](../../packages/catalog/src/index.ts), [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts), [packages/crm/src/index.ts](../../packages/crm/src/index.ts).

**Existing tests to extend:** [tests/modules/catalog.test.ts](../../tests/modules/catalog.test.ts), [tests/modules/commerce.test.ts](../../tests/modules/commerce.test.ts), [tests/modules/crm.test.ts](../../tests/modules/crm.test.ts).

**Gap work:** GAP-016, GAP-028, GAP-033, GAP-038. **Modules:** catalog, commerce, crm.
**Original acceptance dependencies:** A01, A09, A10, A15, A18, A31, A37, A38, E01, E03, E15, E16, E23, T02, T06, T22, T24, T28, T29, T30.

<a id="f02"></a>
## F02 — Dependent options and apparel quantity matrix

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Custom Ink, Imprint.com, SanMar.
**Sources:** [S01: Custom Ink: how it works](https://www.customink.com/how-it-works), [S09: Imprint.com pricing factors](https://imprint.com/help-center/faq-how-is-my-price-determined), [S06: SanMar electronic integration offerings](https://www.sanmar.com/resources/electronicintegration/integrationofferings).

**Customer flow:** Choose product, color, size quantities, method and location; incompatible selections explain what must change.

**Operator flow:** Preview and publish a versioned family rule set with exact imprint zones and minimum/increment rules.

**Logical records:** `configuration_family`, `variant`, `option_group`, `option_constraint`, `imprint_area`, `saved_configuration`.

**Required rules and edge handling:**

- Size rows resolve to exact canonical variants; a family selection is not a purchasable SKU.
- Quantity breaks use the configured grouping rule; mixed methods or artworks do not silently share a tier.
- A product or template change invalidates prior configuration approval.

**Proposed commands:** `configuration.validate`, `configuration.save`, `configuration.publish_revision`.
**Proposed events:** `configuration.validated`.

**Behavioral acceptance additions — NOT RUN:**

- **F02-T01:** A disallowed method/location combination cannot enter the cart.
- **F02-T02:** A size matrix with a missing price stays quote-only.
- **F02-T03:** Changing the template leaves an issued order’s snapshot unchanged.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/catalog/src/index.ts](../../packages/catalog/src/index.ts), [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts), [packages/configuration/src/index.ts](../../packages/configuration/src/index.ts), [packages/estimating/src/index.ts](../../packages/estimating/src/index.ts).

**Existing tests to extend:** [tests/modules/catalog.test.ts](../../tests/modules/catalog.test.ts), [tests/modules/commerce.test.ts](../../tests/modules/commerce.test.ts), [tests/modules/configuration.test.ts](../../tests/modules/configuration.test.ts), [tests/modules/estimating.test.ts](../../tests/modules/estimating.test.ts).

**Gap work:** GAP-010, GAP-014, GAP-017, GAP-038. **Modules:** configuration, catalog, commerce, estimating.
**Original acceptance dependencies:** A01, A05, A07, A08, A09, A10, A11, A12, A13, A16, A18, A19, A24, A28, A30, A37, A38, E01, E02, E03, E04, E05, E06, E07, E13, E14, E16, T02, T03, T06, T07, T09, T10, T15, T18, T21, T24, T28, T30.

<a id="f03"></a>
## F03 — Canonical products, supplier offers and media rights

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** PCNA, SanMar, SinaLite, GotPrint.
**Sources:** [S03: PCNA authorized distributor account application](https://cloud.engage.pcna.com/account_application), [S06: SanMar electronic integration offerings](https://www.sanmar.com/resources/electronicintegration/integrationofferings), [S07: SanMar terms and conditions](https://info.sanmar.com/termsandconditions), [S32: SinaLite basic and full API integration options](https://sinalite.com/en_us/api-signup), [S38: GotPrint API terms and licensing](https://www.gotprint.com/company/terms/api.html).

**Customer flow:** See one truthful product identity with its available variants and permitted images.

**Operator flow:** Compare multiple source offers, resolve uncertain matches, approve publication and inspect field provenance.

**Logical records:** `product`, `variant`, `external_product`, `external_part`, `supplier_offer`, `field_provenance`, `media_license`, `publication_revision`.

**Required rules and edge handling:**

- Supplier part identifiers are scoped to connection and provider.
- Ambiguous matches enter a review queue; title similarity alone never merges products.
- Disabled, rolled-back, expired or unlicensed offers cannot supply a new commercial price.

**Proposed commands:** `catalog.propose_match`, `catalog.approve_match`, `catalog.publish_revision`.
**Proposed events:** `catalog.source_mapped`, `catalog.publication_changed`.

**Behavioral acceptance additions — NOT RUN:**

- **F03-T01:** Two providers with the same SKU string remain distinct source parts.
- **F03-T02:** Rolling back an import makes its new offers ineligible for quoting.
- **F03-T03:** An image with expired channel rights is absent from the customer projection.

**Existing code to extend:** [apps/os/components/integrations.tsx](../../apps/os/components/integrations.tsx), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/catalog/src/index.ts](../../packages/catalog/src/index.ts), [packages/providers/src/index.ts](../../packages/providers/src/index.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts).

**Existing tests to extend:** [tests/modules/catalog.test.ts](../../tests/modules/catalog.test.ts), [tests/modules/supplier.test.ts](../../tests/modules/supplier.test.ts).

**Gap work:** GAP-014, GAP-015, GAP-016. **Modules:** catalog, supplier.
**Original acceptance dependencies:** A05, A06, A07, A08, A09, A10, A15, A38, E01, E03, E04, E05, E16, T02, T06, T07, T09, T24, T29.

<a id="f04"></a>
## F04 — Component pricing with quantity precision

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Imprint.com, PCNA, Printify, 4over.
**Sources:** [S09: Imprint.com pricing factors](https://imprint.com/help-center/faq-how-is-my-price-determined), [S12: Printify API reference](https://developers.printify.com/), [S35: 4over trade resources and API program](https://blog.4over.com/5-ways-4over-helps-you-sell).

**Customer flow:** See a quantity comparison and clear quote-only reasons for incomplete costs.

**Operator flow:** Compare landed costs and apply the versioned margin policy with an audited exception flow.

**Logical records:** `cost_component`, `price_break`, `price_snapshot`, `margin_policy`, `override_approval`, `currency`.

**Required rules and edge handling:**

- Preserve supplier unit precision until quantity extension; round commercial totals by policy.
- Missing freight, setup, decoration or currency is unknown, not zero.
- Target margin uses cost/(1-margin); a 40% markup is not a 40% margin.
- Tax collected for remittance is excluded from margin revenue.

**Proposed commands:** `estimate.calculate`, `estimate.request_override`, `estimate.freeze`.
**Proposed events:** `estimate.calculated`, `margin_override.requested`.

**Behavioral acceptance additions — NOT RUN:**

- **F04-T01:** Unit cost 0.0250 times quantity 1,000 extends to 25.00.
- **F04-T02:** An unknown freight cost blocks a firm checkout price.
- **F04-T03:** A below-floor quote cannot be issued without a valid scoped override.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/estimating/src/index.ts](../../packages/estimating/src/index.ts), [packages/finance/src/index.ts](../../packages/finance/src/index.ts), [packages/pricing/src/index.ts](../../packages/pricing/src/index.ts), [packages/sales/src/index.ts](../../packages/sales/src/index.ts).

**Existing tests to extend:** [tests/modules/estimating.test.ts](../../tests/modules/estimating.test.ts), [tests/modules/finance.test.ts](../../tests/modules/finance.test.ts), [tests/modules/sales.test.ts](../../tests/modules/sales.test.ts).

**Gap work:** GAP-010, GAP-013, GAP-027. **Modules:** estimating, sales, finance.
**Original acceptance dependencies:** A11, A12, A18, A19, A20, A24, A26, A27, A28, A29, A30, A35, E02, E06, E07, E08, E09, E14, E15, E19, E21, E22, E25, T03, T09, T10, T11, T12, T15, T16, T17, T18, T21, T30.

<a id="f05"></a>
## F05 — Shared 2D design project and private assets

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Custom Ink, Imprint.com, VistaPrint, PrintNow.
**Sources:** [S01: Custom Ink: how it works](https://www.customink.com/how-it-works), [S08: Imprint.com catalog and design assistance](https://imprint.com/), [S18: VistaPrint downloadable design proofs](https://www.vistaprint.com/customer-care/help-center/360052259371/), [S16: PrintNow Enterprise API introduction](https://docs.printnow.com/docs/enterprise-api/introduction).

**Customer flow:** Customize text and artwork on a product-specific 2D canvas, save a project and resume it on another device.

**Operator flow:** Open the same project, adjust with permission and produce a new revision with an attributable history.

**Logical records:** `design_project`, `design_version`, `design_layer`, `artwork_asset`, `derivative_asset`, `project_share`.

**Required rules and edge handling:**

- The project binds product, variant, method, location and template revision.
- Each save creates an immutable revision; assets use private durable storage.
- Changing a saved color or size rebinds the project and invalidates approvals that no longer apply.

**Proposed commands:** `creative.create_project`, `creative.save_revision`, `creative.rebind_variant`, `creative.render_preview`.
**Proposed events:** `design.version_created`, `render.requested`.

**Behavioral acceptance additions — NOT RUN:**

- **F05-T01:** Saving then changing the cap color creates a correctly bound project/revision.
- **F05-T02:** A collaborator from another workspace cannot read a private asset.
- **F05-T03:** An interrupted render can resume without losing the saved design.

**Existing code to extend:** [apps/os/components/studio.tsx](../../apps/os/components/studio.tsx), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/app/[[...path]]/page.tsx](../../apps/shop/app/[[...path]]/page.tsx), [apps/shop/components/designer.tsx](../../apps/shop/components/designer.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts), [packages/configuration/src/index.ts](../../packages/configuration/src/index.ts), [packages/creative/src/index.ts](../../packages/creative/src/index.ts).

**Existing tests to extend:** [tests/modules/commerce.test.ts](../../tests/modules/commerce.test.ts), [tests/modules/configuration.test.ts](../../tests/modules/configuration.test.ts), [tests/modules/creative.test.ts](../../tests/modules/creative.test.ts).

**Gap work:** GAP-003, GAP-009, GAP-017, GAP-019. **Modules:** creative, configuration, commerce.
**Original acceptance dependencies:** A09, A12, A13, A14, A15, A16, A17, A20, A37, A39, E02, E05, E08, E13, E14, E15, E16, E17, T02, T03, T04, T05, T06, T11, T12, T15, T29.

<a id="f06"></a>
## F06 — Brand-controlled editable templates

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** PrintNow, OrderMyGear, VistaPrint.
**Sources:** [S16: PrintNow Enterprise API introduction](https://docs.printnow.com/docs/enterprise-api/introduction), [S14: OrderMyGear online store types and controls](https://www.ordermygear.com/online-stores/), [S18: VistaPrint downloadable design proofs](https://www.vistaprint.com/customer-care/help-center/360052259371/).

**Customer flow:** Choose an approved company template and edit only permitted text, image and color fields.

**Operator flow:** Lock logo placement, set fonts and color rules, preview changes, then publish a new template version.

**Logical records:** `brand_kit`, `brand_asset`, `editable_field`, `template_revision`, `template_assignment`.

**Required rules and edge handling:**

- A customer cannot unlock a protected field through a crafted API request.
- Font and asset rights are checked before publication or export.
- Template updates do not silently replace issued proofs or accepted specifications.

**Proposed commands:** `template.create_revision`, `template.validate`, `template.publish`, `template.assign`.
**Proposed events:** `template.published`.

**Behavioral acceptance additions — NOT RUN:**

- **F06-T01:** Changing a locked logo layer is rejected server-side.
- **F06-T02:** An invalid text overflow is reported before save or proof generation.
- **F06-T03:** A new template revision preserves existing accepted order artifacts.

**Existing code to extend:** [apps/os/components/studio.tsx](../../apps/os/components/studio.tsx), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/app/[[...path]]/page.tsx](../../apps/shop/app/[[...path]]/page.tsx), [apps/shop/components/designer.tsx](../../apps/shop/components/designer.tsx), [apps/shop/components/programs.tsx](../../apps/shop/components/programs.tsx), [packages/configuration/src/index.ts](../../packages/configuration/src/index.ts), [packages/creative/src/index.ts](../../packages/creative/src/index.ts), [packages/marketing/src/index.ts](../../packages/marketing/src/index.ts), [packages/stores/src/index.ts](../../packages/stores/src/index.ts).

**Existing tests to extend:** [tests/modules/configuration.test.ts](../../tests/modules/configuration.test.ts), [tests/modules/creative.test.ts](../../tests/modules/creative.test.ts), [tests/modules/marketing.test.ts](../../tests/modules/marketing.test.ts), [tests/modules/stores.test.ts](../../tests/modules/stores.test.ts).

**Gap work:** GAP-011, GAP-017, GAP-019, GAP-029. **Modules:** creative, stores, configuration, marketing.
**Original acceptance dependencies:** A09, A12, A13, A14, A15, A16, A26, A27, A31, A37, E02, E05, E13, E14, E16, T03, T04, T05, T06, T12, T15, T16, T17, T22, T29.

<a id="f07"></a>
## F07 — Version-bound proof and method-specific prepress

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** 4imprint, VistaPrint, Smartpress, Imprint.com.
**Sources:** [S11: 4imprint ordering, proof, payment and delivery FAQ](https://www.4imprint.com/info/faq), [S18: VistaPrint downloadable design proofs](https://www.vistaprint.com/customer-care/help-center/360052259371/), [S31: Smartpress turnaround after proof approval](https://smartpress.com/support/ordering-shipping/printing-turnaround-time), [S10: Imprint.com proof eligibility](https://imprint.com/help-center/will-i-get-a-proof-to-review-before-my-order-is-printed).

**Customer flow:** Review the exact configured item, request a revision or approve a named proof version and download the artifact.

**Operator flow:** Run method-specific checks and record qualified manual review for checks that cannot be automated.

**Logical records:** `proof_revision`, `proof_decision`, `preflight_report`, `review_check`, `production_artifact`.

**Required rules and edge handling:**

- Preview, customer proof approval and production preflight are independent gates.
- A proof hash alone is insufficient: product, variant, design, method and location must also match.
- No unconditional pass is allowed; unresolved review stays blocked.
- Changes to the relevant content or specifications revoke affected approvals.

**Proposed commands:** `proof.generate`, `proof.approve`, `proof.request_changes`, `preflight.record_review`.
**Proposed events:** `proof.approved`, `preflight.completed`.

**Behavioral acceptance additions — NOT RUN:**

- **F07-T01:** A proof from another product with the same artwork hash is rejected.
- **F07-T02:** Editing artwork after approval blocks production release.
- **F07-T03:** An authorized manual review records reviewer, checks, evidence and exact revision.

**Existing code to extend:** [apps/os/components/studio.tsx](../../apps/os/components/studio.tsx), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/app/[[...path]]/page.tsx](../../apps/shop/app/[[...path]]/page.tsx), [apps/shop/components/designer.tsx](../../apps/shop/components/designer.tsx), [packages/creative/src/index.ts](../../packages/creative/src/index.ts), [packages/fulfillment/src/index.ts](../../packages/fulfillment/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts), [packages/production/src/index.ts](../../packages/production/src/index.ts).

**Existing tests to extend:** [tests/modules/creative.test.ts](../../tests/modules/creative.test.ts), [tests/modules/fulfillment.test.ts](../../tests/modules/fulfillment.test.ts), [tests/modules/orders.test.ts](../../tests/modules/orders.test.ts).

**Gap work:** GAP-009, GAP-018, GAP-024. **Modules:** creative, orders, fulfillment.
**Original acceptance dependencies:** A09, A13, A14, A16, A17, A20, A21, A23, A24, A28, E02, E08, E10, E11, E12, E13, E15, E22, T02, T04, T05, T11, T12, T13, T14, T18, T19, T30.

<a id="f08"></a>
## F08 — Assisted RFQ and commercial intake

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** 4imprint, Custom Ink, Smartpress.
**Sources:** [S11: 4imprint ordering, proof, payment and delivery FAQ](https://www.4imprint.com/info/faq), [S01: Custom Ink: how it works](https://www.customink.com/how-it-works), [S30: Smartpress reseller program and blind shipping](https://smartpress.com/pages/print-reseller-program).

**Customer flow:** Request a quote using saved selections, artwork, intended quantity, destination and required in-hand date.

**Operator flow:** Assign a rep, identify missing information, compare supplier alternatives and issue a clear revision.

**Logical records:** `request`, `request_line`, `requirement_question`, `quote_revision`, `sales_task`.

**Required rules and edge handling:**

- Request submission creates no supplier spend or false paid order.
- Request revisions preserve what changed and who answered.
- A supplier estimate expires independently from a customer quote.

**Proposed commands:** `request.submit`, `request.assign`, `request.request_information`, `quote.prepare_revision`.
**Proposed events:** `request.submitted`, `quote.revision_prepared`.

**Behavioral acceptance additions — NOT RUN:**

- **F08-T01:** Missing destination is visible as a freight uncertainty.
- **F08-T02:** Duplicate RFQ submission produces one durable request.
- **F08-T03:** An expired supplier estimate forces repricing before a new firm quote.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/crm/src/index.ts](../../packages/crm/src/index.ts), [packages/estimating/src/index.ts](../../packages/estimating/src/index.ts), [packages/sales/src/index.ts](../../packages/sales/src/index.ts).

**Existing tests to extend:** [tests/modules/crm.test.ts](../../tests/modules/crm.test.ts), [tests/modules/estimating.test.ts](../../tests/modules/estimating.test.ts), [tests/modules/sales.test.ts](../../tests/modules/sales.test.ts).

**Gap work:** GAP-013, GAP-028, GAP-038. **Modules:** crm, sales, estimating.
**Original acceptance dependencies:** A01, A11, A18, A19, A20, A26, A31, A37, E01, E02, E06, E07, E08, E09, E15, E16, E22, E25, T02, T06, T10, T11, T12, T16, T21, T22, T28, T30.

<a id="f09"></a>
## F09 — B2B company, location and buyer permissions

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Shopify, BigCommerce, OrderMyGear.
**Sources:** [S23: Shopify B2B feature availability by plan](https://help.shopify.com/en/manual/b2b/getting-started/plan-features), [S24: Shopify B2B development model](https://shopify.dev/docs/apps/build/b2b), [S25: BigCommerce B2B integration overview](https://docs.bigcommerce.com/developer/docs/b2b-edition/getting-started/overview), [S14: OrderMyGear online store types and controls](https://www.ordermygear.com/online-stores/).

**Customer flow:** Order for an authorized company location, use approved addresses and see only permitted catalogs and terms.

**Operator flow:** Manage company members, buyer roles, locations and approval limits independently from staff permissions.

**Logical records:** `company`, `company_location`, `company_contact`, `location_membership`, `catalog_assignment`, `terms_approval`.

**Required rules and edge handling:**

- Tenant/workspace scope and company/location grants are both required.
- A contact may belong to multiple companies without sharing their private orders.
- Buyer administrator privileges never imply TwelveSpec staff or finance privileges.

**Proposed commands:** `company.invite_member`, `company.assign_location`, `company.grant_buyer_role`.
**Proposed events:** `company.membership_changed`.

**Behavioral acceptance additions — NOT RUN:**

- **F09-T01:** A buyer for location A cannot view location B’s restricted quote.
- **F09-T02:** Revoking a membership invalidates subsequent protected actions.
- **F09-T03:** An address ID from another company is rejected.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/programs.tsx](../../apps/shop/components/programs.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts), [packages/crm/src/index.ts](../../packages/crm/src/index.ts), [packages/foundation/src/index.ts](../../packages/foundation/src/index.ts), [packages/stores/src/index.ts](../../packages/stores/src/index.ts).

**Existing tests to extend:** [tests/modules/commerce.test.ts](../../tests/modules/commerce.test.ts), [tests/modules/crm.test.ts](../../tests/modules/crm.test.ts), [tests/modules/foundation.test.ts](../../tests/modules/foundation.test.ts), [tests/modules/stores.test.ts](../../tests/modules/stores.test.ts).

**Gap work:** GAP-005, GAP-006, GAP-011, GAP-028, GAP-032. **Modules:** crm, stores, foundation, commerce.
**Original acceptance dependencies:** A02, A10, A18, A19, A20, A26, A27, A29, A31, A36, A40, E02, E07, E08, E17, E18, E20, E24, E25, T11, T12, T16, T17, T22, T25, T26.

<a id="f10"></a>
## F10 — Company-store budgets through checkout

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** OrderMyGear, Shopify.
**Sources:** [S14: OrderMyGear online store types and controls](https://www.ordermygear.com/online-stores/), [S15: OrderMyGear FAQs and fulfillment responsibility](https://www.ordermygear.com/faqs/), [S23: Shopify B2B feature availability by plan](https://help.shopify.com/en/manual/b2b/getting-started/plan-features).

**Customer flow:** Shop a permitted company catalog, see remaining allowance and submit any required manager approval.

**Operator flow:** Reserve budget against an exact agreement, approve within limits, release on cancellation and reconcile actual usage.

**Logical records:** `store_program`, `store_membership`, `budget`, `budget_reservation`, `approval_request`, `agreement_context`.

**Required rules and edge handling:**

- Store, brand kit, budget and membership identity survive cart → RFQ → quote → order.
- Reservation and acceptance are atomic; concurrent buyers cannot overspend.
- Cancel/expiry releases a reservation exactly once; fulfillment converts commitment under the approved policy.

**Proposed commands:** `store.validate_checkout`, `budget.reserve`, `budget.release`, `budget.commit`.
**Proposed events:** `budget.reserved`, `budget.released`, `budget.committed`.

**Behavioral acceptance additions — NOT RUN:**

- **F10-T01:** Two concurrent 60.00 orders against 100.00 cannot both reserve.
- **F10-T02:** A forged brand kit or store context fails at quote acceptance.
- **F10-T03:** A duplicate cancellation releases budget once.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/programs.tsx](../../apps/shop/components/programs.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts), [packages/finance/src/index.ts](../../packages/finance/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts), [packages/production/src/index.ts](../../packages/production/src/index.ts), [packages/sales/src/index.ts](../../packages/sales/src/index.ts), [packages/stores/src/index.ts](../../packages/stores/src/index.ts).

**Existing tests to extend:** [tests/modules/commerce.test.ts](../../tests/modules/commerce.test.ts), [tests/modules/finance.test.ts](../../tests/modules/finance.test.ts), [tests/modules/orders.test.ts](../../tests/modules/orders.test.ts), [tests/modules/sales.test.ts](../../tests/modules/sales.test.ts), [tests/modules/stores.test.ts](../../tests/modules/stores.test.ts).

**Gap work:** GAP-006, GAP-011, GAP-013. **Modules:** stores, commerce, sales, orders, finance.
**Original acceptance dependencies:** A02, A10, A11, A18, A19, A20, A26, A27, A29, A40, E02, E06, E07, E08, E09, E15, E18, E22, E25, T10, T11, T12, T16, T17, T21, T25, T30.

<a id="f11"></a>
## F11 — Campaign close and group quantity collection

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Custom Ink, OrderMyGear.
**Sources:** [S02: Collect sizes and payments with a group form](https://www.customink.com/help_center/collecting-sizes-and-payment-with-gof), [S14: OrderMyGear online store types and controls](https://www.ordermygear.com/online-stores/), [S15: OrderMyGear FAQs and fulfillment responsibility](https://www.ordermygear.com/faqs/).

**Customer flow:** Enter eligible size/variant choices before a clearly displayed campaign close time.

**Operator flow:** Review participation, resolve minimums and exceptions, close the campaign and create reviewed production batches.

**Logical records:** `campaign`, `participant_selection`, `campaign_close_revision`, `batch_requirement`.

**Required rules and edge handling:**

- Campaign close uses a stored timezone and server clock.
- Minimum quantity failure creates a decision queue, never an unapproved purchase.
- Fundraising allocation is a reference; complex fund settlement remains disabled.

**Proposed commands:** `campaign.submit_selection`, `campaign.close`, `campaign.propose_batch`.
**Proposed events:** `campaign.closed`, `campaign.batch_proposed`.

**Behavioral acceptance additions — NOT RUN:**

- **F11-T01:** A selection after the close boundary is rejected.
- **F11-T02:** Repeating close does not create duplicate production batches.
- **F11-T03:** A below-minimum campaign opens a hold rather than charging or purchasing.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/programs.tsx](../../apps/shop/components/programs.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts), [packages/production/src/index.ts](../../packages/production/src/index.ts), [packages/stores/src/index.ts](../../packages/stores/src/index.ts).

**Existing tests to extend:** [tests/modules/commerce.test.ts](../../tests/modules/commerce.test.ts), [tests/modules/orders.test.ts](../../tests/modules/orders.test.ts), [tests/modules/stores.test.ts](../../tests/modules/stores.test.ts).

**Gap work:** GAP-011, GAP-024, GAP-031. **Modules:** stores, commerce, orders.
**Original acceptance dependencies:** A21, A23, A24, A26, A27, A28, A32, E02, E10, E12, E22, T12, T13, T16, T17, T18, T19, T23, T27, T30.

<a id="f12"></a>
## F12 — Redemption and allowance identity

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** OrderMyGear.
**Sources:** [S14: OrderMyGear online store types and controls](https://www.ordermygear.com/online-stores/), [S15: OrderMyGear FAQs and fulfillment responsibility](https://www.ordermygear.com/faqs/).

**Customer flow:** Redeem an eligible one-time allowance for approved items and see any policy-based balance.

**Operator flow:** Issue scoped grants with expiry, revoke unused grants and review redemption attempts.

**Logical records:** `redemption_grant`, `allowance`, `redemption_attempt`, `budget_reservation`.

**Required rules and edge handling:**

- Store only a hash of a secret redemption code.
- Redemption is atomically single-use or explicitly quantity-limited.
- Points and allowances are distinct from cash, processor payment and fundraiser settlement.

**Proposed commands:** `redemption.issue`, `redemption.redeem`, `redemption.revoke`.
**Proposed events:** `redemption.reserved`, `redemption.consumed`.

**Behavioral acceptance additions — NOT RUN:**

- **F12-T01:** Two simultaneous uses of a single-use code produce one reservation.
- **F12-T02:** A code for another program cannot buy an unassigned item.
- **F12-T03:** Expired grants fail without consuming allowance.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/programs.tsx](../../apps/shop/components/programs.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts), [packages/finance/src/index.ts](../../packages/finance/src/index.ts), [packages/stores/src/index.ts](../../packages/stores/src/index.ts).

**Existing tests to extend:** [tests/modules/commerce.test.ts](../../tests/modules/commerce.test.ts), [tests/modules/finance.test.ts](../../tests/modules/finance.test.ts), [tests/modules/stores.test.ts](../../tests/modules/stores.test.ts).

**Gap work:** GAP-011, GAP-013, GAP-027. **Modules:** stores, commerce, finance.
**Original acceptance dependencies:** A11, A18, A19, A20, A26, A27, A29, A30, A35, E02, E06, E07, E08, E09, E15, E19, E21, E22, E25, T10, T11, T12, T16, T17, T21, T30.

<a id="f13"></a>
## F13 — BYOB kits with assembly and multi-source cost

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** PCNA, OrderMyGear, Smartpress.
**Sources:** [S04: PCNA print and promo marketing page](https://cloud.engage.pcna.com/Print-Promo-Marketing), [S14: OrderMyGear online store types and controls](https://www.ordermygear.com/online-stores/), [S30: Smartpress reseller program and blind shipping](https://smartpress.com/pages/print-reseller-program).

**Customer flow:** Build an eligible kit with required and optional components, packaging and a truthful complete estimate.

**Operator flow:** Approve the bill of materials, source components, receive them, assemble and inspect the kit before dispatch.

**Logical records:** `bundle_template`, `kit_configuration`, `kit_component`, `packaging_requirement`, `assembly_operation`, `kit_job`.

**Required rules and edge handling:**

- Kit identity, quantities, packaging and labor survive commercial snapshots and job allocation.
- A component substitution creates a new kit revision and relevant reapproval.
- Dispatch waits for required components and assembly QC, not just the first source shipment.

**Proposed commands:** `bundle.validate`, `bundle.freeze`, `kit.allocate`, `assembly.complete`.
**Proposed events:** `kit.configured`, `kit.ready`.

**Behavioral acceptance additions — NOT RUN:**

- **F13-T01:** A cart round-trip retains kit identity and assembly charges.
- **F13-T02:** One missing component blocks a complete-kit shipment.
- **F13-T03:** Component quantity changes trigger full kit repricing.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/programs.tsx](../../apps/shop/components/programs.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/byob/src/index.ts](../../packages/byob/src/index.ts), [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts), [packages/estimating/src/index.ts](../../packages/estimating/src/index.ts), [packages/fulfillment/src/index.ts](../../packages/fulfillment/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts), [packages/production/src/index.ts](../../packages/production/src/index.ts).

**Existing tests to extend:** [tests/modules/byob.test.ts](../../tests/modules/byob.test.ts), [tests/modules/commerce.test.ts](../../tests/modules/commerce.test.ts), [tests/modules/estimating.test.ts](../../tests/modules/estimating.test.ts), [tests/modules/fulfillment.test.ts](../../tests/modules/fulfillment.test.ts), [tests/modules/orders.test.ts](../../tests/modules/orders.test.ts).

**Gap work:** GAP-010, GAP-012, GAP-024, GAP-026. **Modules:** byob, estimating, commerce, orders, fulfillment.
**Original acceptance dependencies:** A11, A12, A18, A19, A21, A23, A24, A25, A28, A30, E06, E07, E10, E12, E14, E22, T03, T09, T10, T13, T15, T18, T19, T20, T21, T30.

<a id="f14"></a>
## F14 — Immutable quote, acceptance and approved terms

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** BigCommerce, 4imprint, Shopify.
**Sources:** [S26: BigCommerce B2B API families and context](https://docs.bigcommerce.com/developer/docs/b2b-edition/getting-started/about-our-apis), [S11: 4imprint ordering, proof, payment and delivery FAQ](https://www.4imprint.com/info/faq), [S23: Shopify B2B feature availability by plan](https://help.shopify.com/en/manual/b2b/getting-started/plan-features).

**Customer flow:** Compare issued revisions, review seller and assumptions, then accept an unexpired agreement with approved payment terms.

**Operator flow:** Issue a frozen revision, obtain margin/credit approvals and verify customer acceptance independently from payment.

**Logical records:** `quote_revision`, `agreement_snapshot`, `seller_assignment`, `credit_approval`, `acceptance`, `payment_requirement`.

**Required rules and edge handling:**

- An accepted quote is immutable; any commercial change requires a new revision.
- Credit exposure aggregates relevant open obligations at acceptance.
- Handoff policy: first two orders prepaid; later Net 15 requires a qualifying approval.
- A browser return URL never establishes payment received.

**Proposed commands:** `quote.issue`, `quote.accept`, `quote.expire`, `credit.evaluate`.
**Proposed events:** `quote.issued`, `quote.accepted`.

**Behavioral acceptance additions — NOT RUN:**

- **F14-T01:** Acceptance after expiry fails even with a stale browser tab.
- **F14-T02:** Two concurrent orders cannot exceed the approved credit exposure.
- **F14-T03:** Changing seller, totals or specifications invalidates prior approval hashes.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/estimating/src/index.ts](../../packages/estimating/src/index.ts), [packages/finance/src/index.ts](../../packages/finance/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts), [packages/production/src/index.ts](../../packages/production/src/index.ts), [packages/sales/src/index.ts](../../packages/sales/src/index.ts).

**Existing tests to extend:** [tests/modules/estimating.test.ts](../../tests/modules/estimating.test.ts), [tests/modules/finance.test.ts](../../tests/modules/finance.test.ts), [tests/modules/orders.test.ts](../../tests/modules/orders.test.ts), [tests/modules/sales.test.ts](../../tests/modules/sales.test.ts).

**Gap work:** GAP-005, GAP-006, GAP-010, GAP-013, GAP-032. **Modules:** sales, estimating, orders, finance.
**Original acceptance dependencies:** A02, A10, A11, A12, A18, A19, A20, A24, A26, A28, A29, A30, A31, A36, A40, E02, E06, E07, E08, E09, E14, E15, E17, E18, E20, E22, E24, E25, T03, T09, T10, T11, T12, T15, T16, T18, T21, T25, T26, T30.

<a id="f15"></a>
## F15 — Saved carts, account history and safe reorder

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** VistaPrint, Smartpress, 4imprint.
**Sources:** [S19: VistaPrint order status and tracking](https://www.vistaprint.com/customer-care/help-center/360050082651/), [S30: Smartpress reseller program and blind shipping](https://smartpress.com/pages/print-reseller-program), [S11: 4imprint ordering, proof, payment and delivery FAQ](https://www.4imprint.com/info/faq).

**Customer flow:** Resume saved projects and carts, view order progress and start a reorder with a visible change summary.

**Operator flow:** Resolve unavailable parts, new pricing, altered brand rules or expired artwork permissions before issuing the reorder.

**Logical records:** `saved_cart`, `previous_order_reference`, `reorder_comparison`, `new_quote_revision`.

**Required rules and edge handling:**

- A reorder is a new draft and never reuses payment, supplier authorization or stale prices.
- Store and kit context are retained and revalidated.
- Previous artwork approval can be reused only under an explicit exact-match policy.

**Proposed commands:** `cart.save`, `order.propose_reorder`, `reorder.review_changes`.
**Proposed events:** `reorder.requested`.

**Behavioral acceptance additions — NOT RUN:**

- **F15-T01:** A discontinued prior variant becomes a visible exception.
- **F15-T02:** Current prices replace prior estimates only in the new draft.
- **F15-T03:** Customer B cannot reorder customer A’s private order.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/catalog/src/index.ts](../../packages/catalog/src/index.ts), [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts), [packages/sales/src/index.ts](../../packages/sales/src/index.ts).

**Existing tests to extend:** [tests/modules/catalog.test.ts](../../tests/modules/catalog.test.ts), [tests/modules/commerce.test.ts](../../tests/modules/commerce.test.ts), [tests/modules/sales.test.ts](../../tests/modules/sales.test.ts).

**Gap work:** GAP-008, GAP-009, GAP-011, GAP-013, GAP-038. **Modules:** commerce, catalog, sales.
**Original acceptance dependencies:** A01, A09, A11, A13, A14, A17, A18, A19, A20, A26, A27, A37, E01, E02, E06, E07, E08, E09, E15, E16, E22, E25, T02, T04, T05, T06, T10, T11, T12, T16, T17, T21, T28, T30.

<a id="f16"></a>
## F16 — Nontechnical Integration Center wizard

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** SanMar, PCNA, SinaLite, GotPrint.
**Sources:** [S06: SanMar electronic integration offerings](https://www.sanmar.com/resources/electronicintegration/integrationofferings), [S03: PCNA authorized distributor account application](https://cloud.engage.pcna.com/account_application), [S32: SinaLite basic and full API integration options](https://sinalite.com/en_us/api-signup), [S38: GotPrint API terms and licensing](https://www.gotprint.com/company/terms/api.html), [S39: PromoStandards interoperability purpose](https://promostandards.org/About-Us/).

**Customer flow:** Customer screens consume only published, approved data and never supplier configuration.

**Operator flow:** Choose supported provider → confirm entitlement → save masked credentials → test each capability → map sample → preview pricing/publication → schedule sync → activate approved operations.

**Logical records:** `connection`, `secret_handle`, `provider_profile`, `capability_verification`, `mapping_profile`, `sync_policy`, `activation_approval`.

**Required rules and edge handling:**

- No credentials in browser responses, logs, exports or public assets.
- Documented, mocked, sandbox-verified and live-verified operations are distinct.
- Only reviewed adapters are plug-and-play; an arbitrary unknown API needs engineering.
- Product, media, stock, pricing, PO, status and invoice are separately verified.

**Proposed commands:** `connection.create`, `credential.store`, `capability.test`, `mapping.preview`, `connection.activate`.
**Proposed events:** `connection.capability_verified`, `connection.activation_changed`.

**Behavioral acceptance additions — NOT RUN:**

- **F16-T01:** An administrator can configure a supported fixture connection without editing source.
- **F16-T02:** A successful product test does not enable purchase submission.
- **F16-T03:** Credential rotation preserves masked display and prevents plaintext export.

**Existing code to extend:** [apps/os/components/integrations.tsx](../../apps/os/components/integrations.tsx), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/catalog/src/index.ts](../../packages/catalog/src/index.ts), [packages/foundation/src/index.ts](../../packages/foundation/src/index.ts), [packages/procurement/src/index.ts](../../packages/procurement/src/index.ts), [packages/providers/src/index.ts](../../packages/providers/src/index.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts).

**Existing tests to extend:** [tests/modules/catalog.test.ts](../../tests/modules/catalog.test.ts), [tests/modules/foundation.test.ts](../../tests/modules/foundation.test.ts), [tests/modules/procurement.test.ts](../../tests/modules/procurement.test.ts), [tests/modules/supplier.test.ts](../../tests/modules/supplier.test.ts).

**Gap work:** GAP-004, GAP-005, GAP-020, GAP-021, GAP-022, GAP-034. **Modules:** supplier, foundation, catalog, procurement.
**Original acceptance dependencies:** A02, A03, A04, A05, A06, A08, A14, A19, A22, A25, A26, A31, A33, A34, A35, A36, A38, A39, E04, E05, E07, E12, E17, E18, E20, E24, T07, T08, T09, T15, T16, T20, T24, T25, T26, T27.

<a id="f17"></a>
## F17 — CSV/XML mapping, staged review and rollback

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** SanMar, SinaLite.
**Sources:** [S06: SanMar electronic integration offerings](https://www.sanmar.com/resources/electronicintegration/integrationofferings), [S32: SinaLite basic and full API integration options](https://sinalite.com/en_us/api-signup).

**Customer flow:** Published products change only after a reviewed import commit and publication step.

**Operator flow:** Upload a private file, map product/variant/options/price fields, inspect row errors and differences, commit selected changes and resolve rollback conflicts.

**Logical records:** `import_file`, `mapping_revision`, `staged_row`, `import_change`, `rollback_manifest`, `conflict`.

**Required rules and edge handling:**

- Unmapped identity, currency or units block affected rows.
- Stream bounded input; reject unsafe XML entities and oversized resources.
- A rollback never overwrites subsequent human edits or makes rolled-back costs eligible.

**Proposed commands:** `import.preview`, `import.validate`, `import.commit`, `import.rollback`.
**Proposed events:** `import.committed`, `import.rolled_back`.

**Behavioral acceptance additions — NOT RUN:**

- **F17-T01:** Re-importing the same source file does not duplicate source identities.
- **F17-T02:** A malformed row is attributable without exposing another tenant’s data.
- **F17-T03:** Rollback after a conflicting manual edit creates a review exception.

**Existing code to extend:** [apps/os/components/integrations.tsx](../../apps/os/components/integrations.tsx), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/catalog/src/index.ts](../../packages/catalog/src/index.ts), [packages/configuration/src/index.ts](../../packages/configuration/src/index.ts), [packages/providers/src/index.ts](../../packages/providers/src/index.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts).

**Existing tests to extend:** [tests/modules/catalog.test.ts](../../tests/modules/catalog.test.ts), [tests/modules/configuration.test.ts](../../tests/modules/configuration.test.ts), [tests/modules/supplier.test.ts](../../tests/modules/supplier.test.ts).

**Gap work:** GAP-014, GAP-015, GAP-016, GAP-022. **Modules:** supplier, catalog, configuration.
**Original acceptance dependencies:** A05, A06, A07, A08, A09, A10, A15, A38, E01, E03, E04, E05, E12, E16, T02, T06, T07, T08, T09, T24, T27, T29.

<a id="f18"></a>
## F18 — Independent inventory, pricing and status freshness

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** SanMar, Printify, Printful.
**Sources:** [S06: SanMar electronic integration offerings](https://www.sanmar.com/resources/electronicintegration/integrationofferings), [S12: Printify API reference](https://developers.printify.com/), [S21: Printful API v2 Open Beta status](https://help.printful.com/hc/en-us/articles/50262214313873-What-should-I-know-about-Printful-s-API-v2).

**Customer flow:** See availability and estimate confidence with a meaningful freshness timestamp.

**Operator flow:** Schedule catalog, inventory, price and order-status updates independently and remediate one failed operation without disabling successful ones.

**Logical records:** `inventory_snapshot`, `price_snapshot`, `sync_cursor`, `sync_run`, `freshness_policy`, `sync_exception`.

**Required rules and edge handling:**

- Inventory evidence is not a reservation.
- Each capability has its own cursor, observed time, expiry and retry policy.
- Rate limiting preserves work and resumes; stale evidence does not silently support a firm promise.

**Proposed commands:** `sync.schedule`, `sync.resume`, `sync.reconcile`, `freshness.evaluate`.
**Proposed events:** `sync.completed`, `source.evidence_expired`.

**Behavioral acceptance additions — NOT RUN:**

- **F18-T01:** A pricing outage does not erase the last valid catalog.
- **F18-T02:** A rate-limit response resumes after the permitted delay without duplicate records.
- **F18-T03:** Expired cost evidence forces a fresh estimate or quote-only result.

**Existing code to extend:** [apps/os/components/integrations.tsx](../../apps/os/components/integrations.tsx), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/catalog/src/index.ts](../../packages/catalog/src/index.ts), [packages/estimating/src/index.ts](../../packages/estimating/src/index.ts), [packages/providers/src/index.ts](../../packages/providers/src/index.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts), [packages/workflows/src/index.ts](../../packages/workflows/src/index.ts).

**Existing tests to extend:** [tests/modules/catalog.test.ts](../../tests/modules/catalog.test.ts), [tests/modules/estimating.test.ts](../../tests/modules/estimating.test.ts), [tests/modules/supplier.test.ts](../../tests/modules/supplier.test.ts), [tests/modules/workflow.test.ts](../../tests/modules/workflow.test.ts).

**Gap work:** GAP-007, GAP-010, GAP-020, GAP-022. **Modules:** supplier, catalog, estimating, workflow.
**Original acceptance dependencies:** A04, A06, A08, A11, A12, A18, A19, A22, A24, A25, A28, A30, A32, A33, A34, A35, A38, E04, E05, E06, E07, E12, E14, E19, T03, T07, T08, T09, T10, T14, T15, T18, T20, T21, T23, T27.

<a id="f19"></a>
## F19 — Provider-neutral POD routing proposals

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Printify, Printful.
**Sources:** [S12: Printify API reference](https://developers.printify.com/), [S13: Printify Order Routing behavior](https://help.printify.com/hc/en-us/articles/4483625090321-What-is-Order-Routing-and-how-does-it-work), [S20: Printful API v1: catalog, orders and confirmation](https://developers.printful.com/docs/), [S21: Printful API v2 Open Beta status](https://help.printful.com/hc/en-us/articles/50262214313873-What-should-I-know-about-Printful-s-API-v2), [S22: Printful fulfillment billing](https://help.printful.com/hc/en-us/articles/50264607936785-How-does-the-Printful-billing-system-work).

**Customer flow:** Receive the item and artwork that were approved; review any material substitution before production.

**Operator flow:** Compare eligible sources and propose exact or approved alternatives with cost, print geometry, geography and delivery impacts.

**Logical records:** `provider_variant_map`, `print_file_binding`, `routing_proposal`, `substitution_approval`, `provider_order`.

**Required rules and edge handling:**

- A source change rechecks print area, method, region, landed price and agreement.
- Draft creation, supplier charge and production confirmation are distinct commands.
- No autonomous order submission or unknown-outcome retry is permitted.

**Proposed commands:** `routing.propose`, `routing.approve`, `provider.create_draft`, `provider.confirm`.
**Proposed events:** `routing.change_proposed`, `provider.order_confirmed`.

**Behavioral acceptance additions — NOT RUN:**

- **F19-T01:** A similar garment cannot replace an approved brand without approval.
- **F19-T02:** A new provider print-area mismatch blocks confirmation.
- **F19-T03:** A failed billing outcome creates an exception and no false production status.

**Existing code to extend:** [apps/os/components/integrations.tsx](../../apps/os/components/integrations.tsx), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/configuration/src/index.ts](../../packages/configuration/src/index.ts), [packages/finance/src/index.ts](../../packages/finance/src/index.ts), [packages/fulfillment/src/index.ts](../../packages/fulfillment/src/index.ts), [packages/procurement/src/index.ts](../../packages/procurement/src/index.ts), [packages/providers/src/index.ts](../../packages/providers/src/index.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts).

**Existing tests to extend:** [tests/modules/configuration.test.ts](../../tests/modules/configuration.test.ts), [tests/modules/finance.test.ts](../../tests/modules/finance.test.ts), [tests/modules/fulfillment.test.ts](../../tests/modules/fulfillment.test.ts), [tests/modules/procurement.test.ts](../../tests/modules/procurement.test.ts), [tests/modules/supplier.test.ts](../../tests/modules/supplier.test.ts).

**Gap work:** GAP-010, GAP-020, GAP-024, GAP-025, GAP-036. **Modules:** supplier, configuration, procurement, fulfillment, finance.
**Original acceptance dependencies:** A04, A06, A11, A12, A18, A19, A21, A22, A23, A24, A25, A28, A29, A30, A33, A34, A35, E04, E06, E07, E10, E11, E12, E14, E19, E21, E22, T03, T08, T09, T10, T13, T14, T15, T18, T19, T20, T21, T27, T30.

<a id="f20"></a>
## F20 — Per-line job orchestration and holds

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Oracle: NetSuite and Fusion ERP/SCM, PrintNow, Smartpress.
**Sources:** [S28: Fusion SCM: order line fulfillment task visibility](https://docs.oracle.com/en/cloud/saas/readiness/scm/26b/order26b/26B-order-mgmt-wn-f43111.htm), [S29: Fusion SCM 26D removed and replaced features](https://docs.oracle.com/en/cloud/saas/readiness/scm/26d/order26d/26D-order-mgmt-wn-t78045.htm), [S16: PrintNow Enterprise API introduction](https://docs.printnow.com/docs/enterprise-api/introduction), [S31: Smartpress turnaround after proof approval](https://smartpress.com/support/ordering-shipping/printing-turnaround-time).

**Customer flow:** View truthful item-level progress, holds and partial fulfillment rather than one misleading order status.

**Operator flow:** Allocate blank supply, decoration, print, assembly and dispatch tasks with dependencies, owners and evidence.

**Logical records:** `job`, `job_operation`, `operation_dependency`, `purchase_requirement`, `hold`, `execution_event`.

**Required rules and edge handling:**

- A customer order may create several jobs and supplier requirements.
- Each dependent operation waits for required predecessor completion and valid approvals.
- Order completion is derived from required quantities and exceptions, not manually set success.

**Proposed commands:** `order.allocate_jobs`, `job.plan_operations`, `operation.start`, `operation.complete`, `hold.resolve`.
**Proposed events:** `job.allocated`, `operation.completed`, `job.hold_changed`.

**Behavioral acceptance additions — NOT RUN:**

- **F20-T01:** Blank receiving can complete while decoration remains blocked.
- **F20-T02:** An assembly operation cannot complete before required components arrive.
- **F20-T03:** One shipped line does not mark all order lines fulfilled.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/fulfillment/src/index.ts](../../packages/fulfillment/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts), [packages/procurement/src/index.ts](../../packages/procurement/src/index.ts), [packages/production/src/index.ts](../../packages/production/src/index.ts), [packages/today/src/index.ts](../../packages/today/src/index.ts).

**Existing tests to extend:** [tests/modules/fulfillment.test.ts](../../tests/modules/fulfillment.test.ts), [tests/modules/orders.test.ts](../../tests/modules/orders.test.ts), [tests/modules/procurement.test.ts](../../tests/modules/procurement.test.ts), [tests/modules/today.test.ts](../../tests/modules/today.test.ts).

**Gap work:** GAP-006, GAP-007, GAP-018, GAP-024, GAP-025, GAP-026. **Modules:** orders, procurement, fulfillment, today.
**Original acceptance dependencies:** A02, A10, A16, A17, A20, A21, A22, A23, A24, A25, A28, A29, A32, A35, A40, E04, E08, E10, E11, E12, E13, E18, E19, E22, T05, T11, T13, T14, T18, T19, T20, T23, T25, T27, T30.

<a id="f21"></a>
## F21 — Purchase approvals and uncertain outcome reconciliation

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Oracle: NetSuite and Fusion ERP/SCM, Printful, 4over.
**Sources:** [S27: NetSuite custom purchase approval workflows](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N2396564.html), [S20: Printful API v1: catalog, orders and confirmation](https://developers.printful.com/docs/), [S35: 4over trade resources and API program](https://blog.4over.com/5-ways-4over-helps-you-sell).

**Customer flow:** Customer commitments are protected from unapproved supplier substitutions or spend.

**Operator flow:** Prepare by purchase requirement, inspect the exact PO payload, approve within authority, submit once and reconcile acknowledgments or uncertainty.

**Logical records:** `purchase_requirement`, `po_revision`, `po_line`, `spend_approval`, `provider_transaction`, `reconciliation_case`.

**Required rules and edge handling:**

- Approval binds payload hash, amount, currency, provider and agreement revision.
- One requirement cannot be purchased twice through competing job or connection paths.
- A timeout after write is UNKNOWN_OUTCOME; query/reconcile before any resubmission.

**Proposed commands:** `purchase.prepare`, `purchase.approve`, `purchase.submit`, `purchase.reconcile`.
**Proposed events:** `purchase.authorized`, `purchase.acknowledged`, `purchase.outcome_uncertain`.

**Behavioral acceptance additions — NOT RUN:**

- **F21-T01:** Changing a PO line after approval requires reapproval.
- **F21-T02:** Two buyers cannot procure the same requirement twice.
- **F21-T03:** A simulated post-write timeout cannot trigger an automatic second supplier order.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/finance/src/index.ts](../../packages/finance/src/index.ts), [packages/foundation/src/index.ts](../../packages/foundation/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts), [packages/procurement/src/index.ts](../../packages/procurement/src/index.ts), [packages/production/src/index.ts](../../packages/production/src/index.ts).

**Existing tests to extend:** [tests/modules/finance.test.ts](../../tests/modules/finance.test.ts), [tests/modules/foundation.test.ts](../../tests/modules/foundation.test.ts), [tests/modules/orders.test.ts](../../tests/modules/orders.test.ts), [tests/modules/procurement.test.ts](../../tests/modules/procurement.test.ts).

**Gap work:** GAP-005, GAP-006, GAP-013, GAP-025, GAP-027. **Modules:** procurement, orders, finance, foundation.
**Original acceptance dependencies:** A02, A10, A11, A18, A19, A20, A21, A22, A24, A26, A27, A29, A30, A31, A35, A36, A40, E02, E04, E06, E07, E08, E09, E10, E11, E15, E17, E18, E19, E20, E21, E22, E24, E25, T10, T11, T12, T13, T14, T16, T17, T18, T21, T25, T26, T27, T30.

<a id="f22"></a>
## F22 — Split shipments, blind shipping and tracking

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Smartpress, GotPrint, 4over, VistaPrint.
**Sources:** [S30: Smartpress reseller program and blind shipping](https://smartpress.com/pages/print-reseller-program), [S31: Smartpress turnaround after proof approval](https://smartpress.com/support/ordering-shipping/printing-turnaround-time), [S37: GotPrint broker program requirements and blind shipping](https://www.gotprint.com/company/info/brokers.html), [S36: 4over turnaround times and proof dependencies](https://4over.com/turnaround-times), [S19: VistaPrint order status and tracking](https://www.vistaprint.com/customer-care/help-center/360050082651/).

**Customer flow:** See packages, quantities, destination and tracking for each part of the order.

**Operator flow:** Allocate quantities to packages, verify blind-ship settings, record supplier-provided tracking and handle delivery exceptions.

**Logical records:** `shipment`, `shipment_item`, `package`, `address_snapshot`, `tracking_event`, `blind_ship_instruction`.

**Required rules and edge handling:**

- Allocated shipped quantities cannot exceed authorized remaining quantities.
- A supplier shipment does not trigger a duplicate purchased label.
- A delivered package event is not automatically acceptance of every order line.

**Proposed commands:** `shipment.allocate`, `shipment.record_tracking`, `tracking.ingest`, `delivery.resolve_exception`.
**Proposed events:** `shipment.dispatched`, `shipment.delivered`.

**Behavioral acceptance additions — NOT RUN:**

- **F22-T01:** Two packages correctly sum to a partly then fully shipped line.
- **F22-T02:** Duplicate tracking webhooks do not duplicate fulfillment quantity.
- **F22-T03:** A blind-shipping restriction blocks an unsupported route.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts), [packages/fulfillment/src/index.ts](../../packages/fulfillment/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts), [packages/production/src/index.ts](../../packages/production/src/index.ts).

**Existing tests to extend:** [tests/modules/commerce.test.ts](../../tests/modules/commerce.test.ts), [tests/modules/fulfillment.test.ts](../../tests/modules/fulfillment.test.ts), [tests/modules/orders.test.ts](../../tests/modules/orders.test.ts).

**Gap work:** GAP-024, GAP-026, GAP-036. **Modules:** fulfillment, orders, commerce.
**Original acceptance dependencies:** A11, A21, A23, A24, A25, A28, A29, A33, A35, E10, E12, E14, E21, E22, T13, T15, T18, T19, T20, T30.

<a id="f23"></a>
## F23 — Returns, claims, remakes and customer resolution

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** 4imprint, OrderMyGear, Printful.
**Sources:** [S11: 4imprint ordering, proof, payment and delivery FAQ](https://www.4imprint.com/info/faq), [S15: OrderMyGear FAQs and fulfillment responsibility](https://www.ordermygear.com/faqs/), [S22: Printful fulfillment billing](https://help.printful.com/hc/en-us/articles/50264607936785-How-does-the-Printful-billing-system-work).

**Customer flow:** Report a problem against the affected quantity, attach private evidence and see its resolution status.

**Operator flow:** Classify damage, defect, artwork or preference; authorize refund/remake and link supplier recovery separately.

**Logical records:** `claim`, `claim_line`, `evidence_asset`, `resolution`, `remake_order`, `refund_reference`, `supplier_credit_reference`.

**Required rules and edge handling:**

- A customer refund and supplier reimbursement are separate outcomes.
- Remakes retain original agreement and cause but require new production authorization.
- Resolution does not fabricate a financial refund without processor/accounting evidence.

**Proposed commands:** `claim.open`, `claim.review`, `resolution.authorize`, `remake.prepare`, `refund.reconcile`.
**Proposed events:** `claim.opened`, `claim.resolved`.

**Behavioral acceptance additions — NOT RUN:**

- **F23-T01:** Partial defect quantity does not refund the entire order by default.
- **F23-T02:** A refund UI success without a provider event remains pending.
- **F23-T03:** Remake costs appear in actual profitability with a link to the original order.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/crm/src/index.ts](../../packages/crm/src/index.ts), [packages/finance/src/index.ts](../../packages/finance/src/index.ts), [packages/fulfillment/src/index.ts](../../packages/fulfillment/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts), [packages/production/src/index.ts](../../packages/production/src/index.ts).

**Existing tests to extend:** [tests/modules/crm.test.ts](../../tests/modules/crm.test.ts), [tests/modules/finance.test.ts](../../tests/modules/finance.test.ts), [tests/modules/fulfillment.test.ts](../../tests/modules/fulfillment.test.ts), [tests/modules/orders.test.ts](../../tests/modules/orders.test.ts).

**Gap work:** GAP-026, GAP-027, GAP-028. **Modules:** fulfillment, crm, finance, orders.
**Original acceptance dependencies:** A18, A21, A23, A25, A27, A29, A30, A31, A35, E06, E09, E12, E19, E21, E22, T12, T13, T17, T19, T20, T21, T22, T30.

<a id="f24"></a>
## F24 — Estimated versus actual direct profit and references

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Oracle: NetSuite and Fusion ERP/SCM, Printful, Shopify.
**Sources:** [S27: NetSuite custom purchase approval workflows](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N2396564.html), [S22: Printful fulfillment billing](https://help.printful.com/hc/en-us/articles/50264607936785-How-does-the-Printful-billing-system-work), [S23: Shopify B2B feature availability by plan](https://help.shopify.com/en/manual/b2b/getting-started/plan-features).

**Customer flow:** Receive accurate payment and invoice references without exposure to internal costs.

**Operator flow:** Reconcile supplier invoices, freight, fees, credits, customer receipts and actual job costs against the frozen estimate.

**Logical records:** `actual_cost`, `supplier_invoice_reference`, `customer_invoice_reference`, `payment_reference`, `reconciliation`, `profit_snapshot`.

**Required rules and edge handling:**

- Customer paid, processor payout and supplier payable are separate facts.
- Profit excludes collected tax and distinguishes direct gross profit from overhead/net profit.
- No full general ledger, payroll or automated settlement is activated.

**Proposed commands:** `cost.record_actual`, `invoice.match`, `payment.reconcile`, `profit.close_snapshot`.
**Proposed events:** `cost.actual_recorded`, `reconciliation.completed`.

**Behavioral acceptance additions — NOT RUN:**

- **F24-T01:** A supplier credit reduces actual cost once and retains its original reference.
- **F24-T02:** A customer payout delay does not mark the order unpaid twice.
- **F24-T03:** A report reconciles totals across the whole dataset beyond the first 1,000 records.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/analytics/src/index.ts](../../packages/analytics/src/index.ts), [packages/estimating/src/index.ts](../../packages/estimating/src/index.ts), [packages/finance/src/index.ts](../../packages/finance/src/index.ts), [packages/today/src/index.ts](../../packages/today/src/index.ts).

**Existing tests to extend:** [tests/modules/analytics.test.ts](../../tests/modules/analytics.test.ts), [tests/modules/estimating.test.ts](../../tests/modules/estimating.test.ts), [tests/modules/finance.test.ts](../../tests/modules/finance.test.ts), [tests/modules/today.test.ts](../../tests/modules/today.test.ts).

**Gap work:** GAP-010, GAP-013, GAP-027, GAP-030, GAP-036. **Modules:** finance, estimating, analytics, today.
**Original acceptance dependencies:** A11, A12, A18, A19, A20, A24, A25, A26, A27, A28, A29, A30, A33, A35, E02, E06, E07, E08, E09, E14, E15, E19, E21, E22, E25, T03, T09, T10, T11, T12, T15, T16, T17, T18, T20, T21, T30.

<a id="f25"></a>
## F25 — CMS, licensed assets and controlled marketing

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Imprint.com, 4over, OrderMyGear.
**Sources:** [S08: Imprint.com catalog and design assistance](https://imprint.com/), [S35: 4over trade resources and API program](https://blog.4over.com/5-ways-4over-helps-you-sell), [S14: OrderMyGear online store types and controls](https://www.ordermygear.com/online-stores/).

**Customer flow:** See current published product content and permitted campaign imagery.

**Operator flow:** Draft brand-consistent content, review rights and audience permission, approve a revision and schedule an authorized publication.

**Logical records:** `content_revision`, `campaign`, `asset_license`, `audience_consent`, `suppression`, `publication_approval`.

**Required rules and edge handling:**

- Unpublished and expired-rights assets cannot enter public projections.
- Approval, publication and external message sending are independent permissions.
- Unsubscribe/suppression survives an audience reimport.

**Proposed commands:** `content.save_revision`, `content.review`, `content.publish`, `audience.suppress`.
**Proposed events:** `content.published`, `audience.suppressed`.

**Behavioral acceptance additions — NOT RUN:**

- **F25-T01:** A manager with an approval grant can approve without an unrelated module-wide denial.
- **F25-T02:** A suppressed contact cannot be reactivated by a CSV overwrite.
- **F25-T03:** A draft cannot be fetched through a public asset URL.

**Existing code to extend:** [apps/os/components/studio.tsx](../../apps/os/components/studio.tsx), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/app/[[...path]]/page.tsx](../../apps/shop/app/[[...path]]/page.tsx), [apps/shop/components/designer.tsx](../../apps/shop/components/designer.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/catalog/src/index.ts](../../packages/catalog/src/index.ts), [packages/creative/src/index.ts](../../packages/creative/src/index.ts), [packages/crm/src/index.ts](../../packages/crm/src/index.ts), [packages/marketing/src/index.ts](../../packages/marketing/src/index.ts).

**Existing tests to extend:** [tests/modules/catalog.test.ts](../../tests/modules/catalog.test.ts), [tests/modules/creative.test.ts](../../tests/modules/creative.test.ts), [tests/modules/crm.test.ts](../../tests/modules/crm.test.ts), [tests/modules/marketing.test.ts](../../tests/modules/marketing.test.ts).

**Gap work:** GAP-005, GAP-016, GAP-019, GAP-029. **Modules:** marketing, catalog, creative, crm.
**Original acceptance dependencies:** A02, A09, A10, A14, A15, A19, A26, A31, A36, A38, E01, E02, E07, E17, E18, E20, E24, T02, T04, T05, T06, T16, T22, T24, T25, T26, T29.

<a id="f26"></a>
## F26 — Versioned automation with a durable event contract

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** PrintNow, Printful, BigCommerce.
**Sources:** [S16: PrintNow Enterprise API introduction](https://docs.printnow.com/docs/enterprise-api/introduction), [S21: Printful API v2 Open Beta status](https://help.printful.com/hc/en-us/articles/50262214313873-What-should-I-know-about-Printful-s-API-v2), [S26: BigCommerce B2B API families and context](https://docs.bigcommerce.com/developer/docs/b2b-edition/getting-started/about-our-apis).

**Customer flow:** Receive an accurate status update only after the underlying transaction commits and sending is authorized.

**Operator flow:** Choose a supported trigger, conditions and allowed action; simulate on sample data, approve, activate, inspect attempts and replay safely.

**Logical records:** `event_envelope`, `outbox`, `automation_revision`, `subscription`, `execution`, `delivery_attempt`, `dead_letter`.

**Required rules and edge handling:**

- Emitters and subscribers use one versioned registry and schema.
- Events carry tenant, workspace, aggregate revision, correlation and causation IDs.
- Retries are idempotent; live spend and external sending require their own gates.

**Proposed commands:** `automation.simulate`, `automation.activate`, `execution.replay`, `delivery.retry`.
**Proposed events:** `automation.activated`, `automation.execution_failed`.

**Behavioral acceptance additions — NOT RUN:**

- **F26-T01:** A request.submitted event reaches the matching approved subscription.
- **F26-T02:** Replaying an event cannot create a second PO or duplicate message.
- **F26-T03:** A consumer failure leaves a visible retriable exception and preserves the event.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/foundation/src/index.ts](../../packages/foundation/src/index.ts), [packages/today/src/index.ts](../../packages/today/src/index.ts), [packages/workflows/src/index.ts](../../packages/workflows/src/index.ts).

**Existing tests to extend:** [tests/modules/foundation.test.ts](../../tests/modules/foundation.test.ts), [tests/modules/today.test.ts](../../tests/modules/today.test.ts), [tests/modules/workflow.test.ts](../../tests/modules/workflow.test.ts).

**Gap work:** GAP-007, GAP-028, GAP-029, GAP-031, GAP-035. **Modules:** workflow, foundation, today.
**Original acceptance dependencies:** A18, A22, A31, A32, A35, A39, E12, E19, T14, T22, T23, T27.

<a id="f27"></a>
## F27 — Operational dashboard and full-dataset analytics

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Oracle: NetSuite and Fusion ERP/SCM, PrintNow, Shopify.
**Sources:** [S28: Fusion SCM: order line fulfillment task visibility](https://docs.oracle.com/en/cloud/saas/readiness/scm/26b/order26b/26B-order-mgmt-wn-f43111.htm), [S16: PrintNow Enterprise API introduction](https://docs.printnow.com/docs/enterprise-api/introduction), [S23: Shopify B2B feature availability by plan](https://help.shopify.com/en/manual/b2b/getting-started/plan-features).

**Customer flow:** Account history shows understandable current commitments and outstanding actions.

**Operator flow:** Open queues for overdue proofs, stale prices, production holds and unmatched payments; drill from every KPI to scoped source records.

**Logical records:** `metric_definition`, `time_bucket`, `queue_item`, `sla_clock`, `report_run`, `export_manifest`.

**Required rules and edge handling:**

- Metrics define numerator, denominator, timezone, exclusions and freshness.
- KPI aggregation is not a sum of a capped browser list.
- Gross profit per owner hour requires recorded hours and is not a net-profit claim.

**Proposed commands:** `report.run`, `report.export`, `queue.assign`, `metric.reconcile`.
**Proposed events:** `report.completed`, `sla.breached`.

**Behavioral acceptance additions — NOT RUN:**

- **F27-T01:** A known seeded population above 1,000 reconciles to SQL totals.
- **F27-T02:** A buyer cannot export another company’s records.
- **F27-T03:** Waiting for proof and active production time are reported separately.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/analytics/src/index.ts](../../packages/analytics/src/index.ts), [packages/crm/src/index.ts](../../packages/crm/src/index.ts), [packages/finance/src/index.ts](../../packages/finance/src/index.ts), [packages/today/src/index.ts](../../packages/today/src/index.ts).

**Existing tests to extend:** [tests/modules/analytics.test.ts](../../tests/modules/analytics.test.ts), [tests/modules/crm.test.ts](../../tests/modules/crm.test.ts), [tests/modules/finance.test.ts](../../tests/modules/finance.test.ts), [tests/modules/today.test.ts](../../tests/modules/today.test.ts).

**Gap work:** GAP-008, GAP-027, GAP-028, GAP-030, GAP-033. **Modules:** today, analytics, finance, crm.
**Original acceptance dependencies:** A01, A10, A18, A27, A29, A30, A31, A35, A37, E01, E03, E06, E09, E15, E19, E21, E22, E23, T02, T12, T17, T21, T22, T28, T29, T30.

<a id="f28"></a>
## F28 — Administration, delegated authority and audit

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Oracle: NetSuite and Fusion ERP/SCM, BigCommerce, Shopify.
**Sources:** [S27: NetSuite custom purchase approval workflows](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N2396564.html), [S25: BigCommerce B2B integration overview](https://docs.bigcommerce.com/developer/docs/b2b-edition/getting-started/overview), [S24: Shopify B2B development model](https://shopify.dev/docs/apps/build/b2b).

**Customer flow:** Use granted company access with clear permission-denied and session-expiry states.

**Operator flow:** Manage staff grants, legal sellers, limits, connection environments, audit review and recovery evidence.

**Logical records:** `membership`, `resource_grant`, `approval_limit`, `legal_seller`, `audit_event`, `recovery_run`.

**Required rules and edge handling:**

- Deny by default; module visibility is distinct from action/resource authority.
- Revocation and workspace changes are enforced server-side.
- Audit records are append-only and redact credentials and sensitive payloads.

**Proposed commands:** `grant.assign`, `grant.revoke`, `seller.assign`, `recovery.verify`.
**Proposed events:** `grant.revoked`, `seller.assignment_changed`.

**Behavioral acceptance additions — NOT RUN:**

- **F28-T01:** An allowed reviewer can review but cannot submit supplier spend.
- **F28-T02:** A tampered workspace ID returns no cross-tenant record.
- **F28-T03:** An audit export contains masked credential metadata only.

**Existing code to extend:** [apps/os/components/integrations.tsx](../../apps/os/components/integrations.tsx), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/finance/src/index.ts](../../packages/finance/src/index.ts), [packages/foundation/src/index.ts](../../packages/foundation/src/index.ts), [packages/providers/src/index.ts](../../packages/providers/src/index.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts), [packages/workflows/src/index.ts](../../packages/workflows/src/index.ts).

**Existing tests to extend:** [tests/modules/finance.test.ts](../../tests/modules/finance.test.ts), [tests/modules/foundation.test.ts](../../tests/modules/foundation.test.ts), [tests/modules/supplier.test.ts](../../tests/modules/supplier.test.ts), [tests/modules/workflow.test.ts](../../tests/modules/workflow.test.ts).

**Gap work:** GAP-004, GAP-005, GAP-006, GAP-032, GAP-034, GAP-035. **Modules:** foundation, supplier, finance, workflow.
**Original acceptance dependencies:** A02, A03, A06, A10, A14, A19, A20, A26, A29, A31, A34, A35, A36, A39, A40, E07, E08, E17, E18, E20, E24, E25, T11, T16, T24, T25, T26, T27.

<a id="f29"></a>
## F29 — Direct supplier standards and licensed ASI interfaces

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** PCNA, SanMar.
**Sources:** [S03: PCNA authorized distributor account application](https://cloud.engage.pcna.com/account_application), [S06: SanMar electronic integration offerings](https://www.sanmar.com/resources/electronicintegration/integrationofferings), [S39: PromoStandards interoperability purpose](https://promostandards.org/About-Us/).

**Customer flow:** See approved canonical data independent of its licensed upstream source.

**Operator flow:** Configure direct supplier profiles and keep ASI SmartLink, ESP-related workflows and file imports as separately entitled interfaces.

**Logical records:** `service_profile`, `service_version`, `external_identity`, `license_entitlement`, `capability_test`.

**Required rules and edge handling:**

- PSRESTful is prohibited.
- PromoStandards service versions are supplier-specific and independently tested.
- ASI SmartLink and ESP website access are not interchangeable rights; obtain official authorized schemas.
- Public standards history does not verify a specific supplier endpoint.

**Proposed commands:** `profile.register_reviewed`, `entitlement.record`, `capability.verify`.
**Proposed events:** `entitlement.changed`.

**Behavioral acceptance additions — NOT RUN:**

- **F29-T01:** A Product Data fixture cannot set invoice or PO capability verified.
- **F29-T02:** Missing ASI entitlement leaves that capability blocked with a clear reason.
- **F29-T03:** A supplier endpoint outside a reviewed profile is rejected.

**Existing code to extend:** [apps/os/components/integrations.tsx](../../apps/os/components/integrations.tsx), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/catalog/src/index.ts](../../packages/catalog/src/index.ts), [packages/foundation/src/index.ts](../../packages/foundation/src/index.ts), [packages/providers/src/index.ts](../../packages/providers/src/index.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts).

**Existing tests to extend:** [tests/modules/catalog.test.ts](../../tests/modules/catalog.test.ts), [tests/modules/foundation.test.ts](../../tests/modules/foundation.test.ts), [tests/modules/supplier.test.ts](../../tests/modules/supplier.test.ts).

**Gap work:** GAP-004, GAP-020, GAP-021, GAP-022, GAP-023, GAP-034. **Modules:** supplier, catalog, foundation.
**Original acceptance dependencies:** A02, A03, A04, A05, A06, A08, A14, A22, A25, A33, A34, A35, A38, A39, E04, E05, E12, E17, E18, T07, T08, T09, T15, T20, T24, T25, T27.

<a id="f30"></a>
## F30 — Complete usable screens and query behavior

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** VistaPrint, Shopify, BigCommerce, OrderMyGear.
**Sources:** [S19: VistaPrint order status and tracking](https://www.vistaprint.com/customer-care/help-center/360050082651/), [S23: Shopify B2B feature availability by plan](https://help.shopify.com/en/manual/b2b/getting-started/plan-features), [S25: BigCommerce B2B integration overview](https://docs.bigcommerce.com/developer/docs/b2b-edition/getting-started/overview), [S14: OrderMyGear online store types and controls](https://www.ordermygear.com/online-stores/).

**Customer flow:** Use mobile and keyboard navigation, persistent filters and understandable validation or recovery messages.

**Operator flow:** Use scoped server pagination, saved filters, bulk previews, column controls and accessible dialogs across contracted screens.

**Logical records:** `saved_view`, `query_cursor`, `bulk_operation`, `operator_preference`.

**Required rules and edge handling:**

- Every contracted screen covers loading, empty, error, denied and stale states.
- Cross-app links use configured preview origins, never hardcoded localhost.
- A failed save cannot present a success toast or discard work.

**Proposed commands:** `view.save`, `query.list`, `bulk.preview`.
**Proposed events:** `bulk.preview_completed`.

**Behavioral acceptance additions — NOT RUN:**

- **F30-T01:** All contracted screens are reachable for their authorized role.
- **F30-T02:** Customer and OS navigation works at the deployed HTTPS origins.
- **F30-T03:** Keyboard-only save and error recovery retain focus and entered data.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/components/programs.tsx](../../apps/shop/components/programs.tsx), [apps/shop/components/storefront.tsx](../../apps/shop/components/storefront.tsx), [packages/catalog/src/index.ts](../../packages/catalog/src/index.ts), [packages/commerce/src/index.ts](../../packages/commerce/src/index.ts), [packages/foundation/src/index.ts](../../packages/foundation/src/index.ts), [packages/stores/src/index.ts](../../packages/stores/src/index.ts).

**Existing tests to extend:** [tests/modules/catalog.test.ts](../../tests/modules/catalog.test.ts), [tests/modules/commerce.test.ts](../../tests/modules/commerce.test.ts), [tests/modules/foundation.test.ts](../../tests/modules/foundation.test.ts), [tests/modules/stores.test.ts](../../tests/modules/stores.test.ts).

**Gap work:** GAP-008, GAP-033, GAP-038, GAP-039. **Modules:** commerce, stores, catalog, foundation.
**Original acceptance dependencies:** A01, A10, A15, A37, A40, E01, E03, E15, E16, E23, T02, T06, T28, T29, T30.

<a id="f31"></a>
## F31 — Print-specific specifications and file roles

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** 4over, Smartpress, SinaLite, PrintNow.
**Sources:** [S36: 4over turnaround times and proof dependencies](https://4over.com/turnaround-times), [S30: Smartpress reseller program and blind shipping](https://smartpress.com/pages/print-reseller-program), [S34: SinaLite ordering and product specification guide](https://sinalite.com/en_us/how-to-place-print-order), [S16: PrintNow Enterprise API introduction](https://docs.printnow.com/docs/enterprise-api/introduction).

**Customer flow:** Choose supported dimensions, stock, sides and finishing with product-specific artwork instructions.

**Operator flow:** Maintain validated product families, file-role requirements and operation specs for each supported route.

**Logical records:** `print_spec_revision`, `stock`, `finish`, `dimension_rule`, `file_role`, `manufacturing_spec`.

**Required rules and edge handling:**

- Store dimensions with explicit units and distinguish trim, bleed and safe area.
- Front, back, white ink and specialty finish masks are named file roles where applicable.
- Embroidery requires reviewed digitization evidence; automatic digitization remains future.
- Vendor specifications are versioned evidence, not universal print constants.

**Proposed commands:** `print_spec.validate`, `file.bind_role`, `manufacturing_spec.freeze`.
**Proposed events:** `manufacturing_spec.validated`.

**Behavioral acceptance additions — NOT RUN:**

- **F31-T01:** A required back file missing from a two-sided job blocks prepress.
- **F31-T02:** Mixing inches and millimeters cannot silently change dimensions.
- **F31-T03:** A foil mask from another revision cannot be approved with the current print file.

**Existing code to extend:** [apps/os/components/studio.tsx](../../apps/os/components/studio.tsx), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/app/[[...path]]/page.tsx](../../apps/shop/app/[[...path]]/page.tsx), [apps/shop/components/designer.tsx](../../apps/shop/components/designer.tsx), [packages/configuration/src/index.ts](../../packages/configuration/src/index.ts), [packages/creative/src/index.ts](../../packages/creative/src/index.ts), [packages/estimating/src/index.ts](../../packages/estimating/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts), [packages/production/src/index.ts](../../packages/production/src/index.ts).

**Existing tests to extend:** [tests/modules/configuration.test.ts](../../tests/modules/configuration.test.ts), [tests/modules/creative.test.ts](../../tests/modules/creative.test.ts), [tests/modules/estimating.test.ts](../../tests/modules/estimating.test.ts), [tests/modules/orders.test.ts](../../tests/modules/orders.test.ts).

**Gap work:** GAP-009, GAP-017, GAP-018, GAP-024. **Modules:** configuration, creative, estimating, orders.
**Original acceptance dependencies:** A09, A12, A13, A14, A16, A17, A20, A21, A23, A24, A28, A37, E02, E05, E08, E10, E11, E12, E13, E14, E15, E16, E22, T02, T03, T04, T05, T06, T11, T12, T13, T14, T15, T18, T19, T30.

<a id="f32"></a>
## F32 — Durable development, storage and recovery foundations

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Controlling TwelveSpec architecture and observed repository gaps.
**Basis:** the handoff and existing persistence/security/recovery gap audit.

**Customer flow:** Saved demo work survives the intended development environment lifecycle and failures have actionable messages.

**Operator flow:** Use isolated development data, verified database trust, durable private storage, managed secrets, backup/restore and real CI evidence.

**Logical records:** `environment_config`, `migration`, `artifact_manifest`, `secret_version`, `backup_manifest`, `verification_run`.

**Required rules and edge handling:**

- No existing TwelveSpec production infrastructure is accessed or changed.
- Database TLS verification stays enabled; temporary demo storage is labeled accurately.
- Source publication and deployment remain separate approvals with reviewable artifacts.

**Proposed commands:** `environment.validate`, `migration.apply_dev`, `backup.restore_test`.
**Proposed events:** `environment.verification_completed`.

**Behavioral acceptance additions — NOT RUN:**

- **F32-T01:** Restarting the intended persistent development stack retains a saved project.
- **F32-T02:** A restore test recovers scoped records and private artifacts.
- **F32-T03:** The CI evidence names the actual commit and executed checks.

**Existing code to extend:** [apps/os/components/integrations.tsx](../../apps/os/components/integrations.tsx), [apps/os/components/studio.tsx](../../apps/os/components/studio.tsx), [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [apps/shop/app/[[...path]]/page.tsx](../../apps/shop/app/[[...path]]/page.tsx), [apps/shop/components/designer.tsx](../../apps/shop/components/designer.tsx), [packages/creative/src/index.ts](../../packages/creative/src/index.ts), [packages/foundation/src/index.ts](../../packages/foundation/src/index.ts), [packages/providers/src/index.ts](../../packages/providers/src/index.ts), [packages/supplier/src/index.ts](../../packages/supplier/src/index.ts), [packages/workflows/src/index.ts](../../packages/workflows/src/index.ts).

**Existing tests to extend:** [tests/modules/creative.test.ts](../../tests/modules/creative.test.ts), [tests/modules/foundation.test.ts](../../tests/modules/foundation.test.ts), [tests/modules/supplier.test.ts](../../tests/modules/supplier.test.ts), [tests/modules/workflow.test.ts](../../tests/modules/workflow.test.ts).

**Gap work:** GAP-002, GAP-003, GAP-004, GAP-007, GAP-034, GAP-035, GAP-037, GAP-039, GAP-040. **Modules:** foundation, creative, supplier, workflow.
**Original acceptance dependencies:** A01, A02, A03, A06, A10, A14, A15, A16, A22, A32, A34, A35, A36, A39, A40, E03, E13, E17, E18, E19, E20, E23, E24, T01, T04, T14, T23, T24, T25, T26, T27, T29, T30.

<a id="f33"></a>
## F33 — Reserved future capabilities

**Scope:** COMING_SOON_ONLY. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** PrintNow, Oracle: NetSuite and Fusion ERP/SCM, Custom Ink.
**Sources:** [S17: PrintNow public integration overview](https://printnow.com/web-to-print-api), [S27: NetSuite custom purchase approval workflows](https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N2396564.html), [S01: Custom Ink: how it works](https://www.customink.com/how-it-works).

**Customer flow:** See Coming Soon labels for unavailable capabilities without active transaction controls.

**Operator flow:** Keep research notes for AI design, validated 3D, auto digitization, CAD, SaaS, GL/payroll, enterprise MRP and autonomous procurement.

**Logical records:** `module_registry`, `future_capability_note`.

**Required rules and edge handling:**

- Researching a vendor feature does not activate it.
- Reserved server commands deny execution even when called outside the UI.

**Proposed commands:** None; reserved commands remain denied.
**Proposed events:** None.

**Behavioral acceptance additions — NOT RUN:**

- **F33-T01:** Every reserved module remains Coming Soon with no working transaction button.
- **F33-T02:** Direct API attempts for reserved capabilities are denied.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/contracts/src/index.ts](../../packages/contracts/src/index.ts).

**Existing tests to extend:** [tests/security/isolation.test.ts](../../tests/security/isolation.test.ts).

**Gap work:** GAP-001, GAP-032, GAP-038, GAP-040. **Modules:** future.
**Original acceptance dependencies:** A01, A20, A36, A37, E01, E13, E16, E18, E20, E24, E25, T01, T02, T06, T26, T28, T30.

<a id="f34"></a>
## F34 — CRM relationships, ownership and follow-through

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** 4imprint, Custom Ink, BigCommerce.
**Sources:** [S11: 4imprint ordering, proof, payment and delivery FAQ](https://www.4imprint.com/info/faq), [S01: Custom Ink: how it works](https://www.customink.com/how-it-works), [S25: BigCommerce B2B integration overview](https://docs.bigcommerce.com/developer/docs/b2b-edition/getting-started/overview).

**Customer flow:** Keep one account context across inquiries, artwork reviews, quotes and service issues.

**Operator flow:** Manage account/contact relationships, lead source, opportunity stages, next tasks, assigned reps and activity history.

**Logical records:** `account`, `contact`, `account_contact`, `opportunity`, `sales_activity`, `next_action`, `consent`.

**Required rules and edge handling:**

- Identity matching is scoped and uncertain duplicates require review.
- Follow-up tasks preserve their triggering quote or claim revision.
- Closing an opportunity requires a reason and does not fabricate collected revenue.

**Proposed commands:** `crm.propose_merge`, `opportunity.transition`, `task.schedule`, `activity.record`.
**Proposed events:** `opportunity.stage_changed`, `task.due`.

**Behavioral acceptance additions — NOT RUN:**

- **F34-T01:** A contact can serve two company locations with independent permissions.
- **F34-T02:** An opportunity closed lost retains its quotes and reason.
- **F34-T03:** A scheduled follow-up does not send external email in demo mode.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/crm/src/index.ts](../../packages/crm/src/index.ts), [packages/marketing/src/index.ts](../../packages/marketing/src/index.ts), [packages/sales/src/index.ts](../../packages/sales/src/index.ts), [packages/today/src/index.ts](../../packages/today/src/index.ts).

**Existing tests to extend:** [tests/modules/crm.test.ts](../../tests/modules/crm.test.ts), [tests/modules/marketing.test.ts](../../tests/modules/marketing.test.ts), [tests/modules/sales.test.ts](../../tests/modules/sales.test.ts), [tests/modules/today.test.ts](../../tests/modules/today.test.ts).

**Gap work:** GAP-005, GAP-028, GAP-029, GAP-030, GAP-038. **Modules:** crm, sales, today, marketing.
**Original acceptance dependencies:** A01, A02, A18, A19, A26, A30, A31, A36, A37, E01, E07, E16, E17, E18, E20, E24, T02, T06, T16, T21, T22, T25, T26, T28, T30.

<a id="f35"></a>
## F35 — Production execution and quality checkpoints

**Scope:** ACTIVE_V1_DESIGN. **Status:** DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH.

**Public inspiration:** Oracle: NetSuite and Fusion ERP/SCM, Smartpress, 4over, SanMar.
**Sources:** [S28: Fusion SCM: order line fulfillment task visibility](https://docs.oracle.com/en/cloud/saas/readiness/scm/26b/order26b/26B-order-mgmt-wn-f43111.htm), [S31: Smartpress turnaround after proof approval](https://smartpress.com/support/ordering-shipping/printing-turnaround-time), [S36: 4over turnaround times and proof dependencies](https://4over.com/turnaround-times), [S06: SanMar electronic integration offerings](https://www.sanmar.com/resources/electronicintegration/integrationofferings).

**Customer flow:** See truthful production progress and approved explanations for delays.

**Operator flow:** Receive materials, execute authorized operations, record actual quantities/time, inspect method-specific QC and resolve shortages or remakes.

**Logical records:** `material_receipt`, `operation_execution`, `qc_check`, `quantity_variance`, `production_hold`, `remake_requirement`.

**Required rules and edge handling:**

- Received, produced, rejected and shipped quantities reconcile.
- QC is tied to the operation and exact manufacturing revision.
- An operator cannot release a blocked or unapproved production artifact.

**Proposed commands:** `receipt.record`, `operation.record_actual`, `qc.record`, `production.release`.
**Proposed events:** `materials.received`, `qc.failed`, `production.released`.

**Behavioral acceptance additions — NOT RUN:**

- **F35-T01:** A short blank receipt creates a shortage and blocks excess production.
- **F35-T02:** Failed QC creates an attributable hold and possible remake requirement.
- **F35-T03:** Production release requires current artwork, commercial and purchasing gates.

**Existing code to extend:** [apps/os/components/workspace.tsx](../../apps/os/components/workspace.tsx), [packages/fulfillment/src/index.ts](../../packages/fulfillment/src/index.ts), [packages/orders/src/index.ts](../../packages/orders/src/index.ts), [packages/procurement/src/index.ts](../../packages/procurement/src/index.ts), [packages/production/src/index.ts](../../packages/production/src/index.ts), [packages/today/src/index.ts](../../packages/today/src/index.ts).

**Existing tests to extend:** [tests/modules/fulfillment.test.ts](../../tests/modules/fulfillment.test.ts), [tests/modules/orders.test.ts](../../tests/modules/orders.test.ts), [tests/modules/procurement.test.ts](../../tests/modules/procurement.test.ts), [tests/modules/today.test.ts](../../tests/modules/today.test.ts).

**Gap work:** GAP-018, GAP-024, GAP-025, GAP-026, GAP-030. **Modules:** orders, fulfillment, procurement, today.
**Original acceptance dependencies:** A16, A17, A21, A22, A23, A24, A25, A28, A30, E04, E10, E11, E12, E13, E19, E22, T05, T13, T14, T18, T19, T20, T21, T27, T30.
