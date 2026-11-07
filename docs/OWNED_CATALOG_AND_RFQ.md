# Owned catalog and reviewed quoting

This work extends the existing catalog, configuration, commerce and sales domains under the master V1 handoff. It addresses parts of GAP-011–017 and the catalog/RFQ portions of GAP-022; it does not close those whole work packages or the full cross-module acceptance suite. Future modules remain Coming Soon.

Supplier data is evidence for a TwelveSpec product. Incomplete source records remain private. Customer quote requests preserve the exact published product/options and project brief; commercial pricing is issued by an authorized operator after costs and assumptions are reviewed. Unknown costs, media rights, configurations and delivery requirements are never invented.

## Requirements-to-code-to-test matrix

| ID | Requirement | Code | Verification |
| --- | --- | --- | --- |
| OC-01 | Stage known source data without assuming SKU variants, MOQ, prices or image rights; deduplicate immutable source snapshots. | `packages/catalog/src/sources.ts`, `scripts/prepare-owned-catalog.py`, `scripts/stage-owned-catalog.ts` | Source staging/identity/isolation integration tests; private data preparation counts. |
| OC-02 | Search the whole private source library with server pagination; promote a selected source into an editable TwelveSpec draft. | Catalog source service, OS catalog workspace, scoped source/product indexes. | Paginated search, repeat promotion and customer denial tests; OS browser journey. |
| OC-03 | Keep draft edits separate from published snapshots; edit exact variants and configuration; retain publication/license checks. | Catalog service and OS product editor. | Published snapshot and stale revision tests; draft/publish browser journey with a deliberately delayed save refresh to verify that overlapping edits stay disabled. |
| OC-04 | Capture a customer project brief and validated per-line details without accepting submitted prices or internal source fields. | `packages/commerce/src/brief.ts`, commerce/sales services, storefront quote form. | Invalid dates/quantities/forged fields, persistent brief browser journey. |
| OC-05 | Preserve immutable customer-facing product and variant snapshots in scoped request-line records. | Migration `005_owned_catalog_requests.sql`, commerce service. | Snapshot stability, typed foreign keys, RLS and replay tests. |
| OC-06 | Give operators a usable request inbox, project details and a repeat-safe quote preparation action. | Sales service and OS quote workspace. | Request lifecycle and duplicate preparation tests; customer-to-operator browser journey. |
| OC-07 | Price an exact quote from a complete operator-reviewed cost worksheet with explicit expiry, freight, delivery and tax assumptions; protect internal costs. | Manual costing service, OS quote workspace, public quote projection/account UI. | Missing/stale/changed configuration/permission/rounding tests; issue and customer review browser journey. |

## Delivery checklist

- [x] Source library, source snapshots and draft promotion.
- [x] Scoped request lines and customer project brief.
- [x] Catalog editor, approved image upload and quote workbench.
- [x] Prepare and stage 5,643 known supplier source candidates into the isolated local database: 5,450 S&S styles, 192 SinaLite sandbox products and one PCNA staging product. No inferred prices, MOQ, variant matrices or publication rights.
- [x] 158 automated tests across 29 files; all ten local browser journeys; TypeScript and both production builds. The ten journeys include the complete owned-catalog/customer-brief/operator-cost/issued-quote flow.
- [x] Verify the complete catalog/source-photo/publication/customer-brief/operator-cost/issued-quote workflow on both protected HTTPS previews. The hosted run also verified all 5,643 source candidates, draft-image privacy, public derivative delivery, hidden unissued prices and private operator notes. Temporary Access test policies/tokens were deleted and owner-only policies read back.

Source files and sampled supplier assets remain in ignored private storage. This change does not authorize publication of restricted supplier media, live supplier transactions, payment processing or production deployment. A working local quote workflow does not establish supplier API verification or current supplier stock/prices.

## Operator workflow

1. Open Commerce OS → Products. Search the private source library or upload an authorized CSV/JSON source file. Source-only imports do not require invented pricing or variants. Open the source evidence to review its date, category and media references.
2. Create a TwelveSpec draft, edit your customer copy, confirm the minimum quantity and configuration, and enter exact reviewed variants. Confirm publication rights and upload a PNG/JPEG/WebP image; the server creates a metadata-stripped WebP derivative. New photos stay private until their exact product snapshot is published.
3. Check website publication, address its reported issues and publish with a review note. Draft changes preserve the existing website snapshot until another publication. Pausing a product also removes public access to its catalog derivatives.
4. Customers select published options, add item requirements and submit a project brief with destination, artwork status and requested delivery date. The request retains immutable product/variant snapshots, quantity and specifications.
5. Open Quotes & requests, review the brief, record internal follow-up and prepare the quote. Enter full line costs, dated evidence, validity and explicit product/availability/delivery confirmations. Costs are line totals; remaining zeros require an explicit operator action.
6. Calculate, approve any required margin exception and issue the quote. Customers see the exact specification, reviewed scope, total, validity and explicit tax exclusion. Internal costs and operator notes remain private; unissued prices are hidden. Issue does not send email, charge money or submit supplier orders.

Prepare already-retrieved private evidence with `python3 scripts/prepare-owned-catalog.py`; stage it into the loopback-only local database with `node --import tsx scripts/stage-owned-catalog.ts`. The prepared JSON bundle can also be uploaded through the source-library interface. Repeated source data does not create duplicate snapshots/products.

## Verification limits and remaining activation

The source-library query paginates its entire dataset. The general module grids and public catalog still have their existing record ceilings; full catalog scale/search acceptance in GAP-015 remains open. Source-backed products can be opened by ID from the library independently of the recent-products list.

Both app builds retain three known dynamic-filesystem tracing warnings. Thirty output trace manifests were inspected with no private `.local`, original specification, environment or attachment files referenced. The deployment image excludes `.local`, environment secrets and local test reports. Its production build succeeded after clearing disposable build artifacts and removing npm's download cache before compilation. Local container execution encountered the workspace disk limit; actual Cloudflare container startup and the full HTTPS workflow subsequently passed independently. A hosted save/variant revision conflict was fixed by keeping all editing controls disabled through the complete save/refresh transaction, with a deliberately delayed browser regression.

The current deployment database/files remain temporary until the approved persistent development database and durable asset storage are verified. Supplier/current price and stock checks, licensed image use, real legal seller/tax settings, external credentials and production deployment remain separate activation requirements. The original 95-scenario V1 acceptance remains open.
