import {z} from 'zod';
import {create,event,fail,get,idempotent,text,type Actor,type Input,type Tx} from '../../../kernel/src';
import {safeWebsiteHref,type WebsiteDocument} from '../../../contracts/src/website';
import {websiteTimeChoices} from '../../../contracts/src/website-time';
import {approveWebsiteRevision} from './documents';
import {emptyManifest,revisionRecord,websiteHash,websiteRecord,websiteSchedulerActive,websiteSite,type ReleaseManifest,type WebsiteRelease,type WebsiteRevision,type WebsiteSite} from './model';
import {referencedPageIds,validateDocumentReferences} from './references';

const changesSchema=z.array(z.object({documentId:z.uuid(),revisionId:z.uuid(),expectedRevision:z.number().int().positive()}).strict()).min(1).max(100);
export async function validateWebsiteManifest(tx:Tx,a:Actor,site:WebsiteSite,manifest:ReleaseManifest){
 const revisions:WebsiteRevision[]=[];const paths:Record<string,string>={};const globals={navigation:'',footer:'',theme:''};
 for(const [documentId,revisionId]of Object.entries(manifest.documents)){
  const revision=await revisionRecord(tx,a,revisionId,site.id);if(revision.content_id!==documentId||revision.data.archived)fail('WEBSITE_RELEASE_REFERENCE_INVALID');
  await validateDocumentReferences(tx,a,site,revision.data.document,true);revisions.push(revision);
  const doc=revision.data.document;
  if(doc.documentType==='WEBSITE_PAGE'){if(paths[doc.path])fail('WEBSITE_RELEASE_PATH_CONFLICT');paths[doc.path]=documentId;}
  else{const key=doc.documentType==='WEBSITE_NAVIGATION'?'navigation':doc.documentType==='WEBSITE_FOOTER'?'footer':'theme';if(globals[key])fail('WEBSITE_GLOBAL_DOCUMENT_CONFLICT');globals[key]=documentId;}
 }
 if(!paths['/']||!globals.navigation||!globals.footer||!globals.theme)fail('WEBSITE_RELEASE_REQUIRED_DOCUMENTS_MISSING');
 for(const revision of revisions)for(const targetId of referencedPageIds(revision.data.document))if(!manifest.documents[targetId])fail('WEBSITE_LINK_TARGET_NOT_PUBLISHED');
 for(const [from,to]of Object.entries(manifest.redirects)){
  if(paths[from]||!safeWebsiteHref(to)||!to.startsWith('/')||to===from)fail('WEBSITE_REDIRECT_INVALID',400);
  const visited=new Set([from]);let cursor=to;
  while(manifest.redirects[cursor]){if(visited.has(cursor))fail('WEBSITE_REDIRECT_CYCLE',400);visited.add(cursor);cursor=manifest.redirects[cursor];}
 }
 return {revisions,manifest:{...manifest,paths,globals}};
}
async function releaseRecord(tx:Tx,a:Actor,site:WebsiteSite,manifest:ReleaseManifest,changedDocumentIds:string[],reason:string){
 const validated=await validateWebsiteManifest(tx,a,site,manifest);const revisionIds=validated.revisions.map(r=>r.id).sort();
 const data={manifest:validated.manifest,revisionIds,changedDocumentIds,reason,approvedBy:a.userId,schemaVersion:1,hash:websiteHash({manifest:validated.manifest,revisionIds})};
 const release=await create(tx,a,'website_releases',{title:`${site.title} · release ${site.generation+1}`,site_id:site.id,...(site.active_release_id?{previous_release_id:site.active_release_id}:{}),status:'APPROVED',data}) as WebsiteRelease;
 for(const revisionId of revisionIds)await create(tx,a,'content_references',{site_id:site.id,release_id:release.id,content_revision_id:revisionId,title:'Pinned website revision',status:'ACTIVE',data:{kind:'RELEASE_REVISION'}});
 await event(tx,a,'website.release_approved',release.id,{siteId:site.id,hash:data.hash,changedDocumentIds});return release;
}
export async function activateWebsiteRelease(tx:Tx,a:Actor,site:WebsiteSite,release:WebsiteRelease,expectedGeneration:number){
 if(site.generation!==expectedGeneration)fail('WEBSITE_GENERATION_CONFLICT');
 if(release.site_id!==site.id||websiteHash({manifest:release.data.manifest,revisionIds:release.data.revisionIds})!==release.data.hash)fail('WEBSITE_RELEASE_INVALID');
 await validateWebsiteManifest(tx,a,site,release.data.manifest);
 const activated=(await tx.query('update app.websites set active_release_id=$4,generation=generation+1,revision=revision+1,updated_at=now() where tenant_id=$1 and workspace_id=$2 and id=$3 and generation=$5 returning *',[a.tenantId,a.workspaceId,site.id,release.id,expectedGeneration])).rows[0];
 if(!activated)fail('WEBSITE_GENERATION_CONFLICT');
 await event(tx,a,'website.release_activated',release.id,{siteId:site.id,generation:activated.generation,previousReleaseId:site.active_release_id,hash:release.data.hash});return {release,site:activated};
}
export async function publishWebsiteChanges(tx:Tx,a:Actor,i:Input){
 const site=await websiteSite(tx,a,i.siteId,'PUBLISH',true);const parsed=changesSchema.safeParse(i.changes);if(!parsed.success)fail('WEBSITE_CHANGE_SELECTION_INVALID',400);const changes=parsed.data;
 if(!Number.isInteger(i.expectedGeneration)||site.generation!==i.expectedGeneration)fail('WEBSITE_GENERATION_CONFLICT');
 if(new Set(changes.map(c=>c.documentId)).size!==changes.length)fail('WEBSITE_CHANGE_SELECTION_INVALID',400);
 const reason=text(i.reason,2000);
 let manifest=emptyManifest();
 if(site.active_release_id){const active=await get(tx,a,'website_releases',site.active_release_id) as WebsiteRelease;manifest=structuredClone(active.data.manifest);}
 for(const change of changes){
  const {row}=await websiteRecord(tx,a,change.documentId,'EDIT',true);if(row.site_id!==site.id||row.revision!==change.expectedRevision||row.head_revision_id!==change.revisionId)fail('WEBSITE_REVISION_STALE');
  const revision=await revisionRecord(tx,a,change.revisionId,site.id);
  if(i.approveSelected===true)await approveWebsiteRevision(tx,a,revision.id,site.id,reason);
  const approval=await tx.query("select 1 from app.approvals where tenant_id=$1 and workspace_id=$2 and site_id=$3 and content_revision_id=$4 and status='APPROVED' and data->>'hash'=$5 limit 1",[a.tenantId,a.workspaceId,site.id,revision.id,revision.data.hash]);if(!approval.rowCount)fail('WEBSITE_APPROVAL_REQUIRED');
  if(revision.data.archived)delete manifest.documents[row.id];else manifest.documents[row.id]=revision.id;
  const oldPaths=Object.entries(manifest.paths).filter(([,id])=>id===row.id).map(([path])=>path);
  if(revision.data.document.documentType==='WEBSITE_PAGE'&&!revision.data.archived)for(const old of oldPaths)if(old!==revision.data.document.path)manifest.redirects[old]=revision.data.document.path;
 }
 const release=await releaseRecord(tx,a,site,manifest,changes.map(c=>c.documentId),reason);
 if(i.schedule){
  if(!websiteSchedulerActive())fail('WEBSITE_SCHEDULER_NOT_ACTIVE',409);
  const schedule=i.schedule as Input,local=text(schedule.localDateTime,16),zone=text(schedule.timezone,100);let choices;
  try{choices=websiteTimeChoices(local,zone);}catch{return fail('WEBSITE_SCHEDULE_TIME_INVALID',400);}
  if(!choices.length)fail('WEBSITE_SCHEDULE_TIME_NONEXISTENT',400);
  const choice=choices.length===1?choices[0]:choices.find(c=>c.offsetMinutes===schedule.offsetMinutes);
  if(!choice)fail('WEBSITE_SCHEDULE_OFFSET_REQUIRED',400);
  if(Date.parse(choice.iso)<=Date.now())fail('WEBSITE_SCHEDULE_FUTURE_REQUIRED',400);
  let expiresAt:string|null=null;
  if(schedule.expiresAt){const d=new Date(String(schedule.expiresAt));if(!Number.isFinite(d.getTime())||d.getTime()<=Date.parse(choice.iso))fail('WEBSITE_SCHEDULE_EXPIRY_INVALID',400);expiresAt=d.toISOString();}
  const job=await create(tx,a,'website_publish_jobs',{site_id:site.id,release_id:release.id,run_at:choice.iso,expires_at:expiresAt,expected_generation:site.generation,title:`Publish ${site.title}`,status:'SCHEDULED',data:{timezone:zone,localDateTime:local,offsetMinutes:choice.offsetMinutes,approvedBy:a.userId,approvedRole:a.role,changedRevisionIds:changes.map(c=>c.revisionId),changedDocumentIds:changes.map(c=>c.documentId),reason,attempts:0}});
  await event(tx,a,'website.release_scheduled',job.id,{siteId:site.id,releaseId:release.id,runAt:choice.iso,timezone:zone});return {job,release,site};
 }
 return activateWebsiteRelease(tx,a,site,release,Number(i.expectedGeneration));
}
export async function handleWebsiteReleases(tx:Tx,a:Actor,action:string,i:Input):Promise<unknown>{
 if(action==='publish')return idempotent(tx,a,'website.publish',i.idempotencyKey,i,()=>publishWebsiteChanges(tx,a,i));
 if(action==='rollback_site'){
  return idempotent(tx,a,'website.rollback',i.idempotencyKey,i,async()=>{
   const site=await websiteSite(tx,a,i.siteId,'PUBLISH',true);if(site.generation!==i.expectedGeneration)fail('WEBSITE_GENERATION_CONFLICT');
   const old=await get(tx,a,'website_releases',i.releaseId) as WebsiteRelease;if(old.site_id!==site.id)fail('WEBSITE_RELEASE_INVALID');
   const reason=text(i.reason,2000),release=await releaseRecord(tx,a,site,structuredClone(old.data.manifest),Object.keys(old.data.manifest.documents),reason);
   await event(tx,a,'website.rollback_reviewed',release.id,{siteId:site.id,restoredReleaseId:old.id,transactionsUnchanged:true});return activateWebsiteRelease(tx,a,site,release,Number(i.expectedGeneration));
  });
 }
 if(action==='cancel_schedule'){
  const job=await get(tx,a,'website_publish_jobs',i.id,true);await websiteSite(tx,a,job.site_id,'PUBLISH');if(!['SCHEDULED','RETRY'].includes(job.status))fail('WEBSITE_SCHEDULE_NOT_PENDING');
  const result=(await tx.query("update app.website_publish_jobs set status='CANCELLED',revision=revision+1,updated_at=now(),data=data||$4::jsonb where tenant_id=$1 and workspace_id=$2 and id=$3 returning *",[a.tenantId,a.workspaceId,job.id,JSON.stringify({cancelledBy:a.userId,cancellationReason:text(i.reason??'Cancelled scheduled release',1000)})])).rows[0];await event(tx,a,'website.schedule_cancelled',job.id,{siteId:job.site_id});return result;
 }
 return fail('WEBSITE_RELEASE_COMMAND_INVALID',400);
}

/** Called inside the existing scoped worker transaction; delivery may repeat. */
export async function processWebsitePublishJob(tx:Tx,a:Actor,id:string,now=new Date()){
 const job=(await tx.query("select * from app.website_publish_jobs where tenant_id=$1 and workspace_id=$2 and id=$3 and status in ('SCHEDULED','RETRY') for update skip locked",[a.tenantId,a.workspaceId,id])).rows[0];
 if(!job||new Date(job.run_at).getTime()>now.getTime())return {skipped:true};
 const site=await websiteSite(tx,a,job.site_id,'PUBLISH',true);
 const blocked=async(status:string,reason:string)=>{await tx.query('update app.website_publish_jobs set status=$4,revision=revision+1,updated_at=now(),data=data||$5::jsonb where tenant_id=$1 and workspace_id=$2 and id=$3',[a.tenantId,a.workspaceId,id,status,JSON.stringify({error:reason,processedAt:now.toISOString()})]);await event(tx,a,'website.schedule_blocked',id,{siteId:site.id,reason});return {status,reason};};
 if(job.expires_at&&new Date(job.expires_at).getTime()<=now.getTime())return blocked('EXPIRED','PROMOTION_EXPIRED');
 if(site.generation!==job.expected_generation)return blocked('STALE','WEBSITE_GENERATION_CONFLICT');
 const approvedActor=(await tx.query('select role from public.memberships where tenant_id=$1 and workspace_id=$2 and user_id=$3',[a.tenantId,a.workspaceId,job.data.approvedBy])).rows[0];
 if(!approvedActor||approvedActor.role!==job.data.approvedRole)return blocked('REVOKED','PUBLISHER_MEMBERSHIP_CHANGED');
 if(approvedActor.role!=='owner'){
  const grant=(await tx.query("select 1 from app.resource_grants where tenant_id=$1 and workspace_id=$2 and status='ACTIVE' and data->>'kind'='WEBSITE_CAPABILITY' and data->>'resourceId'=$3 and data->>'userId'=$4 and data->>'permission'='PUBLISH' limit 1",[a.tenantId,a.workspaceId,site.id,job.data.approvedBy])).rowCount;if(!grant)return blocked('REVOKED','PUBLISHER_GRANT_REVOKED');
 }
 const revisions=job.data.changedRevisionIds as string[];const documents=job.data.changedDocumentIds as string[];
 for(const [n,documentId]of documents.entries()){const doc=await get(tx,a,'content_assets',documentId);if(doc.head_revision_id!==revisions[n])return blocked('STALE','WEBSITE_REVISION_CHANGED');}
 const release=await get(tx,a,'website_releases',job.release_id) as WebsiteRelease;
 // Domain validation errors must not abort the failure record. Roll back only
 // the activation savepoint, then retain a visible blocked job and audit event.
 await tx.query('SAVEPOINT website_job_activation');
 try{await activateWebsiteRelease(tx,a,site,release,job.expected_generation);}catch{
  await tx.query('ROLLBACK TO SAVEPOINT website_job_activation');return blocked('BLOCKED','RELEASE_DEPENDENCY_REVIEW_REQUIRED');
 }
 await tx.query("update app.website_publish_jobs set status='COMPLETE',revision=revision+1,updated_at=now(),data=data||$4::jsonb where tenant_id=$1 and workspace_id=$2 and id=$3",[a.tenantId,a.workspaceId,id,JSON.stringify({processedAt:now.toISOString(),activationGeneration:site.generation+1})]);return {status:'COMPLETE',releaseId:release.id,generation:site.generation+1};
}
