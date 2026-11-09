# TwelveSpec launch readiness — November 9, 2026

**Decision: not ready for paid production orders.** Launch preparation can continue in the new development build. No existing TwelveSpec production application, database or domain is part of this assessment, and no production deployment was performed.

This report supersedes older status summaries for the facts checked below. Historical test counts and screenshots remain historical evidence. Passing the implemented tests does not close the original 95 active/inherited acceptance scenarios or establish supplier, payment or manufacturing readiness.

## Current status by category

| Category | Current evidence | Practical limit |
| --- | --- | --- |
| Implemented and previously browser-verified | Separate storefront and Commerce OS; canonical catalog curation and reviewed images; private artwork/design versions and visual proofs; saved quote requests and customer briefs; operator costing and issued quotes. | The published development runtime remains the November 7 version. Real sales activation is blocked. |
| New implementation | Website document contracts, three additive local migrations, scoped editor/publisher capabilities, immutable revisions/releases/approvals/references, selected publication and restore/rollback services, durable-in-PostgreSQL CMS image bytes, canonical collection memberships and published-only reader/API routes. | Backend foundation only. The real owner editor, shared storefront renderer, device preview interface and complete CMS acceptance are unfinished. The approved wireframes are prototypes. |
| Simulated functionality | Demo supplier operations, purchasing, payments, shipping, outbound communications and Shopify imports; synthetic business records. | No claim of continuous supplier synchronization, real checkout, actual fulfillment or Shopify merchant installation. Future modules remain Coming Soon. PSRESTful remains prohibited. |
| Verified checks/integrations | Fresh local PostgreSQL suite: **194 passing tests in 33 files**, including 25 new website contract/database tests. All 11 local browser journeys, TypeScript and both optimized builds pass. Read-only Cloudflare inspection confirms the existing preview deployments and persistent-database flag. | Local checks are not the full V1 acceptance suite. New CMS code has not been deployed. Hosted application workflows were last browser-verified November 7; the current readiness check does not bypass Access or establish application health behind it. |
| Outstanding blockers | Hosted database remains ephemeral; persistent connection unverified; existing artwork/vault files are temporary; content UI unfinished; commercial catalog facts and real payment/tax/production/fulfillment gates remain open. | A customer order, upload or saved session must not depend on temporary preview storage. |
| Activation requirements | Verified persistent storage and recovery; accepted customer/admin flows; licensed sellable products and current costs; legal/financial signoffs; relevant credentials/entitlements; completed release acceptance and deployment authorization. | No launch date is committed before these gates have passing evidence. |

## What was checked now

- Read the current worktree, implementation checklist, acceptance evidence and deployment configuration.
- Restarted the existing isolated local PostgreSQL setup without resetting saved development content.
- Applied all nine migrations to a fresh throwaway test database through the standard test harness. The harness removes only its own test database.
- Corrected two verification issues found during the resumed run: an immutability assertion now recognizes both a trigger exception and an RLS-denied zero-row update while checking that original content is unchanged; publisher permission is checked before requesting a write lock, so an editor receives the intended authorization denial.
- The complete local unit/security/PostgreSQL suite passed: 194 tests, 33 files. This includes current cross-module business and synthetic restore regressions, plus editorial revision, privacy, media-revocation and role tests.
- Type checking, both optimized Next.js builds and **all 11 local browser journeys passed** on the current worktree. These include the catalog → customer request → private costing → issued quote workflow, saved designs/proofs, CRM, imports, credential masking, workspace switching, Coming Soon controls, accessibility and mock Shopify boundaries. Both builds retain three known dynamic-filesystem tracing warnings in the existing Creative code.
- Cloudflare API readback at 15:16 UTC (9:16 a.m. Chicago) confirmed `PREVIEW_DATABASE_ENABLED=false`. The runtime deployment is unchanged from November 7. Its public route and version previews remain disabled; both frontend version-preview URLs remain disabled.
- Both public preview addresses returned HTTP 302. This confirms a redirect response, not the application workflows behind authentication.

## Database certificate correction

The public Supabase Root 2021 CA was retrieved from Supabase's public distribution endpoint. The new client configuration includes that root for the approved development project while retaining certificate and hostname verification and the restricted-login/host/port checks. This root is public trust material, not a credential.

The earlier certificate-download prerequisite is therefore no longer the whole diagnosis. The last actual workspace connection probe returned `ECONNREFUSED`; a successful authenticated, TLS-verified runtime connection and restart/restore test are still required. The hosted persistence flag remains disabled. No TLS bypass or server-filesystem certificate read is used. See [certificate configuration](../infra/supabase/CERTIFICATE.md).

## Ordered launch gates

| Gate | Work to complete | Observable exit evidence | Owner involvement |
| --- | --- | --- | --- |
| 1. Durable and secure operations | Verify the approved database from the actual app runtime; apply reviewed migrations through the migration identity; persist customer artwork and credentials; implement recovery/rotation and healthy startup. | The same cart, design, CRM record, media hashes and sessions survive container replacement; isolated restore succeeds; private data and secrets remain inaccessible to unauthorized users. | Credentials/account access only if existing authorized access proves insufficient; approval before a new paid service or infrastructure change. |
| 2. Complete the customer/admin experience | Connect the native content editor and shared renderer, preview/publication/history UI, navigation/brand/merchandising controls and program scopes; preserve successful quote and design behavior. | Actual owner edit → save → device preview → selected publish → restore journey, plus existing storefront/admin browser regressions and the agreed CMS acceptance matrix. | Owner usability review once the real interface is available. Routine engineering continues independently. |
| 3. Curate commercially reliable products | Select and verify actual SKUs/variants, licensed images/copy, decoration geometry, minimums, current supplier cost/stock and feasible delivery. Wire supported native integrations behind the approved credential and licensing boundaries. | Product-specific evidence and real authorized integration checks; unknowns remain quote-only. Supplier candidates and sandbox results are not automatically sellable inventory. | Supplier credentials, media rights and ASI/SAGE/other licensing confirmations where required. |
| 4. Accept real commercial workflows | Finish payment/tax events, failed/refunded/reconciled payments, exact proof/output review, authorized purchasing, shipments and returns/remakes; finalize seller/customer policies. | Real authorized test-mode provider workflows, correct customer agreements and financial totals, qualified production review and operational exception handling. | Financial onboarding and legal/policy approvals; production supplier ordering remains separately authorized. |
| 5. Release acceptance and launch | Close the remaining active V1 scenarios, security/mobile/performance checks, monitoring, backup/restore and rollback evidence. Prepare the concrete release and deployment configuration. | Traceable test evidence for the proposed release; no critical unclosed gates; reviewed rollout and recovery steps. | Final deployment authorization. Existing production services stay separate unless the owner later explicitly changes that scope. |

The first useful commercial milestone is a **small, human-reviewed quote-request pilot after storage, actual product facts and customer-policy gates pass**. This is an interim milestone, not a reduction of the agreed full V1 scope. Paid checkout stays disabled until its own acceptance and approval gates pass. The existing owner-only previews remain development environments.

## Source and further evidence

- The previously published complete platform remains on [the original development branch](https://github.com/SEM-Admin/twelvespec-platform/tree/build/owned-catalog-shopify-ab8e81e).
- The new reviewed content backend and this status report are prepared on the separate development branch `build/website-content-studio-20261109`; publication must be verified before claiming the branch is available.
- [Current content-studio implementation checklist](website-content-studio/IMPLEMENTATION.md).
- [Original all-module gap plan](GAP_CLOSURE_PLAN.md) and [95-scenario coverage](planning/COVERAGE_MATRIX.md).
- [Selling readiness](SELLING_READINESS.md) and [Shopify activation boundaries](SHOPIFY_CONNECTOR.md).
