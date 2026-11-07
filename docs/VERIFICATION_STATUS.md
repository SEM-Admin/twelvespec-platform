# Current verification status

Working development previews are available at:

- https://twelvespec-preview-shop.samantha-4ec.workers.dev
- https://twelvespec-preview-os.samantha-4ec.workers.dev

Both use Cloudflare Access with the approved owner's email, plus application sessions for customer and administrative actions. Temporary automated-test Access policies and service tokens have been removed. The runtime Worker and version preview URLs have no public route. No production TwelveSpec service, domain, supplier, payment processor or customer dataset was used.

| Category | Observed result |
| --- | --- |
| Implemented preview functionality | Separate Next.js storefront and Commerce OS, 40 synthetic products with 120 color variants, CRM, customer configuration, saved carts/RFQs and artwork/proof workflows. All 20 module contracts are inventoried; active V1 acceptance remains open. |
| Simulated functionality | Supplier services, purchasing transmission, payment events, outbound messages, fulfillment and licensed-provider interfaces use synthetic fixtures or explicit activation blocks. PSRESTful is prohibited. Future modules remain Coming Soon. |
| Verified integrations | Deployed Cloudflare Workers and Containers; owner-only Access; real HTTPS browser customer sign-in, variant selection, persisted cart and RFQ; administrative sign-in and persisted CRM contact. Local PostgreSQL migrations, RLS/isolation and a synthetic restore drill passed. |
| Automated checks | 139 unit/security/PostgreSQL integration tests passed across 27 test files. All nine browser journeys passed together, including CSV staging/commit/rollback, credential masking, workspace switching and storefront/detail WCAG checks. Type checking and both optimized Next.js builds passed. The original 85 handoff files remain intact. GitHub CI execution has not been claimed. |
| Outstanding failures | Supabase database TLS reports SELF_SIGNED_CERT_IN_CHAIN. Its approved development schema has 96 application tables, zero unprotected tables or anonymous table grants, and zero security-advisor findings, but runtime connectivity and persistence are not verified. |
| Current storage | The previews use isolated temporary PostgreSQL while the Supabase connection is disabled. Preview state resets after thirty minutes of inactivity or container replacement. Private artwork and credential-file durability are also pending. |
| Remaining activation requirements | Project database CA certificate, verified persistent PostgreSQL and private object/vault storage, authorized supplier credentials and ASI entitlement, remaining A01–A40/T01–T30 gates and production deployment approval. |

The browser harness now starts/migrates/seeds the local database before serving either application, and checks database health before running. Administrative browser journeys reuse an authenticated test session; sign-in throttling remains enabled.

Known business acceptance work includes binding company-store policies to customer cart submission before claiming store budget enforcement. Broader inherited acceptance, scale and actual supplier sandbox verification remain open in the traceability and implementation checklist. Passing the automated suite does not establish full V1 or production readiness.

The database CA certificate can be downloaded from the approved Supabase project's Database settings. Certificate verification remains enabled; no insecure TLS bypass has been introduced.

Cap regression (2026-11-07): the three Classic Camp Cap SVGs now use a cap silhouette in Midnight, Clay and Natural. The image-only Workers deployment kept the running application container unchanged. The affected local customer browser journey passed. HTTPS verification at 02:06:26 UTC used the separate synthetic owner account in the storefront and Commerce OS, and verified all three color images, an interactive cap design and saved visual proof, cart/RFQ persistence and a CRM contact. The temporary verification policy and service token were removed afterward. The full 139-test PostgreSQL/security suite and type checking passed. Other synthetic product families still use generic category illustrations.

Open creative acceptance: changing color after an existing project has been saved needs variant rebinding and exact proof-version lookup regression coverage. Do not infer production artwork readiness from the new-project cap regression. Product URLs can also change after the temporary database is reseeded; use the catalog to open current products until persistent PostgreSQL is activated.
