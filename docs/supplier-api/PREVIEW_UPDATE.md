# Approved preview rollout — status checked November 10, 2026

The owner approved the isolated update. Cloudflare readback confirms source `916160b` is deployed at 100% as Worker version `66612b9b-3b02-4ec0-ba6d-adcf8afa26a5`, deployment `26105980-1f90-4c61-9216-ea0f514804e1`.

- Image: `registry.cloudflare.com/4ec2144c2d67567d5fed301d0db45ea8/twelvespec-preview-runtime@sha256:f3ee7d1dd3d4c665b741f6a1ed42890ef04501c001b3f10d3e876f37c10ffc08`.
- Public sandbox reads enabled; real-account reads and hosted-database activation disabled.
- Runtime public and version-preview routes disabled.
- Both preview applications retain only the original owner Access policy. Interrupted-session test policies and service token were removed and policy lists verified.
- Container image builds succeeded. Local container startup verification was blocked by the workspace disk limit before the application started; that is not an observed application startup error.
- **Authenticated hosted application workflows for this image have not yet been verified.** Deployment metadata alone is not browser acceptance. Storage remains temporary; the new November 10 CMS interface is not part of this older image.

The original reviewed proposal is retained below as deployment history. Its approval request is historical, not a new permission request.

---

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
