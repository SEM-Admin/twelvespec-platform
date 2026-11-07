# Visible implementation checklist

- [x] Locate greenfield repository and supplied handoff.
- [x] Inventory all 85 supplied files and all 20 registered modules.
- [x] Create requirements-to-code-to-test matrix before implementation.
- [ ] Gate A: scoped identity, database, RLS, secrets interface, audit, outbox, CI.
- [x] First browser preview: both apps, 40 products, 10 contacts, imports.
- [x] Isolated Cloudflare Workers previews and owner-only Access applications.
- [x] Real HTTPS browser verification: customer sign-in, exact variant, saved cart/RFQ, owner sign-in and saved CRM contact.
- [x] Empty Supabase development project provisioned: 96 application tables, RLS, no anonymous table grants, restricted application login, zero security-advisor findings.
- [x] 138 automated unit, security and PostgreSQL integration tests; type checking and production builds.
- [x] Publish the final contrast correction and verify both restored HTTPS interfaces in a real browser.
- [ ] Activate the configured Supabase Session pooler after receiving its trusted CA certificate; verify persistent state. Current previews use temporary synthetic PostgreSQL.
- [ ] Replace temporary artwork and credential storage before claiming durable storage or accepting live credentials.
- [ ] Gate B: catalog/configuration/creative/commerce.
- [ ] Gate C: CRM, estimates/quotes, orders, jobs, POs, fulfillment.
- [ ] Gate D: finance, stores, BYOB, marketing, automation, analytics.
- [ ] Gate E: file imports, native SOAP fixture contracts, licensed ASI interface.
- [ ] Gate F: integrated A01–A40 plus inherited T01–T30 evidence.
- [ ] Production activation (credentials, licensing, security, legal/finance and deployment approval).
