# Purchasing and supplier POs — module contract

**Availability:** Active V1 scope (unless a feature explicitly marked Coming Soon). **Future placeholder:** autonomous procurement.

## Customer/operator outcome
Supplier selection, sourcing evidence, PO draft approval, idempotent submit, acknowledgment reconciliation.

## Required screens/components
- **Source comparison:** loading, empty, populated, error, permission-denied and stale-data states; role-relevant action affordances; keyboard accessible.
- **PO drafts:** loading, empty, populated, error, permission-denied and stale-data states; role-relevant action affordances; keyboard accessible.
- **Approvals:** loading, empty, populated, error, permission-denied and stale-data states; role-relevant action affordances; keyboard accessible.
- **PO status:** loading, empty, populated, error, permission-denied and stale-data states; role-relevant action affordances; keyboard accessible.

## Domain records and ownership
`purchase_requirement, sourcing_decision, purchase_order, purchase_order_line, provider_transaction`. Every business record owns `tenant_id`, `workspace_id` unless global reference; server enforces actor/resource permission and append-only audit. Use normalized typed foreign keys. Publishing/revisions/events are separate records, not a mutable status string alone.

## Authorized roles
Primary roles: `buyer,manager`; defaults deny-by-default, use fine-grained permission checks; not all primary roles can write every entity. Customer roles never read internal supplier offers/credentials.

## Commands
- `prepare_po`: require verified actor+workspace, validated inputs and idempotency for external or irreversible effects; record transition and audit outcome.
- `approve_po`: require verified actor+workspace, validated inputs and idempotency for external or irreversible effects; record transition and audit outcome.
- `submit_po`: require verified actor+workspace, validated inputs and idempotency for external or irreversible effects; record transition and audit outcome.
- `reconcile_outcome`: require verified actor+workspace, validated inputs and idempotency for external or irreversible effects; record transition and audit outcome.

## Query and UX requirements
- Use paginated list views, saved filters, column visibility, meaningful empty states, accessible controls and explicit workflow statuses.
- Offer batch review with dry-run impact and approval where actions can affect published product prices, buyer commitments or supplier spend.
- Never imply network provider verified when only mock fixtures ran.
- Provide desktop and mobile read views; precision-heavy editing may request desktop layout but must remain operable.

## Acceptance gates
- A positive path creates durable scoped records and expected domain events with stable IDs.
- Invalid status transition, unauthorized actor, cross-workspace request and duplicate command fail without side effects.
- Observability includes correlated redacted event logs and operator-visible remediation.
- Any future function (`autonomous procurement`) displays Coming Soon and no working transaction buttons.
