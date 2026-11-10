-- Website & Content Studio. Editorial data stays separate from commerce truth.
-- All additions are scoped; legacy marketing drafts are never auto-published.
create table app.websites(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'ACTIVE',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 store_id uuid,active_release_id uuid,generation integer not null default 0 check(generation>=0),
 unique(tenant_id,workspace_id,id),foreign key(tenant_id,workspace_id) references workspaces(tenant_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id),
 foreign key(tenant_id,workspace_id,store_id) references app.stores(tenant_id,workspace_id,id)
);
create unique index websites_primary_scope on app.websites(tenant_id,workspace_id) where store_id is null;
create unique index websites_store_scope on app.websites(tenant_id,workspace_id,store_id) where store_id is not null;
alter table app.websites enable row level security;
alter table app.websites force row level security;

alter table app.content_assets add column site_id uuid,add column document_type text,
 add column website_path text,add column head_revision_id uuid,
 add foreign key(tenant_id,workspace_id,site_id) references app.websites(tenant_id,workspace_id,id),
 add unique(tenant_id,workspace_id,site_id,id),
 add check((site_id is null and document_type is null and website_path is null and head_revision_id is null)
  or (site_id is not null and document_type in ('WEBSITE_PAGE','WEBSITE_NAVIGATION','WEBSITE_FOOTER','WEBSITE_THEME')));
create unique index website_page_path on app.content_assets(tenant_id,workspace_id,site_id,website_path) where document_type='WEBSITE_PAGE';
create unique index website_global_document on app.content_assets(tenant_id,workspace_id,site_id,document_type) where document_type<>'WEBSITE_PAGE';
create index website_content_scope on app.content_assets(tenant_id,workspace_id,site_id,status,updated_at desc,id);
alter table app.content_revisions add column site_id uuid,add column content_id uuid,
 add column parent_content_revision_id uuid,
 add foreign key(tenant_id,workspace_id,site_id,content_id) references app.content_assets(tenant_id,workspace_id,site_id,id),
 add foreign key(tenant_id,workspace_id,parent_content_revision_id) references app.content_revisions(tenant_id,workspace_id,id),
 add unique(tenant_id,workspace_id,site_id,content_id,id),
 add check((site_id is null and content_id is null) or (site_id is not null and content_id is not null));
create index website_content_revision_history on app.content_revisions(tenant_id,workspace_id,site_id,content_id,created_at desc,id);
create unique index website_revision_scoped_site on app.content_revisions(tenant_id,workspace_id,site_id,id);
alter table app.content_assets add foreign key(tenant_id,workspace_id,site_id,id,head_revision_id)
 references app.content_revisions(tenant_id,workspace_id,site_id,content_id,id) deferrable initially immediate;
create trigger website_revision_immutable before update or delete on app.content_revisions
 for each row when(old.site_id is not null) execute function app.reject_mutation();

create table app.website_releases(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'APPROVED',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 site_id uuid not null,previous_release_id uuid,
 unique(tenant_id,workspace_id,id),unique(tenant_id,workspace_id,site_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id),
 foreign key(tenant_id,workspace_id,site_id) references app.websites(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,site_id,previous_release_id) references app.website_releases(tenant_id,workspace_id,site_id,id)
);
alter table app.website_releases enable row level security;
alter table app.website_releases force row level security;
create index website_release_history on app.website_releases(tenant_id,workspace_id,site_id,created_at desc,id);
create trigger website_release_immutable before update or delete on app.website_releases for each row execute function app.reject_mutation();
alter table app.websites add foreign key(tenant_id,workspace_id,id,active_release_id)
 references app.website_releases(tenant_id,workspace_id,site_id,id) deferrable initially immediate;

create table app.website_publish_jobs(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'SCHEDULED',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 site_id uuid not null,release_id uuid not null,run_at timestamptz not null,expires_at timestamptz,
 expected_generation integer not null check(expected_generation>=0),
 unique(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id),
 foreign key(tenant_id,workspace_id,site_id,release_id) references app.website_releases(tenant_id,workspace_id,site_id,id),
 check(expires_at is null or expires_at>run_at)
);
alter table app.website_publish_jobs enable row level security;
alter table app.website_publish_jobs force row level security;
create index website_jobs_due on app.website_publish_jobs(run_at,id) where status in ('SCHEDULED','RETRY');
create index website_jobs_scope on app.website_publish_jobs(tenant_id,workspace_id,site_id,created_at desc);

-- Durable bytes are nullable additions to the canonical asset record, not a
-- public bucket. Private originals and optimized derivatives have different IDs.
alter table app.assets add column site_id uuid,add column original_asset_id uuid,
 add column web_bytes bytea,
 add foreign key(tenant_id,workspace_id,site_id) references app.websites(tenant_id,workspace_id,id),
 add foreign key(tenant_id,workspace_id,original_asset_id) references app.assets(tenant_id,workspace_id,id),
 add check(web_bytes is null or (site_id is not null and octet_length(web_bytes)<=8388608));
create index website_asset_scope on app.assets(tenant_id,workspace_id,site_id,status,created_at desc);
create unique index website_asset_scoped_site on app.assets(tenant_id,workspace_id,site_id,id);
create function app.website_asset_bytes_immutable() returns trigger language plpgsql set search_path=pg_catalog,app as $$
begin
 if old.site_id is not null and (new.web_bytes is distinct from old.web_bytes or new.site_id is distinct from old.site_id or new.original_asset_id is distinct from old.original_asset_id or new.data->>'kind' is distinct from old.data->>'kind') then
  raise exception 'IMMUTABLE_WEBSITE_ASSET_BYTES';
 end if;
 return new;
end $$;
create trigger website_asset_bytes_immutable before update on app.assets for each row execute function app.website_asset_bytes_immutable();

alter table app.collections add column store_id uuid,
 add foreign key(tenant_id,workspace_id,store_id) references app.stores(tenant_id,workspace_id,id);
create table app.collection_products(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'ACTIVE',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 collection_id uuid not null,product_id uuid not null,variant_id uuid,
 unique(tenant_id,workspace_id,id),unique(tenant_id,workspace_id,collection_id,product_id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id),
 foreign key(tenant_id,workspace_id,collection_id) references app.collections(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,product_id,variant_id) references app.variants(tenant_id,workspace_id,product_id,id)
);
alter table app.collection_products enable row level security;
alter table app.collection_products force row level security;
create index collection_products_order on app.collection_products(tenant_id,workspace_id,collection_id,((data->>'rank')::integer),id);
-- Preserve legacy memberships. Canonical collections are not auto-published.
insert into app.collection_products(tenant_id,workspace_id,owner_id,title,collection_id,product_id,data)
 select c.tenant_id,c.workspace_id,c.owner_id,p.title,c.id,p.id,jsonb_build_object('rank',v.ordinality-1,'featured',false,'legacyBackfill',true)
 from app.collections c cross join lateral jsonb_array_elements_text(case when jsonb_typeof(c.data->'productIds')='array' then c.data->'productIds' else '[]'::jsonb end) with ordinality v(product_id,ordinality)
 join app.products p on p.tenant_id=c.tenant_id and p.workspace_id=c.workspace_id and p.id::text=v.product_id
 on conflict(tenant_id,workspace_id,collection_id,product_id) do nothing;

create table app.content_references(
 id uuid primary key default gen_random_uuid(),tenant_id uuid not null,workspace_id uuid not null,owner_id text not null,
 title text not null,status text not null default 'ACTIVE',data jsonb not null default '{}',revision integer not null default 1 check(revision>0),
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 site_id uuid not null,source_revision_id uuid,release_id uuid,
 content_revision_id uuid,content_id uuid,product_id uuid,variant_id uuid,collection_id uuid,asset_id uuid,store_id uuid,brand_kit_id uuid,
 unique(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,owner_id) references memberships(tenant_id,workspace_id,user_id),
 foreign key(tenant_id,workspace_id,site_id) references app.websites(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,site_id,source_revision_id) references app.content_revisions(tenant_id,workspace_id,site_id,id),
 foreign key(tenant_id,workspace_id,site_id,release_id) references app.website_releases(tenant_id,workspace_id,site_id,id),
 foreign key(tenant_id,workspace_id,site_id,content_revision_id) references app.content_revisions(tenant_id,workspace_id,site_id,id),
 foreign key(tenant_id,workspace_id,site_id,content_id) references app.content_assets(tenant_id,workspace_id,site_id,id),
 foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,product_id,variant_id) references app.variants(tenant_id,workspace_id,product_id,id),
 foreign key(tenant_id,workspace_id,collection_id) references app.collections(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,site_id,asset_id) references app.assets(tenant_id,workspace_id,site_id,id),
 foreign key(tenant_id,workspace_id,store_id) references app.stores(tenant_id,workspace_id,id),
 foreign key(tenant_id,workspace_id,brand_kit_id) references app.brand_kits(tenant_id,workspace_id,id),
 check(num_nonnulls(source_revision_id,release_id)=1),
 check((variant_id is null and num_nonnulls(content_revision_id,content_id,product_id,collection_id,asset_id,store_id,brand_kit_id)=1)
  or (variant_id is not null and product_id is not null and num_nonnulls(content_revision_id,content_id,collection_id,asset_id,store_id,brand_kit_id)=0))
);
alter table app.content_references enable row level security;
alter table app.content_references force row level security;
create index content_references_revision on app.content_references(tenant_id,workspace_id,source_revision_id);
create index content_references_release on app.content_references(tenant_id,workspace_id,release_id);
create index content_references_asset on app.content_references(tenant_id,workspace_id,asset_id);
create trigger website_reference_immutable before update or delete on app.content_references for each row execute function app.reject_mutation();
alter table app.approvals add column site_id uuid,add column content_revision_id uuid,
 add foreign key(tenant_id,workspace_id,site_id) references app.websites(tenant_id,workspace_id,id),
 add foreign key(tenant_id,workspace_id,content_revision_id) references app.content_revisions(tenant_id,workspace_id,id);
create index website_revision_approval on app.approvals(tenant_id,workspace_id,site_id,content_revision_id,status);

-- Existing resource_grants are REQUESTED, hence do not confer permissions.
-- Only the explicit owner command creates an ACTIVE website capability.
create function app.website_can(t uuid,w uuid,s uuid,st uuid,cap text) returns boolean language sql stable security invoker set search_path=pg_catalog,app,public as $$
 select app.scope_ok(t,w) and (
  current_setting('ts.role',true)='owner'
  or (cap in ('EDIT','MEDIA') and current_setting('ts.role',true)='marketing')
  or (current_setting('ts.role',true) not in ('customer','staff') and exists(
   select 1 from app.resource_grants g where g.tenant_id=t and g.workspace_id=w and g.status='ACTIVE'
    and g.data->>'kind'='WEBSITE_CAPABILITY' and g.data->>'userId'=current_setting('ts.user',true)
    and g.data->>'resourceId'=s::text and g.data->>'permission'=cap
  ))
  or (cap in ('EDIT','MEDIA') and st is not null and current_setting('ts.role',true)='store_admin' and exists(
   select 1 from app.store_memberships m where m.tenant_id=t and m.workspace_id=w and m.store_id=st
    and m.owner_id=current_setting('ts.user',true) and m.status='ACTIVE' and m.data->>'eligible'='true'
  ))
 ) and (current_setting('ts.role',true)<>'store_admin' or (st is not null and exists(
  select 1 from app.store_memberships m where m.tenant_id=t and m.workspace_id=w and m.store_id=st
   and m.owner_id=current_setting('ts.user',true) and m.status='ACTIVE' and m.data->>'eligible'='true')))
$$;
revoke all on function app.website_can(uuid,uuid,uuid,uuid,text) from public;
grant execute on function app.website_can(uuid,uuid,uuid,uuid,text) to ts_runtime;
create policy websites_read on app.websites for select to ts_runtime using(app.website_can(tenant_id,workspace_id,id,store_id,'EDIT') or app.website_can(tenant_id,workspace_id,id,store_id,'MERCHANDISE'));
create policy websites_insert on app.websites for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true)='owner');
create policy websites_update on app.websites for update to ts_runtime using(app.website_can(tenant_id,workspace_id,id,store_id,'PUBLISH')) with check(app.website_can(tenant_id,workspace_id,id,store_id,'PUBLISH'));
grant select,insert,update on app.websites to ts_runtime;

do $$ declare tab text;predicate text; begin
 for tab in select unnest(array['website_releases','website_publish_jobs','content_references']) loop
  execute format('create policy %I on app.%I for select to ts_runtime using(exists(select 1 from app.websites w where w.tenant_id=%I.tenant_id and w.workspace_id=%I.workspace_id and w.id=%I.site_id))',tab||'_read',tab,tab,tab,tab);
  execute format('create policy %I on app.%I for insert to ts_runtime with check(exists(select 1 from app.websites w where w.tenant_id=%I.tenant_id and w.workspace_id=%I.workspace_id and w.id=%I.site_id and app.website_can(w.tenant_id,w.workspace_id,w.id,w.store_id,%L)))',tab||'_insert',tab,tab,tab,tab,case when tab='content_references' then 'EDIT' else 'PUBLISH' end);
  if tab='website_publish_jobs' then
   execute format('create policy %I on app.%I for update to ts_runtime using(exists(select 1 from app.websites w where w.id=%I.site_id and app.website_can(w.tenant_id,w.workspace_id,w.id,w.store_id,%L))) with check(exists(select 1 from app.websites w where w.id=%I.site_id and app.website_can(w.tenant_id,w.workspace_id,w.id,w.store_id,%L)))',tab||'_update',tab,tab,'PUBLISH',tab,'PUBLISH');
  end if;
  execute format('grant select,insert,update on app.%I to ts_runtime',tab);
 end loop;
 for tab in select unnest(array['content_assets','content_revisions','assets','approvals']) loop
  execute format('drop policy %I on app.%I',tab||'_read',tab);
  execute format('drop policy %I on app.%I',tab||'_insert',tab);
  execute format('drop policy %I on app.%I',tab||'_update',tab);
  execute format('create policy %I on app.%I for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and ((site_id is null and (current_setting(''ts.role'',true)<>''customer'' %s)) or exists(select 1 from app.websites w where w.id=%I.site_id)))',tab||'_read',tab,case when tab='assets' then 'or owner_id=current_setting(''ts.user'',true)' else '' end,tab);
  predicate:=format('app.scope_ok(tenant_id,workspace_id) and ((site_id is null and (current_setting(''ts.role'',true)<>''customer'' %s)) or exists(select 1 from app.websites w where w.id=%I.site_id and app.website_can(w.tenant_id,w.workspace_id,w.id,w.store_id,''EDIT'')))',case when tab='assets' then 'or owner_id=current_setting(''ts.user'',true)' else '' end,tab);
  execute format('create policy %I on app.%I for insert to ts_runtime with check(%s)',tab||'_insert',tab,predicate);
  execute format('create policy %I on app.%I for update to ts_runtime using(%s) with check(%s)',tab||'_update',tab,predicate,predicate);
 end loop;
end $$;
create policy collection_products_staff on app.collection_products for all to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true) in ('owner','catalog_manager')) with check(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true) in ('owner','catalog_manager'));
create policy collection_products_editor_read on app.collection_products for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true)<>'customer');
grant select,insert,update on app.collection_products to ts_runtime;

-- Read protection includes active eligibility; customers cannot grant membership.
drop policy stores_read on app.stores;
create policy stores_read on app.stores for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)<>'customer' or data->>'visibility'='PUBLIC' or exists(select 1 from app.store_memberships m where m.tenant_id=stores.tenant_id and m.workspace_id=stores.workspace_id and m.store_id=stores.id and m.owner_id=current_setting('ts.user',true) and m.status='ACTIVE' and m.data->>'eligible'='true')));
drop policy store_memberships_insert on app.store_memberships;
drop policy store_memberships_update on app.store_memberships;
create policy store_memberships_insert on app.store_memberships for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true)<>'customer');
create policy store_memberships_update on app.store_memberships for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true)<>'customer') with check(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true)<>'customer');

-- A dedicated published-only reader: no seeded customer identity, draft grants,
-- auth/vault access, supplier offers, audience records or write permissions.
do $$ begin create role ts_website_reader nologin nosuperuser nobypassrls; exception when duplicate_object then null; end $$;
do $$ begin execute format('grant ts_website_reader to %I',current_user); if exists(select 1 from pg_roles where rolname='ts_app_server') then grant ts_website_reader to ts_app_server; end if; end $$;
grant usage on schema app,public to ts_website_reader;
create function app.web_scope(t uuid,w uuid) returns boolean language sql stable security invoker set search_path=pg_catalog as $$ select t::text=current_setting('ts.web_tenant',true) and w::text=current_setting('ts.web_workspace',true) $$;
create function app.web_member(t uuid,w uuid,st uuid) returns boolean language sql stable security invoker set search_path=pg_catalog,app,public as $$
 select app.web_scope(t,w) and current_setting('ts.web_user',true)<>'' and exists(
  select 1 from app.store_memberships m join public.memberships u on u.user_id=m.owner_id and u.tenant_id=m.tenant_id and u.workspace_id=m.workspace_id
  where m.tenant_id=t and m.workspace_id=w and m.store_id=st and m.owner_id=current_setting('ts.web_user',true) and m.status='ACTIVE' and m.data->>'eligible'='true')
$$;
revoke all on function app.web_scope(uuid,uuid),app.web_member(uuid,uuid,uuid),app.website_asset_bytes_immutable() from public;
grant execute on function app.web_scope(uuid,uuid),app.web_member(uuid,uuid,uuid) to ts_website_reader;
grant select(user_id,tenant_id,workspace_id) on public.memberships to ts_website_reader;
alter table public.memberships enable row level security;
create policy website_reader_identity on public.memberships for select to ts_website_reader using(app.web_scope(tenant_id,workspace_id) and user_id=current_setting('ts.web_user',true));
grant select on app.websites,app.website_releases,app.content_revisions,app.content_references,app.stores,app.store_memberships,app.store_products,app.products,app.variants,app.collections,app.collection_products to ts_website_reader;
grant select(id,tenant_id,workspace_id,title,status,data,site_id,original_asset_id,web_bytes) on app.assets to ts_website_reader;
create policy website_reader_member on app.store_memberships for select to ts_website_reader using(app.web_scope(tenant_id,workspace_id) and owner_id=current_setting('ts.web_user',true) and status='ACTIVE');
create policy website_reader_store on app.stores for select to ts_website_reader using(app.web_scope(tenant_id,workspace_id) and status='ACTIVE' and (data->>'visibility'='PUBLIC' or app.web_member(tenant_id,workspace_id,id)));
create policy website_reader_assignment on app.store_products for select to ts_website_reader using(app.web_scope(tenant_id,workspace_id) and status='ACTIVE' and exists(select 1 from app.stores s where s.id=store_products.store_id));
create policy website_reader_site on app.websites for select to ts_website_reader using(app.web_scope(tenant_id,workspace_id) and status='ACTIVE' and (store_id is null or exists(select 1 from app.stores s where s.id=websites.store_id)));
create policy website_reader_release on app.website_releases for select to ts_website_reader using(app.web_scope(tenant_id,workspace_id) and exists(select 1 from app.websites w where w.id=website_releases.site_id and w.active_release_id=website_releases.id));
create policy website_reader_revision on app.content_revisions for select to ts_website_reader using(app.web_scope(tenant_id,workspace_id) and site_id is not null and exists(select 1 from app.websites w join app.website_releases r on r.id=w.active_release_id where w.id=content_revisions.site_id and r.data->'revisionIds' ? content_revisions.id::text));
create policy website_reader_reference on app.content_references for select to ts_website_reader using(app.web_scope(tenant_id,workspace_id) and (exists(select 1 from app.content_revisions r where r.id=content_references.source_revision_id) or exists(select 1 from app.website_releases r where r.id=content_references.release_id)));
create policy website_reader_asset on app.assets for select to ts_website_reader using(app.web_scope(tenant_id,workspace_id) and site_id is not null and data->>'kind'='WEBSITE_DERIVATIVE' and status='APPROVED' and data->>'rightsConfirmed'='true' and (data->>'rightsExpiresAt' is null or (data->>'rightsExpiresAt')::timestamptz>now()) and exists(select 1 from app.content_references r where r.asset_id=assets.id));
create policy website_reader_product on app.products for select to ts_website_reader using(app.web_scope(tenant_id,workspace_id) and status='PUBLISHED');
create policy website_reader_variant on app.variants for select to ts_website_reader using(app.web_scope(tenant_id,workspace_id) and status<>'ARCHIVED' and exists(select 1 from app.products p where p.id=variants.product_id));
create policy website_reader_collection on app.collections for select to ts_website_reader using(app.web_scope(tenant_id,workspace_id) and status='PUBLISHED' and (store_id is null or exists(select 1 from app.stores s where s.id=collections.store_id)));
create policy website_reader_collection_product on app.collection_products for select to ts_website_reader using(app.web_scope(tenant_id,workspace_id) and status='ACTIVE' and exists(select 1 from app.collections c where c.id=collection_products.collection_id) and exists(select 1 from app.products p where p.id=collection_products.product_id));

-- No new Data API exposure, including on installations with broad defaults.
do $$ declare r text;tab text; begin
 for r in select rolname from pg_roles where rolname in ('anon','authenticated') loop
  for tab in select unnest(array['websites','website_releases','website_publish_jobs','content_references','collection_products']) loop
   execute format('revoke all on app.%I from %I',tab,r);
  end loop;
 end loop;
end $$;
