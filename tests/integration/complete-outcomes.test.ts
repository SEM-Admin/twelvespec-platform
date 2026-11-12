import {randomUUID} from 'node:crypto';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {actors} from '../helpers';
import {transaction,pool,create,type Actor,type Input,type Row,type Table} from '../../packages/kernel/src';
import {handleAnalytics} from '../../packages/analytics/src';
import {dashboard} from '../../packages/today/src';
import {handleFinance} from '../../packages/finance/src';
let owner:Actor,customer:Actor;
beforeAll(async()=>({owner,customer}=await actors()));afterAll(async()=>{await pool().end();});
async function workspace(){
 const tenantId=randomUUID(),workspaceId=randomUUID();await pool().query('insert into tenants(id,name) values($1,$2)',[tenantId,'SYNTHETIC aggregate test']);
 await pool().query('insert into workspaces(id,tenant_id,name) values($1,$2,$3)',[workspaceId,tenantId,'SYNTHETIC totals']);
 await pool().query('insert into memberships(user_id,tenant_id,workspace_id,role) values($1,$2,$3,$4)',[owner.userId,tenantId,workspaceId,'owner']);return {...owner,tenantId,workspaceId};
}
async function batch(a:Actor,table:Table,status:string,data:Input,count=1205){
 await transaction(a,tx=>tx.query(`insert into app.${table}(tenant_id,workspace_id,owner_id,title,status,data,created_at)
  select $1,$2,$3,'SYNTHETIC total '||n,$4,$5::jsonb,now()-interval '2 days' from generate_series(1,$6)n`,[a.tenantId,a.workspaceId,a.userId,status,JSON.stringify(data),count]));
}
describe('complete-data operating totals without fabricated profit or time',()=>{
 it('aggregates more than 1000 financial/time/pipeline/failure records while accurately labeling capped rows',async()=>{
  const a=await workspace();await batch(a,'time_entries','RECORDED',{hours:'0.25'});await batch(a,'profit_snapshots','CLOSED',{currency:'USD',grossProfit:'2.00',ownerHours:'0.10',ownerHoursState:'RECORDED'});await batch(a,'opportunities','OPEN',{});await batch(a,'sync_runs','FAILED',{});
  for(const [type,key,value] of [['OWNER_HOURS','hours','301.25'],['PROFITABILITY','grossProfit','2410.00'],['PIPELINE','openOpportunities',1205],['SUPPLIER_HEALTH','failures',1205]]){
   const report=await transaction(a,tx=>handleAnalytics(tx,a,'run_report',{type})) as {summary:Input;rows:Input[]};expect(report.rows).toHaveLength(1000);expect(report.summary).toMatchObject({rowCount:1205,displayedCount:1000,truncated:true,totalsScope:'COMPLETE_WORKSPACE',[key]:value});
  }
  const actual=await transaction(a,tx=>dashboard(tx,a));expect(actual.metrics).toMatchObject({ownerHours:'301.25',grossProfit:'2410.00',grossProfitPerOwnerHour:'20.00'});
  const clean=await transaction(owner,tx=>dashboard(tx,owner));expect(clean.metrics.measurements.profit.rowCount).not.toBe(1205);
 });
 it('counts all operating work and filters completed records before limiting attention queues',async()=>{
  const a=await workspace();await batch(a,'orders','CONFIRMED',{});await batch(a,'jobs','PLANNED',{});await batch(a,'products','PUBLISHED',{});await batch(a,'quotes','DRAFT',{currency:'USD'});await batch(a,'work_items','COMPLETE',{});await batch(a,'exceptions','RESOLVED',{});
  await transaction(a,async tx=>{await create(tx,a,'work_items',{title:'SYNTHETIC oldest open task',status:'OPEN'});await create(tx,a,'exceptions',{title:'SYNTHETIC critical exception',status:'OPEN',data:{severity:'CRITICAL'}});});
  const result=await transaction(a,tx=>dashboard(tx,a));expect(result.metrics).toMatchObject({orders:1205,ordersInMotion:1205,jobsDue:1205,publishedProducts:1205,openQuotes:1205,unpricedQuotes:1205,quoteValue:null,openTasks:1,openExceptions:1});expect(result.tasks).toHaveLength(1);expect(result.exceptions).toHaveLength(1);expect(result.waiting).toHaveLength(1000);expect(result.listsTruncated.waiting).toBe(true);
 });
 it('keeps missing, malformed and non-USD economics unknown and uses only corresponding closeout hours for a ratio',async()=>{
  const a=await workspace();let result=await transaction(a,tx=>dashboard(tx,a));expect(result.metrics).toMatchObject({ownerHours:null,grossProfit:null,grossProfitPerOwnerHour:null});
  await batch(a,'time_entries','RECORDED',{hours:'5.00'},1);await batch(a,'profit_snapshots','CLOSED',{currency:'USD',grossProfit:'-10.00',ownerHours:'2.00'},1);
  result=await transaction(a,tx=>dashboard(tx,a));expect(result.metrics).toMatchObject({ownerHours:'5.00',grossProfit:'-10.00',grossProfitPerOwnerHour:'-5.00'});
  await batch(a,'time_entries','RECORDED',{hours:'not measured'},1);await batch(a,'profit_snapshots','CLOSED',{currency:'CAD',grossProfit:'100.00',ownerHours:'1.00'},1);await batch(a,'profit_snapshots','CLOSED',{currency:'USD'},1);
  result=await transaction(a,tx=>dashboard(tx,a));expect(result.metrics).toMatchObject({ownerHours:null,grossProfit:null,grossProfitPerOwnerHour:null});expect(result.metrics.measurements.profit).toMatchObject({knownCount:1,unknownCount:2,recordedSubtotal:'-10.00'});
  const report=await transaction(a,tx=>handleAnalytics(tx,a,'run_report',{type:'OWNER_HOURS'})) as {summary:Input};expect(report.summary.hours).toBeNull();
  await expect(transaction(customer,tx=>dashboard(tx,customer))).rejects.toThrow('PERMISSION_DENIED');
 });
 it.each([undefined,null,'0'])('distinguishes missing time from an explicit measured zero at closeout (hours=%s)',async ownerHours=>{
  const a=await workspace();const order=await transaction(a,tx=>create(tx,a,'orders',{title:'SYNTHETIC closeout',status:'FULFILLED',data:{total:'100.00',landedCost:'50.00'}}));
  await transaction(a,tx=>handleFinance(tx,a,'record_actual',{orderId:order.id,amount:'55.00',source:'SYNTHETIC actual fixture'}));
  const known=ownerHours==='0',snapshot=await transaction(a,tx=>handleFinance(tx,a,'closeout',{orderId:order.id,ownerHours})) as Row;expect(snapshot.data).toMatchObject({ownerHours:known?'0.00':null,ownerHoursState:known?'RECORDED':'UNKNOWN',profitPerOwnerHour:null});
  const result=await transaction(a,tx=>dashboard(tx,a));expect(result.metrics.grossProfit).toBe('45.00');expect(result.metrics.grossProfitPerOwnerHour).toBeNull();
  expect(result.metrics.measurements.closeoutTime.unknownCount).toBe(known?0:1);
 });
});
