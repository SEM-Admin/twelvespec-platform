import {type Actor,type Tx,type Input,type Row,authorize,create,get,list,update,event,idempotent,fail,text,number,hash,transition} from '../../kernel/src/index';
import {related} from '../../production/src/records';
import {recordProcessProfile,processProfileContext,processProfileLibrary} from '../../production/src/profiles';
import {explicitInspection,inspectionContext,inspectionContextSnapshot,QC_SCHEMA,requirePassedInspection} from './quality';
export const JOB_GRAPH:Record<string,string[]>={PLANNED:['READY','BLOCKED'],READY:['IN_PROGRESS','BLOCKED'],IN_PROGRESS:['QC_PENDING','BLOCKED'],QC_PENDING:['COMPLETE','REWORK','BLOCKED'],REWORK:['IN_PROGRESS','BLOCKED'],BLOCKED:['PLANNED','READY'],COMPLETE:[]};
export async function ensureDispatchReady(tx:Tx,a:Actor,order:Row){
 if(order.revision_id){const agreement=await get(tx,a,'quote_revisions',order.revision_id);if(hash(agreement.data)!==order.data.agreementHash||hash(agreement.data.lines)!==hash(order.data.lines)||hash(agreement.data.seller)!==hash(order.data.seller)||agreement.data.total!==order.data.total||agreement.data.currency!==order.data.currency)fail('ORDER_AGREEMENT_CHANGED');}
 if(order.data.terms==='PREPAID'&&order.data.paymentStatus!=='SETTLED')fail('PREPAYMENT_NOT_RECONCILED');
 for(const l of (order.data.lines??[]) as Input[]){
  if(l.designVersionId){
   const proofs=await related(tx,a,'proofs','version_id',l.designVersionId);const exact=proofs.some(p=>p.version_id===l.designVersionId&&p.status==='APPROVED');if(!exact)fail('PROOF_APPROVAL_REQUIRED');
   const checks=await related(tx,a,'preflight_results','version_id',l.designVersionId);if(!checks.some(p=>(p.version_id===l.designVersionId||p.data.versionId===l.designVersionId)&&p.status==='PASSED'))fail('PRODUCTION_PREFLIGHT_REQUIRED');
  }else if(l.method!=='none')fail('PRODUCTION_ARTWORK_REQUIRED');
 }
}
export async function handleOrders(tx:Tx,a:Actor,action:string,input:Input):Promise<unknown>{
 authorize(a,'orders',action);
 if(action==='record_process_profile')return recordProcessProfile(tx,a,input);
 if(action==='process_profile_library')return processProfileLibrary(tx,a,input);
 if(action==='process_profile_context')return processProfileContext(tx,a,input);
 if(action==='allocate_jobs')return idempotent(tx,a,'order.allocate',input.key,{id:input.id},async()=>{
  const order=await get(tx,a,'orders',input.id,true);if(!['AWAITING_PAYMENT','CONFIRMED'].includes(order.status))fail('INVALID_TRANSITION');const lines=await related(tx,a,'order_lines','order_id',order.id);if(!lines.length)fail('ORDER_LINES_REQUIRED');
  const jobs=[];const routeRevision=hash({order:order.id,lines:lines.map(l=>({id:l.id,data:l.data}))});
  for(const line of lines){
   const job=await create(tx,a,'jobs',{title:'Job · '+line.title,order_id:order.id,status:'PLANNED',data:{orderLineId:line.id,quantity:line.data.quantity,productId:line.product_id,method:line.data.method,designVersionId:line.data.designVersionId,routeRevision,estimatedCost:line.data.landedCost,dueAt:input.dueAt??new Date(Date.now()+14*86400000).toISOString()}});jobs.push(job);
   const components=line.data.components as Input|undefined;for(const [component,amount] of Object.entries(components??{})){await create(tx,a,'job_components',{title:component,job_id:job.id,order_id:order.id,status:'ESTIMATED',data:{component,amount,currency:'USD'}});}
   for(const name of ['Artwork review','Material sourcing',String(line.data.method??'production'),'Quality inspection','Pack and dispatch'])await create(tx,a,'operations',{title:name,job_id:job.id,order_id:order.id,status:'PLANNED',data:{required:true}});
   await create(tx,a,'fulfillment_allocations',{title:line.title,order_id:order.id,job_id:job.id,status:'PLANNED',data:{orderLineId:line.id,quantity:line.data.quantity,shippedQuantity:0,routeRevision,source:'MOCKED'}});
   await create(tx,a,'purchase_requirements',{title:'Source · '+line.title,order_id:order.id,job_id:job.id,status:'DRAFT',data:{orderLineId:line.id,quantity:line.data.quantity,productId:line.product_id,variantId:line.variant_id,estimatedCost:line.data.landedCost,sourceEvidence:line.data.sourceEvidence}});
  }
  await update(tx,a,'orders',order.id,{status:'ALLOCATED',data:{...order.data,routeRevision}});await event(tx,a,'order.allocated',order.id,{jobIds:jobs.map(j=>j.id),routeRevision});return {orderId:order.id,jobs};
 });
 if(action==='start_job'){
  const job=await get(tx,a,'jobs',input.id,true);if(!['PLANNED','READY','REWORK'].includes(job.status))fail('INVALID_TRANSITION');const order=await get(tx,a,'orders',job.order_id);await ensureDispatchReady(tx,a,order);
  const row=await update(tx,a,'jobs',job.id,{status:'IN_PROGRESS'});await update(tx,a,'orders',order.id,{status:'IN_PRODUCTION'});await create(tx,a,'production_events',{title:'Production started',job_id:job.id,order_id:order.id,status:'RECORDED',data:{actorId:a.userId,at:new Date().toISOString()}});await event(tx,a,'job.started',job.id);return row;
 }
 if(action==='ready_job'){
  const job=await get(tx,a,'jobs',input.id,true);transition(job.status,'READY',JOB_GRAPH);const row=await update(tx,a,'jobs',job.id,{status:'READY'});await event(tx,a,'job.ready',job.id);return row;
 }
 if(action==='record_qc'){
  const job=await get(tx,a,'jobs',input.id,true);if(!['IN_PROGRESS','QC_PENDING','REWORK'].includes(job.status))fail('INVALID_TRANSITION');
  if(input.expectedRevision===undefined)fail('QC_JOB_REVISION_REQUIRED',400,'Reopen the quality form to inspect the current job.');if(input.expectedRevision!==job.revision)fail('REVISION_CONFLICT',409,'The job changed. Reopen the quality form and review its current details.');
  const inspection=explicitInspection(input);
  const qc=await create(tx,a,'qc_checks',{title:'QC · '+job.title,owner_id:job.owner_id,job_id:job.id,order_id:job.order_id,status:inspection.passed?'PASSED':'FAILED',data:{...inspection,inspectorId:a.userId,at:new Date().toISOString(),inspectedJobRevision:job.revision,inspectionSchema:QC_SCHEMA,inspectionContext:inspectionContextSnapshot(job),inspectionContextHash:inspectionContext(job),assessment:'OPERATOR_RECORDED'}});
  await update(tx,a,'jobs',job.id,{status:inspection.passed?'QC_PENDING':'REWORK',data:{...job.data,lastQcId:qc.id,qcPassed:inspection.passed,qcInspectionSchema:QC_SCHEMA,requiresReinspection:false}});await event(tx,a,'job.qc_recorded',job.id,{passed:inspection.passed,qcId:qc.id,inspectionSchema:QC_SCHEMA});return qc;
 }
 if(action==='close_job'){
  const job=await get(tx,a,'jobs',input.id,true);if(job.status!=='QC_PENDING')fail('QC_PASS_REQUIRED');const qc=await requirePassedInspection(tx,a,job);const order=await get(tx,a,'orders',job.order_id);await ensureDispatchReady(tx,a,order);const row=await update(tx,a,'jobs',job.id,{status:'COMPLETE',data:{...job.data,completedAt:new Date().toISOString()}});await event(tx,a,'job.completed',job.id,{qcId:qc.id,inspectionContextHash:qc.data.inspectionContextHash});return row;
 }
 if(action==='reopen_qc'){
  const job=await get(tx,a,'jobs',input.id,true);if(job.status!=='COMPLETE')fail('INVALID_TRANSITION');
  if(input.expectedRevision!==job.revision)fail('REVISION_CONFLICT');const reason=text(input.reason,2000),order=await get(tx,a,'orders',job.order_id,true);
  if(['CLOSED','CANCELLED'].includes(order.status))fail('ORDER_CLOSED_READ_ONLY');
  if(!job.data.orderLineId)fail('JOB_ORDER_LINE_REQUIRED');
  const shipped=(await related(tx,a,'shipment_lines','order_id',order.id)).some(line=>line.data.orderLineId===job.data.orderLineId);
  if(shipped)fail('SHIPPED_JOB_REQUIRES_RETURN_OR_REMAKE',409,'This job already has a shipment. Record a reviewed return or remake for further corrections.');
  const row=await update(tx,a,'jobs',job.id,{status:'QC_PENDING',data:{...job.data,qcPassed:false,qcInspectionSchema:null,requiresReinspection:true,previousQcId:job.data.lastQcId??null,lastQcId:null,priorCompletedAt:job.data.completedAt??null,completedAt:null,reinspectionReason:reason}});await event(tx,a,'job.qc_reopened',job.id,{reason,previousQcId:job.data.lastQcId??null});return row;
 }
 if(action==='update_operation'){
  const op=await get(tx,a,'operations',input.id,true);const status=text(input.status);if(!['PLANNED','IN_PROGRESS','COMPLETE','BLOCKED'].includes(status))fail('INVALID_STATUS',400);const row=await update(tx,a,'operations',op.id,{status,data:{...op.data,notes:input.notes?text(input.notes,2000):''}});await event(tx,a,'operation.updated',op.id,{status});return row;
 }
 if(action==='block_job'){
  const job=await get(tx,a,'jobs',input.id,true);if(job.status==='COMPLETE')fail('INVALID_TRANSITION');const reason=text(input.reason,2000);const row=await update(tx,a,'jobs',job.id,{status:'BLOCKED',data:{...job.data,blockedReason:reason}});await create(tx,a,'exceptions',{title:'Job blocked · '+job.title,status:'OPEN',job_id:job.id,data:{reason,severity:'HIGH'}});await event(tx,a,'job.blocked',job.id,{reason});return row;
 }
 return fail('UNSUPPORTED_ACTION',400);
}
