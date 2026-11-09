import {authorize,create,event,fail,get,hash,idempotent,number,text,type Actor,type Input,type Row,type Tx} from '../../kernel/src';
import {parse} from 'csv-parse/sync';

const optionalText=(value:unknown,max:number)=>value===undefined||value===null||value===''?'':text(value,max);
const plain=(value:unknown)=>optionalText(value,20000).replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().slice(0,10000);
function referenceURL(value:unknown):string|null {
 if(!value)return null;
 try {const u=new URL(text(value,2000));if(u.protocol!=='https:'||u.username||u.password||u.search||u.hash)throw new Error();return u.toString();}
 catch {return fail('SOURCE_REFERENCE_URL_INVALID',400);}
}
export function normalizeCatalogSource(value:unknown):Input {
 if(!value||typeof value!=='object'||Array.isArray(value))fail('CATALOG_SOURCE_INVALID',400);
 const v=value as Input,supplier=text(v.supplier,100),externalId=text(v.externalId,160);
 const environment=v.environment??'MANUAL';
 if(!['PUBLIC_CATALOG','STAGING','MANUAL','SYNTHETIC'].includes(String(environment)))fail('SOURCE_ENVIRONMENT_INVALID',400);
 const category=v.category??null;
 if(category!==null&&!['APPAREL','PROMO','PRINT','SIGNAGE','EVENT','PACKAGING','KIT','CUSTOM_MANUFACTURED','SERVICE'].includes(String(category)))fail('SOURCE_CATEGORY_INVALID',400);
 const observedAt=v.observedAt?text(v.observedAt,40):new Date().toISOString();
 if(!Number.isFinite(Date.parse(observedAt))||Date.parse(observedAt)>Date.now()+60000)fail('SOURCE_OBSERVATION_INVALID',400);
 const data={catalogSourceKey:hash({supplier:supplier.toLowerCase(),externalId}),supplier,externalId,title:text(v.title,500),brand:optionalText(v.brand,200),model:optionalText(v.model,200),description:plain(v.description),category,sourceCategory:optionalText(v.sourceCategory,200),sourceEnabled:typeof v.sourceEnabled==='boolean'?v.sourceEnabled:null,sourceUrl:referenceURL(v.sourceUrl),imageUrl:referenceURL(v.imageUrl),environment,observedAt,rightsStatus:'UNREVIEWED',variantCoverage:'UNVERIFIED',pricingCoverage:'UNVERIFIED'};
 return {...data,rawHash:hash({...data,observedAt:undefined})};
}

export async function stageCatalogSources(tx:Tx,a:Actor,input:Input) {
 authorize(a,'catalog','stage_sources');
 if(!Array.isArray(input.sources)||!input.sources.length||input.sources.length>200)fail('SOURCE_BATCH_LIMIT',400);
 const sources=input.sources.map(normalizeCatalogSource);
 return idempotent(tx,a,'catalog.stage_sources',input.idempotencyKey,{sources:sources.map(s=>({key:s.catalogSourceKey,hash:s.rawHash}))},async()=>{
  let created=0,unchanged=0;
  for(const source of sources){
   const result=await tx.query(`insert into app.source_records(id,tenant_id,workspace_id,owner_id,title,status,data)
    values(gen_random_uuid(),$1,$2,$3,$4,'STAGED',$5)
    on conflict (tenant_id,workspace_id,(data->>'catalogSourceKey'),(data->>'rawHash')) where data->>'catalogSourceKey' is not null do nothing returning id`,
    [a.tenantId,a.workspaceId,a.userId,source.title,source]);
   if(result.rowCount)created++;else unchanged++;
  }
  await event(tx,a,'catalog.sources_staged',a.workspaceId,{created,unchanged,autoPublished:0});
  return {created,unchanged,autoPublished:0};
 });
}

export async function stageCatalogSourceFile(tx:Tx,a:Actor,input:Input) {
 authorize(a,'catalog','stage_sources');
 const content=typeof input.content==='string'?input.content:fail('SOURCE_FILE_INVALID',400);
 if(!content.trim()||Buffer.byteLength(content)>10*1024*1024||content.includes('\0'))fail('SOURCE_FILE_INVALID',400);
 let records:Input[];
 if(input.format==='JSON'){
  let document:unknown;try{document=JSON.parse(content);}catch{fail('SOURCE_JSON_INVALID',400);}
  records=Array.isArray(document)?document:(document as Input)?.sources as Input[];
 }else if(input.format==='CSV'){
  let count=0;
  try{records=parse(content,{bom:true,columns:(columns:string[])=>{if(columns.length>64||new Set(columns).size!==columns.length||columns.some(c=>!c||c.length>120))fail('SOURCE_CSV_COLUMNS_INVALID',400);return columns;},on_record:(record:Input)=>{if(++count>10000)fail('SOURCE_FILE_ROW_LIMIT',400);return record;},skip_empty_lines:true,max_record_size:65536,relax_column_count:false}) as Input[];}
  catch{fail('SOURCE_CSV_INVALID',400);}
  records=records.map(r=>({supplier:r.supplier??input.supplier,externalId:r.externalId??r.sourceId??r.styleID??r.sku??r.id,title:r.title??r.name,brand:r.brand??r.brandName,model:r.model??r.styleName??r.mpn,description:r.description,category:['APPAREL','PROMO','PRINT','SIGNAGE','EVENT','PACKAGING','KIT','CUSTOM_MANUFACTURED','SERVICE'].includes(String(r.category))?r.category:null,sourceCategory:r.sourceCategory??r.baseCategory??r.category,sourceUrl:r.sourceUrl,imageUrl:r.imageUrl,environment:r.environment||'PUBLIC_CATALOG',observedAt:r.observedAt}));
 }else return fail('SOURCE_FILE_FORMAT_INVALID',400);
 if(!Array.isArray(records)||!records.length||records.length>10000)fail('SOURCE_FILE_ROW_LIMIT',400);
 records=records.map(normalizeCatalogSource);
 let created=0,unchanged=0;
 const fileHash=hash(content);
 for(let i=0;i<records.length;i+=200){const result=await stageCatalogSources(tx,a,{sources:records.slice(i,i+200),idempotencyKey:`source-file-${fileHash}-${i}`});created+=result.created;unchanged+=result.unchanged;}
 return {created,unchanged,total:records.length,fileHash,autoPublished:0};
}

export async function catalogSourceLibrary(tx:Tx,a:Actor,input:Input={}) {
 authorize(a,'catalog','read');
 const page=number(input.page??1,1,1000000),pageSize=number(input.pageSize??20,1,100);
 if(!Number.isInteger(page)||!Number.isInteger(pageSize))fail('PAGINATION_INVALID',400);
 const search=optionalText(input.search,200).toLowerCase(),supplier=optionalText(input.supplier,100);
 const params=[a.tenantId,a.workspaceId,search,supplier];
 const where=`s.tenant_id=$1 and s.workspace_id=$2 and s.data->>'catalogSourceKey' is not null
  and ($3='' or strpos(lower(s.title||' '||coalesce(s.data->>'brand','')||' '||coalesce(s.data->>'model','')||' '||coalesce(s.data->>'externalId','')),$3)>0)
  and ($4='' or s.data->>'supplier'=$4)`;
 const total=Number((await tx.query(`select count(*) n from app.source_records s where ${where}`,params)).rows[0].n);
 const items=(await tx.query(`select s.*,p.id as draft_id,p.status as product_status from app.source_records s
  left join app.products p on p.tenant_id=s.tenant_id and p.workspace_id=s.workspace_id and p.data->>'catalogSourceKey'=s.data->>'catalogSourceKey'
  where ${where} order by s.created_at desc,s.id limit $5 offset $6`,[...params,pageSize,(page-1)*pageSize])).rows;
 const sourceCounts=(await tx.query(`select data->>'supplier' supplier,count(*)::int count from app.source_records
  where tenant_id=$1 and workspace_id=$2 and data->>'catalogSourceKey' is not null group by data->>'supplier' order by 1`,[a.tenantId,a.workspaceId])).rows;
 return {items,total,page,pageSize,sourceCounts};
}

export async function createSourceDraft(tx:Tx,a:Actor,input:Input):Promise<Row> {
 authorize(a,'catalog','create_from_source');
 const source=await get(tx,a,'source_records',input.id);
 if(!source.data.catalogSourceKey)fail('CATALOG_SOURCE_REQUIRED',400);
 if(source.data.displayUse==='INTERNAL_ONLY')fail('SAGE_PUBLIC_SOURCE_REQUIRED',403);
 const detail=source.data.supplierDetail as Input|undefined;if(detail?.expiresOn&&Date.parse(String(detail.expiresOn)+'T23:59:59Z')<Date.now())fail('SUPPLIER_DATA_EXPIRED',409);
 await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`${a.tenantId}/${a.workspaceId}/catalog-source/${source.data.catalogSourceKey}`]);
 const existing=await tx.query(`select * from app.products where tenant_id=$1 and workspace_id=$2 and data->>'catalogSourceKey'=$3`,[a.tenantId,a.workspaceId,source.data.catalogSourceKey]);
 if(existing.rows[0])return existing.rows[0];
 const s=source.data;
 const product=await create(tx,a,'products',{title:input.title?text(input.title):source.title,status:'DRAFT',source_id:source.id,data:{
  sku:`TS-${String(s.catalogSourceKey).slice(0,10).toUpperCase()}`,catalogSourceKey:s.catalogSourceKey,brand:s.brand,mpn:s.model,description:s.description,category:s.category,
  minimumQuantity:null,leadTimeDays:null,methods:[],locations:[],image:null,licenseApproved:false,synthetic:s.environment==='SYNTHETIC',
  fieldOwnership:{title:'TENANT',description:'SOURCE_IMPORTED',brand:'SOURCE_IMPORTED'},sourceRecordId:source.id,sourceEnvironment:s.environment,sourceObservedAt:s.observedAt,
  readiness:'NEEDS_CATALOG_REVIEW',unknownFields:['variants','minimumQuantity','methods','locations','licensedMedia','pricing','availability','delivery']
 }});
 await event(tx,a,'catalog.source_draft_created',product.id,{sourceId:source.id,autoPublished:false});
 return product;
}
