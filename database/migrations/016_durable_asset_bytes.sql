-- Reuse the canonical private byte column; no new storage identity or public bucket.
-- The original website-only bound was added without an explicit constraint name.
do $$ declare constraint_name text; begin
 select conname into strict constraint_name from pg_constraint
 where conrelid='app.assets'::regclass and contype='c'
 and pg_get_constraintdef(oid) like '%octet_length(web_bytes)%';
 execute format('alter table app.assets drop constraint %I',constraint_name);
end $$;
alter table app.assets add constraint assets_bounded_bytes check(
 web_bytes is null or (
  octet_length(web_bytes) between 1 and 16777216 and coalesce((
   (site_id is not null and octet_length(web_bytes)<=8388608) or
   (site_id is null and data->>'storage'='POSTGRES_BYTEA_V1'
    and data->>'kind' in ('CREATIVE_ORIGINAL','CREATIVE_PREVIEW','MOCKUP','CATALOG_ORIGINAL','CATALOG_DERIVATIVE')
    and data->'bytes'=to_jsonb(octet_length(web_bytes))
    and data->>'contentHash' ~ '^[a-f0-9]{64}$')
  ),false)
 )
);

-- Existing website behavior is preserved and extended to all stored files.
-- Rights/status may change, but file identity and bytes require a new asset.
create or replace function app.website_asset_bytes_immutable() returns trigger language plpgsql set search_path=pg_catalog,app as $$
begin
 if old.site_id is not null or old.web_bytes is not null then
  if new.web_bytes is distinct from old.web_bytes
   or new.tenant_id is distinct from old.tenant_id or new.workspace_id is distinct from old.workspace_id
   or new.owner_id is distinct from old.owner_id or new.site_id is distinct from old.site_id
   or new.original_asset_id is distinct from old.original_asset_id
   or new.project_id is distinct from old.project_id or new.version_id is distinct from old.version_id
   or new.product_id is distinct from old.product_id or new.variant_id is distinct from old.variant_id
   or new.data->>'kind' is distinct from old.data->>'kind'
   or new.data->>'storage' is distinct from old.data->>'storage'
   or new.data->>'mimeType' is distinct from old.data->>'mimeType'
   or new.data->>'bytes' is distinct from old.data->>'bytes'
   or new.data->>'contentHash' is distinct from old.data->>'contentHash'
   or (old.data->>'previewAssetId' is not null and new.data->>'previewAssetId' is distinct from old.data->>'previewAssetId') then
    raise exception 'IMMUTABLE_ASSET_BYTES';
  end if;
 end if;
 return new;
end $$;
