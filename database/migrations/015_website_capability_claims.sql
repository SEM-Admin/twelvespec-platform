-- Additive service claims. Existing source permissions and published releases
-- are not upgraded, reclassified or backfilled.
alter table app.intelligence_sources drop constraint intelligence_sources_allowed_uses_check;
alter table app.intelligence_sources add constraint intelligence_sources_allowed_uses_check
 check(cardinality(allowed_uses)>0 and allowed_uses <@ array['INTERNAL_RESEARCH','QUOTE_COST','PUBLIC_CLAIM']::text[]);

alter table app.content_references add column evidence_source_id uuid,
 add foreign key(tenant_id,workspace_id,evidence_source_id) references app.intelligence_sources(tenant_id,workspace_id,id);
-- Replace only the target cardinality check; retain source revision/release,
-- scope, identity, immutable-history and site foreign-key constraints.
do $$ declare c record; begin
 for c in select conname from pg_constraint
  where conrelid='app.content_references'::regclass and contype='c'
   and pg_get_constraintdef(oid) like '%num_nonnulls(content_revision_id%'
 loop execute format('alter table app.content_references drop constraint %I',c.conname); end loop;
end $$;
alter table app.content_references add constraint content_references_target_check check(
 (variant_id is null and num_nonnulls(content_revision_id,content_id,product_id,collection_id,asset_id,store_id,brand_kit_id,evidence_source_id)=1)
 or (variant_id is not null and product_id is not null and num_nonnulls(content_revision_id,content_id,collection_id,asset_id,store_id,brand_kit_id,evidence_source_id)=0));
create index content_reference_claim_source on app.content_references(tenant_id,workspace_id,evidence_source_id) where evidence_source_id is not null;

-- Company-store editing does not grant internal evidence access. This applies
-- to generic/older runtime readers too, including hidden sections and history.
create policy website_claims_internal_editor on app.content_revisions as restrictive for select to ts_runtime using(
 current_setting('ts.role',true)<>'store_admin' or not exists(
  select 1 from jsonb_array_elements(case when data->'document'->>'documentType'='WEBSITE_PAGE' then data->'document'->'sections' else '[]'::jsonb end) section where section->>'type'='capability_claims'));
create policy website_claim_citations_internal on app.content_references as restrictive for select to ts_runtime
 using(evidence_source_id is null or current_setting('ts.role',true)<>'store_admin');

-- Older application readers do not know to strip new private claim metadata.
-- Require the updated reader protocol for these revisions, failing closed on
-- an application rollback. Existing releases without claims remain readable.
drop policy website_reader_revision on app.content_revisions;
create policy website_reader_revision on app.content_revisions for select to ts_website_reader using(
 app.web_scope(tenant_id,workspace_id) and site_id is not null
 and (current_setting('ts.website_claim_reader',true)='1' or not exists(
  select 1 from jsonb_array_elements(case when data->'document'->>'documentType'='WEBSITE_PAGE' then data->'document'->'sections' else '[]'::jsonb end) section where section->>'type'='capability_claims'))
 and exists(select 1 from app.websites w join app.website_releases r on r.id=w.active_release_id where w.id=content_revisions.site_id and r.data->'revisionIds' ? content_revisions.id::text));
drop policy website_reader_reference on app.content_references;
create policy website_reader_reference on app.content_references for select to ts_website_reader using(
 app.web_scope(tenant_id,workspace_id) and evidence_source_id is null
 and (exists(select 1 from app.content_revisions r where r.id=content_references.source_revision_id)
  or exists(select 1 from app.website_releases r where r.id=content_references.release_id)));

-- Private implementation helper: no runtime, website-reader or Data API grant.
-- The migration owner has the same trusted ownership as app.scope_ok. Fixed
-- search paths and explicit scope checks are mandatory at every exposed entry.
create function app.claim_source_current(t uuid,w uuid,s uuid) returns boolean
 language sql stable security invoker set search_path=pg_catalog,app,public as $$
 select exists(select 1 from app.intelligence_sources e
  where e.tenant_id=t and e.workspace_id=w and e.id=s
   and e.origin='OPERATOR_DOCUMENT' and 'PUBLIC_CLAIM'=any(e.allowed_uses)
   and e.rights_valid_from<=statement_timestamp() and e.rights_valid_until>statement_timestamp()
   and e.retention_until>statement_timestamp()
   and not exists(select 1 from app.intelligence_restrictions r where r.tenant_id=t and r.workspace_id=w and r.source_id=e.id))
$$;
revoke all on function app.claim_source_current(uuid,uuid,uuid) from public,ts_runtime,ts_website_reader;

-- Editor selection is site-authorized and paged. It deliberately excludes
-- publisher/supplier identities, URIs, contracts, source bytes and economics.
create function app.website_claim_source_choices(t uuid,w uuid,site uuid,query text,requested_page integer,specific_id uuid default null) returns jsonb
 language plpgsql stable security definer set search_path=pg_catalog,app,public as $$
declare n integer; p integer:=greatest(1,least(coalesce(requested_page,1),1000000)); rows jsonb;
begin
 if current_setting('ts.role',true)='store_admin' then
  raise exception 'WEBSITE_CLAIM_INTERNAL_REVIEW_REQUIRED' using errcode='42501';
 end if;
 if not exists(select 1 from app.websites s where s.tenant_id=t and s.workspace_id=w and s.id=site
  and app.website_can(t,w,s.id,s.store_id,'EDIT')) then
  raise exception 'WEBSITE_PERMISSION_REQUIRED' using errcode='42501';
 end if;
 select count(*)::integer into n from app.intelligence_sources e
  where e.tenant_id=t and e.workspace_id=w and 'PUBLIC_CLAIM'=any(e.allowed_uses)
   and (specific_id is null or e.id=specific_id)
   and strpos(lower(e.title||' '||e.edition),lower(left(coalesce(query,''),200)))>0;
 select coalesce(jsonb_agg(row_to_json(x)),'[]'::jsonb) into rows from (
  select e.id,e.title,e.edition,e.origin,e.rights_valid_from,e.rights_valid_until,e.retention_until,
   app.claim_source_current(t,w,e.id) as eligible
  from app.intelligence_sources e where e.tenant_id=t and e.workspace_id=w and 'PUBLIC_CLAIM'=any(e.allowed_uses)
   and (specific_id is null or e.id=specific_id)
   and strpos(lower(e.title||' '||e.edition),lower(left(coalesce(query,''),200)))>0
  order by e.title,e.id limit 25 offset (p-1)*25
 ) x;
 return jsonb_build_object('rows',rows,'total',n,'page',p,'totalPages',greatest(1,ceil(n/25.0)::integer));
end $$;
revoke all on function app.website_claim_source_choices(uuid,uuid,uuid,text,integer,uuid) from public,ts_runtime,ts_website_reader;
grant execute on function app.website_claim_source_choices(uuid,uuid,uuid,text,integer,uuid) to ts_runtime;

-- Status-only public entry: the caller supplies a published revision/claim, not
-- a source ID. A positive result requires active-release and private-store
-- eligibility as well as valid sources; drafts/unreferenced IDs return false.
create function app.website_claim_evidence_current(t uuid,w uuid,rev uuid,claim uuid) returns boolean
 language sql stable security definer set search_path=pg_catalog,app,public as $$
 select app.web_scope(t,w) and exists(
  select 1 from app.content_revisions r join app.websites s on s.tenant_id=r.tenant_id and s.workspace_id=r.workspace_id and s.id=r.site_id
   join app.website_releases l on l.tenant_id=s.tenant_id and l.workspace_id=s.workspace_id and l.site_id=s.id and l.id=s.active_release_id
   cross join lateral jsonb_array_elements(r.data->'document'->'sections') section
   cross join lateral jsonb_array_elements(case when section->>'type'='capability_claims' then section->'content'->'entries' else '[]'::jsonb end) assertion
  where r.tenant_id=t and r.workspace_id=w and r.id=rev and s.status='ACTIVE'
   and l.data->'revisionIds' ? r.id::text and r.data->'document'->>'documentType'='WEBSITE_PAGE'
   and section->>'visible'='true' and assertion->>'id'=claim::text
   and (s.store_id is null or exists(select 1 from app.stores st where st.tenant_id=t and st.workspace_id=w and st.id=s.store_id
    and st.status='ACTIVE' and (st.data->>'visibility'='PUBLIC' or app.web_member(t,w,st.id))))
   and jsonb_array_length(assertion->'sourceIds') between 1 and 5
   and not exists(
    select 1 from jsonb_array_elements_text(assertion->'sourceIds') source_id
    where not exists(select 1 from app.content_references citation
     where citation.tenant_id=t and citation.workspace_id=w and citation.site_id=s.id and citation.source_revision_id=r.id
      and citation.evidence_source_id::text=source_id and citation.data->>'purpose'='CLAIM_SUPPORT' and citation.data->>'claimId'=claim::text
      and app.claim_source_current(t,w,citation.evidence_source_id)))
 )
$$;
revoke all on function app.website_claim_evidence_current(uuid,uuid,uuid,uuid) from public,ts_runtime,ts_website_reader;
grant execute on function app.website_claim_evidence_current(uuid,uuid,uuid,uuid) to ts_website_reader;

-- No direct evidence access for the published reader. Cover installations with
-- broad default function privileges as well as plain local PostgreSQL.
do $$ declare r text; begin
 for r in select rolname from pg_roles where rolname in ('anon','authenticated') loop
  execute format('revoke all on function app.claim_source_current(uuid,uuid,uuid),app.website_claim_source_choices(uuid,uuid,uuid,text,integer,uuid),app.website_claim_evidence_current(uuid,uuid,uuid,uuid) from %I',r);
 end loop;
end $$;
