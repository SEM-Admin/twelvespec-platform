import {type Actor,type Tx,type Input,authorize,create,get,list,update,event,fail,text,number} from '../../kernel/src/index';
import {landedCost,priceForTargetMargin,grossMargin,type Components} from '../../pricing/src/index';
export async function handleEstimating(tx:Tx,a:Actor,action:string,input:Input):Promise<unknown>{
 authorize(a,'estimating',action);
 if(action==='create'){
  const d=(input.components??{}) as Components;const cost=landedCost(d);const total=priceForTargetMargin(cost,input.targetMargin??'.40');const row=await create(tx,a,'estimates',{title:input.title?text(input.title):'Component estimate',status:'COSTED',data:{components:d,cost,total,margin:grossMargin(cost,total),currency:'USD',validUntil:new Date(Date.now()+7*86400000).toISOString(),source:input.source?text(input.source):'OPERATOR_ESTIMATE'}});await event(tx,a,'estimate.created',row.id);return row;
 }
 if(action==='update'){
  const old=await get(tx,a,'estimates',input.id,true);if(['APPROVED','ARCHIVED'].includes(old.status))fail('ESTIMATE_IMMUTABLE');const components=(input.components??old.data.components) as Components;const cost=landedCost(components);const total=priceForTargetMargin(cost,input.targetMargin??'.40');const row=await update(tx,a,'estimates',old.id,{title:input.title?text(input.title):old.title,data:{...old.data,components,cost,total,margin:grossMargin(cost,total)},expectedRevision:input.expectedRevision===undefined?undefined:number(input.expectedRevision,1)});await event(tx,a,'estimate.revised',old.id);return row;
 }
 if(['review','approve','archive'].includes(action)){
  const old=await get(tx,a,'estimates',input.id,true);if(action==='approve'&&!['owner','manager'].includes(a.role))fail('APPROVER_REQUIRED',403);if(old.status==='ARCHIVED')fail('INVALID_TRANSITION');const row=await update(tx,a,'estimates',old.id,{status:action==='approve'?'APPROVED':action==='archive'?'ARCHIVED':'IN_REVIEW'});await event(tx,a,'estimate.'+action,old.id);return row;
 }
 if(action==='read')return list(tx,a,'estimates');return fail('UNSUPPORTED_ACTION',400);
}
