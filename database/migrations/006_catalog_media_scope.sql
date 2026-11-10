-- Exact request parent/variant integrity and publication-bound catalog derivatives.
create unique index requests_scoped_owner on app.requests(tenant_id,workspace_id,id,owner_id);
create unique index variants_scoped_product on app.variants(tenant_id,workspace_id,product_id,id);
alter table app.request_lines add foreign key(tenant_id,workspace_id,request_id,owner_id)
 references app.requests(tenant_id,workspace_id,id,owner_id);
alter table app.request_lines add foreign key(tenant_id,workspace_id,product_id,variant_id)
 references app.variants(tenant_id,workspace_id,product_id,id);

-- Customers may read a catalog derivative only while its exact path is in the
-- published product snapshot. Staff draft uploads remain private.
create policy published_catalog_image_read on app.assets for select to ts_runtime using(
 app.scope_ok(tenant_id,workspace_id) and data->>'kind'='CATALOG_DERIVATIVE' and exists(
  select 1 from app.products p where p.tenant_id=assets.tenant_id and p.workspace_id=assets.workspace_id
  and p.id=assets.product_id and p.status='PUBLISHED' and (
   p.data->'publicSnapshot'->'product'->>'image'='/api/catalog/images/'||assets.id::text or
   p.data->'publicSnapshot'->>'image'='/api/catalog/images/'||assets.id::text or
   exists(select 1 from jsonb_array_elements(coalesce(p.data->'publicSnapshot'->'variants','[]'::jsonb)) v
    where v->'data'->>'image'='/api/catalog/images/'||assets.id::text or v->>'image'='/api/catalog/images/'||assets.id::text)
  )
 )
);
