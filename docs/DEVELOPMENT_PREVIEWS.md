# TwelveSpec development previews

The previews use the existing Next.js storefront and Commerce OS, served by separate Cloudflare Workers and one isolated Linux container. The runtime Worker and version preview URLs have no public route. Cloudflare Access protects both frontends; application sessions also protect administrative operations.

- Storefront: https://twelvespec-preview-shop.samantha-4ec.workers.dev
- Commerce OS: https://twelvespec-preview-os.samantha-4ec.workers.dev

Access allows the connected owner's email through a one-time PIN. Application demo accounts are `customer@demo.twelvespec.test` and `owner@demo.twelvespec.test`. The deployment generates their password separately; it is excluded from source and is never embedded in the remote login form.

The temporary database contains 40 synthetic products, 120 exact color variants and 10 CRM contacts. Provider operations remain simulated, and live supplier connections, payments and outbound messages are blocked. PSRESTful is prohibited. Future modules remain Coming Soon.

The approved Supabase development project is `mtihnarlkprmyahbxlrl`. Its V1 schema and restricted application role are installed. Database connections require verified TLS and must match this project and the restricted login. Hosted application migrations run through the authorized connector, separately from the runtime login. The confirmed Session pooler is aws-0-us-east-1.pooler.supabase.com:5432/postgres. The database connection is disabled pending its trusted CA certificate; the observed failure is SELF_SIGNED_CERT_IN_CHAIN. TLS verification remains enabled.

Until that switch is verified, the preview container's PostgreSQL and private files are temporary. Cloudflare stops the container after thirty minutes of inactivity; it reseeds the demo on restart. Even after PostgreSQL is connected, uploaded artwork needs persistent object storage before its durability can be claimed.

`scripts/cloudflare-verify.mjs` checks Access protection and real browser flows over HTTPS. Its private verification control is under ignored `.local/cloudflare`; deployment, registry and test credentials must never be committed. Temporary Access service tokens are removed after verification. The browser trusts the managed workspace CA while retaining TLS verification.

See [the implementation checklist](IMPLEMENTATION_CHECKLIST.md) and [traceability](TRACEABILITY.md) for active V1 completion status. Working development previews do not establish production readiness or live provider verification.

The three Classic Camp Cap SVG color images are also deployed as Workers Static Assets on each frontend. Asset routing runs the Worker first and checks the same Access JWT before reading the `ASSETS` binding. Missing images fall back to the existing Next.js runtime. This update preserves the running container and temporary database. Subsequent gateway uploads must retain the asset manifest (`keep_assets: true`) or upload a replacement manifest, retain the `ASSETS` binding, and keep `run_worker_first: true`. The matching source images and seed generator are committed with the application.

Worker uploads can re-enable version preview URLs. After every frontend upload, explicitly restore `enabled: true, previews_enabled: false` through its subdomain endpoint and read it back. Keep both flags false on the runtime Worker. The gateway also rejects any origin other than its exact protected frontend hostname.
