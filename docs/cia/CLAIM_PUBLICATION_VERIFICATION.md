# Service claim publication: verification and operating boundaries

November 13, 2026. This continuation starts at merged main `14f30e2` (PR #5), preserves the three CIA contracts at architecture PR #3 head `5a07a1c`, and follows the [requirements-to-code-to-test plan](CLAIM_PUBLICATION_PLAN.md). It adds no deployment, supplier query, payment, purchase order, message or production-system access. The architecture proposal remains unmerged.

## Implemented behavior

Website Studio has an optional **Evidence-backed capabilities** section in the existing page editor. Assertions use the five CIA truth statuses, a controlled service/workflow capability, delivery model, territorial website scope, authoring origin, evidence confidence, effective/verification/expiry dates, source citations and a private review reference. Incomplete assertions can be saved as drafts. Exact-revision publisher approval, immediate publication, scheduled activation and rollback all reuse the existing Marketing services and recheck current evidence.

Evidence sources need an explicit, separately granted `PUBLIC_CLAIM` use. Internal research or quote-cost permission does not imply it. Source content and permissions remain immutable; altered permissions need a new source key/edition. Synthetic sources, expired/not-yet-effective sources, expired retention and append-only revocations cannot support published assertions. All cited sources must remain eligible. Registering a source does not certify its legal rights, factual accuracy or relevance; the steward and human publisher must review the original evidence and precise statement.

Future capabilities cannot publish as available. Plans render **Coming Soon / Not currently available**. Managed print/promo/apparel assertions retain the specialist-partner delivery label; illustrative 2D proof assertions retain the production-proof/technical-review limitation. No assertion activates checkout, equipment ownership, digitization, CAD, validated simulation, autonomous ordering or machine-file release.

Public API and rendered-page projections allow only the statement, context, limitations, service/country/channel scope and truthful availability/delivery labels. Private source IDs, source metadata, publisher/supplier identities, rights references, fingerprints, review references and author identities are excluded. The public reader cannot query evidence tables or the private source picker. The published-revision eligibility function checks the active release and private-store membership before returning a boolean; it is not an arbitrary-source lookup. The published-reader role remains an internal server role: raw revision JSON must never be exposed as a public API.

Source permission is checked again on each uncached request. A revoked/expired assertion is withheld without rewriting its immutable approved release. Unrelated approved narrative remains. Requests see one database snapshot; already loaded browser pages are not erased retroactively. To publish a corrected release, remove/hide invalid assertions or replace their evidence in a new draft, then obtain approval again. Normal release validation also rechecks unchanged pages in the manifest.

## Administrator workflow

1. In Integration Center, record a source with its original document fingerprint, rights/retention dates and explicit public-claim permission. The file remains in the browser; retain the original securely. Credentials belong in the separate credential interface. Existing sources cannot be upgraded in place.
2. In Website Studio, choose the authorized site/page and add **Evidence-backed capabilities**. Add an assertion, state its public limitations and scope, identify its authoring origin and supporting evidence, enter UTC dates and record the private proof/review locator. The source picker is searchable and paged; unavailable evidence is identified.
3. Save the draft. An internal user with that site's PUBLISH capability reviews the exact revision and approves/publishes selected changes. Marketing EDIT permission does not grant PUBLISH or Supplier stewardship. Store admins retain ordinary page editing and authorized public viewing; they cannot read internal claim revisions/history/citations or use the source picker. A page containing private claim evidence requires an internal marketing editor, as the Studio explains.
4. Review the customer page. Revoke a source in Integration Center when its permission is withdrawn; supported assertions disappear on the next eligible load. A new source edition and a new approved page revision are required to replace withdrawn evidence.

No service assertion is seeded or automatically published. Test fixtures marked `OPERATOR_DOCUMENT` exercise that policy branch using clearly labeled synthetic documents; they establish no actual TwelveSpec service or license.

## Compatibility and recovery

Migration 015 extends the existing source-use check and citation foreign keys. It neither rewrites old sources/prices/quotes nor adds a competing source/claim registry. Old content references gain a nullable evidence-source field. Page duplication generates new assertion IDs while preserving source attribution; restoring a historical revision of the same page retains its history.

The database requires an updated reader protocol for claim-bearing page revisions. An older application fails closed for those pages instead of serializing unknown private fields. Restore a compatible, currently valid release before rolling application code back. Keep additive migrations and immutable history. The scoped SQL functions have fixed search paths, restricted execution grants and use the same trusted migration-owner model as the existing membership guard; hosted migration/role validation remains part of authorized rollout.

Full regression discovered that the local restore drill omitted seven CIA ledgers and five supplier API metering/cache/credential tables from its generic operational-row inventory. The correction discovers all 114 application tables without exposing those ledgers through generic APIs. It restores scoped dependencies, preserves typed bytea separately from Buffer-shaped JSONB, keeps PostgreSQL timestamp precision in client-local parsers, and compares database-native canonical content hashes as well as counts/scopes. Its own fixture includes a cited draft, private precise price, binary field and mock supplier charge/cache/ciphertext state, with no outbound supplier request. This proves local database recovery for the tested dataset, not managed backups, original files, usable vault-key recovery or a hosted production restore.

## Measured verification

| Check | Evidence |
| --- | --- |
| Complete backend suite | **346 / 346 tests, 45 files PASS**, fresh isolated local PostgreSQL through migration 015. Includes 23 new service-claim cases plus expanded migration/recovery regressions. |
| TypeScript | PASS after the final database-content verification change. |
| Optimized app builds | PASS for both applications. Six existing Creative dynamic-file tracing warnings remain; no production output/engine acceptance is implied. |
| Actual claim browser journey | PASS: source permission form → private program membership → no-code assertion → exact publication → qualified customer presentation → source revocation. Mobile width and automated WCAG A/AA checks pass. |
| Full browser suite | **24 / 24 PASS**, final frozen checkout, fresh isolated local database and actual Chromium workflows across both applications (5.9 minutes). Includes the claim journey's SSR/API privacy checks and mobile accessibility. |
| Migration compatibility | PASS: 001–012 → 013/014/015 preserves original source/price fields and fingerprints, quote, CMS revisions and citation history; original material retry deduplicates. |
| Security/invalidation | PASS: source use/origin/expiry/revocation, all-source eligibility, private stores/membership removal, unauthorized roles/workspaces, store-admin private evidence/history denial with ordinary edits preserved, safe exact draft preview, immutable citations, scheduled/rollback rechecks, public projection and older-reader denial. |
| Original inventories/integrity | 85 original files / 20 modules / 205 entries / 95 A/T/E scenarios / 40 work packages retained; 1,823 research and 427 industry checks pass. These are inventory/provenance checks, not full V1 acceptance. |
| Hosted or real integrations | **None newly verified or activated.** Database/browser fixtures are local. No paid supplier call or real commercial transaction. |
| GitHub final-head CI | The implementation PR for `build/cia-claim-publication-20261113` records the final-head CI and integration receipt. Integration is authorized only after the complete suite passes; deployment is a separate gate. |

Earlier local runs encountered a development reload/connection reset and an incorrect combobox selector. The selector was corrected and the final browser suite ran with the checkout frozen: all 24 journeys pass. Authentication and rate-limit policy were retained. Final-head GitHub CI must also pass before integration; a focused pass is not sufficient.

The persistent embedded development database was aligned with the final additive role policies/function without rewriting data; all 114 application-table row counts were preserved. This localhost check is not a hosted Supabase migration or deployment.

## Still open

- Editorial verification of existing narrative, SEO and arbitrary rich text; product/variant stock, firm pricing, delivery and manufacturing assertions; non-website channels; complete CIA-TRUST and original 80 CMS cases. The typed section is **not a semantic fact checker** for arbitrary wording.
- Real original documents, service capacity and territorial scope, licensed product copy/media, actual commercial costs/availability and producer acceptance. Source permissions and human review references are assertions, not legal or manufacturing certification.
- The four proof/prototype pilots and validated specialized engines; technical production release and physical verification; all remaining active V1 acceptance packages. Future modules retain Coming Soon status.
- Authorized hosted migration/deployment, durable development state/files, production authentication/recovery/security, complete restore operations, supplier credentials/licensing/budgets, legal/financial/tax/payment and production release gates.

Paid production selling remains **NO-GO** under [selling readiness](../SELLING_READINESS.md). Neither a green test suite nor a valid website claim lifts that gate.
