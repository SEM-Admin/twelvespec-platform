# Shopify channel connector

Shopify is an optional sales channel alongside the TwelveSpec storefront. The current delivery is a **read-only connector foundation and an interactive synthetic development workflow**. It is not an installed Shopify app, a live store connection or a completed multi-merchant distribution product.

No connected production Shopify store has been read or changed. No app was installed, store created, subscription purchased or customer data retrieved. The preview accepts a shop domain as configuration and performs no external request when saving or testing it.

## Requirements, code and tests

| ID | Requirement | Implementation | Verification |
| --- | --- | --- | --- |
| SC-01 | Separate tenant/workspace connections for merchant stores; validate exact `*.myshopify.com` names. | Provider registry, supplier connection service, Shopify channel panel. | Domain rejection, RLS/customer isolation and browser configuration tests. |
| SC-02 | Versioned server-only Admin GraphQL reads through the official client. | `packages/providers/src/shopify.ts`, `@shopify/admin-api-client` 2.0.1, API 2026-10. | Official schema validation of identity, product-page and variant-page queries; bounded transport fixtures. |
| SC-03 | Verify store identity/scopes before catalog reads; retain pagination and exact variant IDs/options. | Read-only adapter. | Store mismatch, missing scope, cursor, option identity and response-version tests. |
| SC-04 | Stage private source evidence without inferred costs, availability, MOQ, variant generation or image rights. | Explicit owner-only demo-import action into the owned catalog. | Repeat-safe command receipts/source deduplication; no product creation/publication; browser source-library verification. |
| SC-05 | Prevent premature selling, token capture and unsupported channel actions. | Real activation, publishing, orders, unattended sync and supplier-cost policies denied by the server. | Activation/write/cost-map/disabled-channel negative tests. |

## Current behavior

Commerce OS → Integration Center includes a Shopify channel panel. Save a channel name and merchant domain, test its mock capabilities, then stage two clearly synthetic products privately. Open Products and filter by the Shopify source to review them. Every new product still requires normal catalog curation and publication review. The current demo staging action requires the owner role.

The real read-only adapter is implemented separately from the preview commands. It requires an explicit authorized-development-store assertion and a server-side access token; the UI does not accept that token and does not invoke the adapter against a real store. Its official client cannot execute arbitrary queries/mutations through this interface. Requests use one exact shop/version endpoint, no redirects or automatic retries, bounded time/response bytes and redacted errors. A returned API version mismatch fails rather than silently accepting a version fallback. Store identity and `read_products` (or the corresponding write grant) must pass first.

Product evidence includes Shopify IDs, titles, vendor, product status and an optional featured-media image reference. Draft/archived status is retained; active status does not imply stock. Separate variant reads retain exact Shopify variant IDs, SKU and selected options with independent cursor pagination. Variant media is not requested in this phase. Referenced images are not downloaded or licensed by this connector. Shopify retail prices are deliberately excluded and cannot be mapped to supplier costs.

All three operations passed the official schema validator for Admin GraphQL 2026-10. The implementation uses `featuredMedia` rather than deprecated image fields. The MediaImage permission list consists of alternatives; this connector requests only `read_products`, not order/customer/file/theme permissions. The current application passes 169 automated checks and all 11 local browser journeys. A successful fixture/schema test is not a real-store verification.

The protected Cloudflare preview also passed a real HTTPS browser journey on November 7, 2026: save a merchant-specific channel, test mock capabilities, stage two private synthetic products, confirm neither is published, view them in the source library, and verify that real activation/publishing/order commands return HTTP 403. Temporary test Access policies/tokens were removed afterward and owner-only Access verified. No Shopify account API request was made.

## Remaining implementation and activation

- Register an app and identify an authorized development store. No production store is inferred from an existing plugin connection.
- Implement and test merchant installation, signed/state-bound callbacks and expiring offline OAuth token refresh using Shopify's official authentication libraries. A configured domain is not proof of store ownership.
- Replace temporary development credential storage with a durable tenant-scoped vault. Test token rotation, concurrent refresh, revocation and uninstall cleanup.
- Implement reachable HMAC-verified uninstall and mandatory privacy webhooks, durable deduplication, deletion/retention handling and operational retries. The current Access-protected preview URLs are not a working public webhook endpoint.
- Test the real adapter in that development store, including permissions, large catalogs, throttling, pagination and version upgrades. Fixture and schema tests do not establish a Shopify connection.
- For future unrelated merchants, select an approved public distribution model and complete Shopify review; custom distribution must follow Shopify's merchant/organization restrictions.
- Product export/publishing, order intake, payment/status mapping and fulfillment updates require separate contracts and acceptance tests before activation. Order intake needs explicit customer-data authorization, channel order IDs, duplicate protection and a decision about which system owns prices, tax, inventory and fulfillment. Payment processors must not be charged again for orders already paid through Shopify.

## Primary documentation

- [Products and cursor pagination, API 2026-10](https://shopify.dev/docs/api/admin-graphql/2026-10/queries/products).
- [Exact product variants](https://shopify.dev/docs/api/admin-graphql/2026-10/queries/productVariants).
- [MediaImage and alternative access scopes](https://shopify.dev/docs/api/admin-graphql/2026-10/objects/MediaImage).
- [Current installation and granted scopes](https://shopify.dev/docs/api/admin-graphql/2026-10/queries/currentAppInstallation).
- [Official JavaScript Admin API client](https://github.com/Shopify/shopify-app-js/tree/main/packages/api-clients/admin-api-client).
- [Standalone app authentication](https://shopify.dev/docs/apps/build/authentication-authorization/authenticate-standalone-apps).
- [Access tokens and expiring offline tokens](https://shopify.dev/docs/apps/build/authentication-authorization/access-tokens).
- [App distribution](https://shopify.dev/docs/apps/launch/distribution).
- [Privacy-law compliance](https://shopify.dev/docs/apps/build/privacy-law-compliance).

Readiness for paid sales is tracked independently in [selling readiness](SELLING_READINESS.md).
