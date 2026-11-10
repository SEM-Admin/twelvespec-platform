# Security, operations and failure testing

## Threat model
Tenancy leakage, supplier price/identity exposure, stolen vendor credentials, SSRF through configurable endpoints, XML entity attacks, CSV formula injection, malicious art/SVG, provider webhook spoofing, duplicate PO/label, stale inventory underpricing, improper staff privileges, cross-workspace asset access, unsafe tenant-supplied automation and outbox retry replay.

## Implementation mandates
- Supabase/Postgres RLS on every tenant/workspace-scoped row; multi-column FKs include scope. Service-role DB connections only in trusted worker/admin server and subject to explicit programmatic scope checks; no service-role key in Next.js client bundle.
- Central action authorization (resource and operation), not merely nav hiding. Role defaults deny-by-default; supplier costs never available in public serializer, search documents or customer logs.
- KMS/secret-manager or Supabase Vault accessed by server only; strict audit and rotation; redact exception traces and telemetry. Masked last-four is not a secret value.
- All user-uploaded assets private until authorized signed derivative. SVG sanitization/iframe isolation for preview, type sniffing, AV scan, size/time limits, CDN cache controls, watermark mockups where needed.
- External API requests to fixed allowlisted HTTPS hosts; DNS rebinding and redirect checks, egress policy, rate limits, TLS verification, separate sandboxes.
- XML: reject DOCTYPE and entity expansion, use hardened parser; CSV streaming size/row/column ceilings and export formula escaping.
- Webhooks verify signatures where supported, reject old/replayed events and dedupe provider event IDs.
- Approval gates for supplier POs, payments/refunds, pricing exceptions, public publish and external customer communication.
- Audit user, role, workspace, action, state-from/to, reason, correlation and hash. Append-only logs and retention policy.
- Pin dependencies and run SCA/SAST, secret scanning, vulnerability audit, migration tests, accessibility axe, load and browser tests.

## Deployment environments
LOCAL: entirely synthetic, sandbox secrets, local DB. PREVIEW: private demo tenants + seeded fixtures + non-live adapters, time-limited links. STAGING: authorized sandbox vendor services and monitored webhooks. PRODUCTION: separate identity, project, credentials, domains, backups, restore tests, incident runbooks and allowlisted live operations; deploy guarded by manual approver. No promotion of test orders or credentials into production.

## Observability
Track sync success/failures, age of prices/inventory, PO unknown outcomes, job bottlenecks, proof SLA, margins, queue lag, automation false positives, vendor API spend, owner intervention minutes. Exceptions dashboard sorts by risk/time-to-deadline, not volume. Alerts should be batched by severity; avoid pushing routine work onto the owner.
