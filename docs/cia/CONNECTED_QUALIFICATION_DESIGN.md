# Connected planning and quotation evidence

Continuation of PR #4 (foundation now consolidated into main); architecture contracts remain unmerged. No deployment or new external integration is included.

## Existing owners and boundaries

Orders/production owns immutable `process_profile_versions`. Supplier owns source rights and price evidence. Sales reads its authoritative draft line and records an immutable qualification. Pricing performs the existing decimal extension, landed-cost addition and 40% target-margin calculation. Creative owns the immutable artwork revision and proof. These are shared references within the existing application and PostgreSQL transaction boundary, not a second PIM, production engine, editor or costing calculator.

Migration 013 appends three private history tables and adds component/profile columns to existing observations. M1 observations retain material/per-item meaning and original fingerprints. Omitted and explicit original defaults produce the same retry fingerprint. Migration 012 and the artwork changes separately protect exact product/variant identity and exact-version proof invalidation.

## Usable operator path

1. Integration Center: register a permitted source edition and original-document fingerprint. Original bytes stay in the operator's browser; an operator must retain the source securely.
2. Orders & jobs: record exact product/variant revisions, method/location, producer, facility, substrate, documented geometry and output-contract reference. Missing facts stay null. A documented profile is planning evidence; it does not validate a manufacturer or machine file.
3. Integration Center: record each cost component, exact quantity scope and charge basis. Nonmaterial and non-item charges require the exact profile/method/location. All eight existing Pricing components need evidence, including zero. Freight may use separate legs or a reviewed all-leg total; duplicate legs and evidence reuse block qualification.
4. Customer: submit the normal exact-variant RFQ. Sales prepares the existing draft quote.
5. Sales: choose the draft line, profile and cost records; supply source-backed availability, delivery and destination facts. Saved artwork dimensions override proposed dimensions. No implicit calendar, FX, stock quantity, free setup or zero freight is invented.
6. Read the immutable explanation, source fingerprints, rules version and production holds. Source restriction, expiry, changed revisions or mismatched identity block new decisions. Retrying an old idempotency key returns historical evidence; a new decision requires a new key. History is explicitly labeled as historical in the interface.

## Financial and manufacturing meaning

`SYNTHETIC_PREVIEW` may have complete scenario arithmetic, but always has `eligibleForQuoteCost=false`, `commitPermission=false` and production blocked. All participating profile, route and price evidence must be synthetic to obtain that simulation status. Mixing synthetic and documentary evidence blocks a complete proposal.

`COST_PROPOSAL_FOR_REVIEW` requires current documented planning evidence, operator-reviewed eligible net costs, exact identity/scope and complete route facts. `eligibleForQuoteCost=true` means a candidate for operator costing review, not an issued quote, legal price guarantee, manufacturer acceptance or permission to act. The qualification command changes no quote/order/purchase/payment/publication/production state. The existing manual worksheet, margin exception, issue, customer acceptance and release gates remain authoritative. No automatic apply/issue consumer was added. Any later consumer must recheck current evidence, profile, configuration and rights; it must not trust a cached eligible flag.

CRM customer-account restrictions remain distinct from supplier-login or license entitlement. Native supplier-account tariffs are not silently interpreted as licensed customer-scoped prices. This slice does not call a supplier or claim that licensed data or a real producer was verified.

Embroidery still needs exact-version proof, method-specific preflight, digitization, physical sew-out and manufacturer acceptance before release. Other methods need their own manufacturing checks; a generic profile does not activate their exporters. CAD, validated 3D and advanced manufacturing engines remain Coming Soon.

## Local evidence and remaining work

Ten integration tests exercise precise 48-item math, per-order setup, two freight legs, explicit zero vs unknown, documentary vs synthetic/mixed sources, rights revocation and historical replay, stale profiles, immutable history, saved oversized artwork, customer/operations/workspace isolation and M1 retry compatibility. The browser journey records the profile and all nine charges through actual forms, submits the 48-cap customer RFQ and displays the USD 368.00 synthetic proposal while real costing remains blocked. The two other continuation browser journeys cover saved-color binding and source/quote forms.

These are synthetic local tests, not a verified supplier/manufacturer integration. Real licensed media/catalog activation, retention/deletion operations, production acceptance and hosted persistence remain release dependencies. Product-free inquiry and complete-data outcome reporting are now implemented and tested through their existing owners. Claim truth and the original V1/CMS acceptance inventories remain separately tracked in the checklist. Final local regression and activation limits are recorded in [connected verification](CONNECTED_VERIFICATION.md).
