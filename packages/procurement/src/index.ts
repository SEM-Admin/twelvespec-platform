import {type Actor,type Tx,type Input,authorize,create,get,list,update,event,idempotent,fail,text,hash} from '../../kernel/src/index';
import {ensureDispatchReady} from '../../orders/src/index';
import {related} from '../../production/src/records';
export const PO_GRAPH:Record<string,string[]>={DRAFT:['APPROVAL_PENDING'],APPROVAL_PENDING:['AUTHORIZED','REJECTED'],AUTHORIZED:['SUBMITTING'],SUBMITTING:['ACKNOWLEDGED','REJECTED','UNKNOWN_OUTCOME'],UNKNOWN_OUTCOME:[],ACKNOWLEDGED:[],REJECTED:[]};
export function canSubmitPurchaseOrder(status:string){return status==='AUTHORIZED';}
export async function handleProcurement(tx:Tx,a:Actor,action:string,input:Input):Promise<unknown>{
 authorize(a,'procurement',action);
 if(action==='prepare_po')return idempotent(tx,a,'purchase.prepare',input.key,{orderId:input.orderId,jobId:input.jobId,connectionId:input.connectionId},async()=>{
  const order=await get(tx,a,'orders',input.orderId);const jobs=(await related(tx,a,'jobs','order_id',order.id)).filter(j=>!input.jobId||j.id===input.jobId);if(!jobs.length)fail('ALLOCATE_JOBS_FIRST');
  const connections=await list(tx,a,'connections',1000);const poRows=[];
  const existingPurchases=(await related(tx,a,'purchase_orders','order_id',order.id)).filter(p=>!['REJECTED','CANCELLED'].includes(p.status));
  for(const job of jobs){
   if(existingPurchases.some(p=>p.job_id===job.id))fail('PURCHASE_ALREADY_PREPARED');
   const requirements=await related(tx,a,'purchase_requirements','job_id',job.id);
   const requiredConnection=(requirements[0]?.data.sourceEvidence as Input|undefined)?.connectionId;
   const connection=input.connectionId?await get(tx,a,'connections',input.connectionId):connections.find(c=>c.id===requiredConnection)??connections.find(c=>c.data.environment==='mock');
   if(!connection)return fail('CONNECTION_REQUIRED');if(connection.data.environment!=='mock')fail('LIVE_PURCHASE_BLOCKED',403);
   const po=await create(tx,a,'purchase_orders',{title:'PO draft · '+job.title,status:'APPROVAL_PENDING',order_id:order.id,job_id:job.id,connection_id:connection.id,data:{orderId:order.id,jobId:job.id,environment:'mock',verification:'MOCKED',currency:'USD',estimatedCost:job.data.estimatedCost,routeRevision:job.data.routeRevision,orderAgreementHash:order.data.agreementHash,requestKey:input.key,lines:requirements.map(r=>r.data)}});poRows.push(po);
   for(const r of requirements)await create(tx,a,'purchase_order_lines',{title:r.title,order_id:order.id,job_id:job.id,connection_id:connection.id,data:{purchaseOrderId:po.id,...r.data}});
   await create(tx,a,'sourcing_decisions',{title:'Sourcing · '+job.title,order_id:order.id,job_id:job.id,connection_id:connection.id,status:'PROPOSED',data:{purchaseOrderId:po.id,decision:'Source selected from frozen quote evidence',routeRevision:job.data.routeRevision,verification:'MOCKED'}});
   await event(tx,a,'purchase.prepared',po.id,{jobId:job.id});
  }
  return {purchaseOrders:poRows};
 });
 if(action==='approve_po'){
  if(!['owner','manager'].includes(a.role))fail('PURCHASE_APPROVER_REQUIRED',403);const po=await get(tx,a,'purchase_orders',input.id,true);if(po.status!=='APPROVAL_PENDING')fail('INVALID_TRANSITION');const reason=text(input.reason,2000);
  const row=await update(tx,a,'purchase_orders',po.id,{status:'AUTHORIZED',data:{...po.data,approvedBy:a.userId,approvedAt:new Date().toISOString(),approvalReason:reason,authorizationHash:hash(po.data)}});await create(tx,a,'approvals',{title:'Purchase authorization · '+po.title,status:'APPROVED',order_id:po.order_id,job_id:po.job_id,data:{purchaseOrderId:po.id,reason,approvedBy:a.userId}});await event(tx,a,'purchase.authorized',po.id,{reason});return row;
 }
 if(action==='submit_po')return idempotent(tx,a,'purchase.submit',input.key,{id:input.id,simulateTimeout:input.simulateTimeout===true},async()=>{
  const po=await get(tx,a,'purchase_orders',input.id,true);if(!canSubmitPurchaseOrder(po.status))fail(po.status==='UNKNOWN_OUTCOME'?'RECONCILIATION_REQUIRED':'PURCHASE_NOT_AUTHORIZED');if(po.data.environment!=='mock')fail('LIVE_PURCHASE_BLOCKED',403);
  const order=await get(tx,a,'orders',po.order_id);if(po.data.orderAgreementHash!==order.data.agreementHash)fail('PURCHASE_AGREEMENT_CHANGED');await ensureDispatchReady(tx,a,order);
  await update(tx,a,'purchase_orders',po.id,{status:'SUBMITTING'});const outcome=input.simulateTimeout===true?'UNKNOWN_OUTCOME':'ACKNOWLEDGED';const externalId=outcome==='ACKNOWLEDGED'?'MOCK-PO-'+po.id.slice(0,8):undefined;
  const row=await update(tx,a,'purchase_orders',po.id,{status:outcome,data:{...po.data,submissionKey:input.key,externalId,submittedAt:new Date().toISOString(),verification:'MOCKED',requiresReconciliation:outcome==='UNKNOWN_OUTCOME'}});
  await create(tx,a,'provider_transactions',{title:'Simulated PO submission',status:outcome,order_id:po.order_id,connection_id:po.connection_id,data:{purchaseOrderId:po.id,idempotencyKey:input.key,externalId,verification:'MOCKED',redactedResponse:outcome==='UNKNOWN_OUTCOME'?'Timeout after write; query provider before retry':'Synthetic fixture acknowledgment'}});
  if(outcome==='UNKNOWN_OUTCOME')await create(tx,a,'exceptions',{title:'Purchase outcome uncertain · '+po.title,status:'OPEN',order_id:po.order_id,data:{purchaseOrderId:po.id,severity:'HIGH',nextAction:'Reconcile the supplier reference. Do not resubmit.'}});
  await event(tx,a,'purchase.'+outcome.toLowerCase(),po.id,{verification:'MOCKED'});return row;
 });
 if(action==='reconcile_outcome'){
  if(!['owner','manager','buyer'].includes(a.role))fail('PERMISSION_DENIED',403);const po=await get(tx,a,'purchase_orders',input.id,true);if(po.status!=='UNKNOWN_OUTCOME')fail('INVALID_TRANSITION');if(po.data.environment!=='mock')fail('LIVE_RECONCILIATION_BLOCKED',403);const outcome=text(input.outcome);if(!['ACKNOWLEDGED','REJECTED'].includes(outcome))fail('INVALID_OUTCOME',400);const reference=text(input.reference,200);
  const row=await update(tx,a,'purchase_orders',po.id,{status:outcome,data:{...po.data,externalId:reference,reconciledBy:a.userId,reconciledAt:new Date().toISOString(),requiresReconciliation:false}});await create(tx,a,'provider_transactions',{title:'Simulated reconciliation',status:outcome,order_id:po.order_id,connection_id:po.connection_id,data:{purchaseOrderId:po.id,reference,verification:'MOCKED'}});await event(tx,a,'purchase.reconciled',po.id,{outcome,reference});return row;
 }
 return fail('UNSUPPORTED_ACTION',400);
}
