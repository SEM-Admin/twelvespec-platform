import {createHmac,timingSafeEqual} from 'node:crypto';
import Decimal from 'decimal.js';
import {type Actor,type Tx,type Input,authorize,create,get,list,update,event,idempotent,fail,text,hash} from '../../kernel/src/index';
import {amount,money,profitability} from '../../pricing/src/index';
import {related} from '../../production/src/records';
export function verifyWebhookSignature(body:string,signature:string,timestamp:string,secret:string,now=Date.now()):boolean{
 if(!secret||!/^[a-f0-9]{64}$/i.test(signature)||!/^\d+$/.test(timestamp))return false;
 const at=Number(timestamp)*1000;if(!Number.isFinite(at)||Math.abs(now-at)>300000)return false;
 const expected=createHmac('sha256',secret).update(timestamp+'.'+body).digest();const actual=Buffer.from(signature,'hex');return actual.length===expected.length&&timingSafeEqual(expected,actual);
}
export async function reconcilePaymentEvent(tx:Tx,a:Actor,eventInput:Input):Promise<unknown>{
 const externalEventId=text(eventInput.eventId,200);const payment=await get(tx,a,'payment_references',eventInput.paymentId,true);
 if(payment.data.verification!=='MOCKED')fail('UNVERIFIED_GATEWAY_EVENT',403);
 return idempotent(tx,a,'payment.webhook',externalEventId,{paymentId:payment.id,eventId:externalEventId,status:eventInput.status},async()=>{
  const target=String(eventInput.status??'SETTLED');if(!['AUTHORIZED','SETTLED','FAILED','REFUNDED'].includes(target))fail('INVALID_PAYMENT_STATE');
  const graph:Record<string,string[]>={PENDING:['AUTHORIZED','SETTLED','FAILED'],AUTHORIZED:['SETTLED','FAILED'],SETTLED:['REFUNDED'],FAILED:[],REFUNDED:[]};if(!graph[payment.status]?.includes(target))fail('INVALID_PAYMENT_TRANSITION');
  const ref=await update(tx,a,'payment_references',payment.id,{status:target,data:{...payment.data,reconciledAt:new Date().toISOString(),eventId:externalEventId}});
  await create(tx,a,'webhook_receipts',{title:externalEventId,status:'ACCEPTED',order_id:payment.order_id,data:{provider:'MOCK_GATEWAY',externalEventId,paymentId:payment.id,bodyHash:hash(eventInput),verification:'MOCKED'}});
  await create(tx,a,'reconciliations',{title:'Payment reconciliation',status:'MATCHED',order_id:payment.order_id,data:{paymentId:payment.id,externalEventId,amount:payment.data.amount,verification:'MOCKED'}});
  if(payment.order_id){const order=await get(tx,a,'orders',payment.order_id,true);const refs=(await related(tx,a,'payment_references','order_id',order.id)).filter(x=>x.status==='SETTLED');const settled=refs.reduce((n,x)=>n.plus(money(x.data.amount)),new Decimal(0));const fullySettled=settled.gte(money(order.data.total));await update(tx,a,'orders',order.id,{status:fullySettled&&order.status==='AWAITING_PAYMENT'?'CONFIRMED':order.status,data:{...order.data,paymentStatus:fullySettled?'SETTLED':target==='REFUNDED'?'REFUNDED':'PENDING',settledAmount:amount(settled)}});}
  await event(tx,a,'payment.reconciled',payment.id,{status:target,verification:'MOCKED'});return ref;
 });
}
export async function handleFinance(tx:Tx,a:Actor,action:string,input:Input):Promise<unknown>{
 authorize(a,'finance',action);
 if(action==='approve_credit'){
  const account=await get(tx,a,'accounts',input.accountId,true);const reason=text(input.reason,2000);const limit=amount(money(input.limit));const row=await update(tx,a,'accounts',account.id,{data:{...account.data,customerUserId:text(input.customerUserId),creditApproved:true,creditApprovedBy:a.userId,creditApprovedAt:new Date().toISOString(),creditLimit:limit,creditReason:reason}});await event(tx,a,'finance.credit_approved',account.id,{reason,limit});return row;
 }
 if(action==='record_actual'||action==='create'){
  const order=await get(tx,a,'orders',input.orderId);const amountValue=amount(money(input.amount));const component=text(input.component??'other_direct_cost',100);const source=text(input.source??'Synthetic operator cost',500);
  const result=await idempotent(tx,a,'cost.record',input.key??hash({orderId:order.id,amountValue,component,source}),{orderId:order.id,amountValue,component,source},async()=>{const row=await create(tx,a,'actual_costs',{title:component+' · '+order.title,order_id:order.id,status:'RECORDED',data:{component,amount:amountValue,currency:'USD',source,recordedBy:a.userId,recordedAt:new Date().toISOString()}});await event(tx,a,'cost.recorded',row.id,{orderId:order.id,component});return row;});return result;
 }
 if(action==='record_payment_reference')return idempotent(tx,a,'payment.reference',input.key??input.externalId,{orderId:input.orderId,externalId:input.externalId,amount:input.amount},async()=>{
  const order=await get(tx,a,'orders',input.orderId);const externalId=text(input.externalId,200);const value=amount(money(input.amount));if(money(value).isZero())fail('PAYMENT_MUST_BE_POSITIVE');
  const row=await create(tx,a,'payment_references',{title:'Simulated payment · '+order.title,status:'PENDING',order_id:order.id,owner_id:order.owner_id,data:{externalId,amount:value,currency:'USD',provider:'MOCK_GATEWAY',verification:'MOCKED',authority:'External gateway is authoritative; local synthetic reference only'}});await event(tx,a,'payment.reference_created',row.id,{orderId:order.id,verification:'MOCKED'});return row;
 });
 if(action==='reconcile_mock_payment')return reconcilePaymentEvent(tx,a,{paymentId:input.id,eventId:input.eventId,status:input.status??'SETTLED'});
 if(action==='record_invoice_reference')return idempotent(tx,a,'invoice.reference',input.key??input.externalId,{orderId:input.orderId,externalId:input.externalId,amount:input.amount},async()=>{
  const order=await get(tx,a,'orders',input.orderId);const row=await create(tx,a,'invoice_references',{title:'Invoice reference · '+order.title,status:'PENDING_RECONCILIATION',order_id:order.id,owner_id:order.owner_id,data:{externalId:text(input.externalId,200),amount:amount(money(input.amount)),currency:'USD',verification:'MOCKED',provider:'SYNTHETIC_ACCOUNTING'}});await event(tx,a,'invoice.reference_created',row.id);return row;
 });
 if(action==='closeout'){
  const order=await get(tx,a,'orders',input.orderId,true);if(order.status==='CLOSED')fail('ORDER_ALREADY_CLOSED');if(order.status!=='FULFILLED')fail('FULFILLMENT_REQUIRED');
  const actuals=await related(tx,a,'actual_costs','order_id',order.id);if(!actuals.length)fail('ACTUAL_COSTS_REQUIRED');
  const actual=actuals.reduce((s,l)=>s.plus(money(l.data.amount)),new Decimal(0));const result=profitability(String(order.data.total),String(order.data.landedCost),amount(actual),String(input.ownerHours??'0'));
  const row=await create(tx,a,'profit_snapshots',{title:'Closeout · '+order.title,status:'CLOSED',order_id:order.id,data:{...result,ownerHours:input.ownerHours===undefined?null:result.ownerHours,ownerHoursState:input.ownerHours===undefined?'UNKNOWN':'RECORDED',currency:'USD',actualCostIds:actuals.map(x=>x.id),closedBy:a.userId,closedAt:new Date().toISOString()}});await update(tx,a,'orders',order.id,{status:'CLOSED'});await event(tx,a,'order.profit_closed',order.id,{snapshotId:row.id});return row;
 }
 if(action==='read')return {payments:await list(tx,a,'payment_references'),actuals:await list(tx,a,'actual_costs'),profits:await list(tx,a,'profit_snapshots')};
 if(action==='live_payment'||action==='live_refund')return fail('LIVE_FINANCIAL_ACTION_BLOCKED',403);
 return fail('UNSUPPORTED_ACTION',400);
}
