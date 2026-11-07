import { beforeAll,describe,it,expect } from 'vitest';
import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import { actors } from '../helpers';
import { type Actor,type Row,type Input,transaction,create,get,list,pool } from '../../packages/kernel/src/index';
import { handleConfiguration } from '../../packages/configuration/src/index';
import { handleCreative,readPrivateAsset,processMockupJob } from '../../packages/creative/src/index';

let owner:Actor,customer:Actor,otherOwner:Actor,secondCustomer:Actor;
let product:Row,variant:Row;
let png:Buffer;
const key=()=>`creative-integration-${randomUUID()}`;
const doc=(assetId?:string)=>({
 layers:assetId?[{id:'logo',type:'image',x:0,y:0,width:1000,height:1000,assetId}]:[{id:'brand-name',type:'text',x:0,y:0,width:1000,height:300,text:'Synthetic customer artwork',fill:'#13243c'}],
 placement:{xMm:0,yMm:0,widthMm:254,heightMm:254,location:'front',bleedMm:3},physicalWidthMm:254,physicalHeightMm:254,method:'screen_print'
});
async function creative(a:Actor,action:string,input:Input){return transaction(a,tx=>handleCreative(tx,a,action,input)) as Promise<Row>;}
async function newDesign(assetId?:string){
 const project=await creative(customer,'create',{title:`Synthetic design ${key()}`,productId:product.id,variantId:variant.id});
 const version=await creative(customer,'save_design_version',{id:project.id,...doc(assetId)});return {project,version};
}
async function upload(){return creative(customer,'upload_asset',{fileName:'synthetic-transparent-logo.png',mimeType:'image/png',base64:png.toString('base64'),rightsConfirmed:true});}

beforeAll(async()=>{
 ({owner,customer,otherOwner}=await actors());
 const userId=randomUUID();
 await pool().query('insert into "user"(id,name,email,"emailVerified") values($1,$2,$3,true)',[userId,'Synthetic second buyer',`second-${userId}@example.invalid`]);
 await pool().query('insert into memberships(user_id,tenant_id,workspace_id,role) values($1,$2,$3,$4)',[userId,customer.tenantId,customer.workspaceId,'customer']);
 secondCustomer={...customer,userId,email:`second-${userId}@example.invalid`};
 ({product,variant}=await transaction(owner,async tx=>{
  const p=await create(tx,owner,'products',{title:`Creative integration product ${key()}`,status:'PUBLISHED',data:{sku:key(),category:'APPAREL',brand:'Synthetic Brand',moq:24,methods:['screen_print','embroidery'],locations:['front','back'],compatibility:{embroidery:['front']},publicationEvidence:'SYNTHETIC'}});
  const v=await create(tx,owner,'variants',{title:'Synthetic Navy / M',product_id:p.id,status:'ACTIVE',data:{productId:p.id,color:'Navy',colorHex:'#102a43',size:'M',available:true}});return {product:p,variant:v};
 }));
 png=await sharp({create:{width:2,height:2,channels:4,background:{r:25,g:80,b:140,alpha:0.6}}}).png().toBuffer();
});

describe('A12–A17 persisted customer configuration and Creative Studio',()=>{
 it('A12 rejects quantity below MOQ and fractional quantities without saving configurations',async()=>{
  const input={productId:product.id,variantId:variant.id,quantity:23,method:'screen_print',location:'front'};
  const before=await transaction(owner,tx=>list(tx,owner,'saved_configurations',1000));
  await expect(transaction(customer,tx=>handleConfiguration(tx,customer,'configure',input))).rejects.toMatchObject({code:'MOQ_NOT_MET'});
  await expect(transaction(customer,tx=>handleConfiguration(tx,customer,'configure',{...input,quantity:24.5}))).rejects.toMatchObject({code:'QUANTITY_MUST_BE_INTEGER'});
  const after=await transaction(owner,tx=>list(tx,owner,'saved_configurations',1000));expect(after.length).toBe(before.length);
  const valid=await transaction(customer,tx=>handleConfiguration(tx,customer,'configure',{...input,quantity:24})) as Row;
  expect(valid.status).toBe('VALIDATED');expect(valid.data.quantity).toBe(24);expect(valid.data.configurationHash).toMatch(/^[a-f0-9]{64}$/);
  expect(valid.data.readiness).toBe('REQUEST_QUOTE_ONLY');
  expect((await transaction(owner,tx=>list(tx,owner,'audit_events',1000))).some(e=>e.title==='configuration.saved'&&e.data.entityId===valid.id)).toBe(true);
 });

 it('A13 enforces method/location compatibility and published rule thresholds server-side',async()=>{
  const input={productId:product.id,variantId:variant.id,quantity:24,method:'embroidery',location:'back'};
  await expect(transaction(customer,tx=>handleConfiguration(tx,customer,'configure',input))).rejects.toMatchObject({code:'INCOMPATIBLE_METHOD_LOCATION'});
  await expect(transaction(customer,tx=>handleConfiguration(tx,customer,'configure',{...input,method:'unsupported_laser'}))).rejects.toMatchObject({code:'INCOMPATIBLE_METHOD'});
  const template=await transaction(owner,tx=>handleConfiguration(tx,owner,'create_template',{title:'Synthetic MOQ 48 template',methods:['embroidery'],locations:['front'],minQuantity:24,rule:{op:'gte',field:'quantity',value:48}})) as Row;
  await transaction(owner,tx=>handleConfiguration(tx,owner,'approve',{id:template.id}));
  await expect(transaction(customer,tx=>handleConfiguration(tx,customer,'configure',{...input,location:'front',templateId:template.id}))).rejects.toMatchObject({code:'RULE_CONSTRAINT_FAILED'});
  const selected=await transaction(customer,tx=>handleConfiguration(tx,customer,'configure',{...input,quantity:48,location:'front',templateId:template.id})) as Row;
  expect(selected.data.templateId).toBe(template.id);expect(selected.data.templateVersion).toBe(1);
 });

 it('A14 persists private original metadata and denies another buyer and tenant by guessed UUID',async()=>{
  const asset=await upload();expect(asset.id).toBeTruthy();expect(JSON.stringify(asset)).not.toContain('objectKey');
  const internal=await transaction(owner,tx=>get(tx,owner,'assets',asset.id));
  expect(internal.owner_id).toBe(customer.userId);expect(internal.data.objectKey).toBeTruthy();expect(internal.data.scanStatus).toBe('NOT_CONFIGURED');
  const preview=await transaction(customer,tx=>readPrivateAsset(tx,customer,asset.id));
  expect(preview.mimeType).toBe('image/png');expect((await sharp(preview.bytes).metadata()).width).toBe(2);
  await expect(transaction(secondCustomer,tx=>readPrivateAsset(tx,secondCustomer,asset.id))).rejects.toMatchObject({code:'NOT_FOUND'});
  await expect(transaction(otherOwner,tx=>readPrivateAsset(tx,otherOwner,asset.id))).rejects.toMatchObject({code:'NOT_FOUND'});
  await expect(transaction(customer,tx=>readPrivateAsset(tx,customer,asset.id,true))).rejects.toMatchObject({code:'ORIGINAL_DOWNLOAD_REQUIRES_STAFF_REVIEW'});
  await expect(creative(customer,'upload_asset',{fileName:'unsafe.svg',mimeType:'image/svg+xml',base64:Buffer.from('<svg onload="alert(1)"/>').toString('base64'),rightsConfirmed:true})).rejects.toMatchObject({code:'UNSUPPORTED_OR_MISMATCHED_ASSET_TYPE'});
 });

 it('A15 queues one exact variant mockup and worker creates a real private raster once',async()=>{
  const asset=await upload(),{project,version}=await newDesign(asset.id),idempotencyKey=key();
  const queued=await transaction(customer,tx=>handleCreative(tx,customer,'render_mockup',{id:project.id,idempotencyKey})) as {jobs:Row[];rejected:Input[];verification:string};
  expect(queued.verification).toBe('MOCKED');expect(queued.rejected).toHaveLength(0);expect(queued.jobs).toHaveLength(1);
  const job=queued.jobs[0];expect(job.status).toBe('PENDING');expect(job.data.variantId).toBe(variant.id);expect(job.data.versionHash).toBe(version.data.versionHash);
  const rendered=await transaction(owner,tx=>processMockupJob(tx,owner,job.id));
  expect(rendered.status).toBe('COMPLETE');expect(rendered.data.verification).toBe('MOCKED');expect(rendered.data.assetId).toBeTruthy();
  const image=await transaction(customer,tx=>readPrivateAsset(tx,customer,rendered.data.assetId));
  const metadata=await sharp(image.bytes).metadata();expect(metadata.format).toBe('png');expect(metadata.width).toBe(1000);expect(metadata.height).toBe(1000);
  const again=await transaction(owner,tx=>processMockupJob(tx,owner,job.id));expect(again.data.assetId).toBe(rendered.data.assetId);
  const replay=await transaction(customer,tx=>handleCreative(tx,customer,'render_mockup',{id:project.id,idempotencyKey})) as {jobs:Row[]};expect(replay.jobs[0].id).toBe(job.id);
  const rasterAsset=await transaction(owner,tx=>get(tx,owner,'assets',rendered.data.assetId));expect(rasterAsset.owner_id).toBe(customer.userId);expect(rasterAsset.variant_id).toBe(variant.id);expect(rasterAsset.data.previewOnly).toBe(true);
 });

 it('A16 reports actual low DPI independently of visual proof and blocks production release',async()=>{
  const asset=await upload(),{project,version}=await newDesign(asset.id);
  const proof=await creative(customer,'request_proof',{id:project.id});
  await creative(customer,'approve_proof',{id:proof.id,versionHash:proof.data.versionHash,specificationHash:proof.data.specificationHash});
  const preflight=await creative(customer,'run_preflight',{id:project.id});
  expect(preflight.version_id).toBe(version.id);expect(preflight.status).toBe('BLOCKED');
  expect(preflight.data.errors).toContain('EFFECTIVE_DPI');expect(preflight.data.errors).toContain('PRODUCTION_EXPERT_VALIDATION');expect(preflight.data.ready).toBe(false);
  expect(Number(preflight.data.effectiveDpi)).toBeLessThan(1);
  const current=await transaction(customer,tx=>get(tx,customer,'design_projects',project.id));expect(current.status).toBe('APPROVED');expect(current.data.productionReadiness).toBe('BLOCKED');
  await expect(creative(owner,'release_production_asset',{id:project.id})).rejects.toMatchObject({code:'PRODUCTION_VALIDATION_NOT_CONFIGURED'});
 });

 it('A17 new art revision supersedes approval and exact proof hashes reject stale acceptance',async()=>{
  const {project,version}=await newDesign(),proof=await creative(customer,'request_proof',{id:project.id});
  await expect(creative(customer,'approve_proof',{id:proof.id,versionHash:'forged',specificationHash:proof.data.specificationHash})).rejects.toMatchObject({code:'PROOF_VERSION_MISMATCH'});
  const approved=await creative(customer,'approve_proof',{id:proof.id,versionHash:proof.data.versionHash,specificationHash:proof.data.specificationHash});expect(approved.status).toBe('APPROVED');
  const newer=await creative(owner,'save_design_version',{id:project.id,...doc(),layers:[{id:'new-text',type:'text',x:0,y:0,width:1000,height:300,text:'Revised synthetic artwork',fill:'#13243c'}]});
  expect(newer.owner_id).toBe(customer.userId);expect(newer.data.versionHash).not.toBe(version.data.versionHash);
  const prior=await transaction(customer,tx=>get(tx,customer,'proofs',proof.id));expect(prior.status).toBe('SUPERSEDED');expect(prior.data.invalidatedByVersionId).toBe(newer.id);
  await expect(creative(customer,'approve_proof',{id:proof.id,versionHash:proof.data.versionHash,specificationHash:proof.data.specificationHash})).rejects.toMatchObject({code:'INVALID_TRANSITION'});
  const current=await transaction(customer,tx=>get(tx,customer,'design_projects',project.id));expect(current.status).toBe('EDITABLE');expect(current.data.approvedProofId).toBeNull();
  const preserved=await transaction(customer,tx=>get(tx,customer,'design_versions',version.id));expect(preserved.data.versionHash).toBe(version.data.versionHash);
  const nextProof=await creative(customer,'request_proof',{id:project.id});expect(nextProof.data.versionHash).toBe(newer.data.versionHash);
 });
});
