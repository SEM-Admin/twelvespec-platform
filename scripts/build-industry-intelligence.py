"""Public industry research supplement. Does not read the owner's private ZIP.

Vendor/association/standards observations are separate from original software
recommendations. No memberships, certifications, APIs or production routes are
activated by this build.
"""
from pathlib import Path
import json,csv

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'docs/industry-research'
OUT.mkdir(parents=True,exist_ok=True)
sources=[]
def source(key,name,url,kind,observation,application,edition=None,access='PUBLIC_PAGE_REVIEWED'):
    sources.append(dict(id=key,name=name,url=url,sourceType=kind,reviewedOn='2026-11-06',timezone='America/Chicago',
                        edition=edition,access=access,publicObservation=observation,twelveSpecApplication=application,
                        integrationVerification='NOT_TESTED',conformanceClaim='NONE'))

source('I01','PPAI industry association','https://www.ppai.org/','ASSOCIATION',
 'PPAI connects promotional-product distributors, suppliers and service providers through research, education and industry programs.',
 'Use an industry knowledge register and partner qualification; membership alone never sets route readiness.')
source('I02','PPAI 2025 US distributor sales estimate','https://www.ppai.org/media-hub/ppai-sales-volume-estimate-promo-reaches-new-height-but-hampered-by-external-volatility/','ASSOCIATION_RESEARCH',
 'The January 12, 2026 public summary estimates 2025 US distributor sales at $27.1 billion, up 1.3%; the full report is restricted to professional members.',
 'Track landed cost, quote expiry and actual direct profit. This market estimate is neither TwelveSpec revenue nor an addressable-market forecast.', '2025 study; public summary January 12, 2026')
source('I03','PPAI 2026 trends analysis','https://www.ppai.org/media-hub/ppai-research-new-year-new-ish-trends/','ASSOCIATION_RESEARCH',
 'PPAI discusses margin pressure, tariff uncertainty and operational efficiency in its 2026 outlook.',
 'Version freight/duty assumptions, reprice expired offers and measure quote handling and exception work.', 'January 7, 2026')
source('I04','PPAI sustainability and responsibility resources','https://www.ppai.org/sustainability/','ASSOCIATION_GUIDANCE',
 'PPAI provides responsible-sourcing and sustainability resources, including attention to packaging obligations.',
 'Store claim evidence, responsible party, applicable market and expiry; avoid an unsupported eco-ready badge.')
source('I05','PRINTING United Alliance','https://www.printing.org/','ASSOCIATION',
 'PRINTING United Alliance covers printing markets through education, technical resources, research and certification programs.',
 'Train role-specific operators across print, apparel, packaging and wide format; keep the application multi-family.')
source('I06','PRINTING United industry benchmarking','https://www.printing.org/library/business-excellence/economics-forecasting/industry-reports/state-of-the-industry-series','ASSOCIATION_RESEARCH_INDEX',
 'Its report index spans commercial print, wide format, print buyers and decorated apparel; full report access is membership/purchase dependent.',
 'Maintain separate segment, period, sample and currency metadata. Do not add overlapping market studies together.', '2026 report index; full reports not accessed')
source('I07','PRINTING United G7+ certification families','https://www.printing.org/library/technical-excellence/certifications/g7plus','CERTIFICATION_PROGRAM',
 'G7+ distinguishes expert, facility and system certification, each with its own requirements.',
 'Record credential scope, holder, version and validity; artwork upload cannot confer certification.')
source('I08','G7+ System Certification','https://www.printing.org/library/technical-excellence/certifications/g7plus-system-certification','CERTIFICATION_PROGRAM',
 'System certification evaluates print calibration capability and is specific to the evaluated system/version.',
 'A PDF, ICC tag or generated preview is not a certified printing system. Capture actual qualification evidence.')
source('I09','ISA sign permitting resources','https://signs.org/codes-regulations/expert-assistance/permit/','ASSOCIATION_GUIDANCE',
 'ISA describes permitting as part of sign projects and provides resources for local sign-code issues.',
 'Add project destination, installation scope, permit/engineering responsibility and approval status where applicable.')
source('I10','TLMI technical, regulatory and sustainability committees','https://tlmi.com/community/committees/','ASSOCIATION_GUIDANCE',
 'TLMI addresses label/converting technical topics and regulatory issues such as EPR and recycling.',
 'Treat facestock, adhesive, liner, roll orientation and application environment as explicit specification fields.')
source('I11','FEFCO corrugated packaging code','https://www.fefco.org/technical-information/fefco-code','DESIGN_CLASSIFICATION',
 'The official page identifies a 12th-edition classification of corrugated box designs.',
 'A style code aids communication; exact dimensions, material and a producer-approved dieline still govern manufacturing.', '12th edition as presented on the official page')
source('I12','ISO processing steps for PDF','https://www.iso.org/standard/90532.html','NORMATIVE_STANDARD_ABSTRACT',
 'ISO lists ISO 19593-1:2026, edition 2, published October 2026, with the 2018 edition withdrawn.',
 'Version finishing-layer semantics and target export profiles; the public abstract does not establish implementation conformance.', 'ISO 19593-1:2026, edition 2; full paid text not acquired')
source('I13','ICC profile specifications','https://www.color.org/icc_specs2/','PUBLISHED_SPECIFICATION',
 'ICC identifies ICC.1:2022/profile version 4.4 and describes ICC and iccMAX as distinct specifications.',
 'Record source/output profiles, intent and hashes per producer profile; do not infer a universal CMYK destination.', 'ICC.1:2022; April 2025 amendment noted on the page')
source('I14','Ghent Workgroup packaging','https://gwg.org/subcommittees/packaging/','INDUSTRY_TECHNICAL_GUIDANCE',
 'GWG distinguishes printable PDF content from packaging production information and develops processing-step test suites.',
 'Preserve cut, crease, varnish, white and other semantic roles separately from customer print art.')
source('I15','GWG processing-step specifications/test resources','https://gwg.org/technical-specifications/processing-steps/','RESTRICTED_SPECIFICATION',
 'The requested resource redirects to a login page.',
 'Keep exact profile/test-suite conformance unverified until authorized materials and fixtures are available.',access='LOGIN_REQUIRED_NOT_READ')
source('I16','W3C SVG coordinate systems','https://www.w3.org/TR/SVG/coords.html','WEB_STANDARD_REFERENCE',
 'SVG viewports, viewBox coordinates, transforms and physical units have distinct meanings.',
 'Use explicit mm-space and pixel transforms; CSS pixels and a viewBox are not independent manufacturing dimensions.', 'SVG 2 coordinate-system chapter; current TR page')
source('I17','GS1 size/color variation guidance','https://support.gs1.org/support/solutions/articles/43000734083-how-many-gs1-gtins-do-i-need-when-i-have-a-product-with-many-sizes-and-colours-','IDENTITY_GUIDANCE',
 'GS1 identifies size/color combinations as distinct product variations for GTIN assignment.',
 'Retain exact source-part/variant identity and validate supplied GTINs; never generate a manufacturer GTIN from a title.', 'Modified August 30, 2024')
source('I18','GS1 system architecture','https://ref.gs1.org/architecture/system-architecture/','PUBLISHED_ARCHITECTURE',
 'The published architecture distinguishes identification, capture, sharing and data use.',
 'Separate canonical identity, external identifiers, master/source facts and transaction/visibility events.', 'Version 12.0.0, October 2024 as served')
source('I19','IPTC photo metadata','https://www.iptc.org/std/photometadata/specification/IPTC-PhotoMetadata-2025.1.html','PUBLISHED_SPECIFICATION',
 'The pinned metadata specification includes creator, credit, rights usage and accessibility fields.',
 'Carry rights/attribution and accessibility through allowed public derivatives; redact private routing and personal details.', '2025.1 rev 1, November 26, 2025')
source('I20','CIP4 JDF and XJDF','https://www.cip4.org/print-automation/jdf','PUBLISHED_PROTOCOL_FAMILY',
 'CIP4 maintains JDF/JMF and XJDF/XJMF for exchanging production information.',
 'Keep a shared internal job contract and add an adapter only for a real partner requirement; no machine actuation is enabled.')
source('I21','CIP4 Conventional Printing ICS','https://www.cip4.org/news-detail/cip4-publishes-a-new-version-of-the-conventional-printing-ics','PUBLISHED_PROTOCOL_NOTICE',
 'CIP4 announced XJDF Conventional Printing ICS 2.2 on April 27, 2026, scoped to specific workflow roles.',
 'Pin the exact role/profile when integrating a partner; a generic XML export does not prove interoperability.', 'MIS-CP ICS 2.2 notice')
source('I22','Illustrator saved document presets','https://helpx.adobe.com/illustrator/desktop/add-and-import-files/start-a-new-file/create-and-save-custom-document-presets.html','VENDOR_INSTRUCTIONS',
 'Adobe documents saved New Document presets with artboard, units, bleed, color mode and raster-effect settings.',
 'Distinguish a reusable document preset, a native editable template and a producer-approved imprint specification.', 'Help page updated October 27, 2025')
source('I23','Illustrator native-template reference URL','https://helpx.adobe.com/illustrator/desktop/manage-documents/save-and-export-files/create-document-templates.html','VENDOR_REFERENCE_LEAD',
 'This supplied URL was not accessible through the research tool.',
 'Native AI/AIT editing and Saved-tab behavior require licensed desktop verification; no native success is inferred.',access='URL_UNAVAILABLE')
source('I24','Canva upload formats and requirements','https://www.canva.com/help/upload-formats-requirements/','VENDOR_INSTRUCTIONS',
 'Canva documents format-specific constraints and warns that imported Illustrator layers may flatten.',
 'Treat imported imagery, editable objects and native frames as separate capability tests; preserve originals and report fidelity loss.')
source('I25','Epilog raster versus vector engraving','https://support.epiloglaser.com/laser-machine/fusion-ascent/getting-started/raster-vs-vector/','DEVICE_VENDOR_GUIDANCE',
 'Epilog distinguishes raster and vector artwork behavior for engraving.',
 'Keep raster engraving, vector engraving and cutting roles separate; material/fixture/machine settings are provider controlled.', 'Supplied /staging/ URL redirects to this canonical path')
source('I26','Roland VersaWorks special ink aliases','https://files.rolanddga.com/Files/VersaWorks_6/topic/tAssigningAnArbitrarySpotColorNameToEachWhiteInkMetallicSilverInkGlossInkPrimer.html','DEVICE_VENDOR_INSTRUCTIONS',
 'VersaWorks maps spot-name aliases to particular special-ink channels.',
 'Use provider/device export mappings for white, gloss, metallic and primer rather than hardcoded global spot names.', 'VersaWorks 6 documentation')
source('I27','Yoycol print specifications hub','https://www.yoycol.com/resources/print-specs-hub','SUPPLIER_GUIDANCE',
 'The hub gives different requirements for DTG, DTF, AOP, sublimation and embroidery and directs users to exact product templates.',
 'Do not universalize one supplier’s resolution, color mode, maximum area, MOQ or lead time.')
source('I28','CPSC promotional-product responsibility FAQ','https://www.cpsc.gov/FAQ/Promotional-Products','REGULATOR_GUIDANCE',
 'Official indexed text makes responsibility dependent on the arrangements for decorating, producing and selling a finished children’s product.',
 'Record responsible parties and applicability decisions instead of assuming a supplier owns every obligation.',access='OFFICIAL_INDEXED_EXCERPT_DIRECT_FETCH_403')
source('I29','CPSC children’s product certificates','https://www.cpsc.gov/Business--Manufacturing/Testing-Certification/Childrens-Product-Certificate','REGULATOR_GUIDANCE',
 'CPSC distinguishes applicable children’s-product rules, responsible manufacturers/importers, test evidence and certificates; the page notes 2026 eFiling changes.',
 'Track intended use/age, jurisdiction, responsible party, batch/lot, applicable tests and evidence. Qualified review determines the particular obligation.')
source('I30','USPS mailpiece design resources','https://pe.usps.com/MailpieceDesign/Index?ViewName=AdditionalResources','POSTAL_AUTHORITY_GUIDANCE',
 'USPS points to the DMM for official domestic mailing standards and QSGs for summaries.',
 'Direct-mail configuration needs mail class, dimensions/weight, addressing, preparation and mailing-partner acceptance, not just print bleed.')
source('I31','FTC Green Guides summary','https://www.ftc.gov/business-guidance/resources/environmental-claims-summary-green-guides','REGULATOR_GUIDANCE',
 'FTC guidance calls for support and qualification of environmental marketing claims.',
 'Require substantiation, claim wording, scope and review before publishing sustainability assertions; a recycled tag is insufficient.')
source('I32','GS1 product image specification reference','https://www.gs1.org/sites/default/files/docs/gdsn/Product_Image_Specification.pdf','SPECIFICATION_REFERENCE_LEAD',
 'Direct access to the supplied PDF returned 403.',
 'Keep detailed image-standard conformance unverified; do not fabricate naming or image-angle requirements.',access='FETCH_BLOCKED_403')
source('I33','Quality Logo Products imprint education','https://www.qualitylogoproducts.com/blog/misconceptions-imprints-areas/','VENDOR_EDUCATION_NON_NORMATIVE',
 'This educational article discusses how substrate and decoration method affect an imprint.',
 'Useful buyer education; broad comparisons and included-color examples are not universal pricing or engineering rules.', 'July 12, 2021')
source('I34','PromoStandards protocol families','https://promostandards.org/how-promostandards-makes-your-business-better/','PUBLISHED_PROTOCOL_OVERVIEW',
 'PromoStandards publishes separate data, status and transaction protocol families.',
 'Verify each direct supplier service/version independently. Retain the explicit prohibition on PSRESTful.')
source('I35','GWG user-guide reference URL','https://gwg.org/user-guides/','TECHNICAL_REFERENCE_LEAD',
 'The research tool could not retrieve this resource within its content limit.',
 'Mark detailed guide contents unreviewed; rely on accessible public summaries without claiming full conformance.',access='TOOL_CONTENT_LIMIT_NOT_READ')
source('I36','PDF Association ISO status register','https://pdfa.org/iso-status/','STANDARDS_STATUS_REFERENCE',
 'PDF Association publishes a status register for ISO work relating to PDF.',
 'Use standards version/status metadata and verify the normative publisher before selecting an output contract.')

domains=[]
def domain(key,name,sources_,inputs,workflow,risks,modules,features,gaps):
    domains.append(dict(id=key,name=name,sources=sources_,requiredInputs=inputs,
                        twelveSpecWorkflow=workflow,exceptionConditions=risks,modules=modules,features=features,
                        gaps=[f'GAP-{n:03}' for n in gaps],status='RESEARCHED_SCOPE_NOT_SUPPLIER_VERIFIED'))

domain('D01','Promotional hardgoods',['I01','I03','I17','I33','I34'],
 ['exact style/part/variant','material/coating','surface and method','imprint evidence','setup/run/quantity costs','stock and freight freshness'],
 'Canonical product → configured source option → complete landed quote → art/proof review → approved supplier requirement → shipment/reorder.',
 ['ambiguous part','unverified print area','substitution','stale landed cost','rights or product-safety evidence missing'],
 ['catalog','supplier','configuration','estimating','procurement'],['F02','F03','F04','F16','F18','F21'],[10,14,17,20,21,22,25])
domain('D02','Decorated apparel and headwear',['I05','I06','I25','I27'],
 ['style/color/size matrix','fabric/construction','zone/seam limits','method and decorator','digitization/underbase/transfer needs','blank-to-decorator route'],
 'Size grid → exact variant → shared logo project → method-specific review → blank supply/decoration/QC → wearer or company delivery.',
 ['cap curvature or seam conflict','unknown fabric compatibility','art differs from approved variant','missing digitization or sew-out evidence'],
 ['configuration','creative','orders','procurement','fulfillment'],['F02','F05','F07','F20','F31','F35'],[9,17,18,19,24,25,26])
domain('D03','School, team and fundraiser programs',['I01','I28','I29'],
 ['organization/authorized buyer','campaign dates/timezone','product/size eligibility','intended user/use','minimum aggregation','pickup/shipping and allocation policy'],
 'Program membership → assigned catalog/brand → selection → close/minimum review → approved batch → distribution; retain allocation references.',
 ['campaign expiry','minimum not met','applicable children’s-product evidence unknown','complex settlement unavailable'],
 ['stores','commerce','orders','finance'],['F09','F10','F11','F12','F14'],[11,13,24,27,32])
domain('D04','POD and small-run merchandise',['I03','I27'],
 ['provider variant and print file contract','actual minimum','region/fulfillment origin','current cost and shipping','billing trigger','substitution permission'],
 'Validated configuration → customer agreement/payment gate → approved provider draft/confirmation → event reconciliation → packages/claims.',
 ['similar-item substitution','insufficient billing capacity','unverified print file','duplicate or uncertain submission'],
 ['supplier','commerce','procurement','fulfillment','finance'],['F14','F19','F21','F22','F24'],[10,13,20,25,26,27,36])
domain('D05','Commercial flat print, publications and stationery',['I05','I06','I12','I13','I14','I20'],
 ['finished/flat size and units','stock/caliper','page count/sides/binding','color/output condition','bleed/trim/safe from producer','file roles and finishing'],
 'Product family specification → original artwork → registered proof/preflight → frozen manufacturing specification → print/finish/QC/dispatch.',
 ['wrong page geometry','unembedded fonts','unknown output intent','missing back or finish file','proof/turnaround delay'],
 ['configuration','creative','estimating','orders','fulfillment'],['F02','F04','F07','F20','F31','F35'],[9,10,17,18,24,26])
domain('D06','Direct mail and variable-data print',['I30','I05'],
 ['mail class and delivery objective','piece dimensions/weight','addressing/recipient rights','barcode/clear zones','data merge fields','mailing partner and acceptance'],
 'Print specification + authorized variable data → merge/sample review → postal preparation acceptance → mailing evidence and cost references.',
 ['personal data exposed','invalid mail qualification','unconfirmed postage or delivery promise','missing mailing-partner acceptance'],
 ['configuration','creative','orders','fulfillment','marketing','finance'],['F06','F07','F21','F22','F25','F31'],[3,18,24,26,27,29,34])
domain('D07','Signs, wide format and applied graphics',['I05','I06','I09','I25','I26'],
 ['substrate and finish','actual dimensions/scale','viewing/use environment','panel joins and cut paths','installation/site/permit scope','device/media profile'],
 'Project/site intake → supplier-specific media and artwork rules → panel/finish review → print/cut → installation or shipping handoff.',
 ['scale mismatch','unknown contour/tooling','site or permit requirement unresolved','material/device mismatch'],
 ['configuration','creative','orders','procurement','fulfillment'],['F07','F20','F21','F22','F31','F35'],[17,18,24,25,26])
domain('D08','Exhibitions, displays, tents and event kits',['I01','I05','I09'],
 ['hardware/model','panel template/source revision','fabric/material','event in-hand date and destination','venue requirements','assembly and split freight'],
 'Campaign project → exact component/panel specs → coordinated art → multi-source agreement/jobs → consolidated or approved split delivery.',
 ['generic tent image used as dieline','deadline excludes proof/freight','unverified venue requirements','component arrives after kit assembly'],
 ['byob','configuration','creative','orders','fulfillment'],['F05','F07','F13','F20','F22','F31'],[9,12,17,18,24,26])
domain('D09','Labels, stickers and converting',['I10','I12','I14','I26'],
 ['facestock/adhesive/liner','application conditions','roll/sheet and unwind direction','die/contour and gap','ink/white/varnish','regulatory claim and end use'],
 'Application-specific configuration → registered print/cut/finish roles → producer preflight → print/conversion/QC → traceable batch.',
 ['wrong adhesive or unwind','die/finish misregistration','unsubstantiated food/chemical/sustainability claim','missing producer acceptance'],
 ['configuration','creative','orders','procurement','fulfillment'],['F02','F07','F20','F21','F31','F35'],[17,18,24,25,26,32])
domain('D10','Packaging, corrugated and folding cartons',['I10','I11','I12','I14','I31'],
 ['style/classification','dimensions and measurement convention','material/board grade','producer-approved dieline','cut/crease/glue/no-print roles','content/use/jurisdiction'],
 'Packaging brief → producer source/dieline → panel-aware artwork → finish/preflight → print/conversion/assembly → shipment/QC.',
 ['style code mistaken for exact tooling','unapproved structural design','wrong panel orientation','unsupported environmental or contact-use claim'],
 ['configuration','creative','orders','byob','fulfillment'],['F07','F13','F20','F31','F35'],[12,17,18,24,26,32])
domain('D11','Awards, drinkware, gifts and engraving',['I01','I25','I26','I33'],
 ['exact blank/material/coating','usable area/curvature','fixture and method','raster/vector roles','finish and personalization data','producer sample/acceptance'],
 'Exact blank → permitted decoration option → customer visual approval → specialist route evidence → QC and protected shipment.',
 ['photograph mistaken for scale','unknown coating or fixture','unapproved vector becomes toolpath','breakage or wrong personalization'],
 ['configuration','creative','procurement','fulfillment'],['F02','F07','F19','F21','F23','F31'],[9,17,18,25,26])
domain('D12','Industrial, safety and custom-engineered sourcing',['I01','I09','I28','I29'],
 ['intended use and technical requirements','drawings/spec revisions','material and performance claims','jurisdiction/responsible party','qualified manufacturer review','test/certification evidence where applicable'],
 'Assisted technical RFQ → source/engineering review → documented quote and approvals → specialist production handoff → inspection/reconciliation.',
 ['unsupported safety claim','decorative art mistaken for engineering/CAD','unknown compliance responsibility','unverified substitution'],
 ['crm','sales','supplier','procurement','fulfillment'],['F08','F14','F21','F23','F28','F34'],[13,18,20,25,26,28,32])
domain('D13','B2B company stores, redemption and recurring programs',['I01','I03'],
 ['company/location/member grants','approved catalogs and brand revisions','budgets/allowances','commercial terms and seller','date/renewal policies','delivery and service rules'],
 'Program eligibility → configured catalog → atomic commitment/approval → order/jobs → delivery → reconciled usage → repeat/reorder.',
 ['lost store/brand context','concurrent overspend','expired allowance','unapproved credit','complex settlement unavailable'],
 ['crm','stores','commerce','sales','finance'],['F09','F10','F11','F12','F14','F15'],[5,6,11,13,27,28])
domain('D14','Bundles, kitting, warehousing and fulfillment',['I01','I20'],
 ['kit bill of materials','component quantities and variants','inbound/assembly/outbound destinations','packaging/labor','receipts and QC','partial shipment policy'],
 'Frozen kit agreement → component purchase requirements → receipts → assembly/QC → exact package allocations → actual cost closeout.',
 ['kit identity/cost lost in cart','missing component','freight counted once for multiple legs','shipment quantity exceeds accepted production'],
 ['byob','orders','procurement','fulfillment','finance'],['F13','F20','F21','F22','F24','F35'],[10,12,24,25,26,27])
domain('D15','Design, prepress, proof and media interchange',['I07','I08','I12','I13','I14','I16','I19','I22','I24'],
 ['immutable original and editable revision','exact product/configuration tuple','physical vs pixel geometry','source/media/font rights','provider output profile','proof/technical review/recipient acceptance'],
 'Shared original → editable design → illustrative preview → independent proof decision and technical checks → approved derivative/route handoff.',
 ['zero interpreted as unknown','generic DPI/bleed defaults','flattened import called native editable','stale proof','private source leakage'],
 ['creative','configuration','marketing','foundation'],['F05','F06','F07','F25','F28','F31'],[3,9,16,17,18,19,29,34])
domain('D16','Distributor operations, economics and owner workload',['I02','I03','I06','I20','I34'],
 ['source validity/cost components','quote and acceptance history','role/approval limits','actual costs/financial references','tasks/exception causes','owner and delegated time entries'],
 'Assigned inquiry → bounded staff decisions → governed exceptions → reliable event-driven follow-through → reconciled profit and workload metrics.',
 ['sales growth mistaken for profit','stale supplier cost','capped KPI dataset','unobserved payment/PO success','unmeasured owner time savings'],
 ['foundation','today','estimating','sales','finance','workflow','analytics'],['F04','F14','F21','F24','F26','F27','F28','F34'],[5,7,10,13,25,27,28,30,31,35])

decisions=[
 ('IND-01','One canonical catalog and source-offer boundary','F03 F16 F17','14 15 16','KEEP_EXTEND','Retain existing canonical identity and private source records; creative references enter a review queue and never become a second PIM.'),
 ('IND-02','Separate creative canvas from verified imprint geometry','F02 F05 F07 F31','9 17 18','APPLIED_LOCAL_DIAGNOSTIC_AND_EXTEND','Preflight now labels manufacturing requirements unverified. A versioned, exact provider geometry/profile resolver is still open.'),
 ('IND-03','No universal DPI, bleed or color defaults','F04 F07 F31','10 17 18','APPLIED_LOCAL','Remove generic manufacturing thresholds from preliminary preflight; measure pixels/physical placement and retain null requirements.'),
 ('IND-04','Independent readiness for each intended use','F03 F07 F25','16 18 29','EXTEND','Creative draft, preview, marketing, quote, proof, production and provider acceptance have separate evidence requirements.'),
 ('IND-05','Provider-specific process and layer semantics','F07 F20 F31','17 18 24','EXTEND','Keep print, white/primer/varnish, foil, cut/crease and nonprinting guide roles separate; map target names in reviewed output profiles.'),
 ('IND-06','One original artwork and immutable lineage','F05 F06 F07','3 9 19','KEEP_EXTEND','Retain originals, content hashes and exact configuration; extend safe edit/export fidelity rather than creating a separate editor.'),
 ('IND-07','Artwork interoperability is destination-specific','F05 F06 F31','3 18 19','EXTEND_WITH_TESTS','Treat PNG/SVG/PDF interchange and native AI/AIT/Canva features as separate tests with explicit loss reports.'),
 ('IND-08','Batch and compliance evidence follows the finished product','F03 F21 F23 F28','14 25 26 32','EXTEND_QUALIFIED_REVIEW','Track intended use, responsible party, applicable jurisdiction and evidence; never infer all liability or certification from a supplier name.'),
 ('IND-09','Claims and rights need field-level authority','F03 F25 F28','16 29 32 34','EXTEND','Publish only allowed media and substantiated product/environmental claims, retaining effective dates and revocation history.'),
 ('IND-10','Program and kit identity survives commerce','F10 F11 F12 F13','11 12 24','EXTEND_EXISTING','Continue the actual cart/quote/order context repair; do not add an independent budget or bundle subsystem.'),
 ('IND-11','Partner handoff includes uncertainty and acceptance','F19 F20 F21 F22','20 24 25 26 36','KEEP_EXTEND','Approved payload, transfer and acknowledgment are separate; reconcile ambiguous outcomes before repeating a write.'),
 ('IND-12','Full versus partial feeds are explicit','F16 F17 F18','14 15 22','EXTEND','A missing row in a partial feed does not mean discontinued; snapshot scope, cursors and failure checkpoints survive replay.'),
 ('IND-13','Direct native integrations and licensed discovery','F16 F29','20 21 22 23','KEEP','Use direct reviewed supplier profiles and authorized ASI interfaces. PSRESTful remains prohibited.'),
 ('IND-14','Operational reporting measures owner workload','F24 F27 F34','27 28 30 31','EXTEND_MEASURE_FIRST','Measure touches, active minutes, waiting causes and direct profit per owner hour; no invented savings or readiness percentage.'),
 ('IND-15','Advanced engines remain reserved','F33','1 32 38 40','DEFER','AI design, automatic digitization, validated 3D, CAD, GL/payroll, enterprise MRP and autonomous purchasing stay Coming Soon.'),
 ('IND-16','Standards and research have scoped versions','F16 F28 F31','18 20 32 34','APPLIED_RESEARCH_REGISTER','Maintain exact publisher, edition, access level, scope and review date; a standard abstract or association logo does not certify an output.')]
decision_rows=[dict(id=i,title=t,features=f.split(),gaps=[f'GAP-{int(x):03}' for x in g.split()],decision=state,implementation=desc) for i,t,f,g,state,desc in decisions]
payload=dict(schemaVersion=1,title='TwelveSpec industry intelligence supplement',researchDate='2026-11-06',timezone='America/Chicago',
             scope='Public industry research and original software application decisions; no private attachment contents are embedded.',
             sources=sources,domains=domains,decisions=decision_rows,
             limitations=['Broad relevant value-chain coverage, not an exhaustive survey of every geography or product regulation.',
                          'Public summaries and restricted/unavailable resources are labeled separately.',
                          'No authenticated supplier, legal certification, paid report or manufacturing route is verified by research.',
                          'Existing architecture and original 20-module/95-scenario acceptance remain controlling.'])
(OUT/'industry-intelligence.json').write_text(json.dumps(payload,indent=2)+'\n')

def esc(x):return str(x).replace('|','\\|').replace('\n',' ')
def table(headers,rows):return '\n'.join(['| '+' | '.join(headers)+' |','| '+' | '.join('---' for _ in headers)+' |']+['| '+' | '.join(esc(v) for v in row)+' |' for row in rows])
lookup={s['id']:s for s in sources}
def refs(ids):return ', '.join(f'[{i}: {lookup[i]["name"]}]({lookup[i]["url"]})' for i in ids)

text=['# Industry knowledge and software application','',
 'Reviewed **November 6, 2026 (America/Chicago)**. This supplement expands the [17-company feature research](../business-research/README.md) across the relevant print, promotional-products and branded-merchandise value chain. It preserves the current architecture, active V1 and Coming Soon boundaries.','',
 '## What changes the product priorities','',
 'PPAI’s public research highlights pressure on margins and the value of operational efficiency. TwelveSpec should prioritize source validity, quote accuracy, approval continuity and repeatable fulfillment alongside guided customer design. Market research does not supply company-specific costs, sales targets or profit forecasts. '+refs(['I02','I03'])+'.','',
 'PRINTING United Alliance separates market segments and technical disciplines, while sign, label and packaging bodies add important domain-specific requirements. TwelveSpec needs product-family rules and provider profiles rather than one universal artwork form. '+refs(['I05','I06','I09','I10','I11'])+'.','',
 'The new local application correction removes generic DPI/bleed manufacturing assumptions from preliminary preflight. It retains measured effective raster resolution and distinguishes PASS, FAIL and UNVERIFIED. Production readiness stays BLOCKED. This is a partial correction within GAP-018, not a completed production-profile or export engine.','',
 '## Industry coverage and implementation','',table(['Domain','Main data needs','Workflow in TwelveSpec','Feature / gap links'],[
 [d['id']+' '+d['name'],'; '.join(d['requiredInputs']),d['twelveSpecWorkflow'],', '.join(d['features'])+' / '+', '.join(d['gaps'])] for d in domains]),'']
for d in domains:
    text += ['### '+d['id']+' — '+d['name'],'',d['twelveSpecWorkflow'],'',
             '**Required inputs:** '+'; '.join(d['requiredInputs'])+'.','',
             '**Exception conditions:** '+'; '.join(d['exceptionConditions'])+'.','',
             '**Primary sources:** '+refs(d['sources'])+'.','']
text += ['## Applying the findings to existing modules','',table(['Decision','Action','Related feature packs','Existing gap work'],[
 [r['id']+' '+r['title'],r['decision']+': '+r['implementation'],', '.join(r['features']),', '.join(r['gaps'])] for r in decision_rows]),'',
 '## Source interpretation and access','',
 'The source register records public facts separately from original TwelveSpec recommendations. The full PPAI and PRINTING United reports have access requirements; no subscription or purchase was made. GWG processing-step resources require login; the supplied GS1 image PDF returned 403. These gaps do not authorize substituting assumptions.','',
 '## Build, buy or delegate','',table(['Capability','V1 approach','When to consider a specialized service'],[
 ['Canonical catalog, configuration, quotes, approvals, jobs and reconciliation','Extend the existing domain packages and scoped database.','Use a provider adapter where account-specific integration is needed.'],
 ['Artwork design, versioning and preview','Keep one original/normalized design and shared customer/staff flow.','Consider an editor/render library only after measured fidelity and maintenance comparisons.'],
 ['Supplier-specific prepress and PDF/X','Use exact producer profiles and attributable qualified review.','Evaluate a validated preflight/export engine when route volume justifies it; no purchase is selected here.'],
 ['Embroidery stitch files, complex wraps, structural engineering','Delegate to an authorized specialist and retain the resulting evidence.','Add a licensed engine only after sample acceptance, operating economics and approval.'],
 ['Production interoperability','Use internal structured jobs plus the actual partner’s accepted handoff.','Add XJDF/proprietary adapters for a documented partner requirement.'],
 ['AI, 3D, CAD, autonomous procurement and full ERP functions','Retain Coming Soon.','A future scoped activation decision is required.']]),'',
 '## Measure business outcomes','',
 'Record inquiry-to-issued-quote time, active owner/delegated minutes, proof revision count, exceptions by cause, first-pass technical acceptance, on-time quantity completion, remake cost, repeat ordering and actual direct gross profit per owner hour. Keep elapsed waiting time separate from hands-on work. Establish baselines before setting savings claims. Reports must aggregate the full scoped dataset rather than a capped UI list.','',
 '## Supplier data, blank images and templates','',
 'The [supplier access assessment](SUPPLIER_DATA_ACCESS.md) records available API/feed/download routes, source-specific template limits, permitted crawling and the remaining connector/credential work. It distinguishes documented offerings from authenticated integration verification.','',
 '## Remaining evidence','',
 'For any physical product, obtain exact source part/variant, material, surface, eligible method, approved geometry, output profile, rights and route acceptance. Commercial readiness additionally needs current complete cost, destination/freight, availability, terms and approvals. Paid services, credentials, licensing, legal/financial commitments and new deployments retain their separate authorization gates.','',
 'The original [gap plan](../GAP_CLOSURE_PLAN.md) and [acceptance map](../planning/requirements-to-work.json) remain open. No new production integration, catalog publication, manufacturer claim, membership or certification has been activated.']
(OUT/'README.md').write_text('\n'.join(text)+'\n')
register=['# Industry source register','',
 'Reviewed November 6, 2026 in America/Chicago. Public documentation establishes scope and behavior; no integration or standards conformance is certified. Full copyrighted standards/reports have not been reproduced.','',
 table(['ID / source','Type and edition','Access','Public observation','TwelveSpec application'],[
 [f'[{s["id"]}: {s["name"]}]({s["url"]})',s['sourceType']+'; '+(s['edition'] or 'edition/date not stated'),s['access'],s['publicObservation'],s['twelveSpecApplication']] for s in sources])]
(OUT/'SOURCES.md').write_text('\n'.join(register)+'\n')
for filename,headers,rows in [
 ('industry-domains.csv',['domain_id','name','required_inputs','workflow','exception_conditions','modules','features','gaps','sources'],[[d['id'],d['name'],'; '.join(d['requiredInputs']),d['twelveSpecWorkflow'],'; '.join(d['exceptionConditions']),';'.join(d['modules']),';'.join(d['features']),';'.join(d['gaps']),';'.join(d['sources'])] for d in domains]),
 ('industry-decisions.csv',['decision_id','title','decision','application','features','gaps'],[[d['id'],d['title'],d['decision'],d['implementation'],';'.join(d['features']),';'.join(d['gaps'])] for d in decision_rows])]:
    with (OUT/filename).open('w',newline='') as f:
        writer=csv.writer(f,lineterminator='\n');writer.writerow(headers);writer.writerows(rows)
print(f'Built public industry supplement: {len(sources)} source records, {len(domains)} domains and {len(decision_rows)} application decisions.')
