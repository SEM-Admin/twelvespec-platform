import {beforeAll,describe,it,expect} from 'vitest';
import {loadEnv} from '../../scripts/env';
import {pool,transaction,DEMO,type Actor,type Row,type Input,create,get,list,update,hash} from '../../packages/kernel/src/index';
import {handleCommerce} from '../../packages/commerce/src/index';
import {handleSales,publicOrder,publicQuote} from '../../packages/sales/src/index';
import {handleOrders} from '../../packages/orders/src/index';
import {handleProcurement} from '../../packages/procurement/src/index';
import {handleFulfillment} from '../../packages/fulfillment/src/index';
import {handleFinance} from '../../packages/finance/src/index';
loadEnv();let owner:Actor,customer:Actor;
beforeAll(async()=>{
 const members=(await pool().query('select user_id,role from memberships where tenant_id=$1 and workspace_id=$2',[DEMO.tenant,DEMO.workspace])).rows;
 const ownerMember=members.find(r=>r.role==='owner'),customerMember=members.find(r=>r.role==='customer');if(!ownerMember||!customerMember)throw new Error('Run npm run setup before PostgreSQL acceptance tests');owner={tenantId:DEMO.tenant,workspaceId:DEMO.workspace,userId:ownerMember.user_id,role:'owner'};customer={...owner,userId:customerMember.user_id,role:'customer'};
});
async function fixtures(method='none'){
 return transaction(owner,async tx=>{
  const connection=await create(tx,owner,'connections',{title:'Synthetic workflow supplier',status:'VALIDATED',data:{providerType:'PROMOSTANDARDS_SOAP',environment:'mock',verification:'MOCKED'}});
  const ids=[];
  for(const [i,name] of ['Undecorated cap','Blank brochure stock','Unprinted tent'].entries()){
   const p=await create(tx,owner,'products',{title:name,status:'PUBLISHED',data:{sku:'TEST-'+Date.now()+'-'+i,category:['APPAREL','PRINT','EVENT'][i],minimumQuantity:12,methods:[method],locations:['front'],freshness:'FRESH'}});
   const v=await create(tx,owner,'variants',{title:name+' · Navy',status:'ACTIVE',product_id:p.id,data:{color:'Navy',hex:'#14263f',size:'Standard',available:true}});
   await create(tx,owner,'supplier_offers',{title:'Confidential source · '+name,status:'ACTIVE',product_id:p.id,variant_id:v.id,connection_id:connection.id,data:{unitCost:'6.00',currency:'USD',minimumQuantity:12,decorationCost:'1.50',setupCost:'25.00',freight:'15.00',observedAt:new Date().toISOString(),validUntil:new Date(Date.now()+3600000).toISOString(),verification:'MOCKED',supplierName:'PRIVATE-WORKFLOW-SUPPLIER',sourceSku:'PRIVATE-WORKFLOW-SKU'}});
   ids.push({productId:p.id,variantId:v.id,quantity:24,method,location:'front'});
  }
  if(!(await list(tx,owner,'legal_entities')).length)await create(tx,owner,'legal_entities',{title:'Synthetic local seller',status:'ACTIVE',data:{legalName:'TwelveSpec Test Seller',address:'Synthetic local address',terms:'Synthetic agreements only'}});
  return {connectionId:connection.id,lines:ids};
 });
}
async function issuedOrder(method='none'){
 const fixture=await fixtures(method);const cart=await transaction(customer,tx=>handleCommerce(tx,customer,'create',{title:'Synthetic mixed workflow',lines:fixture.lines})) as Row;
 const request=await transaction(customer,tx=>handleCommerce(tx,customer,'submit_request',{id:cart.id,key:'request-'+cart.id})) as Row;
 let quote=await transaction(owner,tx=>handleSales(tx,owner,'create',{requestId:request.id,title:'Mixed source quote'})) as Row;
 quote=await transaction(owner,tx=>handleSales(tx,owner,'cost_quote',{id:quote.id})) as Row;
 quote=await transaction(owner,tx=>handleSales(tx,owner,'issue_quote',{id:quote.id,key:'issue-'+quote.id})) as Row;
 const result=await transaction(customer,tx=>handleSales(tx,customer,'accept_quote',{id:quote.id,key:'accept-'+quote.id,termsAccepted:true})) as {id:string};
 return {fixture,quote,order:await transaction(owner,tx=>get(tx,owner,'orders',result.id))};
}
describe('PostgreSQL cross-module sales → MIS → purchasing → fulfillment → finance',()=>{
 it('preserves a mixed customer agreement through independent jobs, uncertain PO reconciliation, partial shipments and profit closeout',async()=>{
  const {fixture,quote,order}=await issuedOrder();expect(order.owner_id).toBe(customer.userId);expect(order.data.terms).toBe('PREPAID');
  const oldSnapshot=hash(order.data.lines);const revision=await transaction(owner,tx=>get(tx,owner,'quote_revisions',quote.data.revisionId));
  await transaction(owner,tx=>update(tx,owner,'products',fixture.lines[0].productId,{title:'Curated replacement title'}));expect(hash(revision.data.lines)).toBe(oldSnapshot);
  const allocation=await transaction(owner,tx=>handleOrders(tx,owner,'allocate_jobs',{id:order.id,key:'allocate-'+order.id})) as {jobs:Row[]};expect(allocation.jobs).toHaveLength(3);
  const payment=await transaction(owner,tx=>handleFinance(tx,owner,'record_payment_reference',{orderId:order.id,externalId:'MOCK-PAY-'+order.id,amount:order.data.total})) as Row;
  await transaction(owner,tx=>handleFinance(tx,owner,'reconcile_mock_payment',{id:payment.id,eventId:'event-'+payment.id}));await transaction(owner,tx=>handleFinance(tx,owner,'reconcile_mock_payment',{id:payment.id,eventId:'event-'+payment.id}));
  const receipts=await transaction(owner,tx=>list(tx,owner,'webhook_receipts',1000));expect(receipts.filter(r=>r.data.paymentId===payment.id)).toHaveLength(1);
  const purchase=await transaction(owner,tx=>handleProcurement(tx,owner,'prepare_po',{orderId:order.id,connectionId:fixture.connectionId,key:'prepare-'+order.id})) as {purchaseOrders:Row[]};expect(purchase.purchaseOrders).toHaveLength(3);
  const po=purchase.purchaseOrders[0];await transaction(owner,tx=>handleProcurement(tx,owner,'approve_po',{id:po.id,reason:'Synthetic purchase approval'}));
  const uncertain=await transaction(owner,tx=>handleProcurement(tx,owner,'submit_po',{id:po.id,key:'submit-'+po.id,simulateTimeout:true})) as Row;expect(uncertain.status).toBe('UNKNOWN_OUTCOME');
  await expect(transaction(owner,tx=>handleProcurement(tx,owner,'submit_po',{id:po.id,key:'blind-retry-'+po.id}))).rejects.toThrow('RECONCILIATION_REQUIRED');
  await transaction(owner,tx=>handleProcurement(tx,owner,'reconcile_outcome',{id:po.id,outcome:'ACKNOWLEDGED',reference:'MOCK-LOOKUP-'+po.id}));
  for(const job of allocation.jobs){await transaction(owner,tx=>handleOrders(tx,owner,'start_job',{id:job.id}));await transaction(owner,tx=>handleOrders(tx,owner,'record_qc',{id:job.id,passed:true,notes:'Synthetic quantity and damage inspection'}));await transaction(owner,tx=>handleOrders(tx,owner,'close_job',{id:job.id}));}
  const lines=(await transaction(owner,tx=>list(tx,owner,'order_lines',1000))).filter(l=>l.order_id===order.id);const beforeHash=hash(lines.map(l=>l.data));
  await transaction(owner,tx=>handleFulfillment(tx,owner,'create_shipment',{orderId:order.id,lines:[{orderLineId:lines[0].id,quantity:12}],tracking:'MOCK-PARTIAL',key:'partial-'+order.id}));expect((await transaction(owner,tx=>get(tx,owner,'orders',order.id))).status).toBe('PARTIALLY_FULFILLED');
  await expect(transaction(owner,tx=>handleFulfillment(tx,owner,'create_shipment',{orderId:order.id,lines:[{orderLineId:lines[0].id,quantity:24}],tracking:'MOCK-OVER',key:'over-'+order.id}))).rejects.toThrow('OVERSHIPMENT_BLOCKED');
  await transaction(owner,tx=>handleFulfillment(tx,owner,'create_shipment',{orderId:order.id,lines:lines.map((l,i)=>({orderLineId:l.id,quantity:i===0?12:24})),tracking:'MOCK-REMAINING',key:'remaining-'+order.id}));
  expect((await transaction(owner,tx=>get(tx,owner,'orders',order.id))).status).toBe('FULFILLED');
  expect(hash((await transaction(owner,tx=>list(tx,owner,'order_lines',1000))).filter(l=>l.order_id===order.id).map(l=>l.data))).toBe(beforeHash);
  await transaction(owner,tx=>handleFinance(tx,owner,'record_actual',{orderId:order.id,component:'material_cost',amount:'450',source:'Synthetic fixture invoice',key:'actual-'+order.id}));
  const profit=await transaction(owner,tx=>handleFinance(tx,owner,'closeout',{orderId:order.id,ownerHours:'2'})) as Row;expect(profit.data.grossProfit).toBeDefined();expect(profit.data.profitPerOwnerHour).toBeDefined();expect((await transaction(owner,tx=>get(tx,owner,'orders',order.id))).status).toBe('CLOSED');
  for(const projection of [publicQuote(quote),publicOrder(order)])expect(JSON.stringify(projection)).not.toMatch(/PRIVATE-WORKFLOW|sourceEvidence|landedCost|supplierName/);
 },60000);
 it('blocks decorated production and supplier dispatch while real artwork/preflight requirements remain unmet',async()=>{
  const {fixture,order}=await issuedOrder('screen_print');const allocated=await transaction(owner,tx=>handleOrders(tx,owner,'allocate_jobs',{id:order.id,key:'allocate-'+order.id})) as {jobs:Row[]};const payment=await transaction(owner,tx=>handleFinance(tx,owner,'record_payment_reference',{orderId:order.id,externalId:'MOCK-PAY-'+order.id,amount:order.data.total})) as Row;await transaction(owner,tx=>handleFinance(tx,owner,'reconcile_mock_payment',{id:payment.id,eventId:'event-'+payment.id}));
  await expect(transaction(owner,tx=>handleOrders(tx,owner,'start_job',{id:allocated.jobs[0].id}))).rejects.toThrow('PRODUCTION_ARTWORK_REQUIRED');const prepared=await transaction(owner,tx=>handleProcurement(tx,owner,'prepare_po',{orderId:order.id,connectionId:fixture.connectionId,key:'prepare-'+order.id})) as {purchaseOrders:Row[]};await transaction(owner,tx=>handleProcurement(tx,owner,'approve_po',{id:prepared.purchaseOrders[0].id,reason:'Synthetic authorization'}));await expect(transaction(owner,tx=>handleProcurement(tx,owner,'submit_po',{id:prepared.purchaseOrders[0].id,key:'blocked-'+order.id}))).rejects.toThrow('PRODUCTION_ARTWORK_REQUIRED');
 },60000);
});
