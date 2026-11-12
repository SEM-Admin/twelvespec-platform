import Decimal from 'decimal.js';
import {authorize,create,get,list,update,event,fail,text,type Actor,type Tx,type Input,type Row,type Table} from '../../kernel/src/index';
import {scopedMeasurements} from './aggregates';
export const REPORT_TYPES=['ORDERS','PROFITABILITY','PIPELINE','SUPPLIER_HEALTH','OWNER_HOURS','AUDIT'] as const;
export function escapeCsv(value:unknown):string {let s=value===null||value===undefined?'':typeof value==='object'?JSON.stringify(value):String(value);if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
export function freshnessState(observedAt:unknown,windowMinutes:number,now=new Date()):'UNKNOWN'|'FRESH'|'STALE'{if(typeof observedAt!=='string'||!Number.isFinite(Date.parse(observedAt)))return 'UNKNOWN';return now.getTime()-Date.parse(observedAt)>windowMinutes*60000?'STALE':'FRESH';}
function plain(row:Row){return {id:row.id,title:row.title,status:row.status,createdAt:row.created_at,...row.data};}
export async function runReport(tx:Tx,a:Actor,type:string){
 authorize(a,'analytics','run_report');
 const mapping:Record<string,Table>={ORDERS:'orders',PROFITABILITY:'profit_snapshots',PIPELINE:'opportunities',SUPPLIER_HEALTH:'sync_runs',OWNER_HOURS:'time_entries',AUDIT:'audit_events'};const table=mapping[type];if(!table)fail('UNKNOWN_REPORT_TYPE',400);const rows=await list(tx,a,table,1000),count=(await tx.query(`select count(*)::int as count from app.${table} where tenant_id=$1 and workspace_id=$2`,[a.tenantId,a.workspaceId])).rows[0].count as number;
 const summary:Input={rowCount:count,displayedCount:rows.length,limit:1000,truncated:count>1000,evidence:'SYNTHETIC_LOCAL'};
 summary.totalsScope='COMPLETE_WORKSPACE';
 if(type==='PROFITABILITY'||type==='OWNER_HOURS'){
  const measure=await scopedMeasurements(tx,a,type);summary.measurement=measure;
  summary[type==='PROFITABILITY'?'grossProfit':'hours']=measure.total===null?null:new Decimal(measure.total).toFixed(2);
  if(type==='PROFITABILITY')summary.currency='USD';
 }
 if(type==='PIPELINE')summary.openOpportunities=Number((await tx.query("select count(*) n from app.opportunities where tenant_id=$1 and workspace_id=$2 and status not in ('WON','LOST')",[a.tenantId,a.workspaceId])).rows[0].n);
 if(type==='SUPPLIER_HEALTH')summary.failures=Number((await tx.query("select count(*) n from app.sync_runs where tenant_id=$1 and workspace_id=$2 and status in ('FAILED','ERROR','BLOCKED')",[a.tenantId,a.workspaceId])).rows[0].n);
 return {type,generatedAt:new Date().toISOString(),summary,rows:rows.map(plain)};
}
export async function handleAnalytics(tx:Tx,a:Actor,action:string,i:Input):Promise<unknown>{
 authorize(a,'analytics',action);
 if(['create','create_report'].includes(action)){const type=text(i.type??'ORDERS');if(!(REPORT_TYPES as readonly string[]).includes(type))fail('UNKNOWN_REPORT_TYPE',400);const r=await create(tx,a,'report_definitions',{title:text(i.title),status:'ACTIVE',data:{type,columns:Array.isArray(i.columns)?i.columns.map(x=>text(x)):[],createdBy:a.userId}});await event(tx,a,'analytics.report_created',r.id);return r;}
 if(action==='run_report'||action==='export_report'){
  const report=i.id?await get(tx,a,'report_definitions',i.id):null;const result=await runReport(tx,a,String(report?.data.type??i.type??'ORDERS'));
  if(action==='run_report')return result;
  const allowed=report?.data.columns;const columns=Array.isArray(allowed)&&allowed.length?allowed.map(String):['id','title','status','createdAt'];const csv=[columns.map(escapeCsv).join(','),...result.rows.map(row=>columns.map(k=>escapeCsv((row as Input)[k])).join(','))].join('\r\n');await event(tx,a,'analytics.exported',report?.id??a.workspaceId,{type:result.type,count:result.rows.length,truncated:result.summary.truncated});return {fileName:`twelvespec-${result.type.toLowerCase()}.csv`,contentType:'text/csv',content:csv,summary:result.summary};
 }
 if(action==='freshness'){
  const [sources,runs]=await Promise.all([list(tx,a,'supplier_offers',1000),list(tx,a,'sync_runs',1000)]);return {generatedAt:new Date().toISOString(),sources:sources.map(r=>({id:r.id,title:r.title,price:freshnessState(r.data.observedAt??r.data.sourceTimestamp??r.updated_at,1440),inventory:freshnessState(r.data.inventoryObservedAt,60),lastSafePublishedRevision:r.data.publishedRevision??null})),runs:runs.map(r=>({id:r.id,title:r.title,status:r.status,at:r.created_at,remediation:r.status==='FAILED'?'Review credentials, rate limits and staged conflicts; retain last safe publication.':null}))};
 }
 if(action==='review'||action==='approve'){const r=await get(tx,a,'report_definitions',i.id,true);const result=await update(tx,a,'report_definitions',r.id,{data:{...r.data,reviewedBy:a.userId,reviewedAt:new Date().toISOString(),approval:action==='approve'?'APPROVED':'REVIEWED'}});await event(tx,a,`analytics.${action}`,r.id);return result;}
 if(['update','archive'].includes(action)){const r=await get(tx,a,'report_definitions',i.id,true);const result=await update(tx,a,'report_definitions',r.id,{title:i.title?text(i.title):r.title,status:action==='archive'?'ARCHIVED':r.status});await event(tx,a,`analytics.${action}`,r.id);return result;}
 return fail('UNSUPPORTED_ANALYTICS_COMMAND',400);
}
