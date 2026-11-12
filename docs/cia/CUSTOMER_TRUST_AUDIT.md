# CIA-TRUST-001 compatibility and customer journey audit

November 12, 2026. Contract: `CUSTOMER_TRUST_MARKETING_AND_COMMERCE.md` at PR #3 head `5a07a1c954fef546b492f70ba152ea7065b6d86d`. Application source: main `3c221f6` plus the M1 evidence branch; M1 changes no storefront/CMS narrative. Existing TwelveSpec production systems and domains were excluded as instructed. This is an audit of the new build, local synthetic workflows and protected preview edges—not a content audit of the existing production business.

## Brand and editorial authority

The actual written design direction is `docs/website-content-studio/02-design-comparison.md`, with owner approval recorded in `docs/website-content-studio/IMPLEMENTATION.md`. The current source uses approved neutral/vermilion token presets, existing UI sans typography and existing TwelveSpec mark/wordmark. `packages/contracts/src/website.ts`, `packages/marketing/src/website/defaults.ts` and `packages/website-ui/src` implement the approved options. Legacy fallback shop CSS/copy still exists. Do not invent a new brand, substitute a manufacturing tagline, remove logo treatments or overwrite owner-authored content as part of CIA implementation.

The seeded narrative includes “Your brand. A world of possibilities.” and “Good things. Made yours.” The new contract's business descriptor does not, by itself, approve replacement copy. The original reference image remains unavailable; no image-derived brand authority is asserted. No new editorial/brand change is made by this audit.

## Verified source and state ownership

| Surface | Actual code / evidence | Status and implications |
| --- | --- | --- |
| Shared website | `packages/marketing/src/website/{documents,releases,repository,references,media}.ts`; `packages/website-ui/src/index.tsx`; OS `components/website-studio.tsx` and related forms | PARTIAL. Actual no-code pages/sections/navigation/footer/theme/media, exact private revision preview, selected publication/history/restore. Five CMS browser journeys pass locally. All 80 original CMS scenarios remain a separate open target. |
| Homepage/categories/solutions | `defaults.ts`; `packages/marketing/src/website/index.ts: initializeWebsite`; `apps/shop/components/storefront.tsx` | Seeded print/promo/apparel/signage navigation, featured canonical collection and trade-show/uniform/gifting/school/industrial-branding solution drafts. These are synthetic starting content, not verified sector expertise or service qualifications. |
| Public discovery | `apps/shop/components/public-catalog.tsx`; `packages/marketing/src/website/repository.ts: publicCatalogPage`; `/api/catalog/public` | VERIFIED bounded SQL pagination/count/facets and safe product projection in local tests. Legacy `/api/shop` list still caps products/variants at 1000; product detail/designer lookup still depends on that list. Full large-catalog discovery is PARTIAL. |
| Product identity/options | `packages/catalog/src/index.ts: publicProduct`; configuration `validateConfiguration`; storefront product detail | Exact IDs/color/size and reviewed public snapshot, price null, availability REQUEST_QUOTE. Product-level methods/MOQ cannot establish variant-specific manufacturing applicability or stock. Generic image fallback must not be labeled a verified variant photo. |
| RFQ | `quote-cart.tsx`, `storefront.tsx: submitCart`, `packages/commerce/src/index.ts`, Sales request review | VERIFIED local sign-in/cart/brief submission, persistence and reviewed quote journey. No charge/purchase on submission. No stand-alone product-free consultation/anonymous lead form; `project_inquiry` is a link to `/cart`, not a working contact form. |
| Account/reorder | `apps/shop/components/account.tsx`; server `accountGET`; Commerce `reorder` | PARTIAL. Scoped local quotes/orders/art/proofs and reorders. Complete program/kit/context and revision/rights revalidation still needs work. |
| SEO | `apps/shop/app/layout.tsx`, `app/[[...path]]/page.tsx: generateMetadata`; CMS page SEO fields | PARTIAL. Stored title/description render from published revisions; robots remains globally noindex/nofollow for this development build. Production canonical/sitemap/social-card/structured-data coverage is MISSING/unverified. Do not lift noindex as an incidental CIA change. |
| Media/testimonials | CMS media store and reference resolver; contracts require consent reference for testimonials | PARTIAL. Original private bytes, approved raster derivatives, current-rights/revocation checks and consent-reference validation exist. No real testimonial/case study/endorsement is established by seed data. Arbitrary body-text assertions do not get claim-level truth validation. |
| Privacy and telemetry | Membership/RLS, explicit product/quote/order serializers; `packages/marketing/src/index.ts: record_attribution`; analytics reports | PARTIAL. Private data fields suppressed; operator-recorded attribution and local-preview campaigns exist. No demonstrated consent-aware acquisition funnel or measured CAC/ROI. Capped legacy report aggregates remain defective. |
| Mobile/accessibility/performance | `tests/e2e/shop.spec.ts`, CMS browser journeys and media/product tests | VERIFIED specific mobile keyboard/search and automated axe A/AA journeys. Full keyboard/assistive-tech/200%-zoom matrix, measured Core Web Vitals and 100k-variant load targets remain unverified. |
| Contact/policies | Footer schema supports legal/social links; default legalLinks is empty; demo seller/address is synthetic | MISSING real approved public contact/policy content in the default seed. Never publish the demo seller/address as the actual business identity. Legal/financial approval is needed for real terms. |

## Capability / customer-claim truth matrix

`LIVE_AND_VERIFIED` applies only within the explicitly named environment. Local synthetic functionality is never evidence of public live availability. `EXTERNAL_HUMAN_DELIVERY` requires actual specialist/partner evidence; software code alone cannot prove it.

| ID | Inspected statement/capability | Truth classification / source | Required action or limit |
| --- | --- | --- | --- |
| TRUST-01 | “Synthetic products & simulated integrations. No real payments or supplier orders.” | LIVE_AND_VERIFIED in local development; shop preview bar, shared footer, explicit mock adapters and negative tests | Keep development disclosure; public production copy requires a separately approved activation and real data. |
| TRUST-02 | Browse exact selected color/size and request a reviewed quote | QUOTE_FIRST; local product/RFQ/owned-catalog browser journeys | Use only reviewed eligible showcase products for a real launch; synthetic catalog is not merchandise ready for sale. |
| TRUST-03 | “No charge or supplier purchase occurs when you submit this request.” | LIVE_AND_VERIFIED for local RFQ command; `quote-cart.tsx`, Commerce command and tests | Preserve RFQ vs binding offer/payment distinction. |
| TRUST-04 | “Version-bound proofs” / private artwork | QUOTE_FIRST / PARTIAL; immutable versions, proof approval and scoped asset tests | Exact version/spec works in tested path; post-save variant rebind and some lookup/binding defects remain. Local file persistence/scan not production-grade. Do not imply manufacturing release. |
| TRUST-05 | “Physical dimensions, effective DPI, color profile, fonts, bleed, and method-specific requirements are checked separately before manufacturing.” | BLOCKED as an end-to-end automatic manufacturing claim; `preflightDesign` is PRELIMINARY_NOT_ROUTE_VALIDATED and release denies | Editorial review should clarify that qualified producer review is required; no functioning full export/release path exists. Current text is not changed without approval. |
| TRUST-06 | Real products “in stock”, guaranteed delivery, instant firm pricing, ready for checkout | BLOCKED; `publicProduct` returns null price/REQUEST_QUOTE; provider readiness/finance/release gates | No blanket stock/delivery promise. Bind future claims to exact variant/route/current evidence. |
| TRUST-07 | In-house embroidery/printing or owned manufacturing facilities | BLOCKED/unsubstantiated by this repository; no confirmed facility/equipment evidence found | No such explicit claim was found in the inspected seeded offering copy. Do not infer facility ownership from business categories or supplier connectivity. Real managed specialist delivery is EXTERNAL_HUMAN_DELIVERY only after partner evidence. |
| TRUST-08 | Embroidery digitizing, manufacturing files, AI design, validated 3D, CAD/engineering | PLANNED / BLOCKED; Coming Soon registry and server denials | Keep disabled. A 2D mockup, new observation or product-thread proposal does not activate these. |
| TRUST-09 | Company stores, budgets, school fundraising and bundles | QUOTE_FIRST / PARTIAL; program/bundle tests, existing scope gaps | Demo program selection works. Full budget/kit settlement/commitment controls remain open; no live program financial guarantees. |
| TRUST-10 | Real testimonials, customer logos, certifications and measurable success rates | BLOCKED absent actual evidence/consent; default testimonials empty | Never fill with invented endorsements or imply industry-association certification. Consent infrastructure is not a claim's proof. |
| TRUST-11 | Approved premium design and routine no-code content editing | LIVE_AND_VERIFIED locally / PLANNED on hosted revision; approved design record and five CMS journeys | Current main has the studio; no claim it is deployed until the specific preview update is approved and verified. |
| TRUST-12 | Real public identity, support contact, privacy/returns/tax/payment terms | BLOCKED pending actual approved content; empty default legal links and synthetic seller | Prepare editorial/legal review in CMS. No request for credentials or approval is needed merely to document this gap. |

This matrix covers inspected source/defaults and measured local paths. It does not assert that every author-written database string, every hosted revision or existing production page has been audited. `®` remains in the existing wordmark treatment; no trademark registration evidence was reviewed and no legal conclusion or logo alteration is made.

## Preview status and limits of verification

On November 12 an anonymous HTTPS check of **both** existing development URLs returned **302 to `orange-thunder-e3e8.cloudflareaccess.com`**:

- `https://twelvespec-preview-shop.samantha-4ec.workers.dev/`
- `https://twelvespec-preview-os.samantha-4ec.workers.dev/`

This verifies the Access edge redirect, not application behavior after authentication. No bypass policy, test identity, credential or deployment was created. The last repository deployment record (`docs/supplier-api/README.md`) identifies preview source `916160b`, temporary PostgreSQL/files and no real-account activation; that runtime image was not independently reverified in this audit. New main CMS and this CIA branch must **not** be described as hosted until deployed and tested under separate authorization. Existing production infrastructure was not inspected.

## Bidirectional CIA/public projection map

| Data | Authoritative owner → consumer | Public allowlist / feedback / invalidation |
| --- | --- | --- |
| Product/variant facts and licensed image | Catalog public snapshot/media → storefront/CMS collections | Existing IDs, public name/copy/category/recognized brand, exact color/size/hex/approved image, minimum, method/location guidance, quote-only readiness. No source IDs, private producer, offer/cost/account/net/credential fields. Rights revocation must remove affected public derivatives. |
| Material cost and evidence | Supplier/CIA → Pricing/Sales internal assessment | **No public projection.** M1 facts/rights/assessments remain private and are not copied into CMS or SEO. Sales creates separately reviewed customer terms. |
| Marketing capability claim | Marketing content revisions + CIA supporting evidence → approved channel text | MISSING claim-level policy. Proposed public fields: statement, applicable scope, conditional availability and meaningful limitations. Internal source/rights/reviewer and private economics stay private. Use current revision/approval/reference machinery, not a second CMS. |
| Quote/cart/brief | Commerce/Sales → scoped qualification, CRM follow-through | Customer sees own project/status/issued terms; feedback uses actual approved event history, not a fabricated conversion. |
| Acquisition/engagement | Consented channel and campaign data → Marketing/analytics/CIA | MISSING complete funnel collection. Minimize identity, record purpose/consent/retention, aggregate across authorized scope only; no cross-workspace profiling. |
| Delivery/cost/quality/owner time | Orders/fulfillment/Finance/Today → Analytics/CIA → reviewed recommendations | Whole-data reconciled measures; null for missing data. No automatic public “success rate” or testimonial from internal logs. |

Claim statuses proposed by the trust contract are `VERIFIED_AVAILABLE`, `CONDITIONAL_OR_QUOTE_FIRST`, `PLANNED_NOT_AVAILABLE`, `UNVERIFIED_DO_NOT_PUBLISH`, `RETIRED`. They are **not currently implemented**. Extend existing Marketing revision/reference publication checks with evidence, effective dates and revocation. Do not use keyword blacklisting or a model's confidence as truth verification. An approved free-text section must not imply all factual claims were checked.

Commerce's proposed discovery/request/reviewed-quote/direct-checkout axes also remain a fuller contract. Current `REQUEST_QUOTE_ONLY` and variant `REQUEST_QUOTE` must map conservatively to discovery/RFQ; a successful RFQ, price assessment, CMS publication or approved visual proof never maps to DIRECT_CHECKOUT_ELIGIBLE.

## Journey, dependencies and next customer-facing milestone

Existing path: published home/solution → paged catalog → exact product/variant → signed-in quote cart + brief → RFQ → operator review/manual worksheet → issued quote → customer acceptance/account/reorder. Optional artwork/design/proof is part of the same project. Production/real payment remains gated. The path is tested locally; the deployed preview edge check does not establish that all these source features are hosted.

Next **M1b** should improve first-customer trust/conversion using the existing CMS and RFQ flow: review real contact/policy content, claim-backed offer categories and selected licensed showcase items; provide a safe consultation entry when no SKU is known; surface review status/next action; then demonstrate the exact 48-cap requirement with complete costs/route evidence. It does not require a CAD engine or instant checkout. Engineering can prepare safe contracts, spam/validation controls and synthetic tests without paid services; actual claims/media/terms and deployment need their existing approvals.

| Acceptance ID | Current evidence | Next assertion / dependency |
| --- | --- | --- |
| CT-01 claim truth | MISSING claim gate | Unverified in-house/stock/delivery/engineering statement cannot publish even after generic editorial approval; exact evidence and channel scope required. |
| CT-02 safe discovery/RFQ | Local browser PASS for normal selected-product path | Stale/unknown/unsuitable variant stays quote-only or blocked; no hidden buy-now path. |
| CT-03 privacy in all channels | Existing DTO/media security PASS; M1 private assessment HTTP PASS | Add SSR metadata/structured-data/sitemap/social/export fixtures with private source/cost markers; no leakage. No structured-data feature is implied today. |
| CT-04 reversible no-code editing | Five CMS browser journeys PASS; original 80 cases PARTIAL | Complete delegated roles, scheduling, all component/rollback and rights cases. |
| CT-05 source/claim invalidation | Media revocation PASS; source restriction M1 PASS | Stale/revoked source invalidates affected public claims/eligibility while permitted historical evidence remains. Full dependency mapping MISSING. |
| CT-06 honest mockups | Synthetic labels and no-production proof tests PASS | Exact variant/profile/art/font rights and explicit simulation type; no physical-sample claim. |
| CT-07 conversion/accessibility | Existing mobile search, RFQ and axe PASS | Product-free lead/contact form, spam/abuse controls, complete focus/screen-reader/zoom and performance measurements; do not invent CWV results. |
| CT-08 consent/outcomes | Local campaign consent checks PASS, funnel MISSING | Authorized acquisition-to-RFQ-to-realized-profit measures, complete dataset, dedupe and retention. |
| CT-09 deployment readiness | Access redirect verified; post-auth current app not reverified | Authorized preview update with exact source/database/media checks; production legal/financial/recovery gates stay NO-GO. |

No pricing, brand statement, product publication, CMS text or production domain was altered for this additional audit. The precise evidence foundation remains compatible and independently testable. M1b and the four later product/production pilots are pending, not silently counted as delivered.
