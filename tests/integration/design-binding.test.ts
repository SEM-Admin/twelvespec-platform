import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {actors} from '../helpers';
import {transaction,pool,create,get,update,type Actor,type Row,type Input} from '../../packages/kernel/src';
import {handleCreative} from '../../packages/creative/src';
import {validateLine} from '../../packages/sales/src';
let owner:Actor,customer:Actor;
beforeAll(async()=>({owner,customer}=await actors()));afterAll(async()=>{await pool().end();});
const document={layers:[{id:'text',type:'text',x:0,y:0,width:500,height:200,text:'SYNTHETIC cap mark',fill:'#123456'}],placement:{xMm:0,yMm:0,widthMm:70,heightMm:30,location:'front',bleedMm:0},physicalWidthMm:70,physicalHeightMm:30,method:'embroidery'};
const creative=(action:string,input:Input)=>transaction(customer,tx=>handleCreative(tx,customer,action,input)) as Promise<Row>;
async function fixture(){
 const {product,a,b}=await transaction(owner,async tx=>{
  const product=await create(tx,owner,'products',{title:'SYNTHETIC cap binding',status:'PUBLISHED',data:{minimumQuantity:1,methods:['embroidery','screen_print'],locations:['front','back']}});
  const a=await create(tx,owner,'variants',{title:'Navy',product_id:product.id,status:'ACTIVE',data:{color:'Navy',size:'One size'}}),b=await create(tx,owner,'variants',{title:'Clay',product_id:product.id,status:'ACTIVE',data:{color:'Clay',size:'One size'}});return {product,a,b};
 });
 const project=await creative('create',{title:'SYNTHETIC bound project',productId:product.id,variantId:a.id});
 const version=await creative('save_design_version',{id:project.id,...document});return {product,a,b,project,version};
}
describe('exact design → variant → method → proof identity',()=>{
 it('persists exact variant identity and rejects a different variant, method or location at Sales',async()=>{
  const f=await fixture();expect(f.version.product_id).toBe(f.product.id);expect(f.version.variant_id).toBe(f.a.id);expect(f.version.data).toMatchObject({productId:f.product.id,variantId:f.a.id,productRevision:1,variantRevision:1});
  const line={productId:f.product.id,variantId:f.a.id,quantity:48,method:'embroidery',location:'front',designVersionId:f.version.id};
  await expect(transaction(owner,tx=>validateLine(tx,owner,line,false))).resolves.toMatchObject({id:f.product.id});
  await expect(transaction(owner,tx=>validateLine(tx,owner,{...line,variantId:f.b.id},false))).rejects.toThrow('DESIGN_VARIANT_MISMATCH');
  for(const change of [{method:'screen_print'},{location:'back'}])await expect(transaction(owner,tx=>validateLine(tx,owner,{...line,...change},false))).rejects.toThrow('DESIGN_CONFIGURATION_MISMATCH');
 });
 it('requires a newly bound revision for unbound historical artwork; it never guesses identity',async()=>{
  const f=await fixture(),legacy=await transaction(customer,tx=>create(tx,customer,'design_versions',{title:'SYNTHETIC legacy unbound',project_id:f.project.id,data:document}));
  await expect(transaction(owner,tx=>validateLine(tx,owner,{productId:f.product.id,variantId:f.a.id,quantity:48,method:'embroidery',location:'front',designVersionId:legacy.id},false))).rejects.toThrow('DESIGN_BINDING_UNVERIFIED');
  await expect(transaction(owner,tx=>update(tx,owner,'design_projects',f.project.id,{data:{...f.project.data,variantId:f.b.id}}))).rejects.toThrow('DESIGN_PROJECT_IDENTITY_IMMUTABLE');
 });
 it('deduplicates the exact pending proof and invalidates it beyond 1000 unrelated records',async()=>{
  const f=await fixture(),proof=await creative('request_proof',{id:f.project.id});
  const other=await creative('create',{title:'SYNTHETIC unrelated proofs',productId:f.product.id,variantId:f.b.id});
  try{
   await transaction(customer,tx=>tx.query(`insert into app.proofs(tenant_id,workspace_id,owner_id,title,status,project_id,data)
    select $1,$2,$3,'SYNTHETIC unrelated proof','PROOF_PENDING',$4,'{}'::jsonb from generate_series(1,1001)`,[customer.tenantId,customer.workspaceId,customer.userId,other.id]));
   expect((await creative('request_proof',{id:f.project.id})).id).toBe(proof.id);
   const newer=await creative('save_design_version',{id:f.project.id,...document});expect(newer.data.versionHash).toBe(f.version.data.versionHash);
   expect((await transaction(customer,tx=>get(tx,customer,'proofs',proof.id))).status).toBe('SUPERSEDED');
   const newProof=await creative('request_proof',{id:f.project.id});expect(newProof.id).not.toBe(proof.id);expect(newProof.version_id).toBe(newer.id);
  }finally{await pool().query('delete from app.proofs where project_id=$1',[other.id]);}
 });
 it('serializes concurrent approval and revision: a stale proof cannot remain approved',async()=>{
  const f=await fixture(),proof=await creative('request_proof',{id:f.project.id});
  const outcomes=await Promise.allSettled([creative('approve_proof',{id:proof.id,versionHash:proof.data.versionHash,specificationHash:proof.data.specificationHash}),creative('save_design_version',{id:f.project.id,...document,layers:[{...document.layers[0],text:'SYNTHETIC revised mark'}]})]);
  expect(outcomes[1].status).toBe('fulfilled');
  for(const outcome of outcomes)if(outcome.status==='rejected')expect(String(outcome.reason)).not.toMatch(/deadlock/i);
  const old=await transaction(customer,tx=>get(tx,customer,'proofs',proof.id));expect(old.status).toBe('SUPERSEDED');expect(old.data.productionReadiness).toBe('BLOCKED');
 });
});
