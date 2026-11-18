# Protected development preview verification — November 18, 2026

The existing storefront and Commerce OS now use the owner's isolated Supabase development project `mtihnarlkprmyahbxlrl`. This is a synthetic development environment. DNS, the ASI/ESP+ production site, production customers, payments and supplier orders were not changed.

- Storefront: https://twelvespec-preview-shop.samantha-4ec.workers.dev/
- Commerce OS: https://twelvespec-preview-os.samantha-4ec.workers.dev/
- Integration Center: https://twelvespec-preview-os.samantha-4ec.workers.dev/supplier
- [Structured evidence](evidence/hosted-preview-2026-11-18.json)

## Deployed and verified

Application source `be9f41764f64c43b97379cf52555fd1c39b02943` is the merged PR #9 tree. [Approved-image CI](https://github.com/SEM-Admin/twelvespec-platform/actions/runs/44237576247) passes 364 backend tests across 49 files, 27 browser tests, both Next.js builds and the isolated production-container acceptance. The published image's configuration digest matches the image actually tested by CI. Documentation updates do not imply a different application binary was deployed.

The registry image is pinned to `sha256:7faa7ccf5978fe1422d7489680e42f0eef015a27a37c0786811b0ec3f2b254fc`. Cloudflare runtime version `71f0a3b3-4b37-458f-9a07-77e3b6e7b744` selects the development database and permits guarded account-read configuration. Every actual account retains its own paused-by-default policy, credential and entitlement requirements. Monetary ceilings default to USD 0. The only configured native connection used here is explicitly `mock` and is paused after verification.

The database contains all 15 existing application migrations, 114 `app` tables, 9 public-schema tables, four synthetic users, 40 published synthetic products and 120 variants. The application uses the existing restricted server role and certificate-verified session-pooler connection. Native supplier storage has forced RLS and no anonymous/client-role grants. Supabase's security advisor returns no findings.

| Requirement | Existing implementation | Actual hosted evidence |
| --- | --- | --- |
| One reviewed quote workflow | Storefront cart, Commerce OS Sales, private cost worksheet and issued quote snapshot | Real Chromium customer/operator sign-in; product selection → saved request → reviewed USD 200 quote; customer response excludes private costs |
| Bounded supplier usage | Native reservation ledger, shared billing group, cache, cap and pause | Four simulated reads, three synthetic credit units, 40 cache hits; next uncached request blocked; no paid reservations |
| Customer browsing does not call a supplier | Owned published catalog and local cart | Browsing catalog/search/product/cart preserves four reserved reads and the cache-hit total |
| Private selected source review | Native `api_stage_result` | One selected mock full-detail source staged privately; zero products automatically published |
| Durable quote and meter state | Existing PostgreSQL tables and stable server secrets | Owner session, issued quote, product IDs, connection, credential metadata, reservations and cache survive configuration-triggered container restart; one further cache hit adds no reservation |
| Scoped vault recovery | Existing `resolveNativeCredentials` | Actual hosted synthetic ciphertext recovered with the existing stable key; wrong scope and wrong key rejected; no key returned in an HTTP response |
| Customer isolation | Existing role/RLS checks and customer response projection | Customer denied supplier dashboard with HTTP 403; issued customer quote excludes internal cost fields |
| Preview protection | Existing Access owner policy and gateway JWT verification | Temporary one-hour service token/reusable policy attached only to both previews, then removed; revoked credential returns 401 and anonymous visitors redirect to owner Access login |

The cache timing sample includes workspace proxy and HTTPS round trips. It establishes neither real supplier latency nor hosted capacity. Synthetic query weights and credits do not establish SAGE's tariffs or allowance.

## Operational repair and rollback

Registry publication alone did not make the image runnable: Cloudflare initially returned “Image not found.” The documented `POST /accounts/{account_id}/containers/image-preparations` operation prepared the exact pinned image; status reached `ready` before successful startup. Future rollouts must check this status before declaring an image ready. The original provisioning plan remains historical; this dated evidence records the deployed state.

Worker configuration updates must preserve the existing Durable Object `exports`, image map, namespace and inherited secret bindings. A partial settings patch omitting the declared class is rejected by Cloudflare. The verified updates retained those resources and all stable authentication/encryption material.

Runtime version `03a9460e-1af7-4e0c-bf04-68337f1bb6d2` provides the same application image and persistent database with account reads off. Restoring that version leaves database records intact. Do not drop/reseed the development database or rotate vault material as part of a code rollback. Managed backup restoration and original upload/artwork storage recovery are separate, unverified release gates.

## Remaining activation requirements

- **Real SAGE:** a current System/Public key entered securely in Integration Center; current entitlement, query weights, remaining credits, fees and provider-side paid-query stopping behavior. No real SAGE connection or product response was verified. Start with one documented-free research-list read, reuse its cache, then fetch only selected search/detail evidence after financial settings are confirmed.
- **Real curated products:** confirm exact variants, decoration/production specifications, licensed copy/images/templates, current availability, net costs, setup, freight and delivery. The 40 current products and all test prices are synthetic. No supplier media license or manufacturing output is established by a successful API response.
- **Guest quote intake:** the hosted guest journey could not run because `PUBLIC_INQUIRY_MODE` is disabled. Its existing local synthetic/live activation guards were preserved; a follow-up browser check verified the disabled state. Authenticated cart requests and Commerce OS quote review passed separately. Public intake requires production identity/privacy settings, real spam protection, operator notification/review coverage and release authorization.
- **Production:** DNS cutover, live payment/order/provider activation, persistent original files, managed recovery, remaining original V1/CMS/CIA acceptance and public-release approval remain open. Successful protected-preview tests do not close those gates.
