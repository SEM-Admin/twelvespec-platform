import {beforeAll,describe,it,expect} from 'vitest';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,readFile,readdir,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {actors} from '../helpers';
import {create,get,list,pool,transaction,hash,type Actor,type Row} from '../../packages/kernel/src';
import {ASSET_STORAGE,MAX_STORED_ASSET_BYTES,assetBytesHash,createStoredAsset,readStoredAssetBytes} from '../../packages/kernel/src/asset-bytes';
import {handleCreative,processMockupJob,readPrivateAsset} from '../../packages/creative/src';
import {handleCatalog} from '../../packages/catalog/src';
import {readCatalogImage,saveCatalogImage} from '../../packages/catalog/src/media';

let owner:Actor,customer:Actor,otherOwner:Actor,anotherCustomer:Actor,png:Buffer;
beforeAll(async()=>{
 ({owner,customer,otherOwner}=await actors());
 const id=randomUUID();
 await pool().query('insert into "user"(id,name,email) values($1,$2,$3)',[id,'Synthetic asset isolation',`asset-${id}@example.invalid`]);
 await pool().query('insert into memberships(user_id,tenant_id,workspace_id,role) values($1,$2,$3,$4)',[id,customer.tenantId,customer.workspaceId,'customer']);
 anotherCustomer={...customer,userId:id};
 png=await sharp({create:{width:32,height:16,channels:4,background:'#123456'}}).withMetadata({density:300}).png().toBuffer();
});
const upload=(fileName=`Original ${randomUUID()}.png`)=>transaction(customer,tx=>handleCreative(tx,customer,'upload_asset',{fileName,mimeType:'image/png',base64:png.toString('base64'),rightsConfirmed:true})) as Promise<Row>;
const catalog=(action:string,input:Record<string,unknown>)=>transaction(owner,tx=>handleCatalog(tx,owner,action,input));

describe('GAP-003 transactional originals, previews and catalog media',()=>{
 it('retains the exact private original and a separately identified, stripped preview',async()=>{
  const asset=await upload();
  const metadata=await transaction(customer,tx=>get(tx,customer,'assets',asset.id));
  const original=await transaction(owner,tx=>readPrivateAsset(tx,owner,asset.id,true));
  const preview=await transaction(customer,tx=>readPrivateAsset(tx,customer,asset.id));
  expect(original.bytes.equals(png)).toBe(true);
  expect(assetBytesHash(original.bytes)).toBe(metadata.data.contentHash);
  expect((await sharp(preview.bytes).metadata()).exif).toBeUndefined();
  expect(preview.bytes.equals(original.bytes)).toBe(false);
  const derivative=await transaction(customer,tx=>get(tx,customer,'assets',metadata.data.previewAssetId));
  expect(derivative.original_asset_id).toBe(asset.id);
  expect(derivative.owner_id).toBe(customer.userId);
  expect(metadata.data.scanStatus).toBe('NOT_CONFIGURED');
  expect(metadata.data.productionReadiness).toBe('BLOCKED');
  expect(JSON.stringify(asset)).not.toMatch(/web_bytes|previewAssetId|objectKey|POSTGRES_BYTEA/);
  expect(metadata).not.toHaveProperty('web_bytes');
  expect((await transaction(customer,tx=>list(tx,customer,'assets'))).every(row=>!('web_bytes' in row))).toBe(true);
 });

 it('recovers originals and previews in a new process with an empty filesystem',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'ts-assets-restart-'));
  try{
   const asset=await upload();
   const script=`const {transaction,pool}=require('./packages/kernel/src/index.ts');
const {readPrivateAsset}=require('./packages/creative/src/index.ts');
const {assetBytesHash}=require('./packages/kernel/src/asset-bytes.ts');
const actor=JSON.parse(process.argv[1]);const id=process.argv[2];
(async()=>{try { const result=await transaction(actor,async tx=>({original:assetBytesHash((await readPrivateAsset(tx,actor,id,true)).bytes),preview:assetBytesHash((await readPrivateAsset(tx,actor,id)).bytes)}));process.stdout.write(JSON.stringify(result)); } finally {await pool().end();}})().catch(()=>{process.stderr.write('Restart asset verification failed');process.exitCode=1;});`;
   const result=await promisify(execFile)(process.execPath,['--import','tsx','-e',script,JSON.stringify(owner),asset.id],{cwd:process.cwd(),env:{...process.env,TWELVESPEC_ASSET_DIR:directory},timeout:15000});
   expect(JSON.parse(result.stdout).original).toBe(assetBytesHash(png));
   const preview=await transaction(customer,tx=>readPrivateAsset(tx,customer,asset.id));
   expect(JSON.parse(result.stdout).preview).toBe(assetBytesHash(preview.bytes));
   expect(await readdir(directory)).toEqual([]);
  }finally{await rm(directory,{recursive:true,force:true});}
 });

 it('denies guessed originals, internal derivative IDs, another buyer and another workspace',async()=>{
  const asset=await upload(),row=await transaction(owner,tx=>get(tx,owner,'assets',asset.id));
  await expect(transaction(customer,tx=>readPrivateAsset(tx,customer,asset.id,true))).rejects.toMatchObject({code:'ORIGINAL_DOWNLOAD_REQUIRES_STAFF_REVIEW'});
  await expect(transaction(customer,tx=>readPrivateAsset(tx,customer,row.data.previewAssetId))).rejects.toMatchObject({code:'NOT_FOUND'});
  for(const actor of [anotherCustomer,otherOwner]){
   await expect(transaction(actor,tx=>readPrivateAsset(tx,actor,asset.id))).rejects.toMatchObject({code:'NOT_FOUND'});
   await expect(transaction(actor,tx=>readStoredAssetBytes(tx,actor,asset.id))).rejects.toMatchObject({code:'NOT_FOUND'});
  }
 });

 it('rolls back original, derivative and event together without filesystem orphans',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'ts-assets-rollback-')),previous=process.env.TWELVESPEC_ASSET_DIR,title=`Rollback ${randomUUID()}`;
  process.env.TWELVESPEC_ASSET_DIR=directory;
  let id='';
  try{
   await expect(transaction(customer,async tx=>{
    const asset=await handleCreative(tx,customer,'upload_asset',{fileName:title,mimeType:'image/png',base64:png.toString('base64'),rightsConfirmed:true}) as Row;id=asset.id;
    throw new Error('Synthetic downstream transaction failure');
   })).rejects.toThrow('Synthetic downstream transaction failure');
   const rows=await pool().query('select id from app.assets where id=$1 or original_asset_id=$1',[id]);
   expect(rows.rowCount).toBe(0);
   expect((await pool().query("select id from app.audit_events where data->>'entityId'=$1",[id])).rowCount).toBe(0);
   await expect(transaction(customer,tx=>handleCreative(tx,customer,'upload_asset',{fileName:title,mimeType:'image/png',base64:Buffer.from([137,80,78,71,13,10,26,10]).toString('base64'),rightsConfirmed:true}))).rejects.toMatchObject({code:'INVALID_OR_OVERSIZED_IMAGE'});
   expect((await pool().query('select id from app.assets where title=$1',[title])).rowCount).toBe(0);
   expect(await readdir(directory)).toEqual([]);
  }finally{if(previous===undefined)delete process.env.TWELVESPEC_ASSET_DIR;else process.env.TWELVESPEC_ASSET_DIR=previous;await rm(directory,{recursive:true,force:true});}
 });

 it('enforces immutable byte identity and rejects preview substitution',async()=>{
  const first=await upload(),second=await upload(),original=await transaction(owner,tx=>get(tx,owner,'assets',first.id)),other=await transaction(owner,tx=>get(tx,owner,'assets',second.id));
  for(const mutation of [
   {sql:'web_bytes=$2',value:Buffer.from('replacement')},
   {sql:"data=jsonb_set(data,'{previewAssetId}',to_jsonb($2::text))",value:other.data.previewAssetId},
   {sql:"data=jsonb_set(data,'{contentHash}',to_jsonb($2::text))",value:'0'.repeat(64)},
   {sql:'owner_id=$2',value:owner.userId},
  ])await expect(transaction(owner,tx=>tx.query(`update app.assets set ${mutation.sql} where id=$1`,[first.id,mutation.value]))).rejects.toThrow('IMMUTABLE_ASSET_BYTES');
  const unbound=await transaction(customer,tx=>createStoredAsset(tx,customer,{title:'Synthetic invalid binding',status:'QUARANTINED',data:{kind:'CREATIVE_ORIGINAL',mimeType:'image/png',previewAssetId:other.data.previewAssetId}},png));
  await expect(transaction(customer,tx=>readPrivateAsset(tx,customer,unbound.id))).rejects.toMatchObject({code:'SAFE_PREVIEW_NOT_AVAILABLE'});
  expect((await transaction(owner,tx=>get(tx,owner,'assets',first.id))).data).toEqual(original.data);
 });

 it('fails closed on missing bytes, bad checksums and unbounded/untagged writes',async()=>{
  for(const bytes of [undefined,png]){
   const broken=await transaction(owner,tx=>create(tx,owner,'assets',{title:'Synthetic damaged record',...(bytes?{web_bytes:bytes}:{}),data:{kind:'CREATIVE_ORIGINAL',storage:ASSET_STORAGE,mimeType:'image/png',bytes:png.length,contentHash:'0'.repeat(64),objectKey:'unused.original'}}));
   await expect(transaction(owner,tx=>readPrivateAsset(tx,owner,broken.id,true))).rejects.toMatchObject({code:bytes?'ASSET_INTEGRITY_FAILED':'ASSET_STORAGE_UNAVAILABLE'});
  }
  await expect(transaction(owner,tx=>createStoredAsset(tx,owner,{title:'Oversized',data:{kind:'CREATIVE_ORIGINAL'}},Buffer.alloc(MAX_STORED_ASSET_BYTES+1)))).rejects.toMatchObject({code:'ASSET_SIZE_LIMIT'});
  await expect(transaction(owner,tx=>create(tx,owner,'assets',{title:'Untagged',web_bytes:png,data:{}}))).rejects.toMatchObject({code:'23514'});
 });

 it('stores PDF originals without inventing a safe preview or manufacturing approval',async()=>{
  const bytes=Buffer.from('%PDF-1.7\nSynthetic opaque file fixture; never execute.'),asset=await transaction(customer,tx=>handleCreative(tx,customer,'upload_asset',{fileName:'source.pdf',mimeType:'application/pdf',base64:bytes.toString('base64'),rightsConfirmed:true})) as Row;
  expect((await transaction(owner,tx=>readPrivateAsset(tx,owner,asset.id,true))).bytes.equals(bytes)).toBe(true);
  await expect(transaction(customer,tx=>readPrivateAsset(tx,customer,asset.id))).rejects.toMatchObject({code:'SAFE_PREVIEW_NOT_AVAILABLE'});
 });

 it('renders persisted image layers into a durable mockup while production release stays blocked',async()=>{
  const asset=await upload();
  const {product,variant}=await transaction(owner,async tx=>{
   const product=await create(tx,owner,'products',{title:'Synthetic durable mockup',status:'PUBLISHED',data:{methods:['screen_print'],locations:['front']}});
   const variant=await create(tx,owner,'variants',{title:'Navy',status:'ACTIVE',product_id:product.id,data:{color:'Navy',hex:'#123456'}});return {product,variant};
  });
  const project=await transaction(customer,tx=>handleCreative(tx,customer,'create',{title:'Durable design',productId:product.id,variantId:variant.id})) as Row;
  await transaction(customer,tx=>handleCreative(tx,customer,'save_design_version',{id:project.id,layers:[{id:'image',type:'image',assetId:asset.id,x:0,y:0,width:1000,height:1000}],placement:{xMm:0,yMm:0,widthMm:100,heightMm:100,location:'front'},physicalWidthMm:100,physicalHeightMm:100,method:'screen_print'}));
  const batch=await transaction(customer,tx=>handleCreative(tx,customer,'render_mockup',{id:project.id,idempotencyKey:randomUUID()})) as {jobs:Row[]};
  const rendered=await transaction(owner,tx=>processMockupJob(tx,owner,batch.jobs[0].id));
  const stored=await transaction(owner,tx=>get(tx,owner,'assets',rendered.data.assetId));
  expect(stored.data.storage).toBe(ASSET_STORAGE);expect(stored.data.verification).toBe('MOCKED');expect(stored.data.productionReadiness).toBe('BLOCKED');
  const image=await transaction(customer,tx=>readPrivateAsset(tx,customer,stored.id));
  expect((await sharp(image.bytes).metadata()).width).toBe(1000);
  await expect(transaction(owner,tx=>handleCreative(tx,owner,'release_production_asset',{id:project.id}))).rejects.toMatchObject({code:'PRODUCTION_VALIDATION_NOT_CONFIGURED'});
 });

 it('retains catalog originals privately and serves only the exact published derivative without local files',async()=>{
  const product=await transaction(owner,tx=>create(tx,owner,'products',{title:`Durable catalog ${randomUUID()}`,data:{sku:randomUUID(),brand:'Synthetic',category:'APPAREL',description:'Synthetic image recovery',minimumQuantity:1,methods:['none'],locations:['front'],licenseApproved:true,synthetic:true}}));
  await transaction(owner,tx=>create(tx,owner,'variants',{title:'One variant',product_id:product.id,status:'ACTIVE',data:{color:'Navy',size:'M',hex:'#123456'}}));
  const input={productId:product.id,content:'data:image/png;base64,'+png.toString('base64'),rightsConfirmed:true};
  const image=await transaction(owner,tx=>saveCatalogImage(tx,owner,input)),metadata=await transaction(owner,tx=>get(tx,owner,'assets',image.id));
  expect(metadata.original_asset_id).toBeTruthy();
  expect((await transaction(owner,tx=>readStoredAssetBytes(tx,owner,metadata.original_asset_id))).equals(png)).toBe(true);
  await expect(transaction(customer,tx=>readCatalogImage(tx,customer,image.id))).rejects.toMatchObject({code:'NOT_FOUND'});
  await catalog('update',{id:product.id,data:{image:image.imagePath}});
  const preview=await catalog('publish',{ids:[product.id]}) as {previewHash:string;blocked:unknown[]};expect(preview.blocked).toEqual([]);
  await catalog('publish',{ids:[product.id],dryRun:false,previewHash:preview.previewHash,approvalReason:'Synthetic image rights reviewed',idempotencyKey:randomUUID()});
  expect((await transaction(customer,tx=>readCatalogImage(tx,customer,image.id))).mimeType).toBe('image/webp');
  await expect(transaction(customer,tx=>readCatalogImage(tx,customer,String(metadata.original_asset_id)))).rejects.toMatchObject({code:'NOT_FOUND'});
  await expect(transaction(customer,tx=>readPrivateAsset(tx,customer,metadata.original_asset_id))).rejects.toMatchObject({code:'NOT_FOUND'});
  await catalog('pause',{id:product.id});
  await expect(transaction(customer,tx=>readCatalogImage(tx,customer,image.id))).rejects.toMatchObject({code:'NOT_FOUND'});
 });

 it('preserves scoped legacy filesystem reads without converting them silently',async()=>{
  const directory=await mkdtemp(join(tmpdir(),'ts-assets-legacy-')),previous=process.env.TWELVESPEC_ASSET_DIR,prefix=`${customer.tenantId}/${customer.workspaceId}/${randomUUID()}`;
  process.env.TWELVESPEC_ASSET_DIR=directory;
  try{
   await mkdir(join(directory,customer.tenantId,customer.workspaceId),{recursive:true,mode:0o700});
   await writeFile(join(directory,prefix+'.original'),png,{mode:0o600});
   await writeFile(join(directory,prefix+'.preview.png'),png,{mode:0o600});
   const asset=await transaction(customer,tx=>create(tx,customer,'assets',{title:'Legacy fixture',status:'QUARANTINED',data:{objectKey:prefix+'.original',previewObjectKey:prefix+'.preview.png',mimeType:'image/png',contentHash:hash(png.toString('base64'))}}));
   expect((await transaction(customer,tx=>readPrivateAsset(tx,customer,asset.id))).bytes.equals(png)).toBe(true);
   expect((await transaction(owner,tx=>readPrivateAsset(tx,owner,asset.id,true))).bytes.equals(await readFile(join(directory,prefix+'.original')))).toBe(true);
   expect((await transaction(owner,tx=>get(tx,owner,'assets',asset.id))).data.storage).toBeUndefined();
  }finally{if(previous===undefined)delete process.env.TWELVESPEC_ASSET_DIR;else process.env.TWELVESPEC_ASSET_DIR=previous;await rm(directory,{recursive:true,force:true});}
 });
});
