# Quote-first intake verification — November 17, 2026

Location update: the [curated catalog / one quote workflow continuation](catalog-curation/ONE_QUOTE_WORKFLOW.md) moves account-free review into Sales → Quotes & requests. The CRM follow-up data and Today tasks are reused, with no second CRM review panel. The PR #7 measurements below retain their original scope; the latest implementation checklist records subsequent verification.

Story: a visitor describes a project without choosing a SKU or opening an account; the request receives a committed receipt, enters the existing private CRM and Today queue, and a staff member reviews it. Formal prices, delivery commitments and customer quote acceptance retain the existing reviewed workflow.

## Implemented in source

- `/inquiry` retains the signed-in project flow. Its account-free option is disabled by default, with no implicit demo workspace/assignee fallback. CMS project inquiry links now reach this route without requiring an initial cart selection; existing document JSON and authenticated cart functionality remain supported.
- The fixed-purpose `/api/inquiry` command accepts bounded, strict JSON, explicit project-contact permission, a honeypot and a challenge token. It neither accepts a client-supplied workspace/assignee nor creates an account, merges a contact, grants marketing permission or creates an order.
- Existing PostgreSQL `follow_ups`, `work_items`, `command_receipts`, audit and outbox rows commit together. A lost HTTP response can be retried with the same key/content without creating another request or task. A receipt does not grant read access.
- A protected, genuinely paged Customers & CRM inbox shows submitted contact details as unverified. Revision checks protect reviews. Explicit staff attestation is required to mark responded; the application does not send a message. Review status also completes or reopens the associated Today task.
- SQL-backed rolling caps serialize across workers. Live challenges must verify success, exact configured hostname/action and freshness. Browser retries obtain a new token. Missing credentials/configuration or challenge errors fail closed. The public option is rejected in development preview runtimes.

## Final local verification

| Check | Result | Evidence |
| --- | --- | --- |
| Backend, contract, security, migration and recovery suite | **354 passed / 46 files, 0 failed** | `npm test`; `.local/test-results.json` |
| Complete browser suite | **26 passed**, including two new guest journeys | `npm run test:e2e`; Playwright report |
| Both optimized applications | **Passed** | `npm run build` |
| TypeScript | **Passed** | `npm run typecheck` |
| Original specification/module inventory | **Passed** | 85 original files, all 20 modules (19 active + Coming Soon), 205 inventory entries and original 95 A/T/E scenarios retained |
| Research/industry provenance integrity | **Passed** | 1,823 research and 427 industry checks; these are not implementation acceptance |

The guest browser test deliberately drops a response **after** the real server commits, verifies that the page reports failure rather than false success, retries and receives the original receipt, and verifies exactly one private inbox request. It checks the form at 390px with automated WCAG A/AA rules and no horizontal overflow. A separate owner browser opens the real CRM, saves a review, reloads and verifies the saved note. The unavailable-configuration journey verifies a visible retry instead of a broken form or false receipt.

The integration suite also checks forged scope, privacy across roles/workspaces, strict input/byte bounds, invalid dates, serialized email/global caps, changed-content retry conflicts, complete transaction rollback, older records beyond generic list limits, pagination, stale revisions and contact attestation. A valid submitted address never overwrites an existing CRM contact or permission.

Earlier focused runs found and corrected a stale Next development cache reload loop and exact accessibility labels for receipt/review controls. The final complete runs above supersede those failures. Authentication was not weakened. Both builds retain the six previously recorded Creative filesystem-tracing warnings (three per app); these remain a packaging/durable-asset concern, not a passed production gate.

The first PR #7 CI run passed backend/build checks and 25 of 26 browser journeys, then found an ambiguous test selector while a saved confirmation and loading status appeared together. The selector now identifies the specific saved confirmation; no product authorization or assertion was weakened. The final-head CI receipt on the PR determines integration readiness.

## Simulated functionality

All test business data is synthetic and every test database is local and disposable. The local form uses a visibly labelled synthetic challenge. Server tests simulate Siteverify success, invalid hostname/action/age, provider/network errors and duplicate-token rejection. **No real Turnstile widget/token flow, notification delivery, live supplier call, payment or customer production order was activated or verified by this work.**

## Verified external configuration

Read-only Cloudflare API calls confirmed the existing three preview Workers, zero zones/custom domains and `PREVIEW_DATABASE_ENABLED=false`. Binding existence does not verify a database connection. Read-only DNS inspection confirmed Porkbun nameservers, the existing apex A record, the `www` ESP Websites CNAME and Google mail MX at the time checked. This is a partial public snapshot, not an authoritative full DNS export. No existing website was accessed and no DNS records were changed.

## Outstanding activation requirements

There are no failing tests in the final implemented local scope. This is **not a public launch approval**: production database bootstrap remains blocked by the existing database factory, hosted persistence/TLS/restart/restore remains unverified, and production identity, real spam protection, approved public content/privacy/retention and monitoring require completion. The source changes have not been deployed to the existing previews. The original full V1 and 80 CMS acceptance gaps remain open.

Use [the launch checklist](QUOTE_FIRST_LAUNCH.md) for exact activation dependencies and the separate DNS/cutover authorization. Source integration must use a green CI result on the exact final head; the GitHub receipt is attached to the pull request. Do not point TwelveSpec.com at a development preview or remove Commerce OS authentication as a shortcut.
