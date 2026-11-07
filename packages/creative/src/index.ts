import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { randomUUID } from 'node:crypto';
import sharp, { type OverlayOptions } from 'sharp';
import { type Actor,type Tx,type Input,type Row,authorize,create,get,list,update,event,idempotent,fail,text,number,hash } from '../../kernel/src/index';

const object = (v:unknown):v is Input=>typeof v==='object'&&v!==null&&!Array.isArray(v);
const ASSET_ROOT=()=>resolve(process.env.TWELVESPEC_ASSET_DIR??'.local/assets');
export const MAX_ASSET_BYTES=8*1024*1024;
export type DesignLayer={id:string;type:'text'|'image'|'shape';x:number;y:number;width:number;height:number;rotation:number;text?:string;fill?:string;assetId?:string};
export type Placement={xMm:number;yMm:number;widthMm:number;heightMm:number;location:string;bleedMm:number};
export type DesignDocument={layers:DesignLayer[];placement:Placement;physicalWidthMm:number;physicalHeightMm:number;method:string};

export function validateDesign(input:Input):DesignDocument {
 if(!Array.isArray(input.layers)||input.layers.length>100)fail('INVALID_LAYERS',400);
 const ids=new Set<string>();
 const layers=(input.layers as unknown[]).map((l):DesignLayer=>{
  if(!object(l)||!['text','image','shape'].includes(String(l.type)))return fail('INVALID_LAYER',400);
  const id=text(l.id,100);if(ids.has(id))fail('DUPLICATE_LAYER_ID',400);ids.add(id);
  const row:DesignLayer={id,type:l.type as DesignLayer['type'],x:number(l.x??0,0,1000),y:number(l.y??0,0,1000),width:number(l.width,1,1000),height:number(l.height,1,1000),rotation:number(l.rotation??0,-360,360)};
  if(row.x+row.width>1000||row.y+row.height>1000)fail('LAYER_OUTSIDE_CANVAS');
  if(row.type==='text'){row.text=text(l.text,2000);if(l.fill!==undefined){if(typeof l.fill!=='string'||!/^#[0-9a-f]{6}$/i.test(l.fill))fail('INVALID_LAYER_COLOR',400);row.fill=l.fill as string;}}
  if(row.type==='image')row.assetId=text(l.assetId,100);
  if(row.type==='shape'){if(typeof l.fill!=='string'||!/^#[0-9a-f]{6}$/i.test(l.fill))fail('INVALID_LAYER_COLOR',400);row.fill=l.fill as string;}
  return row;
 });
 if(!object(input.placement))fail('PLACEMENT_REQUIRED',400);
 const p=input.placement as Input;
 const placement:Placement={xMm:number(p.xMm??0,0,10000),yMm:number(p.yMm??0,0,10000),widthMm:number(p.widthMm,1,10000),heightMm:number(p.heightMm,1,10000),location:text(p.location,100),bleedMm:number(p.bleedMm??0,0,100)};
 const physicalWidthMm=number(input.physicalWidthMm,1,10000),physicalHeightMm=number(input.physicalHeightMm,1,10000);
 if(placement.xMm+placement.widthMm>physicalWidthMm||placement.yMm+placement.heightMm>physicalHeightMm)fail('PLACEMENT_OUTSIDE_PRINT_AREA');
 return {layers,placement,physicalWidthMm,physicalHeightMm,method:text(input.method,100)};
}

export function sniffAsset(bytes:Buffer,claimed:string):{mimeType:string;extension:string} {
 if(!bytes.length||bytes.length>MAX_ASSET_BYTES)fail('ASSET_SIZE_LIMIT',400);
 const header=bytes.subarray(0,16);
 let actual:string|undefined,extension='';
 if(header.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){actual='image/png';extension='png';}
 else if(header[0]===255&&header[1]===216&&header[2]===255){actual='image/jpeg';extension='jpg';}
 else if(header.toString('ascii',0,4)==='RIFF'&&header.toString('ascii',8,12)==='WEBP'){actual='image/webp';extension='webp';}
 else if(header.toString('ascii',0,5)==='%PDF-'){actual='application/pdf';extension='pdf';}
 if(!actual||actual!==claimed)fail('UNSUPPORTED_OR_MISMATCHED_ASSET_TYPE',400);
 return {mimeType:actual!,extension};
}
function owned(a:Actor,row:Row){if(a.role==='customer'&&row.owner_id!==a.userId)fail('NOT_FOUND',404);}
function assetPath(objectKey:unknown){
 const key=text(objectKey,500);if(!/^[a-f0-9-]+\/[a-f0-9-]+\/[a-f0-9-]+\.(original|preview\.png)$/i.test(key))fail('INVALID_OBJECT_REFERENCE',400);
 const p=resolve(ASSET_ROOT(),key);if(!p.startsWith(ASSET_ROOT()+'/'))fail('INVALID_OBJECT_REFERENCE',400);return p;
}
export function publicAsset(row:Row){return {id:row.id,title:row.title,status:row.status,data:{mimeType:row.data.mimeType,widthPx:row.data.widthPx??null,heightPx:row.data.heightPx??null,rightsConfirmed:row.data.rightsConfirmed,scanStatus:row.data.scanStatus,contentHash:row.data.contentHash,private:true}};}
export async function readPrivateAsset(tx:Tx,a:Actor,id:unknown,original=false):Promise<{bytes:Buffer;mimeType:string;fileName:string}> {
 authorize(a,'creative','read');const row=await get(tx,a,'assets',id);owned(a,row);
 if(original&&a.role==='customer')fail('ORIGINAL_DOWNLOAD_REQUIRES_STAFF_REVIEW',403);
 const previewKey=row.data.previewObjectKey;
 if(!previewKey&&!original)fail('SAFE_PREVIEW_NOT_AVAILABLE',409);
 const bytes=await readFile(assetPath(original?row.data.objectKey:previewKey));
 return {bytes,mimeType:original?String(row.data.mimeType):'image/png',fileName:row.title};
}

export type PreflightResult={ready:false;productionReadiness:'BLOCKED';assessment:'PRELIMINARY_NOT_ROUTE_VALIDATED';checks:{code:string;passed:boolean;state:'PASS'|'FAIL'|'UNVERIFIED';detail:string}[];errors:string[];effectiveDpi:number|null;requirements:{minimumDpi:null;bleedMm:null;source:'NO_VERIFIED_PROVIDER_PROFILE'};method:string;previewOnly:true};
export function preflightDesign(document:DesignDocument,assets:Input[]):PreflightResult {
 const checks:PreflightResult['checks']=[],method=document.method.toLowerCase();
 let effectiveDpi:number|null=null;
 const add=(code:string,passed:boolean|null,detail:string)=>checks.push({code,passed:passed===true,state:passed===null?'UNVERIFIED':passed?'PASS':'FAIL',detail});
 add('PHYSICAL_SIZE',document.physicalWidthMm>0&&document.physicalHeightMm>0,'Design canvas dimensions recorded in millimetres; this is not verified supplier imprint geometry.');
 add('METHOD_PROFILE_VERIFIED',null,'The exact supplier, variant, material, location and effective production profile have not been verified.');
 add('IMPRINT_GEOMETRY_VERIFIED',null,'A design canvas or suggested preset does not establish the approved physical print area.');
 add('LAYERS_PRESENT',document.layers.length>0,'At least one design layer is required.');
 const imageLayers=document.layers.filter(l=>l.type==='image');
 for(const layer of imageLayers){
  const asset=assets.find(v=>v.id===layer.assetId);
  if(!asset){add('ASSET_MISSING',false,`Image layer ${layer.id} has no authorized asset.`);continue;}
  const widthInches=(layer.width/1000*document.placement.widthMm)/25.4;
  const heightInches=(layer.height/1000*document.placement.heightMm)/25.4;
  const widthPx=Number(asset.widthPx),heightPx=Number(asset.heightPx);
  const dimensionsKnown=Number.isFinite(widthPx)&&widthPx>0&&Number.isFinite(heightPx)&&heightPx>0;
  if(dimensionsKnown){
   const dpi=Math.min(widthPx/widthInches,heightPx/heightInches);
   effectiveDpi=effectiveDpi===null?dpi:Math.min(effectiveDpi,dpi);
   add('EFFECTIVE_DPI',null,`Layer ${layer.id}: ${Math.round(dpi)} DPI measured at the declared design placement. The required resolution is unverified for the exact provider, method and material.`);
  }else add('EFFECTIVE_DPI',null,`Layer ${layer.id}: reliable raster dimensions are unavailable; no effective resolution or production threshold can be established.`);
  add('ASSET_RIGHTS',asset.rightsConfirmed===true,'Recorded uploader usage assertion; production licensing review is separate.');
  add('MALWARE_SCAN',asset.scanStatus==='CLEAN','Production requires an independent malware scan.');
  add('COLOR_PROFILE_VERIFIED',null,'Actual production color profile and spot identifiers require independent validation.');
  add('TRANSPARENCY_OVERPRINT',null,'Transparency flattening and overprint behavior require the approved method-specific output profile.');
 }
 if(document.layers.some(l=>l.type==='text'))add('FONT_EMBEDDING',null,'Preview text has no verified embedded or outlined production font.');
 if(method.includes('cut')||method.includes('decal'))add('CUT_CONTOUR',null,'No verified cut contour or tooling specification is attached.');
 if(method.includes('embroid'))add('DIGITIZATION',null,'Approved method-specific stitch file/digitization evidence is absent.');
 add('BLEED',null,`The design declares ${document.placement.bleedMm} mm bleed. The required bleed or an explicit not-applicable determination needs the exact provider profile; zero and unknown are distinct.`);
 add('LICENSE_REVIEW',null,'An authorized operator must verify product, artwork and font licenses.');
 add('PRODUCTION_EXPERT_VALIDATION',null,'No independent production validation service is configured. Visual approval alone cannot release artwork.');
 return {ready:false,productionReadiness:'BLOCKED',assessment:'PRELIMINARY_NOT_ROUTE_VALIDATED',checks,errors:[...new Set(checks.filter(c=>!c.passed).map(c=>c.code))],effectiveDpi,requirements:{minimumDpi:null,bleedMm:null,source:'NO_VERIFIED_PROVIDER_PROFILE'},method:document.method,previewOnly:true};
}

async function currentVersion(tx:Tx,a:Actor,project:Row):Promise<Row>{owned(a,project);if(!project.data.currentVersionId)fail('DESIGN_VERSION_REQUIRED');return get(tx,a,'design_versions',project.data.currentVersionId);}

export async function handleCreative(tx:Tx,a:Actor,action:string,input:Input):Promise<unknown> {
 const customerAction:Record<string,string>={create_brand_kit:'create',render_mockup:'create',request_changes:'approve_proof',run_preflight:'read'};
 authorize(a,'creative',a.role==='customer'?(customerAction[action]??action):action);
 if(action==='create'){
  if(input.variantId&&!input.productId)fail('VARIANT_REQUIRES_PRODUCT',400);
  if(input.productId){const p=await get(tx,a,'products',input.productId);if(input.variantId){const v=await get(tx,a,'variants',input.variantId);if((v.product_id??v.data.productId)!==p.id)fail('VARIANT_PRODUCT_MISMATCH');}}
  const row=await create(tx,a,'design_projects',{title:text(input.title),status:'EDITABLE',...(input.productId?{product_id:input.productId}:{}),...(input.variantId?{variant_id:input.variantId}:{}),data:{productId:input.productId??null,variantId:input.variantId??null,currentVersionId:null,versionHash:null,productionReadiness:'BLOCKED',previewOnly:true}});await event(tx,a,'creative.project_created',row.id);return row;
 }
 if(action==='upload_asset'){
  const project=input.projectId?await get(tx,a,'design_projects',input.projectId):undefined;if(project)owned(a,project);
  if(input.rightsConfirmed!==true)fail('USAGE_RIGHTS_ASSERTION_REQUIRED',400);
  const fileName=text(input.fileName,200);if(/[\\/\u0000]/.test(fileName))fail('INVALID_FILE_NAME',400);
  if(typeof input.base64!=='string'||input.base64.length>MAX_ASSET_BYTES*1.4||!/^[A-Za-z0-9+/]*={0,2}$/.test(input.base64))fail('INVALID_ASSET_ENCODING',400);
  const bytes=Buffer.from(input.base64 as string,'base64');const sniffed=sniffAsset(bytes,text(input.mimeType,100));
  const assetId=randomUUID(),prefix=`${a.tenantId}/${a.workspaceId}/${assetId}`,key=`${prefix}.original`;
  const path=assetPath(key);await mkdir(dirname(path),{recursive:true,mode:0o700});await writeFile(path,bytes,{flag:'wx',mode:0o600});
  const data:Input={objectKey:key,mimeType:sniffed.mimeType,bytes:bytes.length,contentHash:hash(bytes.toString('base64')),rightsConfirmed:true,scanStatus:'NOT_CONFIGURED',private:true,productionReadiness:'BLOCKED'};
  if(sniffed.mimeType.startsWith('image/')){
   try {const image=sharp(bytes,{limitInputPixels:40000000,animated:false}),metadata=await image.metadata();data.widthPx=metadata.width??null;data.heightPx=metadata.height??null;data.sourceColorSpace=metadata.space??'UNKNOWN';data.hasEmbeddedProfile=Boolean(metadata.hasProfile);data.hasAlpha=Boolean(metadata.hasAlpha);const preview=await image.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).png().toBuffer();const previewKey=`${prefix}.preview.png`;await writeFile(assetPath(previewKey),preview,{flag:'wx',mode:0o600});data.previewObjectKey=previewKey;}catch{fail('INVALID_OR_OVERSIZED_IMAGE',400);}
  }
  const row=await create(tx,a,'assets',{title:fileName,status:'QUARANTINED',...(project?{owner_id:project.owner_id,project_id:project.id}:{}),data:{...data,uploadedBy:a.userId}});await event(tx,a,'creative.asset_uploaded',row.id,{mimeType:sniffed.mimeType,bytes:bytes.length,contentHash:data.contentHash});return publicAsset(row);
 }
 if(action==='save_design_version'){
  const project=await get(tx,a,'design_projects',input.id,true);owned(a,project);const document=validateDesign(input);
  for(const layer of document.layers)if(layer.type==='image'){const asset=await get(tx,a,'assets',layer.assetId);owned(a,asset);if(!asset.data.previewObjectKey)fail('SAFE_PREVIEW_NOT_AVAILABLE');}
  if(project.data.productId){
   const product=await get(tx,a,'products',project.data.productId);const methods=product.data.methods??product.data.decorationMethods;if(Array.isArray(methods)&&!methods.includes(document.method))fail('INCOMPATIBLE_METHOD');
   const locations=product.data.locations;if(Array.isArray(locations)&&!locations.includes(document.placement.location))fail('INCOMPATIBLE_LOCATION');
  }
  const specification={productId:project.data.productId,variantId:project.data.variantId,method:document.method,placement:document.placement,physicalWidthMm:document.physicalWidthMm,physicalHeightMm:document.physicalHeightMm};
  const versionHash=hash(document),specificationHash=hash(specification),versionNumber=Number(project.data.versionNumber??0)+1;
  const version=await create(tx,a,'design_versions',{owner_id:project.owner_id,title:`${project.title} · version ${versionNumber}`,project_id:project.id,status:'IMMUTABLE',data:{...document,projectId:project.id,versionNumber,versionHash,specificationHash,previousVersionId:project.data.currentVersionId??null,createdBy:a.userId}});
  const proofs=await list(tx,a,'proofs',1000);
  for(const proof of proofs)if(proof.data.projectId===project.id&&['APPROVED','PROOF_PENDING'].includes(proof.status))await update(tx,a,'proofs',proof.id,{status:'SUPERSEDED',data:{...proof.data,invalidatedByVersionId:version.id,invalidatedByVersionHash:versionHash}});
  await update(tx,a,'design_projects',project.id,{status:'EDITABLE',data:{...project.data,currentVersionId:version.id,versionHash,specificationHash,versionNumber,productionReadiness:'BLOCKED',approvedProofId:null}});
  await event(tx,a,'creative.design_version_saved',project.id,{versionId:version.id,versionHash,specificationHash});return version;
 }
 if(action==='request_proof'){
  const project=await get(tx,a,'design_projects',input.id,true),version=await currentVersion(tx,a,project);
  const existing=(await list(tx,a,'proofs',1000)).find(p=>p.data.projectId===project.id&&p.data.versionHash===version.data.versionHash&&p.status==='PROOF_PENDING');if(existing)return existing;
  const proof=await create(tx,a,'proofs',{owner_id:project.owner_id,title:`${project.title} · proof`,project_id:project.id,version_id:version.id,status:'PROOF_PENDING',data:{projectId:project.id,versionId:version.id,versionHash:version.data.versionHash,specificationHash:version.data.specificationHash,previewOnly:true,productionReadiness:'BLOCKED',disclaimer:'Visual proof only. Production release requires independent method-specific validation.'}});
  await update(tx,a,'design_projects',project.id,{status:'PROOF_PENDING'});await event(tx,a,'creative.proof_requested',proof.id,{projectId:project.id,versionHash:version.data.versionHash});return proof;
 }
 if(action==='approve_proof'){
  const proof=await get(tx,a,'proofs',input.id,true);owned(a,proof);if(proof.status!=='PROOF_PENDING')fail('INVALID_TRANSITION');
  const project=await get(tx,a,'design_projects',proof.data.projectId,true),version=await currentVersion(tx,a,project);
  if(input.versionHash!==proof.data.versionHash||input.specificationHash!==proof.data.specificationHash||version.data.versionHash!==proof.data.versionHash||project.data.currentVersionId!==proof.data.versionId)fail('PROOF_VERSION_MISMATCH');
  const approval=await create(tx,a,'approvals',{owner_id:project.owner_id,title:`Visual proof approval · ${project.title}`,project_id:project.id,version_id:version.id,status:'APPROVED',data:{kind:'VISUAL_PROOF',proofId:proof.id,projectId:project.id,versionHash:proof.data.versionHash,specificationHash:proof.data.specificationHash,approvedBy:a.userId,approvedAt:new Date().toISOString(),productionRelease:false}});
  const saved=await update(tx,a,'proofs',proof.id,{status:'APPROVED',data:{...proof.data,approvalId:approval.id,approvedBy:a.userId}});
  await update(tx,a,'design_projects',project.id,{status:'APPROVED',data:{...project.data,approvedProofId:proof.id,productionReadiness:'BLOCKED'}});await event(tx,a,'creative.proof_approved',proof.id,{versionHash:proof.data.versionHash,approvalId:approval.id});return saved;
 }
 if(action==='request_changes'){
  const proof=await get(tx,a,'proofs',input.id,true);owned(a,proof);if(proof.status!=='PROOF_PENDING')fail('INVALID_TRANSITION');const reason=text(input.reason,2000);
  const saved=await update(tx,a,'proofs',proof.id,{status:'CHANGES_REQUESTED',data:{...proof.data,changeReason:reason}});await update(tx,a,'design_projects',proof.data.projectId,{status:'CHANGES_REQUESTED'});await event(tx,a,'creative.proof_changes_requested',proof.id,{reason});return saved;
 }
 if(action==='run_preflight'){
  const project=await get(tx,a,'design_projects',input.id,true),version=await currentVersion(tx,a,project),document=validateDesign(version.data);
  const assets:Input[]=[];for(const layer of document.layers)if(layer.type==='image'){const asset=await get(tx,a,'assets',layer.assetId);assets.push({id:asset.id,...asset.data});}
  const result=preflightDesign(document,assets);
  const record=await create(tx,a,'preflight_results',{owner_id:project.owner_id,title:`${project.title} · preflight`,project_id:project.id,version_id:version.id,status:'BLOCKED',data:{...result,versionHash:version.data.versionHash,specificationHash:version.data.specificationHash}});
  await update(tx,a,'design_projects',project.id,{data:{...project.data,preflightId:record.id,productionReadiness:'BLOCKED'}});await event(tx,a,'creative.preflight_completed',record.id,{projectId:project.id,errors:result.errors});return record;
 }
 if(action==='render_mockup'){
  const project=await get(tx,a,'design_projects',input.id,true),version=await currentVersion(tx,a,project);
  const productIds=Array.isArray(input.productIds)?input.productIds:project.data.productId?[project.data.productId]:[];
  if(!productIds.length||productIds.length>500)fail('INVALID_BATCH_SIZE',400);
  return idempotent(tx,a,'creative.batch_mockup',input.idempotencyKey,{projectId:project.id,versionId:version.id,productIds},async()=>{
   const jobs:Row[]=[];const rejected:Input[]=[];const variants=await list(tx,a,'variants',1000);
   const requestedVariantIds=Array.isArray(input.variantIds)?new Set(input.variantIds):undefined;
   for(const productId of productIds){const product=await get(tx,a,'products',productId);const methods=product.data.methods??product.data.decorationMethods;const locations=product.data.locations;
    if((Array.isArray(methods)&&!methods.includes(version.data.method))||(Array.isArray(locations)&&object(version.data.placement)&&!locations.includes(version.data.placement.location))){rejected.push({productId:product.id,reason:'INCOMPATIBLE_PRESET'});continue;}
    const variant=variants.find(v=>(v.product_id??v.data.productId)===product.id&&(requestedVariantIds?requestedVariantIds.has(v.id):(project.data.productId===product.id?(!project.data.variantId||v.id===project.data.variantId):true)));
    if(!variant){rejected.push({productId:product.id,reason:'MISSING_EXACT_VARIANT'});continue;}
    const row=await create(tx,a,'render_jobs',{owner_id:project.owner_id,title:`${product.title} · synthetic mockup`,project_id:project.id,version_id:version.id,product_id:product.id,variant_id:variant.id,status:'PENDING',data:{projectId:project.id,versionId:version.id,versionHash:version.data.versionHash,productId:product.id,variantId:variant.id,variantColor:variant.data.color??null,kind:'MOCKUP',verification:'MOCKED',previewOnly:true,disclaimer:'Synthetic 2D preview; no production fidelity guarantee.'}});jobs.push(row);
   }
   await event(tx,a,'creative.batch_mockup_queued',project.id,{count:jobs.length,rejected:rejected.length,versionHash:version.data.versionHash});return {jobs,rejected,verification:'MOCKED'};
  });
 }
 if(action==='create_brand_kit'){
  if(!Array.isArray(input.colors)||input.colors.length>30||!input.colors.every(c=>typeof c==='string'&&/^#[0-9a-f]{6}$/i.test(c)))fail('INVALID_BRAND_COLORS',400);
  const assetIds=Array.isArray(input.assetIds)?input.assetIds:[];if(assetIds.length>100)fail('TOO_MANY_ASSETS',400);for(const id of assetIds){const asset=await get(tx,a,'assets',id);owned(a,asset);}
  const row=await create(tx,a,'brand_kits',{title:text(input.title),data:{colors:input.colors,assetIds,colorDisclaimer:'Hex preview colors are not validated Pantone or print matches.'}});await event(tx,a,'creative.brand_kit_created',row.id);return row;
 }
 if(action==='release_production_asset')return fail('PRODUCTION_VALIDATION_NOT_CONFIGURED',403);
 if(action==='read')return {projects:await list(tx,a,'design_projects'),proofs:await list(tx,a,'proofs'),assets:(await list(tx,a,'assets')).map(publicAsset)};
 return fail('UNSUPPORTED_ACTION',400);
}

const xmlEscape=(value:string)=>value.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
/** Called by the trusted worker in a scoped transaction. Output is a synthetic raster mockup, never production artwork. */
export async function processMockupJob(tx:Tx,a:Actor,id:string):Promise<Row> {
 if(a.role==='customer')fail('PERMISSION_DENIED',403);
 const job=await get(tx,a,'render_jobs',id,true);
 if(job.status==='COMPLETE')return job;
 if(!['PENDING','RETRY'].includes(job.status))fail('INVALID_RENDER_STATE');
 const version=await get(tx,a,'design_versions',job.data.versionId),product=await get(tx,a,'products',job.data.productId),variant=await get(tx,a,'variants',job.data.variantId);
 if((variant.product_id??variant.data.productId)!==product.id||version.data.versionHash!==job.data.versionHash)fail('RENDER_SNAPSHOT_MISMATCH');
 const document=validateDesign(version.data);
 const swatch=String(variant.data.hex??variant.data.colorHex??'#d5dce8');const color=/^#[0-9a-f]{6}$/i.test(swatch)?swatch:'#d5dce8';
 const overlays:OverlayOptions[]=[];
 const background=`<svg width="1000" height="1000" xmlns="http://www.w3.org/2000/svg"><rect width="1000" height="1000" fill="#f1f3f6"/><rect x="140" y="100" rx="70" width="720" height="760" fill="${color}" stroke="#556277" stroke-width="4"/><text x="500" y="940" text-anchor="middle" font-family="sans-serif" font-size="24" fill="#334155">SYNTHETIC MOCKUP · NOT PRODUCTION ARTWORK</text></svg>`;
 for(const layer of document.layers){
  const zoneWidth=document.placement.widthMm/document.physicalWidthMm*500,zoneHeight=document.placement.heightMm/document.physicalHeightMm*500;
  const width=Math.max(1,Math.round(layer.width/1000*zoneWidth)),height=Math.max(1,Math.round(layer.height/1000*zoneHeight));
  const left=250+Math.round(document.placement.xMm/document.physicalWidthMm*500+layer.x/1000*zoneWidth),top=250+Math.round(document.placement.yMm/document.physicalHeightMm*500+layer.y/1000*zoneHeight);
  if(layer.type==='image'){
   const asset=await get(tx,a,'assets',layer.assetId);if(!asset.data.previewObjectKey)fail('SAFE_PREVIEW_NOT_AVAILABLE');
   const bytes=await readFile(assetPath(asset.data.previewObjectKey));const raster=await sharp(bytes).resize(width,height,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).rotate(layer.rotation,{background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();overlays.push({input:raster,left,top});
  } else {
   const fill=layer.fill??'#1e293b';const svg=layer.type==='shape'?`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${fill}"/></svg>`:`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="${Math.min(72,Math.max(12,height*0.65))}" fill="${fill}">${xmlEscape(layer.text??'')}</text></svg>`;
   const raster=await sharp(Buffer.from(svg)).rotate(layer.rotation,{background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();overlays.push({input:raster,left,top});
  }
 }
 const bytes=await sharp(Buffer.from(background)).composite(overlays).png().toBuffer();
 const prefix=`${a.tenantId}/${a.workspaceId}/${randomUUID()}`,previewKey=`${prefix}.preview.png`,originalKey=`${prefix}.original`;
 await mkdir(dirname(assetPath(previewKey)),{recursive:true,mode:0o700});await writeFile(assetPath(previewKey),bytes,{flag:'wx',mode:0o600});await writeFile(assetPath(originalKey),bytes,{flag:'wx',mode:0o600});
 const asset=await create(tx,a,'assets',{title:`${product.title} · ${String(variant.data.color??variant.title)} · mockup`,product_id:product.id,variant_id:variant.id,project_id:job.data.projectId,version_id:version.id,owner_id:job.owner_id,status:'PREVIEW',data:{objectKey:originalKey,previewObjectKey:previewKey,mimeType:'image/png',widthPx:1000,heightPx:1000,contentHash:hash(bytes.toString('base64')),scanStatus:'GENERATED_SAFE_RASTER',rightsConfirmed:true,kind:'MOCKUP',verification:'MOCKED',private:true,productId:product.id,variantId:variant.id,versionId:version.id,versionHash:version.data.versionHash,previewOnly:true,productionReadiness:'BLOCKED'}});
 const completed=await update(tx,a,'render_jobs',job.id,{status:'COMPLETE',data:{...job.data,assetId:asset.id,completedAt:new Date().toISOString(),verification:'MOCKED'}});await event(tx,a,'creative.mockup_rendered',job.id,{assetId:asset.id,variantId:variant.id,versionHash:version.data.versionHash});return completed;
}
