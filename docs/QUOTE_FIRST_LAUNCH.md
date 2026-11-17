# Quote-first website and domain transition

November 17, 2026. Scope: a customer can request a human-reviewed quote while the rest of V1 remains under development. This is not approval for paid checkout or the full manufacturing platform.

## Verified starting point

- Main `37d0360` contains the authenticated project inquiry, product quote cart, private operator costing, issued quotes and customer review. The latest source has not been deployed to the Cloudflare previews.
- The connected Cloudflare account has the storefront, Commerce OS and shared preview runtime Workers. It has **no zones or Worker custom domains**. The owner identified `twelvespec.com` as the domain to move.
- Read-only public DNS inspection on November 17 found Porkbun nameservers (`curitiba`, `fortaleza`, `maceio`, `salvador.ns.porkbun.com`), apex A `209.46.30.10`, `www` CNAME `custom.espwebsites.com`, and MX `1 smtp.google.com`. This identifies routing at the time checked, not registrar access or a complete DNS export. No records were changed and the existing website was not accessed. Mail and verification records must be exported from the authoritative DNS before a move.
- The preview runtime has a secret named `DATABASE_URL`, but the read-only Cloudflare configuration check on November 17 confirms **`PREVIEW_DATABASE_ENABLED=false`**. It is still using temporary synthetic state. The existence of the binding does **not** verify its value, TLS connectivity, current migrations, persistence or backup recovery. Supabase project `mtihnarlkprmyahbxlrl` was healthy on November 16, but its custom migration registry contained only 001–004.
- Existing customer accounts can submit an inquiry. Public signup is disabled outside synthetic seeding. Requiring an existing account alone is not sufficient for public quote acquisition.

## Requirements → code → verification

| Requirement | Implementation | Meaningful checks |
| --- | --- | --- |
| Ask for a quote without a product or account | Existing `/inquiry` plus `guest-inquiry.tsx`; `api/inquiry` fixed-purpose endpoint | Anonymous mobile/browser submission, receipt, reload and private owner readback |
| Reuse the business system | `crm/public-inquiries.ts` writes existing `follow_ups` and a Today `work_items` task; protected CRM inbox | No fabricated customer identity, SKU, quote, payment or supplier order; no competing database; task closes/reopens with the review |
| Preserve contact consent and identity | Requested-project permission, unverified submitted address, no automatic contact/account merge | No marketing grant; an unverified guest cannot alter an existing contact or acquire an account |
| Prevent unsafe public activation | Explicit server workspace/assignee configuration; Turnstile verification; same-origin, strict bounded JSON and serialized caps | Missing configuration, rejected/replayed challenge, forged scope, input abuse, concurrent rate limits and private data isolation |
| Avoid losing requests or duplicating retries | Transactional receipt and follow-up using existing idempotency/outbox infrastructure | Concurrent identical retry returns one minimal receipt; changed content conflicts; failure rolls back |
| Make requests actionable | Protected, paged CRM inbox with review status and notes | Role/workspace authorization, revision conflicts, records beyond generic list limits |
| Preserve working journeys and truthful claims | Existing signed-in inquiry/cart/quotes unchanged; CMS inquiry CTA points to `/inquiry` | Existing inquiry and CMS browser regressions; no unreviewed production commitments |
| Move the domain safely | Record-level plan and rollback after exact domain is known | Preserve email and verification records; actual HTTPS, redirects and end-to-end request tests before cutover |

## Activation gates

- [ ] Confirm the exact domain, registrar, authoritative DNS and intended hosting destination. A registrar transfer and a website routing change are different operations.
- [ ] Inventory/export current A/AAAA/CNAME, MX, TXT, DKIM, DMARC, CAA, DNSSEC and relevant redirects. Preserve the current website and email until cutover is authorized.
- [ ] Select the durable environment permitted to hold actual customer contact data. Development previews and synthetic demo accounts are not a public intake destination.
- [ ] Review/apply required additive database migrations to that environment; verify TLS and the restricted runtime login, restart persistence, backup and restore.
- [ ] Configure the fixed intake workspace and responsible staff member; set conservative request caps. Verify the staff member can open and work the inbox.
- [ ] Configure a real Turnstile widget for the actual frontend hostname, store its secret server-side, and test a real successful token and replay rejection. Local synthetic challenge checks do not certify this integration.
- [ ] Approve seller identity, contact and privacy/retention wording, factual services/product copy, licensed images and the process for replying to requests. No automatic email is promised or sent by this slice.
- [ ] Deploy to a separate reviewed HTTPS candidate, submit a permitted test inquiry, reload/restart, and read it back in the protected CRM. Check mobile/keyboard usability, error states, customer receipt and monitoring.
- [ ] Review the exact DNS diff, TLS issuance, email preservation, redirects and rollback; obtain deployment/domain cutover authorization before applying it.
- [ ] After cutover, repeat the real request → persisted receipt → private operator readback test and verify email delivery remains intact.

Paid checkout, real supplier ordering, instant prices and guaranteed delivery retain the gates in [Selling readiness](SELLING_READINESS.md). CAD, machine-ready output and unimplemented future modules retain their existing Coming Soon boundaries.

No domain, production service, remote database, paid supplier query or deployment is changed by this preparation.

## Runtime configuration for this slice

Default `PUBLIC_INQUIRY_MODE` is disabled. There is no demo-tenant or random-owner fallback.

- Explicitly set `PUBLIC_INQUIRY_TENANT_ID`, `PUBLIC_INQUIRY_WORKSPACE_ID` and `PUBLIC_INQUIRY_ASSIGNEE_ID` to a current owner, manager or sales membership. Browser fields and headers cannot choose these values.
- `synthetic-local` requires a loopback application origin, a loopback PostgreSQL hostname, and `TWELVESPEC_ENV=test` or `development`. The browser clearly labels synthetic testing. The disposable browser harness supplies this fixture without changing saved environment files.
- `live` requires HTTPS, a remote PostgreSQL hostname, `TWELVESPEC_ENV=production`, `PUBLIC_INQUIRY_LIVE_APPROVED=1`, disabled seed signup, and server `TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET`; preview runtimes are rejected. These switches are activation guards, **not evidence that release or legal checks passed**. The existing database factory still blocks non-preview production connections: reviewed production database provisioning/configuration is an outstanding launch dependency, deliberately not bypassed here. The secret is never returned to a browser.
- Optional integer caps: `PUBLIC_INQUIRY_HOURLY_LIMIT` (default 50), `PUBLIC_INQUIRY_DAILY_LIMIT` (200), `PUBLIC_INQUIRY_EMAIL_HOURLY_LIMIT` (3), `PUBLIC_INQUIRY_EMAIL_DAILY_LIMIT` (10). Windows are rolling one hour/24 hours. These are independent of supplier API spending caps.
- `/api/inquiry` exposes only enabled/synthetic mode and the public widget settings. POST returns a minimal opaque receipt after the database commit. There is no anonymous lookup endpoint, file upload or email sender.
- Commerce OS → Customers & CRM → Website quote requests is a private paged inbox. Submitted email is unverified. Staff records review/contact performed through their approved business process. This slice does not automatically enroll a guest, merge CRM contacts or issue a quote to an unverified identity. The existing authenticated, reviewed quote workflow remains the route for formal customer acceptance.
- Cloudflare preview gateways currently accept `workers.dev` origins and require Access. Do not attach the real domain to these development gateways or remove their protection as a shortcut. A public launch needs a separately reviewed deployment with correct host routing, durable customer data and protected staff access.
