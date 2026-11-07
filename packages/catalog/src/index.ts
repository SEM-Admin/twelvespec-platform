import { authorize,create,event,fail,get,hash,idempotent,list,number,text,update,type Actor,type Tx,type Input,type Row } from '../../kernel/src/index';
import {saveCatalogImage} from './media';
import { catalogSourceLibrary,createSourceDraft,stageCatalogSources,stageCatalogSourceFile } from './sources';
import { exportCSV } from '../../supplier/src/imports';
const object=(v:unknown):Input=>v&&typeof v==='object'&&!Array.isArray(v)?v as Input:{};
const categories=['APPAREL','PROMO','PRINT','SIGNAGE','EVENT','PACKAGING','KIT','CUSTOM_MANUFACTURED','SERVICE'];
const methods=['screen_print','embroidery','digital','sublimation','laser','offset','heat_transfer','none'];
const safeImage=(v:unknown):string|null=>typeof v==='string'&&/^\/(?!\/)[A-Za-z0-9_/?=&%+.\-]+$/.test(v)&&!v.includes('..')?v:null;
export function publicProduct(product:Row,variants:Row[]=[]):Input {
 const current=product.data;const snapshot=object(current.publicSnapshot);const wrapped=object(snapshot.product);const data=Object.keys(snapshot).length?(Object.keys(wrapped).length?wrapped:snapshot):current;
 const source=Array.isArray(snapshot.variants)?snapshot.variants as Row[]:variants.filter(v=>v.product_id===product.id&&v.status!=='ARCHIVED');
 return {id:product.id,catalogRevision:Number(snapshot.catalogRevision??snapshot.revision??current.publishedRevision??product.revision),title:String(snapshot.title??product.title),name:String(snapshot.title??product.title),sku:String(data.sku??''),category:String(data.category??'PROMO'),brand:String(data.brand??''),description:String(data.description??''),minimumQuantity:Number(data.minimumQuantity??1),methods:Array.isArray(data.methods)?data.methods.filter(v=>methods.includes(String(v))):[],locations:Array.isArray(data.locations)?data.locations.filter(v=>typeof v==='string'&&['front','back','left_chest','right_chest','side','full_bleed'].includes(v)):[],leadTimeDays:data.leadTimeDays===undefined||data.leadTimeDays===null?null:Number(data.leadTimeDays),image:safeImage(data.image),variants:source.map(row=>{const nested=object(row.data);const v=Object.keys(nested).length?nested:row as unknown as Input;return {id:row.id,color:String(v.color??'Unspecified'),hex:typeof v.hex==='string'&&/^#[a-fA-F0-9]{6}$/.test(v.hex)?v.hex:'#64748b',size:String(v.size??'One size'),image:safeImage(v.image)||safeImage(data.image),availability:'REQUEST_QUOTE'};}),readiness:'REQUEST_QUOTE_ONLY',price:null,synthetic:current.synthetic===true};
}
function validateProductData(input:Input,existing:Input={}):Input {
 const next={...existing};const allowed=['sku','brand','description','category','minimumQuantity','methods','locations','image','licenseApproved','leadTimeDays'];
 for(const key of Object.keys(input)){if(!allowed.includes(key))fail('PRODUCT_FIELD_NOT_EDITABLE',400);}
 for(const field of ['sku','brand','description'] as const)if(input[field]!==undefined){if(typeof input[field]!=='string'||String(input[field]).length>(field==='description'?10000:200))fail('PRODUCT_TEXT_INVALID',400);next[field]=String(input[field]);}
 if(input.category!==undefined){if(input.category!==null&&!categories.includes(String(input.category)))fail('PRODUCT_CATEGORY_INVALID',400);next.category=input.category;}
 if(input.minimumQuantity===null){next.minimumQuantity=null;delete next.moq;}else if(input.minimumQuantity!==undefined){const q=number(input.minimumQuantity,1,1e7);if(!Number.isInteger(q))fail('MOQ_INVALID',400);next.minimumQuantity=q;next.moq=q;}
 if(input.leadTimeDays!==undefined)next.leadTimeDays=input.leadTimeDays===null?null:number(input.leadTimeDays,0,365);
 if(input.methods!==undefined){if(!Array.isArray(input.methods)||input.methods.some(v=>!methods.includes(String(v))))fail('DECORATION_METHOD_INVALID',400);next.methods=input.methods;}
 if(input.locations!==undefined){if(!Array.isArray(input.locations)||input.locations.some(v=>!['front','back','left_chest','right_chest','side','full_bleed'].includes(String(v))))fail('IMPRINT_LOCATION_INVALID',400);next.locations=input.locations;}
 if(input.image!==undefined){if(input.image!==null&&!safeImage(input.image))fail('PUBLIC_IMAGE_REQUIRES_APPROVED_LOCAL_DERIVATIVE',400);next.image=input.image;}
 if(input.licenseApproved!==undefined){if(typeof input.licenseApproved!=='boolean')fail('LICENSE_ASSERTION_INVALID',400);next.licenseApproved=input.licenseApproved;}
 return next;
}
function productInput(input:Input){const {id:_,title:__,name:___,variants:____,idempotencyKey:_____,...data}=input;return validateProductData(data);}
const ids=(input:Input):string[]=>{const values=Array.isArray(input.ids)?input.ids:input.id?[input.id]:[];if(!values.length||values.length>500||new Set(values).size!==values.length)fail('PRODUCT_SELECTION_INVALID',400);return values.map(v=>text(v));};
async function variantsFor(tx:Tx,a:Actor,productId:string):Promise<Row[]>{return(await tx.query('select * from app.variants where tenant_id=$1 and workspace_id=$2 and product_id=$3 and status<>\'ARCHIVED\' order by id',[a.tenantId,a.workspaceId,productId])).rows;}
export function publishIssues(product:Row,variants:Row[]):string[]{const data=product.data;const errors:string[]=[];if(!product.title)errors.push('TITLE_REQUIRED');if(!data.category||!categories.includes(String(data.category)))errors.push('CATEGORY_REQUIRED');if(!Number.isInteger(Number(data.minimumQuantity))||Number(data.minimumQuantity)<1)errors.push('MOQ_REQUIRED');if(data.licenseApproved!==true&&data.synthetic!==true)errors.push('ASSET_LICENSE_APPROVAL_REQUIRED');if(!safeImage(data.image))errors.push('APPROVED_LOCAL_IMAGE_REQUIRED');if(!variants.length)errors.push('VARIANTS_REQUIRED');if(!Array.isArray(data.methods)||!data.methods.length)errors.push('CONFIGURATION_METHODS_REQUIRED');if(!Array.isArray(data.locations)||!data.locations.length)errors.push('CONFIGURATION_LOCATIONS_REQUIRED');
 const combinations=new Set<string>();for(const v of variants){const key=`${v.data.color}/${v.data.size}`;if(combinations.has(key))errors.push('DUPLICATE_VARIANT');combinations.add(key);if(!safeImage(v.data.image)&&!safeImage(data.image))errors.push('VARIANT_IMAGE_REQUIRED');if(typeof v.data.hex!=='string'||!/^#[a-fA-F0-9]{6}$/.test(v.data.hex))errors.push('VARIANT_SWATCH_INVALID');}return [...new Set(errors)];}
export function resolveProductIdentity(source:Input,candidates:Row[]):Row|null{
 const brand=typeof source.brand==='string'?source.brand.trim().toLowerCase():'';const mpn=typeof source.mpn==='string'?source.mpn.trim():'';
 const exact=candidates.filter(candidate=>{
  if(source.gtinVerified===true&&source.gtin&&candidate.data.gtinVerified===true&&candidate.data.gtin===source.gtin&&String(candidate.data.brand??'').toLowerCase()===brand)return true;
  return Boolean(brand&&mpn&&String(candidate.data.brand??'').toLowerCase()===brand&&candidate.data.mpn===mpn);
 });if(exact.length>1)fail('AMBIGUOUS_PRODUCT_IDENTITY');return exact[0]??null;
}
export async function handleCatalog(tx:Tx,a:Actor,action:string,input:Input):Promise<unknown>{
 authorize(a,'catalog',action);
 if(action==='save_catalog_image')return saveCatalogImage(tx,a,input);
 if(action==='stage_source_file')return stageCatalogSourceFile(tx,a,input);
 if(action==='stage_sources')return stageCatalogSources(tx,a,input);
 if(action==='source_library')return catalogSourceLibrary(tx,a,input);
 if(action==='create_from_source')return createSourceDraft(tx,a,input);
 if(action==='read')return {products:await list(tx,a,'products'),variants:await list(tx,a,'variants',1000)};
 if(action==='read_product'){const product=await get(tx,a,'products',input.id),variants=(await tx.query('select * from app.variants where tenant_id=$1 and workspace_id=$2 and product_id=$3 order by id',[a.tenantId,a.workspaceId,product.id])).rows as Row[];return {product,variants,issues:publishIssues(product,variants.filter(v=>v.status!=='ARCHIVED'))};}
 if(action==='save_variant'){
  const product=await get(tx,a,'products',input.productId,true);if(product.status==='ARCHIVED')fail('ARCHIVED_PRODUCT_READ_ONLY');
  if(input.expectedProductRevision!==undefined&&product.revision!==number(input.expectedProductRevision,1))fail('REVISION_CONFLICT');
  if(product.status==='PUBLISHED'&&!product.data.publicSnapshot)await update(tx,a,'products',product.id,{data:{...product.data,publicSnapshot:{title:product.title,revision:product.revision,product:product.data,variants:await variantsFor(tx,a,product.id)}}});
  const color=text(input.color,100),size=text(input.size,100),hex=text(input.hex,7);
  if(!/^#[a-fA-F0-9]{6}$/.test(hex))fail('VARIANT_SWATCH_INVALID',400);
  if(input.image!==undefined&&input.image!==null&&input.image!==''&&!safeImage(input.image))fail('PUBLIC_IMAGE_REQUIRES_APPROVED_LOCAL_DERIVATIVE',400);
  const status=String(input.status??'ACTIVE');if(!['ACTIVE','ARCHIVED'].includes(status))fail('VARIANT_STATUS_INVALID',400);
  let old:Row|undefined;if(input.id){old=await get(tx,a,'variants',input.id,true);if(old.product_id!==product.id)fail('VARIANT_PRODUCT_MISMATCH');}
  const duplicate=await tx.query("select id from app.variants where tenant_id=$1 and workspace_id=$2 and product_id=$3 and status<>'ARCHIVED' and data->>'color'=$4 and data->>'size'=$5 and ($6::uuid is null or id<>$6)",[a.tenantId,a.workspaceId,product.id,color,size,old?.id??null]);
  if(status==='ACTIVE'&&duplicate.rowCount)fail('DUPLICATE_VARIANT');
  const data={...old?.data,color,size,hex,image:input.image===undefined?(safeImage(old?.data.image)??safeImage(product.data.image)):(safeImage(input.image)??safeImage(product.data.image)),availability:'REQUEST_QUOTE'};
  const saved=old?await update(tx,a,'variants',old.id,{title:`${product.title} · ${color} · ${size}`,status,data,expectedRevision:input.expectedRevision===undefined?undefined:number(input.expectedRevision,1)}):await create(tx,a,'variants',{title:`${product.title} · ${color} · ${size}`,status,product_id:product.id,data});
  await event(tx,a,'catalog.variant_saved',saved.id,{productId:product.id,publicSnapshotPreserved:product.status==='PUBLISHED'});return saved;
 }
 if(action==='create'){
  const data=productInput(input);const product=await create(tx,a,'products',{title:text(input.title??input.name),status:'DRAFT',data:{sku:`TS-${hash(`${a.workspaceId}:${Date.now()}:${input.title}`).slice(0,10).toUpperCase()}`,category:'PROMO',brand:'',description:'',minimumQuantity:12,methods:['screen_print'],locations:['front'],leadTimeDays:10,licenseApproved:false,fieldOwnership:{title:'TENANT'},...data}});
  const inputs=Array.isArray(input.variants)?input.variants:[{color:'Navy',hex:'#1e3a5f',size:'One size',image:data.image??null}];if(inputs.length>500)fail('VARIANT_LIMIT',400);
  for(const value of inputs){const v=object(value);if(!/^#[a-fA-F0-9]{6}$/.test(String(v.hex)))fail('VARIANT_SWATCH_INVALID',400);await create(tx,a,'variants',{title:`${product.title} · ${text(v.color)} · ${text(v.size??'One size')}`,status:'DRAFT',product_id:product.id,data:{color:text(v.color),hex:String(v.hex),size:text(v.size??'One size'),image:safeImage(v.image)??safeImage(data.image),stock:null,partId:null}});}
  await event(tx,a,'catalog.product_created',product.id);return product;
 }
 if(action==='update'){
  const product=await get(tx,a,'products',input.id,true);const data=validateProductData(object(input.data),product.data);const title=input.title!==undefined?text(input.title):product.title;
  if(product.status==='ARCHIVED')fail('ARCHIVED_PRODUCT_READ_ONLY');
  if(product.status==='PUBLISHED'&&!product.data.publicSnapshot)data.publicSnapshot={title:product.title,revision:product.revision,product:product.data,variants:await variantsFor(tx,a,product.id)};
  data.fieldOwnership={...object(product.data.fieldOwnership),...(input.title!==undefined?{title:'TENANT'}:{}),...Object.fromEntries(Object.keys(object(input.data)).map(key=>[key,'TENANT']))};
  const next=await update(tx,a,'products',product.id,{title,data,...(input.expectedRevision!==undefined?{expectedRevision:number(input.expectedRevision,1)}:{})});await event(tx,a,'catalog.product_updated',product.id,{publicRevisionPreserved:product.status==='PUBLISHED'});return next;
 }
 if(action==='bulk_change'){
  const selected=ids(input),changes=object(input.changes);const {title,...fields}=changes;const validated=validateProductData(fields);if(title!==undefined)text(title);
  const records:Row[]=[];for(const id of selected)records.push(await get(tx,a,'products',id,true));if(records.some(r=>r.status==='ARCHIVED'))fail('ARCHIVED_PRODUCT_READ_ONLY');
  const previewHash=hash({ids:selected,changes,revisions:records.map(r=>r.revision)});if(input.dryRun!==false)return {previewHash,affectedCount:records.length,changes,requiresApproval:true,publishedPricesChanged:0};
  if(input.previewHash!==previewHash)fail('BULK_PREVIEW_STALE');
  return idempotent(tx,a,'catalog.bulk_change',input.idempotencyKey,{ids:selected,changes},async()=>{
   const snapshots=records.map(r=>({id:r.id,title:r.title,status:r.status,data:r.data}));
   const manifest=await create(tx,a,'catalog_rollback_manifests',{title:'Bulk catalog change',status:'AVAILABLE',data:{kind:'BULK_CHANGE',snapshots}});
   for(const row of records){const data:Input={...row.data,...validated,fieldOwnership:{...object(row.data.fieldOwnership),...Object.fromEntries(Object.keys(changes).map(key=>[key,'TENANT']))}};if(row.status==='PUBLISHED'&&!row.data.publicSnapshot)data.publicSnapshot={title:row.title,revision:row.revision,product:row.data,variants:await variantsFor(tx,a,row.id)};await update(tx,a,'products',row.id,{title:title===undefined?row.title:String(title),data});}
   await event(tx,a,'catalog.bulk_changed',manifest.id,{affectedCount:records.length,previewHash});return {affectedCount:records.length,rollbackManifestId:manifest.id};
  });
 }
 if(action==='stage_revision'){
  const records:Row[]=[];for(const id of ids(input))records.push(await get(tx,a,'products',id,true));
  const snapshots=await Promise.all(records.map(async row=>({id:row.id,title:row.title,data:row.data,variants:await variantsFor(tx,a,row.id)})));
  const revision=await create(tx,a,'catalog_revisions',{title:'Catalog publication review',status:'IN_REVIEW',data:{snapshots,reviewRequestedBy:a.userId}});
  for(const row of records){if(row.status==='ARCHIVED')fail('ARCHIVED_PRODUCT_READ_ONLY');await update(tx,a,'products',row.id,{status:row.status==='PUBLISHED'?'PUBLISHED':'IN_REVIEW',data:{...row.data,pendingRevisionId:revision.id}});}
  await event(tx,a,'catalog.revision_staged',revision.id,{count:records.length});return revision;
 }
 if(action==='publish'){
  if(process.env.TWELVESPEC_ENV&&!['local','test','preview'].includes(process.env.TWELVESPEC_ENV))fail('EXTERNAL_PUBLICATION_REQUIRES_APPROVAL',403);
  const records:Row[]=[];for(const id of ids(input))records.push(await get(tx,a,'products',id,true));const inspections=await Promise.all(records.map(async row=>{const variants=await variantsFor(tx,a,row.id),issues=publishIssues(row,variants);
   for(const path of new Set([row.data.image,...variants.map(v=>v.data.image)]))if(typeof path==='string'&&path.startsWith('/api/catalog/images/')){
    const assetId=path.slice('/api/catalog/images/'.length);if(!/^[a-f0-9-]{36}$/i.test(assetId)){issues.push('CATALOG_IMAGE_UNAVAILABLE');continue;}
    const asset=(await tx.query('select * from app.assets where tenant_id=$1 and workspace_id=$2 and id=$3',[a.tenantId,a.workspaceId,assetId])).rows[0] as Row|undefined;
    if(!asset||asset.product_id!==row.id||asset.data.kind!=='CATALOG_DERIVATIVE'||!asset.data.rightsConfirmedBy)issues.push('CATALOG_IMAGE_PRODUCT_REVIEW_REQUIRED');
   }
   return {row,variants,issues:[...new Set(issues)]};}));
  const eligible=inspections.filter(r=>!r.issues.length).map(r=>r.row.id),blocked=inspections.filter(r=>r.issues.length).map(r=>({id:r.row.id,title:r.row.title,issues:r.issues}));
  const previewHash=hash(inspections.map(r=>({id:r.row.id,revision:r.row.revision,variantRevisions:r.variants.map(v=>[v.id,v.revision]),issues:r.issues})));
  if(input.dryRun!==false)return {previewHash,eligible,blocked,count:records.length,environment:'LOCAL_SYNTHETIC_PREVIEW',allQuoteOnly:true};
  if(input.previewHash!==previewHash)fail('PUBLISH_PREVIEW_STALE');if(blocked.length)fail('PUBLISH_ELIGIBILITY_FAILED');const reason=text(input.approvalReason??input.reason,1000);
  return idempotent(tx,a,'catalog.publish',input.idempotencyKey,{ids:records.map(r=>r.id),previewHash,reason},async()=>{
   const snapshots=records.map(r=>({id:r.id,title:r.title,status:r.status,data:r.data}));
   const manifest=await create(tx,a,'catalog_rollback_manifests',{title:'Published catalog revision',status:'AVAILABLE',data:{kind:'PUBLICATION',snapshots,previewHash}});
   for(const {row,variants}of inspections){const {publicSnapshot:_,...data}=row.data;const snapshot={title:row.title,revision:row.revision+1,product:data,variants};await update(tx,a,'products',row.id,{status:'PUBLISHED',data:{...data,publicSnapshot:snapshot,publishedRevision:row.revision+1,publishedAt:new Date().toISOString(),publishedBy:a.userId,publishReadiness:'REQUEST_QUOTE_ONLY'}});}
   const revision=await create(tx,a,'catalog_revisions',{title:'Local catalog publication',status:'PUBLISHED',data:{productIds:eligible,previewHash,rollbackManifestId:manifest.id,approvedBy:a.userId,approvalReason:reason}});
   await event(tx,a,'catalog.revision_published',revision.id,{count:eligible.length,rollbackManifestId:manifest.id,environment:'LOCAL_SYNTHETIC_PREVIEW'});return {published:eligible.length,revisionId:revision.id,rollbackManifestId:manifest.id,environment:'LOCAL_SYNTHETIC_PREVIEW'};
  });
 }
 if(action==='rollback'){
  return idempotent(tx,a,'catalog.rollback',input.idempotencyKey,{id:input.id},async()=>{const manifest=await get(tx,a,'catalog_rollback_manifests',input.id,true);if(manifest.status!=='AVAILABLE'||!Array.isArray(manifest.data.snapshots))fail('ROLLBACK_UNAVAILABLE');for(const value of manifest.data.snapshots as unknown[]){const s=object(value),current=await get(tx,a,'products',s.id,true);await update(tx,a,'products',current.id,{title:String(s.title),status:String(s.status),data:object(s.data)});}await update(tx,a,'catalog_rollback_manifests',manifest.id,{status:'ROLLED_BACK'});await event(tx,a,'catalog.revision_rolled_back',manifest.id);return {rolledBack:true,count:(manifest.data.snapshots as unknown[]).length};});
 }
 if(action==='pause'){
  const row=await get(tx,a,'products',input.id,true);if(row.status!=='PUBLISHED')fail('INVALID_TRANSITION');const next=await update(tx,a,'products',row.id,{status:'PAUSED'});await event(tx,a,'catalog.product_paused',row.id,{reason:String(input.reason??'Operator pause')});return next;
 }
 if(action==='match_product'){
  const source=await get(tx,a,'source_records',input.id);const match=resolveProductIdentity(source.data,await list(tx,a,'products',1000));if(!match){const issue=await create(tx,a,'merge_reviews',{title:'Source identity needs manual review',status:'OPEN',data:{sourceRecordId:source.id,reason:'No verified GTIN/brand or MPN/brand match. Title similarity never auto-merges.'}});return {matched:false,reviewId:issue.id};}await event(tx,a,'catalog.source_matched',match.id,{sourceRecordId:source.id,method:source.data.gtinVerified?'VERIFIED_GTIN_BRAND':'MPN_BRAND'});return {matched:true,productId:match.id};
 }
 if(action==='create_collection'){
  const selected=ids(input);for(const id of selected)await get(tx,a,'products',id);const row=await create(tx,a,'collections',{title:text(input.title),status:'ACTIVE',data:{productIds:selected}});await event(tx,a,'catalog.collection_created',row.id,{count:selected.length});return row;
 }
 if(action==='export'){
  const rows=await list(tx,a,'products',1000);return {fileName:'twelvespec-catalog.csv',mimeType:'text/csv',content:exportCSV(rows.map(r=>({id:r.id,title:r.title,status:r.status,category:r.data.category,brand:r.data.brand,minimumQuantity:r.data.minimumQuantity})),['id','title','status','category','brand','minimumQuantity'])};
 }
 return fail('CATALOG_COMMAND_UNSUPPORTED',400);
}
