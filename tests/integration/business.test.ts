import {beforeAll,describe,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {actors} from '../helpers';
import {transaction,create,get,list,type Actor,type Row,type Table} from '../../packages/kernel/src/index';
import {handleCrm} from '../../packages/crm/src/index';
import {handleMarketing} from '../../packages/marketing/src/index';
import {handleStores,validateStorePolicy} from '../../packages/stores/src/index';
import {handleByob} from '../../packages/byob/src/index';
import {handleWorkflow} from '../../packages/workflows/src/index';
import {handleAnalytics} from '../../packages/analytics/src/index';
import {handleFoundation} from '../../packages/foundation/src/index';
import {handleToday} from '../../packages/today/src/index';

let owner:Actor,customer:Actor,otherOwner:Actor;
const unique=(prefix:string)=>`${prefix}-${randomUUID()}`;
async function count(a:Actor,table:Table,ruleId:string){const predicate=table==='automation_runs'?'rule_id=$3':"(data->>'sourceRuleId'=$3 or data->>'ruleId'=$3 or data->>'entityId'=$3)";return transaction(a,async tx=>(await tx.query(`select count(*)::int as n from app.${table} where tenant_id=$1 and workspace_id=$2 and ${predicate}`,[a.tenantId,a.workspaceId,ruleId])).rows[0].n as number);}
beforeAll(async()=>{({owner,customer,otherOwner}=await actors());});

describe('A31 — CRM consent and approved local marketing',()=>{
 it('persists contact relationships and a consent-filtered preview, never an external send',async()=>{
  const account=await transaction(owner,tx=>handleCrm(tx,owner,'create_account',{name:unique('Acceptance account')})) as Row;
  const contact=await transaction(owner,tx=>handleCrm(tx,owner,'create_contact',{name:'Consenting Test Buyer',email:`${randomUUID()}@example.test`,accountId:account.id,consent:{marketing:true,source:'TEST_FIXTURE'}})) as Row;
  await transaction(owner,tx=>handleCrm(tx,owner,'create_contact',{name:'Transactional Buyer',email:`${randomUUID()}@example.test`,accountId:account.id,consent:{marketing:false,source:'TEST_FIXTURE'}}));
  const segment=await transaction(owner,tx=>handleMarketing(tx,owner,'create_segment',{title:unique('Consent segment'),accountId:account.id})) as Row;
  const campaign=await transaction(owner,tx=>handleMarketing(tx,owner,'create_campaign',{name:unique('Acceptance campaign'),segmentId:segment.id,channel:'LOCAL_PREVIEW'})) as Row;
  await expect(transaction(owner,tx=>handleMarketing(tx,owner,'publish_campaign',{id:campaign.id,idempotencyKey:unique('no-approval')}))).rejects.toThrow('CAMPAIGN_APPROVAL_REQUIRED');
  await transaction(owner,tx=>handleMarketing(tx,owner,'review_campaign',{id:campaign.id}));
  await transaction(owner,tx=>handleMarketing(tx,owner,'approve_campaign',{id:campaign.id,reason:'Approve synthetic local preview only'}));
  const key=unique('marketing');const publication=await transaction(owner,tx=>handleMarketing(tx,owner,'publish_campaign',{id:campaign.id,idempotencyKey:key,channel:'LOCAL_PREVIEW'})) as Row;
  expect(publication.status).toBe('LOCAL_PREVIEW');expect(publication.data.externalSend).toBe(false);expect(publication.data.audienceIds).toEqual([contact.id]);expect(publication.data.audienceCount).toBe(1);
  const repeated=await transaction(owner,tx=>handleMarketing(tx,owner,'publish_campaign',{id:campaign.id,idempotencyKey:key,channel:'LOCAL_PREVIEW'})) as Row;expect(repeated.id).toBe(publication.id);
  await expect(transaction(customer,tx=>handleCrm(tx,customer,'create_contact',{name:'Forbidden',email:'private@example.test'}))).rejects.toThrow('PERMISSION_DENIED');
  await expect(transaction(owner,tx=>handleMarketing(tx,owner,'send_campaign',{id:campaign.id}))).rejects.toThrow('EXTERNAL_COMMUNICATION_BLOCKED');
  await expect(transaction(otherOwner,tx=>get(tx,otherOwner,'contacts',contact.id))).rejects.toThrow('NOT_FOUND');
  const audit=await transaction(owner,tx=>list(tx,owner,'audit_events',1000));expect(audit.some(r=>r.title==='marketing.preview_published'&&r.data.entityId===publication.id)).toBe(true);
 });
 it('stores lead stage history and rejects shortcut transitions without side effects',async()=>{
  const contact=await transaction(owner,tx=>handleCrm(tx,owner,'create_contact',{name:'Pipeline Buyer',email:`${randomUUID()}@example.test`})) as Row;
  const lead=await transaction(owner,tx=>handleCrm(tx,owner,'create_opportunity',{title:unique('Pipeline test'),contactId:contact.id,estimatedRevenue:'1250.00'})) as Row;
  await expect(transaction(owner,tx=>handleCrm(tx,owner,'advance_lead',{id:lead.id,state:'WON'}))).rejects.toThrow('INVALID_TRANSITION');
  expect((await transaction(owner,tx=>get(tx,owner,'opportunities',lead.id))).status).toBe('NEW');
  for(const state of ['QUALIFIED','OPPORTUNITY','WON'])await transaction(owner,tx=>handleCrm(tx,owner,'advance_lead',{id:lead.id,state}));
  const won=await transaction(owner,tx=>get(tx,owner,'opportunities',lead.id));expect(won.status).toBe('WON');expect(won.data.stageHistory).toHaveLength(4);
 });
});

describe('A26/A27 — company store and school campaign server policy',()=>{
 it('checks the actual buyer membership, assigned product, brand and available budget',async()=>{
  const fixture=await transaction(owner,async tx=>{
   const brand=await create(tx,owner,'brand_kits',{title:unique('Store brand'),status:'ACTIVE',data:{colors:['#233548']}});
   const product=await create(tx,owner,'products',{title:unique('Store product'),status:'PUBLISHED',data:{moq:1}});
   const store=await handleStores(tx,owner,'create_store',{name:unique('Company Store'),type:'CORPORATE_ON_GOING',brandKitId:brand.id,approvalRequired:false}) as Row;
   await handleStores(tx,owner,'approve',{id:store.id});await handleStores(tx,owner,'add_member',{storeId:store.id,userId:customer.userId,name:'Customer buyer'});await handleStores(tx,owner,'assign_product',{storeId:store.id,productId:product.id});await handleStores(tx,owner,'set_budget',{storeId:store.id,userId:customer.userId,limit:'100.00'});
   return {brand,product,store};
  });
  const input={storeId:fixture.store.id,productId:fixture.product.id,brandKitId:fixture.brand.id,amount:'25.00'};
  expect(await transaction(customer,tx=>handleStores(tx,customer,'validate_budget',input))).toMatchObject({eligible:true,remaining:'75.00',approvalRequired:false});
  await expect(transaction(customer,tx=>handleStores(tx,customer,'validate_budget',{...input,amount:'100.01'}))).rejects.toThrow('STORE_BUDGET_EXCEEDED');
  await expect(transaction(customer,tx=>handleStores(tx,customer,'validate_budget',{...input,brandKitId:randomUUID()}))).rejects.toThrow('STORE_BRAND_KIT_REQUIRED');
  await expect(transaction(customer,tx=>handleStores(tx,customer,'validate_budget',{...input,productId:randomUUID()}))).rejects.toThrow('PRODUCT_NOT_IN_STORE');
  await expect(transaction(owner,tx=>handleStores(tx,owner,'validate_budget',{...input,userId:owner.userId}))).rejects.toThrow('STORE_BUYER_NOT_ELIGIBLE');
  await expect(transaction(otherOwner,tx=>get(tx,otherOwner,'stores',fixture.store.id))).rejects.toThrow('NOT_FOUND');
 });
 it('evaluates a persisted school policy with an explicit clock and 15% allocation',async()=>{
  const store=await transaction(owner,tx=>handleStores(tx,owner,'create_store',{name:unique('School fundraiser'),type:'SCHOOL',startsAt:'2030-09-01T00:00:00Z',closesAt:'2030-10-01T00:00:00Z',fundraisingPercent:'15'})) as Row;
  const policy=(await transaction(owner,tx=>get(tx,owner,'stores',store.id))).data;
  const buyer={eligible:true},budget={limit:'1000.00',spent:'0.00',reserved:'0.00'},request={amount:'120.00'};
  expect(validateStorePolicy(policy,buyer,budget,request,new Date('2030-09-15T12:00:00Z'))).toMatchObject({fundraisingAllocation:'18.00',remaining:'880.00'});
  expect(()=>validateStorePolicy(policy,buyer,budget,request,new Date('2030-10-01T00:00:00Z'))).toThrow('CAMPAIGN_CLOSED');
  expect(store.data.settlement).toBe('BLOCKED_PENDING_FINANCIAL_APPROVAL');
 });
});

describe('A28 — BYOB composition and kitting cost lineage',()=>{
 it('persists component product references and charges packaging and assembly separately',async()=>{
  const fixture=await transaction(owner,async tx=>{
   const first=await create(tx,owner,'products',{title:unique('Bundle cap'),status:'PUBLISHED',data:{moq:1}}),second=await create(tx,owner,'products',{title:unique('Bundle notebook'),status:'PUBLISHED',data:{moq:1}});
   const connection=await create(tx,owner,'connections',{title:unique('Kit source'),status:'VALIDATED',data:{environment:'mock',verification:'MOCKED'}});
   const firstVariant=await create(tx,owner,'variants',{title:'Cap standard',status:'ACTIVE',product_id:first.id,data:{color:'Natural'}}),secondVariant=await create(tx,owner,'variants',{title:'Notebook standard',status:'ACTIVE',product_id:second.id,data:{color:'Natural'}});
   const firstOffer=await create(tx,owner,'supplier_offers',{title:'Private cap source',status:'ACTIVE',product_id:first.id,variant_id:firstVariant.id,connection_id:connection.id,data:{unitCost:'4.50',currency:'USD',moq:1,verification:'MOCKED'}}),secondOffer=await create(tx,owner,'supplier_offers',{title:'Private notebook source',status:'ACTIVE',product_id:second.id,variant_id:secondVariant.id,connection_id:connection.id,data:{unitCost:'6.00',currency:'USD',moq:1,verification:'MOCKED'}});
   const bundle=await handleByob(tx,owner,'create_bundle',{name:unique('Kit test'),packagingCost:'2.00',assemblyCost:'1.00'}) as Row;
   await handleByob(tx,owner,'add_component',{bundleId:bundle.id,productId:first.id,quantity:2,sourceOfferId:firstOffer.id});await handleByob(tx,owner,'add_component',{bundleId:bundle.id,productId:second.id,quantity:1,sourceOfferId:secondOffer.id});await handleByob(tx,owner,'approve',{id:bundle.id});return {first,second,bundle,firstOffer,secondOffer};
  });
  const estimate=await transaction(owner,tx=>handleByob(tx,owner,'price_bundle',{bundleId:fixture.bundle.id,quantity:10})) as Record<string,unknown>;
  expect(estimate).toMatchObject({landedCost:'180.00',packagingAndAssembly:'30.00',estimatedTotal:'300.00',quoteOnly:true});expect(estimate.allocations).toEqual(expect.arrayContaining([expect.objectContaining({productId:fixture.first.id,sourceOfferId:fixture.firstOffer.id,totalQuantity:20}),expect.objectContaining({productId:fixture.second.id,sourceOfferId:fixture.secondOffer.id,totalQuantity:10})]));
  const publicEstimate=await transaction(customer,tx=>handleByob(tx,customer,'price_bundle',{bundleId:fixture.bundle.id,quantity:10})) as Record<string,unknown>;expect(publicEstimate).not.toHaveProperty('landedCost');expect(publicEstimate).not.toHaveProperty('packagingAndAssembly');
  const config=await transaction(customer,tx=>handleByob(tx,customer,'save_bundle',{bundleId:fixture.bundle.id,quantity:10,idempotencyKey:unique('bundle')})) as Row;
  expect(config.owner_id).toBe(customer.userId);expect(config.bundle_id).toBe(fixture.bundle.id);expect(config.data.components).toEqual(expect.arrayContaining([{productId:fixture.first.id,quantity:2},{productId:fixture.second.id,quantity:1}]));
  await expect(transaction(customer,tx=>handleByob(tx,customer,'price_bundle',{bundleId:fixture.bundle.id,quantity:10,components:[{productId:fixture.first.id,quantity:2}]}))).rejects.toThrow('REQUIRED_BUNDLE_COMPONENT_MISSING');
 });
});

describe('A32 — automation simulation and replay',()=>{
 it('simulates without changing records and produces one safe effect for a replayed event',async()=>{
  const eventType='proof.approved';const rule=await transaction(owner,tx=>handleWorkflow(tx,owner,'create_rule',{title:unique('Proof review task'),eventType,condition:{op:'eq',field:'status',value:'READY'},action:{type:'create_task',title:unique('Proof task')},throttleSeconds:0})) as Row;
  const countsBefore=await Promise.all((['work_items','automation_runs','outbox_events','audit_events'] as Table[]).map(t=>count(owner,t,rule.id)));
  const result=await transaction(owner,tx=>handleWorkflow(tx,owner,'simulate_rule',{id:rule.id,inputs:{status:'READY'}}));expect(result).toMatchObject({matches:true,sideEffects:0});
  const countsAfter=await Promise.all((['work_items','automation_runs','outbox_events','audit_events'] as Table[]).map(t=>count(owner,t,rule.id)));expect(countsAfter).toEqual(countsBefore);expect((await transaction(owner,tx=>get(tx,owner,'automation_rules',rule.id))).revision).toBe(rule.revision);
  await transaction(owner,tx=>handleWorkflow(tx,owner,'publish_rule',{id:rule.id,fixture:{status:'READY'}}));
  const source=await transaction(owner,tx=>create(tx,owner,'outbox_events',{title:eventType,status:'PENDING',data:{status:'READY',fixture:true}}));
  const processed=await transaction(owner,tx=>handleWorkflow(tx,owner,'process_event',{eventId:source.id}));const replay=await transaction(owner,tx=>handleWorkflow(tx,owner,'process_event',{eventId:source.id}));expect(replay).toEqual(processed);
  const tasks=await transaction(owner,tx=>list(tx,owner,'work_items',1000));expect(tasks.filter(r=>r.data.sourceRuleId===rule.id&&r.data.sourceEventId===source.id)).toHaveLength(1);
  const notifications=await transaction(owner,tx=>list(tx,owner,'notifications',1000));expect(notifications.every(n=>n.data.externalSend!==true)).toBe(true);
 });
});

describe('A30 — reporting uses durable actual references, never settlement claims',()=>{
 it('exports saved owner time records with CSV formula protection and scoped counts',async()=>{
  const title=`=fixture-${randomUUID()}`;const recorded=await transaction(owner,tx=>handleToday(tx,owner,'log_time',{title,hours:'1.25',category:'ACCEPTANCE_TEST'})) as Row;
  const report=await transaction(owner,tx=>handleAnalytics(tx,owner,'create_report',{title:unique('Owner time report'),type:'OWNER_HOURS',columns:['id','title','status']})) as Row;
  const result=await transaction(owner,tx=>handleAnalytics(tx,owner,'run_report',{id:report.id})) as {summary:Record<string,unknown>;rows:Record<string,unknown>[]};expect(result.rows.some(r=>r.id===recorded.id)).toBe(true);expect(Number(result.summary.hours)).toBeGreaterThanOrEqual(1.25);expect(result.summary.evidence).toBe('SYNTHETIC_LOCAL');
  const exported=await transaction(owner,tx=>handleAnalytics(tx,owner,'export_report',{id:report.id})) as {content:string};expect(exported.content).toContain(`"'${title}"`);
  await expect(transaction(customer,tx=>handleAnalytics(tx,customer,'run_report',{id:report.id}))).rejects.toThrow('PERMISSION_DENIED');
  await expect(transaction(otherOwner,tx=>get(tx,otherOwner,'report_definitions',report.id))).rejects.toThrow('NOT_FOUND');
 });
});

describe('Foundation — real membership isolation and immutable authority boundaries',()=>{
 it('lists only scoped members and prevents last-owner demotion/customer escalation',async()=>{
  const members=await transaction(owner,tx=>handleFoundation(tx,owner,'list_members',{})) as {userId:string;role:string}[];expect(members.some(m=>m.userId===owner.userId&&m.role==='owner')).toBe(true);
  await expect(transaction(customer,tx=>handleFoundation(tx,customer,'set_member_role',{userId:customer.userId,role:'owner',reason:'forbidden',idempotencyKey:unique('escalation')}))).rejects.toThrow('PERMISSION_DENIED');
  await expect(transaction(owner,tx=>handleFoundation(tx,owner,'set_member_role',{userId:owner.userId,role:'staff',reason:'cannot remove last owner',idempotencyKey:unique('demotion')}))).rejects.toThrow(/LAST_OWNER_CANNOT_BE_REMOVED|SELF_DEMOTION_REQUIRES_ANOTHER_OWNER/);
  const fresh=await transaction(owner,tx=>handleFoundation(tx,owner,'list_members',{})) as {userId:string;role:string}[];expect(fresh.find(m=>m.userId===owner.userId)?.role).toBe('owner');
 });
});
