-- REFERENCE pattern ONLY, not an all-table production RLS migration.
-- Replace authorize_workspace_member with verified STABLE SECURITY DEFINER function after evaluating search_path, privilege model and auth.uid().
-- Privileged service operations must apply explicit workspace scope even if they bypass RLS.
alter table tenant_provider_connections enable row level security;
alter table provider_service_capabilities enable row level security;
alter table catalog_import_batches enable row level security;
alter table catalog_import_rows enable row level security;
alter table design_projects enable row level security;
alter table design_versions enable row level security;
alter table proof_approvals enable row level security;
alter table production_jobs enable row level security;
alter table supplier_purchase_commands enable row level security;
alter table module_work_items enable row level security;
-- Deliberately no permissive policies: everything denied by default until complete reviewed auth schema.
-- Never expose secret_reference in public projections, RLS alone is insufficient for field confidentiality.
