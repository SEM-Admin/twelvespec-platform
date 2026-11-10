import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import sharp from 'sharp';
import {actors} from '../helpers';
import {pool,transaction,create,get,type Actor,type Row} from '../../packages/kernel/src';
import {handleWebsite,initializeWebsite,websiteWorkspace} from '../../packages/marketing/src/website';
import {saveWebsiteDocument} from '../../packages/marketing/src/website/documents';
import {publishWebsiteChanges} from '../../packages/marketing/src/website/releases';
import {readPublishedWebsite,withWebsiteReader,publicCatalogPage} from '../../packages/marketing/src/website/repository';
import {handleStores} from '../../packages/stores/src';
import type {PageDocument} from '../../packages/contracts/src/website';
import type {WebsiteRecord,WebsiteRevision,WebsiteSite} from '../../packages/marketing/src/website/model';

let owner:Actor,customer:Actor,otherOwner:Actor,site:WebsiteSite,marketing:Actor,manager:Actor;
beforeAll(async()=>{
 ({owner,customer,otherOwner}=await actors());
 site=await transaction(owner,async tx=>(await websiteWorkspace(tx,owner)).site!);
 const users=(await pool().query("select m.user_id,m.role from memberships m where m.tenant_id=$1 and m.workspace_id=$2 and m.role='manager'",[owner.tenantId,owner.workspaceId])).rows;manager={...owner,userId:users[0].user_id,role:'manager'};
 const id=crypto.randomUUID();await pool().query('insert into "user"(id,name,email) values($1,$2,$3)',[id,'Editorial test',`editor-${id}@example.test`]);await pool().query('insert into memberships(user_id,tenant_id,workspace_id,role)values($1,$2,$3,$4)',[id,owner.tenantId,owner.workspaceId,'marketing']);marketing={...owner,userId:id,role:'marketing'};
});
afterAll(async()=>{await pool().end()});
const identity=()=>({tenantId:owner.tenantId,workspaceId:owner.workspaceId});
async function draft(actor=owner,title='Test page'){
 return transaction(actor,tx=>handleWebsite(tx,actor,'create_page',{siteId:site.id,title,path:'/test-'+crypto.randomUUID()})) as Promise<{record:WebsiteRecord;revision:WebsiteRevision}>;
}
async function publish(record:WebsiteRecord,revision:WebsiteRevision){
 return transaction(owner,async tx=>{const latest=await get(tx,owner,'websites',site.id) as WebsiteSite;return publishWebsiteChanges(tx,owner,{siteId:site.id,expectedGeneration:latest.generation,changes:[{documentId:record.id,revisionId:revision.id,expectedRevision:record.revision}],approveSelected:true,reason:'Synthetic acceptance publication'});});
}
describe('Real editorial persistence and published-only access',()=>{
 it('CMS-001 saves drafts without changing public content or deploying code',async()=>{const result=await draft();const page=result.revision.data.document as PageDocument;const publicView=await readPublishedWebsite(identity(),page.path);expect(publicView?.page).toBeNull();expect(result.record.head_revision_id).toBe(result.revision.id);expect(result.revision.data.hash).toHaveLength(64);});
 it('CMS-039/041 preserves collection order and rejects a stale merchandising save',async()=>{
  const catalog=await withWebsiteReader(identity(),tx=>publicCatalogPage(tx,identity(),{pageSize:3}));
  const input={siteId:site.id,title:'Canonical ordered collection',slug:'ordered-'+crypto.randomUUID(),description:'Synthetic ordered assortment',seoTitle:'Ordered assortment',seoDescription:'Synthetic catalog acceptance',items:catalog.products.map(product=>({productId:product.id,hidden:false,featured:false})).reverse()};
  const first=await transaction(owner,tx=>handleWebsite(tx,owner,'save_collection',input)) as Row;
  const current=await transaction(owner,tx=>handleWebsite(tx,owner,'save_collection',{...input,id:first.id,expectedRevision:first.revision,title:'Updated collection'})) as Row;
  await expect(transaction(owner,tx=>handleWebsite(tx,owner,'save_collection',{...input,id:first.id,expectedRevision:first.revision,title:'Stale edit'}))).rejects.toThrow('REVISION_CONFLICT');
  const page=await withWebsiteReader(identity(),tx=>publicCatalogPage(tx,identity(),{collection:first.id,pageSize:3}));expect(page.products.map(product=>product.id)).toEqual(input.items.map(item=>item.productId));
  const retained=await transaction(owner,tx=>get(tx,owner,'collections',first.id));expect(retained.title).toBe('Updated collection');expect(retained.revision).toBe(current.revision);
 });
 it('CMS-002 prevents duplicate normalized paths within a site',async()=>{const first=await draft();await expect(transaction(owner,tx=>handleWebsite(tx,owner,'create_page',{siteId:site.id,title:'Duplicate',path:(first.revision.data.document as PageDocument).path.toUpperCase()+'/'}))).rejects.toThrow();});
 it('CMS-022 publishes only selected changes while preserving unrelated drafts',async()=>{const first=await draft(owner,'Selected'),second=await draft(owner,'Still private');await publish(first.record,first.revision);expect((await readPublishedWebsite(identity(),(first.revision.data.document as PageDocument).path))?.page?.title).toBe('Selected');expect((await readPublishedWebsite(identity(),(second.revision.data.document as PageDocument).path))?.page).toBeNull();});
 it('CMS-024 rejects stale saves atomically without dropping either revision',async()=>{
  const first=await draft();const document=structuredClone(first.revision.data.document);document.title='First editor';
  const saved=await transaction(owner,tx=>saveWebsiteDocument(tx,owner,{id:first.record.id,expectedRevision:first.record.revision,document}));
  await expect(transaction(owner,tx=>saveWebsiteDocument(tx,owner,{id:first.record.id,expectedRevision:first.record.revision,document:{...document,title:'Second editor'}}))).rejects.toThrow('REVISION_CONFLICT');
  const actual=await transaction(owner,tx=>get(tx,owner,'content_assets',first.record.id));expect(actual.head_revision_id).toBe(saved.revision.id);expect(actual.title).toBe('First editor');
 });
 it('CMS-023 approval belongs to the exact immutable revision',async()=>{
  const first=await draft();await transaction(owner,tx=>handleWebsite(tx,owner,'approve_revision',{siteId:site.id,revisionId:first.revision.id,reason:'Reviewed exact revision'}));
  const next=await transaction(owner,tx=>saveWebsiteDocument(tx,owner,{id:first.record.id,expectedRevision:first.record.revision,document:{...first.revision.data.document,title:'Changed after approval'}}));
  await expect(transaction(owner,async tx=>{const latest=await get(tx,owner,'websites',site.id) as WebsiteSite;return publishWebsiteChanges(tx,owner,{siteId:site.id,expectedGeneration:latest.generation,changes:[{documentId:next.record.id,revisionId:next.revision.id,expectedRevision:next.record.revision}],reason:'Try stale approval'});})).rejects.toThrow('WEBSITE_APPROVAL_REQUIRED');
 });
 it('CMS-028 makes content history, references, approvals and releases immutable',async()=>{
  const first=await draft();const published=await publish(first.record,first.revision);
  const reference=await transaction(owner,async tx=>(await tx.query('select id from app.content_references where release_id=$1 limit 1',[published.release.id])).rows[0]);
  for(const [table,id]of [['content_revisions',first.revision.id],['website_releases',published.release.id],['content_references',reference.id]] as const){
   const before=await transaction(owner,tx=>get(tx,owner,table,id));
   try{const result=await transaction(owner,tx=>tx.query(`update app.${table} set title='Tampered' where id=$1`,[id]));expect(result.rowCount).toBe(0);}
   catch(error){expect(error instanceof Error?error.message:'').toContain('IMMUTABLE_RECORD');}
   const after=await transaction(owner,tx=>get(tx,owner,table,id));expect(after.title).toBe(before.title);expect(after.data).toEqual(before.data);
  }
  const approval=await transaction(owner,async tx=>(await tx.query('select id from app.approvals where content_revision_id=$1 and status=\'APPROVED\'',[first.revision.id])).rows[0]);
  await expect(transaction(owner,tx=>tx.query('update app.approvals set data=$2 where id=$1',[approval.id,{hash:'changed'}]))).rejects.toThrow('IMMUTABLE_RECORD');
 });
 it('CMS-003 duplicates a page with new identities and a private draft path',async()=>{const first=await draft();const duplicate=await transaction(owner,tx=>handleWebsite(tx,owner,'duplicate_page',{id:first.record.id})) as {record:WebsiteRecord;revision:WebsiteRevision};expect(duplicate.record.id).not.toBe(first.record.id);const doc=duplicate.revision.data.document as PageDocument;expect(doc.sections[0].id).not.toBe((first.revision.data.document as PageDocument).sections[0].id);expect((await readPublishedWebsite(identity(),doc.path))?.page).toBeNull();});
 it('CMS-004/005 archives through a release and restores a new draft',async()=>{
  const first=await draft();await publish(first.record,first.revision);
  const archived=await transaction(owner,tx=>handleWebsite(tx,owner,'archive_document',{id:first.record.id,expectedRevision:first.record.revision,reason:'Archive test page'})) as {record:WebsiteRecord;revision:WebsiteRevision};
  expect((await readPublishedWebsite(identity(),(first.revision.data.document as PageDocument).path))?.page).not.toBeNull();await publish(archived.record,archived.revision);expect((await readPublishedWebsite(identity(),(first.revision.data.document as PageDocument).path))?.page).toBeNull();
  const restored=await transaction(owner,tx=>handleWebsite(tx,owner,'restore_revision',{id:first.record.id,revisionId:first.revision.id,expectedRevision:archived.record.revision})) as {record:WebsiteRecord;revision:WebsiteRevision};expect(restored.record.status).toBe('DRAFT');expect(restored.revision.id).not.toBe(first.revision.id);
 });
 it('CMS-025 restores a prior page revision without reverting unrelated content',async()=>{
  const first=await draft(owner,'Original'),other=await draft(owner,'Another live page');await publish(first.record,first.revision);await publish(other.record,other.revision);
  const edited=await transaction(owner,tx=>saveWebsiteDocument(tx,owner,{id:first.record.id,expectedRevision:first.record.revision,document:{...first.revision.data.document,title:'Revised'}}));await publish(edited.record,edited.revision);
  const restored=await transaction(owner,tx=>handleWebsite(tx,owner,'restore_revision',{id:first.record.id,revisionId:first.revision.id,expectedRevision:edited.record.revision})) as {record:WebsiteRecord;revision:WebsiteRevision};await publish(restored.record,restored.revision);
  expect((await readPublishedWebsite(identity(),(first.revision.data.document as PageDocument).path))?.page?.title).toBe('Original');expect((await readPublishedWebsite(identity(),(other.revision.data.document as PageDocument).path))?.page?.title).toBe('Another live page');
 });
 it('CMS-029 rejects cross-tenant document reads and references',async()=>{const first=await draft();await expect(transaction(otherOwner,tx=>handleWebsite(tx,otherOwner,'get_document',{id:first.record.id}))).rejects.toThrow('NOT_FOUND');const rows=await withWebsiteReader({tenantId:otherOwner.tenantId,workspaceId:otherOwner.workspaceId},async tx=>(await tx.query('select id from app.content_revisions where id=$1',[first.revision.id])).rows);expect(rows).toEqual([]);});
 it('CMS-019 denies customers all draft tables and editorial commands',async()=>{await expect(transaction(customer,tx=>handleWebsite(tx,customer,'workspace',{}))).rejects.toThrow('WEBSITE_PERMISSION_REQUIRED');const rows=await transaction(customer,async tx=>(await tx.query('select id from app.content_assets where site_id=$1',[site.id])).rows);expect(rows).toEqual([]);});
 it('CMS-067 allows a marketing draft but requires an explicit publisher grant',async()=>{const first=await draft(marketing,'Marketing draft');await expect(transaction(marketing,tx=>handleWebsite(tx,marketing,'publish',{siteId:site.id,idempotencyKey:crypto.randomUUID(),expectedGeneration:site.generation,changes:[{documentId:first.record.id,revisionId:first.revision.id,expectedRevision:first.record.revision}],approveSelected:true,reason:'Unprivileged attempt'}))).rejects.toThrow('WEBSITE_PERMISSION_REQUIRED');await expect(transaction(marketing,tx=>create(tx,marketing,'resource_grants',{title:'Escalation',status:'ACTIVE',data:{kind:'WEBSITE_CAPABILITY',userId:marketing.userId,resourceId:site.id,permission:'PUBLISH'}}))).rejects.toThrow();});
 it('CMS-068 grants and revokes manager access immediately',async()=>{
  const first=await draft();
  await expect(transaction(manager,tx=>handleWebsite(tx,manager,'get_document',{id:first.record.id}))).rejects.toThrow('NOT_FOUND');
  await transaction(owner,tx=>handleWebsite(tx,owner,'grant_capability',{siteId:site.id,userId:manager.userId,permission:'PUBLISH',reason:'Delegated development site publishing'}));expect((await transaction(manager,tx=>handleWebsite(tx,manager,'get_document',{id:first.record.id})) as {record:WebsiteRecord}).record.id).toBe(first.record.id);
  await transaction(owner,tx=>handleWebsite(tx,owner,'grant_capability',{siteId:site.id,userId:manager.userId,permission:'PUBLISH',reason:'Revoke development grant',revoke:true}));await expect(transaction(manager,tx=>handleWebsite(tx,manager,'get_document',{id:first.record.id}))).rejects.toThrow('NOT_FOUND');
 });
 it('CMS-063 anonymous reads never inherit a demo customer’s private-store membership',async()=>{
  const store=await transaction(owner,async tx=>{const s=await handleStores(tx,owner,'create_store',{title:'Private org test',type:'CORPORATE_ON_GOING'}) as Row;await handleStores(tx,owner,'approve',{id:s.id});await handleStores(tx,owner,'add_member',{storeId:s.id,userId:customer.userId});return s;});
  await transaction(owner,tx=>initializeWebsite(tx,owner,store.id));expect(await readPublishedWebsite(identity(),'/',store.id)).toBeNull();expect((await readPublishedWebsite({...identity(),userId:customer.userId},'/',store.id))?.page?.title).toBe('Private org test');
  await transaction(owner,tx=>tx.query("update app.store_memberships set status='INACTIVE' where store_id=$1 and owner_id=$2",[store.id,customer.userId]));expect(await readPublishedWebsite({...identity(),userId:customer.userId},'/',store.id)).toBeNull();
 });
 it('CMS-047/049/052 keeps originals private, publishes only referenced derivatives and honors revocation',async()=>{
  const bytes=await sharp({create:{width:80,height:50,channels:3,background:'#ff3f1a'}}).png().withMetadata().toBuffer();
  const media=await transaction(owner,tx=>handleWebsite(tx,owner,'upload_media',{siteId:site.id,fileName:'Owned demo raster',alt:'Synthetic test raster',content:'data:image/png;base64,'+bytes.toString('base64'),rightsConfirmed:true,rightsNote:'Generated synthetic test image'})) as {id:string};
  const original=await transaction(owner,tx=>get(tx,owner,'assets',media.id));
  expect(await withWebsiteReader(identity(),async tx=>(await tx.query('select id from app.assets where id=any($1::uuid[])',[[media.id,original.original_asset_id]])).rows)).toEqual([]);
  const first=await draft();const document=structuredClone(first.revision.data.document) as PageDocument;document.sections[0].content.imageAssetId=media.id;delete document.sections[0].content.builtInImage;
  const saved=await transaction(owner,tx=>saveWebsiteDocument(tx,owner,{id:first.record.id,expectedRevision:first.record.revision,document}));await publish(saved.record,saved.revision);
  const publicPage=await readPublishedWebsite(identity(),document.path);expect(publicPage?.media[media.id].url).toContain(media.id);
  const originalRows=await withWebsiteReader(identity(),async tx=>(await tx.query('select id from app.assets where id=$1',[original.original_asset_id])).rows);expect(originalRows).toEqual([]);
  const image=await transaction(owner,tx=>get(tx,owner,'assets',media.id));expect((await sharp(image.web_bytes as Buffer).metadata()).exif).toBeUndefined();
  await transaction(owner,tx=>handleWebsite(tx,owner,'revoke_media',{id:media.id,reason:'Permission withdrawn'}));expect((await readPublishedWebsite(identity(),document.path))?.media[media.id]).toBeUndefined();
  await expect(publish(saved.record,saved.revision)).rejects.toThrow('WEBSITE_MEDIA_NOT_APPROVED');
 });
 it('CMS-045/058 public responses contain no private evidence, author, supplier or wholesale data',async()=>{const publicPage=await readPublishedWebsite(identity(),'/');const serialized=JSON.stringify(publicPage);for(const forbidden of ['rightsNote','rightsConfirmedBy','original_asset_id','audienceIds','secret_metadata','wholesalePrice','supplierPassword'])expect(serialized).not.toContain(forbidden);});
 it('CMS-075 public discovery pages are bounded and can reach the final eligible item',async()=>{const result=await withWebsiteReader(identity(),tx=>publicCatalogPage(tx,identity(),{page:1,pageSize:3}));expect(result.products).toHaveLength(3);expect(result.total).toBeGreaterThan(3);const last=await withWebsiteReader(identity(),tx=>publicCatalogPage(tx,identity(),{page:result.totalPages,pageSize:3}));expect(last.products.length).toBeGreaterThan(0);expect(last.page).toBe(result.totalPages);});
});
