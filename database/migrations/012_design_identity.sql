-- New versions bind actual identity. Historical versions are retained without guessing/backfill.
alter table app.design_versions add column product_id uuid, add column variant_id uuid,
 add foreign key(tenant_id,workspace_id,product_id) references app.products(tenant_id,workspace_id,id),
 add foreign key(tenant_id,workspace_id,product_id,variant_id) references app.variants(tenant_id,workspace_id,product_id,id),
 add check(variant_id is null or product_id is not null);
create index design_versions_identity on app.design_versions(tenant_id,workspace_id,product_id,variant_id);
create index proofs_exact_version on app.proofs(tenant_id,workspace_id,project_id,version_id,status);
create function app.protect_design_project_identity() returns trigger language plpgsql set search_path=pg_catalog,app as $$
begin
 if (old.product_id,old.variant_id,old.data->>'productId',old.data->>'variantId')
 is distinct from (new.product_id,new.variant_id,new.data->>'productId',new.data->>'variantId')
 then raise exception 'DESIGN_PROJECT_IDENTITY_IMMUTABLE'; end if;
 return new;
end $$;
revoke all on function app.protect_design_project_identity() from public;
create trigger design_project_identity before update on app.design_projects for each row execute function app.protect_design_project_identity();
