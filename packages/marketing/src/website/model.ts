import {createHash} from 'node:crypto';
import {ZodError} from 'zod';
import {DomainError,fail,get,type Actor,type Input,type Row,type Tx} from '../../../kernel/src';
import {parseWebsiteDocument,type WebsiteCapability,type WebsiteDocument} from '../../../contracts/src/website';

export type WebsiteSite=Row & {store_id:string|null;active_release_id:string|null;generation:number};
export type WebsiteRecord=Row & {site_id:string;document_type:WebsiteDocument['documentType'];website_path:string|null;head_revision_id:string|null};
export type WebsiteRevision=Row & {site_id:string;content_id:string;data:{document:WebsiteDocument;hash:string;archived:boolean;reason:string;version:number}};
export type ReleaseManifest={documents:Record<string,string>;paths:Record<string,string>;redirects:Record<string,string>;globals:{navigation:string;footer:string;theme:string}};
export type WebsiteRelease=Row & {site_id:string;previous_release_id:string|null;data:{manifest:ReleaseManifest;revisionIds:string[];changedDocumentIds:string[];hash:string;reason:string;approvedBy:string;schemaVersion:number}};
export function stableJson(value:unknown):string{
 if(Array.isArray(value))return '['+value.map(stableJson).join(',')+']';
 if(value&&typeof value==='object')return '{'+Object.entries(value as Input).filter(([,v])=>v!==undefined).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+stableJson(v)).join(',')+'}';
 return JSON.stringify(value)??'null';
}
export const websiteHash=(value:unknown)=>createHash('sha256').update(stableJson(value)).digest('hex');
export const bytesHash=(value:Buffer)=>createHash('sha256').update(value).digest('hex');
export function documentInput(value:unknown):WebsiteDocument{
 try{return parseWebsiteDocument(value);}catch(e){
  if(e instanceof ZodError)throw new DomainError('WEBSITE_DOCUMENT_INVALID',400,e.issues.slice(0,6).map(i=>`${i.path.join('.')||'Document'}: ${i.message}`).join('; '));
  return fail(e instanceof Error&&/^WEBSITE_/.test(e.message)?e.message:'WEBSITE_DOCUMENT_INVALID',400);
 }
}
export async function websiteSite(tx:Tx,a:Actor,id:unknown,capability:WebsiteCapability='EDIT',lock=false):Promise<WebsiteSite>{
 if(a.role==='customer'||a.role==='staff')fail('WEBSITE_PERMISSION_REQUIRED',403);
 const site=await get(tx,a,'websites',id) as WebsiteSite;
 const can=(await tx.query('select app.website_can($1,$2,$3,$4,$5) as allowed',[a.tenantId,a.workspaceId,site.id,site.store_id,capability])).rows[0]?.allowed;
 if(!can)fail('WEBSITE_PERMISSION_REQUIRED',403);
 return lock?await get(tx,a,'websites',site.id,true) as WebsiteSite:site;
}
export async function websiteRecord(tx:Tx,a:Actor,id:unknown,capability:WebsiteCapability='EDIT',lock=false){
 const row=await get(tx,a,'content_assets',id,lock) as WebsiteRecord;
 if(!row.site_id||!row.document_type)fail('WEBSITE_DOCUMENT_NOT_FOUND',404);
 const site=await websiteSite(tx,a,row.site_id,capability);
 return {row,site};
}
export async function revisionRecord(tx:Tx,a:Actor,id:unknown,siteId:string):Promise<WebsiteRevision>{
 const revision=await get(tx,a,'content_revisions',id) as WebsiteRevision;
 if(revision.site_id!==siteId||!revision.content_id||websiteHash(revision.data.document)!==revision.data.hash)fail('WEBSITE_REVISION_INVALID',409);
 return revision;
}
export function activeMedia(row:Row,siteId:string,now=new Date()){
 return row.site_id===siteId&&row.data.kind==='WEBSITE_DERIVATIVE'&&row.status==='APPROVED'&&row.data.rightsConfirmed===true&&(!row.data.rightsExpiresAt||Date.parse(String(row.data.rightsExpiresAt))>now.getTime());
}
export const hasDurableWebsiteStorage=()=>process.env.TWELVESPEC_PREVIEW!=='1'||!!process.env.DATABASE_URL&&!['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname);
export const websiteSchedulerActive=()=>hasDurableWebsiteStorage()&&process.env.WEBSITE_SCHEDULER_ENABLED==='1';
export const emptyManifest=():ReleaseManifest=>({documents:{},paths:{},redirects:{},globals:{navigation:'',footer:'',theme:''}});
