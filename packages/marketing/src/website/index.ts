import {create,event,fail,get,list,text,transaction,update,type Actor,type Input,type Row,type Tx} from '../../../kernel/src';
import {SITE_CAPABILITIES,WEBSITE_COMPONENTS,WEBSITE_GLOBAL_COMPONENTS,newWebsiteSection,type WebsiteDocument} from '../../../contracts/src/website';
import {saveWebsiteCollection} from '../../../catalog/src/merchandising';
import {publicProduct} from '../../../catalog/src';
import {handleStores} from '../../../stores/src';
import {defaultWebsiteDocuments} from './defaults';
import {handleWebsiteDocuments,saveWebsiteDocument} from './documents';
import {handleWebsiteMedia,websiteMediaSummary} from './media';
import {hasDurableWebsiteStorage,revisionRecord,websiteRecord,websiteSchedulerActive,websiteSite,type WebsiteRecord,type WebsiteRevision,type WebsiteSite} from './model';
import {handleWebsiteReleases,publishWebsiteChanges} from './releases';
import {publicCatalogPage,resolveWebsite} from './repository';
import {claimSourceChoices} from './claims';

export async function initializeWebsite(tx:Tx,a:Actor,storeId?:string){
 if(a.role!=='owner')fail('WEBSITE_OWNER_REQUIRED',403);
 await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`website/init/${a.tenantId}/${a.workspaceId}/${storeId??'primary'}`]);
 const existing=(await tx.query('select * from app.websites where tenant_id=$1 and workspace_id=$2 and store_id is not distinct from $3::uuid',[a.tenantId,a.workspaceId,storeId??null])).rows[0];if(existing)return {site:existing,alreadyInitialized:true};
 const store=storeId?await get(tx,a,'stores',storeId):null;if(store&&store.status!=='ACTIVE')fail('WEBSITE_ACTIVE_STORE_REQUIRED');
 const site=await create(tx,a,'websites',{title:store?.title??'TwelveSpec website',...(store?{store_id:store.id}:{}),status:'ACTIVE',data:{locale:'en-US',timezone:'America/Chicago',synthetic:true}}) as unknown as WebsiteSite;
 const documents=defaultWebsiteDocuments(site.id,store?{id:store.id,title:store.title,...(typeof store.data.brandKitId==='string'?{brandKitId:store.data.brandKitId}:{})}:undefined);
 if(!store){
  const products=(await tx.query("select id from app.products where tenant_id=$1 and workspace_id=$2 and status='PUBLISHED' order by created_at,id limit 12",[a.tenantId,a.workspaceId])).rows;
  const collection=await saveWebsiteCollection(tx,a,{siteId:site.id,title:'Featured products',slug:'featured-products',description:'A starting point for your next custom project.',seoTitle:'Featured TwelveSpec products',seoDescription:'Explore approved products and request a reviewed quote.',items:products.map(p=>({productId:p.id,hidden:false,featured:true}))});
  const home=documents.find(d=>d.documentType==='WEBSITE_PAGE')!;if(home.documentType==='WEBSITE_PAGE')home.sections.find(s=>s.type==='product_carousel')!.content.collectionId=collection.id;
  const solutionPages:WebsiteRecord[]=[];
  for(const [title,path,copy]of [['Trade shows','/solutions/trade-shows','Coordinated signage, print and merchandise for your next event.'],['Uniforms','/solutions/uniforms','Bring a consistent look to the people representing your business.'],['Employee gifting','/solutions/employee-gifting','Thoughtful products for welcomes, milestones and team appreciation.'],['School fundraising','/solutions/school-fundraising','Create a coordinated collection for your school or community.'],['Industrial branding','/solutions/industrial-branding','Identify your team and present your business clearly.']]){
   const hero=newWebsiteSection('hero');hero.content.heading=title;hero.content.body=copy;hero.content.primaryLink={label:'Start a quote project',kind:'WORKFLOW',href:'/account'};
   const products=newWebsiteSection('product_carousel');products.content.collectionId=collection.id;
   const result=await saveWebsiteDocument(tx,a,{document:{schemaVersion:1,siteId:site.id,documentType:'WEBSITE_PAGE',title,path,seo:{title:`${title} | TwelveSpec`,description:copy,noIndex:true},sections:[hero,products,newWebsiteSection('project_inquiry')]},reason:'Synthetic starting solution page'});solutionPages.push(result.record);
  }
  const solutions=newWebsiteSection('solution_cards');solutions.content.solutionPageIds=solutionPages.map(p=>p.id);
  documents.push({schemaVersion:1,siteId:site.id,documentType:'WEBSITE_PAGE',title:'Solutions',path:'/solutions',seo:{title:'Solutions | TwelveSpec',description:'Shop by the outcome you want to create.',noIndex:true},sections:[solutions,newWebsiteSection('project_inquiry')]});
  const nav=documents.find(d=>d.documentType==='WEBSITE_NAVIGATION');if(nav?.documentType==='WEBSITE_NAVIGATION')nav.items.find(item=>item.label==='Solutions')!.children=solutionPages.map(page=>({id:crypto.randomUUID(),label:page.title,link:{label:page.title,kind:'PAGE',targetId:page.id},children:[]}));
 }
 for(const document of documents)await saveWebsiteDocument(tx,a,{document,reason:'Initialized editable development website'});
 const records=(await tx.query('select id,head_revision_id,revision from app.content_assets where tenant_id=$1 and workspace_id=$2 and site_id=$3 order by id',[a.tenantId,a.workspaceId,site.id])).rows;
 const result=await publishWebsiteChanges(tx,a,{siteId:site.id,expectedGeneration:0,changes:records.map(r=>({documentId:r.id,revisionId:r.head_revision_id,expectedRevision:r.revision})),approveSelected:true,reason:'Initialize synthetic development content using existing products and identity'});
 await event(tx,a,'website.initialized',site.id,{storeId:store?.id??null,synthetic:true});return result;
}
export async function websiteWorkspace(tx:Tx,a:Actor,input:Input={}){
 if(a.role==='customer'||a.role==='staff')fail('WEBSITE_PERMISSION_REQUIRED',403);
 const sites=(await tx.query('select id,title,status,store_id,active_release_id,generation,data,revision from app.websites where tenant_id=$1 and workspace_id=$2 order by store_id nulls first,title,id',[a.tenantId,a.workspaceId])).rows;
 const chosen=input.siteId??sites[0]?.id;
 if(!chosen)return {sites:[],site:null,documents:[],components:WEBSITE_COMPONENTS,globalComponents:WEBSITE_GLOBAL_COMPONENTS,canAuthorClaims:a.role!=='store_admin',canInitialize:a.role==='owner',durable:hasDurableWebsiteStorage(),schedulerActive:websiteSchedulerActive()};
 const site=await get(tx,a,'websites',chosen) as WebsiteSite;
 const caps=(await tx.query("select app.website_can($1,$2,$3,$4,'EDIT') edit,app.website_can($1,$2,$3,$4,'PUBLISH') publish,app.website_can($1,$2,$3,$4,'MEDIA') media,app.website_can($1,$2,$3,$4,'MERCHANDISE') merchandise",[a.tenantId,a.workspaceId,site.id,site.store_id])).rows[0];
 const page=Math.max(1,Math.floor(Number(input.page)||1)),size=25;
 const documents=caps.edit?(await tx.query(`select c.id,c.title,c.status,c.site_id,c.document_type,c.website_path,c.head_revision_id,c.revision,c.updated_at,r.data->>'hash' as head_hash,
  exists(select 1 from app.approvals a where a.content_revision_id=c.head_revision_id and a.status='APPROVED' and a.data->>'hash'=r.data->>'hash') approved,
  coalesce((select p.data->'revisionIds' ? c.head_revision_id::text from app.website_releases p where p.id=$4),false) published
  from app.content_assets c left join app.content_revisions r on r.id=c.head_revision_id where c.tenant_id=$1 and c.workspace_id=$2 and c.site_id=$3 order by c.website_path nulls last,c.document_type,c.id limit $5 offset $6`,[a.tenantId,a.workspaceId,site.id,site.active_release_id,size,(page-1)*size])).rows:[];
 const total=caps.edit?Number((await tx.query('select count(*)::int n from app.content_assets where tenant_id=$1 and workspace_id=$2 and site_id=$3',[a.tenantId,a.workspaceId,site.id])).rows[0].n):0;
 const pageChoices=caps.edit?(await tx.query("select id,title,document_type,website_path,status from app.content_assets where tenant_id=$1 and workspace_id=$2 and site_id=$3 and document_type='WEBSITE_PAGE' and status<>'ARCHIVED' order by title,id limit 500",[a.tenantId,a.workspaceId,site.id])).rows:[];
 const media=caps.media?(await tx.query("select id,title,status,data,site_id,workspace_id,revision,created_at from app.assets where tenant_id=$1 and workspace_id=$2 and site_id=$3 and data->>'kind' in ('WEBSITE_DERIVATIVE','WEBSITE_CONSENT') order by created_at desc,id limit 200",[a.tenantId,a.workspaceId,site.id])).rows.map(websiteMediaSummary):[];
 const collections=(await tx.query('select id,title,status,data,store_id,revision,created_at from app.collections where tenant_id=$1 and workspace_id=$2 and store_id is not distinct from $3::uuid order by title,id limit 200',[a.tenantId,a.workspaceId,site.store_id])).rows;
 const memberships=a.role==='owner'?(await tx.query('select m.user_id as id,m.role,u.name,u.email from memberships m join "user" u on u.id=m.user_id where m.tenant_id=$1 and m.workspace_id=$2 order by u.name',[a.tenantId,a.workspaceId])).rows:[];
 const grants=a.role==='owner'?(await tx.query("select id,status,data,revision from app.resource_grants where tenant_id=$1 and workspace_id=$2 and data->>'kind'='WEBSITE_CAPABILITY' and data->>'resourceId'=$3",[a.tenantId,a.workspaceId,site.id])).rows:[];
 const stores=(await tx.query("select id,title,status,data->>'brandKitId' as brand_kit_id from app.stores where tenant_id=$1 and workspace_id=$2 and status='ACTIVE' order by title,id",[a.tenantId,a.workspaceId])).rows;
 const releases=caps.edit?(await tx.query('select * from app.website_releases where tenant_id=$1 and workspace_id=$2 and site_id=$3 order by created_at desc,id desc limit 25',[a.tenantId,a.workspaceId,site.id])).rows:[];
 const jobs=caps.edit?(await tx.query('select * from app.website_publish_jobs where tenant_id=$1 and workspace_id=$2 and site_id=$3 order by created_at desc,id desc limit 25',[a.tenantId,a.workspaceId,site.id])).rows:[];
 return {sites,site,capabilities:caps,documents,pageChoices,page,pageSize:size,total,media,collections,stores,releases,jobs,memberships,grants,components:WEBSITE_COMPONENTS,globalComponents:WEBSITE_GLOBAL_COMPONENTS,canAuthorClaims:a.role!=='store_admin',durable:hasDurableWebsiteStorage(),schedulerActive:websiteSchedulerActive(),canInitialize:a.role==='owner'};
}
export async function draftWebsitePreview(tx:Tx,a:Actor,siteId:string,revisionId:string){
 const site=await websiteSite(tx,a,siteId);const revision=await revisionRecord(tx,a,revisionId,site.id);const row=await get(tx,a,'content_assets',revision.content_id);
 if(row.site_id!==site.id)fail('WEBSITE_REVISION_IDENTITY_MISMATCH',400);
 let revisions:WebsiteRevision[]=[];
 if(site.active_release_id){const release=await get(tx,a,'website_releases',site.active_release_id);revisions=(await tx.query('select * from app.content_revisions where tenant_id=$1 and workspace_id=$2 and site_id=$3 and id=any($4::uuid[])',[a.tenantId,a.workspaceId,site.id,release.data.revisionIds])).rows;}
 revisions=[...revisions.filter(r=>r.content_id!==revision.content_id),revision];
 return resolveWebsite(tx,site,revisions,revision.data.document.documentType==='WEBSITE_PAGE'?revision.data.document.path:'/',true);
}
async function grantWebsiteCapability(tx:Tx,a:Actor,i:Input){
 if(a.role!=='owner')fail('WEBSITE_OWNER_REQUIRED',403);const site=await websiteSite(tx,a,i.siteId,'PUBLISH');
 const userId=text(i.userId),permission=text(i.permission);if(!(SITE_CAPABILITIES as readonly string[]).includes(permission))fail('WEBSITE_CAPABILITY_INVALID',400);
 const member=(await tx.query('select role from memberships where tenant_id=$1 and workspace_id=$2 and user_id=$3',[a.tenantId,a.workspaceId,userId])).rows[0];if(!member||['customer','staff'].includes(member.role))fail('WEBSITE_ELIGIBLE_EDITOR_REQUIRED',400);
 if(member.role==='store_admin'&&!site.store_id)fail('WEBSITE_STORE_SCOPE_REQUIRED',400);
 const prior=(await tx.query("select * from app.resource_grants where tenant_id=$1 and workspace_id=$2 and status='ACTIVE' and data->>'kind'='WEBSITE_CAPABILITY' and data->>'resourceId'=$3 and data->>'userId'=$4 and data->>'permission'=$5 for update",[a.tenantId,a.workspaceId,site.id,userId,permission])).rows[0];
 if(i.revoke===true){if(!prior)fail('WEBSITE_GRANT_NOT_FOUND',404);const row=await update(tx,a,'resource_grants',prior.id,{status:'REVOKED',data:{...prior.data,revokedBy:a.userId,reason:text(i.reason,1000)}});await event(tx,a,'website.capability_revoked',row.id,{siteId:site.id,userId,permission});return row;}
 if(prior)return prior;
 const row=await create(tx,a,'resource_grants',{title:`Website ${permission}`,status:'ACTIVE',data:{kind:'WEBSITE_CAPABILITY',resourceId:site.id,userId,permission,approvedBy:a.userId,reason:text(i.reason,1000)}});await event(tx,a,'website.capability_granted',row.id,{siteId:site.id,userId,permission});return row;
}
export async function handleWebsite(tx:Tx,a:Actor,action:string,i:Input):Promise<unknown>{
 if(a.role==='customer'||a.role==='staff')fail('WEBSITE_PERMISSION_REQUIRED',403);
 if(action==='initialize')return initializeWebsite(tx,a,typeof i.storeId==='string'?i.storeId:undefined);
 if(action==='workspace')return websiteWorkspace(tx,a,i);
 if(action==='claim_sources')return claimSourceChoices(tx,a,i);
 if(action==='grant_capability')return grantWebsiteCapability(tx,a,i);
 if(action==='save_collection')return saveWebsiteCollection(tx,a,i);
 if(action==='get_collection'){
  const site=await websiteSite(tx,a,i.siteId,'MERCHANDISE'),collection=await get(tx,a,'collections',i.id);if((collection.store_id??null)!==(site.store_id??null))fail('CATALOG_COLLECTION_SCOPE_MISMATCH',403);
  const items=(await tx.query('select product_id as "productId",variant_id as "variantId",status,data from app.collection_products where tenant_id=$1 and workspace_id=$2 and collection_id=$3 order by (data->>\'rank\')::integer,id',[a.tenantId,a.workspaceId,collection.id])).rows.filter(row=>row.status!=='REMOVED').map(row=>({productId:row.productId,...(row.variantId?{variantId:row.variantId}:{}),hidden:row.status==='HIDDEN',featured:row.data.featured===true}));
  const ids=items.map(item=>item.productId),products=(await tx.query('select * from app.products where tenant_id=$1 and workspace_id=$2 and id=any($3::uuid[])',[a.tenantId,a.workspaceId,ids])).rows as Row[],variants=(await tx.query("select * from app.variants where tenant_id=$1 and workspace_id=$2 and product_id=any($3::uuid[]) and status<>'ARCHIVED'",[a.tenantId,a.workspaceId,ids])).rows as Row[];
  return {collection,items,products:products.map(product=>publicProduct(product,variants.filter(variant=>variant.product_id===product.id)))};
 }
 if(action==='catalog_picker'){const site=await websiteSite(tx,a,i.siteId);return publicCatalogPage(tx,{tenantId:a.tenantId,workspaceId:a.workspaceId,userId:a.userId},{...i,...(site.store_id?{storeId:site.store_id}:{})});}
 if(action==='add_to_store'){const site=await websiteSite(tx,a,i.siteId,'MERCHANDISE');if(!site.store_id)fail('WEBSITE_STORE_SCOPE_REQUIRED',400);return handleStores(tx,a,'assign_product',{storeId:site.store_id,productId:i.productId});}
 if(['save_document','create_page','get_document','duplicate_page','archive_document','restore_revision','request_review','approve_revision'].includes(action))return handleWebsiteDocuments(tx,a,action,i);
 if(['publish','rollback_site','cancel_schedule'].includes(action))return handleWebsiteReleases(tx,a,action,i);
 if(['upload_media','revise_media','revoke_media','archive_media','media_usage','record_consent'].includes(action))return handleWebsiteMedia(tx,a,action,i);
 return fail('WEBSITE_COMMAND_NOT_SUPPORTED',400);
}

export async function seedWebsite(a:Actor){return transaction(a,tx=>initializeWebsite(tx,a));}
