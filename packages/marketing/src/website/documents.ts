import {create,event,fail,get,text,uid,update,type Actor,type Input,type Tx} from '../../../kernel/src';
import {newWebsiteSection,type WebsiteDocument} from '../../../contracts/src/website';
import {documentInput,revisionRecord,websiteHash,websiteRecord,websiteSite,type WebsiteRecord,type WebsiteRevision,type WebsiteSite} from './model';
import {recordDocumentReferences,validateDocumentReferences} from './references';

export async function saveWebsiteDocument(tx:Tx,a:Actor,input:Input){
 const doc=documentInput(input.document);const site=await websiteSite(tx,a,doc.siteId,'EDIT');
 const refs=await validateDocumentReferences(tx,a,site,doc);
 let row:WebsiteRecord;let parent:WebsiteRevision|null=null;
 if(input.id){
  const current=await websiteRecord(tx,a,input.id,'EDIT',true);row=current.row;
  if(row.site_id!==site.id||row.document_type!==doc.documentType)fail('WEBSITE_DOCUMENT_IDENTITY_MISMATCH',400);
  if(!Number.isInteger(input.expectedRevision)||row.revision!==input.expectedRevision)fail('REVISION_CONFLICT');
  if(row.head_revision_id)parent=await revisionRecord(tx,a,row.head_revision_id,site.id);
 }else row=await create(tx,a,'content_assets',{title:doc.title.trim()||'Untitled page',status:'DRAFT',site_id:site.id,document_type:doc.documentType,...(doc.documentType==='WEBSITE_PAGE'?{website_path:doc.path}:{}),data:{kind:doc.documentType,schemaVersion:1}}) as unknown as WebsiteRecord;
 const archived=input.archived===true;
 const revision=await create(tx,a,'content_revisions',{title:`${doc.title||'Untitled'} · version ${Number(parent?.data.version??0)+1}`,status:'RECORDED',site_id:site.id,content_id:row.id,...(parent?{parent_content_revision_id:parent.id}:{}),data:{document:doc,hash:websiteHash(doc),archived,reason:typeof input.reason==='string'?text(input.reason,1000):'Editorial update',version:Number(parent?.data.version??0)+1}}) as WebsiteRevision;
 await recordDocumentReferences(tx,a,site.id,revision.id,refs);
 await update(tx,a,'content_assets',row.id,{title:doc.title.trim()||'Untitled page',status:archived?'ARCHIVED':'DRAFT',expectedRevision:row.revision,data:{...row.data,kind:doc.documentType,schemaVersion:1,draftHash:revision.data.hash}});
 row=(await tx.query('update app.content_assets set head_revision_id=$4,website_path=$5 where tenant_id=$1 and workspace_id=$2 and id=$3 returning *',[a.tenantId,a.workspaceId,row.id,revision.id,doc.documentType==='WEBSITE_PAGE'?doc.path:null])).rows[0] as WebsiteRecord;
 await event(tx,a,archived?'website.document_archived_draft':'website.document_saved',row.id,{siteId:site.id,revisionId:revision.id,hash:revision.data.hash,publicSiteUnchanged:true});return {record:row,revision};
}
export async function approveWebsiteRevision(tx:Tx,a:Actor,revisionId:unknown,siteId:string,reason:string){
 await websiteSite(tx,a,siteId,'PUBLISH');const revision=await revisionRecord(tx,a,revisionId,siteId);
 const {row}=await websiteRecord(tx,a,revision.content_id,'EDIT');if(row.head_revision_id!==revision.id)fail('WEBSITE_REVISION_STALE');
 if(!revision.data.archived)await validateDocumentReferences(tx,a,await websiteSite(tx,a,siteId),revision.data.document,true);
 await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`website/approve/${siteId}/${revision.id}`]);
 const approved=(await tx.query("select * from app.approvals where tenant_id=$1 and workspace_id=$2 and site_id=$3 and content_revision_id=$4 and status='APPROVED' and data->>'hash'=$5 limit 1",[a.tenantId,a.workspaceId,siteId,revision.id,revision.data.hash])).rows[0];
 if(approved)return approved;
 const approval=await create(tx,a,'approvals',{title:`Website: ${row.title}`,status:'APPROVED',site_id:siteId,content_revision_id:revision.id,data:{kind:'WEBSITE_REVISION',hash:revision.data.hash,approvedBy:a.userId,approvedAt:new Date().toISOString(),reason:text(reason,2000)}});
 await event(tx,a,'website.revision_approved',revision.id,{siteId,approvalId:approval.id,hash:revision.data.hash});return approval;
}
export async function handleWebsiteDocuments(tx:Tx,a:Actor,action:string,i:Input):Promise<unknown>{
 if(action==='save_document')return saveWebsiteDocument(tx,a,i);
 if(action==='create_page'){
  const site=await websiteSite(tx,a,i.siteId);return saveWebsiteDocument(tx,a,{document:{schemaVersion:1,siteId:site.id,documentType:'WEBSITE_PAGE',title:text(i.title,160),path:text(i.path,240),seo:{title:text(i.title,70),description:typeof i.description==='string'?i.description:'A new TwelveSpec project.',noIndex:true},sections:[newWebsiteSection('hero'),newWebsiteSection('project_inquiry')]},reason:'Created website page'});
 }
 if(action==='get_document'){
  const {row}=await websiteRecord(tx,a,i.id);const revision=await revisionRecord(tx,a,i.revisionId??row.head_revision_id,row.site_id);if(revision.content_id!==row.id)fail('WEBSITE_REVISION_IDENTITY_MISMATCH',400);
  const page=Math.max(1,Math.floor(Number(i.page)||1)),size=25;
  const history=(await tx.query('select id,title,status,data,created_at,content_id,site_id from app.content_revisions where tenant_id=$1 and workspace_id=$2 and site_id=$3 and content_id=$4 order by created_at desc,id desc limit $5 offset $6',[a.tenantId,a.workspaceId,row.site_id,row.id,size,(page-1)*size])).rows;
  const count=(await tx.query('select count(*)::int total from app.content_revisions where tenant_id=$1 and workspace_id=$2 and site_id=$3 and content_id=$4',[a.tenantId,a.workspaceId,row.site_id,row.id])).rows[0].total;
  return {record:row,revision,history,historyPage:page,historyTotal:count,historyPageSize:size};
 }
 if(action==='duplicate_page'){
  const {row}=await websiteRecord(tx,a,i.id);const source=await revisionRecord(tx,a,row.head_revision_id,row.site_id);
  if(source.data.document.documentType!=='WEBSITE_PAGE')fail('WEBSITE_ONLY_PAGES_CAN_DUPLICATE',400);
  const document=structuredClone(source.data.document);document.title=`${document.title} copy`.slice(0,160);document.path=typeof i.path==='string'?i.path:`${document.path==='/'?'/home':document.path}-copy-${uid().slice(0,6)}`;document.seo.noIndex=true;document.sections=document.sections.map(section=>({...section,id:uid(),content:section.type==='capability_claims'?{...section.content,entries:(section.content.entries as {id:string}[]).map(claim=>({...claim,id:uid()}))}:section.content}));
  return saveWebsiteDocument(tx,a,{document,reason:'Duplicated as an isolated draft'});
 }
 if(action==='archive_document'){
  const {row}=await websiteRecord(tx,a,i.id);if(row.document_type!=='WEBSITE_PAGE'||row.website_path==='/')fail('WEBSITE_REQUIRED_DOCUMENT_CANNOT_ARCHIVE');
  const current=await revisionRecord(tx,a,row.head_revision_id,row.site_id);return saveWebsiteDocument(tx,a,{id:row.id,expectedRevision:i.expectedRevision,document:current.data.document,archived:true,reason:text(i.reason??'Archived page',1000)});
 }
 if(action==='restore_revision'){
  const {row}=await websiteRecord(tx,a,i.id);const revision=await revisionRecord(tx,a,i.revisionId,row.site_id);if(revision.content_id!==row.id)fail('WEBSITE_REVISION_IDENTITY_MISMATCH',400);
  return saveWebsiteDocument(tx,a,{id:row.id,expectedRevision:i.expectedRevision,document:revision.data.document,reason:text(i.reason??'Restored earlier revision as a new draft',1000)});
 }
 if(action==='request_review'){
  const {row}=await websiteRecord(tx,a,i.id);const revision=await revisionRecord(tx,a,row.head_revision_id,row.site_id);
  await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`website/request-review/${revision.id}`]);
  const existing=(await tx.query("select * from app.approvals where tenant_id=$1 and workspace_id=$2 and site_id=$3 and content_revision_id=$4 and data->>'kind'='WEBSITE_REVISION' order by created_at desc limit 1",[a.tenantId,a.workspaceId,row.site_id,revision.id])).rows[0];if(existing)return existing;
  const approval=await create(tx,a,'approvals',{title:`Review: ${row.title}`,status:'PENDING',site_id:row.site_id,content_revision_id:revision.id,data:{kind:'WEBSITE_REVISION',hash:revision.data.hash,requestedBy:a.userId,reason:text(i.reason??'Ready for editorial review',1000)}});await event(tx,a,'website.review_requested',row.id,{siteId:row.site_id,revisionId:revision.id});return approval;
 }
 if(action==='approve_revision')return approveWebsiteRevision(tx,a,i.revisionId,text(i.siteId),text(i.reason,2000));
 return fail('WEBSITE_DOCUMENT_COMMAND_INVALID',400);
}
