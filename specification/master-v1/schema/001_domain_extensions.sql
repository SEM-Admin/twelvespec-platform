-- REVIEW-ONLY SQL for a FRESH DB. Depends on tenant/workspace IDs and auth scheme defined in business kernel.
-- This is a design scaffold, not a complete production migration. Every table requires final RLS policies, FK scope and dependency reconciliation.
create extension if not exists pgcrypto;
create table if not exists module_registry (
  code text primary key, title text not null, status text not null check(status in('ACTIVE_V1','COMING_SOON','DISABLED')),
  owning_domain text not null, installed_at timestamptz not null default now()
);
create table if not exists tenant_provider_connections (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null, provider_type text not null,
 display_name text not null, environment text not null check(environment in('mock','sandbox','live')),
 secret_reference text, status text not null default 'NOT_CONFIGURED', masked_hint text,
 created_at timestamptz not null default now(), modified_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id)
);
create table if not exists provider_service_capabilities (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null, connection_id uuid not null,
 capability text not null, service_version text, verified_status text not null check (verified_status in ('NOT_CONFIGURED','MOCKED','SANDBOX_VERIFIED','LIVE_VERIFIED','BLOCKED')),
 endpoint_host text, last_checked_at timestamptz,
 foreign key(tenant_id,workspace_id,connection_id) references tenant_provider_connections(tenant_id,workspace_id,id),
 unique(tenant_id,workspace_id,connection_id,capability)
);
create table if not exists catalog_import_batches (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null, connection_id uuid,
 status text not null, file_hash text not null, mapping_version integer not null, original_object_key text not null,
 reviewed_by uuid, committed_revision_id uuid, created_at timestamptz not null default now()
);
create table if not exists catalog_import_rows (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 batch_id uuid not null references catalog_import_batches(id), source_row_id text not null, raw_hash text not null,
 normalized jsonb, validation_errors jsonb not null default '[]', state text not null default 'STAGED',
 unique(batch_id,source_row_id)
);
create table if not exists product_families (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 name text not null, version integer not null default 1, rule_ast jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists design_projects (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 created_by uuid not null, current_version_id uuid, status text not null default 'EDITABLE', created_at timestamptz not null default now()
);
create table if not exists design_versions (
 id uuid primary key default gen_random_uuid(), project_id uuid not null references design_projects(id),
 tenant_id uuid not null, workspace_id uuid not null, version_number integer not null, layer_data jsonb not null,
 content_hash text not null, created_at timestamptz not null default now(), unique(project_id,version_number)
);
create table if not exists proof_approvals (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 project_id uuid not null references design_projects(id), design_version_id uuid not null references design_versions(id),
 approved_by uuid not null, approved_at timestamptz not null default now(), approved_specification_hash text not null
);
create table if not exists production_jobs (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 order_id uuid not null, state text not null check (state in ('PLANNED','READY','IN_PROGRESS','QC_PENDING','COMPLETE','REWORK','BLOCKED')),
 due_at timestamptz, created_at timestamptz not null default now()
);
create table if not exists supplier_purchase_commands (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 connection_id uuid not null, purchase_order_id uuid not null, idempotency_key text not null,
 state text not null check(state in ('DRAFT','APPROVAL_PENDING','AUTHORIZED','SUBMITTING','ACKNOWLEDGED','REJECTED','UNKNOWN_OUTCOME')),
 external_id text, approved_by uuid, created_at timestamptz not null default now(),
 unique(tenant_id,connection_id,idempotency_key)
);
create table if not exists module_work_items (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 domain text not null, entity_id uuid, severity text not null, state text not null default 'OPEN',
 assigned_to uuid, created_at timestamptz not null default now()
);
-- Explicit security-block until application/RLS correctness is verified.
revoke all on tenant_provider_connections,provider_service_capabilities,catalog_import_batches,catalog_import_rows,product_families,design_projects,design_versions,proof_approvals,production_jobs,supplier_purchase_commands,module_work_items from anon, authenticated;
