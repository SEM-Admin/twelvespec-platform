# Orders and job tickets — module contract

**Availability:** Active V1 scope (unless a feature explicitly marked Coming Soon). **Future placeholder:** enterprise MRP.

## Customer/operator outcome
Accepted order snapshots, jobs/jobs components, production routing, progress, issue remediation.

## Required screens/components
- **Order cockpit:** loading, empty, populated, error, permission-denied and stale-data states; role-relevant action affordances; keyboard accessible.
- **Job ticket:** loading, empty, populated, error, permission-denied and stale-data states; role-relevant action affordances; keyboard accessible.
- **Operation timeline:** loading, empty, populated, error, permission-denied and stale-data states; role-relevant action affordances; keyboard accessible.
- **QC checklist:** loading, empty, populated, error, permission-denied and stale-data states; role-relevant action affordances; keyboard accessible.

## Domain records and ownership
`order, order_line, job, job_component, operation, production_event`. Every business record owns `tenant_id`, `workspace_id` unless global reference; server enforces actor/resource permission and append-only audit. Use normalized typed foreign keys. Publishing/revisions/events are separate records, not a mutable status string alone.

## Authorized roles
Primary roles: `operations`; defaults deny-by-default, use fine-grained permission checks; not all primary roles can write every entity. Customer roles never read internal supplier offers/credentials.

## Commands
- `accept_order`: require verified actor+workspace, validated inputs and idempotency for external or irreversible effects; record transition and audit outcome.
- `allocate_jobs`: require verified actor+workspace, validated inputs and idempotency for external or irreversible effects; record transition and audit outcome.
- `record_qc`: require verified actor+workspace, validated inputs and idempotency for external or irreversible effects; record transition and audit outcome.
- `close_job`: require verified actor+workspace, validated inputs and idempotency for external or irreversible effects; record transition and audit outcome.

## Query and UX requirements
- Use paginated list views, saved filters, column visibility, meaningful empty states, accessible controls and explicit workflow statuses.
- Offer batch review with dry-run impact and approval where actions can affect published product prices, buyer commitments or supplier spend.
- Never imply network provider verified when only mock fixtures ran.
- Provide desktop and mobile read views; precision-heavy editing may request desktop layout but must remain operable.

## Acceptance gates
- A positive path creates durable scoped records and expected domain events with stable IDs.
- Invalid status transition, unauthorized actor, cross-workspace request and duplicate command fail without side effects.
- Observability includes correlated redacted event logs and operator-visible remediation.
- Any future function (`enterprise MRP`) displays Coming Soon and no working transaction buttons.
