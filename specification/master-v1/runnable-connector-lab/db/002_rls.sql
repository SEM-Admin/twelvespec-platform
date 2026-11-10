-- Security RLS DIRECTION, not deploy-ready complete authorization.
-- In production, app.current_user_uuid() must be set ONLY by verified server auth middleware,
-- NOT a client-writable SQL setting. Use database-authenticated session identity (e.g. auth.uid()).
-- Revoke public access to app schema. Service roles must be limited to narrow server operations.
-- This sample assumes a trusted auth.uid() function such as Supabase provides.

alter table app.tenants enable row level security;
alter table app.workspaces enable row level security;
alter table app.workspace_memberships enable row level security;
alter table app.provider_connections enable row level security;
alter table app.provider_capabilities enable row level security;
alter table app.products enable row level security;
alter table app.product_variants enable row level security;
alter table app.import_batches enable row level security;
alter table app.import_rows enable row level security;

-- Minimal starter policies for direct staff reads; complete all tables and write policies before deployment.
create policy tenant_workspace_read on app.workspaces for select using (
 exists (select 1 from app.workspace_memberships m where m.workspace_id=id and m.user_id=auth.uid())
);
create policy staff_product_read on app.products for select using (
 exists (select 1 from app.workspace_memberships m where m.workspace_id=products.workspace_id and m.tenant_id=products.tenant_id and m.user_id=auth.uid())
);
create policy staff_connections_read on app.provider_connections for select using (
 exists (select 1 from app.workspace_memberships m where m.workspace_id=provider_connections.workspace_id and m.tenant_id=provider_connections.tenant_id and m.user_id=auth.uid() and m.role in ('owner','admin'))
);
-- Do NOT grant direct database write access to provider connection credential references.
-- Build privileged, authenticated RPC/routes that enforce roles and audit every mutation.
-- DENY BY DEFAULT all other operations until an exhaustive RLS permission matrix and tests exist.
