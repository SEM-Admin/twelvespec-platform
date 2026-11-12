-- Additive CIA evidence only. No legacy offers or commitments are reclassified/backfilled.
create table app.intelligence_sources (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 created_by text not null, source_key text not null, title text not null, publisher text not null,
 edition text not null, source_uri text, content_hash text not null check(content_hash ~ '^[a-f0-9]{64}$'),
 source_record_id uuid, origin text not null check(origin in ('SYNTHETIC','OPERATOR_DOCUMENT')),
 rights_reference text not null, allowed_uses text[] not null,
 rights_valid_from timestamptz not null, rights_valid_until timestamptz not null,
 retention_until timestamptz not null, parser_version text not null,
 fingerprint text not null, created_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), unique(tenant_id,workspace_id,source_key),
 foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,created_by) references memberships(tenant_id,workspace_id,user_id),
 foreign key(tenant_id,workspace_id,source_record_id) references app.source_records(tenant_id,workspace_id,id),
 check(cardinality(allowed_uses)>0 and allowed_uses <@ array['INTERNAL_RESEARCH','QUOTE_COST']::text[]),
 check(rights_valid_until>rights_valid_from and retention_until>=rights_valid_until)
);
create table app.intelligence_restrictions (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 source_id uuid not null, created_by text not null, reason text not null,
 created_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), unique(tenant_id,workspace_id,source_id),
 foreign key(tenant_id,workspace_id,source_id) references app.intelligence_sources(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,created_by) references memberships(tenant_id,workspace_id,user_id)
);
-- Price observations must reference a variant of THIS product, not merely the same workspace.
alter table app.variants add constraint variants_product_identity unique(tenant_id,workspace_id,product_id,id);
create table app.price_observations (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 created_by text not null, source_id uuid not null, observation_key text not null,
 product_id uuid not null, variant_id uuid not null,
 product_revision integer not null check(product_revision>0), variant_revision integer not null check(variant_revision>0),
 account_id uuid, price_class text not null check(price_class in
 ('PUBLISHED_LIST','MSRP','MAP','DISTRIBUTOR_NET','ACCOUNT_NET','NEGOTIATED','MARKET_OBSERVATION','ESTIMATED_LANDED','TWELVESPEC_SELL','ACTUAL_COST')),
 original_value text not null check(original_value ~ '^[0-9]{1,14}(\.[0-9]{1,8})?$'),
 unit_amount numeric(22,8) not null check(unit_amount>=0), source_scale integer not null check(source_scale between 0 and 8),
 currency text not null check(currency ~ '^[A-Z]{3}$'),
 unit_basis text not null check(unit_basis in ('EACH','PACK')), units_per_price integer not null check(units_per_price>0),
 minimum_quantity integer not null check(minimum_quantity>0), maximum_quantity integer,
 order_multiple integer not null check(order_multiple>0),
 territory text not null check(territory ~ '^[A-Z]{2}$'), channel text not null check(channel in ('DIRECT','COMPANY_STORE','MARKETPLACE')),
 observed_at timestamptz not null, effective_from timestamptz not null, effective_until timestamptz not null,
 freshness_hours integer not null check(freshness_hours between 1 and 8760),
 evidence_state text not null check(evidence_state in ('UNVERIFIED','SYNTHETIC','OPERATOR_REVIEWED')),
 review_reference text, fingerprint text not null, created_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id), unique(tenant_id,workspace_id,source_id,observation_key),
 foreign key(tenant_id,workspace_id,source_id) references app.intelligence_sources(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,product_id,variant_id) references app.variants(tenant_id,workspace_id,product_id,id),
 foreign key(tenant_id,workspace_id,account_id) references app.accounts(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,created_by) references memberships(tenant_id,workspace_id,user_id),
 check(unit_amount=original_value::numeric),
 check(source_scale=case when position('.' in original_value)>0 then length(split_part(original_value,'.',2)) else 0 end),
 check(unit_basis<>'EACH' or units_per_price=1),
 check(maximum_quantity is null or maximum_quantity>=minimum_quantity), check(effective_until>effective_from),
 check(price_class not in ('ACCOUNT_NET','NEGOTIATED') or account_id is not null),
 check(evidence_state<>'OPERATOR_REVIEWED' or (review_reference is not null and length(btrim(review_reference))>0))
);
create index price_observation_identity on app.price_observations(tenant_id,workspace_id,product_id,variant_id,observed_at desc,id);
create index price_observation_source on app.price_observations(tenant_id,workspace_id,source_id);
create index price_observation_account on app.price_observations(tenant_id,workspace_id,account_id) where account_id is not null;
create table app.price_assessments (
 id uuid primary key default gen_random_uuid(), tenant_id uuid not null, workspace_id uuid not null,
 created_by text not null, quote_id uuid not null, observation_id uuid not null,
 quote_revision integer not null check(quote_revision>0), assessment_version text not null,
 request jsonb not null, result jsonb not null, created_at timestamptz not null default now(),
 unique(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,quote_id) references app.quotes(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,observation_id) references app.price_observations(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,created_by) references memberships(tenant_id,workspace_id,user_id)
);
create index price_assessment_quote on app.price_assessments(tenant_id,workspace_id,quote_id,created_at desc,id);
do $$ declare t text; begin
 foreach t in array array['intelligence_sources','intelligence_restrictions','price_observations','price_assessments'] loop
  execute format('alter table app.%I enable row level security',t);
  execute format('alter table app.%I force row level security',t);
  execute format('create policy evidence_read on app.%I for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and current_setting(''ts.role'',true) in (''owner'',''integration_admin'',''sales'',''manager'',''buyer'',''finance''))',t);
  execute format('create trigger immutable_evidence before update or delete on app.%I for each row execute function app.reject_mutation()',t);
  execute format('grant select,insert on app.%I to ts_runtime',t);
 end loop;
 foreach t in array array['intelligence_sources','intelligence_restrictions','price_observations'] loop
  execute format('create policy evidence_append on app.%I for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and created_by=current_setting(''ts.user'',true) and current_setting(''ts.role'',true) in (''owner'',''integration_admin''))',t);
 end loop;
end $$;
create policy assessment_append on app.price_assessments for insert to ts_runtime
 with check(app.scope_ok(tenant_id,workspace_id) and created_by=current_setting('ts.user',true)
 and current_setting('ts.role',true) in ('owner','sales','manager'));
