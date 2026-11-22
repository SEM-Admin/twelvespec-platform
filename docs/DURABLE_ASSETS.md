# Durable artwork and catalog media — November 22, 2026

This source milestone extends the existing canonical `app.assets` registry and its private PostgreSQL `web_bytes` column. It does not add a storage service, another catalog, another file identity, or a public bucket. Migration `016_durable_asset_bytes.sql` is additive to the existing application schema; original migrations and controlling specification files remain unchanged.

The existing protected runtime remains on `be9f41764f64c43b97379cf52555fd1c39b02943` with migrations 001–015. Its Supabase persistence and synthetic supplier-metering evidence are recorded in [the November 18 receipt](supplier-api/HOSTED_VERIFICATION_2026-11-18.md). This new source and migration have not been deployed. No production application, database, DNS, ASI catalog, supplier order or payment is changed.

## Architecture and reuse

- Website Studio already stores private originals and separate optimized derivatives in PostgreSQL. Creative Studio and the owned catalog now reuse that storage boundary and the existing scoped asset IDs/foreign keys.
- A Creative upload preserves the exact original bytes in a quarantined asset and a stripped PNG preview in a separate child asset. The parent binds its preview once; readers verify the parent, owner, project, kind and scope. PDF originals stay private without an invented preview.
- Mockup jobs read authorized persisted previews and store the generated PNG in the same domain transaction. The output remains a synthetic, preview-only raster with production readiness blocked.
- Catalog uploads preserve both the original and optimized WebP. The public URL is unchanged and serves only a derivative referenced by the exact current published product snapshot. Paused/unpublished products and original IDs are denied.
- New bytes, metadata and audit/outbox events commit or roll back together. New uploads create no local files. Legacy filesystem records remain readable through their existing scoped paths; no automatic migration or deletion is performed.
- Generic `list/get/create/update` asset results select metadata only. Authorized byte readers explicitly load bounded bytes and verify length and raw SHA-256. New storage failures cannot fall back to arbitrary local files.
- Database guards prevent mutation of existing bytes, scope/owner, domain references, original link, media kind/type, length, hash and an established preview binding. Revision, rights and revocation status can still change through their owning domain commands.

Original uploads retain their existing 8 MiB Creative / 5 MiB catalog limits. The shared private storage bound is 16 MiB to accommodate stripped raster previews; website media retains its 8 MiB database bound. Every upload still has a decoded-pixel bound. This is a bounded persistence foundation; large CAD files, aggregate quotas and production capacity require a later reviewed storage adapter/capacity milestone.

## Requirements → code → test

| Requirement | Implementation | Behavioral verification |
| --- | --- | --- |
| A02/A14: private originals and buyer/workspace isolation | `packages/creative/src/index.ts`, `packages/kernel/src/asset-bytes.ts`, existing asset RLS | `tests/integration/asset-storage.test.ts`: exact original retained; another buyer/workspace denied; customer original and guessed internal derivative denied |
| A14/GAP-003: survive process/filesystem replacement | Canonical PostgreSQL bytes, migration 016 | A new Node process reads identical original/preview hashes with an empty asset directory |
| Transactional uploads and immutable evidence | Shared asset writer, metadata projections, immutable byte trigger | Failed downstream transaction removes both assets and events; malformed image leaves no file/row; changed bytes/owner/hash/preview rejected |
| A15: exact version/variant mockup | Existing render queue and `processMockupJob` using stored previews | Persisted image layer generates a real readable PNG; synthetic/production-blocked state retained |
| Catalog publication and original-file retention | `packages/catalog/src/media.ts`, existing published snapshot and RLS | Exact original hash retained; draft/original IDs hidden; published derivative readable; pause hides it |
| Existing Website Studio behavior | `packages/marketing/src/website/media.ts`, `packages/server/src/website.ts` | Existing editorial publication/revocation tests use explicit integrity-checked byte readers |
| A39: database recovery includes original and derivative bytes | Existing complete `localRestoreDrill`; no competing backup manifest | `tests/integration/recovery.test.ts`: actual domain upload included in the fresh-database, database-native content/hash/FK verification |
| Upgrade and legacy compatibility | New migration only; filesystem read fallback for legacy records | `tests/integration/migration-compatibility.test.ts`: old website bytes, original-file metadata, prices, quotes and CMS history unchanged; legacy file-read fixture passes |
| Customer browser → API → database → reopened design | Existing customer designer and private asset route | `tests/e2e/durable-assets.spec.ts`: real image upload, immutable design/proof save, reload, rendered preview, byte hash, private projections and denials |
| Compiled, network-isolated production runtime | Existing `verify-container` CI job, `scripts/verify-preview-container.mjs` | Real production upload/preview routes, PostgreSQL original/derivative hashes and binding, anonymous denial and unchanged production gates |

## Verification receipt

Merged in [PR #12](https://github.com/SEM-Admin/twelvespec-platform/pull/12) at `1b5741c79dc7782f3985eae4063d739dc1bbb951`. [Exact-head CI 44999431578](https://github.com/SEM-Admin/twelvespec-platform/actions/runs/44999431578) passed both regression and network-isolated production-container jobs on source `d14326fdaa33a7a3728e0f9a8f41e9c52f0f532b`. The compiled upload/preview routes, exact original hash, safe derivative binding and anonymous denial passed in the nonroot container with external network disabled. No hosted rollout occurred.

Fresh local verification on November 22 passes **374 backend tests across 50 files**, including upgrade and complete-database restore, and **all 28 browser journeys** against a disposable synthetic database. TypeScript, both optimized Next.js builds, specification/plan/research/industry/decoration checks and the container-verifier syntax check pass. The builds retain the legacy dynamic-filesystem tracing warnings; no check failed. Exact-head GitHub CI, including the expanded network-isolated production-container verification, is required before merge and is recorded on the pull request. No hosted acceptance is implied by these local results.

## Remaining activation requirements

GAP-003 remains open. Independent malware scanning, retention/deletion rules, aggregate upload quotas/capacity tests, managed backups with a real restore drill, and inventory/recovery of pre-existing local files are not implemented or verified by this milestone. Existing local files are not silently treated as durable. A future object-store adapter must retain the same canonical asset identity and scope, with its own reviewable migration/recovery plan.

The next hosted action is a separately reviewed deployment of this tested source and migration 016 to the two existing protected development previews, followed by original/preview readback and restart verification. There is no new paid service in this implementation; any storage-plan change needs approval. This source does not enable customer production downloads, scan approvals, manufacturing output, live supplier spending, payments or production release. Full V1 acceptance remains open.

Rollback must retain migration 016 and a storage-aware application build. Older filesystem-only code cannot read newly byte-backed Creative/catalog records. Do not remove stored bytes or apply a destructive down migration; keep uploads paused during a deployment rollback and use a forward fix or a previously tested storage-aware image. Existing rows, publication IDs and legacy files are preserved by this migration.
