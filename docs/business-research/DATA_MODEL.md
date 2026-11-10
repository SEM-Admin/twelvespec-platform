# Logical data model for the feature designs

30 logical entities and 292 named field definitions. These are original software requirements, not extracted competitor schemas or applied database migrations. No operational values are supplied. Common scope fields apply to all relevant records; relationships require normalized, scoped foreign keys.

All scoped records inherit scoped_record fields. Arrays denoting relationships require normalized join tables in physical migrations.

No credentials, personal customer data, vendor catalog dump or operational finance values are included in this research packet.

| Logical entity | Owning module | Lifecycle | Features |
| --- | --- | --- | --- |
| scoped_record | foundation | Every business record | F28, F32 |
| company_membership | crm | Invite → active → revoked | F09, F34 |
| crm_opportunity | crm | New → qualified → quoting → won/lost | F08, F34 |
| canonical_variant | catalog | Draft → reviewed → published → archived | F02, F03 |
| supplier_offer | supplier | Mapped → reviewed → eligible → stale/disabled/rolled back | F03, F16, F18 |
| media_right | catalog | Proposed → approved → expired/revoked | F03, F25 |
| configuration_revision | configuration | Draft → validated → frozen | F02, F31 |
| design_binding | creative | Editable project → immutable design revision | F05, F06, F07 |
| artwork_artifact | creative | Uploaded → scanned → reviewed → exportable | F05, F07, F31 |
| proof_decision | creative | Issued → approved/changes requested/superseded | F07 |
| preflight_review | creative | Pending → blocked/passed → invalidated | F07, F31, F35 |
| cost_evidence | estimating | Observed → validated → frozen/expired | F04, F18, F24 |
| agreement_line | sales | Draft → issued → accepted/expired → superseded | F04, F10, F13, F14, F15 |
| credit_and_payment_gate | finance | Pending → approved/verified → revoked/expired | F14, F19, F24 |
| store_program | stores | Draft → reviewed → active → closed | F09, F10, F11, F12 |
| budget_reservation | stores | Reserved → committed/released/expired | F10, F12 |
| kit_configuration | byob | Configured → priced → frozen → assembled | F13 |
| connection_profile | supplier | Draft → tested → approved → active/revoked | F16, F18, F19, F29 |
| mapping_and_sync | supplier | Draft mapping → preview → committed → scheduled | F16, F17, F18 |
| import_change | supplier | Staged → reviewed → committed → rolled back/conflict | F17 |
| job_operation | orders | Planned → ready → in progress → complete/blocked | F20, F31, F35 |
| purchase_requirement | procurement | Unallocated → allocated → purchased → received/reconciled | F20, F21 |
| purchase_submission | procurement | Pending approval → authorized → submitting → acknowledged/rejected/unknown | F19, F21 |
| shipment_allocation | fulfillment | Planned → packed → dispatched → delivered/exception | F22, F35 |
| claim_resolution | fulfillment | Opened → reviewed → authorized → resolved | F23, F24 |
| actual_cost_reference | finance | Recorded → matched/disputed → reconciled → closed | F24, F27 |
| automation_event | workflow | Committed event → delivered/retried/dead letter | F26 |
| operational_metric | analytics | Defined → computed → reconciled/exported | F27 |
| content_and_consent | marketing | Draft → reviewed → published/withdrawn | F06, F25 |
| capability_registry | future | Reserved → research only; activation requires future scope approval | F33 |

## scoped_record

**Authority:** Kernel and database. **Lifecycle:** Every business record.

**Integrity rule:** Apply these common fields to scoped domain records; never rely on a JSON workspace label for isolation.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| id | uuid | Stable record identifier. |
| tenant_id | uuid | Tenant owning the business record; resolved from the authenticated session. |
| workspace_id | uuid | Workspace owning the record; included in composite foreign keys. |
| revision | bigint | Monotonically increasing optimistic concurrency version. |
| status | enum | Entity-specific state, validated against allowed transitions. |
| created_at | timestamptz | Server creation instant; store UTC and display in the selected business timezone. |
| updated_at | timestamptz | Server update instant; never a client-supplied authority. |
| created_by | uuid | Verified actor or scoped service identity. |
| correlation_id | uuid | Trace joining command, audit event, outbox and provider attempts. |
| origin | enum | SYNTHETIC, MANUAL or documented external source; provenance is explicit. |

## company_membership

**Authority:** CRM and identity. **Lifecycle:** Invite → active → revoked.

**Integrity rule:** Unique active grant by company/contact/location/role; foreign keys include tenant/workspace and company ownership.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| company_id | uuid | Canonical customer organization. |
| contact_id | uuid | Person with account relationships; separate from authenticated login identity. |
| user_id | uuid nullable | Login identity if the person has accepted access. |
| location_id | uuid nullable | Company location grant; null means only explicitly defined company-wide access. |
| role_id | uuid | Scoped buyer role, independent of staff role. |
| catalog_assignment_id | uuid nullable | Catalog eligibility policy applicable to this membership. |
| address_policy_id | uuid nullable | Allowed ship-to and bill-to policy. |
| approval_limit | numeric(18,4) nullable | Approved purchasing authority; unknown does not mean unlimited. |
| currency | char(3) | Currency for the authority limit. |
| revoked_at | timestamptz nullable | Immediate server authorization cutoff when revoked. |

## crm_opportunity

**Authority:** CRM. **Lifecycle:** New → qualified → quoting → won/lost.

**Integrity rule:** Moving to won links an accepted agreement; it does not establish payment or shipment.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| account_id | uuid | Customer account owning the opportunity. |
| primary_contact_id | uuid | Scoped contact linked to the account. |
| owner_id | uuid | Accountable sales operator. |
| source | text | Attributable lead source without invented campaign performance. |
| stage | enum | Versioned sales pipeline stage. |
| expected_value | numeric(18,4) nullable | Sales estimate, not recognized revenue. |
| currency | char(3) | Currency of expected value. |
| required_in_hand_date | date nullable | Customer requested arrival date, distinguished from a promise. |
| next_action_at | timestamptz nullable | Scheduled follow-through. |
| closed_reason | text nullable | Required on a lost or disqualified transition. |

## canonical_variant

**Authority:** Catalog. **Lifecycle:** Draft → reviewed → published → archived.

**Integrity rule:** No automatic merge on title or unverified GTIN alone; ambiguous identity requires review.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| product_id | uuid | Canonical product family. |
| manufacturer_id | uuid nullable | Documented manufacturer identity, unknown allowed pending review. |
| brand_id | uuid nullable | Consumer/manufacturer brand, distinct from private supplier identity. |
| manufacturer_part | text nullable | Manufacturer style or part identifier with provenance. |
| gtin | text nullable | GTIN with syntax and identity verification recorded separately. |
| color_id | uuid | Normalized color with original source color retained separately. |
| size_id | uuid | Size or dimension identity; not inferred from product title. |
| material_id | uuid nullable | Material classification used by configuration rules. |
| variant_revision | bigint | Specific variant revision used in configurations. |
| publication_id | uuid nullable | Approved public projection revision. |

## supplier_offer

**Authority:** Integration Center. **Lifecycle:** Mapped → reviewed → eligible → stale/disabled/rolled back.

**Integrity rule:** Unique provider identity includes connection; new commercial use requires an eligible, current offer.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| connection_id | uuid | Authorized source connection. |
| external_product_id | text | Provider-scoped product identity. |
| external_part_id | text | Provider-scoped exact purchasable part identity. |
| canonical_variant_id | uuid | Reviewed mapping to a canonical variant. |
| source_location_id | text nullable | Warehouse or FOB identity if supplied. |
| catalog_region | text | Provider catalog geography; US/Canada remain distinct. |
| currency | char(3) | Currency in the supplied price evidence. |
| observed_at | timestamptz | When this source evidence was obtained. |
| valid_until | timestamptz nullable | Declared or configured freshness deadline. |
| import_manifest_id | uuid nullable | Originating import and rollback eligibility. |

## media_right

**Authority:** Catalog publication. **Lifecycle:** Proposed → approved → expired/revoked.

**Integrity rule:** Public asset delivery checks current rights and projection; private source details are not serialized.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| asset_id | uuid | Stored image or derivative. |
| owner_reference | text | Documented asset rights owner or contract reference. |
| source_url | text nullable | Permitted original source, without embedded credentials. |
| license_reference | text | Evidence supporting reuse; no assumed rights from public visibility. |
| allowed_channels | text[] | Permitted storefront, company store or marketing channels. |
| allowed_regions | text[] | Permitted customer regions. |
| expires_at | timestamptz nullable | Rights expiry if applicable. |
| approved_by | uuid | Authorized rights reviewer. |
| public_projection_id | uuid nullable | Publication using this license. |

## configuration_revision

**Authority:** Product rules. **Lifecycle:** Draft → validated → frozen.

**Integrity rule:** Persist relational option selections and normalized units; server recalculates compatibility, never trusts a client valid flag.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| variant_id | uuid | Exact canonical variant selected. |
| family_revision_id | uuid | Published product rule family used to validate. |
| quantity | integer | Positive quantity respecting minimum and increment. |
| method_id | uuid | Supported decoration or print method. |
| imprint_area_id | uuid | Exact eligible product print location. |
| dimensions_mm | structured decimal | Named width/height/depth with explicit conversion evidence. |
| stock_id | uuid nullable | Paper/substrate option when applicable. |
| finish_ids | uuid[] | Approved finish selection, evaluated for compatibility. |
| print_side_count | integer | Required printed sides and file roles. |
| configuration_hash | text | Hash of all manufacturing-relevant inputs and revisions. |

## design_binding

**Authority:** Creative Studio. **Lifecycle:** Editable project → immutable design revision.

**Integrity rule:** Binding tuple must match proof and order snapshots; changes create a new revision and revoke affected approvals.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| project_id | uuid | Shared customer/staff project identity. |
| design_version_id | uuid | Immutable saved layer/content revision. |
| product_id | uuid | Bound product family. |
| variant_id | uuid | Bound exact color/size variant. |
| configuration_id | uuid | Validated method, quantity and location revision. |
| template_revision_id | uuid nullable | Editable template version and locked-field policy. |
| brand_kit_revision_id | uuid nullable | Company brand rules and licensed fonts/assets. |
| document_hash | text | Hash of design content, insufficient by itself for approval reuse. |
| layer_manifest | private structured record | Layer identities and transforms with original asset references. |
| rebind_reason | text nullable | Attributable reason for changing variant or manufacturing context. |

## artwork_artifact

**Authority:** Private storage and Creative Studio. **Lifecycle:** Uploaded → scanned → reviewed → exportable.

**Integrity rule:** Serving an artifact checks tenant/resource grants and current artifact purpose; production files require completed method review.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| storage_key | private text | Opaque private object key; not an unauthenticated public URL. |
| content_hash | text | Integrity hash of exact bytes. |
| mime_type | text | Server-verified type rather than trusting the file extension. |
| byte_length | bigint | Enforced upload and processing size bound. |
| file_role | enum | Artwork front/back/mask/source/proof/production output as applicable. |
| scan_status | enum | Pending, passed, failed or unavailable; unavailable never implies clean. |
| design_version_id | uuid | Exact revision represented by the artifact. |
| render_job_id | uuid nullable | Durable derivative-generation job. |
| rights_reference | uuid nullable | Brand, font or artwork permission evidence. |
| retention_policy_id | uuid | Approved retention and deletion policy. |

## proof_decision

**Authority:** Proofing. **Lifecycle:** Issued → approved/changes requested/superseded.

**Integrity rule:** Approval requires matching project/product/variant/design/configuration and active buyer authority; rejected stale proofs remain in history.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| proof_revision_id | uuid | Named immutable proof artifact revision. |
| design_version_id | uuid | Exact design revision under review. |
| variant_id | uuid | Exact color/size variant under review. |
| configuration_hash | text | Manufacturing inputs represented by the proof. |
| proof_artifact_hash | text | Hash of reviewed bytes. |
| decision | enum | Approved or changes requested, not a generic boolean on a mutable project. |
| decided_by | uuid | Authorized buyer or delegated approver. |
| decided_at | timestamptz | Server decision timestamp. |
| decision_note | text nullable | Requested changes or qualified acknowledgement. |
| superseded_by | uuid nullable | Replacement proof revision if inputs change. |

## preflight_review

**Authority:** Qualified prepress operator. **Lifecycle:** Pending → blocked/passed → invalidated.

**Integrity rule:** Aggregate pass requires all applicable checks; a manual result is permissioned and attributable, never an unconditional escape hatch.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| artifact_id | uuid | Exact production artifact under review. |
| manufacturing_revision_id | uuid | Method-specific specification revision. |
| check_profile_version | text | Versioned review checklist for the selected method. |
| check_code | text | Examples: resolution, bleed, text outline, print area or digitization evidence. |
| result | enum | Passed, failed, manual review required or not applicable with reason. |
| reviewer_id | uuid nullable | Required for a manual check decision. |
| evidence_reference | text nullable | Private report or evidence supporting the decision. |
| reviewed_at | timestamptz nullable | Server completion time. |
| invalidated_reason | text nullable | Input or policy change revoking the result. |

## cost_evidence

**Authority:** Estimating. **Lifecycle:** Observed → validated → frozen/expired.

**Integrity rule:** Negative or non-finite values are rejected; all required components must be known for a firm price; do not round unit costs to cents first.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| offer_id | uuid | Exact eligible supplier offer. |
| component_code | enum | Blank, decoration, setup, prepress, packaging, labor, freight or other direct component. |
| unit_cost | numeric(20,8) nullable | Supplier precision retained; unknown remains null. |
| quantity | integer | Quantity to which the unit value applies. |
| quantity_basis | enum | Per item, per setup, per shipment or per kit; prevents double extension. |
| extended_cost | numeric(20,8) nullable | Precise amount before commercial rounding. |
| currency | char(3) | Currency with explicit FX policy if conversion is authorized. |
| price_break_minimum | integer nullable | Applicable quantity tier threshold. |
| source_quote_reference | text nullable | External quote or rate identifier with expiry. |
| assumption_status | enum | Verified evidence, explicit estimate or unknown. |

## agreement_line

**Authority:** Sales agreement. **Lifecycle:** Draft → issued → accepted/expired → superseded.

**Integrity rule:** Snapshot includes quantities, prices, terms and assumptions; customer projection excludes source identity, supplier costs and credentials.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| agreement_revision_id | uuid | Immutable commercial revision. |
| seller_id | uuid | Assigned legal seller rather than the first available seller record. |
| configuration_id | uuid | Frozen product/method/options snapshot. |
| design_binding_id | uuid nullable | Exact design and relevant proof decision. |
| store_context_id | uuid nullable | Program, company/location, brand-kit and allowance context. |
| kit_configuration_id | uuid nullable | Frozen kit bill of materials and assembly rules. |
| cost_snapshot_id | uuid | Internal frozen source and landed cost evidence. |
| net_revenue | numeric(18,4) | Customer amount excluding separately collected tax. |
| currency | char(3) | Commercial currency. |
| valid_until | timestamptz | Acceptance expiry for this agreement revision. |

## credit_and_payment_gate

**Authority:** Finance approvals and provider evidence. **Lifecycle:** Pending → approved/verified → revoked/expired.

**Integrity rule:** Acceptance and exposure reservation must be atomic; a checkout redirect cannot satisfy the evidence gate.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| account_id | uuid | Account whose aggregate exposure is evaluated. |
| credit_approval_id | uuid nullable | Explicit qualifying credit decision, never inferred from order history alone. |
| credit_limit | numeric(18,4) nullable | Approved exposure ceiling. |
| open_exposure | numeric(18,4) | Recalculated relevant outstanding commitments. |
| completed_order_count | integer | Defined qualifying order history used by prepaid policy. |
| required_payment_amount | numeric(18,4) | Required prepaid/deposit amount for the exact agreement. |
| provider_event_id | text nullable | Verified payment event; globally unique within provider/account scope. |
| payment_state | enum | Required, authorized, captured, refunded or disputed as supported. |
| payout_reference | text nullable | Processor settlement reference, distinct from customer payment. |
| supplier_charge_reference | text nullable | Provider payable event, distinct from customer receipt. |

## store_program

**Authority:** Company store administration. **Lifecycle:** Draft → reviewed → active → closed.

**Integrity rule:** Program context is a first-class foreign key in commercial records; closing a program does not silently purchase or settle funds.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| type | enum | Company, school, event, pop-up, redemption or fundraiser reference program. |
| company_id | uuid | Customer organization controlling this program. |
| catalog_revision_id | uuid | Permitted product assignments. |
| brand_kit_revision_id | uuid nullable | Required artwork policy. |
| starts_at | timestamptz nullable | Server-enforced opening boundary. |
| closes_at | timestamptz nullable | Server-enforced closing boundary. |
| business_timezone | iana timezone | Timezone for displayed campaign deadlines and business calendars. |
| approval_policy_id | uuid | Versioned buyer/manager policy. |
| funding_type | enum | Buyer payment, company allowance or redemption; settlement rules remain separate. |
| settlement_status | enum | Reference-only/blocked where complex settlement is unimplemented. |

## budget_reservation

**Authority:** Store budget ledger. **Lifecycle:** Reserved → committed/released/expired.

**Integrity rule:** Lock the budget row and check limit minus spent minus reserved; commitment and release are each exactly-once transitions.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| budget_id | uuid | Scoped budget with an approved limit and currency. |
| buyer_membership_id | uuid | Eligible buyer and location grant. |
| agreement_revision_id | uuid | Exact commitment being reserved. |
| amount | numeric(18,4) | Reservation amount under the policy-defined tax/freight treatment. |
| currency | char(3) | Budget currency; no implicit conversion. |
| idempotency_key | text | Stable key for this reservation request. |
| expires_at | timestamptz nullable | Expiry tied to quote/program policy. |
| approval_id | uuid nullable | Required scoped approval for the reservation. |
| release_reason | enum nullable | Cancelled, expired, replaced or rejected. |
| committed_at | timestamptz nullable | Transition into spent/consumed usage per approved policy. |

## kit_configuration

**Authority:** Bundle builder and MIS. **Lifecycle:** Configured → priced → frozen → assembled.

**Integrity rule:** Commercial lines retain kit identity; component and packaging quantities extend from kit quantity and remain traceable to jobs.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| template_revision_id | uuid | Permitted kit template and component rules. |
| component_variant_id | uuid | Exact component identity, one relational row per component. |
| component_quantity | integer | Required quantity per kit. |
| optional_group_id | uuid nullable | Mutually exclusive or optional group identity. |
| packaging_spec_id | uuid | Box, filler, insert and other approved packaging. |
| assembly_operation_id | uuid | Required assembly and labor specification. |
| kit_quantity | integer | Ordered number of complete kits. |
| inbound_destination_id | uuid | Assembly receiving location. |
| component_cost_snapshot_id | uuid | Exact cost basis, with freight legs separated. |
| assembly_qc_policy_id | uuid | Completeness and quality checks before dispatch. |

## connection_profile

**Authority:** Integration Center. **Lifecycle:** Draft → tested → approved → active/revoked.

**Integrity rule:** A successful capability test changes only that operation; live purchase activation requires independent explicit authorization.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| provider_type | enum | Direct PromoStandards, reviewed REST, licensed ASI, CSV/XML, POD, shipping or accounting. |
| profile_id | text | Registered adapter/schema identity. |
| profile_version | text | Pinned reviewed provider contract version. |
| environment | enum | Mock, sandbox or approved live. |
| secret_handle | opaque text | Server-only managed secret reference, never plaintext credentials. |
| allowed_endpoint_id | uuid | Reviewed HTTPS host/service allowlist entry. |
| entitlement_reference | uuid nullable | Account/API/media license evidence required for activation. |
| capability | enum | One independent product/media/stock/price/PO/status/shipment/invoice operation. |
| verification | enum | NOT_CONFIGURED, MOCKED, SANDBOX_VERIFIED, LIVE_VERIFIED or BLOCKED. |
| verified_at | timestamptz nullable | When exact capability evidence was collected. |

## mapping_and_sync

**Authority:** Import and synchronization service. **Lifecycle:** Draft mapping → preview → committed → scheduled.

**Integrity rule:** Mapping preview performs no publication or supplier spend; independent cursors and retry state preserve partial progress.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| connection_id | uuid | Scoped source connection. |
| mapping_revision | bigint | Immutable field and option mapping revision. |
| source_field | text | Source schema/file field name. |
| canonical_field | text | Allowlisted canonical target. |
| transform_id | text nullable | Approved bounded transform, never arbitrary user-supplied execution. |
| unit_and_currency_policy | structured record | Explicit conversions with unknown handling. |
| operation | enum | Catalog, inventory, pricing or order status, each independent. |
| cursor | private structured value nullable | Provider-specific continuation/resume cursor. |
| freshness_seconds | integer | Configured maximum age for the operation’s evidence. |
| last_success_at | timestamptz nullable | Last completed operation, not a global connection success timestamp. |

## import_change

**Authority:** Staged import pipeline. **Lifecycle:** Staged → reviewed → committed → rolled back/conflict.

**Integrity rule:** Commit is idempotent and scoped; rollback requires the expected committed revision and never overwrites later edits.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| import_file_id | uuid | Private input file with checksum and bounded size. |
| mapping_revision_id | uuid | Mapping used for this exact preview. |
| row_number | integer | Attributable input location or XML path index. |
| source_identity | text | Provider-scoped stable identity for matching. |
| proposed_target_id | uuid nullable | Existing or proposed canonical/source target. |
| before_revision | bigint nullable | Expected target revision at commit. |
| field_diff | structured record | Reviewable before/after values with sensitive fields redacted. |
| validation_errors | structured list | Row/field-level actionable errors. |
| committed_revision | bigint nullable | Target revision produced by commit. |
| rollback_state | enum | Not applied, reversible, rolled back or conflict requiring review. |

## job_operation

**Authority:** Print MIS. **Lifecycle:** Planned → ready → in progress → complete/blocked.

**Integrity rule:** Dependency graph is acyclic; operations cannot consume more eligible quantity than received/completed predecessors.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| order_line_id | uuid | Frozen customer requirement being fulfilled. |
| job_id | uuid | Production/sourcing job containing this operation. |
| operation_type | enum | Supply, decorate, print, assemble, inspect, pack or dispatch. |
| predecessor_id | uuid nullable | Relational dependency; multiple dependencies use join rows. |
| assigned_resource_id | uuid nullable | Qualified internal resource or reviewed external route. |
| manufacturing_revision_id | uuid | Exact operation specifications and production file binding. |
| required_quantity | integer | Authorized quantity needed by the next operation. |
| completed_quantity | integer | Accepted completed quantity, separate from rejected/waste quantity. |
| hold_reason | enum nullable | Artwork, payment, supply, QC, scheduling or reconciliation cause. |
| actual_minutes | numeric(18,4) nullable | Recorded operator time, never fabricated as zero. |

## purchase_requirement

**Authority:** MIS sourcing. **Lifecycle:** Unallocated → allocated → purchased → received/reconciled.

**Integrity rule:** Lock the requirement when allocating; sum of active allocations cannot exceed required quantity without an explicit revised authorization.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| job_operation_id | uuid | Operation requiring this external purchase. |
| source_offer_id | uuid | Selected eligible source evidence. |
| required_quantity | integer | Quantity that must be bought for the authorized requirement. |
| allocated_quantity | integer | Quantity assigned to active PO lines. |
| received_quantity | integer | Accepted actual receipts against this requirement. |
| agreement_hash | text | Frozen customer agreement relevant to the purchase. |
| route_revision | bigint | Version of the approved sourcing route. |
| cost_snapshot_id | uuid | Expected supplier cost and currency. |
| allocation_state | enum | Unallocated, partially allocated, fully allocated or exception. |

## purchase_submission

**Authority:** Purchasing and provider adapter. **Lifecycle:** Pending approval → authorized → submitting → acknowledged/rejected/unknown.

**Integrity rule:** Unique active requirement allocation and submission intent; post-write timeout freezes retry until reconciliation establishes outcome.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| po_revision_id | uuid | Exact immutable PO revision. |
| requirement_id | uuid | Referenced requirement through PO line allocation. |
| connection_id | uuid | Approved purchasing connection. |
| payload_hash | text | Hash of supplier-visible payload and selected source. |
| approved_amount | numeric(18,4) | Spend ceiling for this exact submission. |
| currency | char(3) | Approved spend currency. |
| approval_id | uuid | Authorized reviewer, scope, reason and expiry. |
| idempotency_key | text | Durable request key retained across permissible retry. |
| external_order_id | text nullable | Supplier acknowledgment identity if known. |
| outcome_evidence | private structured record | Redacted response or reconciliation evidence; uncertainty is explicit. |

## shipment_allocation

**Authority:** Fulfillment. **Lifecycle:** Planned → packed → dispatched → delivered/exception.

**Integrity rule:** Total active shipment quantities cannot exceed authorized fulfilled quantity; supplier tracking does not buy a second label.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| shipment_id | uuid | Package/group shipment identity. |
| order_line_id | uuid | Customer line whose quantity ships. |
| job_id | uuid | Source job and completed quantity evidence. |
| quantity | integer | Positive fulfilled quantity attributed to this shipment. |
| destination_snapshot_id | uuid | Frozen authorized recipient/delivery address. |
| origin_reference | private text | Source fulfillment location; keep internal supplier details private. |
| carrier_code | text nullable | Actual carrier identifier when provided. |
| tracking_number | private text nullable | Tracking reference with customer-scoped visibility. |
| blind_ship_policy_id | uuid nullable | Allowed packaging/return identity requirements. |
| external_event_id | text nullable | Deduplication identity for a provider tracking event. |

## claim_resolution

**Authority:** Customer service and finance. **Lifecycle:** Opened → reviewed → authorized → resolved.

**Integrity rule:** Customer resolution does not imply supplier reimbursement; remakes and refunds are separate auditable workflows.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| order_line_id | uuid | Affected original commercial line. |
| affected_quantity | integer | Claimed quantity within the delivered/purchased history. |
| reason_code | enum | Damage, quality, art mismatch, shortage or other reviewed reason. |
| evidence_asset_id | uuid nullable | Private supporting photos or documents. |
| customer_resolution | enum | Replacement, partial refund, full refund, credit or declined. |
| resolution_approval_id | uuid nullable | Required authority and monetary limit. |
| remake_order_id | uuid nullable | New authorized work linked to the original cause. |
| refund_reference_id | uuid nullable | Verified customer financial outcome. |
| supplier_recovery_id | uuid nullable | Independent reimbursement/credit claim against a supplier. |

## actual_cost_reference

**Authority:** Finance reconciliation. **Lifecycle:** Recorded → matched/disputed → reconciled → closed.

**Integrity rule:** Deduplicate by provider/account/document/line; closeout distinguishes estimated vs actual direct profit and excludes sales tax revenue.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| order_id | uuid | Customer order receiving cost attribution. |
| job_id | uuid nullable | More precise operation/job cost attribution where known. |
| component_code | enum | Direct cost category consistent with the estimate model. |
| amount | numeric(18,4) | Actual cost or credit with explicit sign convention. |
| currency | char(3) | Original transaction currency. |
| external_document_id | text | Supplier invoice, shipping charge or accounting reference. |
| external_line_id | text nullable | Source document line to prevent duplicate matching. |
| estimated_snapshot_id | uuid nullable | Frozen estimate used for variance analysis. |
| reconciliation_state | enum | Unmatched, partial, matched or disputed. |
| approved_adjustment_reason | text nullable | Reason for a reviewed variance or credit. |

## automation_event

**Authority:** Kernel outbox and worker. **Lifecycle:** Committed event → delivered/retried/dead letter.

**Integrity rule:** Insert outbox and domain update in one transaction; worker retries never create an unapproved live side effect.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| event_id | uuid | Stable event identity across delivery attempts. |
| event_type | text | Registered versioned domain event name. |
| schema_version | integer | Payload schema version. |
| aggregate_id | uuid | Business record producing the event. |
| aggregate_revision | bigint | Exact state revision that emitted the event. |
| causation_id | uuid nullable | Command/event causing this event. |
| occurred_at | timestamptz | Committed domain occurrence time. |
| payload | bounded structured record | Allowed data only; avoid secrets and unnecessary recipient data. |
| automation_revision_id | uuid nullable | Approved rule version consuming the event. |
| effect_key | text nullable | Stable scoped key preventing duplicate downstream effects. |

## operational_metric

**Authority:** Reporting query service. **Lifecycle:** Defined → computed → reconciled/exported.

**Integrity rule:** Use database aggregations over scoped data; pagination size never defines the business total.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| metric_code | text | Stable business metric name. |
| definition_revision | integer | Versioned numerator, denominator and inclusion rules. |
| period_start | timestamptz | Inclusive time bucket start. |
| period_end | timestamptz | Exclusive time bucket end. |
| business_timezone | iana timezone | Timezone determining reporting boundaries. |
| numerator | numeric nullable | Computed whole-dataset numerator, null if unavailable. |
| denominator | numeric nullable | Computed denominator; zero yields a defined unavailable ratio. |
| data_as_of | timestamptz | Freshness cutoff for all included facts. |
| source_query_hash | text | Reproducible scoped query/version reference. |
| reconciliation_reference | uuid nullable | Evidence tying a report to authoritative records. |

## content_and_consent

**Authority:** Marketing/CMS. **Lifecycle:** Draft → reviewed → published/withdrawn.

**Integrity rule:** CMS publishing and external sending have separate grants and activation gates; demo changes create drafts/local references only.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| content_revision_id | uuid | Immutable content revision under review. |
| channel | enum | Storefront, company store or explicitly authorized messaging channel. |
| audience_id | uuid nullable | Scoped intended audience. |
| brand_kit_revision_id | uuid nullable | Brand rules applying to this content. |
| rights_manifest_id | uuid | Approved licenses for all media and fonts. |
| publication_approval_id | uuid nullable | Authorized content reviewer and revision. |
| publish_at | timestamptz nullable | Scheduled publication time. |
| consent_reference | uuid nullable | Documented permission for applicable external communications. |
| suppressed_at | timestamptz nullable | Opt-out/suppression that imports cannot silently clear. |
| external_delivery_reference | text nullable | Actual delivery evidence, not a UI success message. |

## capability_registry

**Authority:** Foundation module registry. **Lifecycle:** Reserved → research only; activation requires future scope approval.

**Integrity rule:** Coming Soon must be enforced server-side; collecting research does not change availability.

| Field | Proposed type | Meaning |
| --- | --- | --- |
| capability_code | text | Stable feature identifier. |
| module_code | text | Owning module. |
| availability | enum | ACTIVE_V1_SPEC or COMING_SOON. |
| research_note | text nullable | Public inspiration without working activation controls. |
| activation_reason | text nullable | Explicit reason an operation remains unavailable. |
| server_command_policy | enum | Deny reserved commands even if manually requested. |
