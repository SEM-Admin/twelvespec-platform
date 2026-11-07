# Current implementation and activation status

November 7, 2026, America/Chicago. Application commit `ab8e81e` is deployed to the isolated development previews. Documentation may have a later local commit. The original 20-module inventory, 205 inventory entries and 95 acceptance scenarios remain tracked; active V1 completion is still open. Paid production sales are not approved.

## Implemented functionality

- Owned catalog: immutable private supplier evidence, full-library search/pagination, draft promotion, curated copy/configuration and exact variants, approved local photo derivatives, publication review and protected draft images.
- Customer quote requests: exact product/specification snapshots, saved cart, project/contact/delivery/artwork brief and account history.
- Administrative quoting: request follow-up, repeat-safe quote preparation, full private line costs, commercial confirmations, margin/expiry checks and issued customer quotes without internal costs or notes.
- Shopify connector foundation: merchant-scoped configuration, strict domain/identity/scope/version checks, official read-only GraphQL adapter and an owner-operated private demo-import workflow in Integration Center. Real installations and sales-channel writes remain blocked.

## Simulated functionality

The hosted database starts with synthetic products, contacts and workflow records. The quote used for HTTPS testing is synthetic. Shopify capability checks/imports and existing provider operations are simulated; they do not contact real stores, suppliers, carriers, payment processors or accounting systems. Artwork placement previews do not establish production-ready output. Future modules remain Coming Soon.

## Verified behavior and integrations

- 169 automated unit/security/PostgreSQL integration checks across 31 files, all 11 local browser journeys, TypeScript, both production builds and specification/research integrity checks passed.
- Both HTTPS previews passed the complete source → curated product/photo → customer brief → private cost review → issued quote journey. The protected library received 5,643 real source candidates: 5,450 S&S public styles, 192 SinaLite sandbox products and one PCNA staging product. They remain private evidence, not approved products for sale.
- The hosted Shopify panel passed configuration, mock capability checks, two-record private import, no-publication checks and HTTP 403 denials for real activation/publishing/orders. All three read queries passed the official Admin GraphQL 2026-10 schema validator. **No authenticated Shopify store call was performed.**
- Earlier independent supplier evidence includes PCNA staging Product Data 2.0.0/Media Content 1.1.0, public SinaLite sandbox catalog/detail reads, and S&S supplier-published workbooks plus one style image. These one-shot checks do not establish continuous application synchronization, current production pricing/stock or media redistribution rights.
- Temporary browser-test Access policies/tokens were deleted. Owner-only access and disabled version preview URLs were read back; unauthenticated requests redirect to Access. Existing production infrastructure and domains were not changed.

## Outstanding failures and incomplete work

There are no current failures in the implemented test suites run for this change. Full V1 acceptance has not passed: unimplemented or externally unverified requirements remain open in the gap plan. Both builds retain the known dynamic-filesystem tracing warnings. A local container smoke attempt encountered workspace disk limits; actual hosted container startup and HTTPS workflows passed independently.

The hosted PostgreSQL and uploaded files remain temporary and reset after 30 minutes of inactivity. The configured Supabase development connection remains disabled pending its trusted CA and verification. The development credential vault is not a durable production secrets service.

GitHub publication is incomplete. Shell push returned HTTP 403. Automatic approval review rejected branch creation because an existing remote ref might be reset, then rejected an alternate blob write because it would leave unreferenced repository data after blocked publication. No remote repository change was made. Local commits and a verified full-history Git bundle are preserved under ignored `.local/owned-catalog`; repository publication requires authorization/access resolution.

## Remaining activation requirements

1. Verify persistent development database/media/secrets storage and restart/restore behavior.
2. Curate actual sellable SKUs and confirm licensed images/copy, exact options, production requirements, costs, stock and delivery promises.
3. Complete real payment/tax, production/purchasing/fulfillment and customer-policy workflows with the relevant legal/financial approvals.
4. For Shopify, register an app and authorize a development store; implement/test OAuth token refresh, durable storage, uninstall/privacy webhooks and real contract tests. Public distribution/review is required for unrelated merchant installations. Publishing, orders and fulfillment require their own implemented contracts.
5. Close the remaining active V1 acceptance and operational readiness gates; obtain production deployment authorization. Existing production services remain separate.

See [selling readiness](SELLING_READINESS.md), [Shopify connector details](SHOPIFY_CONNECTOR.md), [owned catalog](OWNED_CATALOG_AND_RFQ.md), [implementation checklist](IMPLEMENTATION_CHECKLIST.md) and [current preview configuration](DEVELOPMENT_PREVIEWS.md).
