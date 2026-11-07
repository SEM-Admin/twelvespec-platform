# Integration Center — explicit UI and implementation contract

## Navigation and workflow
`Business → Integrations → Add connection` presents cards: PromoStandards supplier / Direct REST / ASI SmartLink (authorized) / Upload CSV / Upload XML / Shipping / POD / Accounting. Wizard steps: (1) choose provider/format, (2) name supplier account & environment, (3) enter secret server-only, (4) verify identity and per-service capability, (5) select scope + schedule, (6) configure mappings/price policy, (7) preview staged data, (8) run sample quote/variant/artwork checks, (9) publish eligible subset. Connections show `NOT_CONFIGURED`, `CREDENTIALS_SAVED`, `VERIFICATION_PENDING`, `VALIDATED`, `PARTIALLY_CAPABLE`, `ERROR`, `DISABLED` plus separate `MOCKED/SANDBOX_VERIFIED/LIVE_VERIFIED/BLOCKED` per capability.

## Credential interface
Fields vary by provider (`username/password/accountNumber`, `apiKey`, `clientId/clientSecret`, OAuth redirect/token). Browser submits via authenticated HTTPS form directly to admin route; server authenticates OWNER/INTEGRATION_ADMIN, verifies CSRF/origin, validates provider ID and allowed host, saves secret in KMS-managed secret store and saves only opaque reference and last four chars. Update is replacement, not retrieval. Tokens and passwords NEVER returned in GET. Audit actor/time/action, never plaintext values. Test connection server-side with 10s bounded connect/read timeout and redacted diagnostics.

## PromoStandards
Use supplier-scoped SOAP/WSDL operation adapters. Version/service are independent: product, media, inventory, pricing/configuration, PO, status, ASN, invoice. Directory discovery hints endpoints but is not auth. Supplier-specific request body and SOAP schema are generated/validated from actual supplier WSDL/XSD. Disallow arbitrary WSDL fetch from user-supplied URLs: only allowlisted HTTPS hosts and bounded redirects. Verify API credentials separate from supplier website login. Do not infer production order submission from catalog connectivity.

## ESP+/ASI
Ordinary ESP+ product access ≠ SmartLink API authorization. Setup must show `Account ID`, `Developer API Client ID`, `Secret/token` and `API entitlement verified`; help text directs user to ASI SmartLink developer agreement. Treat ESP Updates / Connect APIs as distinct adapters; never scrape the ESP+ website or store a regular UI password for a service it cannot authenticate. Respect catalog licensing, image redistribution, retention, rate limits, brand rights and logging obligations. Provider API specifics remain gated until official tenant entitlement/schema is supplied.

## CSV / XML pipeline
Upload via private signed multipart path → MIME+magic-size validation → streaming parse with max rows/bytes, no DTD/external entities, namespace-safe selector validation → column/tree inference → preview mapping wizard → staged immutable raw + normalized validation issues → human diff/override → product match/variant group rules → costing preview → publish with rollback snapshot. Show red/amber/green row outcomes, versioned mapping profiles, dry-run affected counts, and audit. Files should contain no executable formulas during CSV exports; escape spreadsheet formula prefixes on output.

## Source matching
Priority: verified GTIN/UPC+brand, supplier MPN+brand, controlled candidate similarity for manual review. Never merge by title alone. Exact variants require color/size/part mapping and uniqueness. Reject invalid price breaks, negative weight, ambiguous currency, missing MOQ, conflicting color/image mapping. A stock value of 0 or unknown is not automatically out of stock if provider semantics differ.

## Refresh policy
At least separate cadence and freshness windows for static descriptions/media, price breaks, live inventory and PO status. User-configured schedules can only be as aggressive as contract/rate limits. Publish eligibility is computed separately from sync success. Mark products `REQUEST_QUOTE_ONLY` when inputs cannot safely support committed checkout.

## Integration admin UX exception states
Expired token, unsupported service/version, supplier rejected credentials, rate-limited, mapping-conflict, stale-cost, missing variant, wrong currency, quote expired, PO uncertain, webhook invalid, missing asset license. Every error shows next safe action and preserves stable source lineage.
