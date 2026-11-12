# Connected CIA workflow — implementation checklist

Baseline `32c090a` / PR #4 (292 backend tests, 19 browser journeys, green CI). Main remains separate; this continuation branch is stacked on the reviewed foundation implementation. PR #3's three contracts remain at `5a07a1c`. No deployment, supplier/network activation, production release, paid service or production-system access is part of these engineering changes.

The owner authorized continued completion after the audit. Existing domain ownership, V1/future scope, immutable commitments and financial controls remain controlling. The original 95 scenarios and 80 CMS cases remain separate acceptance inventories.

| Requirement | Existing owner / implementation target | Planned behavioral proof | Status |
| --- | --- | --- | --- |
| Exact artwork binding after saved color/variant changes | Existing Creative project/version/proof and storefront designer | Save variant A, switch to B, save again; immutable A remains A, new version/proof bound B, Sales rejects mismatched design | LOCAL PASS: 4 integration cases + real cap browser journey |
| Proof query and invalidation follow exact version, independent of unrelated record counts | Creative scoped queries; no second approval engine | Identical document hashes and >1000 unrelated proofs cannot reuse approval or hide invalidation | LOCAL PASS: exact-version, 1001-record and concurrent revision/approval regressions |
| Nontechnical private evidence workflow | Existing Integration Center / Supplier source + observation commands | Owner records source and exact price from forms, reviews history/restriction; customer/unauthorized reads denied | OPEN |
| Evidence review at quote line | Existing Sales workbench / immutable assessments | Select line/observation, view applicability reasons and explicit unknowns; quote unchanged | OPEN |
| Versioned producer planning profile | Orders/production, exact product/variant/substrate/zone/method/facility + source | Wrong identity, stale revision, revoked source, missing dimensions and synthetic origin block real qualification | OPEN |
| Complete component cost evidence | Extend original price observations, reuse Pricing component arithmetic | Item/order/shipment charging basis, role/method/zone match, MOQ/pack, exact bounded quantity, currency and private rights; unknown is not zero | OPEN |
| Explainable 48-cap qualification | Existing Sales draft line + profile + current evidence, immutable decision | Blank/decorator/setup/prepress/packing/freight plus source availability/date/artwork constraints; synthetic scenario distinct from authorized real review | OPEN |
| No implicit commercial or manufacturing permission | Existing issue/accept/margin/payment/production owners | Qualification cannot issue quote, charge, buy, publish or release artwork; simulation never becomes real eligibility | OPEN |
| Customer trust and publication | Existing Marketing/CMS revision/reference/approval services | Structured unsupported claims cannot publish; evidence/rights/revision invalidation tested; existing approved narrative preserved | OPEN |
| Useful lead entry without chosen SKU | Existing CRM/RFQ intake, owner-approved presentation | Accessible validated inquiry with spam/size limits, persisted private follow-up, no manufactured contact/legal content or unsolicited send | OPEN |
| Financial outcomes over complete data | Existing Analytics/Finance/Today SQL | >1000-record scoped regression, missing actual time/cost stays unknown, no invented ROI | OPEN |
| Cross-module regression and review delivery | Existing local disposable PostgreSQL, Vitest/Playwright, GitHub CI | Original inventory, typecheck/builds, full suites, additive upgrade, source/privacy review; publish actual results and blocked external requirements | OPEN |

Order: exact identity integrity → evidence UI → producer/profile + component contracts → qualified quote scenario → trust/intake/reporting controls → full regression and review. Manufacturer-specific exports, CAD/digitizing/validated 3D remain Coming Soon; descriptive references or a mock scenario do not activate them. Source rights/retention operations and real hosted readiness remain activation gates.

This checklist records planned work before changes; OPEN is not a pass. Update each row only with actual code and behavioral evidence. Report remaining producer/licensing/legal/financial/credential/deployment dependencies separately.
