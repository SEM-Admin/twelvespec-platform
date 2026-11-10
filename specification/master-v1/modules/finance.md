# Finance and profitability — module contract

**Availability:** Active V1 scope (unless a feature explicitly marked Coming Soon). **Future placeholder:** full GL and payroll.

## Customer/operator outcome
Estimated versus actual direct costs, external QuickBooks/payment references, invoice reconciliation, margin by order.

## Required screens/components
- **Cost ledger refs:** loading, empty, populated, error, permission-denied and stale-data states; role-relevant action affordances; keyboard accessible.
- **Expected vs actual:** loading, empty, populated, error, permission-denied and stale-data states; role-relevant action affordances; keyboard accessible.
- **Invoices/payments refs:** loading, empty, populated, error, permission-denied and stale-data states; role-relevant action affordances; keyboard accessible.
- **Profit dashboard:** loading, empty, populated, error, permission-denied and stale-data states; role-relevant action affordances; keyboard accessible.

## Domain records and ownership
`cost_snapshot, actual_cost, invoice_reference, payment_reference, reconciliation, profit_snapshot`. Every business record owns `tenant_id`, `workspace_id` unless global reference; server enforces actor/resource permission and append-only audit. Use normalized typed foreign keys. Publishing/revisions/events are separate records, not a mutable status string alone.

## Authorized roles
Primary roles: `finance,owner`; defaults deny-by-default, use fine-grained permission checks; not all primary roles can write every entity. Customer roles never read internal supplier offers/credentials.

## Commands
- `create`: require verified actor+workspace, validated inputs and idempotency for external or irreversible effects; record transition and audit outcome.
- `update`: require verified actor+workspace, validated inputs and idempotency for external or irreversible effects; record transition and audit outcome.
- `review`: require verified actor+workspace, validated inputs and idempotency for external or irreversible effects; record transition and audit outcome.
- `approve`: require verified actor+workspace, validated inputs and idempotency for external or irreversible effects; record transition and audit outcome.
- `archive`: require verified actor+workspace, validated inputs and idempotency for external or irreversible effects; record transition and audit outcome.

## Query and UX requirements
- Use paginated list views, saved filters, column visibility, meaningful empty states, accessible controls and explicit workflow statuses.
- Offer batch review with dry-run impact and approval where actions can affect published product prices, buyer commitments or supplier spend.
- Never imply network provider verified when only mock fixtures ran.
- Provide desktop and mobile read views; precision-heavy editing may request desktop layout but must remain operable.

## Acceptance gates
- A positive path creates durable scoped records and expected domain events with stable IDs.
- Invalid status transition, unauthorized actor, cross-workspace request and duplicate command fail without side effects.
- Observability includes correlated redacted event logs and operator-visible remediation.
- Any future function (`full GL and payroll`) displays Coming Soon and no working transaction buttons.
