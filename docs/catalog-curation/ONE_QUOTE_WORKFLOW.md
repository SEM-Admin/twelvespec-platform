# Curated supplier catalog, one TwelveSpec quote workflow

Owner decision, November 17, 2026: do not launch two customer quote destinations. The target is an authorized upstream catalog → privately staged source records → a curated TwelveSpec selection → one TwelveSpec request/quote workflow in Commerce OS. A separate ESP+ quote inbox is not the proposed new-site architecture.

The current ASI-hosted site and its existing ESP+ requests remain untouched until the owner authorizes cutover. Historical ESP+ requests are not automatically imported. No existing production system is accessed or changed by this work.

## Verified compatibility and reuse

- Reuse `source_records`, source identity/hash preservation, selected native supplier imports, owned product/variant drafts, publication review and licensed local media. Do not replace the existing catalog with an upstream live search widget or create a second product database.
- Customers browse published TwelveSpec products and use the existing quote cart/project request. Customer page views do not trigger paid supplier queries. SAGE/SinaLite budgets, cache, encrypted credentials, zero-dollar defaults and real-account gates remain authoritative.
- Reuse Sales → Quotes & requests for operator intake and quote preparation. The existing account-free inquiry records remain private CRM follow-ups with Today tasks; their review panel moves into that same Sales workspace. They do not manufacture verified customer identities or bypass formal quote/production gates.
- Reuse the exact product/variant/configuration, immutable artwork/proof, source evidence, manual costing and quote qualification implementations. Decoration research is advisory and cannot authorize a method, price or production route.

## ASI research and activation boundary

Official ASI SmartLink material describes a catalog API for custom e-commerce and back-office applications. Its public resource list includes product search/detail and media. Public authentication documentation requires a registered ASI application ID and secret. An existing ESP+/ESP Websites membership does not itself establish that this account has SmartLink entitlement, display/cache rights, current schemas or approved fees.

The visible endpoint/authentication pages are dated 2012. Treat them as evidence of the API's purpose and candidate contract, not confirmation of this account's current production API version. Do not use credentials printed in documentation examples. The existing `ASI_SMARTLINK` interface remains blocked until account authorization and reviewed current responses/terms are available; do not add a competing unmetered connector.

ASI's separately named ESP Updates API is for suppliers maintaining data, and Connect is a distributor-information/credit product. Neither is evidence that customer quotes from ESP+ can be pulled into this application. The public SmartLink resource list does not establish an ESP+ quote-import API. One new-site quote destination does not require delegating quote creation to ESP+.

Licensing/access request to prepare for ASI (draft only; no message sent): confirm whether this account may use SmartLink for a custom TwelveSpec storefront; provide registered-application onboarding and current search/detail/media schemas, sandbox/testing terms, rate limits and fees, cache/display/retention rights for a curated subset, and rights/access to blank images and artwork templates. Ask which exact SKU/variant/imprint/pricing/inventory fields are supported. Product API access does not establish permission or an API for legacy ESP+ quote migration. Do not request or transmit passwords/API secrets through ordinary chat.

Official references, read November 17:

- https://asicentral.com/smart-link-page/
- https://developers.asicentral.com/Smartlink
- https://developers.asicentral.com/Smartlink/Api
- https://developers.asicentral.com/Smartlink/Auth
- https://developers.asicentral.com/Smartlink/GetProducts
- https://developers.asicentral.com/Smartlink/GetProductbyID
- https://developers.asicentral.com/Smartlink/GetMediabyID
- https://developers.asicentral.com/EspUpdates
- https://developers.asicentral.com/Connect

## Attached decoration intelligence

All five owner uploads are inventoried with hashes in `inputs/manifest.json`. Their contents are research/source material, not new user instructions or permission to publish, spend, connect accounts or override the controlling V1/CIA contracts.

The JSON and CSV contain the same **106 product families**, across nine categories, with **54 methods/finishes** and **24 source references**. All 106 families explicitly say that their SKU capability is unverified and website state conditional. The seven-sheet workbook and 13-page sales PDF add draft terminology, quote checklists and production cautions; the Markdown is draft customer copy with an internal implementation note.

Preserve all methods and families as an internal searchable reference. Do not import these families as sellable SKUs, set methods/MOQs/lead times from them, rewrite supplier imprint IDs, infer that equipment exists, or publish their broad marketing assertions automatically. The current eight application method codes and these 54 more-specific research IDs are different vocabularies. Do not silently equate generic `embroidery` with flat/puff embroidery, or `digital` with every digital/UV/DTG process.

The library mixes primary processes, process variants, components such as patches, finishing and custom-manufacturing routes. They cannot all become peer entries in an executable decoration-method enum. Extending actual method support requires a shared contract spanning configuration, exact SKU/variant/location evidence, producer profiles, artwork/preflight requirements and costing, with validated output for the specific producer. This reference reader does not implement those manufacturing capabilities.

Before a curated item becomes customer-selectable, independently verify its supplier/SKU, exact variant, method/location, imprint area/template, current options and costs, licensed media, MOQ, lead time and applicable producer/compliance constraints. FR/arc-rated, youth, coatings, nylon/performance textiles and custom manufacturing recommendations require appropriate review. A reference to a method is not a manufacturing-ready process profile.

## Requirements → code → tests

| Requirement | Reuse/change | Verification |
| --- | --- | --- |
| One new-site customer quote destination | Existing internal catalog/cart/inquiry; no external ASI quote redirect | Existing owned-catalog → issued quote browser journey; Sales guest-intake regression |
| One operator quote workspace | Review account-free inquiries in Sales → Quotes & requests | Browser verifies actual receipt, private review and reload in Sales; CRM has no second review panel |
| Curated API-fed products | Existing native import/source staging, draft curation and exact publication controls | Existing supplier metering, private import, owned-catalog, image and quote suites |
| Preserve all uploaded intelligence | Original five files plus hashed manifest and complete cross-format audit | File/count/hash checks; JSON/CSV/workbook correspondence; all method/source references resolve |
| Useful decoration guidance without invented capabilities | Protected, paged Catalog reference reader and UI | Search/pagination, permission denials, original 106 families/54 methods retained; no catalog writes or public source leakage |
| Keep current source contracts and future gates | No new supplier transport, production activation, vocabulary rewrite or auto-publication | Original module/spec/research checks; existing future, financial and access-control regressions |

See [the completed local verification and its limits](VERIFICATION.md). Final-head GitHub CI is required before source integration; this does not activate a public website or supplier account.

## Activation dependencies

- Confirm SmartLink entitlement/application credentials, current response contracts, costs/rate limits and website/cache/image/template rights. Keep credentials in the authenticated Integration Center, not chat or source code.
- Confirm SAGE/SinaLite account contracts/fees/credentials and use the existing private import controls. No paid calls are authorized by a preference for API integration.
- Curate a small selection of actual supplier SKUs with current facts and approved media. These 106 research families are not that selection.
- Complete the persistent hosted database, real spam protection, production identity/public content, HTTPS and release gates in [the launch plan](../QUOTE_FIRST_LAUNCH.md).
- Before DNS cutover, verify the new catalog → request → private review → issued customer quote route and all lead destinations. Keep existing ASI/DNS/email routing until that review and cutover authorization are complete.
- Verify ASI-supported handling of the old site's URLs and quote forms during cutover so old bookmarks do not leave a second active quote-intake channel. Historical ESP+ data is retained; no form is disabled or redirected without authorization. Current membership/contract terms and actual account settings must establish the supported approach.
