# Research-backed standards and interoperability

**Verified primary source findings (checked Nov 2026):**

1. **PromoStandards** defines independently versioned Product Data, Media Content, Inventory, Pricing & Configuration, Purchase Order, Order Status, Order Shipment Notice and Invoice services. It is a protocol publisher, **not a shared universal authenticated catalog**. Published directory REST endpoints discover listed companies and service versions. Supplier WSDL/schema is the effective wire contract; supplier variations require integration-specific tests. S&S provides public endpoints and separate test PO endpoint. Sources: https://promostandards.org/standards-services-api/ ; https://promostandards.org/how-promostandards-makes-your-business-better/ ; https://promostandards.ssactivewear.com/ ; https://api.stregisgrp.com/documentation/promostandards/
2. **ESP+/ASI**: ASI's Developers site separately lists SmartLink API, ESP Updates API, Connect API. SmartLink exposes products/search, products/:id, suppliers, decorators, media and is advertised for custom ecommerce/back-office. ESP Updates is supplier-facing product data updates, not a general distributor catalog read channel. Connect authentication describes specific license/member types. A user ESP+ login alone is not documented as granting custom API access. Source: https://developers.asicentral.com/ ; https://developers.asicentral.com/Smartlink ; https://developers.asicentral.com/Smartlink/Api ; https://developers.asicentral.com/v5/EspUpdates ; https://developers.asicentral.com/connect/auth
3. **CSV**: RFC 4180 conventions for header, escaped quotes, quoted commas/newlines. Accept UTF-8 with BOM and enforce size/row/field limits; never eval import data. Source: https://www.rfc-editor.org/info/rfc4180/
4. **XML**: reject DTD/entity declarations and any external entity resolution. Enforce size/tree depth limits. Source: https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html
5. **API**: OpenAPI 3.1 schema, JSON Schema 2020-12; idempotency key for non-read operations; defined errors and versioning. Source: https://learn.openapis.org/upgrading/v3.0-to-v3.1.html
6. **Secrets**: short-lived credentials where possible, vault/KMS encryption, rotation, least privilege, masked UX, audit, no raw secrets in logs. Source: https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet
7. **Identity**: enforce MFA for privileged administrators, session controls, authz every request; align policies with NIST SP 800-63B-4. Source: https://pages.nist.gov/800-63-4/sp800-63b.html

## Standards selected for the engineering contract

- OpenAPI 3.1 for synchronous public/admin API contracts.
- JSON Schema 2020-12 for canonical payload and provider mapping validation.
- UUID primary keys, ISO 8601 UTC timestamps, ISO 4217 currencies, decimal money and immutable quotations.
- Signed webhook envelopes and outbox/inbox for retries; document an event catalog before introducing an event bus.
- PromoStandards service WSDL/version per supplier, with explicit mapping fixtures and a difference report when supplier contracts diverge.
- CSV RFC 4180 dialect and constrained XML profile with data-only parsing, schema detection and quarantine.
- WCAG 2.2 AA as accessible UI design target; accessibility tests at each release.

## Red lines

Do not design customer website login scraping as an ESP+ API. Never presume SAGE/ASI redistribution rights. Do not scrape third-party catalog data into production. PSRESTful may be studied for capabilities but is prohibited as runtime component.
