# Research decisions and limits

Reviewed 2026-11-07 against public primary documentation and the controlling handoff. Documentation is evidence about a documented interface or standard; it is not evidence that TwelveSpec has the entitlement, credentials, correct deployed configuration, licensed artwork or a verified transaction. No vendor account, production service or external commercial operation was accessed.

The implementation decisions below are engineering proposals constrained by the handoff. They do not silently add JDF machine integration, automatic PDF/X production, a specific payment processor or a specific POD/carrier vendor to active V1. Vendor examples guide adapter boundaries and failure semantics.

## R01: S&S PromoStandards service directory

Source: [S&S PromoStandards service directory](https://promostandards.ssactivewear.com/).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Product, media, inventory, pricing, PO, order status, shipment notification and invoice have independent service/version endpoints.

TwelveSpec decision: Version and verify each capability separately; do not treat one Product Data fixture as the full integration.

## R02: ASI developer API families

Source: [ASI developer API families](https://developers.asicentral.com/).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: ASI lists Smart Link, ESP Updates and Connect as separate API families; detailed access is authenticated.

TwelveSpec decision: Keep entitlement and schema requirements distinct. No ESP+ website scraping or invented wire contract.

## R03: ASI SmartLink product description

Source: [ASI SmartLink product description](https://asicentral.com/smart-link-page/).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: ASI describes SmartLink as an API for custom commerce powered by ESP+. This page supplies no account-specific protocol or redistribution agreement.

TwelveSpec decision: Implement the licensed interface after authorized schemas and contract terms arrive; public marketing copy is insufficient for activation.

## R04: Supabase Postgres SSL enforcement

Source: [Supabase Postgres SSL enforcement](https://supabase.com/docs/guides/platform/ssl-enforcement).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Verified hostname and CA validation require the database CA certificate available in project Database settings. Changing server enforcement can restart the database.

TwelveSpec decision: Obtain the approved project certificate; keep TLS verification on. Do not change server enforcement to repair a client trust-chain error.

## R05: Cloudflare Containers filesystem lifecycle

Source: [Cloudflare Containers filesystem lifecycle](https://developers.cloudflare.com/containers/faq/).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Container disks are ephemeral by default. Sleeping and restarting uses a fresh image filesystem; snapshots are point-in-time, not continuous database durability.

TwelveSpec decision: Keep PostgreSQL authoritative outside the container and store artwork separately. Do not mount PostgreSQL data on an object-store FUSE filesystem.

## R06: Cloudflare R2 bucket exposure

Source: [Cloudflare R2 bucket exposure](https://developers.cloudflare.com/r2/buckets/public-buckets/).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: R2 buckets require explicit action to become public. A public r2.dev route remains an alternative route even when a custom-domain Access policy exists.

TwelveSpec decision: Use a dedicated private bucket with public routes disabled and an authorized application asset endpoint. Provisioning remains a separate approval gate.

## R07: Supabase Vault

Source: [Supabase Vault](https://supabase.com/docs/guides/database/vault).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Vault encrypts stored secrets and exposes decrypted values through a SQL view; that view must be protected by SQL privileges.

TwelveSpec decision: Prefer a scoped server-only secret broker over broad access to decrypted_secrets. Test ACLs, rotation and restore before accepting real supplier secrets.

## R08: Cloudflare Secrets Store access control

Source: [Cloudflare Secrets Store access control](https://developers.cloudflare.com/secrets-store/access-control/).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Secret metadata read access differs from consumption/binding permission. Binding a secret needs Edit permission and an appropriate consuming-service scope.

TwelveSpec decision: Use platform secrets for deployment bootstrap; avoid granting an ordinary supplier setup form account-wide secret administration.

## R09: Supabase backup coverage

Source: [Supabase backup coverage](https://supabase.com/docs/guides/platform/backups).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Database backups exclude Storage API object bytes; custom role passwords also require restoration handling.

TwelveSpec decision: Restore database records, object bytes, secret access and role credentials together in an isolated drill. A successful local database dump alone is insufficient.

## R10: PostgreSQL row security

Source: [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: RLS policies apply in addition to grants; owners and bypass roles need special attention, and permissive policies combine with OR.

TwelveSpec decision: Test the actual restricted runtime role for every exposed resource and operation, including composite relationships and security-definer functions.

## R11: PostgreSQL concurrency control

Source: [PostgreSQL concurrency control](https://www.postgresql.org/docs/current/transaction-iso.html).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Read Committed does not serialize competing business decisions. Serializable transactions can require retries.

TwelveSpec decision: Lock budget and credit aggregates, enforce unique business keys, and retry only database-safe conflicts. Never blindly replay an ambiguous provider write.

## R12: PostgreSQL exact numeric types

Source: [PostgreSQL exact numeric types](https://www.postgresql.org/docs/current/datatype-numeric.html).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Numeric supports exact decimal operations; floating-point types are inexact. Declared numeric scales can round stored values.

TwelveSpec decision: Retain supplier unit precision through extension; round at declared money boundaries and test tier edges, allocation residuals and aggregate totals.

## R13: OWASP secrets lifecycle

Source: [OWASP secrets lifecycle](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Secret controls include least privilege, revocation, rotation and preventing plaintext logging.

TwelveSpec decision: Replacement-only admin forms, opaque references, worker-only resolution, redacted diagnostics and rotation evidence are required.

## R14: OWASP file upload defenses

Source: [OWASP file upload defenses](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: File defenses combine type checks, limits, isolated storage and appropriate scanning or content reconstruction.

TwelveSpec decision: Add persistent quarantine, scanner results and safe derivatives. Do not mark a magic-byte match as production-safe artwork.

## R15: OWASP SSRF defenses

Source: [OWASP SSRF defenses](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Destination allowlisting must be combined with resolved-address and connection-time protections; domain checks alone do not stop rebinding.

TwelveSpec decision: Retain pinned public DNS, TLS validation, response bounds and redirect rejection for supported profiles, including retries and media ingestion.

## R16: OWASP XML entity controls

Source: [OWASP XML entity controls](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: DTD/entity resolution and external resource loading require explicit hardening, including validation and transformation paths.

TwelveSpec decision: Expand nested XML mapping with bounded selectors and namespaces without allowing external entities, XInclude or remote schema fetches.

## R17: OWASP spreadsheet formula injection

Source: [OWASP spreadsheet formula injection](https://community.owasp.org/attacks/CSV_Injection).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Spreadsheet applications can interpret exported user values as formulas. Escaping behavior varies, including save/reopen behavior and locale variants.

TwelveSpec decision: Centralize export handling and test control characters, delimiters, Unicode and supported spreadsheet behavior; do not claim universal safety from a prefix regex.

## R18: CIP4 job and process separation

Source: [CIP4 job and process separation](https://www.cip4.org/print-automation/jdf).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: JDF/XJDF concepts distinguish product intent, process resources and operational feedback to an MIS.

TwelveSpec decision: Model separate materials, decorator operations, QC and actual costs. Use this as design guidance; a machine JDF adapter is not added to V1 scope.

## R19: Ghent Workgroup printing PDF guidance

Source: [Ghent Workgroup printing PDF guidance](https://gwg.org/solutions/printing-pdfs/).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Print-file quality depends on issues such as fonts, color spaces, transparency and applicable specifications.

TwelveSpec decision: Separate visual approval from method-specific production-file review, with verified evidence for a released derivative.

## R20: Ghent Workgroup sign/display profile

Source: [Ghent Workgroup sign/display profile](https://gwg.org/download/sign-display-specification/).

Access/evidence: The public description identifies the sign/display profile; the download redirects to GWG login. No full profile or numeric production thresholds were reviewed.

Documented finding: Large-format digital workflows have a dedicated specification rather than one universal PDF profile.

TwelveSpec decision: Store a versioned method/provider profile for zones, bleed, resolution and output requirements. Fixed generic DPI/bleed rules are not universal.

## R21: Stripe webhook delivery semantics

Source: [Stripe webhook delivery semantics](https://docs.stripe.com/webhooks).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Events can be repeated and delivered out of order; endpoint verification and event identifiers matter.

TwelveSpec decision: Use provider-specific signature validation, durable inbox records and current-object reconciliation. Stripe is a researched example, not an activated processor.

## R22: QuickBooks webhook recovery

Source: [QuickBooks webhook recovery](https://static.developer.intuit.com/output_html/qbo/docs/develop/webhooks/best-practices.html).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Intuit recommends prompt asynchronous acknowledgment and CDC recovery for missed changes; events can arrive out of sequence.

TwelveSpec decision: Keep the external ledger authoritative, map company/realm and provider IDs, and reconcile references without duplicate ledger writes.

## R23: QuickBooks sandbox credentials

Source: [QuickBooks sandbox credentials](https://developer.intuit.com/app/developer/qbo/docs/get-started/get-client-id-and-client-secret).

Access/evidence: The indexed official documentation describes separate sandbox/live credentials; the rendered page returned an application shell. Verify account-specific setup in the authorized portal.

Documented finding: Intuit distinguishes sandbox and live credentials.

TwelveSpec decision: Require a dedicated authorized sandbox company and OAuth scopes before calling an accounting integration verified.

## R24: EasyPost tracking versus label purchase

Source: [EasyPost tracking versus label purchase](https://docs.easypost.com/guides/tracking-guide).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Existing carrier tracking can be registered without buying another shipping label; label purchase also creates tracking.

TwelveSpec decision: Represent supplier tracking and merchant-purchased labels as separate operations and guard duplicate postage purchases. No carrier account was accessed.

## R25: Printful variant and artwork API

Source: [Printful variant and artwork API](https://developers.printful.com/docs/).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Printful documents individual variant identities, print-file requirements, mockup tasks and cost estimates.

TwelveSpec decision: The POD adapter must bind exact variant, placement, file and quote evidence. This research does not select a provider or prove a customer entitlement.

## R26: FTC commercial email guidance

Source: [FTC commercial email guidance](https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Commercial email has sender identification and opt-out obligations; message purpose affects classification.

TwelveSpec decision: Keep a suppression ledger and approved sender templates; require jurisdiction and legal review before sending. V1 test environments never send real campaigns.

## R27: WCAG 2.2

Source: [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: Accessibility criteria are testable across devices and cover more than an automated scan alone can establish.

TwelveSpec decision: Test keyboard, focus, labels, contrast and error recovery across all 86 screens, with manual assistive-technology review for the owner journeys.

## R28: NIST digital identity revision 4

Source: [NIST digital identity revision 4](https://pages.nist.gov/800-63-4/).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: The current identity series addresses identity proofing, authenticator management and federation as distinct concerns.

TwelveSpec decision: Design production staff authentication and recovery explicitly; owner-email OTP plus a shared demo password is only the current preview arrangement.

## R29: GS1 GTIN validation guidance

Source: [GS1 GTIN validation guidance](https://support.gs1.org/support/solutions/articles/43000734070/).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: GTIN validation and Verified by GS1 address identity checks beyond accepting a numeric string.

TwelveSpec decision: Separate syntax/check-digit validity from verified identity; require brand/manufacturer evidence and manual resolution of ambiguous matches.

## R30: Supabase CLI v3 breaking changes

Source: [Supabase CLI v3 breaking changes](https://supabase.com/changelog/supabase-cli-v3).

Access/evidence: Primary documentation text reviewed; account-specific access is not established.

Documented finding: CLI v3 changed target selection, confirmation behavior and removed/deprecated commands.

TwelveSpec decision: Pin the CLI when introduced and discover commands with help. Verify local versus approved development targets explicitly; do not upgrade migration tooling incidentally.

## Contract details that public research cannot settle

- ASI authentication/scopes, rate limits, cache/retention and image redistribution must come from the entitled account agreement and official schemas.
- Supplier credentials, service versions, decoration charges, order types and permitted sandbox writes must be verified per supplier and operation.
- Supplier print profiles, production tolerances, stock/manufactured-item meanings and art/font licensing must not be guessed from generic examples.
- Regional tax, customer credit, returns/refunds, fundraiser handling and communication law need the owner-approved legal/financial rules before live effects.
- CLI and SDK versions must be pinned and checked again during implementation; research is dated and is not an instruction to upgrade dependencies blindly.
