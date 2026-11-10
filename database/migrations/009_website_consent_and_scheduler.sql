-- The reader sees only a revocable permission assertion, never its private
-- evidence note/original. The public HTTP image route still requires a raster
-- WEBSITE_DERIVATIVE and cannot serve consent records.
create policy website_reader_consent_status on app.assets for select to ts_website_reader using(
 app.web_scope(tenant_id,workspace_id) and site_id is not null and data->>'kind'='WEBSITE_CONSENT'
 and status='VERIFIED' and exists(select 1 from app.content_references r where r.asset_id=assets.id and r.data->>'purpose'='CONSENT')
);
create unique index website_collection_slug on app.collections(tenant_id,workspace_id,coalesce(store_id,'00000000-0000-0000-0000-000000000000'::uuid),(data->>'slug')) where status='PUBLISHED' and data->>'slug' is not null;
alter table app.websites add column scheduler_heartbeat_at timestamptz;
