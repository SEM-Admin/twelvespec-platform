-- Older M1 binaries must not price a new setup/order/shipment or profile-bound
-- observation as unqualified material. Updated readers opt in per transaction.
-- This is protocol compatibility, not authorization: scoped role checks remain.
alter policy evidence_read on app.price_observations using (
 app.scope_ok(tenant_id,workspace_id)
 and current_setting('ts.role',true) in ('owner','integration_admin','sales','manager','buyer','finance')
 and (
  current_setting('ts.component_price_reader',true)='1'
  or (component_code='material_cost' and charge_basis='PER_ITEM' and process_profile_id is null and method is null and location is null)
 )
);
