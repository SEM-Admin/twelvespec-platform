-- Production-owned immutable planning profiles, not manufacturing approvals.
create table app.process_profile_versions (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,created_by text not null,
 profile_key text not null,title text not null,product_id uuid not null,variant_id uuid not null,
 product_revision integer not null check(product_revision>0),variant_revision integer not null check(variant_revision>0),
 source_id uuid not null,previous_profile_id uuid,version_number integer not null check(version_number>0),
 verification text not null check(verification in ('SYNTHETIC','UNVERIFIED','DOCUMENTED')),
 data jsonb not null,fingerprint text not null,created_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id),unique(tenant_id,workspace_id,profile_key),
 foreign key(tenant_id,workspace_id,created_by) references memberships(tenant_id,workspace_id,user_id),
 foreign key(tenant_id,workspace_id,product_id,variant_id) references app.variants(tenant_id,workspace_id,product_id,id),
 foreign key(tenant_id,workspace_id,source_id) references app.intelligence_sources(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,previous_profile_id) references app.process_profile_versions(tenant_id,workspace_id,id)
);
create index process_profile_identity on app.process_profile_versions(tenant_id,workspace_id,product_id,variant_id,created_at desc,id);
create index process_profile_source on app.process_profile_versions(tenant_id,workspace_id,source_id);
create index process_profile_previous on app.process_profile_versions(tenant_id,workspace_id,previous_profile_id) where previous_profile_id is not null;
-- M1 observations were explicitly material/per-item only. Defaults preserve that meaning;
-- no original rate, fingerprint or commercial commitment is rewritten.
alter table app.price_observations
 add column component_code text not null default 'material_cost' check(component_code in ('material_cost','decoration_run_cost','setup','prepress','outsourced_labor','packaging','allocated_freight','other_direct_cost')),
 add column charge_basis text not null default 'PER_ITEM' check(charge_basis in ('PER_ITEM','PER_ORDER','PER_SHIPMENT')),
 add column process_profile_id uuid,add column method text,add column location text,
 add foreign key(tenant_id,workspace_id,process_profile_id) references app.process_profile_versions(tenant_id,workspace_id,id),
 add check(component_code='material_cost' or (process_profile_id is not null and method is not null and location is not null)),
 add check(charge_basis='PER_ITEM' or process_profile_id is not null),
 add check(charge_basis='PER_ITEM' or (unit_basis='EACH' and units_per_price=1)),
 add check(charge_basis<>'PER_SHIPMENT' or component_code='allocated_freight');
create index price_observation_profile on app.price_observations(tenant_id,workspace_id,process_profile_id) where process_profile_id is not null;
create table app.commercial_qualifications (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,created_by text not null,
 quote_id uuid not null,quote_revision integer not null check(quote_revision>0),line_index integer not null check(line_index between 0 and 99),
 process_profile_id uuid not null,qualification_version text not null,request jsonb not null,result jsonb not null,
 created_at timestamptz not null default now(),unique(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,created_by) references memberships(tenant_id,workspace_id,user_id),
 foreign key(tenant_id,workspace_id,quote_id) references app.quotes(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,process_profile_id) references app.process_profile_versions(tenant_id,workspace_id,id)
);
create index commercial_qualification_quote on app.commercial_qualifications(tenant_id,workspace_id,quote_id,created_at desc,id);
create index commercial_qualification_profile on app.commercial_qualifications(tenant_id,workspace_id,process_profile_id);
create table app.qualification_cost_evidence (
 tenant_id uuid not null,workspace_id uuid not null,qualification_id uuid not null,component_code text not null,
 observation_id uuid not null,
 primary key(tenant_id,workspace_id,qualification_id,component_code,observation_id),
 foreign key(tenant_id,workspace_id,qualification_id) references app.commercial_qualifications(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,observation_id) references app.price_observations(tenant_id,workspace_id,id),
 check(component_code in ('material_cost','decoration_run_cost','setup','prepress','outsourced_labor','packaging','allocated_freight','other_direct_cost'))
);
create index qualification_evidence_observation on app.qualification_cost_evidence(tenant_id,workspace_id,observation_id);
-- Operations may inspect profile provenance, never private price tables by this grant.
create policy source_production_read on app.intelligence_sources for select to ts_runtime
 using(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true)='operations');
create policy restriction_production_read on app.intelligence_restrictions for select to ts_runtime
 using(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true)='operations');
do $$ declare t text; begin
 foreach t in array array['process_profile_versions','commercial_qualifications','qualification_cost_evidence'] loop
  execute format('alter table app.%I enable row level security',t);
  execute format('alter table app.%I force row level security',t);
  execute format('create trigger immutable_history before update or delete on app.%I for each row execute function app.reject_mutation()',t);
  execute format('grant select,insert on app.%I to ts_runtime',t);
 end loop;
end $$;
create policy process_profile_read on app.process_profile_versions for select to ts_runtime
 using(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true) in ('owner','operations','sales','manager','integration_admin','buyer','finance'));
create policy process_profile_append on app.process_profile_versions for insert to ts_runtime
 with check(app.scope_ok(tenant_id,workspace_id) and created_by=current_setting('ts.user',true) and current_setting('ts.role',true) in ('owner','operations'));
create policy qualification_read on app.commercial_qualifications for select to ts_runtime
 using(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true) in ('owner','sales','manager'));
create policy qualification_append on app.commercial_qualifications for insert to ts_runtime
 with check(app.scope_ok(tenant_id,workspace_id) and created_by=current_setting('ts.user',true) and current_setting('ts.role',true) in ('owner','sales','manager'));
create policy qualification_evidence_read on app.qualification_cost_evidence for select to ts_runtime
 using(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true) in ('owner','sales','manager'));
create policy qualification_evidence_append on app.qualification_cost_evidence for insert to ts_runtime
 with check(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true) in ('owner','sales','manager'));
