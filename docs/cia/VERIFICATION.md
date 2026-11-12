# CIA M1 verification and remaining activation requirements

Application baseline: main `3c221f697a3bd9631ccb7ecabaaa8e3c2c5d9649`. Audit/design committed first as `240f72f`. Implemented code/tests: **`63a2c2206712177f2db668d286a546562fc33242`**. Later commits on this branch update audit/research/checklist documentation only. Contract review includes all three CIA companions at PR #3 head `5a07a1c954fef546b492f70ba152ea7065b6d86d`; the initial two contracts are unchanged from the earlier `4b7c8aa` read.

## Implemented

- Existing pricing service extends source unit values before rounding; tier and non-tier Sales regressions verify `.0250 × 1000 = 25.00`. A local 40-digit Decimal context retains cents at the largest supported source/quantity magnitudes without changing other domains' global arithmetic.
- Four additive, private, scoped immutable evidence/assessment tables; exact product/variant revisions, price classes, source editions/raw scale, source validity and retention, append-only rights restrictions and independent quantity/account/region/channel/currency applicability.
- Existing Supplier commands append manifests/observations/restrictions; existing Sales command assesses one authoritative Draft quote line and records an immutable explanation. It never changes that quote or grants an issue/order/payment/production permission. No second PIM, editor, queue, secret store or application.
- Original V1/future-module inventory and launch gates retained. The expanded compatibility, trust and product-thread documents classify each pending capability explicitly.

## Measured local checks — November 12

| Command / check | Actual result | Scope |
| --- | --- | --- |
| Fresh main `npm test` | 251 tests / 36 files PASS | Re-established baseline before code changes. Local PostgreSQL had to be started first. |
| Final `npm test` | **292 tests / 38 files PASS** | Isolated disposable PostgreSQL, all migrations + synthetic seed. Includes 41 additional evidence/precision/state/security tests. |
| `npm run test:e2e` | **19 journeys PASS** in 4.3 minutes | Full existing storefront/OS/CMS/supplier-mock suite + new protected evidence HTTP journey, disposable DB. Followed by additional money applicability/input guards. |
| Final `npm run test:e2e -- tests/e2e/commercial-evidence.spec.ts` | **1 journey PASS** in 31.2 seconds | Rechecked the new browser/authenticated HTTP path after final guards. No new dedicated evidence UI is implied. Remote CI must run the full suite on the final PR head. |
| `npm run typecheck` and `npm run build` | PASS, both optimized Next.js apps | Six existing Creative dynamic-filesystem tracing warnings remain (three per build). No new engine/runtime dependency. |
| `npm run check:spec` | PASS | All 85 original files intact, 20 modules (19 active + Coming Soon). |
| `npm run check:plan` | PASS | All 205 inventory entries, 95 A/T/E scenarios, 40 acyclic packages and 30 original dated sources retained. Not 95 scenario passes. |
| `npm run check:research` / `check:industry` | 1,823 / 427 checks PASS | Existing research provenance/coverage; not provider/manufacturing certification. |
| Existing local database upgrade | Migration 011 PASS; counts unchanged for **102 existing registered tables**, including 173 products/251 variants | Reused synthetic local state without reset/backfill/repricing. Fresh-install migration and existing recovery suite also pass. This is not a hosted recovery certification. |
| Staged code/fixture comparison against private local signing/encryption values | No matches | Only synthetic financial/identity fixtures committed; no licensed catalog/net agreements or credentials. This check is not a full security certification. |

GitHub PR/CI is the remote publication and final-head verification record for `build/cia-evidence-foundation-20261112`. It must pass before any later authorized merge. This report records local measurements rather than predicting a remote result. No production deployment workflow was added.

The full browser run covered the ordinary customer/OS/CMS workflows. The new journey signs in through the actual OS form, uses the existing protected API over HTTP, confirms a draft quote is unchanged, denies anonymous mutation, and checks public responses exclude private evidence. API-only M1 commands are not presented as a finished nontechnical administrator UI.

## Simulated functionality

All new price, source, account, product and rights evidence used in tests is explicitly synthetic. The manually reviewed-document test cases exercise that state machine with fabricated test facts; they establish no real customer entitlement or supplier rate. Existing mock suppliers, payment references, POs/tracking and render jobs retain their previous simulation labels. No fake actual outcomes, sew-outs, certifications or manufacturer acceptances were added.

## Verified integrations

Verified in this work: existing local Better Auth/session/role handling, Next.js HTTP command routing, PostgreSQL migration/FK/RLS/immutable constraints, and read-only GitHub source/contract metadata. Both protected preview URLs returned HTTP 302 to Cloudflare Access in an anonymous check; this verifies only the edge redirect. Public engine documentation/metadata retrieval is recorded separately, including 404/403 failures.

**No new authenticated supplier, Shopify, payment, production, manufacturing engine or hosted database integration was verified.** Previously recorded supplier/sandbox evidence retains its original date/scope and is not upgraded by this work. No existing production system/domain was accessed.

## Outstanding failures and incomplete capabilities

There are no outstanding failures in the final local code checks listed above. That is distinct from incomplete requirements:

- Full 48-cap route qualification, dedicated evidence UI and complete blank/decorator/setup/freight/timing/artwork evidence remain pending. M1 returns material-only assessment; all-in cost and customer price remain null, production readiness BLOCKED.
- Claim-level truth/revocation gates, real approved contact/policies/showcase, product-free lead intake, consented acquisition/ROI and full production SEO remain open. No approved brand text was overwritten.
- Product/variant designer rebinding and complete technical revision/profile/thread work, four proof/prototype pilots and qualified method engines remain open. CAD/AI/digitization/validated 3D stay Coming Soon.
- Legacy supplier-offer eligibility, program/kit identity, reliable event/worker contracts, complete-dataset KPIs and other original V1 backlog items remain open.
- Three public engine research routes were unavailable (OCCT older docs 404, Blender license page 403, candidate callas URL 404); other primary sources provide only bounded documentation/license evidence, not operational qualification.
- Six existing optimized-build tracing warnings, incomplete hosted persistence and scanning/retention operations remain known limitations. Retention expiry blocks use but does not implement deletion/redaction; restricted-source activation must wait for that lifecycle.

## Activation and owner burden

No new paid service, real supplier call, credential change, purchase/payment, public publication, deployment, manufacturing export or factory submission occurred. M1 reuses the existing stack; no incremental service contract was selected. Ordinary storage/hosting usage and future engine/vendor prices are not predicted here.

Owner/operator work remains review of real source rights, exact product/route facts and technical/commercial exceptions. M1 has no measured time savings; the operator UI and later actual pilots must measure touches, active minutes, waiting and rework. Routine engineering can continue on M1b/M2 with synthetic data. Real credentials/entitlements/fees, legal/financial content/rules, qualified producer evidence, durable hosted state/recovery and specific deployment/production authorization remain the external gates when reached.

Paid production sales remain **NO-GO**. Original 95 A/T/E scenarios and the separate 80 CMS cases are not declared complete by test counts or this PR.
