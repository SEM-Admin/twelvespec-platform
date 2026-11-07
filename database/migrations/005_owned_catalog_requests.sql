-- Greenfield catalog source lineage and immutable customer request lines.
alter table app.products add column source_id uuid,
 add foreign key (tenant_id,workspace_id,source_id) references app.source_records(tenant_id,workspace_id,id);
create index products_source on app.products(tenant_id,workspace_id,source_id);
create unique index products_catalog_source_key on app.products(tenant_id,workspace_id,(data->>'catalogSourceKey'))
 where data->>'catalogSourceKey' is not null;
create unique index source_catalog_snapshot on app.source_records(tenant_id,workspace_id,(data->>'catalogSourceKey'),(data->>'rawHash'))
 where data->>'catalogSourceKey' is not null;
create index source_catalog_library on app.source_records(tenant_id,workspace_id,(data->>'supplier'),created_at desc,id)
 where data->>'catalogSourceKey' is not null;

alter table app.quotes add column request_id uuid,
 add foreign key (tenant_id,workspace_id,request_id) references app.requests(tenant_id,workspace_id,id);
create index quotes_request on app.quotes(tenant_id,workspace_id,request_id);

create table app.request_lines (
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'SUBMITTED',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 request_id uuid not null,product_id uuid not null,variant_id uuid,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id),
 foreign key(tenant_id,workspace_id,request_id) references app.requests(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,variant_id) references app.variants(tenant_id,workspace_id,id)
);
create index request_lines_request on app.request_lines(tenant_id,workspace_id,request_id);
create index request_lines_product on app.request_lines(tenant_id,workspace_id,product_id);
create index request_lines_variant on app.request_lines(tenant_id,workspace_id,variant_id);
alter table app.request_lines enable row level security;
alter table app.request_lines force row level security;
create policy request_lines_read on app.request_lines for select to ts_runtime
 using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
create policy request_lines_insert on app.request_lines for insert to ts_runtime
 with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or owner_id=current_setting('ts.user',true)));
grant select,insert on app.request_lines to ts_runtime;
create trigger immutable_request_lines before update or delete on app.request_lines for each row execute function app.reject_mutation();
