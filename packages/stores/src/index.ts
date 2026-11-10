import Decimal from 'decimal.js';
import { authorize,create,get,list,update,event,fail,text,number,idempotent,type Actor,type Tx,type Input,type Row } from '../../kernel/src/index';
export const STORE_TYPES=['CORPORATE_ON_GOING','POPUP','SCHOOL','FUNDRAISER','REDEMPTION','EVENT'] as const;
function money(value:unknown){try{const d=new Decimal(String(value));if(!d.isFinite()||d.lt(0))fail('INVALID_AMOUNT',400);return d.toFixed(2);}catch{ return fail('INVALID_AMOUNT',400);}}
function staff(a:Actor){if(a.role==='customer')fail('STORE_ADMIN_REQUIRED',403);}
export function validateStorePolicy(policy:Input,buyer:Input,budget:Input,request:{amount:string;brandKitId?:string},now=new Date()){
 for(const field of ['startsAt','closesAt'])if(policy[field]&&!Number.isFinite(Date.parse(String(policy[field]))))fail('INVALID_CAMPAIGN_WINDOW',400);
 if(buyer.eligible!==true)fail('STORE_BUYER_NOT_ELIGIBLE',403);
 if(policy.startsAt&&now.getTime()<Date.parse(String(policy.startsAt)))fail('CAMPAIGN_NOT_STARTED');
 if(policy.closesAt&&now.getTime()>=Date.parse(String(policy.closesAt)))fail('CAMPAIGN_CLOSED');
 if(policy.brandKitId&&policy.brandKitId!==request.brandKitId)fail('STORE_BRAND_KIT_REQUIRED');
 const amount=new Decimal(money(request.amount)),remaining=new Decimal(money(budget.limit??'0')).minus(money(budget.spent??'0')).minus(money(budget.reserved??'0'));
 if(amount.gt(remaining))fail('STORE_BUDGET_EXCEEDED');
 return {eligible:true,amount:amount.toFixed(2),remaining:remaining.minus(amount).toFixed(2),currency:'USD',approvalRequired:policy.approvalRequired===true,fundraisingAllocation:amount.times(new Decimal(String(policy.fundraisingPercent??0))).div(100).toFixed(2)};
}
async function context(tx:Tx,a:Actor,i:Input,lock=false){
 const store=await get(tx,a,'stores',i.storeId??i.id,lock);if(store.status!=='ACTIVE')fail('STORE_NOT_ACTIVE');
 const userId=a.role==='customer'?a.userId:text(i.userId??a.userId);
 const buyer=(await list(tx,a,'store_memberships',1000)).find(r=>r.store_id===store.id&&r.data.userId===userId&&r.status==='ACTIVE');if(!buyer)return fail('STORE_BUYER_NOT_ELIGIBLE',403);
 const record=(await list(tx,a,'spending_budgets',1000)).find(r=>r.store_id===store.id&&r.data.userId===userId&&r.status==='ACTIVE');if(!record)return fail('STORE_BUDGET_NOT_CONFIGURED');
 const budget=lock?await get(tx,a,'spending_budgets',record.id,true):record;
 if(i.productId){const assigned=(await list(tx,a,'store_products',1000)).some(r=>r.store_id===store.id&&r.product_id===i.productId&&r.status==='ACTIVE');if(!assigned)fail('PRODUCT_NOT_IN_STORE',403);}
 return {store,buyer,budget,userId};
}
export async function handleStores(tx:Tx,a:Actor,action:string,i:Input):Promise<unknown>{
 authorize(a,'stores',action);
 if(['create','create_store'].includes(action)){staff(a);const type=text(i.type);if(!(STORE_TYPES as readonly string[]).includes(type))fail('INVALID_STORE_TYPE',400);if(i.legalEntityId)await get(tx,a,'legal_entities',i.legalEntityId);if(i.brandKitId)await get(tx,a,'brand_kits',i.brandKitId);
  const startsAt=i.startsAt?new Date(text(i.startsAt)).toISOString():null,closesAt=i.closesAt?new Date(text(i.closesAt)).toISOString():null;if(startsAt&&closesAt&&startsAt>=closesAt)fail('INVALID_CAMPAIGN_WINDOW',400);
  const r=await create(tx,a,'stores',{title:text(i.name??i.title),status:'DRAFT',data:{type,brandKitId:i.brandKitId??null,startsAt,closesAt,legalEntityId:i.legalEntityId??null,approvalRequired:i.approvalRequired!==false,fundraisingPercent:String(number(i.fundraisingPercent??0,0,100)),currency:'USD',settlement:'BLOCKED_PENDING_FINANCIAL_APPROVAL'}});await event(tx,a,'stores.created',r.id);return r;
 }
 if(['update','update_store','review','approve','archive'].includes(action)){staff(a);const r=await get(tx,a,'stores',i.id,true);const next=action==='approve'?'ACTIVE':action==='review'?'REVIEWED':action==='archive'?'ARCHIVED':r.status;if(action==='review'&&r.status!=='DRAFT')fail('INVALID_TRANSITION');if(action==='approve'&&!['DRAFT','REVIEWED'].includes(r.status))fail('INVALID_TRANSITION');
  const result=await update(tx,a,'stores',r.id,{title:i.name?text(i.name):r.title,status:next,data:{...r.data,...(i.closesAt?{closesAt:new Date(text(i.closesAt)).toISOString()}:{}),...(i.approvalRequired===undefined?{}:{approvalRequired:i.approvalRequired===true})}});await event(tx,a,`stores.${action}`,r.id,{from:r.status,to:next});return result;
 }
 if(action==='add_member'){staff(a);const store=await get(tx,a,'stores',i.storeId),userId=text(i.userId);const existing=(await list(tx,a,'store_memberships',1000)).find(r=>r.store_id===store.id&&r.data.userId===userId);if(existing)fail('STORE_MEMBER_EXISTS');const r=await create(tx,a,'store_memberships',{title:typeof i.name==='string'?text(i.name):userId,status:'ACTIVE',store_id:store.id,owner_id:userId,data:{userId,eligible:i.eligible!==false,approvedBy:a.userId}});await event(tx,a,'stores.member_added',r.id,{storeId:store.id});return r;}
 if(action==='assign_product'){staff(a);const store=await get(tx,a,'stores',i.storeId),product=await get(tx,a,'products',i.productId);if(product.status!=='PUBLISHED')fail('PRODUCT_NOT_PUBLISHED');const existing=(await list(tx,a,'store_products',1000)).find(r=>r.store_id===store.id&&r.product_id===product.id);if(existing)return existing;const r=await create(tx,a,'store_products',{title:product.title,status:'ACTIVE',store_id:store.id,product_id:product.id,data:{assignedBy:a.userId,brandKitId:store.data.brandKitId??null}});await event(tx,a,'stores.product_assigned',r.id);return r;}
 if(action==='set_budget'){staff(a);const store=await get(tx,a,'stores',i.storeId),userId=text(i.userId),limit=money(i.limit);const existing=(await list(tx,a,'spending_budgets',1000)).find(r=>r.store_id===store.id&&r.data.userId===userId);if(existing&&new Decimal(limit).lt(new Decimal(String(existing.data.spent??0)).plus(String(existing.data.reserved??0))))fail('BUDGET_BELOW_COMMITTED_AMOUNT');const r=existing?await update(tx,a,'spending_budgets',existing.id,{data:{...existing.data,limit}}):await create(tx,a,'spending_budgets',{title:`Budget for ${userId}`,status:'ACTIVE',store_id:store.id,owner_id:userId,data:{userId,limit,spent:'0.00',reserved:'0.00',currency:'USD'}});await event(tx,a,'stores.budget_set',r.id,{limit});return r;}
 if(action==='validate_budget'||action==='reserve_budget'){
  const {store,buyer,budget,userId}=await context(tx,a,i,action==='reserve_budget');const request={amount:money(i.amount),brandKitId:typeof i.brandKitId==='string'?i.brandKitId:undefined};const result=validateStorePolicy(store.data,buyer.data,budget.data,request);
  if(action==='validate_budget')return {...result,storeId:store.id,userId,simulated:true};
  staff(a);return idempotent(tx,a,'stores.reserve_budget',i.idempotencyKey,{storeId:store.id,userId,...request},async()=>{if(result.approvalRequired&&i.approved!==true)fail('STORE_APPROVAL_REQUIRED');await update(tx,a,'spending_budgets',budget.id,{data:{...budget.data,reserved:new Decimal(String(budget.data.reserved??0)).plus(result.amount).toFixed(2)}});const reservation=await create(tx,a,'allowances',{title:`Reservation ${store.title}`,status:'RESERVED',store_id:store.id,owner_id:userId,data:{userId,amount:result.amount,fundraisingAllocation:result.fundraisingAllocation,budgetId:budget.id,approvedBy:a.userId}});await event(tx,a,'stores.budget_reserved',reservation.id,{storeId:store.id,amount:result.amount});return {...result,reservationId:reservation.id};});
 }
 if(action==='fundraiser_allocation'){staff(a);const store=await get(tx,a,'stores',i.storeId);if(!['SCHOOL','FUNDRAISER'].includes(String(store.data.type)))fail('NOT_FUNDRAISER_PROGRAM');const allowances=(await list(tx,a,'allowances',1000)).filter(r=>r.store_id===store.id);return {storeId:store.id,amount:allowances.reduce((s,r)=>s.plus(String(r.data.fundraisingAllocation??0)),new Decimal(0)).toFixed(2),currency:'USD',settlement:'BLOCKED_PENDING_FINANCIAL_APPROVAL',evidence:'LOCAL_REFERENCE_ONLY'};}
 return fail('UNSUPPORTED_STORE_COMMAND',400);
}
