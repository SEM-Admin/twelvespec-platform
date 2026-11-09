import sharp from 'sharp';
import {create,event,fail,get,text,update,type Actor,type Input,type Row,type Tx} from '../../../kernel/src';
import {activeMedia,bytesHash,websiteSite} from './model';

export function websiteMediaSummary(row:Row){return {id:row.id,title:row.title,status:row.status,revision:row.revision,created_at:row.created_at,site_id:row.site_id,data:{kind:row.data.kind,alt:row.data.alt??'',caption:row.data.caption??'',tags:row.data.tags??[],mimeType:row.data.mimeType,width:row.data.width,height:row.data.height,bytes:row.data.bytes,contentHash:row.data.contentHash,rightsConfirmed:row.data.rightsConfirmed===true,rightsExpiresAt:row.data.rightsExpiresAt??null,version:row.data.version??1,priorAssetId:row.data.priorAssetId??null,private:row.data.kind!=='WEBSITE_DERIVATIVE',previewUrl:row.data.kind==='WEBSITE_DERIVATIVE'?`/api/website/media/${row.id}?preview=1`:null}};}
async function mediaRow(tx:Tx,a:Actor,id:unknown){const row=await get(tx,a,'assets',id);if(!row.site_id)fail('WEBSITE_MEDIA_NOT_FOUND',404);await websiteSite(tx,a,row.site_id,'MEDIA');return row;}
export async function websiteMediaUsage(tx:Tx,a:Actor,id:unknown){
 const asset=await mediaRow(tx,a,id);
 const rows=(await tx.query(`select r.source_revision_id as "revisionId",c.id as "documentId",c.title,c.website_path as path,
  exists(select 1 from app.websites w join app.website_releases p on p.id=w.active_release_id where w.id=r.site_id and p.data->'revisionIds' ? r.source_revision_id::text) as published
  from app.content_references r join app.content_revisions v on v.id=r.source_revision_id join app.content_assets c on c.id=v.content_id
  where r.tenant_id=$1 and r.workspace_id=$2 and r.asset_id=$3 order by r.created_at desc limit 200`,[a.tenantId,a.workspaceId,asset.id])).rows;
 return {asset:websiteMediaSummary(asset),uses:rows};
}
function mediaMetadata(i:Input){
 if(typeof i.alt!=='string'||i.alt.length>300||typeof i.caption==='string'&&i.caption.length>360)fail('WEBSITE_MEDIA_METADATA_INVALID',400);
 if(i.tags!==undefined&&(!Array.isArray(i.tags)||i.tags.length>20||i.tags.some(t=>typeof t!=='string'||t.length>60)))fail('WEBSITE_MEDIA_TAGS_INVALID',400);
 let expires:string|null=null;
 if(i.rightsExpiresAt){const d=new Date(String(i.rightsExpiresAt));if(!Number.isFinite(d.getTime())||d.getTime()<=Date.now())fail('WEBSITE_MEDIA_EXPIRY_INVALID',400);expires=d.toISOString();}
 return {alt:i.alt.trim(),caption:typeof i.caption==='string'?i.caption.trim():'',tags:(i.tags??[]) as string[],rightsExpiresAt:expires};
}
export async function handleWebsiteMedia(tx:Tx,a:Actor,action:string,i:Input):Promise<unknown>{
 if(action==='media_usage')return websiteMediaUsage(tx,a,i.id);
 if(action==='upload_media'){
  const site=await websiteSite(tx,a,i.siteId,'MEDIA');
  if(i.rightsConfirmed!==true)fail('WEBSITE_MEDIA_RIGHTS_REQUIRED',400);
  const metadata=mediaMetadata(i),rightsNote=text(i.rightsNote,2000);
  if(typeof i.content!=='string'||i.content.length>12*1024*1024||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(i.content))fail('WEBSITE_MEDIA_FORMAT_INVALID',400);
  const original=Buffer.from(i.content.slice(i.content.indexOf(',')+1),'base64');if(!original.length||original.length>8*1024*1024)fail('WEBSITE_MEDIA_SIZE_LIMIT',400);
  const claimed=i.content.slice(5,i.content.indexOf(';'));let derivative:Buffer;let width:number;let height:number;
  try{
   const image=sharp(original,{limitInputPixels:40000000,animated:false}),info=await image.metadata();
   if(!['png','jpeg','webp'].includes(String(info.format))||(info.pages??1)>1||claimed!==`image/${info.format}`)return fail('WEBSITE_MEDIA_FORMAT_INVALID',400);
   const result=await image.rotate().resize({width:2000,height:2000,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toBuffer({resolveWithObject:true});
   derivative=result.data;width=result.info.width;height=result.info.height;
  }catch{return fail('WEBSITE_MEDIA_INVALID',400);}
  const source=await create(tx,a,'assets',{site_id:site.id,title:text(i.fileName??'Website image',200),status:'PRIVATE_ORIGINAL',web_bytes:original,data:{kind:'WEBSITE_ORIGINAL',mimeType:claimed,bytes:original.length,contentHash:bytesHash(original),rightsNote,rightsConfirmedBy:a.userId,rightsConfirmedAt:new Date().toISOString(),private:true}});
  const asset=await create(tx,a,'assets',{site_id:site.id,original_asset_id:source.id,title:source.title,status:'APPROVED',web_bytes:derivative,data:{kind:'WEBSITE_DERIVATIVE',mimeType:'image/webp',width,height,bytes:derivative.length,contentHash:bytesHash(derivative),rightsConfirmed:true,rightsConfirmedBy:a.userId,rightsConfirmedAt:new Date().toISOString(),metadataRemoved:true,version:1,...metadata}});
  await event(tx,a,'website.media_uploaded',asset.id,{siteId:site.id,originalPrivate:true,derivativeMetadataRemoved:true});return websiteMediaSummary(asset);
 }
 if(action==='record_consent'){
  const site=await websiteSite(tx,a,i.siteId,'MEDIA');const note=text(i.evidence,5000);if(i.permissionConfirmed!==true)fail('WEBSITE_CONSENT_ASSERTION_REQUIRED',400);
  const source=await create(tx,a,'assets',{site_id:site.id,title:text(i.title,160),status:'PRIVATE_ORIGINAL',data:{kind:'WEBSITE_CONSENT_EVIDENCE',evidence:note,recordedBy:a.userId,recordedAt:new Date().toISOString(),private:true}});
  const asset=await create(tx,a,'assets',{site_id:site.id,original_asset_id:source.id,title:source.title,status:'VERIFIED',data:{kind:'WEBSITE_CONSENT',permissionConfirmed:true,recordedAt:new Date().toISOString(),assessment:'OPERATOR_RECORDED_PERMISSION'}});
  await event(tx,a,'website.consent_recorded',asset.id,{siteId:site.id,private:true});return websiteMediaSummary(asset);
 }
 if(['revise_media','revoke_media','archive_media'].includes(action)){
  const row=await mediaRow(tx,a,i.id);if(row.data.kind!=='WEBSITE_DERIVATIVE'&&!(action==='revoke_media'&&row.data.kind==='WEBSITE_CONSENT'))fail('WEBSITE_DERIVATIVE_REQUIRED',400);
  if(action==='revise_media'){
   const metadata=mediaMetadata(i);if(!activeMedia(row,String(row.site_id)))fail('WEBSITE_MEDIA_NOT_APPROVED');
   const asset=await create(tx,a,'assets',{site_id:row.site_id,original_asset_id:row.original_asset_id,title:typeof i.title==='string'?text(i.title,200):row.title,status:'APPROVED',web_bytes:row.web_bytes,data:{...row.data,...metadata,priorAssetId:row.id,version:Number(row.data.version??1)+1}});
   await event(tx,a,'website.media_revision_created',asset.id,{previousAssetId:row.id,publicUsesUnchanged:true});return websiteMediaSummary(asset);
  }
  if(action==='archive_media'){
   const count=(await tx.query('select count(*)::int n from app.content_references where tenant_id=$1 and workspace_id=$2 and asset_id=$3',[a.tenantId,a.workspaceId,row.id])).rows[0].n;
   if(count)fail('WEBSITE_MEDIA_IN_USE');
  }
  const asset=await update(tx,a,'assets',row.id,{status:action==='revoke_media'?'REVOKED':'ARCHIVED',data:{...row.data,revocationReason:text(i.reason,2000),revokedBy:a.userId,revokedAt:new Date().toISOString()}});
  await event(tx,a,action==='revoke_media'?'website.media_revoked':'website.media_archived',row.id,{siteId:row.site_id,publicRequestsRevalidate:true});return websiteMediaSummary(asset);
 }
 return fail('WEBSITE_MEDIA_COMMAND_INVALID',400);
}

export async function readWebsitePreviewMedia(tx:Tx,a:Actor,id:unknown){
 const asset=await mediaRow(tx,a,id);if(asset.data.kind!=='WEBSITE_DERIVATIVE'||!asset.web_bytes||asset.status==='REVOKED'||asset.status==='ARCHIVED')fail('WEBSITE_MEDIA_NOT_FOUND',404);
 return {bytes:asset.web_bytes as Buffer,mimeType:'image/webp'};
}
