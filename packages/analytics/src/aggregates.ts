/** Complete scoped aggregates; display/export row limits never define a total. */
import {authorize,type Actor,type Tx} from '../../kernel/src';
type MeasureRow={row_count:string;known_count:string;subtotal:string|null};
function measurement(row:MeasureRow){
 const rowCount=Number(row.row_count),knownCount=Number(row.known_count),subtotal=row.subtotal;
 return {rowCount,knownCount,unknownCount:rowCount-knownCount,recordedSubtotal:subtotal,total:rowCount>0&&rowCount===knownCount?subtotal:null};
}
export async function scopedMeasurements(tx:Tx,a:Actor,kind:'PROFITABILITY'|'OWNER_HOURS'|'QUOTE_VALUE'|'CLOSEOUT_HOURS'){
 authorize(a,'analytics','run_report');
 const table=kind==='OWNER_HOURS'?'time_entries':kind==='QUOTE_VALUE'?'quotes':'profit_snapshots';
 const value=kind==='PROFITABILITY'?"coalesce(data->>'grossProfit',data->>'profit')":kind==='OWNER_HOURS'?"data->>'hours'":kind==='CLOSEOUT_HOURS'?"data->>'ownerHours'":"data->>'total'";
 const pattern=kind==='PROFITABILITY'?'^-?[0-9]{1,20}([.][0-9]{1,8})?$':'^[0-9]{1,20}([.][0-9]{1,8})?$';
 const currency=['PROFITABILITY','QUOTE_VALUE','CLOSEOUT_HOURS'].includes(kind)?"and data->>'currency'='USD'":'';
 // A historical default zero cannot establish that time was measured. Explicit
 // zero from a new reviewed closeout is distinguishable from missing input.
 const explicitTime=kind==='CLOSEOUT_HOURS'?`and (case when ${value} ~ $3 then (${value})::numeric>0 else false end or data->>'ownerHoursState'='RECORDED')`:'';
 const filter=kind==='QUOTE_VALUE'?"and status not in ('ACCEPTED','EXPIRED','DECLINED','ARCHIVED')":'';
 const row=(await tx.query(`with measured as (select case when ${value} ~ $3 ${currency} ${explicitTime} then (${value})::numeric else null end value from app.${table} where tenant_id=$1 and workspace_id=$2 ${filter})
  select count(*)::text row_count,count(value)::text known_count,sum(value)::text subtotal from measured`,[a.tenantId,a.workspaceId,pattern])).rows[0] as MeasureRow;
 return measurement(row);
}
export async function scopedOperationalCounts(tx:Tx,a:Actor){
 authorize(a,'today','dashboard');
 return (await tx.query(`select
  (select count(*)::int from app.orders where tenant_id=$1 and workspace_id=$2) orders,
  (select count(*)::int from app.orders where tenant_id=$1 and workspace_id=$2 and status not in ('CLOSED','FULFILLED','CANCELLED')) "ordersInMotion",
  (select count(*)::int from app.quotes where tenant_id=$1 and workspace_id=$2 and status not in ('ACCEPTED','EXPIRED','DECLINED','ARCHIVED')) "openQuotes",
  (select count(*)::int from app.jobs where tenant_id=$1 and workspace_id=$2 and status not in ('COMPLETE','CLOSED')) "jobsDue",
  (select count(*)::int from app.products where tenant_id=$1 and workspace_id=$2) "productCount",
  (select count(*)::int from app.products where tenant_id=$1 and workspace_id=$2 and status='PUBLISHED') "publishedProducts",
  (select count(*)::int from app.work_items where tenant_id=$1 and workspace_id=$2 and status<>'COMPLETE') "openTasks",
  (select count(*)::int from app.work_items where tenant_id=$1 and workspace_id=$2 and status='WAITING') "waitingTasks",
  (select count(*)::int from app.exceptions where tenant_id=$1 and workspace_id=$2 and status<>'RESOLVED') "openExceptions",
  (select count(*)::int from app.jobs where tenant_id=$1 and workspace_id=$2 and status in ('BLOCKED','QC_PENDING','PLANNED')) "waitingJobs"`,[a.tenantId,a.workspaceId])).rows[0];
}
