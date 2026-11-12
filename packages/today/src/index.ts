import Decimal from 'decimal.js';
import { authorize,create,get,list,update,event,fail,text,number,transition,type Actor,type Tx,type Input } from '../../kernel/src/index';
import {scopedMeasurements,scopedOperationalCounts} from '../../analytics/src/aggregates';
export function rankExceptions(rows:Array<{severity?:string;dueAt?:string}>,now=new Date()){const rank:Record<string,number>={CRITICAL:0,HIGH:1,MEDIUM:2,LOW:3};return [...rows].sort((a,b)=>(rank[a.severity??'MEDIUM']??2)-(rank[b.severity??'MEDIUM']??2)||new Date(a.dueAt??'9999-12-31').getTime()-new Date(b.dueAt??'9999-12-31').getTime());}
export async function dashboard(tx:Tx,a:Actor){
 authorize(a,'today','dashboard');
 const scope=[a.tenantId,a.workspaceId],limit=1000;
 const [tasks,exceptions,waiting,counts,time,profit,closeoutTime,quoteValue]=await Promise.all([
  tx.query("select * from app.work_items where tenant_id=$1 and workspace_id=$2 and status<>'COMPLETE' order by created_at,id limit 1000",scope),
  tx.query("select * from app.exceptions where tenant_id=$1 and workspace_id=$2 and status<>'RESOLVED' order by case data->>'severity' when 'CRITICAL' then 0 when 'HIGH' then 1 when 'LOW' then 3 else 2 end,data->>'dueAt' nulls last,created_at,id limit 1000",scope),
  tx.query("select * from app.jobs where tenant_id=$1 and workspace_id=$2 and status in ('BLOCKED','QC_PENDING','PLANNED') order by created_at,id limit 1000",scope),
  scopedOperationalCounts(tx,a),scopedMeasurements(tx,a,'OWNER_HOURS'),scopedMeasurements(tx,a,'PROFITABILITY'),scopedMeasurements(tx,a,'CLOSEOUT_HOURS'),scopedMeasurements(tx,a,'QUOTE_VALUE')]);
 const fixed=(v:string|null)=>v===null?null:new Decimal(v).toFixed(2);
 return {tasks:tasks.rows,exceptions:rankExceptions(exceptions.rows.map(r=>({...r,severity:String(r.data.severity??'MEDIUM'),dueAt:r.data.dueAt?String(r.data.dueAt):undefined}))),waiting:waiting.rows,
  listLimit:limit,listsTruncated:{tasks:counts.openTasks>limit,exceptions:counts.openExceptions>limit,waiting:counts.waitingJobs>limit},
  metrics:{...counts,ownerHours:fixed(time.total),grossProfit:fixed(profit.total),grossProfitPerOwnerHour:profit.total!==null&&closeoutTime.total!==null&&new Decimal(closeoutTime.total).gt(0)?new Decimal(profit.total).div(closeoutTime.total).toFixed(2):null,
   quoteValue:fixed(quoteValue.total),recordedQuoteValue:fixed(quoteValue.recordedSubtotal),unpricedQuotes:quoteValue.unknownCount,closeoutCount:profit.rowCount,
   measurements:{ownerTime:time,profit,closeoutTime,quoteValue},totalsScope:'COMPLETE_WORKSPACE',evidence:'SYNTHETIC_LOCAL'}};
}
export async function handleToday(tx:Tx,a:Actor,action:string,i:Input):Promise<unknown>{
 authorize(a,'today',action);if(['dashboard','read'].includes(action))return dashboard(tx,a);
 if(['create','create_task'].includes(action)){const r=await create(tx,a,'work_items',{title:text(i.title),status:'OPEN',data:{severity:['LOW','MEDIUM','HIGH','CRITICAL'].includes(String(i.severity))?i.severity:'MEDIUM',dueAt:i.dueAt?new Date(text(i.dueAt)).toISOString():null,assignedTo:typeof i.assignedTo==='string'?text(i.assignedTo):a.userId}});await event(tx,a,'today.task_created',r.id);return r;}
 if(['update','update_task','archive'].includes(action)){const r=await get(tx,a,'work_items',i.id,true),next=action==='archive'?'COMPLETE':text(i.state);transition(r.status,next,{OPEN:['IN_PROGRESS','WAITING','COMPLETE'],IN_PROGRESS:['WAITING','COMPLETE'],WAITING:['OPEN','IN_PROGRESS','COMPLETE'],COMPLETE:[]});const result=await update(tx,a,'work_items',r.id,{status:next,data:{...r.data,...(i.reason?{reason:text(i.reason)}:{})}});await event(tx,a,'today.task_updated',r.id,{from:r.status,to:next});return result;}
 if(action==='review'||action==='approve'){const r=await get(tx,a,'work_items',i.id,true);const result=await update(tx,a,'work_items',r.id,{data:{...r.data,reviewedBy:a.userId,reviewedAt:new Date().toISOString(),approval:action==='approve'?'APPROVED':'REVIEWED'}});await event(tx,a,`today.task_${action}`,r.id);return result;}
 if(action==='log_time'){const hours=number(i.hours,0.01,24);if(i.orderId)await get(tx,a,'orders',i.orderId);const r=await create(tx,a,'time_entries',{title:text(i.title??'Owner time'),status:'RECORDED',...(i.orderId?{order_id:i.orderId}:{}),data:{hours:String(hours),performedBy:a.userId,date:i.date?new Date(text(i.date)).toISOString():new Date().toISOString(),category:typeof i.category==='string'?text(i.category):'OPERATIONS'}});await event(tx,a,'today.time_logged',r.id,{hours});return r;}
 return fail('UNSUPPORTED_TODAY_COMMAND',400);
}
