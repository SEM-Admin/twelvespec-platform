# Connected CIA implementation — verification and remaining work

November 12, 2026. Foundation baseline `32c090a777cef3b7d4163bae767fd9b06efc3d33` / PR #4; architecture contracts pinned to draft PR #3 head `5a07a1c954fef546b492f70ba152ea7065b6d86d`. Read all three companions before this implementation. Original main baseline remains documented as `3c221f6` in the compatibility audit.

Tested code/test head: **`3c00296`**, tree **`9ddd01e708ea768bc8f3436db525cf30e4c8972b`**. PR #4's verified foundation was then merged into main as `67e334715d7fc2490025f1bd7dbd5608103aa662`. Incorporating that merge into this continuation (`d69a0e1`) produced **the identical file tree**. Later delivery documentation does not change runtime or tests. The implementation pull request and its Actions run record final-head remote checks and the merge commit. No deployment is included.

## Implemented and exercised

| Existing owner | New behavior | Behavioral evidence |
| --- | --- | --- |
| Creative / storefront / Sales | Exact product/variant binding on saved artwork; method/location validation; color changes create a separate project; exact-version proof dedupe and scoped invalidation | 4 integration tests, >1000 unrelated proof regression, concurrent approval/revision regression, actual two-color browser flow |
| Supplier / Integration Center | Private source forms, browser-only original-file fingerprinting, paged history/product/variant/customer-account selectors, precise original price records and rights restriction | 2 discovery integration tests; browser source → exact price → customer quote → private assessment → restriction, in America/Chicago |
| Orders/production | Immutable versioned producer planning profiles; exact product/variant revisions, facility/substrate/method/zone, documented dimensions and output-contract reference | Planning profile form in the cap browser journey; role, scope, unknown/revoked/stale/predecessor cases |
| Supplier / Pricing / Sales | Eight existing components with per-item/per-order/per-shipment bases; same underlying applicability policy and decimal arithmetic; explicit zero vs missing; distinct freight legs | 12 qualification integration tests; actual forms record 9 charges for the 48-cap customer request; USD 368.00 synthetic scenario, USD 613.33 suggested sale at existing 40% target margin |
| Commerce / CRM / Sales | Authenticated product-free inquiry, validated purpose/consent, honeypot and serialized customer rate limits, requested CRM follow-up, staff-reviewed exact product scope, normal draft quote | 5 integration tests, concurrent cap/deduplication, older contact beyond 1000 records, original inquiry preservation, public allowlist; customer/owner browser flow and mobile inquiry form axe check |
| Analytics / Today / Finance | Full scoped totals independent of displayed/exported record caps; unknown data stays null; non-USD excluded from USD sums; matched closeout hours for recorded profit/hour; missing closeout time is not fabricated zero | 6 integration tests with 1,205 records per source; actual dashboard browser assertions compare its cards with authoritative aggregates |
| PostgreSQL | Additive 012/013 migration, immutable scoped histories, original M1 defaults and retry fingerprints preserved | Dedicated local database upgraded from 001–012 through 013/014; original source, full price fields/fingerprint and quote unchanged; original retry resolves same observation |

Profiles are documentary planning evidence. Qualification scope is the selected draft quote line; shared order/shipment allocation across multiple lines or consolidated supplier orders is not implemented. A later consuming workflow must define that allocation and recheck current evidence. No automatic apply/issue consumer was added.

## Measured complete local regression

| Check | Actual result |
| --- | --- |
| `npm test` | **318 tests / 44 files PASS**, 63.82 seconds; fresh disposable PostgreSQL and synthetic seed |
| `npm run test:e2e` | **23 browser journeys PASS**, 5.9 minutes; fresh separate database, actual storefront and OS, no hosted or real supplier connection |
| `npm run typecheck` | PASS |
| `npm run build` | PASS for both optimized Next.js applications; 6 pre-existing Creative dynamic-file-tracing warnings |
| `check:spec` | 85 original files intact; 20 modules inventoried (19 active, Coming Soon) |
| `check:plan` | 205 entries / 95 A/T/E scenarios / 40 packages retained; inventory coverage is not 95 scenario passes |
| `check:research` / `check:industry` | 1,823 / 427 integrity checks PASS; not supplier/manufacturer verification |
| Changed-file privacy comparison | No matching private local signing/encryption/configuration values; no local `.env`, database, asset storage, licensed feed or credential file committed |
| React review | Client imports use safe contracts, not database/provider modules; event-driven mutations, scoped read effects and cleanup, disabled saving controls, labeled inputs and accessible errors; both builds and actual browser checks pass |

Remote CI is recorded on the implementation PR/Actions run, including uploaded reports, exact head and conclusion. Local success does not establish a remote result. The repository workflow contains verification only (`pull_request` / manual dispatch); no deployment workflow was added.

## Final compatibility hardening

The first full local run above is pinned to `3c00296`; later compatibility review found and closed two additional cases. Migration 014 hides new component/profile-bound observations from older default readers. Updated readers opt in with a transaction-local flag without gaining any additional role or workspace permission. Private CRM/inquiry metadata retains the older customer filter's `internal` convention. Price applicability now also rejects private catalog edits that differ from the customer's published definition, even when the current price/profile revisions agree with each other.

The rollback guard's full backend run passed **319 tests / 44 files**, and the four affected authenticated HTTP/evidence/qualification/inquiry browser journeys passed in 2.0 minutes. The subsequent publication-identity and privacy assertions passed **29 targeted tests**, including all 12 qualification cases and five inquiry cases. Final-head CI reruns the complete suite, builds and all 23 journeys; its exact head, counts and conclusion are recorded on PR #5. The next complete local rerun passed **320 tests / 44 files** and both optimized builds. The final null/explicit-zero finance refinement then passed all six outcome cases and both existing cross-module order/closeout cases (8 checks), plus TypeScript. Final complete counts are recorded in PR #5 CI. These later checks do not retroactively change the earlier pinned measurements.

The persistent local development database was separately upgraded through migration 014 with **all 102 existing registered-table counts unchanged**. This was localhost-only; no hosted database or business history was reset. Unused immutable tables/columns may remain on binary rollback, with the component compatibility guard kept in force. No automatic migration downgrade or history deletion is supported.

## Simulations and verified integrations

The 48-cap producer, route, source documents, stock, delivery, charges and all example financial figures are **synthetic**. The complete simulation always has `eligibleForQuoteCost=false`, `commitPermission=false` and production blocked. Documentary-path tests also use manufactured fixtures; they are not real supplier entitlement or manufacturer verification.

Supplier/Shopify/payment/purchasing/message paths in this regression use existing synthetic adapters. **No new live API integration was verified in this milestone.** Earlier dated sandbox/primary-source observations retain their separate status in the supplier research and activation records; they were not revalidated by this test run. No paid supplier query, real payment, PO, external message or machine-ready export was made. PSRESTful is not used.

## Outstanding failures, gaps and activation requirements

No automated failures remain in the measured local run. The six tracing warnings remain a packaging concern. This is not completion of active V1 or permission to start paid production sales. Original 95 A/T/E scenarios and 80 CMS cases remain separately tracked and incomplete.

Safe engineering work still open: claim-level source/revision/rights publication gates in the existing CMS; complete public-channel/private-projection cases; multi-line/producer allocation; automatic proposal consumption with current-evidence rechecks; four exact proof/prototype pilots and the wider typed product lifecycle; remaining active V1 items in the original coverage matrix. Approved free text is not automatically a verified factual claim. The inquiry is authenticated; anonymous intake and a full measured acquisition funnel are not implemented.

Activation dependencies remain: approved real identity/contact/policy content and supported claims; licensed selected catalog/media and supplier-account eligibility; actual source retention/deletion/redaction operations; validated producer-specific technical outputs, physical tests and manufacturer acceptance; durable private media/database storage, scan/backup/recovery/security verification; financial/tax/payment-provider approval and reconciliation; appropriately capped supplier credentials; and separately authorized, tested preview/production deployment. CAD, AI digitizing and validated 3D remain Coming Soon.

No existing TwelveSpec production application, database, suppliers, customer data or domain was accessed or changed. The remote development previews were not redeployed or newly verified by these local tests. Follow the [visible checklist](CONNECTED_QUALIFICATION_PLAN.md) and [original gap coverage](../planning/COVERAGE_MATRIX.md); OPEN remains OPEN.
