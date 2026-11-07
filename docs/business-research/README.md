# TwelveSpec feature research and original software blueprint

**Purpose:** adapt useful features and workflows from all 17 requested companies into TwelveSpec's own software. Reviewed **November 6, 2026 (America/Chicago)**. Research completion is separate from implementation acceptance.

Start with the [engineering blueprint](SOFTWARE_BLUEPRINT.md), the [filterable offline research viewer](index.html), or the [downloadable workbook](TwelveSpec_Feature_Research.xlsx).

## The main findings

1. Build one commercial and production workflow: exact product/variant → shared design → proof/prepress → agreement → approved purchase requirements → jobs/QC → packages → reconciled actual costs.
2. Adapt interaction patterns from Custom Ink, Imprint.com, 4imprint and VistaPrint, program controls from OrderMyGear, B2B identity from Shopify/BigCommerce, print workflow interfaces from PrintNow/trade printers, and approval/task patterns from Oracle NetSuite and Fusion separately. See [company analysis](COMPANY_PROFILES.md).
3. Keep company-store membership, brand rules, budgets and kit composition through the actual cart and acceptance path. A separate widget does not enforce the workflow.
4. Treat source catalogs, credentials, price evidence, artwork and transactional capabilities as independently governed records. Direct PromoStandards remains supported; PSRESTful remains prohibited.
5. Prioritize the observed precision, context-loss, proof-binding and approval-role defects before broader UI additions. Build against synthetic fixtures while account-specific integration evidence is pending.

## Deliverables

| Artifact | Contents |
|---|---|
| [Company profiles](COMPANY_PROFILES.md) | All 17 companies: public behavior, original design lessons, boundaries and unknowns |
| [Feature packs](FEATURE_PACKS.md) | 35 designs with customer/operator flows, logical records, business rules, conceptual commands/events, code paths and 104 proposed tests |
| [Engineering blueprint](SOFTWARE_BLUEPRINT.md) | Five end-to-end journeys, transaction/approval logic, architecture, data authority and ordered implementation waves |
| [Data model](DATA_MODEL.md) | 30 logical entities and 292 fields, ownership, lifecycle and integrity rules |
| [Traceability](TRACEABILITY.md) | All 20 modules, 205 original inventory entries and 95 acceptance scenarios retained |
| [Source register](SOURCES.md) | 39 official vendor/standards sources, review date, evidence level and access limits |
| [Activation requirements](ACTIVATION_REQUIREMENTS.md) | Work possible now; credentials/licensing/financial/deployment needs for later |
| [Workbook](TwelveSpec_Feature_Research.xlsx) | Filterable companies/features/rules/tests/fields/inventory/acceptance/source sheets and a synthetic logic lab |
| [Offline viewer](index.html) | Search and filter companies, features and entities; no account or external script needed |
| [Research packet ZIP](TwelveSpec_Feature_Research_Packet.zip) | Portable copy of the research documents, data and workbook |

Machine-readable inputs/exports: [research](research.json), [data model](data-model.json), [test designs](proposed-tests.json), [trace map](traceability.json), [features CSV](features.csv), [fields CSV](data-fields.csv), [companies CSV](companies.csv), [sources CSV](sources.csv) and [test CSV](proposed-tests.csv).

## Status, accurately separated

- **Research delivered:** 17-company comparison, 35 original feature designs, 104 proposed tests and the logical data requirements.
- **Existing implementation:** remains at the recorded repository baseline. This research does not implement new application features or change the previews.
- **Simulated functionality:** existing application fixtures remain synthetic; the workbook logic lab also uses labeled synthetic values.
- **Verified integrations:** none newly authenticated or verified. Public documentation and indexed excerpts are labeled evidence, not successful API tests.
- **Outstanding application failures:** existing [gap audit](../planning/GAP_AUDIT.md) remains open, including cost precision, program/kit context, proof binding, production review, event consistency and full acceptance.
- **Remaining activation:** [access requirements](ACTIVATION_REQUIREMENTS.md). No account creation, purchase, external messages, production connection, public source upload or deployment occurred.

## Rebuild and validate

From the repository, use Python 3 and the pinned optional research export dependency in `scripts/research-requirements.txt`, then run:

```sh
npm run research:build
npm run check:research
npm run check:research:browser
npm run check:plan
npm run check:spec
```

The exporter uses curated inputs in `scripts/curate-platform-research.py` and `scripts/curate-research-model.py`. It does not perform network calls. The validator checks coverage, source references, code paths, workbook structure/formula caches and snapshot/Coming Soon status. The optional browser check uses installed Chromium (`CHROMIUM_PATH` can select another executable) and a temporary loopback-only HTTP server; it makes no external requests. Browser-viewer verification is recorded separately in the validation report. Application A/T/E tests and the proposed feature tests are not claimed to have run as part of documentation validation.
