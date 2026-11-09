# Proposed isolated preview update — awaiting deployment authorization

Targets: existing `twelvespec-preview-runtime`, protected Storefront and Commerce OS preview Workers under the existing account. No production Worker, domain, DNS, customer database or supplier account setting is a target.

The application change adds metered supplier configuration and read-only profiles, migration010 and all earlier content-backend migrations. Local PostgreSQL and browser checks pass; an image will be built and checked locally before the proposed rollout. Current deployed image/digest and Access policy remain unchanged until authorization.

Proposed mode:

| Setting | Proposed value | Effect |
| --- | --- | --- |
| `PREVIEW_CATALOG_READS_ENABLED` | `true` | Allow container egress for the application transport to fetch public SinaLite sandbox data. |
| `PREVIEW_API_ACCOUNT_READS_ENABLED` | `false` | Block real account supplier calls. |
| `PREVIEW_DATABASE_ENABLED` | `false` | Keep the existing isolated synthetic PostgreSQL fallback while persistent database verification remains open. |
| Default API spending ceilings | USD0.00 | Unknown/paid overage remains blocked. |
| Frontend Access policies, static asset manifests and origins | Retain current configuration | Keep both existing HTTPS addresses protected. |
| Runtime public route/version preview URLs | Remain disabled | Avoid an unprotected alternate entry point. |

The container networking flag enables egress at the infrastructure level. Application code restricts native supplier requests to reviewed fixed hosts/paths; in this proposed mode it permits only public SinaLite sandbox reads. It does not make Cloudflare's container network itself a per-host firewall. Real account mode additionally requires the approved persistent database and a separate explicit flag.

Replacing the current container resets its temporary synthetic PostgreSQL and private files. No production state is involved. Existing paid-plan container usage can incur its normal usage charges; this proposal adds no new service, account plan, instance or domain. No paid supplier query budget is approved by this proposal.

Approval is requested because the owner explicitly required approval for deployment/infrastructure changes, and enabling outbound preview networking is such a change. After approval: publish the reviewed image; update only the runtime image/config; preserve frontend assets/Access; verify both URLs behind Access and app login; exercise caps/cache/private staging with public sandbox data; remove any temporary test access. Keep the previous digest for rollback. Do not claim the updated hosted previews are verified before those checks.

API reference checked: [Cloudflare Container start/enableInternet](https://developers.cloudflare.com/containers/api/durable-object-container/). Persistent database/account-mode activation is outside this proposed first rollout.
