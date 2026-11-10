# Acceptance strategy

**This is a test specification, not a passing test report.** The 80 cases in [08-acceptance-tests.csv](08-acceptance-tests.csv) are marked `PROPOSED_NOT_RUN`. Their suggested source paths do not yet exist. No CMS runtime was implemented during this audit.

## Evidence separation

| Evidence | What it establishes | What it does not establish |
| --- | --- | --- |
| Source inventory and nine current-UI screenshots | Current domain architecture, hardcoded website presentation and inspected existing controls. | Production readiness, complete original V1 acceptance or a working CMS. |
| Fresh local read-only browser audit | Sample storefront and owner pages load; four owner API reads succeed; desktop/mobile audit results are captured. | Provider connectivity, load capacity or future editor acceptance. |
| Prior recorded 169 automated checks / 11 browser journeys | Earlier business and security regression evidence, with its original scope. | Fresh execution in this turn or coverage of proposed CMS features. |
| Review-wireframe verification | Offline prototype navigation, editing demonstrations, device controls and local assets behave as described. | A database save, publication, rollback or actual CMS permission check. |
| New acceptance matrix | Explicit expected behavior, dependency, proposed test location and failure criteria. | Execution or completion. |

## Test layers and fixtures

1. **Document contracts:** validate supported versions, discriminated blocks, bounded rich text, safe link targets, registry variants and size/depth limits. Unknown properties fail closed. Schema tests support domain behavior; they do not mirror implementation details unnecessarily.
2. **Real PostgreSQL integration:** use the existing migration/runtime-role test harness with two tenants, two workspaces, primary and organization sites, active/inactive members, owner/editor/publisher/designer/customer actors and nonmember callers. Exercise reads as well as writes, including metadata, preview, asset and relationship paths. A UI-hidden button is not authorization.
3. **Public projections and private media:** seed a published product/variant, paused product, private supplier source, private customer original, approved web derivative, expiring/revoked media and an asset bound to a different product. Assert forbidden fields/bytes never leave public endpoints.
4. **Publication/concurrency:** use independent transactions/clients to test conflicting saves, selected-change releases, atomic pointers and idempotent retries. Read page/navigation/theme during activation to detect mixed releases. Rollback creates a new auditable release and validates current dependencies.
5. **Scheduler and recovery:** test UTC, daylight-saving ambiguity, cancellation, expired jobs, process termination before/after commit, duplicate delivery, executor waking and database-plus-asset restore. Use an injectable clock in tests; do not wait for real calendar dates. A reset local demo is not backup evidence.
6. **Browser workflows:** exercise real OS → API → database → storefront behavior, not just screenshots or mocked success toasts. Verify the public browser sees the exact published revision while a separate editor sees its draft. Run both app processes and the actual development cache boundary.
7. **Accessibility and performance:** combine automated checks with keyboard/screen-reader/manual review, measurements on representative content and user testing. Test mobile editor states as well as the customer site.

Use synthetic records and isolated local/development services. No production accounts, suppliers, payments, customer data or external campaign recipients are test fixtures. Mutating tests clean up only their own scoped test data. Do not wipe the owner's preview content to make a test pass.

## Measurement targets proposed for review

| Area | Initial gate | Measurement |
| --- | --- | --- |
| Customer page performance | LCP ≤2.5 s, CLS ≤0.1, INP ≤200 ms at the 75th percentile when enough field data exists. | Lab runs provide development evidence, not fabricated field percentiles. Establish a reproducible mobile/network profile before comparison. |
| Lab response/weight | No >10% median regression versus the pre-change fixture on five comparable warm runs; investigate any new excessive scripts, images or fonts. | Record app commit, device/network profile, fixture size, cold/warm state and individual results. Agree absolute API/asset budgets from the Phase 1 baseline. |
| Owner tasks | Each of six routine tasks completes unaided in ≤3 minutes after brief orientation; no Git/SQL/deploy. | Observe headline/image update, section reorder, collection curation, menu change, preview/publication and rollback. Revise confusing controls rather than bypassing them for the owner. |
| Responsive behavior | No unintended horizontal page overflow at 390, 768 and 1440 px; usable at 320 px and 200% zoom. | Preview canvas may deliberately scroll inside a labelled region on a narrow editor; surrounding app must remain operable. Test keyboard focus and dialogs. |
| Accessibility | WCAG 2.2 AA target; zero unresolved critical/serious automated violations in exercised states plus manual keyboard/focus/screen-reader checks. | Axe is evidence, not certification. Include the current mobile account-button failure as an explicit regression. |
| Publication consistency | Approved page/header/footer/theme revision set is consistent on every tested read; private draft bytes never appear publicly. | Multiple clients and app processes, during publication and cache invalidation. |
| Revoked media/access | New protected requests fail immediately after membership/session revocation; public derivative revocation has an explicitly agreed cache TTL and tested invalidation. | Do not imply that already downloaded public copies can be recalled. Never use a long public TTL for private originals. |
| Recoverability | Content, active-release pointer, media and reference graph restore coherently; resumed scheduled jobs are idempotent. | Record a real isolated restart/restore drill, not only a backup-file existence check. Define production RPO/RTO with the owner before production activation. |

These are proposed acceptance targets. The existing 341–439 ms API sample is neither a performance budget nor a percentile. Poorly performing or flaky checks remain reported failures rather than being waived silently.

## Continuous verification after review

Run the narrow relevant contract/database/browser checks with each vertical slice. Run the existing `npm run typecheck`, `npm test`, `npm run build`, `npm run check:spec`, `npm run check:plan` and browser suite at the integration gates appropriate to the change. Add the agreed CMS acceptance runner only when real CMS implementation begins. Repeat broad suites when new changes or unresolved failures warrant it; do not relabel old results as a fresh pass.

Every execution record should include test ID, app/code commit, migration version, synthetic fixture identity, timestamp, environment, actual result, evidence path and unresolved blocker. `BLOCKED` needs a specific dependency and next action; simulation is a separate field from integration verification.

## Coverage and traceability

The CSV maps cases to A–H of the requested studio, the eight customer experiences (`CX1`–`CX8`), `DESIGN`, `EDITING`, `TECH` and `OPS`. The component CSV maps each editable section to its allowed properties, current reuse and security dependencies. The 20 original modules remain represented in the audit/source inventory. Content acceptance supplements the original platform requirements; it does not replace their unresolved cases.
