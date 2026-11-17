# Curated catalog and one quote workflow — verification

November 17, 2026. This is a source implementation using disposable local PostgreSQL and synthetic business data. It does not establish live supplier access or public launch readiness.

## Implemented and reused

- Customer quote intake remains in TwelveSpec. Commerce OS → Sales → Quotes & requests now includes the existing account-free review panel alongside customer requests and quotes. The same private CRM follow-ups and Today tasks are retained; CRM has no duplicate review panel.
- Commerce OS → Catalog → Decoration guidance opens a protected, lazy-loaded reference. Search, category/method filters, pagination, production cautions, source links and the full method glossary retain all 106 product families and 54 research methods/finishes.
- All five original uploads are stored verbatim with SHA-256 hashes. The provenance checker verifies the JSON/CSV/workbook correspondence, nine categories, seven workbook sheets, 24 references and 13 PDF pages. Document instructions are research material; none is executed as authorization.
- Existing source staging, selected supplier imports, exact product/variant editing, licensed media and reviewed publication remain the catalog path. No new catalog database or supplier transport is introduced. The current eight executable method codes are unchanged.

## Local results

| Check | Result | Evidence |
| --- | --- | --- |
| Backend/contract/security/migration/recovery suite | **361 passed across 48 files; 0 failed** | `npm test`; `.local/test-results.json` |
| Complete browser suite | **27 passed; 0 failed** | `npm run test:e2e`; Playwright report |
| Both optimized Next.js applications | **Passed** | `npm run build` |
| TypeScript | **Passed** | `npm run typecheck` |
| Original controlling inventory and plans | **Passed** | `check:spec`, `check:plan`; 85 original files, all 20 modules, 205 inventory entries and 95 A/T/E scenarios retained |
| Research and industry provenance | **Passed** | `check:research`, `check:industry`; 1,823 and 427 integrity checks, not implementation acceptance |
| All five decoration originals and cross-format relationships | **Passed** | `npm run check:decoration` |

The new backend checks read every family through pagination, resolve all method/source references, reject invalid filters and scope/publication/credential fields, deny customer access, and verify that reference reads create no products, variants or process profiles. Raw research IDs cannot become executable SKU methods. The uploaded research JSON/CSV cannot be staged as supplier SKU feeds; public product projections do not expose research fields.

The new browser journey opens the actual private Catalog, finds nylon rainwear and its waterproofing cautions, and verifies that the public catalog is unchanged. The guest-inquiry journey retries a lost response after commit, confirms one saved private request in Sales, saves/reloads its review and verifies that CRM has no second review panel. Existing catalog → request → private costing → issued quote, supplier caps/cache/credit modes and licensed publication regressions all pass.

One initial full browser execution lost its local servers and produced no complete report. The completed build/browser rerun above supersedes that interruption; it is not counted as a pass. Both builds retain the six existing Creative filesystem-tracing warnings, three per app. Packaging and durable asset handling remain outstanding production concerns.

## Simulated and unverified

- Business records, supplier responses and financial transactions in the automated suite are synthetic. The local public-intake challenge is explicitly simulated.
- ASI SmartLink has official catalog API documentation, but account entitlement, current response contracts, fees and display/cache/media/template rights remain unconfirmed. No documentation credentials or live account are used.
- SAGE/SinaLite transports, encrypted credentials, metering and private imports are reused. This change does not activate an account, spend credits, connect production suppliers or certify real catalog facts.
- Research recommendations are not available customer options. No exact SKU is verified by the uploaded library; no method, price, inventory, equipment capability, licensed image or manufacturing output is inferred from it.

## Remaining activation requirements

Confirm authorized supplier access and rights, then curate actual SKUs with current options, costs, licensed media and producer evidence. Complete hosted persistence, production identity/privacy/retention, real spam protection, monitoring and the approved release procedure. Historical ESP+ requests are not synchronized or migrated by this slice.

The source changes have not been deployed to the protected previews. The existing ASI website, ESP+ intake, DNS and email routing remain untouched. Any cutover must verify old form/URL handling so that the new website has one quote destination, preserve historical requests, and receive explicit owner authorization.

The final implemented local scope has no failing tests. Original full V1, CMS and production-release acceptance remain open. Integration requires green GitHub CI for the exact final PR head; the run URL and tested SHA are recorded on that pull request.
