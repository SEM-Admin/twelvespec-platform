# SAGE-first catalog pilot before DNS cutover

Scope, November 18, 2026 (UTC): reuse the existing SAGE connector, metering, encrypted credentials, private source staging, owned catalog and reviewed quote workflow. Do not move DNS, change the ASI production site, purchase overage, submit supplier orders or create a competing catalog.

## Requirements → existing code → pilot evidence

| Requirement | Existing implementation | Verification |
| --- | --- | --- |
| Keep the first experiment bounded | Native connection policy, committed reservations and shared billing group | `tests/integration/sage-pilot.test.ts`; four simulated reads, then hard stop |
| Reuse responses without further paid queries | Credential-scoped PostgreSQL cache | Same pilot repeats 40 reads after reaching the call cap; no additional charged reservation |
| Keep customer browsing independent of SAGE | Published owned catalog and local quote cart | Extended SAGE browser journey compares its ledger before/after public browsing |
| Curate selected sources privately | Existing stage-result and create-from-source commands | Pilot stages one selected detail, creates a private draft, verifies unchanged published catalog |
| Preserve credentials, financial controls and account scope | Existing runtime guards, vault, RLS and authorization | Pilot denies missing real-account credentials, ephemeral secret storage and customer/cross-workspace access |
| Distinguish a rehearsal from a real connection | Existing MOCKED / LIVE_VERIFIED evidence | Report explicitly records synthetic responses and zero external requests; live acceptance remains separate |
| Verify the production runtime separately from development servers | Multi-stage container and pinned runtime dependencies | `scripts/verify-preview-container.mjs` and CI run both apps, owner sign-in, encrypted synthetic credentials, native cache/cap and private staging with Docker networking disabled |

No application feature or supplier transport is replaced. The new test is an operational rehearsal of existing capabilities, not a live SAGE verification.

## Verified starting state, before the upgrade

Read-only inspection found the approved Supabase development project `mtihnarlkprmyahbxlrl` healthy with no users, tenants or native SAGE/SinaLite connections. Only application migrations 001–004 are installed. The native usage/cache/vault tables from migration 010 are absent. Current source requires migrations through 015.

The protected preview runtime has `PREVIEW_DATABASE_ENABLED=false`, public sandbox catalog networking enabled, and no SAGE environment secret. Native SAGE credentials are entered through the authenticated Integration Center once persistent storage is ready; a generic Worker secret is not a substitute for that connection. No SAGE key was found in this workspace's environment. No exposed documentation/screenshot key is used.

The existing restricted development database credentials were found in a private, ignored deployment file. A strict-TLS application probe to the configured pooler returned `ECONNREFUSED`; an approved direct-host probe returned `ENETUNREACH`. These are client-path observations, not proof that Supabase is down. Supabase's API reports `ACTIVE_HEALTHY`, and security advisors returned no notices. Certificate and hostname verification remain enabled.

## Development schema completed

The existing application migrations 005–015 were then applied to **only** the approved, empty development project. A guarded bundle required exactly the original four migrations and no users/tenants. Its local dry run verified 15 migration records, 114 application tables, and rejection of a repeated upgrade. The exact bundle SHA-256 is `bacb6b8bbc890a256f6d5747f1f5a26585bed92b52bae1a22b974496c2abe383`; its SQL is composed of the unchanged repository migration files, with their names recorded in the existing application `_migrations` tracker.

Supabase recorded managed execution `20261118021506 / twelvespec_v1_catalog_intelligence_005_015`. A separate provider-hardening execution `20261118022032 / secure_supplier_receipt_function` pins the supplier-receipt trigger's search path and revokes public execution, using `supplierReceiptPrivacy()` in `infra/supabase/development-privacy.ts`. Historical application migration files were not edited and no new schema authority was introduced.

Readback verifies **114 `app` tables + 9 `public` tables**, all 15 application migrations, all five native API tables with forced RLS, no anonymous/authenticated-role access to those tables, a fixed private trigger search path, and **zero security-advisor findings**. There are still zero users, products, credentials and supplier call records. This verifies database preparation through Supabase's management connection; it does not verify the application's PostgreSQL path or attach a preview.

The runtime packaging also separates build and runtime stages and omits development dependencies from the final image. `tsx` and `embedded-postgres` remain pinned runtime dependencies because preview startup needs both. Container startup/image verification and final-head CI must pass before requesting deployment. Keep the current protected preview unchanged until authorization.

The local image build hit `ENOSPC` during dependency installation on the managed workspace's 8 GB filesystem/VFS Docker driver. The failed build cache was removed; no app, source or database data was deleted. Container verification therefore runs in an independent existing GitHub CI job with the canonical Dockerfile. Its runtime has `--network none`, a disposable local database and synthetic credentials. Only bounded JSON evidence is uploaded by default; environment files are removed and never uploaded. Image export is off by default and available through a manual workflow input only after preview deployment approval. This is not hosted HTTPS or real SAGE evidence.

## Rehearsal

Run `npm run test:sage` against disposable local PostgreSQL, then run the existing supplier and owned-catalog browser journeys. The focused run passes **59 tests** and all three selected browser journeys. Four simulated reads followed by 40 cached reads leave the reservation at four calls and three synthetic credit units, with zero paid fees. The next uncached call and a paused read are blocked. Selected evidence creates a private draft without changing the published catalog; public browsing leaves the SAGE ledger unchanged.

`.local/sage-pilot-report.json` contains synthetic counts and local cache timing only; never credentials or raw supplier data. Synthetic credit weights do not establish SAGE's actual tariffs, query weights or remaining allowance. Local timing is not a hosted performance or load-capacity guarantee. The supplier function hardening is verified against actual PostgreSQL permissions and immutable-receipt behavior.

## Real-account sequence

1. Complete and verify the already-approved isolated development database schema, restricted-role connection, stable server encryption material, restart persistence and recovery. Prepare a protected preview deployment for review; retain owner-only Access and explicit account-read gates. Do not mark an ephemeral ledger durable by setting a toggle.
2. Enter a current API key securely. Use a System/Public connection for website catalog sources; personal-login research remains staff-only and cannot create public catalog drafts. Neither kind of key belongs in browser code, source, ordinary chat or a product response.
3. Confirm current account entitlement and cache/display/image rights. For fee-based modules, confirm the actual per-operation query weights, current remaining allowance and provider-side paid-query stopping behavior. Both application and shared account paid ceilings stay **USD 0**. Do not infer today's allowance from the old screenshot or pool System/Public and named-user credits.
4. Start with one service-101 category read, then repeat it from cache. After the credit/billing checks, perform one narrow service-103 search and fetch details only for explicitly selected product IDs. Choose basic 104 for website facts or full 105 when private supplier/cost evidence is required; avoid retrieving both for the same SKU without a reason. Limit the first run to four uncached calls, with weighted credits capped at the confirmed allocation. No bulk harvest or automatic retry.
5. Stage at most three selected sources privately. Confirm exact variants, MOQ, decoration method/location/template, licensed media and current costs before publication. Blank-image references and discount codes alone establish neither a photo license nor net cost. Keep unknown freight, setup, tax and delivery unresolved until reviewed.
6. Verify an approved curated product through storefront selection → saved request → private cost review → issued customer quote. Record exact source IDs, retrieval times, call receipts, cache hits and known/unknown charges. Native staging and a separately tested manual quote do not constitute this live end-to-end proof.
7. Restart the preview and verify that connection, ciphertext, budgets, receipts, cache and the saved request survive. Reconcile the observed provider usage with the local reservations. Browse repeatedly and verify no additional supplier calls. Exercise pause and hard caps without spending overage.

## DNS release decision

DNS remains unchanged until the real-account sequence passes on protected HTTPS previews, products and public copy are approved, inquiry persistence and operator notifications/review coverage work, real spam protection is verified, and an explicit cutover/rollback plan is authorized. Historical ESP+ requests stay intact. The original full V1, CMS and production-release gates remain open.
