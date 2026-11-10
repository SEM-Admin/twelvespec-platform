import { beforeAll,describe,expect,it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { actors } from '../helpers';
import { create,get,list,transaction, type Actor,type Input,type Row } from '../../packages/kernel/src/index';
import { handleSupplier,connectionSummary } from '../../packages/supplier/src/index';
import { handleCatalog,publicProduct } from '../../packages/catalog/src/index';

let owner:Actor,customer:Actor,otherOwner:Actor;
beforeAll(async()=>{({owner,customer,otherOwner}=await actors());});
const unique=(prefix:string)=>`${prefix}-${randomUUID()}`;
const supplier=(a:Actor,action:string,input:Input)=>transaction(a,tx=>handleSupplier(tx,a,action,input));
const catalog=(a:Actor,action:string,input:Input)=>transaction(a,tx=>handleCatalog(tx,a,action,input));
const asRow=(value:unknown)=>value as Row;
const data=(value:unknown)=>value as Input;
async function connection(providerType='CSV'){
 return asRow(await supplier(owner,'create_connection',{providerType,displayName:unique('Acceptance supplier'),environment:'mock'}));
}
async function importCSV(content:string,connectionId?:string){
 const staged=asRow(await supplier(owner,'stage_file',{format:'CSV',content,fileName:'acceptance.csv',...(connectionId?{connectionId}:{}),idempotencyKey:unique('stage')}));
 await supplier(owner,'preview_mapping',{id:staged.id});await supplier(owner,'review_import',{id:staged.id,reason:'Synthetic acceptance fixture reviewed'});
 const committed=data(await supplier(owner,'commit_import',{id:staged.id,idempotencyKey:unique('commit')}));
 return {staged,committed};
}
async function fixtureProduct(title:string,extra:Input={}){
 return transaction(owner,async tx=>{
  const product=await create(tx,owner,'products',{title,status:'DRAFT',data:{sku:unique('ACCEPT'),category:'APPAREL',brand:'Acceptance Brand',description:'Synthetic fixture',minimumQuantity:12,methods:['screen_print'],locations:['front'],image:'/products/acceptance-navy.png',licenseApproved:true,synthetic:true,fieldOwnership:{title:'TENANT'},...extra}});
  const variant=await create(tx,owner,'variants',{title:`${title} Navy M`,status:'DRAFT',product_id:product.id,data:{partId:unique('PART'),color:'Navy',hex:'#123456',size:'M',image:'/products/acceptance-navy.png',stock:1000}});
  return {product,variant};
 });
}

describe('Persisted supplier credential and capability acceptance',()=>{
 it('A03: stores an opaque encrypted credential reference; service DTO and audit contain no secret',async()=>{
  const conn=await connection('PROMOSTANDARDS_SOAP'),secret=unique('synthetic-credential');
  const response=await supplier(owner,'save_secret',{id:conn.id,secret});
  const serialized=JSON.stringify(response);expect(serialized).not.toContain(secret);expect(serialized).not.toContain('secretReference');expect(serialized).not.toContain('local-vault:');
  const persisted=await transaction(owner,tx=>get(tx,owner,'connections',conn.id));
  expect(persisted.status).toBe('CREDENTIALS_SAVED');expect(persisted.data.secretReference).toMatch(/^local-vault:/);expect(persisted.data.maskedHint).toBe(`••••${secret.slice(-4)}`);
  expect(JSON.stringify(connectionSummary(persisted))).not.toMatch(/local-vault:|secretReference/);
  const audit=await transaction(owner,tx=>list(tx,owner,'audit_events',1000));const saved=audit.filter(r=>r.title==='supplier.credential_replaced'&&r.data.entityId===conn.id);
  expect(saved).toHaveLength(1);expect(JSON.stringify(saved)).not.toContain(secret);
  await expect(supplier(customer,'save_secret',{id:conn.id,secret:'customer-must-not-write'})).rejects.toThrow('PERMISSION_DENIED');
  await expect(supplier(otherOwner,'save_secret',{id:conn.id,secret:'cross-tenant-must-not-write'})).rejects.toThrow('NOT_FOUND');
 });
 it('A04: invalid inventory service leaves independent product service MOCKED',async()=>{
  const conn=await connection('PROMOSTANDARDS_SOAP');await supplier(owner,'save_secret',{id:conn.id,secret:'synthetic-only'});
  const response=data(await supplier(owner,'test_connection',{id:conn.id,simulateFailure:'inventory'}));
  expect(data(response.connection).status).toBe('PARTIALLY_CAPABLE');
  const caps=await transaction(owner,async tx=>(await list(tx,owner,'capabilities',1000)).filter(r=>r.connection_id===conn.id));
  expect(caps.find(r=>r.data.capability==='inventory')?.status).toBe('BLOCKED');expect(caps.find(r=>r.data.capability==='product_data')?.status).toBe('MOCKED');
  expect(caps.some(r=>['SANDBOX_VERIFIED','LIVE_VERIFIED'].includes(r.status))).toBe(false);
  await supplier(owner,'configure_service',{id:conn.id,capability:'inventory',serviceVersion:'9.9.9',endpointUrl:'https://promostandards.ssactivewear.com/unverified-profile'});
  const unsupported=data(await supplier(owner,'test_connection',{id:conn.id}));expect((unsupported.capabilities as Input[]).find(c=>c.capability==='inventory')?.verification).toBe('BLOCKED');
 });
 it('A33: unsupported proprietary adapter and SmartLink authorization never fabricate service support',async()=>{
  await expect(supplier(owner,'create_connection',{providerType:'UNKNOWN_UNREGISTERED_PROTOCOL',displayName:'Unknown adapter',environment:'mock'})).rejects.toThrow('ADAPTER_UNSUPPORTED_USE_FILE_IMPORT');
  const rest=await connection('GENERIC_REST');await supplier(owner,'save_secret',{id:rest.id,secret:'synthetic-api-key'});
  const result=data(await supplier(owner,'test_connection',{id:rest.id}));expect((result.capabilities as Input[]).every(c=>c.verification==='BLOCKED')).toBe(true);
  const asi=await connection('ASI_SMARTLINK');await supplier(owner,'save_secret',{id:asi.id,secret:'synthetic-ESP-website-access-does-not-authorize-API'});
  const entitlement=data(await supplier(owner,'test_connection',{id:asi.id}));expect((entitlement.capabilities as Input[]).every(c=>c.verification==='BLOCKED')).toBe(true);
 });
});

describe('Persisted mapped imports, raw lineage and review gates',()=>{
 it('A05: valid CSV stages immutable raw evidence, retains mapping, requires review, and commits without publication',async()=>{
  const conn=await connection(),sku=unique('SOURCE'),content=`sku,name,brand,mpn,color,size,currency,cost,moq,freight\n${sku},Synthetic tote,Acceptance Brand,${sku},Navy,One size,USD,4.25,24,12.00\n`;
  const key=unique('stage'),input={format:'CSV',content,fileName:'totes.csv',connectionId:conn.id,idempotencyKey:key};
  const staged=asRow(await supplier(owner,'stage_file',input));const duplicate=asRow(await supplier(owner,'stage_file',input));expect(duplicate.id).toBe(staged.id);expect(staged.status).toBe('STAGED');expect(staged.data.mappingVersion).toBe(1);
  const raw=await transaction(owner,tx=>get(tx,owner,'source_records',staged.data.originalId));expect(raw.data.content).toBe(content);expect(raw.data.fileHash).toBe(staged.data.fileHash);
  await expect(supplier(owner,'commit_import',{id:staged.id,idempotencyKey:unique('premature')})).rejects.toThrow('IMPORT_REVIEW_REQUIRED');
  const preview=data(await supplier(owner,'preview_mapping',{id:staged.id}));expect((preview.rows as Row[])[0].data.outcome).toBe('GREEN');expect(data(preview.affectedCounts).autoPublished).toBe(0);
  await supplier(owner,'review_import',{id:staged.id,reason:'Synthetic row mapping and source evidence reviewed'});
  const commitKey=unique('commit'),result=data(await supplier(owner,'commit_import',{id:staged.id,idempotencyKey:commitKey}));
  const repeated=data(await supplier(owner,'commit_import',{id:staged.id,idempotencyKey:commitKey}));expect(data(repeated.batch).id).toBe(staged.id);
  expect(data(result.counts).published).toBe(0);expect(data(result.counts).createdProducts).toBe(1);
  const manifest=asRow(result.manifest),createdIds=manifest.data.createdProducts as string[];const product=await transaction(owner,tx=>get(tx,owner,'products',createdIds[0]));expect(product.status).toBe('DRAFT');
  const offers=await transaction(owner,async tx=>(await list(tx,owner,'supplier_offers',1000)).filter(r=>r.data.sourceId===sku));expect(offers).toHaveLength(1);expect(offers[0].data.mappingVersion).toBe(1);expect(offers[0].data.sourceHash).toBeTruthy();
  const rolled=data(await supplier(owner,'rollback_import',{id:staged.id,idempotencyKey:unique('rollback')}));expect(rolled.rolledBack).toBe(true);expect((await transaction(owner,tx=>get(tx,owner,'products',createdIds[0]))).status).toBe('ARCHIVED');
 });
 it('A06: XML with a DTD is rejected before any source, batch, or event is written',async()=>{
  const marker=unique('malicious'),before=await transaction(owner,async tx=>Number((await tx.query('select count(*) n from app.import_batches where tenant_id=$1 and workspace_id=$2',[owner.tenantId,owner.workspaceId])).rows[0].n));
  await expect(supplier(owner,'stage_file',{format:'XML',content:'<!DOCTYPE x [<!ENTITY ex SYSTEM "http://127.0.0.1/private">]><products><product><sku>'+marker+'</sku><name>&ex;</name></product></products>',fileName:'malicious.xml'})).rejects.toThrow('XML_DTD_FORBIDDEN');
  const after=await transaction(owner,async tx=>Number((await tx.query('select count(*) n from app.import_batches where tenant_id=$1 and workspace_id=$2',[owner.tenantId,owner.workspaceId])).rows[0].n));expect(after).toBe(before);
 });
 it('A07: duplicate source identities keep raw evidence and row errors but cannot commit',async()=>{
  const id=unique('DUP'),content=`sku,name,currency,cost,moq,freight\n${id},First,USD,1.00,12,5.00\n${id},Conflicting duplicate,USD,1.10,12,5.00`;
  const batch=asRow(await supplier(owner,'stage_file',{format:'CSV',content,fileName:'duplicates.csv'}));expect(batch.data.invalidRows).toBe(1);
  const preview=data(await supplier(owner,'preview_mapping',{id:batch.id}));const rows=preview.rows as Row[];expect(rows).toHaveLength(2);expect(rows.some(r=>(r.data.issues as Input[]).some(i=>i.code==='DUPLICATE_SOURCE_ID'))).toBe(true);
  await expect(supplier(owner,'review_import',{id:batch.id})).rejects.toThrow('IMPORT_ERRORS_REQUIRE_CORRECTED_FILE');
  expect((await transaction(owner,tx=>get(tx,owner,'import_batches',batch.id))).status).toBe('VALIDATED');
 });
 it('A08: upstream title changes create a merge review and preserve curated canonical copy',async()=>{
  const identity=unique('MODEL'),brand=unique('Brand'),fixture=await fixtureProduct('Human-curated customer title',{brand,mpn:identity}),conn=await connection();
  const content=`sku,name,brand,mpn,color,size,currency,cost,moq,freight\n${identity}-NAV,Upstream raw supplier title,${brand},${identity},Navy,M,USD,5.00,12,10.00`;
  const imported=await importCSV(content,conn.id);expect(data(imported.committed.counts).createdProducts).toBe(0);expect(data(imported.committed.counts).mergeIssues).toBe(1);
  const current=await transaction(owner,tx=>get(tx,owner,'products',fixture.product.id));expect(current.title).toBe('Human-curated customer title');
  const issues=await transaction(owner,async tx=>(await list(tx,owner,'merge_reviews',1000)).filter(r=>r.product_id===fixture.product.id));expect(issues).toHaveLength(1);expect(issues[0].data.curatedValue).toBe(current.title);expect(issues[0].data.suggestedValue).toBe('Upstream raw supplier title');expect(issues[0].data.sourceHash).toBeTruthy();
 });
});

describe('Bulk catalog review, publication and failure retention',()=>{
 it('A10: previews and publishes 100 scoped products with authorization, revision and rollback evidence',async()=>{
  const prefix=unique('Bulk acceptance'),selected:string[]=[];
  await transaction(owner,async tx=>{for(let i=0;i<100;i++){
   const p=await create(tx,owner,'products',{title:`${prefix} ${i}`,status:'DRAFT',data:{sku:`${prefix}-${i}`,category:'PROMO',brand:'Acceptance Brand',description:'Original synthetic copy',minimumQuantity:12,methods:['screen_print'],locations:['front'],image:'/products/acceptance-navy.png',licenseApproved:true,synthetic:true}});selected.push(p.id);
   await create(tx,owner,'variants',{title:`${p.title} Navy`,product_id:p.id,status:'DRAFT',data:{color:'Navy',hex:'#123456',size:'One size',image:'/products/acceptance-navy.png'}});
  }});
  const changes={description:'Bulk reviewed synthetic copy'},dry=data(await catalog(owner,'bulk_change',{ids:selected,changes,dryRun:true}));expect(dry.affectedCount).toBe(100);
  expect((await transaction(owner,tx=>get(tx,owner,'products',selected[0]))).data.description).toBe('Original synthetic copy');
  await expect(catalog(customer,'bulk_change',{ids:selected,changes,dryRun:false,previewHash:dry.previewHash,idempotencyKey:unique('unauthorized')})).rejects.toThrow('PERMISSION_DENIED');
  await catalog(owner,'bulk_change',{ids:selected,changes,dryRun:false,previewHash:dry.previewHash,idempotencyKey:unique('bulk')});
  const publishPreview=data(await catalog(owner,'publish',{ids:selected,dryRun:true}));expect(publishPreview.eligible).toHaveLength(100);expect(publishPreview.blocked).toEqual([]);
  const published=data(await catalog(owner,'publish',{ids:selected,dryRun:false,previewHash:publishPreview.previewHash,idempotencyKey:unique('publish'),approvalReason:'Synthetic-only local acceptance publication approved'}));expect(published.published).toBe(100);
  const count=await transaction(owner,async tx=>Number((await tx.query("select count(*) n from app.products where tenant_id=$1 and workspace_id=$2 and id=any($3::uuid[]) and status='PUBLISHED'",[owner.tenantId,owner.workspaceId,selected])).rows[0].n));expect(count).toBe(100);
  const revision=await transaction(owner,tx=>get(tx,owner,'catalog_revisions',published.revisionId));expect(revision.status).toBe('PUBLISHED');expect(revision.data.rollbackManifestId).toBe(published.rollbackManifestId);
  const rollback=data(await catalog(owner,'rollback',{id:published.rollbackManifestId,idempotencyKey:unique('rollback')}));expect(rollback.count).toBe(100);expect((await transaction(owner,tx=>get(tx,owner,'products',selected[0]))).status).toBe('DRAFT');
 });
 it('A38: failed supplier sync retains the last safe published product snapshot and exposes remediation',async()=>{
  const fixture=await fixtureProduct(unique('Safe published title')),conn=await connection('PROMOSTANDARDS_SOAP');
  const preview=data(await catalog(owner,'publish',{ids:[fixture.product.id],dryRun:true}));await catalog(owner,'publish',{ids:[fixture.product.id],dryRun:false,previewHash:preview.previewHash,idempotencyKey:unique('publish'),approvalReason:'Synthetic preview only'});
  const before=await transaction(owner,async tx=>publicProduct(await get(tx,owner,'products',fixture.product.id),[fixture.variant]));
  await catalog(owner,'update',{id:fixture.product.id,title:'Unreviewed supplier draft title',data:{description:'New copy awaiting publication review'}});
  const run=asRow(await supplier(owner,'sync_now',{id:conn.id,simulateFailure:true}));expect(run.status).toBe('FAILED');
  const after=await transaction(owner,async tx=>publicProduct(await get(tx,owner,'products',fixture.product.id),[fixture.variant]));expect(after).toEqual(before);
  const persisted=await transaction(owner,tx=>get(tx,owner,'connections',conn.id));expect(persisted.data.freshness).toBe('STALE');
  const exceptions=await transaction(owner,async tx=>(await list(tx,owner,'exceptions',1000)).filter(r=>r.connection_id===conn.id));expect(exceptions).toHaveLength(1);expect(exceptions[0].data.nextAction).toContain('read-only test');
 });
});
