import {DomainError,DEMO,fail,transaction,type Input} from '../../kernel/src';
import {currentActor} from './auth';
import {errorResponse,originCheck} from './index';
import {draftWebsitePreview,handleWebsite,websiteWorkspace} from '../../marketing/src/website';
import {readWebsitePreviewMedia} from '../../marketing/src/website/media';
import {publicCatalogPage,readPublishedWebsite,withWebsiteReader,type WebsiteIdentity} from '../../marketing/src/website/repository';

export const privateWebsiteHeaders={'Cache-Control':'private, no-store','Vary':'Cookie, x-workspace-id','X-Robots-Tag':'noindex, nofollow'};
export async function websiteIdentity(headers:Headers):Promise<WebsiteIdentity>{
 try{const {actor}=await currentActor(headers);return {tenantId:actor.tenantId,workspaceId:actor.workspaceId,userId:actor.userId};}
 catch(e){if(!(e instanceof DomainError)||e.status!==401)throw e;return {tenantId:DEMO.tenant,workspaceId:DEMO.workspace};}
}
export async function websiteGET(req:Request){
 try{
  const {actor}=await currentActor(req.headers),query=new URL(req.url).searchParams;
  const input=Object.fromEntries(query.entries());const view=query.get('view')??'workspace';
  const result=await transaction(actor,tx=>view==='document'?handleWebsite(tx,actor,'get_document',input):view==='catalog'?handleWebsite(tx,actor,'catalog_picker',input):websiteWorkspace(tx,actor,input));
  return Response.json(result,{headers:privateWebsiteHeaders});
 }catch(e){return errorResponse(e);}
}
export async function websitePOST(req:Request){
 try{
  originCheck(req);if(Number(req.headers.get('content-length')??0)>14*1024*1024)fail('REQUEST_TOO_LARGE',413);
  const {actor}=await currentActor(req.headers);if(actor.role==='customer'||actor.role==='staff')fail('WEBSITE_PERMISSION_REQUIRED',403);
  const raw=await req.text();if(Buffer.byteLength(raw)>14*1024*1024)fail('REQUEST_TOO_LARGE',413);
  let body:unknown;try{body=JSON.parse(raw);}catch{return fail('INVALID_JSON',400);}
  if(!body||typeof body!=='object'||Array.isArray(body))fail('INVALID_COMMAND',400);const command=body as Input;
  if(typeof command.action!=='string'||command.action.length>80||!command.input||typeof command.input!=='object'||Array.isArray(command.input))fail('INVALID_COMMAND',400);
  const result=await transaction(actor,tx=>handleWebsite(tx,actor,String(command.action),command.input as Input));return Response.json({result},{headers:privateWebsiteHeaders});
 }catch(e){return errorResponse(e);}
}
export async function publicWebsiteGET(req:Request){
 try{const query=new URL(req.url).searchParams,path=query.get('path')??'/';if(path.length>240)fail('WEBSITE_PATH_INVALID',400);const identity=await websiteIdentity(req.headers);const result=await readPublishedWebsite(identity,path,query.get('storeId')??undefined);return Response.json({website:result},{headers:privateWebsiteHeaders});}catch(e){return errorResponse(e);}
}
export async function publicCatalogGET(req:Request){
 try{const identity=await websiteIdentity(req.headers),input=Object.fromEntries(new URL(req.url).searchParams.entries());return Response.json(await withWebsiteReader(identity,tx=>publicCatalogPage(tx,identity,input)),{headers:{'Cache-Control':'no-store','Vary':'Cookie, x-workspace-id'}});}catch(e){return errorResponse(e);}
}
export async function websiteMediaGET(req:Request,id:string){
 try{
  if(!/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id))fail('WEBSITE_MEDIA_NOT_FOUND',404);
  let bytes:Buffer;
  if(new URL(req.url).searchParams.get('preview')==='1'){
   const {actor}=await currentActor(req.headers);bytes=(await transaction(actor,tx=>readWebsitePreviewMedia(tx,actor,id))).bytes;
  }else{
   const identity=await websiteIdentity(req.headers);bytes=await withWebsiteReader(identity,async tx=>{
    const row=(await tx.query("select id,web_bytes from app.assets where id=$1 and data->>'kind'='WEBSITE_DERIVATIVE' and status='APPROVED'",[id])).rows[0];if(!row?.web_bytes)fail('WEBSITE_MEDIA_NOT_FOUND',404);return row.web_bytes as Buffer;
   });
  }
  return new Response(new Uint8Array(bytes),{headers:{...privateWebsiteHeaders,'Content-Type':'image/webp','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; sandbox"}});
 }catch(e){return errorResponse(e);}
}
export async function websitePreviewForRender(headers:Headers,siteId:string,revisionId:string){const {actor}=await currentActor(headers);return transaction(actor,tx=>draftWebsitePreview(tx,actor,siteId,revisionId));}
