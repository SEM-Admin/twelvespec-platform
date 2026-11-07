# Research, Software Selection and Integration Decisions
Research checked 2026-11-04. Vendor capabilities/prices are published claims, not a grant of API rights, license, or production access. Recheck terms at implementation.

## Competitive reference—not systems to clone
- **PrintPLANR** includes CRM, estimating, jobs, electronic tickets, supplier/purchasing, warehouse, online orders, accounting connections. Use its cross-module business lifecycle as MIS benchmark, not its entire feature surface. https://www.printplanr.com/print-mis-systems/
- **OnPrintShop v13.1** demonstrates AI-assisted design/template setup and unified product setup; v13.0 shows preflight and creative enhancements. Treat as future creative and W2P benchmark, not proof of available embeddable SDK. https://onprintshop.com/release-notes
- **Enfocus Switch** automates W2P→production routing, MIS handoff, PDF proofing, preflight. Consider optional production automation later; do not duplicate high-end prepress infrastructure in V1. https://www.enfocus.com/en/solutions/web-print-integration
- **callas pdfToolbox REST** supports async preflight and PDF/X conversion. Treat as future licensed production adapter; basic V1 file metadata checks do not constitute professional PDF preflight. https://help.callassoftware.com/m/pdftoolbox/l/2097759-the-pdftoolbox-rest-api-operation-preflight

## Preferred implementation stack
| Domain | Recommended | Reason / rule |
|---|---|---|
| Source and dev | Private GitHub monorepo, pnpm or npm workspaces, pinned lockfile | One shared contract without cross-repo version drift; storefront and OS separately deployable apps in same repo. `twelvespec-web` remains separate reference. |
| Customer/admin | Next.js App Router, React, TypeScript, Tailwind, accessible component primitives | Existing familiarity; audit dependency security before any copied code. |
| Storage & DB | Fresh isolated Supabase Postgres/Auth/Storage | Tenant-scoped relational data, file versions and RLS. No connections to populated original OS. |
| Contracts | TypeScript + Zod schemas + OpenAPI 3.1, generated client | Typed boundaries and deterministic API validation. Pin patched versions; old repo had failed security audit. |
| Jobs/events | Durable Postgres outbox + worker/managed queue adapter | Atomic business events, retry/dead-letter and no duplicate transactions. |
| Search | Postgres full text/trigram initially; provider-search adapter later | Avoid extra infrastructure; benchmark 100k+ variants and switch when justified. |
| 2D editor | Fabric.js evaluated first; supports serialize/deserialize and SVG/JSON/image export | Product model must be renderer-agnostic; editor JSON alone isn't a canonical design object. https://www.fabricjs.com/docs/core-concepts/ |
| 3D | Three.js with glTF/GLB behind Coming Soon | Don't claim photorealistic production accuracy from generic model view. https://threejs.org/manual/pages/loading-3d-models.html |
| Payments | Stripe Checkout or existing QuickBooks payment links behind adapter; actual processor chosen later | Webhook signature + idempotent payment state; no card numbers stored. |
| Accounting | QuickBooks Online connector sandbox; external GL authoritative | QBO invoice/estimate references; no homegrown GL. https://developer.intuit.com/app/developer/qbo/docs/api/accounting/all-entities/invoice |
| Deployment | Vercel Preview with isolated env/protection, GitHub Actions | Do not attach live TwelveSpec domain. https://vercel.com/docs/deployments/environments |
| Browser tests | Playwright with isolated accounts | Tests real user-visible behavior. https://playwright.dev/docs/best-practices |
| API security | Supabase RLS + server authorization + append-only audit | Enforce tenant/workspace FKs and grants. https://supabase.com/docs/guides/database/postgres/row-level-security |

## Supplier data and operational integrations

**Non-negotiable owner requirement:** no PSRESTful account, API, middleware, package, backend call, or runtime dependency. Connect directly to each participating supplier’s documented PromoStandards endpoint, or its separately authorized direct supplier API. PromoStandards is a protocol, not one central product catalog API. The platform must maintain a registry of supplier-specific endpoints, supported protocol versions, capabilities, credentials, license limitations, and operational health.

**Yii clarification:** Official PromoStandards example code uses Yii 1.1 as a PHP demo of SOAP services: https://github.com/promostandards/productDemoPhp. It is a reference demonstrating how to consume Product/Pricing/Media/Inventory/PO services, not a supplier-feed service or modern architecture requirement. Do not migrate the existing Next.js/TypeScript platform to Yii purely to use it. Yii 1.1 is legacy; reuse the protocol concepts, not old framework code.

| Candidate | Verified provider offering | Implementation position | Dependency |
|---|---|---|---|
| PromoStandards | Product, media, pricing/configuration, inventory, PO, status/shipment and invoice protocols | Canonical protocol adapter; supplier-by-service support varies | Supplier credentials and per-service permission. https://promostandards.org/how-promostandards-makes-your-business-better/ |
| SAGE Connect | Search/product data, webhooks; published 5k queries/month per SAGE Workplace license | Optional broad discovery/catalog adapter | Entitlement and storage/display rights. https://www.sageworld.com/connect/ |
| ASI Smart Link API | Supplier/product data for custom e-commerce and internal apps | Alternative broad feed; no assumption ESP+ Website license includes API | Signed API agreement, cache/public rights. https://developers.asicentral.com/ |
| Supplier direct | SanMar, S&S, PCNA; print/POD/decorators | Exact account price, inventory, configuration, PO and tracking where supported | Supplier credentials, sandbox, terms. |
| CSV | Staged manual or secure file feeds | Universal fallback with map, preview, validation and rollback | Supplier rights and current source file. |

## Selection rules
1. Keep **one** normalized internal product/offer contract and a `provider_capabilities` matrix.
2. Choose no more than one initial broad-feed paid service absent a documented gap.
3. API access isn't necessarily a license for indefinite storage/public rehosting; honor rights and retention.
4. Price and stock evidence has timestamp, supplier account, currency, quantity, part, location, decoration and lead time. If unsupported/stale, quote manually.
5. Connectors have independent `read`, `sync`, `draft`, `send`, `transact` capabilities; transactions default OFF.
6. Secrets stay server-side/vault; never public payload, browser, log, AI prompt or CSV export.

## Decisions vs blockers
**Safe defaults:** one MCALCO internal tenant + TwelveSpec workspace, quote-first, synthetic fixtures, separate customer/operator apps, mocked adapters, visible Coming Soon, US locale and USD default with multicurrency-ready schema.
**Ask owner only when required:** supplier/API subscriptions and credentials; payment processor or tax/legal policy for live checkout; final legal seller information; licensing for imagery; real emails/charges/supplier writes; public domain cutover and launch approval.

## Direct PromoStandards adapter specification (mandatory)
- `SupplierEndpoint` key `(supplier_id, service, service_version, environment)` with explicitly configured WSDL URL, operation binding, expected auth mechanism, timeout, allowed methods, health state, and last-verified timestamp. Never dynamically fetch untrusted WSDL URLs from customer input; maintain an operator-approved host allowlist to prevent SSRF.
- `supplier_credential_ref` in secret storage; verify whether service expects `id`/`password` in SOAP envelope, account number, or a newer supplier-specific OAuth flow. **Do not assume one universal auth model.**
- SOAP/WSDL/XSD protocol adapter supports Product Data, Pricing & Configuration, Media Content, Inventory, Order Status, Order Shipment Notification, and PO, plus other supported services; per-supplier service/version capability matrix.
- DTO normalization preserves supplier_product_id, part_id, configuration identifiers, color, size, currency, account context, decoration, lead time, price tiers, inventory quantities, original raw payload/checksum and provenance. Do not generate SKU identities from descriptions.
- All provider responses validate against version-specific schemas/contract fixtures; capture transport/semantic faults without publishing invalid data. Handle backoff, concurrency limits, retry with jitter, circuit breakers, pagination / changed-since where supported and audit evidence.
- Use data-refresh `STAGE -> VALIDATE -> MATCH -> REVIEW -> APPROVE -> PUBLISH`, never auto-publish when account pricing, attribution rights or images unverified. Supplier cost/private fields never leak into public API.
- Read services first. PO submission and other external writes remain off until explicit owner and supplier activation. A no-code supplier configuration screen is required.
- Unit tests use static anonymized SOAP fixture responses, plus service-level integration tests against explicitly authorized sandbox endpoints.
- Official public references: https://promostandards.org/how-promostandards-makes-your-business-better/ ; https://github.com/promostandards/productDemoPhp ; direct examples https://promostandards.ssactivewear.com/ and https://api.stregisgrp.com/documentation/promostandards/ .
