import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {create,event,fail,get,hash,text,type Actor,type Input,type Row,type Tx} from '../../kernel/src';

const folder=(a:Actor)=>resolve(process.env.TWELVESPEC_ROOT??process.cwd(),'.local','catalog-media',a.tenantId,a.workspaceId);
export async function saveCatalogImage(tx:Tx,a:Actor,input:Input){
 const product=await get(tx,a,'products',input.productId);
 if(product.status==='ARCHIVED')fail('ARCHIVED_PRODUCT_READ_ONLY');
 if(input.rightsConfirmed!==true)fail('CATALOG_IMAGE_RIGHTS_REVIEW_REQUIRED',400);
 if(typeof input.content!=='string'||input.content.length>7*1024*1024||!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(input.content))fail('CATALOG_IMAGE_INVALID',400);
 const bytes=Buffer.from(input.content.slice(input.content.indexOf(',')+1),'base64');
 if(!bytes.length||bytes.length>5*1024*1024)fail('CATALOG_IMAGE_TOO_LARGE',400);
 let derivative:Buffer;
 try{
  const image=sharp(bytes,{limitInputPixels:40000000,animated:false}),metadata=await image.metadata();
  if(!['png','jpeg','webp'].includes(String(metadata.format))||(metadata.pages??1)>1)fail('CATALOG_IMAGE_FORMAT_UNSUPPORTED',400);
  derivative=await image.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:90}).toBuffer();
 }catch{return fail('CATALOG_IMAGE_INVALID',400);}
 const digest=hash(derivative.toString('base64'));
 mkdirSync(folder(a),{recursive:true,mode:0o700});writeFileSync(resolve(folder(a),digest+'.webp'),derivative,{mode:0o600});
 const asset=await create(tx,a,'assets',{title:text(input.fileName??'Reviewed catalog photo',200),status:'PRIVATE_DRAFT',product_id:product.id,data:{kind:'CATALOG_DERIVATIVE',contentHash:digest,mimeType:'image/webp',bytes:derivative.length,rightsConfirmedBy:a.userId,rightsConfirmedAt:new Date().toISOString(),originalMetadataRemoved:true,synthetic:product.data.synthetic===true}});
 await event(tx,a,'catalog.image_staged',asset.id,{productId:product.id,publicationStatus:'PRIVATE_DRAFT'});
 return {id:asset.id,imagePath:`/api/catalog/images/${asset.id}`,publicationStatus:'PRIVATE_DRAFT'};
}

export async function readCatalogImage(tx:Tx,a:Actor,id:string){
 const asset=await get(tx,a,'assets',id);
 if(asset.data.kind!=='CATALOG_DERIVATIVE'||!asset.product_id)fail('NOT_FOUND',404);
 const product=await get(tx,a,'products',asset.product_id);
 if(product.status!=='PUBLISHED')fail('NOT_FOUND',404);
 const snapshot=product.data.publicSnapshot as Input|undefined,path=`/api/catalog/images/${asset.id}`;
 const wrapped=snapshot?.product&&typeof snapshot.product==='object'?snapshot.product as Input:snapshot??{};
 const variants=Array.isArray(snapshot?.variants)?snapshot.variants as Row[]:[];
 if(wrapped.image!==path&&!variants.some(v=>((v.data&&typeof v.data==='object'?v.data:v) as Input).image===path))fail('NOT_FOUND',404);
 const digest=String(asset.data.contentHash);if(!/^[a-f0-9]{64}$/.test(digest))fail('NOT_FOUND',404);
 try{return {bytes:readFileSync(resolve(folder(a),digest+'.webp')),mimeType:'image/webp'};}catch{return fail('CATALOG_IMAGE_STORAGE_UNAVAILABLE',503);}
}
