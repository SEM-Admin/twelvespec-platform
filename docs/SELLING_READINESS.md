# Selling readiness of the new TwelveSpec build

Current review: [November 9 launch readiness and ordered release gates](LAUNCH_READINESS_2026-11-09.md). The public database root is now available and client trust is prepared; runtime connectivity and hosted persistence are still unverified.

**Decision: NO-GO for paid production orders.** The isolated preview supports synthetic testing and the reviewed quote-request workflow. This assessment applies to the new build; the existing production website, application, customer database and domains have not been audited or changed.

The owned-catalog → customer brief → private operator cost worksheet → issued customer quote workflow passed a real HTTPS browser test on November 7, 2026. That is evidence for this bounded workflow, not acceptance of the full platform or a production sales launch.

| Launch gate | Current evidence | Remaining requirement |
| --- | --- | --- |
| Durable business data and files | Isolated PostgreSQL migrations and RLS tests; temporary preview database and media. | Connect the approved development database with verified TLS; durable object storage; restart/restore/backup tests. Current hosted data resets after 30 minutes of inactivity. |
| Sellable catalog | Private supplier evidence, curated product/variant editing, approved-image derivative/publication checks. | Review each actual SKU, licensed copy/images, exact options, MOQ, decoration/print requirements and commercial availability. Imported candidates are not automatically sellable products. |
| Accurate commercial commitments | Reviewed full-line costs, gross-margin checks, quote expiry, explicit scope/freight and tax exclusion. | Current authorized supplier quotes/costs, actual stock, delivery feasibility, seller policies and production tax calculation. An issued synthetic quote does not prove a supplier can fulfill it. |
| Secure production identity and credentials | Scoped roles, server authorization, encrypted development vault, protected preview URLs. | Production authentication/recovery and security review; durable managed secrets, rotation and operational access controls. The local development vault is not a production credential service. |
| Payment and tax | Synthetic/reference workflows; no real charges or settlement. | Approved processor onboarding, real checkout/tax rules, signed/idempotent payment events, failures/refunds/reconciliation and finance approval. |
| Production and delivery | Existing synthetic Print MIS/purchasing/fulfillment flows. | Exact artwork/configuration binding, production-ready proofs/output, authorized supplier ordering, actual shipping/status exception and remake/return tests. |
| Customer/legal operations | Demo request/quote accounts; unissued prices and internal costs hidden. | Confirm seller identity, shipping/refund/cancellation/privacy policies, retention, notifications and customer support responsibility. |
| Full release acceptance and operations | Current module tests and browser flows; 85 original specification files, 20 module inventory and 95-scenario matrix retained. | Close remaining GAP work packages and active V1 acceptance; monitoring, restore/recovery, rollback and approved deployment. Passing the implemented tests is not a substitute for the unimplemented acceptance scenarios. |
| Shopify | Read-only adapter fixtures/schema validation and a synthetic private-import workflow. | Registered app, authorized development store, OAuth/refresh/vault/webhooks, real contract tests and distribution approval before future customer installations. No live Shopify sales capability is activated. |

The next commercial milestone is a small curated, human-reviewed quote-request pilot after persistent development state and actual product facts are verified. Public paid checkout stays gated until the applicable launch requirements pass and deployment is authorized. Existing production systems remain separate.

See [the implementation checklist](IMPLEMENTATION_CHECKLIST.md), [gap closure plan](GAP_CLOSURE_PLAN.md), [owned catalog workflow](OWNED_CATALOG_AND_RFQ.md) and [Shopify connector](SHOPIFY_CONNECTOR.md) for the detailed implementation and activation boundaries.
