# Explicit QC and guarded dispatch — November 22, 2026

The prior QC command accepted an overall `passed` flag and defaulted missing quantity/color/placement/damage checks to `true`. Job completion trusted a mutable pass flag, and shipping trusted the completed job without checking its inspection receipt again. The former required checkbox in the operator form also prevented a normal failed-result submission.

This bounded V1 correction reuses the existing orders, jobs, `qc_checks`, fulfillment records and audit/outbox transactions. It adds no manufacturing engine, payment integration or external service. The parent durable-storage milestone is merged through [PR #12](https://github.com/SEM-Admin/twelvespec-platform/pull/12); both changes remain undeployed to the protected development previews.

## Behavior and boundaries

- Operators choose an explicit overall result and a pass/fail for each of the four existing checks. No choice defaults to pass. The server requires actual booleans, rejects incomplete/contradictory checks, and requires a reason for failure.
- The current job revision is required. Concurrent submissions using the same revision produce one inspection and one revision conflict. Inspector identity and time come from the authenticated server context.
- Each result carries `EXPLICIT_QC_V1`, an `OPERATOR_RECORDED` assessment and an immutable snapshot/hash of the exact job/order/line, route revision, quantity, product, method and design version, together with the inspected job revision. A database trigger makes all inspection history immutable. Corrections append another inspection.
- A failed inspection moves the job to rework. A pass moves it to pending completion; it does not itself complete a job, authorize supplier spend or ship goods.
- Completion and shipment require a real passing receipt belonging to the current job and order, with explicit checks and a matching context hash. Both recheck existing artwork/preflight and prepayment requirements. A pass flag by itself, another job's receipt or a changed job cannot release goods.
- An unshipped completed job can be reopened for inspection with a current revision and reason. Reopening clears the active pass without modifying earlier receipts. The UI withholds completion until a new pass is recorded. A shared order lock serializes reinspection against shipment; only one can proceed.
- Shipped jobs require a reviewed return/remake path; closed/cancelled orders cannot be reopened this way. This milestone does not implement the complete return/remake workflow.

Legacy inspection rows are retained exactly, including earlier defaulted checks. They are not retroactively labeled explicit evidence. Pending legacy jobs need a newly recorded inspection; unshipped completed jobs use **Reinspect unshipped job**. Shipped legacy work cannot be rewritten to bypass the new gate. Existing supplier, financial, tenant and Coming Soon restrictions remain in force.

## Requirements → code → test

| Requirement | Existing authority and change | Verification |
| --- | --- | --- |
| Orders QC checklist; no invented pass | `packages/orders/src/quality.ts`, `record_qc`, Commerce OS action fields | Missing, partial, extra, string-valued and contradictory checks leave no QC record; failed result retains the actual failed check/reason |
| Scoped roles and stale edits | Existing role/RLS checks, job lock and required revision | Customer/other-workspace denial; two concurrent inspectors produce one receipt and a revision conflict |
| Immutable production history | Existing `qc_checks` identity and `app.reject_mutation`, migration 017 | Updates/deletes rejected; upgrade preserves legacy QC, CMS, catalog, quotes and commercial evidence |
| A23/A24 QC portions: current job evidence | Existing `close_job` and shipment creation use the same orders-domain receipt validator | Wrong-job receipt and changed quantity blocked; independent prepayment checks at completion and dispatch; original cross-module order→MIS→PO→partial shipment→profit scenario still passes |
| Audited remediation without false delivery | Existing job and shipment records, `reopen_qc` | Unshipped reinspection preserves prior receipt; shipped/closed work denied; competing shipment/reinspection yields one success |
| Actual operator workflow | Existing Commerce OS job action modal | `tests/e2e/quality-inspection.spec.ts`: no preselected passes, failed inspection/rework, explicit new pass, completion, reinspection and blocked shipment; both receipts remain readable |

Integration cases live in `tests/integration/quality-inspection.test.ts`; existing cross-module and upgrade/recovery tests are extended. The shared error helper now accepts an optional readable explanation while retaining stable error codes and existing caller behavior.

## Verification and release

The full local backend suite passes **391 tests across 51 files**. The 17 focused QC cases and two cross-module order cases pass again after the final snapshot/readable-error changes. TypeScript, both optimized Next.js builds, all specification/plan/research/industry/decoration checks and the real operator browser journey pass. The builds retain the legacy filesystem-tracing warnings. Exact-head GitHub CI must repeat the complete backend suite, all 29 browser journeys and the network-isolated production-container check before merge; its receipt is on the pull request. No deployed or live-provider acceptance is implied.

The protected previews still use application source `be9f41764f64c43b97379cf52555fd1c39b02943` and migrations 001–015 from the [November 18 hosted receipt](supplier-api/HOSTED_VERIFICATION_2026-11-18.md). Deploying the updated frontend/backend together with migrations 016–017 requires a tested candidate and deployment authorization. Older open forms fail closed and need refresh. A rollback must retain the inspection history and use quality-aware code; removing the guard to resume unverified dispatch is not a safe rollback.

GAP-024/026 and full V1 acceptance remain open. Complete component/decorator routes, required operation sequencing, resource/time/waste accounting, producer-specific inspection/sampling profiles, measured or independent quality verification, manufacturing output, carriers, returns/remakes and production financial activation are not established by operator-recorded checks. No production infrastructure, DNS, supplier order or payment is changed.
