import Decimal from 'decimal.js';
import { authorize,create,event,fail,get,hash,idempotent,list,number,text,update, type Actor,type Tx,type Input,type Row } from '../../kernel/src/index';
import { LocalEncryptedVault,PROVIDERS,mockCapabilities,supplierHosts,validateEndpoint, type ProviderType } from '../../providers/src/index';
import { parseImport,validateMapping,type ParsedRow,type NormalizedProduct } from './imports';
import {shopifyDomain,shopifyDemoSources,SHOPIFY_API_VERSION,SHOPIFY_ACTIVATION_REQUIREMENTS} from '../../providers/src/shopify';
import {stageCatalogSources} from '../../catalog/src/sources';
export * from './imports';
const object=(v:unknown):Input=>v&&typeof v==='object'&&!Array.isArray(v)?v as Input:{};
const vault=new LocalEncryptedVault();
export function connectionSummary(connection:Row){const d=connection.data;return {id:connection.id,title:connection.title,status:connection.status,revision:connection.revision,data:{providerType:d.providerType,environment:d.environment,maskedHint:d.maskedHint??null,endpointHost:d.endpointHost??null,verification:d.verification??'NOT_CONFIGURED',schedule:d.schedule??null,help:d.help??null,lastSyncAt:d.lastSyncAt??null,nextSyncAt:d.nextSyncAt??null,vaultMode:d.vaultMode??null,pricePolicy:d.pricePolicy??null,...(d.providerType==='SHOPIFY'?{shopDomain:d.shopDomain,apiVersion:d.apiVersion,activationRequirements:SHOPIFY_ACTIVATION_REQUIREMENTS,writeEnabled:false}:{})}};}
export function validatePricePolicy(value:unknown){
 const p=object(value),targetMargin=number(p.targetMargin??0.4,0,0.95),floorMargin=number(p.floorMargin??0.3,0,targetMargin);const currency=String(p.currency??'USD');if(!/^[A-Z]{3}$/.test(currency))fail('PRICE_POLICY_CURRENCY_INVALID',400);
 const amount=(key:string):string|null=>{if(p[key]===undefined||p[key]===null||p[key]==='')return null;try{const value=new Decimal(String(p[key]));if(!value.isFinite()||value.isNegative()||value.decimalPlaces()>4)throw new Error();return value.toFixed(4);}catch{return fail('PRICE_POLICY_COST_INVALID',400);}};
 return {targetMargin,floorMargin,currency,requiresApprovalBelowFloor:true,defaultSetupCost:amount('defaultSetupCost'),defaultDecorationCost:amount('defaultDecorationCost'),defaultFreight:amount('defaultFreight'),evidence:'MANUAL_OPERATOR_POLICY'};
}
const scope=(a:Actor,id:string)=>`${a.tenantId}/${a.workspaceId}/${id}`;
async function batchRows(tx:Tx,a:Actor,id:string):Promise<Row[]>{return(await tx.query('select * from app.import_rows where tenant_id=$1 and workspace_id=$2 and batch_id=$3 order by (data->>\'rowNumber\')::integer',[a.tenantId,a.workspaceId,id])).rows;}
async function profiles(tx:Tx,a:Actor,input:Input){if(input.mappingProfileId){const p=await get(tx,a,'mapping_profiles',input.mappingProfileId);return {mapping:p.data.mapping,mappingVersion:p.data.mappingVersion??p.revision,profileId:p.id,pricePolicy:p.data.pricePolicy};}return {mapping:input.mapping,mappingVersion:1,profileId:null,pricePolicy:validatePricePolicy(input.pricePolicy)};}
export async function handleSupplier(tx:Tx,a:Actor,action:string,input:Input):Promise<unknown>{
 authorize(a,'supplier',action);
 if(action==='read')return {providers:PROVIDERS,connections:(await list(tx,a,'connections')).map(connectionSummary)};
 if(action==='create_connection'||action==='create'){
  const providerType=text(input.providerType) as ProviderType;if(!(providerType in PROVIDERS))fail('ADAPTER_UNSUPPORTED_USE_FILE_IMPORT',400);
  const environment=input.environment??'mock';if(!['mock','sandbox'].includes(String(environment)))fail('LIVE_CONNECTION_ACTIVATION_BLOCKED',403);
  if(providerType==='SHOPIFY'&&environment!=='mock')fail('SHOPIFY_INSTALLATION_REQUIRED',403);
  let endpointHost:string|null=null;if(input.endpointHost){const value=text(input.endpointHost);const endpoint=validateEndpoint(value.startsWith('https://')?value:`https://${value}`,supplierHosts());endpointHost=endpoint.hostname;}
  if(providerType==='SHOPIFY')endpointHost=shopifyDomain(input.shopDomain);
  const row=await create(tx,a,'connections',{title:text(input.displayName??input.title),status:'NOT_CONFIGURED',data:{providerType,environment,endpointHost,help:PROVIDERS[providerType].help,verification:'NOT_CONFIGURED',writeEnabled:false,...(providerType==='SHOPIFY'?{shopDomain:endpointHost,apiVersion:SHOPIFY_API_VERSION,scopes:['read_products'],direction:'READ_ONLY',liveActivation:'BLOCKED'}:{pricePolicy:validatePricePolicy(input.pricePolicy)})}});
  for(const capability of PROVIDERS[providerType].services)await create(tx,a,'capabilities',{title:capability,connection_id:row.id,status:'NOT_CONFIGURED',data:{capability,verification:'NOT_CONFIGURED',available:false}});
  await event(tx,a,'supplier.connection_created',row.id,{providerType,environment});return connectionSummary(row);
 }
 if(['shopify_demo_import','shopify_activate','shopify_publish','shopify_orders'].includes(action)){
  const connection=await get(tx,a,'connections',input.id,true);
  if(connection.data.providerType!=='SHOPIFY')fail('SHOPIFY_CONNECTION_REQUIRED',400);
  if(action!=='shopify_demo_import')fail('SHOPIFY_INSTALLATION_REQUIRED',403);
  if(a.role!=='owner')fail('PERMISSION_DENIED',403);
  if(connection.status==='DISABLED'||connection.data.environment!=='mock')fail('SHOPIFY_CONNECTION_NOT_AVAILABLE',403);
  const commandKey=text(input.idempotencyKey,200);
  return idempotent(tx,a,'supplier.shopify_demo_import',commandKey,{connectionId:connection.id},async()=>{
   const sources=shopifyDemoSources(String(connection.data.shopDomain));
   const result=await stageCatalogSources(tx,a,{sources,idempotencyKey:`shopify-demo:${hash({connectionId:connection.id,commandKey})}`});
   const run=await create(tx,a,'sync_runs',{title:`Shopify demo: ${connection.title}`,status:'COMPLETE',connection_id:connection.id,data:{verification:'MOCKED',created:result.created,unchanged:result.unchanged,autoPublished:0,apiVersion:SHOPIFY_API_VERSION,observedAt:new Date().toISOString()}});
   await update(tx,a,'connections',connection.id,{data:{...connection.data,lastSyncAt:new Date().toISOString(),verification:'MOCKED'}});
   await event(tx,a,'supplier.shopify_demo_staged',connection.id,{runId:run.id,...result,externalRequests:0});return {...result,verification:'MOCKED',externalRequests:0};
  });
 }
 if(action==='save_secret'){
  const row=await get(tx,a,'connections',input.id,true);if(!PROVIDERS[row.data.providerType as ProviderType].credentials.length)fail('PROVIDER_REQUIRES_NO_CREDENTIAL',400);
  if(typeof input.secret!=='string'||input.secret.length<1||input.secret.length>16384)fail('INVALID_CREDENTIAL',400);
  const stored=await vault.replace(scope(a,row.id),String(input.secret));
  const next=await update(tx,a,'connections',row.id,{status:'CREDENTIALS_SAVED',data:{...row.data,secretReference:stored.reference,maskedHint:stored.maskedHint,vaultMode:stored.mode,verification:'NOT_CONFIGURED'}});
  await create(tx,a,'secret_metadata',{title:'Supplier credential replacement',connection_id:row.id,status:'ACTIVE',data:{reference:stored.reference,maskedHint:stored.maskedHint,rotatedAt:new Date().toISOString(),replacedBy:a.userId}});
  await event(tx,a,'supplier.credential_replaced',row.id,{vaultMode:stored.mode});return connectionSummary(next);
 }
 if(action==='configure_service'){
  const row=await get(tx,a,'connections',input.id,true),type=row.data.providerType as ProviderType,capability=text(input.capability);
  if(!PROVIDERS[type].services.includes(capability))fail('SERVICE_UNSUPPORTED',400);
  const endpoint=validateEndpoint(text(input.endpointUrl),supplierHosts()),serviceVersion=text(input.serviceVersion,30);
  if(input.wsdlUrl)fail('ARBITRARY_WSDL_FETCH_FORBIDDEN',400);
  const profile=type==='PROMOSTANDARDS_SOAP'&&capability==='product_data'&&serviceVersion==='1.0.0'?'BUNDLED_PRODUCT_DATA_V1':null;
  const capabilities=await list(tx,a,'capabilities',1000),old=capabilities.find(c=>c.connection_id===row.id&&c.data.capability===capability);
  const data={capability,version:serviceVersion,endpointHost:endpoint.hostname,endpointUrl:endpoint.toString(),profile,verification:'NOT_CONFIGURED',available:false,reason:profile?'Reviewed fixture schema configured; vendor authorization and sandbox evidence still required':'Service-specific supplier WSDL/schema has not been registered. This capability stays blocked.'};
  const next=old?await update(tx,a,'capabilities',old.id,{status:'NOT_CONFIGURED',data}):await create(tx,a,'capabilities',{title:capability,connection_id:row.id,status:'NOT_CONFIGURED',data});
  await event(tx,a,'supplier.service_configured',row.id,{capability,serviceVersion,profile});return next;
 }
 if(action==='test_connection'||action==='discover_capabilities'){
  const row=await get(tx,a,'connections',input.id,true),providerType=row.data.providerType as ProviderType;
  const capabilities=mockCapabilities(providerType,{hasCredentials:typeof row.data.secretReference==='string',failService:typeof input.simulateFailure==='string'?input.simulateFailure:undefined});
  // No supplied account has an approved sandbox wire profile yet: a mock credential is never sent to a real vendor.
  if(row.data.environment!=='mock')for(const cap of capabilities){cap.available=false;cap.verification='BLOCKED';cap.reason=providerType==='ASI_SMARTLINK'?'ASI entitlement and official account-specific schema required':'Authorized sandbox credentials and reviewed service WSDL/profile required. Test mock mode to preview workflow.';}
  if(row.data.secretReference&&row.data.environment==='mock')await vault.resolve(scope(a,row.id),String(row.data.secretReference));
  const existing=await list(tx,a,'capabilities',1000);
  for(const cap of capabilities){const configured=existing.find(x=>x.connection_id===row.id&&x.data.capability===cap.capability);if(configured?.data.endpointUrl&&!configured.data.profile){cap.available=false;cap.verification='BLOCKED';cap.reason='Configured service/version has no reviewed native WSDL profile. Use supported mock fixtures or supply authorized service documentation.';}}
  for(const cap of capabilities){const old=existing.find(x=>x.connection_id===row.id&&x.data.capability===cap.capability);if(old)await update(tx,a,'capabilities',old.id,{status:cap.verification,data:{...old.data,...cap,version:old.data.version??cap.version}});else await create(tx,a,'capabilities',{title:cap.capability,connection_id:row.id,status:cap.verification,data:{...cap}});}
  const good=capabilities.filter(c=>c.available).length;
  const next=await update(tx,a,'connections',row.id,{status:good===capabilities.length?'VALIDATED':good?'PARTIALLY_CAPABLE':'ERROR',data:{...row.data,verification:good?'MOCKED':'BLOCKED',verifiedAt:new Date().toISOString()}});
  await event(tx,a,'supplier.capabilities_checked',row.id,{evidence:good?'MOCKED':'BLOCKED',available:good,total:capabilities.length});return {connection:connectionSummary(next),capabilities};
 }
 if(action==='configure_pricing'){
  const connection=await get(tx,a,'connections',input.id,true);if(connection.data.providerType==='SHOPIFY')fail('SHOPIFY_RETAIL_PRICE_NOT_SUPPLIER_COST',400);const pricePolicy=validatePricePolicy(input.pricePolicy);const next=await update(tx,a,'connections',connection.id,{data:{...connection.data,pricePolicy}});await event(tx,a,'supplier.price_policy_configured',connection.id,{targetMargin:pricePolicy.targetMargin,floorMargin:pricePolicy.floorMargin,currency:pricePolicy.currency});return connectionSummary(next);
 }
 if(action==='save_mapping'){
  const mapping=validateMapping(input.mapping),pricePolicy=validatePricePolicy(input.pricePolicy),title=text(input.title??'Supplier product mapping');
  const previous=(await list(tx,a,'mapping_profiles',1000)).filter(r=>r.title===title);const version=Math.max(0,...previous.map(r=>Number(r.data.mappingVersion??1)))+1;
  const row=await create(tx,a,'mapping_profiles',{title,status:'PUBLISHED',data:{mapping,pricePolicy,mappingVersion:version,previousProfileId:previous[0]?.id??null}});
  await event(tx,a,'supplier.mapping_saved',row.id,{mappingVersion:version});return row;
 }
 if(action==='stage_file'){
  const format=String(input.format??'CSV').toUpperCase();if(format!=='CSV'&&format!=='XML')fail('IMPORT_FORMAT_UNSUPPORTED',400);
  if(typeof input.content!=='string')fail('IMPORT_FILE_INVALID',400);
  const content=String(input.content),fileName=text(input.fileName??`products.${format.toLowerCase()}`,200);
  if(!fileName.toLowerCase().endsWith(`.${format.toLowerCase()}`))fail('IMPORT_EXTENSION_MISMATCH',400);
  if(input.mimeType&&!((format==='CSV'?['text/csv','application/csv','application/vnd.ms-excel','text/plain']:['text/xml','application/xml']).includes(String(input.mimeType))))fail('IMPORT_MIME_MISMATCH',400);
  const profile=await profiles(tx,a,input);let connectionId:string|null=null;if(input.connectionId){const connection=await get(tx,a,'connections',input.connectionId);connectionId=connection.id;if(!input.pricePolicy&&!input.mappingProfileId&&connection.data.pricePolicy)profile.pricePolicy=validatePricePolicy(connection.data.pricePolicy);}
  const parsed=await parseImport(content,format as 'CSV'|'XML',profile.mapping),fileHash=hash(content),dedupe=hash({fileHash,mapping:parsed.mapping,connectionId});
  return idempotent(tx,a,'supplier.stage_file',input.idempotencyKey??dedupe,{dedupe},async()=>{
   const raw=await create(tx,a,'source_records',{title:fileName,status:'IMMUTABLE_RAW',...(connectionId?{connection_id:connectionId}:{}),data:{fileName,format,fileHash,content,observedAt:new Date().toISOString(),mappingVersion:profile.mappingVersion}});
   const batch=await create(tx,a,'import_batches',{title:fileName,status:'STAGED',...(connectionId?{connection_id:connectionId}:{}),data:{format,fileName,fileHash,originalId:raw.id,mapping:parsed.mapping,columns:parsed.columns,mappingVersion:profile.mappingVersion,profileId:profile.profileId,pricePolicy:profile.pricePolicy,totalRows:parsed.rows.length,validRows:parsed.rows.filter(x=>x.outcome!=='RED').length,invalidRows:parsed.rows.filter(x=>x.outcome==='RED').length,quoteOnlyRows:parsed.rows.filter(x=>x.normalized.cost===null||x.normalized.freight===null).length}});
   const rows:Row[]=[];
   for(let i=0;i<parsed.rows.length;i++){const row=parsed.rows[i];rows.push(await create(tx,a,'import_rows',{title:row.normalized.name||`Row ${i+1}`,status:row.outcome,batch_id:batch.id,data:{...row,rowNumber:i+1}}));}
   await event(tx,a,'supplier.import_staged',batch.id,{totalRows:rows.length,invalidRows:batch.data.invalidRows,fileHash});return {...batch,rows};
  });
 }
 if(action==='preview_mapping'){
  const batch=await get(tx,a,'import_batches',input.id,true);if(!['STAGED','VALIDATED'].includes(batch.status))fail('INVALID_TRANSITION');
  const rows=await batchRows(tx,a,batch.id);const validated=await update(tx,a,'import_batches',batch.id,{status:'VALIDATED'});
  await event(tx,a,'supplier.import_validated',batch.id,{validRows:batch.data.validRows,invalidRows:batch.data.invalidRows});return {batch:validated,rows,affectedCounts:{newOrUpdatedSources:Number(batch.data.validRows),errors:Number(batch.data.invalidRows),autoPublished:0}};
 }
 if(action==='review_import'){
  const batch=await get(tx,a,'import_batches',input.id,true);if(batch.status!=='VALIDATED')fail('INVALID_TRANSITION');if(Number(batch.data.invalidRows)>0)fail('IMPORT_ERRORS_REQUIRE_CORRECTED_FILE');
  const next=await update(tx,a,'import_batches',batch.id,{status:'REVIEWED',data:{...batch.data,reviewedBy:a.userId,reviewedAt:new Date().toISOString()}});await event(tx,a,'supplier.import_reviewed',batch.id,{reason:String(input.reason??'Mapped source evidence reviewed')});return next;
 }
 if(action==='commit_import'){
  return idempotent(tx,a,'supplier.commit_import',input.idempotencyKey??`commit:${text(input.id)}`,{id:input.id},async()=>{
   const batch=await get(tx,a,'import_batches',input.id,true);if(batch.status!=='REVIEWED')fail('IMPORT_REVIEW_REQUIRED');if(Number(batch.data.invalidRows)>0)fail('IMPORT_HAS_INVALID_ROWS');
   const rows=await batchRows(tx,a,batch.id);const createdProducts:string[]=[],createdVariants:string[]=[],createdOffers:string[]=[],mergeIssues:string[]=[];
   let connectionId=typeof batch.connection_id==='string'?batch.connection_id:undefined;
   if(!connectionId){const conn=await create(tx,a,'connections',{title:`${batch.data.format} import source`,status:'VALIDATED',data:{providerType:batch.data.format,environment:'mock',verification:'MOCKED',writeEnabled:false}});connectionId=conn.id;}
   for(const row of rows){const n=object(row.data.normalized) as unknown as NormalizedProduct;const normalized={...n};
    const candidates=(await tx.query('select * from app.products where tenant_id=$1 and workspace_id=$2 and ((data->>\'brand\'=$3 and data->>\'mpn\'=$4 and $4<>\'\') or (data->>\'sourceIdentity\'=$5)) for update',[a.tenantId,a.workspaceId,n.brand,n.mpn,`${connectionId}:${n.sourceId}`])).rows as Row[];
    if(candidates.length>1)fail('AMBIGUOUS_PRODUCT_IDENTITY');let product=candidates[0];
    if(product&&product.title!==n.name){const ownership=object(product.data.fieldOwnership);if(ownership.title==='TENANT'){const issue=await create(tx,a,'merge_reviews',{title:'Curated title conflicts with supplier observation',status:'OPEN',product_id:product.id,connection_id:connectionId,data:{field:'title',curatedValue:product.title,suggestedValue:n.name,sourceRowId:row.id,sourceHash:n.rawHash}});mergeIssues.push(issue.id);}else product=await update(tx,a,'products',product.id,{title:n.name});}
    if(!product){product=await create(tx,a,'products',{title:n.name,status:'DRAFT',data:{sku:`IMP-${hash(`${connectionId}:${n.sourceId}`).slice(0,10).toUpperCase()}`,brand:n.brand,mpn:n.mpn,gtin:n.gtin,gtinVerified:false,sourceIdentity:`${connectionId}:${n.sourceId}`,category:'PROMO',minimumQuantity:n.moq,description:'Imported supplier product. Review all merchandising, licensing and configuration before publishing.',methods:['screen_print'],locations:['front'],fieldOwnership:{title:'SUPPLIER'},image:null,publishEligibility:'REQUEST_QUOTE_ONLY',licenseApproved:false}});createdProducts.push(product.id);}
    let variant=(await tx.query('select * from app.variants where tenant_id=$1 and workspace_id=$2 and product_id=$3 and data->>\'partId\'=$4',[a.tenantId,a.workspaceId,product.id,n.sourceId])).rows[0] as Row|undefined;
    if(variant&&((variant.data.color??'')!==n.color||(variant.data.size??'')!==n.size))fail('SOURCE_VARIANT_MAPPING_CONFLICT');
    if(!variant){variant=await create(tx,a,'variants',{title:[n.name,n.color,n.size].filter(Boolean).join(' · '),status:'DRAFT',product_id:product.id,data:{partId:n.sourceId,color:n.color||'Unspecified',hex:'#64748b',size:n.size||'One size',image:n.image,stock:n.inventory===null?null:Number(n.inventory)}});createdVariants.push(variant.id);}
    const offer=await create(tx,a,'supplier_offers',{title:'Imported source offer',status:'CURRENT',product_id:product.id,variant_id:variant.id,connection_id:connectionId,data:{sourceId:n.sourceId,unitCost:n.cost,currency:n.currency,minimumQuantity:n.moq,priceBreaks:n.priceBreaks??(n.cost?[{quantity:n.moq,unitCost:n.cost}]:[]),freight:n.freight??object(batch.data.pricePolicy).defaultFreight??null,weight:n.weight,decorationCost:object(batch.data.pricePolicy).defaultDecorationCost??null,setupCost:object(batch.data.pricePolicy).defaultSetupCost??null,costPolicyEvidence:'MANUAL_OPERATOR_POLICY',observedAt:new Date().toISOString(),validUntil:null,verification:'MOCKED',sourceHash:n.rawHash,mappingVersion:batch.data.mappingVersion,sourceRowId:row.id,pricePolicy:batch.data.pricePolicy,quoteOnly:n.cost===null||n.freight===null}});createdOffers.push(offer.id);
    await create(tx,a,'source_records',{title:n.sourceId,status:'NORMALIZED',connection_id:connectionId,product_id:product.id,variant_id:variant.id,data:{...normalized,batchId:batch.id,sourceRowId:row.id,mappingVersion:batch.data.mappingVersion,rawHash:n.rawHash}});
   }
   const manifest=await create(tx,a,'catalog_rollback_manifests',{title:`Import ${batch.title}`,status:'AVAILABLE',batch_id:batch.id,data:{createdProducts,createdVariants,createdOffers,mergeIssues,publishedProducts:[],snapshotHash:hash({createdProducts,createdVariants,createdOffers})}});
   const committed=await update(tx,a,'import_batches',batch.id,{status:'COMMITTED',data:{...batch.data,committedBy:a.userId,committedAt:new Date().toISOString(),rollbackManifestId:manifest.id}});await event(tx,a,'supplier.import_committed',batch.id,{sources:rows.length,mergeIssues:mergeIssues.length,published:0,manifestId:manifest.id});return {batch:committed,manifest,counts:{createdProducts:createdProducts.length,createdVariants:createdVariants.length,createdOffers:createdOffers.length,mergeIssues:mergeIssues.length,published:0}};
  });
 }
 if(action==='rollback_import'){
  return idempotent(tx,a,'supplier.rollback_import',input.idempotencyKey??`rollback:${text(input.id)}`,{id:input.id},async()=>{
   const batch=await get(tx,a,'import_batches',input.id,true);if(batch.status!=='COMMITTED')fail('IMPORT_NOT_COMMITTED');const manifest=await get(tx,a,'catalog_rollback_manifests',batch.data.rollbackManifestId,true);if(manifest.status!=='AVAILABLE')fail('ROLLBACK_ALREADY_APPLIED');
   for(const id of manifest.data.createdProducts as string[]){const product=await get(tx,a,'products',id);if(product.status==='PUBLISHED')fail('PUBLISHED_PRODUCT_REQUIRES_CATALOG_ROLLBACK');await update(tx,a,'products',id,{status:'ARCHIVED'});}
   for(const id of manifest.data.createdVariants as string[])await update(tx,a,'variants',id,{status:'ARCHIVED'});
   for(const id of manifest.data.createdOffers as string[])await update(tx,a,'supplier_offers',id,{status:'ROLLED_BACK'});
   await update(tx,a,'catalog_rollback_manifests',manifest.id,{status:'ROLLED_BACK'});await update(tx,a,'import_batches',batch.id,{data:{...batch.data,rollbackAppliedAt:new Date().toISOString()}});await event(tx,a,'supplier.import_rolled_back',batch.id,{manifestId:manifest.id});return {rolledBack:true,manifestId:manifest.id};
  });
 }
 if(action==='schedule_sync'){
  const connection=await get(tx,a,'connections',input.id,true);if(connection.data.providerType==='SHOPIFY')fail('SHOPIFY_INSTALLATION_REQUIRED',403);const s=object(input.schedule);const schedule={catalogMinutes:number(s.catalogMinutes??1440,60,525600),priceMinutes:number(s.priceMinutes??60,15,525600),inventoryMinutes:number(s.inventoryMinutes??15,5,525600),statusMinutes:number(s.statusMinutes??15,5,525600)};
  const nextSyncAt=new Date(Date.now()+Math.min(...Object.values(schedule))*60000).toISOString();const next=await update(tx,a,'connections',connection.id,{data:{...connection.data,schedule,nextSyncAt}});await event(tx,a,'supplier.sync_scheduled',connection.id,{schedule,nextSyncAt});return connectionSummary(next);
 }
 if(action==='sync_now'){
  const connection=await get(tx,a,'connections',input.id,true);if(connection.data.providerType==='SHOPIFY')fail('SHOPIFY_USE_EXPLICIT_DEMO_IMPORT',400);const failed=Boolean(input.simulateFailure)||connection.data.environment!=='mock'||connection.status==='DISABLED';
  const run=await create(tx,a,'sync_runs',{title:`Sync ${connection.title}`,status:failed?'FAILED':'COMPLETE',connection_id:connection.id,data:{verification:failed?'BLOCKED':'MOCKED',observedAt:new Date().toISOString(),reason:failed?'Supplier unavailable or service profile not authorized. Last published catalog remains unchanged.':'Mock provider returned deterministic safe evidence. Nothing automatically published.',attempts:1,rawHash:failed?null:hash(`mock:${connection.id}`)}});
  await update(tx,a,'connections',connection.id,{data:{...connection.data,lastSyncAt:new Date().toISOString(),freshness:failed?'STALE':'MOCKED_CURRENT'}});
  if(failed)await create(tx,a,'exceptions',{title:'Supplier sync failed; published catalog retained',status:'OPEN',connection_id:connection.id,data:{severity:'HIGH',syncRunId:run.id,nextAction:'Review credentials, capability and approved endpoint; then run a read-only test.'}});
  await event(tx,a,failed?'supplier.sync_failed':'supplier.sync_completed',connection.id,{runId:run.id,verification:failed?'BLOCKED':'MOCKED'});return run;
 }
 if(action==='disable'){
  const connection=await get(tx,a,'connections',input.id,true);const next=await update(tx,a,'connections',connection.id,{status:'DISABLED'});await event(tx,a,'supplier.connection_disabled',connection.id);return connectionSummary(next);
 }
 return fail('SUPPLIER_COMMAND_UNSUPPORTED',400);
}
