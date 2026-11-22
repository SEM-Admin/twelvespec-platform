import {beforeAll,describe,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {actors} from '../helpers';
import {create,get,hash,pool,transaction,update,type Actor,type Input,type Row} from '../../packages/kernel/src';
import {handleOrders} from '../../packages/orders/src';
import {QC_SCHEMA} from '../../packages/orders/src/quality';
import {handleFulfillment} from '../../packages/fulfillment/src';

let owner:Actor,customer:Actor,otherOwner:Actor,operations:Actor;
const allChecks={quantity:true,color:true,placement:true,damage:true};
beforeAll(async()=>{
 ({owner,customer,otherOwner}=await actors());
 const id=randomUUID();await pool().query('insert into "user"(id,name,email) values($1,$2,$3)',[id,'Synthetic inspector',`qc-${id}@example.invalid`]);
 await pool().query("insert into memberships(user_id,tenant_id,workspace_id,role) values($1,$2,$3,'operations')",[id,owner.tenantId,owner.workspaceId]);operations={...owner,userId:id,role:'operations'};
});
async function fixture(){
 const {order,line}=await transaction(owner,async tx=>{
  const product=await create(tx,owner,'products',{title:'Synthetic QC blank item',status:'PUBLISHED'}),variant=await create(tx,owner,'variants',{title:'Synthetic navy',product_id:product.id,status:'ACTIVE'});
  const lineData={productId:product.id,variantId:variant.id,quantity:10,method:'none',location:'front'};
  const order=await create(tx,owner,'orders',{title:`Synthetic QC ${randomUUID()}`,owner_id:customer.userId,status:'CONFIRMED',data:{terms:'INVOICE',lines:[lineData],agreementHash:hash(lineData)}});
  const line=await create(tx,owner,'order_lines',{title:'Synthetic QC line',owner_id:customer.userId,order_id:order.id,product_id:product.id,variant_id:variant.id,data:lineData});return {order,line};
 });
 const allocation=await transaction(owner,tx=>handleOrders(tx,owner,'allocate_jobs',{id:order.id,key:randomUUID()})) as {jobs:Row[]};
 const job=await transaction(owner,tx=>handleOrders(tx,owner,'start_job',{id:allocation.jobs[0].id})) as Row;
 return {order,line,job};
}
async function inspect(job:Row,input:Input={},actor=owner){
 return transaction(actor,async tx=>{const current=await get(tx,actor,'jobs',job.id);return handleOrders(tx,actor,'record_qc',{id:job.id,expectedRevision:current.revision,passed:true,checks:allChecks,notes:'Synthetic operator inspection',...input});}) as Promise<Row>;
}
const close=(job:Row)=>transaction(owner,tx=>handleOrders(tx,owner,'close_job',{id:job.id})) as Promise<Row>;
async function completed(){const f=await fixture(),qc=await inspect(f.job);return {...f,qc,job:await close(f.job)};}
const ship=(f:{order:Row;line:Row},quantity=10)=>transaction(owner,tx=>handleFulfillment(tx,owner,'create_shipment',{orderId:f.order.id,lines:[{orderLineId:f.line.id,quantity}],tracking:'SYNTHETIC-QC',key:randomUUID()}));

describe('GAP-024/026 explicit inspection controls across job completion and fulfillment',()=>{
 it.each([
  {checks:undefined},
  {checks:{quantity:true}},
  {checks:{...allChecks,color:'true'}},
  {checks:{...allChecks,extra:true}},
  {passed:'true'},
  {checks:{...allChecks,damage:false}},
  {passed:false,notes:''},
 ])('does not manufacture a pass or write history from incomplete/contradictory input: %j',async input=>{
  const {job}=await fixture();
  await expect(inspect(job,input)).rejects.toMatchObject({status:400});
  const current=await transaction(owner,tx=>get(tx,owner,'jobs',job.id));expect(current.status).toBe('IN_PROGRESS');expect(current.data.lastQcId).toBeUndefined();
  expect((await pool().query('select id from app.qc_checks where job_id=$1',[job.id])).rowCount).toBe(0);
 });

 it('records a failed inspection and reason as rework, without losing the failed check',async()=>{
  const {job}=await fixture(),qc=await inspect(job,{passed:false,checks:{...allChecks,damage:false},notes:'Synthetic damaged seam'});
  expect(qc.status).toBe('FAILED');expect(qc.data.checks).toEqual({...allChecks,damage:false});expect(qc.data.inspectionSchema).toBe(QC_SCHEMA);expect(qc.data.assessment).toBe('OPERATOR_RECORDED');
  expect(qc.data.inspectedJobRevision).toBe(job.revision);expect(qc.data.inspectionContext).toMatchObject({jobId:job.id,orderId:job.order_id,quantity:10,routeRevision:job.data.routeRevision});
  expect((await transaction(owner,tx=>get(tx,owner,'jobs',job.id))).status).toBe('REWORK');
  await expect(close(job)).rejects.toMatchObject({code:'QC_PASS_REQUIRED'});
 });

 it('requires an exact job revision and preserves a competing inspector response',async()=>{
  const {job}=await fixture();
  await expect(transaction(owner,tx=>handleOrders(tx,owner,'record_qc',{id:job.id,passed:true,checks:allChecks}))).rejects.toMatchObject({code:'QC_JOB_REVISION_REQUIRED'});
  const input={id:job.id,expectedRevision:job.revision,passed:true,checks:allChecks,notes:'Synthetic concurrent inspection'};
  const results=await Promise.allSettled([transaction(owner,tx=>handleOrders(tx,owner,'record_qc',input)),transaction(operations,tx=>handleOrders(tx,operations,'record_qc',input))]);
  expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);
  expect(results.find(result=>result.status==='rejected')).toMatchObject({reason:{code:'REVISION_CONFLICT'}});
  expect((await pool().query('select id from app.qc_checks where job_id=$1',[job.id])).rowCount).toBe(1);
 });

 it('requires explicit new evidence for a legacy pending pass and preserves legacy history',async()=>{
  const {job}=await fixture();
  const legacy=await transaction(owner,async tx=>{
   const qc=await create(tx,owner,'qc_checks',{title:'Synthetic legacy defaults',job_id:job.id,order_id:job.order_id,status:'PASSED',data:{passed:true,checks:allChecks}});
   await update(tx,owner,'jobs',job.id,{status:'QC_PENDING',data:{...job.data,qcPassed:true,lastQcId:qc.id}});return qc;
  });
  await expect(close(job)).rejects.toMatchObject({code:'QC_EXPLICIT_EVIDENCE_REQUIRED'});
  const explicit=await inspect(job);expect(explicit.id).not.toBe(legacy.id);
  expect((await close(job)).status).toBe('COMPLETE');
  expect((await transaction(owner,tx=>get(tx,owner,'qc_checks',legacy.id))).data).toEqual(legacy.data);
 });

 it('invalidates completion and shipment when the routed quantity changes after inspection',async()=>{
  const f=await fixture(),qc=await inspect(f.job);
  await transaction(owner,async tx=>{const current=await get(tx,owner,'jobs',f.job.id);return update(tx,owner,'jobs',current.id,{data:{...current.data,quantity:11}});});
  await expect(close(f.job)).rejects.toMatchObject({code:'QC_JOB_CHANGED_REINSPECTION_REQUIRED'});
  await transaction(owner,tx=>update(tx,owner,'jobs',f.job.id,{status:'COMPLETE'}));
  await expect(ship(f)).rejects.toMatchObject({code:'QC_JOB_CHANGED_REINSPECTION_REQUIRED'});
  expect((await pool().query('select id from app.shipments where order_id=$1',[f.order.id])).rowCount).toBe(0);
  expect((await transaction(owner,tx=>get(tx,owner,'qc_checks',qc.id))).data.inspectionSchema).toBe(QC_SCHEMA);
 });

 it('rejects a receipt from another job even when a mutable pass flag is true',async()=>{
  const first=await fixture(),second=await fixture(),qc=await inspect(second.job);
  await transaction(owner,tx=>update(tx,owner,'jobs',first.job.id,{status:'QC_PENDING',data:{...first.job.data,qcPassed:true,lastQcId:qc.id}}));
  await expect(close(first.job)).rejects.toMatchObject({code:'QC_EXPLICIT_EVIDENCE_REQUIRED'});
 });

 it('rechecks prepayment at completion and dispatch; passing QC is not financial authorization',async()=>{
  const f=await fixture();await inspect(f.job);
  const payment=async(status:string)=>transaction(owner,async tx=>{const order=await get(tx,owner,'orders',f.order.id);return update(tx,owner,'orders',order.id,{data:{...order.data,terms:'PREPAID',paymentStatus:status}});});
  await payment('PENDING');await expect(close(f.job)).rejects.toMatchObject({code:'PREPAYMENT_NOT_RECONCILED'});
  await payment('SETTLED');await close(f.job);
  await payment('PENDING');await expect(ship(f)).rejects.toMatchObject({code:'PREPAYMENT_NOT_RECONCILED'});
  await payment('SETTLED');await ship(f);
  expect((await transaction(owner,tx=>get(tx,owner,'orders',f.order.id))).status).toBe('FULFILLED');
 });

 it('reopens an unshipped job for a new inspection without mutating the prior receipt',async()=>{
  const f=await completed(),prior=f.qc.data;
  const reopened=await transaction(owner,tx=>handleOrders(tx,owner,'reopen_qc',{id:f.job.id,expectedRevision:f.job.revision,reason:'Synthetic second review'})) as Row;
  expect(reopened.status).toBe('QC_PENDING');expect(reopened.data.qcPassed).toBe(false);expect(reopened.data.lastQcId).toBeNull();
  await expect(ship(f)).rejects.toMatchObject({code:'QC_COMPLETE_REQUIRED'});
  const next=await inspect(f.job,{},operations);expect(next.data.inspectorId).toBe(operations.userId);expect(next.id).not.toBe(f.qc.id);
  await close(f.job);await ship(f);
  expect((await transaction(owner,tx=>get(tx,owner,'qc_checks',f.qc.id))).data).toEqual(prior);
 });

 it('does not rewrite shipped or closed work through reinspection',async()=>{
  const f=await completed();await ship(f,5);
  await expect(transaction(owner,tx=>handleOrders(tx,owner,'reopen_qc',{id:f.job.id,expectedRevision:f.job.revision,reason:'Synthetic shipped review'}))).rejects.toMatchObject({code:'SHIPPED_JOB_REQUIRES_RETURN_OR_REMAKE'});
  await transaction(owner,tx=>update(tx,owner,'orders',f.order.id,{status:'CLOSED'}));
  await expect(transaction(owner,tx=>handleOrders(tx,owner,'reopen_qc',{id:f.job.id,expectedRevision:f.job.revision,reason:'Synthetic closed review'}))).rejects.toMatchObject({code:'ORDER_CLOSED_READ_ONLY'});
  expect((await transaction(owner,tx=>get(tx,owner,'jobs',f.job.id))).status).toBe('COMPLETE');
 });

 it('serializes reinspection against shipment so only one can proceed',async()=>{
  const f=await completed();
  const results=await Promise.allSettled([transaction(owner,tx=>handleOrders(tx,owner,'reopen_qc',{id:f.job.id,expectedRevision:f.job.revision,reason:'Synthetic simultaneous review'})),ship(f)]);
  expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);
  const job=await transaction(owner,tx=>get(tx,owner,'jobs',f.job.id)),count=(await pool().query('select id from app.shipments where order_id=$1',[f.order.id])).rowCount;
  expect(job.status==='COMPLETE'?count===1:job.status==='QC_PENDING'&&count===0).toBe(true);
 });

 it('denies customer/cross-workspace writes and makes inspection history immutable',async()=>{
  const {job}=await fixture();
  await expect(transaction(customer,tx=>handleOrders(tx,customer,'record_qc',{id:job.id,expectedRevision:job.revision,passed:true,checks:allChecks}))).rejects.toMatchObject({code:'PERMISSION_DENIED'});
  await expect(inspect(job,{},otherOwner)).rejects.toMatchObject({code:'NOT_FOUND'});
  const qc=await inspect(job);
  await expect(transaction(owner,tx=>tx.query("update app.qc_checks set status='FAILED' where id=$1",[qc.id]))).rejects.toThrow('IMMUTABLE_RECORD');
  await expect(pool().query('delete from app.qc_checks where id=$1',[qc.id])).rejects.toThrow('IMMUTABLE_RECORD');
  expect((await transaction(owner,tx=>get(tx,owner,'qc_checks',qc.id))).status).toBe('PASSED');
 });
});
