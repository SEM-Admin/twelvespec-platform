# Website & Content Studio implementation

The owner reviewed the audit, architecture and wireframes and approved the proposed direction with “looks good” on November 8, 2026 UTC. The original review packet remains a record of the pre-implementation findings. This checklist tracks the subsequent implementation; proposals and prior tests are not passes.

| Phase | Implemented | Simulated | Integration verified | Failures / remaining gate |
| --- | --- | --- | --- | --- |
| 0. Review | Audit, model, component contracts, wireframes and acceptance plan approved | Wireframes use in-memory sample content | Local read-only audit and prototype verification | Referenced design image unavailable; written direction approved |
| 1. Foundation | Scoped schema/capabilities, immutable history and CMS media bytes implemented locally | Synthetic business records | New local contract/database/security tests pass | Hosted connectivity, private artwork/vault durability and specific CMS recovery still pending |
| 2. Editor workflow | Owner page/section forms, draft saves, exact private previews, selected publication, history and restore; shared published storefront renderer | Synthetic starting content | Service/database checks pass; integrated browser verification tracked below | Full 80-case CMS acceptance and durable hosted operation remain open |
| 3. Components/media/navigation/brand | Registered component forms, safe rich text, approved palettes, editable nested navigation/footer, rights-confirmed raster upload, consent records and usage/revocation UI | Existing synthetic images retained | Contract/media security checks pass; browser verification in integration report | Full component/keyboard/mobile matrix, focal/metadata authoring breadth and unsupported video/download activation remain open |
| 4. Merchandising/solutions | Canonical collection forms, ordered membership, variant choice, hiding/featuring, optimistic saves, server-paged catalog/collection routes and published SEO metadata | Demo catalog and starting solution records | Collection ordering/conflict checks pass; browser verification in integration report | Large-catalog scale, complete taxonomy/outcome navigation and production canonical/sitemap acceptance remain open |
| 5. Organization sites/scheduling | Scoped site initialization/editor, published store URL selection and authentication refresh; scheduling services remain gated | Seeded company programs | Membership/read-isolation service checks pass; dedicated browser journey is in the integration suite | Complete delegated-store matrix and dependable scheduled execution remain open |
| 6. Campaign reuse/resources | Pending | Existing local-preview campaigns | Pending | Unsupported exports/video remain unavailable |
| 7. Acceptance | Pending | Provider integrations remain simulated | Pending | Existing regressions plus agreed CMS tests |

## November 9 implementation verification

- [x] Implement the structured document contracts, scoped capabilities and three additive website migrations.
- [x] Implement isolated drafts, immutable revisions, approval binding, selected releases and page/site restore/rollback services.
- [x] Implement private-original/approved-derivative CMS media storage in PostgreSQL and current-rights checks.
- [x] Implement canonical collection relationships and server query/API foundations.
- [x] Pass the fresh local suite: **194 tests across 33 files**, including 25 new website tests. The original 95-scenario acceptance and 80-case CMS plan are not declared complete.
- [x] Pass TypeScript, both optimized application builds, all 11 local browser journeys, original-spec integrity and all-module plan integrity. Existing Creative filesystem tracing warnings remain.
- [x] Prepare verified-root TLS configuration for the approved Supabase development project; no insecure TLS bypass.
- [ ] Verify hosted persistent database connectivity, private customer artwork/vault durability and restart/recovery.
- [x] Build actual owner forms and connect the shared renderer in the source integration branch. The separate wireframes remain historical prototypes. Hosted previews are a different source revision until separately updated.
- [ ] Connect and verify the scheduled-publication executor and its operational availability.
- [ ] Complete browser, media, merchandising, organization and remaining CMS acceptance.

The initial immutability test assumed every denied UPDATE raises an exception. PostgreSQL can also enforce immutability through a zero-row RLS denial; the corrected test verifies unchanged data in both cases. Publisher capability is now checked before taking a write lock. Both resumed failures were resolved before the full suite passed.

Rechecking the earlier bundle audit found that the existing money formatter already returns “Pending quote” for missing values. A missing-total-as-zero defect is not claimed as reproduced or fixed; exact bundle agreement/configuration acceptance remains open.

Current launch decision and ordered gates: [November 9 readiness report](../LAUNCH_READINESS_2026-11-09.md).

Implementation stays in the existing repository and isolated development environment. Existing production services, data and domains remain outside scope. No PSRESTful, automatic paid service, copied catalog or second login is authorized by this implementation.

The approved architecture and [80-case acceptance matrix](08-acceptance-tests.csv) provide the requirements-to-test mapping. Candidate implementation locations are `packages/contracts/src/website.ts`, `packages/marketing/src/website/`, existing server routes, the shared renderer and the OS website workspace. The module inventory remains the original 20 entries.

The [implementation traceability matrix](implementation-traceability.csv) records code paths and measured service/browser evidence against the original 80 CMS case IDs. Browser evidence supplements the earlier backend checks. All rows remain partial or unverified until the complete original scenario, relevant roles, scale and operational conditions pass.

Source publication verified: [current development branch](https://github.com/SEM-Admin/twelvespec-platform/tree/build/website-content-studio-20261109), tested code commit `92d499b`. All 353 recorded source-input hashes matched. The hosted previews and production systems were not updated by this publication.


## November 10 branch integration

See [branch inventory, code/test mapping and checklist](../integration/2026-11-10.md). All three prior feature branches are ancestors of the integration branch; their implementations are preserved. The live forms are at Commerce OS `/website`; the shop reads only immutable published releases. Exact saved revision previews use the same React components, authenticated site/workspace membership, private/no-store responses and noindex metadata.

The full browser runner now creates and removes only a fresh disposable local database and refuses occupied application ports. Routine owner edits use database content and need no commit or deployment after the interface is deployed. Merging source does not deploy it.

No new paid CMS, product database, login system, production domain or supplier service was introduced. Scheduling, video processing and document downloads remain unavailable. Hosted storage and original 95-scenario/full 80-case acceptance remain explicit gates.

Local integration verification: **251 backend tests, 18 full browser journeys, five post-review CMS journeys, TypeScript and both optimized builds passed.** GitHub CI on the integration PR is the required final head check before merge. This does not close the original 80 CMS scenarios or authorize production sales.
