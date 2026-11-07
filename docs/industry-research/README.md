# Industry knowledge and software application

Reviewed **November 6, 2026 (America/Chicago)**. This supplement expands the [17-company feature research](../business-research/README.md) across the relevant print, promotional-products and branded-merchandise value chain. It preserves the current architecture, active V1 and Coming Soon boundaries.

## What changes the product priorities

PPAI’s public research highlights pressure on margins and the value of operational efficiency. TwelveSpec should prioritize source validity, quote accuracy, approval continuity and repeatable fulfillment alongside guided customer design. Market research does not supply company-specific costs, sales targets or profit forecasts. [I02: PPAI 2025 US distributor sales estimate](https://www.ppai.org/media-hub/ppai-sales-volume-estimate-promo-reaches-new-height-but-hampered-by-external-volatility/), [I03: PPAI 2026 trends analysis](https://www.ppai.org/media-hub/ppai-research-new-year-new-ish-trends/).

PRINTING United Alliance separates market segments and technical disciplines, while sign, label and packaging bodies add important domain-specific requirements. TwelveSpec needs product-family rules and provider profiles rather than one universal artwork form. [I05: PRINTING United Alliance](https://www.printing.org/), [I06: PRINTING United industry benchmarking](https://www.printing.org/library/business-excellence/economics-forecasting/industry-reports/state-of-the-industry-series), [I09: ISA sign permitting resources](https://signs.org/codes-regulations/expert-assistance/permit/), [I10: TLMI technical, regulatory and sustainability committees](https://tlmi.com/community/committees/), [I11: FEFCO corrugated packaging code](https://www.fefco.org/technical-information/fefco-code).

The new local application correction removes generic DPI/bleed manufacturing assumptions from preliminary preflight. It retains measured effective raster resolution and distinguishes PASS, FAIL and UNVERIFIED. Production readiness stays BLOCKED. This is a partial correction within GAP-018, not a completed production-profile or export engine.

## Industry coverage and implementation

| Domain | Main data needs | Workflow in TwelveSpec | Feature / gap links |
| --- | --- | --- | --- |
| D01 Promotional hardgoods | exact style/part/variant; material/coating; surface and method; imprint evidence; setup/run/quantity costs; stock and freight freshness | Canonical product → configured source option → complete landed quote → art/proof review → approved supplier requirement → shipment/reorder. | F02, F03, F04, F16, F18, F21 / GAP-010, GAP-014, GAP-017, GAP-020, GAP-021, GAP-022, GAP-025 |
| D02 Decorated apparel and headwear | style/color/size matrix; fabric/construction; zone/seam limits; method and decorator; digitization/underbase/transfer needs; blank-to-decorator route | Size grid → exact variant → shared logo project → method-specific review → blank supply/decoration/QC → wearer or company delivery. | F02, F05, F07, F20, F31, F35 / GAP-009, GAP-017, GAP-018, GAP-019, GAP-024, GAP-025, GAP-026 |
| D03 School, team and fundraiser programs | organization/authorized buyer; campaign dates/timezone; product/size eligibility; intended user/use; minimum aggregation; pickup/shipping and allocation policy | Program membership → assigned catalog/brand → selection → close/minimum review → approved batch → distribution; retain allocation references. | F09, F10, F11, F12, F14 / GAP-011, GAP-013, GAP-024, GAP-027, GAP-032 |
| D04 POD and small-run merchandise | provider variant and print file contract; actual minimum; region/fulfillment origin; current cost and shipping; billing trigger; substitution permission | Validated configuration → customer agreement/payment gate → approved provider draft/confirmation → event reconciliation → packages/claims. | F14, F19, F21, F22, F24 / GAP-010, GAP-013, GAP-020, GAP-025, GAP-026, GAP-027, GAP-036 |
| D05 Commercial flat print, publications and stationery | finished/flat size and units; stock/caliper; page count/sides/binding; color/output condition; bleed/trim/safe from producer; file roles and finishing | Product family specification → original artwork → registered proof/preflight → frozen manufacturing specification → print/finish/QC/dispatch. | F02, F04, F07, F20, F31, F35 / GAP-009, GAP-010, GAP-017, GAP-018, GAP-024, GAP-026 |
| D06 Direct mail and variable-data print | mail class and delivery objective; piece dimensions/weight; addressing/recipient rights; barcode/clear zones; data merge fields; mailing partner and acceptance | Print specification + authorized variable data → merge/sample review → postal preparation acceptance → mailing evidence and cost references. | F06, F07, F21, F22, F25, F31 / GAP-003, GAP-018, GAP-024, GAP-026, GAP-027, GAP-029, GAP-034 |
| D07 Signs, wide format and applied graphics | substrate and finish; actual dimensions/scale; viewing/use environment; panel joins and cut paths; installation/site/permit scope; device/media profile | Project/site intake → supplier-specific media and artwork rules → panel/finish review → print/cut → installation or shipping handoff. | F07, F20, F21, F22, F31, F35 / GAP-017, GAP-018, GAP-024, GAP-025, GAP-026 |
| D08 Exhibitions, displays, tents and event kits | hardware/model; panel template/source revision; fabric/material; event in-hand date and destination; venue requirements; assembly and split freight | Campaign project → exact component/panel specs → coordinated art → multi-source agreement/jobs → consolidated or approved split delivery. | F05, F07, F13, F20, F22, F31 / GAP-009, GAP-012, GAP-017, GAP-018, GAP-024, GAP-026 |
| D09 Labels, stickers and converting | facestock/adhesive/liner; application conditions; roll/sheet and unwind direction; die/contour and gap; ink/white/varnish; regulatory claim and end use | Application-specific configuration → registered print/cut/finish roles → producer preflight → print/conversion/QC → traceable batch. | F02, F07, F20, F21, F31, F35 / GAP-017, GAP-018, GAP-024, GAP-025, GAP-026, GAP-032 |
| D10 Packaging, corrugated and folding cartons | style/classification; dimensions and measurement convention; material/board grade; producer-approved dieline; cut/crease/glue/no-print roles; content/use/jurisdiction | Packaging brief → producer source/dieline → panel-aware artwork → finish/preflight → print/conversion/assembly → shipment/QC. | F07, F13, F20, F31, F35 / GAP-012, GAP-017, GAP-018, GAP-024, GAP-026, GAP-032 |
| D11 Awards, drinkware, gifts and engraving | exact blank/material/coating; usable area/curvature; fixture and method; raster/vector roles; finish and personalization data; producer sample/acceptance | Exact blank → permitted decoration option → customer visual approval → specialist route evidence → QC and protected shipment. | F02, F07, F19, F21, F23, F31 / GAP-009, GAP-017, GAP-018, GAP-025, GAP-026 |
| D12 Industrial, safety and custom-engineered sourcing | intended use and technical requirements; drawings/spec revisions; material and performance claims; jurisdiction/responsible party; qualified manufacturer review; test/certification evidence where applicable | Assisted technical RFQ → source/engineering review → documented quote and approvals → specialist production handoff → inspection/reconciliation. | F08, F14, F21, F23, F28, F34 / GAP-013, GAP-018, GAP-020, GAP-025, GAP-026, GAP-028, GAP-032 |
| D13 B2B company stores, redemption and recurring programs | company/location/member grants; approved catalogs and brand revisions; budgets/allowances; commercial terms and seller; date/renewal policies; delivery and service rules | Program eligibility → configured catalog → atomic commitment/approval → order/jobs → delivery → reconciled usage → repeat/reorder. | F09, F10, F11, F12, F14, F15 / GAP-005, GAP-006, GAP-011, GAP-013, GAP-027, GAP-028 |
| D14 Bundles, kitting, warehousing and fulfillment | kit bill of materials; component quantities and variants; inbound/assembly/outbound destinations; packaging/labor; receipts and QC; partial shipment policy | Frozen kit agreement → component purchase requirements → receipts → assembly/QC → exact package allocations → actual cost closeout. | F13, F20, F21, F22, F24, F35 / GAP-010, GAP-012, GAP-024, GAP-025, GAP-026, GAP-027 |
| D15 Design, prepress, proof and media interchange | immutable original and editable revision; exact product/configuration tuple; physical vs pixel geometry; source/media/font rights; provider output profile; proof/technical review/recipient acceptance | Shared original → editable design → illustrative preview → independent proof decision and technical checks → approved derivative/route handoff. | F05, F06, F07, F25, F28, F31 / GAP-003, GAP-009, GAP-016, GAP-017, GAP-018, GAP-019, GAP-029, GAP-034 |
| D16 Distributor operations, economics and owner workload | source validity/cost components; quote and acceptance history; role/approval limits; actual costs/financial references; tasks/exception causes; owner and delegated time entries | Assigned inquiry → bounded staff decisions → governed exceptions → reliable event-driven follow-through → reconciled profit and workload metrics. | F04, F14, F21, F24, F26, F27, F28, F34 / GAP-005, GAP-007, GAP-010, GAP-013, GAP-025, GAP-027, GAP-028, GAP-030, GAP-031, GAP-035 |

### D01 — Promotional hardgoods

Canonical product → configured source option → complete landed quote → art/proof review → approved supplier requirement → shipment/reorder.

**Required inputs:** exact style/part/variant; material/coating; surface and method; imprint evidence; setup/run/quantity costs; stock and freight freshness.

**Exception conditions:** ambiguous part; unverified print area; substitution; stale landed cost; rights or product-safety evidence missing.

**Primary sources:** [I01: PPAI industry association](https://www.ppai.org/), [I03: PPAI 2026 trends analysis](https://www.ppai.org/media-hub/ppai-research-new-year-new-ish-trends/), [I17: GS1 size/color variation guidance](https://support.gs1.org/support/solutions/articles/43000734083-how-many-gs1-gtins-do-i-need-when-i-have-a-product-with-many-sizes-and-colours-), [I33: Quality Logo Products imprint education](https://www.qualitylogoproducts.com/blog/misconceptions-imprints-areas/), [I34: PromoStandards protocol families](https://promostandards.org/how-promostandards-makes-your-business-better/).

### D02 — Decorated apparel and headwear

Size grid → exact variant → shared logo project → method-specific review → blank supply/decoration/QC → wearer or company delivery.

**Required inputs:** style/color/size matrix; fabric/construction; zone/seam limits; method and decorator; digitization/underbase/transfer needs; blank-to-decorator route.

**Exception conditions:** cap curvature or seam conflict; unknown fabric compatibility; art differs from approved variant; missing digitization or sew-out evidence.

**Primary sources:** [I05: PRINTING United Alliance](https://www.printing.org/), [I06: PRINTING United industry benchmarking](https://www.printing.org/library/business-excellence/economics-forecasting/industry-reports/state-of-the-industry-series), [I25: Epilog raster versus vector engraving](https://support.epiloglaser.com/laser-machine/fusion-ascent/getting-started/raster-vs-vector/), [I27: Yoycol print specifications hub](https://www.yoycol.com/resources/print-specs-hub).

### D03 — School, team and fundraiser programs

Program membership → assigned catalog/brand → selection → close/minimum review → approved batch → distribution; retain allocation references.

**Required inputs:** organization/authorized buyer; campaign dates/timezone; product/size eligibility; intended user/use; minimum aggregation; pickup/shipping and allocation policy.

**Exception conditions:** campaign expiry; minimum not met; applicable children’s-product evidence unknown; complex settlement unavailable.

**Primary sources:** [I01: PPAI industry association](https://www.ppai.org/), [I28: CPSC promotional-product responsibility FAQ](https://www.cpsc.gov/FAQ/Promotional-Products), [I29: CPSC children’s product certificates](https://www.cpsc.gov/Business--Manufacturing/Testing-Certification/Childrens-Product-Certificate).

### D04 — POD and small-run merchandise

Validated configuration → customer agreement/payment gate → approved provider draft/confirmation → event reconciliation → packages/claims.

**Required inputs:** provider variant and print file contract; actual minimum; region/fulfillment origin; current cost and shipping; billing trigger; substitution permission.

**Exception conditions:** similar-item substitution; insufficient billing capacity; unverified print file; duplicate or uncertain submission.

**Primary sources:** [I03: PPAI 2026 trends analysis](https://www.ppai.org/media-hub/ppai-research-new-year-new-ish-trends/), [I27: Yoycol print specifications hub](https://www.yoycol.com/resources/print-specs-hub).

### D05 — Commercial flat print, publications and stationery

Product family specification → original artwork → registered proof/preflight → frozen manufacturing specification → print/finish/QC/dispatch.

**Required inputs:** finished/flat size and units; stock/caliper; page count/sides/binding; color/output condition; bleed/trim/safe from producer; file roles and finishing.

**Exception conditions:** wrong page geometry; unembedded fonts; unknown output intent; missing back or finish file; proof/turnaround delay.

**Primary sources:** [I05: PRINTING United Alliance](https://www.printing.org/), [I06: PRINTING United industry benchmarking](https://www.printing.org/library/business-excellence/economics-forecasting/industry-reports/state-of-the-industry-series), [I12: ISO processing steps for PDF](https://www.iso.org/standard/90532.html), [I13: ICC profile specifications](https://www.color.org/icc_specs2/), [I14: Ghent Workgroup packaging](https://gwg.org/subcommittees/packaging/), [I20: CIP4 JDF and XJDF](https://www.cip4.org/print-automation/jdf).

### D06 — Direct mail and variable-data print

Print specification + authorized variable data → merge/sample review → postal preparation acceptance → mailing evidence and cost references.

**Required inputs:** mail class and delivery objective; piece dimensions/weight; addressing/recipient rights; barcode/clear zones; data merge fields; mailing partner and acceptance.

**Exception conditions:** personal data exposed; invalid mail qualification; unconfirmed postage or delivery promise; missing mailing-partner acceptance.

**Primary sources:** [I30: USPS mailpiece design resources](https://pe.usps.com/MailpieceDesign/Index?ViewName=AdditionalResources), [I05: PRINTING United Alliance](https://www.printing.org/).

### D07 — Signs, wide format and applied graphics

Project/site intake → supplier-specific media and artwork rules → panel/finish review → print/cut → installation or shipping handoff.

**Required inputs:** substrate and finish; actual dimensions/scale; viewing/use environment; panel joins and cut paths; installation/site/permit scope; device/media profile.

**Exception conditions:** scale mismatch; unknown contour/tooling; site or permit requirement unresolved; material/device mismatch.

**Primary sources:** [I05: PRINTING United Alliance](https://www.printing.org/), [I06: PRINTING United industry benchmarking](https://www.printing.org/library/business-excellence/economics-forecasting/industry-reports/state-of-the-industry-series), [I09: ISA sign permitting resources](https://signs.org/codes-regulations/expert-assistance/permit/), [I25: Epilog raster versus vector engraving](https://support.epiloglaser.com/laser-machine/fusion-ascent/getting-started/raster-vs-vector/), [I26: Roland VersaWorks special ink aliases](https://files.rolanddga.com/Files/VersaWorks_6/topic/tAssigningAnArbitrarySpotColorNameToEachWhiteInkMetallicSilverInkGlossInkPrimer.html).

### D08 — Exhibitions, displays, tents and event kits

Campaign project → exact component/panel specs → coordinated art → multi-source agreement/jobs → consolidated or approved split delivery.

**Required inputs:** hardware/model; panel template/source revision; fabric/material; event in-hand date and destination; venue requirements; assembly and split freight.

**Exception conditions:** generic tent image used as dieline; deadline excludes proof/freight; unverified venue requirements; component arrives after kit assembly.

**Primary sources:** [I01: PPAI industry association](https://www.ppai.org/), [I05: PRINTING United Alliance](https://www.printing.org/), [I09: ISA sign permitting resources](https://signs.org/codes-regulations/expert-assistance/permit/).

### D09 — Labels, stickers and converting

Application-specific configuration → registered print/cut/finish roles → producer preflight → print/conversion/QC → traceable batch.

**Required inputs:** facestock/adhesive/liner; application conditions; roll/sheet and unwind direction; die/contour and gap; ink/white/varnish; regulatory claim and end use.

**Exception conditions:** wrong adhesive or unwind; die/finish misregistration; unsubstantiated food/chemical/sustainability claim; missing producer acceptance.

**Primary sources:** [I10: TLMI technical, regulatory and sustainability committees](https://tlmi.com/community/committees/), [I12: ISO processing steps for PDF](https://www.iso.org/standard/90532.html), [I14: Ghent Workgroup packaging](https://gwg.org/subcommittees/packaging/), [I26: Roland VersaWorks special ink aliases](https://files.rolanddga.com/Files/VersaWorks_6/topic/tAssigningAnArbitrarySpotColorNameToEachWhiteInkMetallicSilverInkGlossInkPrimer.html).

### D10 — Packaging, corrugated and folding cartons

Packaging brief → producer source/dieline → panel-aware artwork → finish/preflight → print/conversion/assembly → shipment/QC.

**Required inputs:** style/classification; dimensions and measurement convention; material/board grade; producer-approved dieline; cut/crease/glue/no-print roles; content/use/jurisdiction.

**Exception conditions:** style code mistaken for exact tooling; unapproved structural design; wrong panel orientation; unsupported environmental or contact-use claim.

**Primary sources:** [I10: TLMI technical, regulatory and sustainability committees](https://tlmi.com/community/committees/), [I11: FEFCO corrugated packaging code](https://www.fefco.org/technical-information/fefco-code), [I12: ISO processing steps for PDF](https://www.iso.org/standard/90532.html), [I14: Ghent Workgroup packaging](https://gwg.org/subcommittees/packaging/), [I31: FTC Green Guides summary](https://www.ftc.gov/business-guidance/resources/environmental-claims-summary-green-guides).

### D11 — Awards, drinkware, gifts and engraving

Exact blank → permitted decoration option → customer visual approval → specialist route evidence → QC and protected shipment.

**Required inputs:** exact blank/material/coating; usable area/curvature; fixture and method; raster/vector roles; finish and personalization data; producer sample/acceptance.

**Exception conditions:** photograph mistaken for scale; unknown coating or fixture; unapproved vector becomes toolpath; breakage or wrong personalization.

**Primary sources:** [I01: PPAI industry association](https://www.ppai.org/), [I25: Epilog raster versus vector engraving](https://support.epiloglaser.com/laser-machine/fusion-ascent/getting-started/raster-vs-vector/), [I26: Roland VersaWorks special ink aliases](https://files.rolanddga.com/Files/VersaWorks_6/topic/tAssigningAnArbitrarySpotColorNameToEachWhiteInkMetallicSilverInkGlossInkPrimer.html), [I33: Quality Logo Products imprint education](https://www.qualitylogoproducts.com/blog/misconceptions-imprints-areas/).

### D12 — Industrial, safety and custom-engineered sourcing

Assisted technical RFQ → source/engineering review → documented quote and approvals → specialist production handoff → inspection/reconciliation.

**Required inputs:** intended use and technical requirements; drawings/spec revisions; material and performance claims; jurisdiction/responsible party; qualified manufacturer review; test/certification evidence where applicable.

**Exception conditions:** unsupported safety claim; decorative art mistaken for engineering/CAD; unknown compliance responsibility; unverified substitution.

**Primary sources:** [I01: PPAI industry association](https://www.ppai.org/), [I09: ISA sign permitting resources](https://signs.org/codes-regulations/expert-assistance/permit/), [I28: CPSC promotional-product responsibility FAQ](https://www.cpsc.gov/FAQ/Promotional-Products), [I29: CPSC children’s product certificates](https://www.cpsc.gov/Business--Manufacturing/Testing-Certification/Childrens-Product-Certificate).

### D13 — B2B company stores, redemption and recurring programs

Program eligibility → configured catalog → atomic commitment/approval → order/jobs → delivery → reconciled usage → repeat/reorder.

**Required inputs:** company/location/member grants; approved catalogs and brand revisions; budgets/allowances; commercial terms and seller; date/renewal policies; delivery and service rules.

**Exception conditions:** lost store/brand context; concurrent overspend; expired allowance; unapproved credit; complex settlement unavailable.

**Primary sources:** [I01: PPAI industry association](https://www.ppai.org/), [I03: PPAI 2026 trends analysis](https://www.ppai.org/media-hub/ppai-research-new-year-new-ish-trends/).

### D14 — Bundles, kitting, warehousing and fulfillment

Frozen kit agreement → component purchase requirements → receipts → assembly/QC → exact package allocations → actual cost closeout.

**Required inputs:** kit bill of materials; component quantities and variants; inbound/assembly/outbound destinations; packaging/labor; receipts and QC; partial shipment policy.

**Exception conditions:** kit identity/cost lost in cart; missing component; freight counted once for multiple legs; shipment quantity exceeds accepted production.

**Primary sources:** [I01: PPAI industry association](https://www.ppai.org/), [I20: CIP4 JDF and XJDF](https://www.cip4.org/print-automation/jdf).

### D15 — Design, prepress, proof and media interchange

Shared original → editable design → illustrative preview → independent proof decision and technical checks → approved derivative/route handoff.

**Required inputs:** immutable original and editable revision; exact product/configuration tuple; physical vs pixel geometry; source/media/font rights; provider output profile; proof/technical review/recipient acceptance.

**Exception conditions:** zero interpreted as unknown; generic DPI/bleed defaults; flattened import called native editable; stale proof; private source leakage.

**Primary sources:** [I07: PRINTING United G7+ certification families](https://www.printing.org/library/technical-excellence/certifications/g7plus), [I08: G7+ System Certification](https://www.printing.org/library/technical-excellence/certifications/g7plus-system-certification), [I12: ISO processing steps for PDF](https://www.iso.org/standard/90532.html), [I13: ICC profile specifications](https://www.color.org/icc_specs2/), [I14: Ghent Workgroup packaging](https://gwg.org/subcommittees/packaging/), [I16: W3C SVG coordinate systems](https://www.w3.org/TR/SVG/coords.html), [I19: IPTC photo metadata](https://www.iptc.org/std/photometadata/specification/IPTC-PhotoMetadata-2025.1.html), [I22: Illustrator saved document presets](https://helpx.adobe.com/illustrator/desktop/add-and-import-files/start-a-new-file/create-and-save-custom-document-presets.html), [I24: Canva upload formats and requirements](https://www.canva.com/help/upload-formats-requirements/).

### D16 — Distributor operations, economics and owner workload

Assigned inquiry → bounded staff decisions → governed exceptions → reliable event-driven follow-through → reconciled profit and workload metrics.

**Required inputs:** source validity/cost components; quote and acceptance history; role/approval limits; actual costs/financial references; tasks/exception causes; owner and delegated time entries.

**Exception conditions:** sales growth mistaken for profit; stale supplier cost; capped KPI dataset; unobserved payment/PO success; unmeasured owner time savings.

**Primary sources:** [I02: PPAI 2025 US distributor sales estimate](https://www.ppai.org/media-hub/ppai-sales-volume-estimate-promo-reaches-new-height-but-hampered-by-external-volatility/), [I03: PPAI 2026 trends analysis](https://www.ppai.org/media-hub/ppai-research-new-year-new-ish-trends/), [I06: PRINTING United industry benchmarking](https://www.printing.org/library/business-excellence/economics-forecasting/industry-reports/state-of-the-industry-series), [I20: CIP4 JDF and XJDF](https://www.cip4.org/print-automation/jdf), [I34: PromoStandards protocol families](https://promostandards.org/how-promostandards-makes-your-business-better/).

## Applying the findings to existing modules

| Decision | Action | Related feature packs | Existing gap work |
| --- | --- | --- | --- |
| IND-01 One canonical catalog and source-offer boundary | KEEP_EXTEND: Retain existing canonical identity and private source records; creative references enter a review queue and never become a second PIM. | F03, F16, F17 | GAP-014, GAP-015, GAP-016 |
| IND-02 Separate creative canvas from verified imprint geometry | APPLIED_LOCAL_DIAGNOSTIC_AND_EXTEND: Preflight now labels manufacturing requirements unverified. A versioned, exact provider geometry/profile resolver is still open. | F02, F05, F07, F31 | GAP-009, GAP-017, GAP-018 |
| IND-03 No universal DPI, bleed or color defaults | APPLIED_LOCAL: Remove generic manufacturing thresholds from preliminary preflight; measure pixels/physical placement and retain null requirements. | F04, F07, F31 | GAP-010, GAP-017, GAP-018 |
| IND-04 Independent readiness for each intended use | EXTEND: Creative draft, preview, marketing, quote, proof, production and provider acceptance have separate evidence requirements. | F03, F07, F25 | GAP-016, GAP-018, GAP-029 |
| IND-05 Provider-specific process and layer semantics | EXTEND: Keep print, white/primer/varnish, foil, cut/crease and nonprinting guide roles separate; map target names in reviewed output profiles. | F07, F20, F31 | GAP-017, GAP-018, GAP-024 |
| IND-06 One original artwork and immutable lineage | KEEP_EXTEND: Retain originals, content hashes and exact configuration; extend safe edit/export fidelity rather than creating a separate editor. | F05, F06, F07 | GAP-003, GAP-009, GAP-019 |
| IND-07 Artwork interoperability is destination-specific | EXTEND_WITH_TESTS: Treat PNG/SVG/PDF interchange and native AI/AIT/Canva features as separate tests with explicit loss reports. | F05, F06, F31 | GAP-003, GAP-018, GAP-019 |
| IND-08 Batch and compliance evidence follows the finished product | EXTEND_QUALIFIED_REVIEW: Track intended use, responsible party, applicable jurisdiction and evidence; never infer all liability or certification from a supplier name. | F03, F21, F23, F28 | GAP-014, GAP-025, GAP-026, GAP-032 |
| IND-09 Claims and rights need field-level authority | EXTEND: Publish only allowed media and substantiated product/environmental claims, retaining effective dates and revocation history. | F03, F25, F28 | GAP-016, GAP-029, GAP-032, GAP-034 |
| IND-10 Program and kit identity survives commerce | EXTEND_EXISTING: Continue the actual cart/quote/order context repair; do not add an independent budget or bundle subsystem. | F10, F11, F12, F13 | GAP-011, GAP-012, GAP-024 |
| IND-11 Partner handoff includes uncertainty and acceptance | KEEP_EXTEND: Approved payload, transfer and acknowledgment are separate; reconcile ambiguous outcomes before repeating a write. | F19, F20, F21, F22 | GAP-020, GAP-024, GAP-025, GAP-026, GAP-036 |
| IND-12 Full versus partial feeds are explicit | EXTEND: A missing row in a partial feed does not mean discontinued; snapshot scope, cursors and failure checkpoints survive replay. | F16, F17, F18 | GAP-014, GAP-015, GAP-022 |
| IND-13 Direct native integrations and licensed discovery | KEEP: Use direct reviewed supplier profiles and authorized ASI interfaces. PSRESTful remains prohibited. | F16, F29 | GAP-020, GAP-021, GAP-022, GAP-023 |
| IND-14 Operational reporting measures owner workload | EXTEND_MEASURE_FIRST: Measure touches, active minutes, waiting causes and direct profit per owner hour; no invented savings or readiness percentage. | F24, F27, F34 | GAP-027, GAP-028, GAP-030, GAP-031 |
| IND-15 Advanced engines remain reserved | DEFER: AI design, automatic digitization, validated 3D, CAD, GL/payroll, enterprise MRP and autonomous purchasing stay Coming Soon. | F33 | GAP-001, GAP-032, GAP-038, GAP-040 |
| IND-16 Standards and research have scoped versions | APPLIED_RESEARCH_REGISTER: Maintain exact publisher, edition, access level, scope and review date; a standard abstract or association logo does not certify an output. | F16, F28, F31 | GAP-018, GAP-020, GAP-032, GAP-034 |

## Source interpretation and access

The source register records public facts separately from original TwelveSpec recommendations. The full PPAI and PRINTING United reports have access requirements; no subscription or purchase was made. GWG processing-step resources require login; the supplied GS1 image PDF returned 403. These gaps do not authorize substituting assumptions.

## Build, buy or delegate

| Capability | V1 approach | When to consider a specialized service |
| --- | --- | --- |
| Canonical catalog, configuration, quotes, approvals, jobs and reconciliation | Extend the existing domain packages and scoped database. | Use a provider adapter where account-specific integration is needed. |
| Artwork design, versioning and preview | Keep one original/normalized design and shared customer/staff flow. | Consider an editor/render library only after measured fidelity and maintenance comparisons. |
| Supplier-specific prepress and PDF/X | Use exact producer profiles and attributable qualified review. | Evaluate a validated preflight/export engine when route volume justifies it; no purchase is selected here. |
| Embroidery stitch files, complex wraps, structural engineering | Delegate to an authorized specialist and retain the resulting evidence. | Add a licensed engine only after sample acceptance, operating economics and approval. |
| Production interoperability | Use internal structured jobs plus the actual partner’s accepted handoff. | Add XJDF/proprietary adapters for a documented partner requirement. |
| AI, 3D, CAD, autonomous procurement and full ERP functions | Retain Coming Soon. | A future scoped activation decision is required. |

## Measure business outcomes

Record inquiry-to-issued-quote time, active owner/delegated minutes, proof revision count, exceptions by cause, first-pass technical acceptance, on-time quantity completion, remake cost, repeat ordering and actual direct gross profit per owner hour. Keep elapsed waiting time separate from hands-on work. Establish baselines before setting savings claims. Reports must aggregate the full scoped dataset rather than a capped UI list.

## Remaining evidence

For any physical product, obtain exact source part/variant, material, surface, eligible method, approved geometry, output profile, rights and route acceptance. Commercial readiness additionally needs current complete cost, destination/freight, availability, terms and approvals. Paid services, credentials, licensing, legal/financial commitments and new deployments retain their separate authorization gates.

The original [gap plan](../GAP_CLOSURE_PLAN.md) and [acceptance map](../planning/requirements-to-work.json) remain open. No new production integration, catalog publication, manufacturer claim, membership or certification has been activated.
