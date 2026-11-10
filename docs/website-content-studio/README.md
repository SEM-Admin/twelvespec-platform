# Website & Content Studio — audit and review package

This is the historical pre-implementation review packet. The owner subsequently approved the direction. For current code, test results and incomplete features, use [the implementation checklist](IMPLEMENTATION.md) and [November 9 launch readiness](../LAUNCH_READINESS_2026-11-09.md). The original screenshots and evidence retain their capture dates and baseline.

Prepared November 7, 2026, America/Chicago. Baseline: `f5cb02511022909edb396dbd79c4be397858f67d`.

Start with the [readable review](review.html), [PDF overview](TwelveSpec_Content_Studio_Review.pdf) or [interactive editor wireframes](06-studio-wireframes.html#editor). Extract the ZIP before opening its HTML files so their local images and links resolve. The HTML includes expandable technical appendices; the PDF is the overview.

**Historical review packet:** the owner approved the proposed direction on November 8. Current source implementation and remaining acceptance gates are tracked in [IMPLEMENTATION.md](IMPLEMENTATION.md) and the [November 10 integration checklist](../integration/2026-11-10.md). The audit findings below describe the earlier review baseline. This package is an audit and proposal. It does not implement a CMS, change the applications, apply migrations, publish website content, purchase services or deploy anything.

The controlling request is preserved in [source-brief.md](source-brief.md). Its section 6 requires the audit and proposal to be reviewed before implementation/publication. The referenced visual attachment was not present in the current upload. The comparison uses the written brief; the proposed layouts remain provisional until that image is supplied and reviewed.

## Recommendation

Extend the existing Commerce OS with a **Website & Content Studio** under Marketing, using structured, reusable components, the existing PostgreSQL/auth/tenant architecture, existing editorial records and a shared storefront renderer. Keep the canonical catalog, customer artwork, production data and transactions in their current domains. Add a small set of site/release/reference records; do not introduce another product database or a paid CMS service by default.

This has the lowest integration overhead for the current application, but it still requires engineering and testing. Payload is a credible alternative if a time-boxed integration evaluation proves it reduces total maintenance without duplicating authentication or bypassing row-level security. It has not been installed. Directus and Sanity add licensing/hosting or SaaS considerations and are not the default recommendation.

The first functional milestone after review should be one real owner workflow: edit the homepage hero → save an isolated draft → preview three device widths → publish an approved revision → restore a prior revision. This must preserve the existing catalog, design, quote and account behavior.

## The nine requested deliverables

| Request | Deliverable | Status |
| --- | --- | --- |
| 1. Current website/backend audit | [Current-state audit](01-current-state-audit.md), [source inventory](evidence/source-inventory.json), [browser evidence](evidence/browser-checks.json) | Inspected source and running local development UI. |
| 2. Design-direction comparison | [Design comparison](02-design-comparison.md) | Written brief compared; reference image missing. |
| 3. Eight customer-workflow gap analysis | [Eight-workflow matrix](01-current-state-audit.md#eight-customer-workflows) | Working, partial and absent behavior separated. |
| 4. CMS architecture/build-versus-buy | [Architecture decision](03-architecture-decision.md) | Recommended; not implemented. |
| 5. Reusable components/properties | [Component registry](04-components.csv) | Proposed registry and editable fields. |
| 6. Content schema/relationships | [Content model](05-content-model.md), [example schema](proposed-content-schema.json) | Proposed contracts; no database changes. |
| 7. Administrative wireframes | [Interactive wireframes](06-studio-wireframes.html) | Design-review prototype only; no live CMS actions. |
| 8. Preserve/modify/add/eliminate plan | [Phased plan](07-phased-plan.md) | Dependencies, review gates and exclusions explicit. |
| 9. Acceptance tests | [Acceptance matrix](08-acceptance-tests.csv), [test strategy](09-acceptance-plan.md) | Proposed tests; no claim that future CMS features pass. |

## Findings that change the implementation order

- The homepage, header, menus, footer and theme are hardcoded. Existing marketing draft records are not a working website CMS.
- Reuse the canonical catalog, approved derivative checks, private design assets, request snapshots and operator quote workbench. Replacing those would discard successful work.
- Hosted database/files remain temporary. The existing idle-stopped runtime also cannot promise punctual scheduled publishing. Durability and a reliable scheduler are required before owner content can be treated as permanent.
- The current mobile homepage produced one critical accessible-name violation in a fresh audit. Desktop checks reported none. There was no horizontal overflow at either tested width. This is a development snapshot, not a production accessibility certification.
- Store read policies already enforce public visibility or membership. Their membership predicate does not require an active membership, while transactional eligibility does. Revoked/inactive membership reads need a targeted regression before private organization content is introduced.
- Marketing approval contains a role mismatch: the handler admits owner/manager approval, but module authorization excludes manager. New editor/publisher capabilities must be explicit.
- Unknown bundle totals may render as zero through the current money-formatting fallback. Fix that presentation before using bundle cards in premium merchandising.

## Evidence and limits

The repository contains 20 registered modules (19 active and Coming Soon), 97 registered application tables, six migration files and 120 synthetic product SVGs. All module source locations are inventoried. Source presence does not establish full module acceptance. The prior implementation recorded 169 automated checks and 11 local browser journeys; those whole suites were not rerun or reinterpreted as CMS acceptance in this audit.

The fresh browser audit captured nine views, read the existing catalog and four owner modules, and blocked non-read content requests. It made zero content mutation requests. Local authentication created only a development login session. Production systems and the approved Supabase project were not accessed. See [primary documentation and code evidence](sources.md).

Routine editing after the studio is implemented must update versioned database content without Git commits or deployments. New component types, security fixes and schema changes will still require normal engineering releases. Public sales activation remains governed by [selling readiness](https://github.com/SEM-Admin/twelvespec-platform/blob/f5cb02511022909edb396dbd79c4be397858f67d/docs/SELLING_READINESS.md).

## Status by category

| Category | Result of this audit |
| --- | --- |
| Implemented/inspected | Existing catalog, design-version/proof, quote and program foundations were inspected; nine requested review deliverables are prepared. No new application feature was implemented. |
| Simulated | The existing local application uses synthetic products and simulated integrations. The new admin wireframes use sample in-memory content only. |
| Verified integrations | Local storefront/owner API reads were verified. No new supplier, Shopify, payment, Supabase or production integration was verified. |
| Outstanding failures/findings | Mobile account accessible name was reproduced. Source inspection identified role mismatch, inactive-membership read predicate, unknown-bundle-total display, capped public catalog queries and absent website CMS. |
| Remaining activation requirements | Owner review, implementation and all proposed acceptance gates; durable isolated data/media, reliable schedule execution, rights-approved assets and relevant account/legal/financial/deployment authorization. Original platform and selling-readiness gates remain separate. |

This packet was initially saved locally for review. Approval was subsequently received; current source-publication and implementation status is recorded in the implementation checklist. Code citations point to the baseline in the existing GitHub repository; private-repository access requires the appropriate GitHub login. Prototype verification and document integrity results are in `evidence/`, distinct from application acceptance. The PDF names the technical files rather than embedding unusable local-server links.
