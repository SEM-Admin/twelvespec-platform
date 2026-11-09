-- Native read-only supplier APIs: persistent, private account budgets and call receipts.
create table app.supplier_api_billing_groups (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 provider text not null check(provider in ('SAGE_CONNECT','SINALITE')),
 environment text not null check(environment in ('mock','sandbox','live_readonly')),
 billing_hash text not null, monthly_spend numeric(18,6) not null default 0 check(monthly_spend>=0),
 approval_period text not null default '', timezone text not null default 'America/Chicago',
 unique(tenant_id,workspace_id,id), unique(tenant_id,provider,environment,billing_hash),
 foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id)
);
create table app.supplier_api_accounts (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 provider text not null check(provider in ('SAGE_CONNECT','SINALITE')),
 environment text not null check(environment in ('mock','sandbox','live_readonly')),
 account_hash text not null check(length(account_hash)=64), billing_group_id uuid not null, title text not null,
 policy jsonb not null, approval_period text not null default '', revision integer not null default 1,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), unique(tenant_id,provider,environment,account_hash),
 foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,billing_group_id) references app.supplier_api_billing_groups(tenant_id,workspace_id,id)
);
create table app.supplier_api_secrets (
 tenant_id uuid not null, workspace_id uuid not null, connection_id uuid not null,
 account_id uuid not null, version integer not null check(version>0),
 key_id text not null, ciphertext text not null, iv text not null, tag text not null,
 updated_at timestamptz not null default now(), primary key(tenant_id,workspace_id,connection_id),
 foreign key(tenant_id,workspace_id,connection_id) references app.connections(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,account_id) references app.supplier_api_accounts(tenant_id,workspace_id,id)
);
create table app.supplier_api_calls (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 account_id uuid not null, connection_id uuid not null, operation text not null,
 command_key text not null, request_hash text not null, run_id text not null,
 period text not null, day text not null, charged boolean not null,
 units integer not null check(units>=0), fee_units integer not null check(fee_units>=0), cost_ceiling numeric(18,6) not null check(cost_ceiling>=0),
 status text not null check(status in ('RESERVED','SUCCEEDED','FAILED','UNKNOWN','BLOCKED','CACHE_HIT')),
 code text, result jsonb, created_at timestamptz not null default now(), finished_at timestamptz,
 unique(tenant_id,workspace_id,id), unique(tenant_id,workspace_id,account_id,connection_id,command_key),
 foreign key(tenant_id,workspace_id,connection_id) references app.connections(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,account_id) references app.supplier_api_accounts(tenant_id,workspace_id,id)
);
create index supplier_api_calls_period on app.supplier_api_calls(tenant_id,workspace_id,account_id,period,day,created_at) where charged;
create table app.supplier_api_cache (
 tenant_id uuid not null, workspace_id uuid not null, account_id uuid not null, cache_key text not null,
 result jsonb not null, expires_at timestamptz not null, created_at timestamptz not null default now(),
 primary key(tenant_id,workspace_id,account_id,cache_key),
 foreign key(tenant_id,workspace_id,account_id) references app.supplier_api_accounts(tenant_id,workspace_id,id)
);
do $$ declare t text; begin
 foreach t in array array['supplier_api_billing_groups','supplier_api_accounts','supplier_api_secrets','supplier_api_calls','supplier_api_cache'] loop
  execute format('alter table app.%I enable row level security',t);
  execute format('alter table app.%I force row level security',t);
  execute format('create policy supplier_api_scope on app.%I to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and current_setting(''ts.role'',true) in (''owner'',''integration_admin'')) with check(app.scope_ok(tenant_id,workspace_id) and current_setting(''ts.role'',true) in (''owner'',''integration_admin''))',t);
  execute format('grant select,insert,update on app.%I to ts_runtime',t);
 end loop;
end $$;
-- Calls are retained even when imports fail; runtime may only finalize a reserved receipt once.
create function app.protect_supplier_api_call() returns trigger language plpgsql as $$ begin
 if tg_op='DELETE' then raise exception 'Supplier API receipts cannot be deleted'; end if;
 if old.status<>'RESERVED' or new.status not in ('SUCCEEDED','FAILED','UNKNOWN')
 or (to_jsonb(old)-array['status','code','result','finished_at']) is distinct from (to_jsonb(new)-array['status','code','result','finished_at'])
 then raise exception 'Supplier API charge fields are immutable'; end if;
 return new;
end $$;
create trigger protect_supplier_api_calls before update or delete on app.supplier_api_calls for each row execute function app.protect_supplier_api_call();
