# Supplier product, image and template access

Checked November 7, 2026 (UTC). Public supplier documentation was reviewed; no authenticated account, product API call, bulk image download or supplier order was used. The existing application and hosted previews remain synthetic.

## Available routes

| Source | Documented access | Data and images | Template / geometry boundary | Current TwelveSpec status |
| --- | --- | --- | --- | --- |
| SanMar | Direct web services, PromoStandards and flat files; Data Library downloads. | SKU/style/color/size, product specifications, swatches, image links and database/image downloads are advertised. | Blank apparel images do not establish a decorator's eligible method, size or placement. Obtain the chosen decorator's exact specification separately. | Public documentation reviewed; account authorization and native adapters still required. |
| S&S Activewear | Direct REST API and separately versioned PromoStandards services. | Product documentation names color-specific front, back, side, swatch and on-model image fields, variant identity and warehouse data. Media Content 1.1.0 is listed separately. | Empty image fields are legitimate missing data. Classify blank versus on-model views; do not infer physical print geometry from the photo. | Public documentation reviewed; account number/API key, approved image use and tested schema mapping still required. |
| PCNA | Confirm current supplier-issued service endpoints and permitted feed through its approved account/integration process. | Exact account-specific catalog/media coverage is unverified in this check. | Exact product/decoration templates and reproduction rights require supplier confirmation. | Pending official current service documentation and account entitlement; no endpoint or template coverage is assumed. |
| Printful | Catalog and Mockup Generator APIs. | Catalog variants and images, print-file metadata and layout templates are documented. | Layout templates support client-side positioning. Select the correct variant, placement and technique; retain returned template/profile versions. A native Illustrator/Canva document is a separate capability. | Public API documentation reviewed; scoped token and a provider-specific adapter/acceptance fixtures are required. |
| Printify | Catalog blueprint/provider/variant APIs. | Blueprint images, provider variants and printable-area placeholders are documented. | Blueprint pictures can be generic; provider/variant/position/decoration method must remain linked. Pixel placeholder dimensions do not establish a universal physical size or DPI. | Public API documentation reviewed; scoped account access and provider-specific adapter/acceptance fixtures are required. |
| ASI SmartLink | Authorized developer API entitlement. | ASI advertises supplier/product data access for custom software; licensed field and image coverage must be established from the agreement/schema. | A catalog image does not establish production geometry. ESP+ website access does not by itself establish API or redistribution rights. | Interface is reserved for authorized schemas; account API access has not been verified. |
| 4over | Trade API program and an official template library. | Current API-update information discusses catalog synchronization; the exact image API contract still needs authorized documentation. | The public library lists product/size/shape-specific EPS and JPG template downloads. Bind an exact template to the intended product and finishing choice; TwelveSpec still needs a validated ingest/review path. | Public catalog-update and template pages reviewed; API access, image terms and production compatibility remain unverified. |
| SinaLite | Supplier advertises basic catalog/specification/pricing integration and full order integration. | Publicly indexed official Canadian page describes both modes. | The check does not establish blank-image or template API coverage. Confirm the applicable region and account contract. | Both signup pages returned 403 on direct fetch; the Canadian public search excerpt was reviewed. No authenticated contract was tested. |

Documentation is evidence of an offered service, not proof that TwelveSpec is connected or that an account can use every capability.

## Primary references

- [SanMar integration offerings](https://www.sanmar.com/resources/electronicintegration/integrationofferings) and [Data Library](https://www.sanmar.com/resources/electronicintegration/sanmardatalibrary).
- [S&S product API fields](https://api.ssactivewear.com/V2/Products.aspx) and [PromoStandards service directory](https://promostandards.ssactivewear.com/).
- [Printful API documentation](https://developers.printful.com/docs/): layout templates at `GET /mockup-generator/templates/{id}` and print-file information at `GET /mockup-generator/printfiles/{id}`. These paths were read in documentation; no account request was sent.
- [Printify catalog documentation](https://developers.printify.com/): blueprint images and provider variant placeholders include position, decoration method and pixel dimensions.
- [ASI developer portal](https://developers.asicentral.com/). Detailed schemas require authorized access.
- [4over template library](https://4over.com/templates/files/list/) and [API catalog updates](https://4over.com/api-updates-testpage). These pages do not establish an account-specific image API contract.
- [SinaLite integration signup](https://sinalite.com/en_ca/api-signup): official indexed excerpt reviewed; direct fetch of it and the [US signup](https://sinalite.com/en_us/api-signup) returned 403.
- [PromoStandards directory API documentation](https://promostandards.org/standards-services-api/). The listed company-directory endpoint could not be accessed through the research tool in this check; no current PCNA endpoint was inferred from historical participation.

## Scraping and approved downloads

Use a supplier API or an approved CSV/XML/feed/download library first. A source-specific crawler can collect product information and linked files from pages where automated collection and the intended reuse are permitted. Check the source's terms, robots rules, account agreement, request limits and asset rights before enabling its job. Use bounded concurrency, conditional downloads, backoff and observable retries.

Do not bypass access controls, CAPTCHA or a denied endpoint. A failed fetch remains unavailable; it does not authorize guessing private paths or changing identities. Do not scrape ESP+ as a substitute for SmartLink entitlement. PSRESTful remains prohibited.

Each asset needs its supplier/source URL, source product and variant, color, view, content hash, original file, retrieval time, rights/reuse scope and freshness. Treat blank photos, decorated examples, on-model photos, layout masks and physical production geometry as different asset roles. Never remove a sample logo and label the result a verified supplier blank, or recolor an image and label it a verified color photograph.

Supplier templates need exact dimensions/units, orientation, source revision, applicable material/method, print/trim/bleed/safe-area roles and attribution to the applicable route. Parse and review supplied files before enabling their use. A screenshot, generic canvas or filename match cannot authorize production release.

## Current implementation and first connection

The Integration Center already models supplier accounts, individual capabilities, mappings, price policies, staged CSV/XML imports, synchronization records and masked secret references. The current service checks and scheduled sync are simulated; non-mock supplier connections are explicitly blocked. The Product Data fixture does not implement Media Content, all supplier versions, REST providers or ASI's private schemas. See [the supplier service](../../packages/supplier/src/index.ts) and [provider adapters/vault](../../packages/providers/src/index.ts).

The present encrypted file vault is for development. The hosted preview permits synthetic credentials only. Implement and verify managed, server-only secret storage before accepting real supplier secrets; keep keys out of chat, source, logs and browser payloads.

Start with one already-approved SanMar or S&S account and 20–40 products. Implement the read-only product/media adapters and independent capability tests; verify exact colors/views, missing media, source changes and redistribution scope. Use an isolated development database and reviewed private asset storage. Stage the results for review without automatically publishing or changing customer commitments. Keep order submission, payment and production release disabled during this pilot.

Acceptance needs account authentication evidence, pagination/delta completeness, stable part/variant mapping, exact image associations, bounded downloads, approved cache/storage behavior, freshness and failure recovery. Add actual provider profile/template validation where available. Then expand to the selected promotional-product and print suppliers. Any paid entitlement, new infrastructure, license or deployment retains its explicit approval gate.
