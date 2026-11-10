-- Reviewed greenfield schema. Runtime has no direct auth/vault access.
create extension if not exists pgcrypto;
create schema if not exists app;
do $$ begin create role ts_runtime nologin nosuperuser nobypassrls; exception when duplicate_object then null; end $$;
create table tenants(id uuid primary key, name text not null);
create table workspaces(id uuid primary key,tenant_id uuid not null references tenants(id),name text not null,unique(tenant_id,id));
create table "user"(id text primary key,name text not null,email text not null unique,"emailVerified" boolean not null default false,image text,"createdAt" timestamptz not null default now(),"updatedAt" timestamptz not null default now());
create table "session"(id text primary key,"expiresAt" timestamptz not null,token text not null unique,"createdAt" timestamptz not null default now(),"updatedAt" timestamptz not null default now(),"ipAddress" text,"userAgent" text,"userId" text not null references "user"(id) on delete cascade);
create index auth_session_user_idx on "session"("userId");
create table "account"(id text primary key,"accountId" text not null,"providerId" text not null,"userId" text not null references "user"(id) on delete cascade,"accessToken" text,"refreshToken" text,"idToken" text,"accessTokenExpiresAt" timestamptz,"refreshTokenExpiresAt" timestamptz,scope text,password text,"createdAt" timestamptz not null default now(),"updatedAt" timestamptz not null default now());
create index account_user on "account"("userId");
create table "verification"(id text primary key,identifier text not null,value text not null,"expiresAt" timestamptz not null,"createdAt" timestamptz default now(),"updatedAt" timestamptz default now());
create index verification_identifier on "verification"(identifier);
create table memberships(user_id text not null references "user"(id),tenant_id uuid not null,workspace_id uuid not null,role text not null check(role in ('owner','manager','staff','customer','sales','catalog_manager','designer','operations','buyer','finance','marketing','integration_admin','store_admin')),primary key(tenant_id,workspace_id,user_id),foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id));
create function app.scope_ok(t uuid,w uuid) returns boolean language sql stable security definer set search_path=public,pg_temp as $$ select t::text=current_setting('ts.tenant',true) and w::text=current_setting('ts.workspace',true) and exists(select 1 from memberships m where m.tenant_id=t and m.workspace_id=w and m.user_id=current_setting('ts.user',true) and m.role=current_setting('ts.role',true)) $$;
revoke all on function app.scope_ok(uuid,uuid) from public;
grant execute on function app.scope_ok(uuid,uuid) to ts_runtime;
grant usage on schema app to ts_runtime;
create table app.legal_entities(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index legal_entities_scope on app.legal_entities(tenant_id,workspace_id,status,created_at desc);
alter table app.legal_entities enable row level security;
alter table app.legal_entities force row level security;
create table app.ventures(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index ventures_scope on app.ventures(tenant_id,workspace_id,status,created_at desc);
alter table app.ventures enable row level security;
alter table app.ventures force row level security;
create table app.resource_grants(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index resource_grants_scope on app.resource_grants(tenant_id,workspace_id,status,created_at desc);
alter table app.resource_grants enable row level security;
alter table app.resource_grants force row level security;
create table app.work_items(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index work_items_scope on app.work_items(tenant_id,workspace_id,status,created_at desc);
alter table app.work_items enable row level security;
alter table app.work_items force row level security;
create table app.exceptions(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index exceptions_scope on app.exceptions(tenant_id,workspace_id,status,created_at desc);
alter table app.exceptions enable row level security;
alter table app.exceptions force row level security;
create table app.time_entries(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index time_entries_scope on app.time_entries(tenant_id,workspace_id,status,created_at desc);
alter table app.time_entries enable row level security;
alter table app.time_entries force row level security;
create table app.contacts(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index contacts_scope on app.contacts(tenant_id,workspace_id,status,created_at desc);
alter table app.contacts enable row level security;
alter table app.contacts force row level security;
create table app.accounts(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index accounts_scope on app.accounts(tenant_id,workspace_id,status,created_at desc);
alter table app.accounts enable row level security;
alter table app.accounts force row level security;
create table app.opportunities(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index opportunities_scope on app.opportunities(tenant_id,workspace_id,status,created_at desc);
alter table app.opportunities enable row level security;
alter table app.opportunities force row level security;
create table app.activities(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index activities_scope on app.activities(tenant_id,workspace_id,status,created_at desc);
alter table app.activities enable row level security;
alter table app.activities force row level security;
create table app.follow_ups(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index follow_ups_scope on app.follow_ups(tenant_id,workspace_id,status,created_at desc);
alter table app.follow_ups enable row level security;
alter table app.follow_ups force row level security;
create table app.products(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index products_scope on app.products(tenant_id,workspace_id,status,created_at desc);
alter table app.products enable row level security;
alter table app.products force row level security;
create table app.variants(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index variants_scope on app.variants(tenant_id,workspace_id,status,created_at desc);
alter table app.variants enable row level security;
alter table app.variants force row level security;
create table app.product_families(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index product_families_scope on app.product_families(tenant_id,workspace_id,status,created_at desc);
alter table app.product_families enable row level security;
alter table app.product_families force row level security;
create table app.collections(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index collections_scope on app.collections(tenant_id,workspace_id,status,created_at desc);
alter table app.collections enable row level security;
alter table app.collections force row level security;
create table app.catalog_revisions(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index catalog_revisions_scope on app.catalog_revisions(tenant_id,workspace_id,status,created_at desc);
alter table app.catalog_revisions enable row level security;
alter table app.catalog_revisions force row level security;
create table app.source_records(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index source_records_scope on app.source_records(tenant_id,workspace_id,status,created_at desc);
alter table app.source_records enable row level security;
alter table app.source_records force row level security;
create table app.supplier_offers(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index supplier_offers_scope on app.supplier_offers(tenant_id,workspace_id,status,created_at desc);
alter table app.supplier_offers enable row level security;
alter table app.supplier_offers force row level security;
create table app.connections(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index connections_scope on app.connections(tenant_id,workspace_id,status,created_at desc);
alter table app.connections enable row level security;
alter table app.connections force row level security;
create table app.capabilities(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index capabilities_scope on app.capabilities(tenant_id,workspace_id,status,created_at desc);
alter table app.capabilities enable row level security;
alter table app.capabilities force row level security;
create table app.mapping_profiles(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index mapping_profiles_scope on app.mapping_profiles(tenant_id,workspace_id,status,created_at desc);
alter table app.mapping_profiles enable row level security;
alter table app.mapping_profiles force row level security;
create table app.sync_runs(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index sync_runs_scope on app.sync_runs(tenant_id,workspace_id,status,created_at desc);
alter table app.sync_runs enable row level security;
alter table app.sync_runs force row level security;
create table app.import_batches(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index import_batches_scope on app.import_batches(tenant_id,workspace_id,status,created_at desc);
alter table app.import_batches enable row level security;
alter table app.import_batches force row level security;
create table app.import_rows(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index import_rows_scope on app.import_rows(tenant_id,workspace_id,status,created_at desc);
alter table app.import_rows enable row level security;
alter table app.import_rows force row level security;
create table app.merge_reviews(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index merge_reviews_scope on app.merge_reviews(tenant_id,workspace_id,status,created_at desc);
alter table app.merge_reviews enable row level security;
alter table app.merge_reviews force row level security;
create table app.configuration_templates(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index configuration_templates_scope on app.configuration_templates(tenant_id,workspace_id,status,created_at desc);
alter table app.configuration_templates enable row level security;
alter table app.configuration_templates force row level security;
create table app.configuration_rules(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index configuration_rules_scope on app.configuration_rules(tenant_id,workspace_id,status,created_at desc);
alter table app.configuration_rules enable row level security;
alter table app.configuration_rules force row level security;
create table app.imprint_areas(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index imprint_areas_scope on app.imprint_areas(tenant_id,workspace_id,status,created_at desc);
alter table app.imprint_areas enable row level security;
alter table app.imprint_areas force row level security;
create table app.saved_configurations(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index saved_configurations_scope on app.saved_configurations(tenant_id,workspace_id,status,created_at desc);
alter table app.saved_configurations enable row level security;
alter table app.saved_configurations force row level security;
create table app.brand_kits(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index brand_kits_scope on app.brand_kits(tenant_id,workspace_id,status,created_at desc);
alter table app.brand_kits enable row level security;
alter table app.brand_kits force row level security;
create table app.assets(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index assets_scope on app.assets(tenant_id,workspace_id,status,created_at desc);
alter table app.assets enable row level security;
alter table app.assets force row level security;
create table app.design_projects(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index design_projects_scope on app.design_projects(tenant_id,workspace_id,status,created_at desc);
alter table app.design_projects enable row level security;
alter table app.design_projects force row level security;
create table app.design_versions(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index design_versions_scope on app.design_versions(tenant_id,workspace_id,status,created_at desc);
alter table app.design_versions enable row level security;
alter table app.design_versions force row level security;
create table app.placements(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index placements_scope on app.placements(tenant_id,workspace_id,status,created_at desc);
alter table app.placements enable row level security;
alter table app.placements force row level security;
create table app.render_jobs(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index render_jobs_scope on app.render_jobs(tenant_id,workspace_id,status,created_at desc);
alter table app.render_jobs enable row level security;
alter table app.render_jobs force row level security;
create table app.proofs(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index proofs_scope on app.proofs(tenant_id,workspace_id,status,created_at desc);
alter table app.proofs enable row level security;
alter table app.proofs force row level security;
create table app.preflight_results(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index preflight_results_scope on app.preflight_results(tenant_id,workspace_id,status,created_at desc);
alter table app.preflight_results enable row level security;
alter table app.preflight_results force row level security;
create table app.production_assets(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index production_assets_scope on app.production_assets(tenant_id,workspace_id,status,created_at desc);
alter table app.production_assets enable row level security;
alter table app.production_assets force row level security;
create table app.carts(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index carts_scope on app.carts(tenant_id,workspace_id,status,created_at desc);
alter table app.carts enable row level security;
alter table app.carts force row level security;
create table app.cart_lines(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index cart_lines_scope on app.cart_lines(tenant_id,workspace_id,status,created_at desc);
alter table app.cart_lines enable row level security;
alter table app.cart_lines force row level security;
create table app.requests(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index requests_scope on app.requests(tenant_id,workspace_id,status,created_at desc);
alter table app.requests enable row level security;
alter table app.requests force row level security;
create table app.estimates(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index estimates_scope on app.estimates(tenant_id,workspace_id,status,created_at desc);
alter table app.estimates enable row level security;
alter table app.estimates force row level security;
create table app.quote_lines(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index quote_lines_scope on app.quote_lines(tenant_id,workspace_id,status,created_at desc);
alter table app.quote_lines enable row level security;
alter table app.quote_lines force row level security;
create table app.quotes(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index quotes_scope on app.quotes(tenant_id,workspace_id,status,created_at desc);
alter table app.quotes enable row level security;
alter table app.quotes force row level security;
create table app.quote_revisions(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index quote_revisions_scope on app.quote_revisions(tenant_id,workspace_id,status,created_at desc);
alter table app.quote_revisions enable row level security;
alter table app.quote_revisions force row level security;
create table app.approvals(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index approvals_scope on app.approvals(tenant_id,workspace_id,status,created_at desc);
alter table app.approvals enable row level security;
alter table app.approvals force row level security;
create table app.orders(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index orders_scope on app.orders(tenant_id,workspace_id,status,created_at desc);
alter table app.orders enable row level security;
alter table app.orders force row level security;
create table app.order_lines(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index order_lines_scope on app.order_lines(tenant_id,workspace_id,status,created_at desc);
alter table app.order_lines enable row level security;
alter table app.order_lines force row level security;
create table app.jobs(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index jobs_scope on app.jobs(tenant_id,workspace_id,status,created_at desc);
alter table app.jobs enable row level security;
alter table app.jobs force row level security;
create table app.job_components(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index job_components_scope on app.job_components(tenant_id,workspace_id,status,created_at desc);
alter table app.job_components enable row level security;
alter table app.job_components force row level security;
create table app.operations(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index operations_scope on app.operations(tenant_id,workspace_id,status,created_at desc);
alter table app.operations enable row level security;
alter table app.operations force row level security;
create table app.qc_checks(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index qc_checks_scope on app.qc_checks(tenant_id,workspace_id,status,created_at desc);
alter table app.qc_checks enable row level security;
alter table app.qc_checks force row level security;
create table app.production_events(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index production_events_scope on app.production_events(tenant_id,workspace_id,status,created_at desc);
alter table app.production_events enable row level security;
alter table app.production_events force row level security;
create table app.purchase_requirements(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index purchase_requirements_scope on app.purchase_requirements(tenant_id,workspace_id,status,created_at desc);
alter table app.purchase_requirements enable row level security;
alter table app.purchase_requirements force row level security;
create table app.sourcing_decisions(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index sourcing_decisions_scope on app.sourcing_decisions(tenant_id,workspace_id,status,created_at desc);
alter table app.sourcing_decisions enable row level security;
alter table app.sourcing_decisions force row level security;
create table app.purchase_orders(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index purchase_orders_scope on app.purchase_orders(tenant_id,workspace_id,status,created_at desc);
alter table app.purchase_orders enable row level security;
alter table app.purchase_orders force row level security;
create table app.purchase_order_lines(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index purchase_order_lines_scope on app.purchase_order_lines(tenant_id,workspace_id,status,created_at desc);
alter table app.purchase_order_lines enable row level security;
alter table app.purchase_order_lines force row level security;
create table app.provider_transactions(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index provider_transactions_scope on app.provider_transactions(tenant_id,workspace_id,status,created_at desc);
alter table app.provider_transactions enable row level security;
alter table app.provider_transactions force row level security;
create table app.fulfillment_allocations(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index fulfillment_allocations_scope on app.fulfillment_allocations(tenant_id,workspace_id,status,created_at desc);
alter table app.fulfillment_allocations enable row level security;
alter table app.fulfillment_allocations force row level security;
create table app.shipments(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index shipments_scope on app.shipments(tenant_id,workspace_id,status,created_at desc);
alter table app.shipments enable row level security;
alter table app.shipments force row level security;
create table app.shipment_lines(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index shipment_lines_scope on app.shipment_lines(tenant_id,workspace_id,status,created_at desc);
alter table app.shipment_lines enable row level security;
alter table app.shipment_lines force row level security;
create table app.tracking_events(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index tracking_events_scope on app.tracking_events(tenant_id,workspace_id,status,created_at desc);
alter table app.tracking_events enable row level security;
alter table app.tracking_events force row level security;
create table app.returns(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index returns_scope on app.returns(tenant_id,workspace_id,status,created_at desc);
alter table app.returns enable row level security;
alter table app.returns force row level security;
create table app.remakes(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index remakes_scope on app.remakes(tenant_id,workspace_id,status,created_at desc);
alter table app.remakes enable row level security;
alter table app.remakes force row level security;
create table app.actual_costs(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index actual_costs_scope on app.actual_costs(tenant_id,workspace_id,status,created_at desc);
alter table app.actual_costs enable row level security;
alter table app.actual_costs force row level security;
create table app.invoice_references(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index invoice_references_scope on app.invoice_references(tenant_id,workspace_id,status,created_at desc);
alter table app.invoice_references enable row level security;
alter table app.invoice_references force row level security;
create table app.payment_references(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index payment_references_scope on app.payment_references(tenant_id,workspace_id,status,created_at desc);
alter table app.payment_references enable row level security;
alter table app.payment_references force row level security;
create table app.reconciliations(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index reconciliations_scope on app.reconciliations(tenant_id,workspace_id,status,created_at desc);
alter table app.reconciliations enable row level security;
alter table app.reconciliations force row level security;
create table app.profit_snapshots(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index profit_snapshots_scope on app.profit_snapshots(tenant_id,workspace_id,status,created_at desc);
alter table app.profit_snapshots enable row level security;
alter table app.profit_snapshots force row level security;
create table app.stores(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index stores_scope on app.stores(tenant_id,workspace_id,status,created_at desc);
alter table app.stores enable row level security;
alter table app.stores force row level security;
create table app.store_memberships(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index store_memberships_scope on app.store_memberships(tenant_id,workspace_id,status,created_at desc);
alter table app.store_memberships enable row level security;
alter table app.store_memberships force row level security;
create table app.store_products(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index store_products_scope on app.store_products(tenant_id,workspace_id,status,created_at desc);
alter table app.store_products enable row level security;
alter table app.store_products force row level security;
create table app.spending_budgets(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index spending_budgets_scope on app.spending_budgets(tenant_id,workspace_id,status,created_at desc);
alter table app.spending_budgets enable row level security;
alter table app.spending_budgets force row level security;
create table app.allowances(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index allowances_scope on app.allowances(tenant_id,workspace_id,status,created_at desc);
alter table app.allowances enable row level security;
alter table app.allowances force row level security;
create table app.campaigns(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index campaigns_scope on app.campaigns(tenant_id,workspace_id,status,created_at desc);
alter table app.campaigns enable row level security;
alter table app.campaigns force row level security;
create table app.bundle_templates(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index bundle_templates_scope on app.bundle_templates(tenant_id,workspace_id,status,created_at desc);
alter table app.bundle_templates enable row level security;
alter table app.bundle_templates force row level security;
create table app.bundle_components(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index bundle_components_scope on app.bundle_components(tenant_id,workspace_id,status,created_at desc);
alter table app.bundle_components enable row level security;
alter table app.bundle_components force row level security;
create table app.bundle_configurations(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index bundle_configurations_scope on app.bundle_configurations(tenant_id,workspace_id,status,created_at desc);
alter table app.bundle_configurations enable row level security;
alter table app.bundle_configurations force row level security;
create table app.content_assets(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index content_assets_scope on app.content_assets(tenant_id,workspace_id,status,created_at desc);
alter table app.content_assets enable row level security;
alter table app.content_assets force row level security;
create table app.content_revisions(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index content_revisions_scope on app.content_revisions(tenant_id,workspace_id,status,created_at desc);
alter table app.content_revisions enable row level security;
alter table app.content_revisions force row level security;
create table app.campaign_segments(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index campaign_segments_scope on app.campaign_segments(tenant_id,workspace_id,status,created_at desc);
alter table app.campaign_segments enable row level security;
alter table app.campaign_segments force row level security;
create table app.publications(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index publications_scope on app.publications(tenant_id,workspace_id,status,created_at desc);
alter table app.publications enable row level security;
alter table app.publications force row level security;
create table app.attributions(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index attributions_scope on app.attributions(tenant_id,workspace_id,status,created_at desc);
alter table app.attributions enable row level security;
alter table app.attributions force row level security;
create table app.automation_rules(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index automation_rules_scope on app.automation_rules(tenant_id,workspace_id,status,created_at desc);
alter table app.automation_rules enable row level security;
alter table app.automation_rules force row level security;
create table app.automation_runs(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index automation_runs_scope on app.automation_runs(tenant_id,workspace_id,status,created_at desc);
alter table app.automation_runs enable row level security;
alter table app.automation_runs force row level security;
create table app.notifications(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index notifications_scope on app.notifications(tenant_id,workspace_id,status,created_at desc);
alter table app.notifications enable row level security;
alter table app.notifications force row level security;
create table app.report_definitions(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index report_definitions_scope on app.report_definitions(tenant_id,workspace_id,status,created_at desc);
alter table app.report_definitions enable row level security;
alter table app.report_definitions force row level security;
create table app.kpi_snapshots(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index kpi_snapshots_scope on app.kpi_snapshots(tenant_id,workspace_id,status,created_at desc);
alter table app.kpi_snapshots enable row level security;
alter table app.kpi_snapshots force row level security;
create table app.data_quality_issues(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index data_quality_issues_scope on app.data_quality_issues(tenant_id,workspace_id,status,created_at desc);
alter table app.data_quality_issues enable row level security;
alter table app.data_quality_issues force row level security;
create table app.dashboards(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index dashboards_scope on app.dashboards(tenant_id,workspace_id,status,created_at desc);
alter table app.dashboards enable row level security;
alter table app.dashboards force row level security;
create table app.outbox_events(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index outbox_events_scope on app.outbox_events(tenant_id,workspace_id,status,created_at desc);
alter table app.outbox_events enable row level security;
alter table app.outbox_events force row level security;
create table app.audit_events(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index audit_events_scope on app.audit_events(tenant_id,workspace_id,status,created_at desc);
alter table app.audit_events enable row level security;
alter table app.audit_events force row level security;
create table app.command_receipts(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index command_receipts_scope on app.command_receipts(tenant_id,workspace_id,status,created_at desc);
alter table app.command_receipts enable row level security;
alter table app.command_receipts force row level security;
create table app.webhook_receipts(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index webhook_receipts_scope on app.webhook_receipts(tenant_id,workspace_id,status,created_at desc);
alter table app.webhook_receipts enable row level security;
alter table app.webhook_receipts force row level security;
create table app.catalog_rollback_manifests(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index catalog_rollback_manifests_scope on app.catalog_rollback_manifests(tenant_id,workspace_id,status,created_at desc);
alter table app.catalog_rollback_manifests enable row level security;
alter table app.catalog_rollback_manifests force row level security;
create table app.secret_metadata(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'DRAFT',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id)
);
create index secret_metadata_scope on app.secret_metadata(tenant_id,workspace_id,status,created_at desc);
alter table app.secret_metadata enable row level security;
alter table app.secret_metadata force row level security;
alter table app.variants add column product_id uuid,add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id);
create index variants_product_id on app.variants(tenant_id,workspace_id,product_id);
alter table app.supplier_offers add column product_id uuid,add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id);
create index supplier_offers_product_id on app.supplier_offers(tenant_id,workspace_id,product_id);
alter table app.supplier_offers add column variant_id uuid,add foreign key(tenant_id,workspace_id,variant_id) references app.variants(tenant_id,workspace_id,id);
create index supplier_offers_variant_id on app.supplier_offers(tenant_id,workspace_id,variant_id);
alter table app.supplier_offers add column connection_id uuid,add foreign key(tenant_id,workspace_id,connection_id) references app.connections(tenant_id,workspace_id,id);
create index supplier_offers_connection_id on app.supplier_offers(tenant_id,workspace_id,connection_id);
alter table app.capabilities add column connection_id uuid,add foreign key(tenant_id,workspace_id,connection_id) references app.connections(tenant_id,workspace_id,id);
create index capabilities_connection_id on app.capabilities(tenant_id,workspace_id,connection_id);
alter table app.sync_runs add column connection_id uuid,add foreign key(tenant_id,workspace_id,connection_id) references app.connections(tenant_id,workspace_id,id);
create index sync_runs_connection_id on app.sync_runs(tenant_id,workspace_id,connection_id);
alter table app.source_records add column connection_id uuid,add foreign key(tenant_id,workspace_id,connection_id) references app.connections(tenant_id,workspace_id,id);
create index source_records_connection_id on app.source_records(tenant_id,workspace_id,connection_id);
alter table app.import_batches add column connection_id uuid,add foreign key(tenant_id,workspace_id,connection_id) references app.connections(tenant_id,workspace_id,id);
create index import_batches_connection_id on app.import_batches(tenant_id,workspace_id,connection_id);
alter table app.import_rows add column batch_id uuid,add foreign key(tenant_id,workspace_id,batch_id) references app.import_batches(tenant_id,workspace_id,id);
create index import_rows_batch_id on app.import_rows(tenant_id,workspace_id,batch_id);
alter table app.design_projects add column product_id uuid,add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id);
create index design_projects_product_id on app.design_projects(tenant_id,workspace_id,product_id);
alter table app.design_projects add column variant_id uuid,add foreign key(tenant_id,workspace_id,variant_id) references app.variants(tenant_id,workspace_id,id);
create index design_projects_variant_id on app.design_projects(tenant_id,workspace_id,variant_id);
alter table app.design_versions add column project_id uuid,add foreign key(tenant_id,workspace_id,project_id) references app.design_projects(tenant_id,workspace_id,id);
create index design_versions_project_id on app.design_versions(tenant_id,workspace_id,project_id);
alter table app.placements add column project_id uuid,add foreign key(tenant_id,workspace_id,project_id) references app.design_projects(tenant_id,workspace_id,id);
create index placements_project_id on app.placements(tenant_id,workspace_id,project_id);
alter table app.placements add column version_id uuid,add foreign key(tenant_id,workspace_id,version_id) references app.design_versions(tenant_id,workspace_id,id);
create index placements_version_id on app.placements(tenant_id,workspace_id,version_id);
alter table app.proofs add column project_id uuid,add foreign key(tenant_id,workspace_id,project_id) references app.design_projects(tenant_id,workspace_id,id);
create index proofs_project_id on app.proofs(tenant_id,workspace_id,project_id);
alter table app.proofs add column version_id uuid,add foreign key(tenant_id,workspace_id,version_id) references app.design_versions(tenant_id,workspace_id,id);
create index proofs_version_id on app.proofs(tenant_id,workspace_id,version_id);
alter table app.render_jobs add column project_id uuid,add foreign key(tenant_id,workspace_id,project_id) references app.design_projects(tenant_id,workspace_id,id);
create index render_jobs_project_id on app.render_jobs(tenant_id,workspace_id,project_id);
alter table app.render_jobs add column version_id uuid,add foreign key(tenant_id,workspace_id,version_id) references app.design_versions(tenant_id,workspace_id,id);
create index render_jobs_version_id on app.render_jobs(tenant_id,workspace_id,version_id);
alter table app.render_jobs add column product_id uuid,add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id);
create index render_jobs_product_id on app.render_jobs(tenant_id,workspace_id,product_id);
alter table app.render_jobs add column variant_id uuid,add foreign key(tenant_id,workspace_id,variant_id) references app.variants(tenant_id,workspace_id,id);
create index render_jobs_variant_id on app.render_jobs(tenant_id,workspace_id,variant_id);
alter table app.preflight_results add column project_id uuid,add foreign key(tenant_id,workspace_id,project_id) references app.design_projects(tenant_id,workspace_id,id);
create index preflight_results_project_id on app.preflight_results(tenant_id,workspace_id,project_id);
alter table app.preflight_results add column version_id uuid,add foreign key(tenant_id,workspace_id,version_id) references app.design_versions(tenant_id,workspace_id,id);
create index preflight_results_version_id on app.preflight_results(tenant_id,workspace_id,version_id);
alter table app.production_assets add column project_id uuid,add foreign key(tenant_id,workspace_id,project_id) references app.design_projects(tenant_id,workspace_id,id);
create index production_assets_project_id on app.production_assets(tenant_id,workspace_id,project_id);
alter table app.production_assets add column version_id uuid,add foreign key(tenant_id,workspace_id,version_id) references app.design_versions(tenant_id,workspace_id,id);
create index production_assets_version_id on app.production_assets(tenant_id,workspace_id,version_id);
alter table app.assets add column project_id uuid,add foreign key(tenant_id,workspace_id,project_id) references app.design_projects(tenant_id,workspace_id,id);
create index assets_project_id on app.assets(tenant_id,workspace_id,project_id);
alter table app.imprint_areas add column product_id uuid,add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id);
create index imprint_areas_product_id on app.imprint_areas(tenant_id,workspace_id,product_id);
alter table app.saved_configurations add column product_id uuid,add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id);
create index saved_configurations_product_id on app.saved_configurations(tenant_id,workspace_id,product_id);
alter table app.saved_configurations add column variant_id uuid,add foreign key(tenant_id,workspace_id,variant_id) references app.variants(tenant_id,workspace_id,id);
create index saved_configurations_variant_id on app.saved_configurations(tenant_id,workspace_id,variant_id);
alter table app.cart_lines add column cart_id uuid,add foreign key(tenant_id,workspace_id,cart_id) references app.carts(tenant_id,workspace_id,id);
create index cart_lines_cart_id on app.cart_lines(tenant_id,workspace_id,cart_id);
alter table app.cart_lines add column product_id uuid,add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id);
create index cart_lines_product_id on app.cart_lines(tenant_id,workspace_id,product_id);
alter table app.cart_lines add column variant_id uuid,add foreign key(tenant_id,workspace_id,variant_id) references app.variants(tenant_id,workspace_id,id);
create index cart_lines_variant_id on app.cart_lines(tenant_id,workspace_id,variant_id);
alter table app.quote_lines add column quote_id uuid,add foreign key(tenant_id,workspace_id,quote_id) references app.quotes(tenant_id,workspace_id,id);
create index quote_lines_quote_id on app.quote_lines(tenant_id,workspace_id,quote_id);
alter table app.quote_lines add column product_id uuid,add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id);
create index quote_lines_product_id on app.quote_lines(tenant_id,workspace_id,product_id);
alter table app.quotes add column contact_id uuid,add foreign key(tenant_id,workspace_id,contact_id) references app.contacts(tenant_id,workspace_id,id);
create index quotes_contact_id on app.quotes(tenant_id,workspace_id,contact_id);
alter table app.quote_revisions add column quote_id uuid,add foreign key(tenant_id,workspace_id,quote_id) references app.quotes(tenant_id,workspace_id,id);
create index quote_revisions_quote_id on app.quote_revisions(tenant_id,workspace_id,quote_id);
alter table app.orders add column quote_id uuid,add foreign key(tenant_id,workspace_id,quote_id) references app.quotes(tenant_id,workspace_id,id);
create index orders_quote_id on app.orders(tenant_id,workspace_id,quote_id);
alter table app.orders add column revision_id uuid,add foreign key(tenant_id,workspace_id,revision_id) references app.quote_revisions(tenant_id,workspace_id,id);
create index orders_revision_id on app.orders(tenant_id,workspace_id,revision_id);
alter table app.order_lines add column order_id uuid,add foreign key(tenant_id,workspace_id,order_id) references app.orders(tenant_id,workspace_id,id);
create index order_lines_order_id on app.order_lines(tenant_id,workspace_id,order_id);
alter table app.order_lines add column product_id uuid,add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id);
create index order_lines_product_id on app.order_lines(tenant_id,workspace_id,product_id);
alter table app.order_lines add column variant_id uuid,add foreign key(tenant_id,workspace_id,variant_id) references app.variants(tenant_id,workspace_id,id);
create index order_lines_variant_id on app.order_lines(tenant_id,workspace_id,variant_id);
alter table app.jobs add column order_id uuid,add foreign key(tenant_id,workspace_id,order_id) references app.orders(tenant_id,workspace_id,id);
create index jobs_order_id on app.jobs(tenant_id,workspace_id,order_id);
alter table app.job_components add column job_id uuid,add foreign key(tenant_id,workspace_id,job_id) references app.jobs(tenant_id,workspace_id,id);
create index job_components_job_id on app.job_components(tenant_id,workspace_id,job_id);
alter table app.job_components add column product_id uuid,add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id);
create index job_components_product_id on app.job_components(tenant_id,workspace_id,product_id);
alter table app.operations add column job_id uuid,add foreign key(tenant_id,workspace_id,job_id) references app.jobs(tenant_id,workspace_id,id);
create index operations_job_id on app.operations(tenant_id,workspace_id,job_id);
alter table app.qc_checks add column job_id uuid,add foreign key(tenant_id,workspace_id,job_id) references app.jobs(tenant_id,workspace_id,id);
create index qc_checks_job_id on app.qc_checks(tenant_id,workspace_id,job_id);
alter table app.purchase_orders add column order_id uuid,add foreign key(tenant_id,workspace_id,order_id) references app.orders(tenant_id,workspace_id,id);
create index purchase_orders_order_id on app.purchase_orders(tenant_id,workspace_id,order_id);
alter table app.purchase_orders add column job_id uuid,add foreign key(tenant_id,workspace_id,job_id) references app.jobs(tenant_id,workspace_id,id);
create index purchase_orders_job_id on app.purchase_orders(tenant_id,workspace_id,job_id);
alter table app.purchase_orders add column connection_id uuid,add foreign key(tenant_id,workspace_id,connection_id) references app.connections(tenant_id,workspace_id,id);
create index purchase_orders_connection_id on app.purchase_orders(tenant_id,workspace_id,connection_id);
alter table app.purchase_order_lines add column order_id uuid,add foreign key(tenant_id,workspace_id,order_id) references app.orders(tenant_id,workspace_id,id);
create index purchase_order_lines_order_id on app.purchase_order_lines(tenant_id,workspace_id,order_id);
alter table app.purchase_order_lines add column product_id uuid,add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id);
create index purchase_order_lines_product_id on app.purchase_order_lines(tenant_id,workspace_id,product_id);
alter table app.fulfillment_allocations add column order_id uuid,add foreign key(tenant_id,workspace_id,order_id) references app.orders(tenant_id,workspace_id,id);
create index fulfillment_allocations_order_id on app.fulfillment_allocations(tenant_id,workspace_id,order_id);
alter table app.fulfillment_allocations add column job_id uuid,add foreign key(tenant_id,workspace_id,job_id) references app.jobs(tenant_id,workspace_id,id);
create index fulfillment_allocations_job_id on app.fulfillment_allocations(tenant_id,workspace_id,job_id);
alter table app.shipments add column order_id uuid,add foreign key(tenant_id,workspace_id,order_id) references app.orders(tenant_id,workspace_id,id);
create index shipments_order_id on app.shipments(tenant_id,workspace_id,order_id);
alter table app.shipment_lines add column order_id uuid,add foreign key(tenant_id,workspace_id,order_id) references app.orders(tenant_id,workspace_id,id);
create index shipment_lines_order_id on app.shipment_lines(tenant_id,workspace_id,order_id);
alter table app.shipment_lines add column shipment_id uuid,add foreign key(tenant_id,workspace_id,shipment_id) references app.shipments(tenant_id,workspace_id,id);
create index shipment_lines_shipment_id on app.shipment_lines(tenant_id,workspace_id,shipment_id);
alter table app.tracking_events add column shipment_id uuid,add foreign key(tenant_id,workspace_id,shipment_id) references app.shipments(tenant_id,workspace_id,id);
create index tracking_events_shipment_id on app.tracking_events(tenant_id,workspace_id,shipment_id);
alter table app.returns add column order_id uuid,add foreign key(tenant_id,workspace_id,order_id) references app.orders(tenant_id,workspace_id,id);
create index returns_order_id on app.returns(tenant_id,workspace_id,order_id);
alter table app.remakes add column order_id uuid,add foreign key(tenant_id,workspace_id,order_id) references app.orders(tenant_id,workspace_id,id);
create index remakes_order_id on app.remakes(tenant_id,workspace_id,order_id);
alter table app.remakes add column job_id uuid,add foreign key(tenant_id,workspace_id,job_id) references app.jobs(tenant_id,workspace_id,id);
create index remakes_job_id on app.remakes(tenant_id,workspace_id,job_id);
alter table app.actual_costs add column order_id uuid,add foreign key(tenant_id,workspace_id,order_id) references app.orders(tenant_id,workspace_id,id);
create index actual_costs_order_id on app.actual_costs(tenant_id,workspace_id,order_id);
alter table app.invoice_references add column order_id uuid,add foreign key(tenant_id,workspace_id,order_id) references app.orders(tenant_id,workspace_id,id);
create index invoice_references_order_id on app.invoice_references(tenant_id,workspace_id,order_id);
alter table app.payment_references add column order_id uuid,add foreign key(tenant_id,workspace_id,order_id) references app.orders(tenant_id,workspace_id,id);
create index payment_references_order_id on app.payment_references(tenant_id,workspace_id,order_id);
alter table app.profit_snapshots add column order_id uuid,add foreign key(tenant_id,workspace_id,order_id) references app.orders(tenant_id,workspace_id,id);
create index profit_snapshots_order_id on app.profit_snapshots(tenant_id,workspace_id,order_id);
alter table app.store_memberships add column store_id uuid,add foreign key(tenant_id,workspace_id,store_id) references app.stores(tenant_id,workspace_id,id);
create index store_memberships_store_id on app.store_memberships(tenant_id,workspace_id,store_id);
alter table app.store_products add column store_id uuid,add foreign key(tenant_id,workspace_id,store_id) references app.stores(tenant_id,workspace_id,id);
create index store_products_store_id on app.store_products(tenant_id,workspace_id,store_id);
alter table app.store_products add column product_id uuid,add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id);
create index store_products_product_id on app.store_products(tenant_id,workspace_id,product_id);
alter table app.spending_budgets add column store_id uuid,add foreign key(tenant_id,workspace_id,store_id) references app.stores(tenant_id,workspace_id,id);
create index spending_budgets_store_id on app.spending_budgets(tenant_id,workspace_id,store_id);
alter table app.allowances add column store_id uuid,add foreign key(tenant_id,workspace_id,store_id) references app.stores(tenant_id,workspace_id,id);
create index allowances_store_id on app.allowances(tenant_id,workspace_id,store_id);
alter table app.bundle_components add column bundle_id uuid,add foreign key(tenant_id,workspace_id,bundle_id) references app.bundle_templates(tenant_id,workspace_id,id);
create index bundle_components_bundle_id on app.bundle_components(tenant_id,workspace_id,bundle_id);
alter table app.bundle_components add column product_id uuid,add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id);
create index bundle_components_product_id on app.bundle_components(tenant_id,workspace_id,product_id);
alter table app.bundle_configurations add column bundle_id uuid,add foreign key(tenant_id,workspace_id,bundle_id) references app.bundle_templates(tenant_id,workspace_id,id);
create index bundle_configurations_bundle_id on app.bundle_configurations(tenant_id,workspace_id,bundle_id);
alter table app.automation_runs add column rule_id uuid,add foreign key(tenant_id,workspace_id,rule_id) references app.automation_rules(tenant_id,workspace_id,id);
create index automation_runs_rule_id on app.automation_runs(tenant_id,workspace_id,rule_id);
alter table app.activities add column contact_id uuid,add foreign key(tenant_id,workspace_id,contact_id) references app.contacts(tenant_id,workspace_id,id);
create index activities_contact_id on app.activities(tenant_id,workspace_id,contact_id);
alter table app.follow_ups add column contact_id uuid,add foreign key(tenant_id,workspace_id,contact_id) references app.contacts(tenant_id,workspace_id,id);
create index follow_ups_contact_id on app.follow_ups(tenant_id,workspace_id,contact_id);
create policy legal_entities_read on app.legal_entities for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy legal_entities_insert on app.legal_entities for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy legal_entities_update on app.legal_entities for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.legal_entities to ts_runtime;
create policy ventures_read on app.ventures for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy ventures_insert on app.ventures for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy ventures_update on app.ventures for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.ventures to ts_runtime;
create policy resource_grants_read on app.resource_grants for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy resource_grants_insert on app.resource_grants for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy resource_grants_update on app.resource_grants for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.resource_grants to ts_runtime;
create policy work_items_read on app.work_items for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy work_items_insert on app.work_items for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy work_items_update on app.work_items for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.work_items to ts_runtime;
create policy exceptions_read on app.exceptions for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy exceptions_insert on app.exceptions for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy exceptions_update on app.exceptions for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.exceptions to ts_runtime;
create policy time_entries_read on app.time_entries for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy time_entries_insert on app.time_entries for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy time_entries_update on app.time_entries for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.time_entries to ts_runtime;
create policy contacts_read on app.contacts for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy contacts_insert on app.contacts for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy contacts_update on app.contacts for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.contacts to ts_runtime;
create policy accounts_read on app.accounts for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy accounts_insert on app.accounts for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy accounts_update on app.accounts for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.accounts to ts_runtime;
create policy opportunities_read on app.opportunities for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy opportunities_insert on app.opportunities for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy opportunities_update on app.opportunities for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.opportunities to ts_runtime;
create policy activities_read on app.activities for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy activities_insert on app.activities for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy activities_update on app.activities for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.activities to ts_runtime;
create policy follow_ups_read on app.follow_ups for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy follow_ups_insert on app.follow_ups for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy follow_ups_update on app.follow_ups for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.follow_ups to ts_runtime;
create policy products_read on app.products for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or status='PUBLISHED'));
create policy products_insert on app.products for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy products_update on app.products for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.products to ts_runtime;
create policy variants_read on app.variants for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or exists(select 1 from app.products p where p.id=product_id and p.status='PUBLISHED')));
create policy variants_insert on app.variants for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy variants_update on app.variants for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.variants to ts_runtime;
create policy product_families_read on app.product_families for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy product_families_insert on app.product_families for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy product_families_update on app.product_families for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.product_families to ts_runtime;
create policy collections_read on app.collections for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy collections_insert on app.collections for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy collections_update on app.collections for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.collections to ts_runtime;
create policy catalog_revisions_read on app.catalog_revisions for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy catalog_revisions_insert on app.catalog_revisions for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy catalog_revisions_update on app.catalog_revisions for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.catalog_revisions to ts_runtime;
create policy source_records_read on app.source_records for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy source_records_insert on app.source_records for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy source_records_update on app.source_records for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.source_records to ts_runtime;
create policy supplier_offers_read on app.supplier_offers for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy supplier_offers_insert on app.supplier_offers for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy supplier_offers_update on app.supplier_offers for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.supplier_offers to ts_runtime;
create policy connections_read on app.connections for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy connections_insert on app.connections for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy connections_update on app.connections for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.connections to ts_runtime;
create policy capabilities_read on app.capabilities for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy capabilities_insert on app.capabilities for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy capabilities_update on app.capabilities for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.capabilities to ts_runtime;
create policy mapping_profiles_read on app.mapping_profiles for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy mapping_profiles_insert on app.mapping_profiles for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy mapping_profiles_update on app.mapping_profiles for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.mapping_profiles to ts_runtime;
create policy sync_runs_read on app.sync_runs for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy sync_runs_insert on app.sync_runs for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy sync_runs_update on app.sync_runs for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.sync_runs to ts_runtime;
create policy import_batches_read on app.import_batches for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy import_batches_insert on app.import_batches for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy import_batches_update on app.import_batches for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.import_batches to ts_runtime;
create policy import_rows_read on app.import_rows for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy import_rows_insert on app.import_rows for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy import_rows_update on app.import_rows for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.import_rows to ts_runtime;
create policy merge_reviews_read on app.merge_reviews for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy merge_reviews_insert on app.merge_reviews for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy merge_reviews_update on app.merge_reviews for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.merge_reviews to ts_runtime;
create policy configuration_templates_read on app.configuration_templates for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or true));
create policy configuration_templates_insert on app.configuration_templates for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy configuration_templates_update on app.configuration_templates for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.configuration_templates to ts_runtime;
create policy configuration_rules_read on app.configuration_rules for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or true));
create policy configuration_rules_insert on app.configuration_rules for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy configuration_rules_update on app.configuration_rules for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.configuration_rules to ts_runtime;
create policy imprint_areas_read on app.imprint_areas for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or true));
create policy imprint_areas_insert on app.imprint_areas for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy imprint_areas_update on app.imprint_areas for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.imprint_areas to ts_runtime;
create policy saved_configurations_read on app.saved_configurations for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy saved_configurations_insert on app.saved_configurations for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy saved_configurations_update on app.saved_configurations for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.saved_configurations to ts_runtime;
create policy brand_kits_read on app.brand_kits for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy brand_kits_insert on app.brand_kits for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy brand_kits_update on app.brand_kits for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.brand_kits to ts_runtime;
create policy assets_read on app.assets for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy assets_insert on app.assets for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy assets_update on app.assets for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.assets to ts_runtime;
create policy design_projects_read on app.design_projects for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy design_projects_insert on app.design_projects for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy design_projects_update on app.design_projects for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.design_projects to ts_runtime;
create policy design_versions_read on app.design_versions for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy design_versions_insert on app.design_versions for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy design_versions_update on app.design_versions for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.design_versions to ts_runtime;
create policy placements_read on app.placements for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy placements_insert on app.placements for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy placements_update on app.placements for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.placements to ts_runtime;
create policy render_jobs_read on app.render_jobs for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy render_jobs_insert on app.render_jobs for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy render_jobs_update on app.render_jobs for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.render_jobs to ts_runtime;
create policy proofs_read on app.proofs for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy proofs_insert on app.proofs for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy proofs_update on app.proofs for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.proofs to ts_runtime;
create policy preflight_results_read on app.preflight_results for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy preflight_results_insert on app.preflight_results for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy preflight_results_update on app.preflight_results for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.preflight_results to ts_runtime;
create policy production_assets_read on app.production_assets for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy production_assets_insert on app.production_assets for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy production_assets_update on app.production_assets for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.production_assets to ts_runtime;
create policy carts_read on app.carts for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy carts_insert on app.carts for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy carts_update on app.carts for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.carts to ts_runtime;
create policy cart_lines_read on app.cart_lines for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy cart_lines_insert on app.cart_lines for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy cart_lines_update on app.cart_lines for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.cart_lines to ts_runtime;
create policy requests_read on app.requests for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy requests_insert on app.requests for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy requests_update on app.requests for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.requests to ts_runtime;
create policy estimates_read on app.estimates for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy estimates_insert on app.estimates for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy estimates_update on app.estimates for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.estimates to ts_runtime;
create policy quote_lines_read on app.quote_lines for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy quote_lines_insert on app.quote_lines for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy quote_lines_update on app.quote_lines for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.quote_lines to ts_runtime;
create policy quotes_read on app.quotes for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy quotes_insert on app.quotes for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy quotes_update on app.quotes for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.quotes to ts_runtime;
create policy quote_revisions_read on app.quote_revisions for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy quote_revisions_insert on app.quote_revisions for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy quote_revisions_update on app.quote_revisions for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.quote_revisions to ts_runtime;
create policy approvals_read on app.approvals for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy approvals_insert on app.approvals for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy approvals_update on app.approvals for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.approvals to ts_runtime;
create policy orders_read on app.orders for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy orders_insert on app.orders for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy orders_update on app.orders for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.orders to ts_runtime;
create policy order_lines_read on app.order_lines for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy order_lines_insert on app.order_lines for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy order_lines_update on app.order_lines for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.order_lines to ts_runtime;
create policy jobs_read on app.jobs for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy jobs_insert on app.jobs for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy jobs_update on app.jobs for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.jobs to ts_runtime;
create policy job_components_read on app.job_components for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy job_components_insert on app.job_components for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy job_components_update on app.job_components for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.job_components to ts_runtime;
create policy operations_read on app.operations for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy operations_insert on app.operations for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy operations_update on app.operations for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.operations to ts_runtime;
create policy qc_checks_read on app.qc_checks for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy qc_checks_insert on app.qc_checks for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy qc_checks_update on app.qc_checks for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.qc_checks to ts_runtime;
create policy production_events_read on app.production_events for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy production_events_insert on app.production_events for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy production_events_update on app.production_events for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.production_events to ts_runtime;
create policy purchase_requirements_read on app.purchase_requirements for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy purchase_requirements_insert on app.purchase_requirements for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy purchase_requirements_update on app.purchase_requirements for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.purchase_requirements to ts_runtime;
create policy sourcing_decisions_read on app.sourcing_decisions for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy sourcing_decisions_insert on app.sourcing_decisions for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy sourcing_decisions_update on app.sourcing_decisions for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.sourcing_decisions to ts_runtime;
create policy purchase_orders_read on app.purchase_orders for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy purchase_orders_insert on app.purchase_orders for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy purchase_orders_update on app.purchase_orders for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.purchase_orders to ts_runtime;
create policy purchase_order_lines_read on app.purchase_order_lines for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy purchase_order_lines_insert on app.purchase_order_lines for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy purchase_order_lines_update on app.purchase_order_lines for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.purchase_order_lines to ts_runtime;
create policy provider_transactions_read on app.provider_transactions for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy provider_transactions_insert on app.provider_transactions for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy provider_transactions_update on app.provider_transactions for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.provider_transactions to ts_runtime;
create policy fulfillment_allocations_read on app.fulfillment_allocations for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy fulfillment_allocations_insert on app.fulfillment_allocations for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy fulfillment_allocations_update on app.fulfillment_allocations for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.fulfillment_allocations to ts_runtime;
create policy shipments_read on app.shipments for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy shipments_insert on app.shipments for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy shipments_update on app.shipments for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.shipments to ts_runtime;
create policy shipment_lines_read on app.shipment_lines for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy shipment_lines_insert on app.shipment_lines for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy shipment_lines_update on app.shipment_lines for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.shipment_lines to ts_runtime;
create policy tracking_events_read on app.tracking_events for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy tracking_events_insert on app.tracking_events for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy tracking_events_update on app.tracking_events for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.tracking_events to ts_runtime;
create policy returns_read on app.returns for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy returns_insert on app.returns for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy returns_update on app.returns for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.returns to ts_runtime;
create policy remakes_read on app.remakes for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy remakes_insert on app.remakes for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy remakes_update on app.remakes for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.remakes to ts_runtime;
create policy actual_costs_read on app.actual_costs for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy actual_costs_insert on app.actual_costs for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy actual_costs_update on app.actual_costs for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.actual_costs to ts_runtime;
create policy invoice_references_read on app.invoice_references for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy invoice_references_insert on app.invoice_references for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy invoice_references_update on app.invoice_references for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.invoice_references to ts_runtime;
create policy payment_references_read on app.payment_references for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy payment_references_insert on app.payment_references for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy payment_references_update on app.payment_references for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.payment_references to ts_runtime;
create policy reconciliations_read on app.reconciliations for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy reconciliations_insert on app.reconciliations for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy reconciliations_update on app.reconciliations for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.reconciliations to ts_runtime;
create policy profit_snapshots_read on app.profit_snapshots for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy profit_snapshots_insert on app.profit_snapshots for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy profit_snapshots_update on app.profit_snapshots for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.profit_snapshots to ts_runtime;
create policy stores_read on app.stores for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or data->>'visibility'='PUBLIC' or exists(select 1 from app.store_memberships m where m.store_id=stores.id and m.owner_id=current_setting('ts.user',true))));
create policy stores_insert on app.stores for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy stores_update on app.stores for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.stores to ts_runtime;
create policy store_memberships_read on app.store_memberships for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy store_memberships_insert on app.store_memberships for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy store_memberships_update on app.store_memberships for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.store_memberships to ts_runtime;
create policy store_products_read on app.store_products for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or true));
create policy store_products_insert on app.store_products for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy store_products_update on app.store_products for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.store_products to ts_runtime;
create policy spending_budgets_read on app.spending_budgets for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy spending_budgets_insert on app.spending_budgets for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy spending_budgets_update on app.spending_budgets for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.spending_budgets to ts_runtime;
create policy allowances_read on app.allowances for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy allowances_insert on app.allowances for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy allowances_update on app.allowances for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.allowances to ts_runtime;
create policy campaigns_read on app.campaigns for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy campaigns_insert on app.campaigns for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy campaigns_update on app.campaigns for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.campaigns to ts_runtime;
create policy bundle_templates_read on app.bundle_templates for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or true));
create policy bundle_templates_insert on app.bundle_templates for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy bundle_templates_update on app.bundle_templates for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.bundle_templates to ts_runtime;
create policy bundle_components_read on app.bundle_components for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or true));
create policy bundle_components_insert on app.bundle_components for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy bundle_components_update on app.bundle_components for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.bundle_components to ts_runtime;
create policy bundle_configurations_read on app.bundle_configurations for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy bundle_configurations_insert on app.bundle_configurations for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy bundle_configurations_update on app.bundle_configurations for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.bundle_configurations to ts_runtime;
create policy content_assets_read on app.content_assets for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy content_assets_insert on app.content_assets for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy content_assets_update on app.content_assets for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.content_assets to ts_runtime;
create policy content_revisions_read on app.content_revisions for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy content_revisions_insert on app.content_revisions for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy content_revisions_update on app.content_revisions for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.content_revisions to ts_runtime;
create policy campaign_segments_read on app.campaign_segments for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy campaign_segments_insert on app.campaign_segments for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy campaign_segments_update on app.campaign_segments for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.campaign_segments to ts_runtime;
create policy publications_read on app.publications for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy publications_insert on app.publications for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy publications_update on app.publications for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.publications to ts_runtime;
create policy attributions_read on app.attributions for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy attributions_insert on app.attributions for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy attributions_update on app.attributions for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.attributions to ts_runtime;
create policy automation_rules_read on app.automation_rules for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy automation_rules_insert on app.automation_rules for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy automation_rules_update on app.automation_rules for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.automation_rules to ts_runtime;
create policy automation_runs_read on app.automation_runs for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy automation_runs_insert on app.automation_runs for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy automation_runs_update on app.automation_runs for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.automation_runs to ts_runtime;
create policy notifications_read on app.notifications for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy notifications_insert on app.notifications for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy notifications_update on app.notifications for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.notifications to ts_runtime;
create policy report_definitions_read on app.report_definitions for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy report_definitions_insert on app.report_definitions for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy report_definitions_update on app.report_definitions for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.report_definitions to ts_runtime;
create policy kpi_snapshots_read on app.kpi_snapshots for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy kpi_snapshots_insert on app.kpi_snapshots for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy kpi_snapshots_update on app.kpi_snapshots for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.kpi_snapshots to ts_runtime;
create policy data_quality_issues_read on app.data_quality_issues for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy data_quality_issues_insert on app.data_quality_issues for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy data_quality_issues_update on app.data_quality_issues for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.data_quality_issues to ts_runtime;
create policy dashboards_read on app.dashboards for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy dashboards_insert on app.dashboards for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy dashboards_update on app.dashboards for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.dashboards to ts_runtime;
create policy outbox_events_read on app.outbox_events for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy outbox_events_insert on app.outbox_events for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy outbox_events_update on app.outbox_events for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.outbox_events to ts_runtime;
create policy audit_events_read on app.audit_events for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy audit_events_insert on app.audit_events for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy audit_events_update on app.audit_events for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.audit_events to ts_runtime;
create policy command_receipts_read on app.command_receipts for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy command_receipts_insert on app.command_receipts for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy command_receipts_update on app.command_receipts for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true))) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert,update on app.command_receipts to ts_runtime;
create policy webhook_receipts_read on app.webhook_receipts for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy webhook_receipts_insert on app.webhook_receipts for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy webhook_receipts_update on app.webhook_receipts for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.webhook_receipts to ts_runtime;
create policy catalog_rollback_manifests_read on app.catalog_rollback_manifests for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy catalog_rollback_manifests_insert on app.catalog_rollback_manifests for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy catalog_rollback_manifests_update on app.catalog_rollback_manifests for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.catalog_rollback_manifests to ts_runtime;
create policy secret_metadata_read on app.secret_metadata for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy secret_metadata_insert on app.secret_metadata for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
create policy secret_metadata_update on app.secret_metadata for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer')) with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer'));
grant select,insert,update on app.secret_metadata to ts_runtime;
create function app.reject_mutation() returns trigger language plpgsql as $$ begin raise exception 'IMMUTABLE_RECORD'; end $$;
create trigger immutable_quote_revisions before update or delete on app.quote_revisions for each row execute function app.reject_mutation();
create trigger immutable_order_lines before update or delete on app.order_lines for each row execute function app.reject_mutation();
create trigger immutable_design_versions before update or delete on app.design_versions for each row execute function app.reject_mutation();
create trigger immutable_catalog_revisions before update or delete on app.catalog_revisions for each row execute function app.reject_mutation();
create trigger immutable_source_records before update or delete on app.source_records for each row execute function app.reject_mutation();
create trigger immutable_audit_events before update or delete on app.audit_events for each row execute function app.reject_mutation();
create trigger immutable_actual_costs before update or delete on app.actual_costs for each row execute function app.reject_mutation();
create trigger immutable_profit_snapshots before update or delete on app.profit_snapshots for each row execute function app.reject_mutation();
create unique index command_once on app.command_receipts(tenant_id,workspace_id,title,(data->>'key'));
create unique index webhook_once on app.webhook_receipts(tenant_id,workspace_id,title,(data->>'eventId'));
create index outbox_pending on app.outbox_events(created_at) where status='PENDING';
create index product_search on app.products using gin(to_tsvector('simple',title));
create index variant_color on app.variants(tenant_id,workspace_id,product_id,(data->>'color'));
alter table tenants enable row level security;
alter table workspaces enable row level security;
alter table memberships enable row level security;
create policy member_read on memberships for select to ts_runtime using(tenant_id::text=current_setting('ts.tenant',true) and workspace_id::text=current_setting('ts.workspace',true) and (user_id=current_setting('ts.user',true) or current_setting('ts.role',true)='owner'));
create policy member_update on memberships for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true)='owner') with check(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true)='owner');
grant select,update on memberships to ts_runtime;
grant select(id,name,email) on "user" to ts_runtime;
