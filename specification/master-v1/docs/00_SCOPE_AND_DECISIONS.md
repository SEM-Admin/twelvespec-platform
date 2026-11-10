# Product scope, definition of done, irreversible decisions

## Product mission
TwelveSpec is the first deployment of an MCALCO-governed, modular commerce and business operating platform. It sells print, promotional goods, branded apparel, signs, displays, packaging, events, customized and sourced products; some work is outsourced, some potentially produced internally. Customer self-service should increase without forcing repetitive owner intervention.

## Three experiences, one set of records
1. SHOP: mobile-first search, truthful color swatches/variants, customizable catalog, quote-first checkout, account/reorder, company/school/event storefronts and BYOB kits.
2. CREATE: shared project for customer and staff artwork, print areas, versioned designs, proofs, prepress and manufacturing-ready exports only after method-specific validation.
3. OPERATE: Today, Sales, Catalog, Jobs, Business navigation; CRM, product rules, supplier connections, estimating, purchasing, production, fulfillment, finance and marketing.

## Architecture decisions
- Greenfield private monorepo. Do NOT migrate original TwelveSpec hosted Supabase or reuse populated production accounts. Read old source for ideas only.
- Two separate Next.js deployments and a worker. TypeScript packages for domain code; PostgreSQL + RLS, private object storage, queued outbox and managed secrets. No microservices until justified.
- Canonical product distinct from supplier offers and external source products. Product/customer ownership at tenant/workspace. Issued quotes/order items preserve exact immutable snapshots.
- No PSRESTful SDK, dependency, endpoint or vendor credentials.
- Integration Center supports direct PromoStandards SOAP services, direct REST providers, separately licensed ASI SmartLink, CSV and XML. Credentials stored server side in a secret manager; browser only receives masked metadata.
- Supported adapter + valid credentials + active permission = configurable from UI; totally unknown APIs might need a new code adapter.
- Supplier pricing target 40% gross margin, general floor 30% requiring override approval; first two orders prepaid, later Net 15 only when approved credit record permits. These are configurable policies, not hardcoded legal claims.
- No silent supplier purchase, real payment, customer email or public publish during initial demo.
- Product images may show manufacturer/consumer brands but not private source, decorator, cost or shipping-provider details.
- No fabricated workflow success: explicit MOCKED / SANDBOX_VERIFIED / LIVE_VERIFIED / BLOCKED status per operation.

## Explicit boundaries
In V1: working commerce, sales, catalog/configuration, creative 2D and proofing, MIS, supplier PO draft, fulfillment tracking, finance reference, CRM, marketing CMS, automation, stores/BYOB and secure integrations. Not in V1: general ledger, payroll, auto digitization, CAD, validated photorealistic 3D, externally saleable SaaS, autonomous vendor spend. Each has a disabled Coming Soon slot.

## Production definition of done
A runnable application alone is not enough: role and tenant isolation, confirmed external integration credentials, legal/finance signoff, security testing, backup/restore, production artwork validation, observed transaction reconciliation, and owner approval all must pass. Demo completeness is separately measured.
