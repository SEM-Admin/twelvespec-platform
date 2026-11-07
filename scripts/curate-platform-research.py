"""Curated public feature research. No accounts, live APIs, or vendor code are used.

This file is the reviewable input to build-platform-research.py. All proposed
behavior below is TwelveSpec design work, not a claim about a vendor's internals.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs/business-research'
OUT.mkdir(parents=True, exist_ok=True)
SOURCES = []

def source(key, company, title, url, access='PRIMARY_PAGE_REVIEWED', note=''):
    SOURCES.append(dict(id=key, company=company, title=title, url=url,
                        reviewedOn='2026-11-06', timezone='America/Chicago',
                        access=access, note=note,
                        proves='Publicly documented behavior only; no authenticated integration test.'))

source('S01','custom-ink','Custom Ink: how it works','https://www.customink.com/how-it-works')
source('S02','custom-ink','Collect sizes and payments with a group form','https://www.customink.com/help_center/collecting-sizes-and-payment-with-gof')
source('S03','pcna','PCNA authorized distributor account application','https://cloud.engage.pcna.com/account_application')
source('S04','pcna','PCNA print and promo marketing page','https://cloud.engage.pcna.com/Print-Promo-Marketing',note='The sample offer explicitly says expired. Its earnings, margin and order-volume claims are excluded from financial assumptions.')
source('S05','pcna','PCNA main site access limitation','https://www.pcna.com/en-us','FETCH_BLOCKED_403','No bypass attempted. Current API schemas, account pricing and service entitlements remain unverified.')
source('S06','sanmar','SanMar electronic integration offerings','https://www.sanmar.com/resources/electronicintegration/integrationofferings')
source('S07','sanmar','SanMar terms and conditions','https://info.sanmar.com/termsandconditions')
source('S08','imprint','Imprint.com catalog and design assistance','https://imprint.com/')
source('S09','imprint','Imprint.com pricing factors','https://imprint.com/help-center/faq-how-is-my-price-determined')
source('S10','imprint','Imprint.com proof eligibility','https://imprint.com/help-center/will-i-get-a-proof-to-review-before-my-order-is-printed')
source('S11','4imprint','4imprint ordering, proof, payment and delivery FAQ','https://www.4imprint.com/info/faq')
source('S12','printify','Printify API reference','https://developers.printify.com/',note='Documentation contains V1 APIs and a V2 catalog. Pin each operation independently; catalog versions are not interchangeable.')
source('S13','printify','Printify Order Routing behavior','https://help.printify.com/hc/en-us/articles/4483625090321-What-is-Order-Routing-and-how-does-it-work')
source('S14','ordermygear','OrderMyGear online store types and controls','https://www.ordermygear.com/online-stores/')
source('S15','ordermygear','OrderMyGear FAQs and fulfillment responsibility','https://www.ordermygear.com/faqs/')
source('S16','printnow','PrintNow Enterprise API introduction','https://docs.printnow.com/docs/enterprise-api/introduction')
source('S17','printnow','PrintNow public integration overview','https://printnow.com/web-to-print-api')
source('S18','vistaprint','VistaPrint downloadable design proofs','https://www.vistaprint.com/customer-care/help-center/360052259371/',note='Page reports updated October 12, 2026; PDF proof exclusions include calendars and photo books.')
source('S19','vistaprint','VistaPrint order status and tracking','https://www.vistaprint.com/customer-care/help-center/360050082651/')
source('S20','printful','Printful API v1: catalog, orders and confirmation','https://developers.printful.com/docs/')
source('S21','printful','Printful API v2 Open Beta status','https://help.printful.com/hc/en-us/articles/50262214313873-What-should-I-know-about-Printful-s-API-v2')
source('S22','printful','Printful fulfillment billing','https://help.printful.com/hc/en-us/articles/50264607936785-How-does-the-Printful-billing-system-work')
source('S23','shopify','Shopify B2B feature availability by plan','https://help.shopify.com/en/manual/b2b/getting-started/plan-features',note='Current page allows B2B on Basic/Grow/Advanced/Plus, with plan-specific limits. Do not repeat the older blanket Plus-only assertion.')
source('S24','shopify','Shopify B2B development model','https://shopify.dev/docs/apps/build/b2b','OFFICIAL_DOC_SEARCH_REVIEWED','Read through connected Shopify documentation search. Company, company location and contact are distinct resources.')
source('S25','bigcommerce','BigCommerce B2B integration overview','https://docs.bigcommerce.com/developer/docs/b2b-edition/getting-started/overview')
source('S26','bigcommerce','BigCommerce B2B API families and context','https://docs.bigcommerce.com/developer/docs/b2b-edition/getting-started/about-our-apis',note='Server-to-server authentication guidance differs from storefront user context; the page also contains legacy examples.')
source('S27','oracle','NetSuite custom purchase approval workflows','https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/section_N2396564.html')
source('S28','oracle','Fusion SCM: order line fulfillment task visibility','https://docs.oracle.com/en/cloud/saas/readiness/scm/26b/order26b/26B-order-mgmt-wn-f43111.htm')
source('S29','oracle','Fusion SCM 26D removed and replaced features','https://docs.oracle.com/en/cloud/saas/readiness/scm/26d/order26d/26D-order-mgmt-wn-t78045.htm',note='26D removes orchestration planning functionality. Use task visibility as a pattern, not a promise to reproduce a removed vendor scheduling feature.')
source('S30','smartpress','Smartpress reseller program and blind shipping','https://smartpress.com/pages/print-reseller-program')
source('S31','smartpress','Smartpress turnaround after proof approval','https://smartpress.com/support/ordering-shipping/printing-turnaround-time')
source('S32','sinalite','SinaLite basic and full API integration options','https://sinalite.com/en_us/api-signup','PRIMARY_SEARCH_EXCERPT_ONLY_FETCH_403','Official indexed page describes catalog/pricing and full order/artwork/status integration. Direct page fetch blocked; wire protocol and eligibility unverified.')
source('S33','sinalite','SinaLite trade-only business model','https://sinalite.com/en_us/aboutus-tradeonly','PRIMARY_SEARCH_EXCERPT_ONLY_FETCH_403','Direct page fetch blocked. Treat trade eligibility and packaging terms as requiring account confirmation.')
source('S34','sinalite','SinaLite ordering and product specification guide','https://sinalite.com/en_us/how-to-place-print-order','PRIMARY_SEARCH_EXCERPT_REVIEWED','Official indexed guide: account-based wholesale ordering and custom work. No wholesale price capture.')
source('S35','4over','4over trade resources and API program','https://blog.4over.com/5-ways-4over-helps-you-sell',note='A public program description establishes that a program is advertised; current technical access and commercial terms are not established.')
source('S36','4over','4over turnaround times and proof dependencies','https://4over.com/turnaround-times')
source('S37','gotprint','GotPrint broker program requirements and blind shipping','https://www.gotprint.com/company/info/brokers.html',note='Observed eligibility includes US location, business documentation and five orders/month to maintain broker status; reconfirm before activation.')
source('S38','gotprint','GotPrint API terms and licensing','https://www.gotprint.com/company/terms/api.html',note='Published effective date December 28, 2021. Describes qualified clients, setup fees and restricted data rights. Not a current commercial quote or technical onboarding approval.')
source('S39','standards','PromoStandards interoperability purpose','https://promostandards.org/About-Us/')

COMPANIES = []
def company(key, name, role, facts, sources, learn, adapt, avoid, unknown, modules):
    COMPANIES.append(dict(id=key,name=name,role=role,publicFacts=facts,sources=sources,
                          featureLesson=learn,twelveSpecDesign=adapt,boundary=avoid,
                          unknown=unknown,modules=modules,integrationVerification='NOT_TESTED',
                          analysisType='ORIGINAL_TWELVESPEC_DESIGN_FROM_PUBLIC_BEHAVIOR'))

company('custom-ink','Custom Ink','Customer experience benchmark',
        'Browser design and artist review accompany ordering; group forms collect participant sizes and payments.', ['S01','S02'],
        'Reduce organizer effort while preserving a single accountable ordering workflow.',
        'Use one shared design project, an organizer view, a size/variant matrix and an explicit campaign close. Create a reviewed batch request at close; keep participant payment states separate from the production order.',
        'TwelveSpec must still bind every proof to the exact variant and obtain its own production authorization. Group fund settlement remains reserved.',
        'Internal design engine, artwork algorithms, group settlement implementation and private APIs were not inspected.', ['creative','configuration','stores','commerce','sales'])
company('pcna','PCNA','Promo supplier and sourcing workflow benchmark',
        'PCNA accepts authorized distributor applications and advertises decorated goods across apparel and hardgoods.', ['S03','S04'],
        'Represent an external source as a supplier offer with decoration and fulfillment capabilities, rather than replacing the canonical product.',
        'Store source product/part IDs, available methods, imprint areas, charge identifiers and fulfillment origins. Make account eligibility and service verification separate administrator steps.',
        'An expired marketing offer supplies no usable margin, order volume, current rush promise or entitlement.',
        'Main site fetch returned 403. Exact supported services, API profiles, negotiated costs and media rights require authorized documents.', ['supplier','catalog','estimating','procurement','fulfillment'])
company('sanmar','SanMar','Blank apparel supplier and data integration benchmark',
        'Public integration choices include PromoStandards, flat files and direct services; brand and marketplace restrictions are published.', ['S06','S07'],
        'Separate the blank garment, warehouse inventory and decorating operation; publication rights vary by channel.',
        'Model style/color/size variants, warehouse-level inventory snapshots and blank-to-decorator job routing. Add channel restrictions to the publication gate and mapping provenance to every imported field.',
        'Website access, API access, brand image permission and marketplace authorization are distinct.',
        'Account cost tiers, freight, exact service versions, inventory reservation and decorator agreements remain unverified.', ['catalog','supplier','configuration','orders','procurement'])
company('imprint','Imprint.com','Broad catalog and configuration benchmark',
        'Pricing depends on product, imprint colors, quantity and method; digital proofs are conditional rather than universal.', ['S08','S09','S10'],
        'A short guided configurator can expose complexity progressively and route exceptions to an assisted quote.',
        'Ask method-dependent questions, update quantity-break comparisons and show the cost assumptions behind an estimate. Keep visual preview, proof review and production preflight as separate states.',
        'Selected-product shipping/setup offers cannot become global TwelveSpec pricing rules. Preserve the handoff’s stronger proof requirements.',
        'No public technical API contract was established in the sampled sources; internal pricing and artwork processing are unknown.', ['catalog','configuration','creative','estimating','sales'])
company('4imprint','4imprint','Assisted sales and approval benchmark',
        'A representative supports ordering; proofs, post-approval production time and credit review are explicit parts of the published process.', ['S11'],
        'Pair customer self-service with an accountable rep and a clear queue for decisions.',
        'Attach an account owner, task timeline, proof decision and promised date to each quote/order. Track artwork waiting time separately from supplier production and carrier transit.',
        'Vendor credit and cancellation policies do not override TwelveSpec prepaid/approved Net 15 policy.',
        'No private CRM, sourcing agreements, unit economics or API implementation was inspected.', ['crm','sales','creative','orders','finance'])
company('printify','Printify','POD catalog, routing and fulfillment benchmark',
        'The documented catalog distinguishes blueprint, provider and variant; routing can choose exact or similar alternatives within settings.', ['S12','S13'],
        'A purchasable variant includes the fulfillment provider and print-area contract, with explicit substitution policy.',
        'Build a provider-neutral adapter and routing proposal. Before a source change, compare exact item, print geometry, region, landed cost and promised date; require renewed authorization for material changes.',
        'Autonomous supplier spend remains Coming Soon. A similar product is never an invisible replacement for an approved item.',
        'Provider-specific quality, charges, geography, token scopes and observed fulfillment performance require account testing.', ['supplier','catalog','configuration','procurement','fulfillment'])
company('ordermygear','OrderMyGear','Company and campaign store benchmark',
        'Company, pop-up, redemption and POD stores are advertised, with budgets and permissions; the operating dealer handles fulfillment and refunds.', ['S14','S15'],
        'Store programs are policy-driven purchasing contexts with different close, funding and fulfillment behavior.',
        'Create explicit program types, membership/eligibility, budgets, brand approvals and close dates. Carry store and allowance identity through cart, request, quote, order and cancellation.',
        'Points, fundraising allocations and real financial settlement must not be represented as interchangeable money.',
        'Plan entitlements, API schemas and customer-specific commercial rights remain unverified.', ['stores','commerce','byob','sales','fulfillment'])
company('printnow','PrintNow','Web-to-print and MIS integration benchmark',
        'Enterprise documentation separates REST resources, webhooks and cXML/procurement integration; order operations include print-file retrieval and shipping updates.', ['S16','S17'],
        'The editor, storefront, production files and order management need stable contracts rather than a visual-only connection.',
        'Use revisioned templates, durable render jobs, private artifacts and a job-ticket handoff that names exact files and specifications. Keep provider APIs behind the same adapter boundary.',
        'Current Product API descriptions are narrower than marketing language about a full print catalog. Packaging CAD and validated 3D remain future.',
        'Internal rendering technology, template file format, license rights and tenant-specific endpoint access are unknown.', ['creative','configuration','orders','supplier','workflow'])
company('vistaprint','VistaPrint','Print self-service and account experience benchmark',
        'The design studio offers downloadable PDF proofs with product exclusions; account order history exposes order status and tracking.', ['S18','S19'],
        'Give customers a portable review artifact and a clear path back to their saved work.',
        'Add a version-bound proof download, accessible project history and an order timeline. A reorder starts a repriced draft with current availability and a visible comparison to the original.',
        'A screen or PDF preview is not evidence that a file passes method-specific prepress.',
        'No private template format, production engine, partner API or rendering internals were inspected.', ['creative','commerce','sales','fulfillment'])
company('printful','Printful','POD order, asset and event integration benchmark',
        'API draft confirmation can trigger fulfillment charges; v2 is documented as Open Beta, and merchant and fulfillment billing are distinct.', ['S20','S21','S22'],
        'Separate an editable order draft from the financially consequential production submission.',
        'Use exact provider variants and print files, a verified pre-submit gate, cost estimates, idempotency and shipment updates. Preserve supplier payable events separately from customer receipt/payout events.',
        'Pin the tested API version and capability. A successful catalog read does not verify production submission.',
        'Authorized account configuration, current region pricing, samples, branding options and actual API behavior remain untested.', ['supplier','creative','procurement','fulfillment','finance'])
company('shopify','Shopify','Commerce and B2B data-model benchmark',
        'B2B documentation distinguishes company, location and contact; current plan differences include catalog assignments and advanced payment features.', ['S23','S24'],
        'A buyer’s identity, company membership and location-specific commercial policy are different concerns.',
        'Create company/location membership with roles, allowed catalogs, address books and approved terms. Keep TwelveSpec’s core commerce independent; an optional channel adapter maps external IDs later.',
        'This research does not authorize store migration or access to an existing Shopify store. Feature availability is plan-specific.',
        'App scopes, store entitlements, channel conflicts, subscription cost and merchant credentials remain outside this public research.', ['crm','stores','commerce','sales','finance'])
company('bigcommerce','BigCommerce','B2B quote, portal and API permission benchmark',
        'B2B APIs expose company users, quotes and invoices; buyer-facing APIs and server management APIs use different contexts.', ['S25','S26'],
        'Treat a buyer request, seller-issued quote and accepted agreement as distinct resources.',
        'Use a customer quote portal with buyer-specific permissions and immutable seller revisions. Expose a narrow public projection while server-side staff commands retain cost and supplier data.',
        'Administrative tokens never belong in the customer browser; a buyer session cannot act as a company-wide administrator.',
        'B2B licensing, tenant roles, API scope and authenticated behavior were not tested.', ['crm','sales','commerce','foundation'])
company('oracle','Oracle: NetSuite and Fusion ERP/SCM','Enterprise approval and fulfillment-control benchmark',
        'NetSuite documents approval limits and routing; Fusion exposes fulfillment tasks per line and publishes release-specific feature removals.', ['S27','S28','S29'],
        'Use explicit approvals, task history and change control. NetSuite and Fusion are separate product families.',
        'Build requirement-level PO approval, per-line fulfillment tasks, holds, accountable owners and reconciliation queues. Connect accounting references without implementing a general ledger.',
        'Full GL, payroll, enterprise MRP and autonomous procurement stay Coming Soon; do not clone an ERP suite or removed Fusion planning behavior.',
        'No Oracle account, tenant configuration, integration license or internal ERP database was inspected.', ['foundation','orders','procurement','fulfillment','finance','today'])
company('smartpress','Smartpress','Reseller print and proof-dependent scheduling benchmark',
        'The reseller program offers blind shipping and reorder workflows; turnaround starts after proof approval, with combined-job shipping dependencies.', ['S30','S31'],
        'Print jobs need their own approval and completion dates inside a multi-job customer order.',
        'Keep stock, finish, dimensions, proof revision, production clock, shipment grouping and blind-ship identity in the agreement. Calculate order readiness from required jobs, not the first completed item.',
        'A published reseller benefit is not an approved TwelveSpec trade account or a universal delivery guarantee.',
        'No public wire-level API contract was established; special quotes, account terms and current shipment constraints require confirmation.', ['configuration','creative','orders','fulfillment','sales'])
company('sinalite','SinaLite','Trade print catalog and order integration benchmark',
        'Official indexed pages describe catalog/pricing integration and a fuller option including orders, artwork, status and tracking.', ['S32','S33','S34'],
        'Catalog enablement and transactional fulfillment are separate integration milestones.',
        'Add per-capability activation, source option mapping, order payload validation, private artwork transfer and acknowledgment reconciliation. Keep US/Canada currencies and catalogs distinct.',
        'Direct pages returned 403; indexed descriptions support discovery only, not schema or account verification.',
        'API protocol, sandbox, credentials, commercial eligibility, artwork rules and account-specific charges remain unverified.', ['supplier','catalog','procurement','fulfillment'])
company('4over','4over','Trade print options, file intake and production timing benchmark',
        '4over advertises a trade API program; turnaround guidance distinguishes facility cutoff, production, proof and shipping dependencies.', ['S35','S36'],
        'Print option combinations and facility calendars must survive the storefront-to-job transition.',
        'Version exact stock/size/side/finish selections, keep front/back artwork roles distinct and schedule against the source facility calendar. Retain external order IDs for reconciliation.',
        'Old program marketing is insufficient to promise a currently supported endpoint, wholesale rate or delivery date.',
        'Authorized current API schemas, product rules, prices, facility capacity and file-transfer requirements remain unverified.', ['configuration','supplier','orders','fulfillment'])
company('gotprint','GotPrint','Broker portal and conditional API-access benchmark',
        'The broker program includes blind shipping and eligibility requirements; API terms describe qualified access, setup fees and limited data rights.', ['S37','S38'],
        'Wholesale program eligibility and technical integration entitlement need separate records and expiry checks.',
        'Build an evidence checklist for approved reseller status, permitted media, supported operations and account-specific pricing. Enforce those gates before publishing or transmitting orders.',
        'Published API terms are not an executed agreement, current fee quote or valid access key.',
        'Current API onboarding, protocol, fee amount, qualification and product coverage require authorized confirmation.', ['supplier','catalog','procurement','foundation'])

FEATURES=[]
def feature(key,title,companies,source_ids,modules,gaps,priority,customer,operator,records,rules,commands,events,tests,scope='ACTIVE_V1_DESIGN'):
    FEATURES.append(dict(id=key,title=title,inspiration=companies,sources=source_ids,
                         modules=modules,gaps=[f'GAP-{n:03}' for n in gaps],priority=priority,
                         scope=scope,status='DESIGNED_NOT_IMPLEMENTED_BY_THIS_RESEARCH',
                         customerFlow=customer,operatorFlow=operator,records=records,
                         invariants=rules,proposedCommands=commands,proposedEvents=events,
                         proposedTests=tests,testExecution='NOT_RUN_DESIGN_ONLY'))

feature('F01','Guided discovery and assisted handoff',['custom-ink','imprint','4imprint'],['S01','S08','S11'],['catalog','commerce','crm'],[16,28,33,38],'P1',
 'Browse by product or purpose, filter available variants, save a shortlist and ask for help without retyping selections.',
 'Receive the same configuration, deadline and customer context in an assigned inquiry queue.',
 ['catalog_query','saved_shortlist','inquiry','account_assignment'],
 ['Search and counts use server pagination across the entire scoped catalog.','A failed query is an error state, not an empty catalog.','Anonymous discovery never reveals source costs or credentials.'],
 ['catalog.search','inquiry.submit'],['inquiry.submitted'],
 ['Given more than 1,000 variants, a matching item beyond the first page is discoverable.','Submitting twice with the same request key creates one inquiry.','A customer response contains no supplier costs or credential fields.'])
feature('F02','Dependent options and apparel quantity matrix',['custom-ink','imprint','sanmar'],['S01','S09','S06'],['configuration','catalog','commerce','estimating'],[10,14,17,38],'P1',
 'Choose product, color, size quantities, method and location; incompatible selections explain what must change.',
 'Preview and publish a versioned family rule set with exact imprint zones and minimum/increment rules.',
 ['configuration_family','variant','option_group','option_constraint','imprint_area','saved_configuration'],
 ['Size rows resolve to exact canonical variants; a family selection is not a purchasable SKU.','Quantity breaks use the configured grouping rule; mixed methods or artworks do not silently share a tier.','A product or template change invalidates prior configuration approval.'],
 ['configuration.validate','configuration.save','configuration.publish_revision'],['configuration.validated'],
 ['A disallowed method/location combination cannot enter the cart.','A size matrix with a missing price stays quote-only.','Changing the template leaves an issued order’s snapshot unchanged.'])
feature('F03','Canonical products, supplier offers and media rights',['pcna','sanmar','sinalite','gotprint'],['S03','S06','S07','S32','S38'],['catalog','supplier'],[14,15,16],'P0',
 'See one truthful product identity with its available variants and permitted images.',
 'Compare multiple source offers, resolve uncertain matches, approve publication and inspect field provenance.',
 ['product','variant','external_product','external_part','supplier_offer','field_provenance','media_license','publication_revision'],
 ['Supplier part identifiers are scoped to connection and provider.','Ambiguous matches enter a review queue; title similarity alone never merges products.','Disabled, rolled-back, expired or unlicensed offers cannot supply a new commercial price.'],
 ['catalog.propose_match','catalog.approve_match','catalog.publish_revision'],['catalog.source_mapped','catalog.publication_changed'],
 ['Two providers with the same SKU string remain distinct source parts.','Rolling back an import makes its new offers ineligible for quoting.','An image with expired channel rights is absent from the customer projection.'])
feature('F04','Component pricing with quantity precision',['imprint','pcna','printify','4over'],['S09','S12','S35'],['estimating','sales','finance'],[10,13,27],'P0',
 'See a quantity comparison and clear quote-only reasons for incomplete costs.',
 'Compare landed costs and apply the versioned margin policy with an audited exception flow.',
 ['cost_component','price_break','price_snapshot','margin_policy','override_approval','currency'],
 ['Preserve supplier unit precision until quantity extension; round commercial totals by policy.','Missing freight, setup, decoration or currency is unknown, not zero.','Target margin uses cost/(1-margin); a 40% markup is not a 40% margin.','Tax collected for remittance is excluded from margin revenue.'],
 ['estimate.calculate','estimate.request_override','estimate.freeze'],['estimate.calculated','margin_override.requested'],
 ['Unit cost 0.0250 times quantity 1,000 extends to 25.00.','An unknown freight cost blocks a firm checkout price.','A below-floor quote cannot be issued without a valid scoped override.'])
feature('F05','Shared 2D design project and private assets',['custom-ink','imprint','vistaprint','printnow'],['S01','S08','S18','S16'],['creative','configuration','commerce'],[3,9,17,19],'P0',
 'Customize text and artwork on a product-specific 2D canvas, save a project and resume it on another device.',
 'Open the same project, adjust with permission and produce a new revision with an attributable history.',
 ['design_project','design_version','design_layer','artwork_asset','derivative_asset','project_share'],
 ['The project binds product, variant, method, location and template revision.','Each save creates an immutable revision; assets use private durable storage.','Changing a saved color or size rebinds the project and invalidates approvals that no longer apply.'],
 ['creative.create_project','creative.save_revision','creative.rebind_variant','creative.render_preview'],['design.version_created','render.requested'],
 ['Saving then changing the cap color creates a correctly bound project/revision.','A collaborator from another workspace cannot read a private asset.','An interrupted render can resume without losing the saved design.'])
feature('F06','Brand-controlled editable templates',['printnow','ordermygear','vistaprint'],['S16','S14','S18'],['creative','stores','configuration','marketing'],[11,17,19,29],'P1',
 'Choose an approved company template and edit only permitted text, image and color fields.',
 'Lock logo placement, set fonts and color rules, preview changes, then publish a new template version.',
 ['brand_kit','brand_asset','editable_field','template_revision','template_assignment'],
 ['A customer cannot unlock a protected field through a crafted API request.','Font and asset rights are checked before publication or export.','Template updates do not silently replace issued proofs or accepted specifications.'],
 ['template.create_revision','template.validate','template.publish','template.assign'],['template.published'],
 ['Changing a locked logo layer is rejected server-side.','An invalid text overflow is reported before save or proof generation.','A new template revision preserves existing accepted order artifacts.'])
feature('F07','Version-bound proof and method-specific prepress',['4imprint','vistaprint','smartpress','imprint'],['S11','S18','S31','S10'],['creative','orders','fulfillment'],[9,18,24],'P0',
 'Review the exact configured item, request a revision or approve a named proof version and download the artifact.',
 'Run method-specific checks and record qualified manual review for checks that cannot be automated.',
 ['proof_revision','proof_decision','preflight_report','review_check','production_artifact'],
 ['Preview, customer proof approval and production preflight are independent gates.','A proof hash alone is insufficient: product, variant, design, method and location must also match.','No unconditional pass is allowed; unresolved review stays blocked.','Changes to the relevant content or specifications revoke affected approvals.'],
 ['proof.generate','proof.approve','proof.request_changes','preflight.record_review'],['proof.approved','preflight.completed'],
 ['A proof from another product with the same artwork hash is rejected.','Editing artwork after approval blocks production release.','An authorized manual review records reviewer, checks, evidence and exact revision.'])
feature('F08','Assisted RFQ and commercial intake',['4imprint','custom-ink','smartpress'],['S11','S01','S30'],['crm','sales','estimating'],[13,28,38],'P1',
 'Request a quote using saved selections, artwork, intended quantity, destination and required in-hand date.',
 'Assign a rep, identify missing information, compare supplier alternatives and issue a clear revision.',
 ['request','request_line','requirement_question','quote_revision','sales_task'],
 ['Request submission creates no supplier spend or false paid order.','Request revisions preserve what changed and who answered.','A supplier estimate expires independently from a customer quote.'],
 ['request.submit','request.assign','request.request_information','quote.prepare_revision'],['request.submitted','quote.revision_prepared'],
 ['Missing destination is visible as a freight uncertainty.','Duplicate RFQ submission produces one durable request.','An expired supplier estimate forces repricing before a new firm quote.'])
feature('F09','B2B company, location and buyer permissions',['shopify','bigcommerce','ordermygear'],['S23','S24','S25','S14'],['crm','stores','foundation','commerce'],[5,6,11,28,32],'P0',
 'Order for an authorized company location, use approved addresses and see only permitted catalogs and terms.',
 'Manage company members, buyer roles, locations and approval limits independently from staff permissions.',
 ['company','company_location','company_contact','location_membership','catalog_assignment','terms_approval'],
 ['Tenant/workspace scope and company/location grants are both required.','A contact may belong to multiple companies without sharing their private orders.','Buyer administrator privileges never imply TwelveSpec staff or finance privileges.'],
 ['company.invite_member','company.assign_location','company.grant_buyer_role'],['company.membership_changed'],
 ['A buyer for location A cannot view location B’s restricted quote.','Revoking a membership invalidates subsequent protected actions.','An address ID from another company is rejected.'])
feature('F10','Company-store budgets through checkout',['ordermygear','shopify'],['S14','S15','S23'],['stores','commerce','sales','orders','finance'],[6,11,13],'P0',
 'Shop a permitted company catalog, see remaining allowance and submit any required manager approval.',
 'Reserve budget against an exact agreement, approve within limits, release on cancellation and reconcile actual usage.',
 ['store_program','store_membership','budget','budget_reservation','approval_request','agreement_context'],
 ['Store, brand kit, budget and membership identity survive cart → RFQ → quote → order.','Reservation and acceptance are atomic; concurrent buyers cannot overspend.','Cancel/expiry releases a reservation exactly once; fulfillment converts commitment under the approved policy.'],
 ['store.validate_checkout','budget.reserve','budget.release','budget.commit'],['budget.reserved','budget.released','budget.committed'],
 ['Two concurrent 60.00 orders against 100.00 cannot both reserve.','A forged brand kit or store context fails at quote acceptance.','A duplicate cancellation releases budget once.'])
feature('F11','Campaign close and group quantity collection',['custom-ink','ordermygear'],['S02','S14','S15'],['stores','commerce','orders'],[11,24,31],'P1',
 'Enter eligible size/variant choices before a clearly displayed campaign close time.',
 'Review participation, resolve minimums and exceptions, close the campaign and create reviewed production batches.',
 ['campaign','participant_selection','campaign_close_revision','batch_requirement'],
 ['Campaign close uses a stored timezone and server clock.','Minimum quantity failure creates a decision queue, never an unapproved purchase.','Fundraising allocation is a reference; complex fund settlement remains disabled.'],
 ['campaign.submit_selection','campaign.close','campaign.propose_batch'],['campaign.closed','campaign.batch_proposed'],
 ['A selection after the close boundary is rejected.','Repeating close does not create duplicate production batches.','A below-minimum campaign opens a hold rather than charging or purchasing.'])
feature('F12','Redemption and allowance identity',['ordermygear'],['S14','S15'],['stores','commerce','finance'],[11,13,27],'P1',
 'Redeem an eligible one-time allowance for approved items and see any policy-based balance.',
 'Issue scoped grants with expiry, revoke unused grants and review redemption attempts.',
 ['redemption_grant','allowance','redemption_attempt','budget_reservation'],
 ['Store only a hash of a secret redemption code.','Redemption is atomically single-use or explicitly quantity-limited.','Points and allowances are distinct from cash, processor payment and fundraiser settlement.'],
 ['redemption.issue','redemption.redeem','redemption.revoke'],['redemption.reserved','redemption.consumed'],
 ['Two simultaneous uses of a single-use code produce one reservation.','A code for another program cannot buy an unassigned item.','Expired grants fail without consuming allowance.'])
feature('F13','BYOB kits with assembly and multi-source cost',['pcna','ordermygear','smartpress'],['S04','S14','S30'],['byob','estimating','commerce','orders','fulfillment'],[10,12,24,26],'P0',
 'Build an eligible kit with required and optional components, packaging and a truthful complete estimate.',
 'Approve the bill of materials, source components, receive them, assemble and inspect the kit before dispatch.',
 ['bundle_template','kit_configuration','kit_component','packaging_requirement','assembly_operation','kit_job'],
 ['Kit identity, quantities, packaging and labor survive commercial snapshots and job allocation.','A component substitution creates a new kit revision and relevant reapproval.','Dispatch waits for required components and assembly QC, not just the first source shipment.'],
 ['bundle.validate','bundle.freeze','kit.allocate','assembly.complete'],['kit.configured','kit.ready'],
 ['A cart round-trip retains kit identity and assembly charges.','One missing component blocks a complete-kit shipment.','Component quantity changes trigger full kit repricing.'])
feature('F14','Immutable quote, acceptance and approved terms',['bigcommerce','4imprint','shopify'],['S26','S11','S23'],['sales','estimating','orders','finance'],[5,6,10,13,32],'P0',
 'Compare issued revisions, review seller and assumptions, then accept an unexpired agreement with approved payment terms.',
 'Issue a frozen revision, obtain margin/credit approvals and verify customer acceptance independently from payment.',
 ['quote_revision','agreement_snapshot','seller_assignment','credit_approval','acceptance','payment_requirement'],
 ['An accepted quote is immutable; any commercial change requires a new revision.','Credit exposure aggregates relevant open obligations at acceptance.','Handoff policy: first two orders prepaid; later Net 15 requires a qualifying approval.','A browser return URL never establishes payment received.'],
 ['quote.issue','quote.accept','quote.expire','credit.evaluate'],['quote.issued','quote.accepted'],
 ['Acceptance after expiry fails even with a stale browser tab.','Two concurrent orders cannot exceed the approved credit exposure.','Changing seller, totals or specifications invalidates prior approval hashes.'])
feature('F15','Saved carts, account history and safe reorder',['vistaprint','smartpress','4imprint'],['S19','S30','S11'],['commerce','catalog','sales'],[8,9,11,13,38],'P1',
 'Resume saved projects and carts, view order progress and start a reorder with a visible change summary.',
 'Resolve unavailable parts, new pricing, altered brand rules or expired artwork permissions before issuing the reorder.',
 ['saved_cart','previous_order_reference','reorder_comparison','new_quote_revision'],
 ['A reorder is a new draft and never reuses payment, supplier authorization or stale prices.','Store and kit context are retained and revalidated.','Previous artwork approval can be reused only under an explicit exact-match policy.'],
 ['cart.save','order.propose_reorder','reorder.review_changes'],['reorder.requested'],
 ['A discontinued prior variant becomes a visible exception.','Current prices replace prior estimates only in the new draft.','Customer B cannot reorder customer A’s private order.'])
feature('F16','Nontechnical Integration Center wizard',['sanmar','pcna','sinalite','gotprint'],['S06','S03','S32','S38','S39'],['supplier','foundation','catalog','procurement'],[4,5,20,21,22,34],'P0',
 'Customer screens consume only published, approved data and never supplier configuration.',
 'Choose supported provider → confirm entitlement → save masked credentials → test each capability → map sample → preview pricing/publication → schedule sync → activate approved operations.',
 ['connection','secret_handle','provider_profile','capability_verification','mapping_profile','sync_policy','activation_approval'],
 ['No credentials in browser responses, logs, exports or public assets.','Documented, mocked, sandbox-verified and live-verified operations are distinct.','Only reviewed adapters are plug-and-play; an arbitrary unknown API needs engineering.','Product, media, stock, pricing, PO, status and invoice are separately verified.'],
 ['connection.create','credential.store','capability.test','mapping.preview','connection.activate'],['connection.capability_verified','connection.activation_changed'],
 ['An administrator can configure a supported fixture connection without editing source.','A successful product test does not enable purchase submission.','Credential rotation preserves masked display and prevents plaintext export.'])
feature('F17','CSV/XML mapping, staged review and rollback',['sanmar','sinalite'],['S06','S32'],['supplier','catalog','configuration'],[14,15,16,22],'P1',
 'Published products change only after a reviewed import commit and publication step.',
 'Upload a private file, map product/variant/options/price fields, inspect row errors and differences, commit selected changes and resolve rollback conflicts.',
 ['import_file','mapping_revision','staged_row','import_change','rollback_manifest','conflict'],
 ['Unmapped identity, currency or units block affected rows.','Stream bounded input; reject unsafe XML entities and oversized resources.','A rollback never overwrites subsequent human edits or makes rolled-back costs eligible.'],
 ['import.preview','import.validate','import.commit','import.rollback'],['import.committed','import.rolled_back'],
 ['Re-importing the same source file does not duplicate source identities.','A malformed row is attributable without exposing another tenant’s data.','Rollback after a conflicting manual edit creates a review exception.'])
feature('F18','Independent inventory, pricing and status freshness',['sanmar','printify','printful'],['S06','S12','S21'],['supplier','catalog','estimating','workflow'],[7,10,20,22],'P1',
 'See availability and estimate confidence with a meaningful freshness timestamp.',
 'Schedule catalog, inventory, price and order-status updates independently and remediate one failed operation without disabling successful ones.',
 ['inventory_snapshot','price_snapshot','sync_cursor','sync_run','freshness_policy','sync_exception'],
 ['Inventory evidence is not a reservation.','Each capability has its own cursor, observed time, expiry and retry policy.','Rate limiting preserves work and resumes; stale evidence does not silently support a firm promise.'],
 ['sync.schedule','sync.resume','sync.reconcile','freshness.evaluate'],['sync.completed','source.evidence_expired'],
 ['A pricing outage does not erase the last valid catalog.','A rate-limit response resumes after the permitted delay without duplicate records.','Expired cost evidence forces a fresh estimate or quote-only result.'])
feature('F19','Provider-neutral POD routing proposals',['printify','printful'],['S12','S13','S20','S21','S22'],['supplier','configuration','procurement','fulfillment','finance'],[10,20,24,25,36],'P1',
 'Receive the item and artwork that were approved; review any material substitution before production.',
 'Compare eligible sources and propose exact or approved alternatives with cost, print geometry, geography and delivery impacts.',
 ['provider_variant_map','print_file_binding','routing_proposal','substitution_approval','provider_order'],
 ['A source change rechecks print area, method, region, landed price and agreement.','Draft creation, supplier charge and production confirmation are distinct commands.','No autonomous order submission or unknown-outcome retry is permitted.'],
 ['routing.propose','routing.approve','provider.create_draft','provider.confirm'],['routing.change_proposed','provider.order_confirmed'],
 ['A similar garment cannot replace an approved brand without approval.','A new provider print-area mismatch blocks confirmation.','A failed billing outcome creates an exception and no false production status.'])
feature('F20','Per-line job orchestration and holds',['oracle','printnow','smartpress'],['S28','S29','S16','S31'],['orders','procurement','fulfillment','today'],[6,7,18,24,25,26],'P0',
 'View truthful item-level progress, holds and partial fulfillment rather than one misleading order status.',
 'Allocate blank supply, decoration, print, assembly and dispatch tasks with dependencies, owners and evidence.',
 ['job','job_operation','operation_dependency','purchase_requirement','hold','execution_event'],
 ['A customer order may create several jobs and supplier requirements.','Each dependent operation waits for required predecessor completion and valid approvals.','Order completion is derived from required quantities and exceptions, not manually set success.'],
 ['order.allocate_jobs','job.plan_operations','operation.start','operation.complete','hold.resolve'],['job.allocated','operation.completed','job.hold_changed'],
 ['Blank receiving can complete while decoration remains blocked.','An assembly operation cannot complete before required components arrive.','One shipped line does not mark all order lines fulfilled.'])
feature('F21','Purchase approvals and uncertain outcome reconciliation',['oracle','printful','4over'],['S27','S20','S35'],['procurement','orders','finance','foundation'],[5,6,13,25,27],'P0',
 'Customer commitments are protected from unapproved supplier substitutions or spend.',
 'Prepare by purchase requirement, inspect the exact PO payload, approve within authority, submit once and reconcile acknowledgments or uncertainty.',
 ['purchase_requirement','po_revision','po_line','spend_approval','provider_transaction','reconciliation_case'],
 ['Approval binds payload hash, amount, currency, provider and agreement revision.','One requirement cannot be purchased twice through competing job or connection paths.','A timeout after write is UNKNOWN_OUTCOME; query/reconcile before any resubmission.'],
 ['purchase.prepare','purchase.approve','purchase.submit','purchase.reconcile'],['purchase.authorized','purchase.acknowledged','purchase.outcome_uncertain'],
 ['Changing a PO line after approval requires reapproval.','Two buyers cannot procure the same requirement twice.','A simulated post-write timeout cannot trigger an automatic second supplier order.'])
feature('F22','Split shipments, blind shipping and tracking',['smartpress','gotprint','4over','vistaprint'],['S30','S31','S37','S36','S19'],['fulfillment','orders','commerce'],[24,26,36],'P1',
 'See packages, quantities, destination and tracking for each part of the order.',
 'Allocate quantities to packages, verify blind-ship settings, record supplier-provided tracking and handle delivery exceptions.',
 ['shipment','shipment_item','package','address_snapshot','tracking_event','blind_ship_instruction'],
 ['Allocated shipped quantities cannot exceed authorized remaining quantities.','A supplier shipment does not trigger a duplicate purchased label.','A delivered package event is not automatically acceptance of every order line.'],
 ['shipment.allocate','shipment.record_tracking','tracking.ingest','delivery.resolve_exception'],['shipment.dispatched','shipment.delivered'],
 ['Two packages correctly sum to a partly then fully shipped line.','Duplicate tracking webhooks do not duplicate fulfillment quantity.','A blind-shipping restriction blocks an unsupported route.'])
feature('F23','Returns, claims, remakes and customer resolution',['4imprint','ordermygear','printful'],['S11','S15','S22'],['fulfillment','crm','finance','orders'],[26,27,28],'P1',
 'Report a problem against the affected quantity, attach private evidence and see its resolution status.',
 'Classify damage, defect, artwork or preference; authorize refund/remake and link supplier recovery separately.',
 ['claim','claim_line','evidence_asset','resolution','remake_order','refund_reference','supplier_credit_reference'],
 ['A customer refund and supplier reimbursement are separate outcomes.','Remakes retain original agreement and cause but require new production authorization.','Resolution does not fabricate a financial refund without processor/accounting evidence.'],
 ['claim.open','claim.review','resolution.authorize','remake.prepare','refund.reconcile'],['claim.opened','claim.resolved'],
 ['Partial defect quantity does not refund the entire order by default.','A refund UI success without a provider event remains pending.','Remake costs appear in actual profitability with a link to the original order.'])
feature('F24','Estimated versus actual direct profit and references',['oracle','printful','shopify'],['S27','S22','S23'],['finance','estimating','analytics','today'],[10,13,27,30,36],'P1',
 'Receive accurate payment and invoice references without exposure to internal costs.',
 'Reconcile supplier invoices, freight, fees, credits, customer receipts and actual job costs against the frozen estimate.',
 ['actual_cost','supplier_invoice_reference','customer_invoice_reference','payment_reference','reconciliation','profit_snapshot'],
 ['Customer paid, processor payout and supplier payable are separate facts.','Profit excludes collected tax and distinguishes direct gross profit from overhead/net profit.','No full general ledger, payroll or automated settlement is activated.'],
 ['cost.record_actual','invoice.match','payment.reconcile','profit.close_snapshot'],['cost.actual_recorded','reconciliation.completed'],
 ['A supplier credit reduces actual cost once and retains its original reference.','A customer payout delay does not mark the order unpaid twice.','A report reconciles totals across the whole dataset beyond the first 1,000 records.'])
feature('F25','CMS, licensed assets and controlled marketing',['imprint','4over','ordermygear'],['S08','S35','S14'],['marketing','catalog','creative','crm'],[5,16,19,29],'P1',
 'See current published product content and permitted campaign imagery.',
 'Draft brand-consistent content, review rights and audience permission, approve a revision and schedule an authorized publication.',
 ['content_revision','campaign','asset_license','audience_consent','suppression','publication_approval'],
 ['Unpublished and expired-rights assets cannot enter public projections.','Approval, publication and external message sending are independent permissions.','Unsubscribe/suppression survives an audience reimport.'],
 ['content.save_revision','content.review','content.publish','audience.suppress'],['content.published','audience.suppressed'],
 ['A manager with an approval grant can approve without an unrelated module-wide denial.','A suppressed contact cannot be reactivated by a CSV overwrite.','A draft cannot be fetched through a public asset URL.'])
feature('F26','Versioned automation with a durable event contract',['printnow','printful','bigcommerce'],['S16','S21','S26'],['workflow','foundation','today'],[7,28,29,31,35],'P0',
 'Receive an accurate status update only after the underlying transaction commits and sending is authorized.',
 'Choose a supported trigger, conditions and allowed action; simulate on sample data, approve, activate, inspect attempts and replay safely.',
 ['event_envelope','outbox','automation_revision','subscription','execution','delivery_attempt','dead_letter'],
 ['Emitters and subscribers use one versioned registry and schema.','Events carry tenant, workspace, aggregate revision, correlation and causation IDs.','Retries are idempotent; live spend and external sending require their own gates.'],
 ['automation.simulate','automation.activate','execution.replay','delivery.retry'],['automation.activated','automation.execution_failed'],
 ['A request.submitted event reaches the matching approved subscription.','Replaying an event cannot create a second PO or duplicate message.','A consumer failure leaves a visible retriable exception and preserves the event.'])
feature('F27','Operational dashboard and full-dataset analytics',['oracle','printnow','shopify'],['S28','S16','S23'],['today','analytics','finance','crm'],[8,27,28,30,33],'P1',
 'Account history shows understandable current commitments and outstanding actions.',
 'Open queues for overdue proofs, stale prices, production holds and unmatched payments; drill from every KPI to scoped source records.',
 ['metric_definition','time_bucket','queue_item','sla_clock','report_run','export_manifest'],
 ['Metrics define numerator, denominator, timezone, exclusions and freshness.','KPI aggregation is not a sum of a capped browser list.','Gross profit per owner hour requires recorded hours and is not a net-profit claim.'],
 ['report.run','report.export','queue.assign','metric.reconcile'],['report.completed','sla.breached'],
 ['A known seeded population above 1,000 reconciles to SQL totals.','A buyer cannot export another company’s records.','Waiting for proof and active production time are reported separately.'])
feature('F28','Administration, delegated authority and audit',['oracle','bigcommerce','shopify'],['S27','S25','S24'],['foundation','supplier','finance','workflow'],[4,5,6,32,34,35],'P0',
 'Use granted company access with clear permission-denied and session-expiry states.',
 'Manage staff grants, legal sellers, limits, connection environments, audit review and recovery evidence.',
 ['membership','resource_grant','approval_limit','legal_seller','audit_event','recovery_run'],
 ['Deny by default; module visibility is distinct from action/resource authority.','Revocation and workspace changes are enforced server-side.','Audit records are append-only and redact credentials and sensitive payloads.'],
 ['grant.assign','grant.revoke','seller.assign','recovery.verify'],['grant.revoked','seller.assignment_changed'],
 ['An allowed reviewer can review but cannot submit supplier spend.','A tampered workspace ID returns no cross-tenant record.','An audit export contains masked credential metadata only.'])
feature('F29','Direct supplier standards and licensed ASI interfaces',['pcna','sanmar'],['S03','S06','S39'],['supplier','catalog','foundation'],[4,20,21,22,23,34],'P1',
 'See approved canonical data independent of its licensed upstream source.',
 'Configure direct supplier profiles and keep ASI SmartLink, ESP-related workflows and file imports as separately entitled interfaces.',
 ['service_profile','service_version','external_identity','license_entitlement','capability_test'],
 ['PSRESTful is prohibited.','PromoStandards service versions are supplier-specific and independently tested.','ASI SmartLink and ESP website access are not interchangeable rights; obtain official authorized schemas.','Public standards history does not verify a specific supplier endpoint.'],
 ['profile.register_reviewed','entitlement.record','capability.verify'],['entitlement.changed'],
 ['A Product Data fixture cannot set invoice or PO capability verified.','Missing ASI entitlement leaves that capability blocked with a clear reason.','A supplier endpoint outside a reviewed profile is rejected.'])
feature('F30','Complete usable screens and query behavior',['vistaprint','shopify','bigcommerce','ordermygear'],['S19','S23','S25','S14'],['commerce','stores','catalog','foundation'],[8,33,38,39],'P1',
 'Use mobile and keyboard navigation, persistent filters and understandable validation or recovery messages.',
 'Use scoped server pagination, saved filters, bulk previews, column controls and accessible dialogs across contracted screens.',
 ['saved_view','query_cursor','bulk_operation','operator_preference'],
 ['Every contracted screen covers loading, empty, error, denied and stale states.','Cross-app links use configured preview origins, never hardcoded localhost.','A failed save cannot present a success toast or discard work.'],
 ['view.save','query.list','bulk.preview'],['bulk.preview_completed'],
 ['All contracted screens are reachable for their authorized role.','Customer and OS navigation works at the deployed HTTPS origins.','Keyboard-only save and error recovery retain focus and entered data.'])
feature('F31','Print-specific specifications and file roles',['4over','smartpress','sinalite','printnow'],['S36','S30','S34','S16'],['configuration','creative','estimating','orders'],[9,17,18,24],'P1',
 'Choose supported dimensions, stock, sides and finishing with product-specific artwork instructions.',
 'Maintain validated product families, file-role requirements and operation specs for each supported route.',
 ['print_spec_revision','stock','finish','dimension_rule','file_role','manufacturing_spec'],
 ['Store dimensions with explicit units and distinguish trim, bleed and safe area.','Front, back, white ink and specialty finish masks are named file roles where applicable.','Embroidery requires reviewed digitization evidence; automatic digitization remains future.','Vendor specifications are versioned evidence, not universal print constants.'],
 ['print_spec.validate','file.bind_role','manufacturing_spec.freeze'],['manufacturing_spec.validated'],
 ['A required back file missing from a two-sided job blocks prepress.','Mixing inches and millimeters cannot silently change dimensions.','A foil mask from another revision cannot be approved with the current print file.'])
feature('F32','Durable development, storage and recovery foundations',[],[],['foundation','creative','supplier','workflow'],[2,3,4,7,34,35,37,39,40],'P0',
 'Saved demo work survives the intended development environment lifecycle and failures have actionable messages.',
 'Use isolated development data, verified database trust, durable private storage, managed secrets, backup/restore and real CI evidence.',
 ['environment_config','migration','artifact_manifest','secret_version','backup_manifest','verification_run'],
 ['No existing TwelveSpec production infrastructure is accessed or changed.','Database TLS verification stays enabled; temporary demo storage is labeled accurately.','Source publication and deployment remain separate approvals with reviewable artifacts.'],
 ['environment.validate','migration.apply_dev','backup.restore_test'],['environment.verification_completed'],
 ['Restarting the intended persistent development stack retains a saved project.','A restore test recovers scoped records and private artifacts.','The CI evidence names the actual commit and executed checks.'])
feature('F33','Reserved future capabilities',['printnow','oracle','custom-ink'],['S17','S27','S01'],['future'],[1,32,38,40],'RESERVED',
 'See Coming Soon labels for unavailable capabilities without active transaction controls.',
 'Keep research notes for AI design, validated 3D, auto digitization, CAD, SaaS, GL/payroll, enterprise MRP and autonomous procurement.',
 ['module_registry','future_capability_note'],
 ['Researching a vendor feature does not activate it.','Reserved server commands deny execution even when called outside the UI.'],
 [],[],['Every reserved module remains Coming Soon with no working transaction button.','Direct API attempts for reserved capabilities are denied.'],scope='COMING_SOON_ONLY')
feature('F34','CRM relationships, ownership and follow-through',['4imprint','custom-ink','bigcommerce'],['S11','S01','S25'],['crm','sales','today','marketing'],[5,28,29,30,38],'P1',
 'Keep one account context across inquiries, artwork reviews, quotes and service issues.',
 'Manage account/contact relationships, lead source, opportunity stages, next tasks, assigned reps and activity history.',
 ['account','contact','account_contact','opportunity','sales_activity','next_action','consent'],
 ['Identity matching is scoped and uncertain duplicates require review.','Follow-up tasks preserve their triggering quote or claim revision.','Closing an opportunity requires a reason and does not fabricate collected revenue.'],
 ['crm.propose_merge','opportunity.transition','task.schedule','activity.record'],['opportunity.stage_changed','task.due'],
 ['A contact can serve two company locations with independent permissions.','An opportunity closed lost retains its quotes and reason.','A scheduled follow-up does not send external email in demo mode.'])
feature('F35','Production execution and quality checkpoints',['oracle','smartpress','4over','sanmar'],['S28','S31','S36','S06'],['orders','fulfillment','procurement','today'],[18,24,25,26,30],'P1',
 'See truthful production progress and approved explanations for delays.',
 'Receive materials, execute authorized operations, record actual quantities/time, inspect method-specific QC and resolve shortages or remakes.',
 ['material_receipt','operation_execution','qc_check','quantity_variance','production_hold','remake_requirement'],
 ['Received, produced, rejected and shipped quantities reconcile.','QC is tied to the operation and exact manufacturing revision.','An operator cannot release a blocked or unapproved production artifact.'],
 ['receipt.record','operation.record_actual','qc.record','production.release'],['materials.received','qc.failed','production.released'],
 ['A short blank receipt creates a shortage and blocks excess production.','Failed QC creates an attributable hold and possible remake requirement.','Production release requires current artwork, commercial and purchasing gates.'])

plan=json.loads((ROOT/'docs/planning/gap-backlog.json').read_text())
trace=json.loads((ROOT/'docs/planning/requirements-to-work.json').read_text())
module_lookup={m['code']:m for m in plan['modules']}
for f in FEATURES:
    f['currentCode']=sorted(set(module_lookup[m]['currentSource'] for m in f['modules']))
    if 'creative' in f['modules']: f['currentCode'] += ['apps/os/components/studio.tsx','apps/shop/components/designer.tsx','apps/shop/app/[[...path]]/page.tsx']
    if set(f['modules']) & {'commerce','catalog'}: f['currentCode'] += ['apps/shop/components/storefront.tsx']
    if set(f['modules']) & {'stores','byob'}: f['currentCode'] += ['apps/shop/components/programs.tsx']
    f['currentCode'] += ['apps/os/components/workspace.tsx']
    if 'supplier' in f['modules']: f['currentCode'] += ['packages/providers/src/index.ts','apps/os/components/integrations.tsx']
    if 'orders' in f['modules']: f['currentCode'] += ['packages/production/src/index.ts']
    if f['id']=='F04': f['currentCode'] += ['packages/pricing/src/index.ts']
    f['currentCode']=sorted(set(f['currentCode']))
    f['existingTests']=sorted(set(module_lookup[m]['existingTest'] for m in f['modules'] if module_lookup[m].get('existingTest')))
    f['acceptance']=[a['id'] for a in trace['acceptance'] if set(a['workItems'])&set(f['gaps'])]
    f['dependencyRule']='Foundation gates apply before dependent behavior; see ordered implementation waves in SOFTWARE_BLUEPRINT.md.'
    f['evidenceBoundary']='Vendor behavior inspired this original design; proposed records, rules, commands, events and tests are not vendor internals or completed implementation.'

data=dict(schemaVersion=1,title='TwelveSpec original software feature research',researchDate='2026-11-06',
          timezone='America/Chicago',baselineCommit='51a1011',
          purpose='Adapt publicly documented product behavior into original TwelveSpec workflows, data contracts and tests.',
          method=['Official vendor pages and documentation only for vendor claims.',
                  'Public evidence, original design and authenticated integration verification are separate.',
                  'No vendor source code, private systems, customer files or proprietary catalog data copied.',
                  'All feature packs are design work; the controlling handoff and Coming Soon boundaries remain authoritative.'],
          sources=SOURCES,companies=COMPANIES,features=FEATURES)
(OUT/'research.json').write_text(json.dumps(data,indent=2,ensure_ascii=False)+'\n')
print(f'Curated {len(COMPANIES)} companies, {len(SOURCES)} sources and {len(FEATURES)} feature packs.')
