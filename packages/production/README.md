# Sales and operations service contract

All commands run inside the kernel's verified actor/workspace transaction. Money is Decimal with explicit currency; customer responses use `publicQuote` and `publicOrder` allowlists. No external financial or supplier call occurs.

| Module | Command | Input | Durable result |
|---|---|---|---|
| commerce | create / update | title?, id? and configured lines | owned draft cart; server checks variants, MOQ and decoration rules |
| commerce | submit_request | id, key, note? | scoped RFQ, cart submitted |
| commerce | reorder | id (order), key | new cart requiring fresh pricing |
| sales | create | requestId or lines; title? | draft quote + quote lines |
| sales | cost_quote | id; freight?, targetMargin?, sellTotal? | component estimate, bounded source evidence and margin approval gate |
| sales | approve_margin | id, reason | named approver + exact pricing hash |
| sales | issue_quote | id, key | immutable quote revision, legal seller and credit terms snapshot |
| sales | accept_quote | id, key, termsAccepted=true | immutable order lines, customer ownership, commercial agreement hash |
| sales | revise_quote | id | new draft preserving issued history |
| orders | allocate_jobs | id, key | one job per order line with operation, cost, allocation and purchasing requirements |
| orders | start_job | id | payment/artwork/preflight gates then production event |
| orders | record_qc / close_job | id; passed, notes for QC | historized QC and completed job |
| procurement | prepare_po | orderId, jobId?, connectionId?, key | separate purchase drafts per job; duplicate active PO prevented |
| procurement | approve_po | id, reason | explicit purchase authorization |
| procurement | submit_po | id, key, simulateTimeout? | MOCKED acknowledgment or UNKNOWN_OUTCOME; never a live write |
| procurement | reconcile_outcome | id, outcome, reference | explicit mock lookup result; no blind retry |
| fulfillment | create_shipment | orderId, lines[{orderLineId,quantity}], tracking, key | shipment, line allocations, partial/full order projection |
| fulfillment | record_tracking | id, status, note? | mock tracking event |
| fulfillment | create_return / create_remake | orderId, reason | remediation request with financial adjustment pending review |
| finance | record_payment_reference | orderId, amount, externalId, key? | PENDING synthetic gateway reference |
| finance | reconcile_mock_payment | id, eventId, status? | deduplicated mock webhook receipt + reconciled settlement reference |
| finance | record_actual | orderId, component, amount, source?, key? | immutable direct cost evidence |
| finance | approve_credit | accountId, customerUserId, limit, reason | named approval; Net15 only after two settled orders and within available credit |
| finance | closeout | orderId, ownerHours | actual-vs-estimated margin and profit per owner hour; immutable profit snapshot |

## Tested and activation boundaries

Pure tests cover Decimal math/unknown costs/tiering/terms/public confidentiality, purchase state protections, partial fulfillment and signature integrity. `tests/modules/orders.test.ts` exercises the actual PostgreSQL mixed workflow after setup. The positive dispatch fixture uses undecorated blank products. Decorated dispatch remains blocked without an exact approved proof and PASSED production preflight; this is intentional and is tested as a negative path.

Native payments, accounting settlement, carrier labels and supplier purchase transmission are disabled. No local operator command can promote mock evidence to live verification. Production artwork validation, authorized vendor schemas/credentials, legal terms and live approval remain activation requirements.
