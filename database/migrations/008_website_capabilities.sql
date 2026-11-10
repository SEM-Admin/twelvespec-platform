-- Capabilities are actual, owner-approved grants. Requested legacy grants do
-- not become active, and a runtime editor cannot self-grant publication.
drop policy resource_grants_read on app.resource_grants;
drop policy resource_grants_insert on app.resource_grants;
drop policy resource_grants_update on app.resource_grants;
create policy resource_grants_read on app.resource_grants for select to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true)='owner' or data->>'userId'=current_setting('ts.user',true)));
create policy resource_grants_insert on app.resource_grants for insert to ts_runtime with check(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true)='owner');
create policy resource_grants_update on app.resource_grants for update to ts_runtime using(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true)='owner') with check(app.scope_ok(tenant_id,workspace_id) and current_setting('ts.role',true)='owner');
create unique index website_active_capability on app.resource_grants(tenant_id,workspace_id,(data->>'resourceId'),(data->>'userId'),(data->>'permission')) where status='ACTIVE' and data->>'kind'='WEBSITE_CAPABILITY';

create or replace function app.website_can(t uuid,w uuid,s uuid,st uuid,cap text) returns boolean language sql stable security invoker set search_path=pg_catalog,app,public as $$
 select app.scope_ok(t,w) and (
  current_setting('ts.role',true)='owner'
  or (cap in ('EDIT','MEDIA') and current_setting('ts.role',true)='marketing')
  or (cap='MERCHANDISE' and current_setting('ts.role',true)='catalog_manager')
  or (current_setting('ts.role',true) not in ('customer','staff') and exists(
   select 1 from app.resource_grants g where g.tenant_id=t and g.workspace_id=w and g.status='ACTIVE'
    and g.data->>'kind'='WEBSITE_CAPABILITY' and g.data->>'userId'=current_setting('ts.user',true)
    and g.data->>'resourceId'=s::text and (g.data->>'permission'=cap or cap in ('EDIT','MEDIA') and g.data->>'permission'='PUBLISH')
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

drop policy collection_products_staff on app.collection_products;
create policy collection_products_staff on app.collection_products for all to ts_runtime
 using(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true) in ('owner','catalog_manager') or exists(
  select 1 from app.collections c join app.websites w on w.tenant_id=c.tenant_id and w.workspace_id=c.workspace_id and w.store_id is not distinct from c.store_id
  where c.id=collection_products.collection_id and app.website_can(w.tenant_id,w.workspace_id,w.id,w.store_id,'MERCHANDISE'))))
 with check(app.scope_ok(tenant_id,workspace_id) and (current_setting('ts.role',true) in ('owner','catalog_manager') or exists(
  select 1 from app.collections c join app.websites w on w.tenant_id=c.tenant_id and w.workspace_id=c.workspace_id and w.store_id is not distinct from c.store_id
  where c.id=collection_products.collection_id and app.website_can(w.tenant_id,w.workspace_id,w.id,w.store_id,'MERCHANDISE'))));
alter table app.approvals add foreign key(tenant_id,workspace_id,site_id,content_revision_id) references app.content_revisions(tenant_id,workspace_id,site_id,id);
create trigger website_approval_immutable before update or delete on app.approvals for each row when(old.site_id is not null and old.status='APPROVED') execute function app.reject_mutation();
create function app.website_document_identity_immutable() returns trigger language plpgsql set search_path=pg_catalog,app as $$
begin
 if old.site_id is not null and (new.site_id is distinct from old.site_id or new.document_type is distinct from old.document_type) then raise exception 'IMMUTABLE_WEBSITE_DOCUMENT_IDENTITY'; end if;
 return new;
end $$;
revoke all on function app.website_document_identity_immutable() from public;
create trigger website_document_identity_immutable before update on app.content_assets for each row execute function app.website_document_identity_immutable();
