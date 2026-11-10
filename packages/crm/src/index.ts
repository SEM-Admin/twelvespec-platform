import { authorize,create,get,list,update,event,fail,text,idempotent,transition,type Actor,type Tx,type Input,type Row } from '../../kernel/src/index';
export function validEmail(value:unknown):string {const email=text(value,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))fail('INVALID_EMAIL',400);return email;}
export const leadTransitions:Record<string,string[]>={NEW:['QUALIFIED','LOST'],QUALIFIED:['OPPORTUNITY','LOST'],OPPORTUNITY:['WON','LOST'],WON:[],LOST:[]};
function consent(input:unknown){const c=input&&typeof input==='object'?input as Input:{};return {marketing:c.marketing===true,recordedAt:new Date().toISOString(),source:typeof c.source==='string'?text(c.source,200):'operator_recorded'};}
async function changed(tx:Tx,a:Actor,table:'contacts'|'accounts'|'opportunities'|'activities'|'follow_ups',r:Row,action:string){await event(tx,a,`crm.${action}`,r.id,{table,status:r.status});return r;}
export async function handleCrm(tx:Tx,a:Actor,action:string,i:Input):Promise<unknown>{
 authorize(a,'crm',action);
 if(action==='create'||action==='create_contact'){
  const email=validEmail(i.email);const duplicates=(await list(tx,a,'contacts',1000)).filter(r=>r.data.email===email&&r.status!=='ARCHIVED');if(duplicates.length)fail('CONTACT_ALREADY_EXISTS');
  if(i.accountId)await get(tx,a,'accounts',i.accountId);
  return changed(tx,a,'contacts',await create(tx,a,'contacts',{title:text(i.name??i.title),status:'ACTIVE',data:{email,phone:typeof i.phone==='string'?text(i.phone,100):null,accountId:i.accountId??null,consent:consent(i.consent),notes:typeof i.notes==='string'?text(i.notes,5000):null}}),'contact_created');
 }
 if(action==='update'||action==='update_contact'){
  const r=await get(tx,a,'contacts',i.id,true);return changed(tx,a,'contacts',await update(tx,a,'contacts',r.id,{title:i.name===undefined?r.title:text(i.name),data:{...r.data,...(i.email?{email:validEmail(i.email)}:{}),...(i.consent?{consent:consent(i.consent)}:{}),...(typeof i.notes==='string'?{notes:text(i.notes,5000)}:{})},expectedRevision:i.expectedRevision as number|undefined}),'contact_updated');
 }
 if(action==='create_account')return changed(tx,a,'accounts',await create(tx,a,'accounts',{title:text(i.name??i.title),status:'ACTIVE',data:{industry:typeof i.industry==='string'?text(i.industry):null,creditApproved:false,completedOrders:0,terms:'PREPAID'}}),'account_created');
 if(action==='create_opportunity'){
  const contact=await get(tx,a,'contacts',i.contactId);return changed(tx,a,'opportunities',await create(tx,a,'opportunities',{title:text(i.title),status:'NEW',contact_id:contact.id,data:{contactId:contact.id,estimatedRevenue:typeof i.estimatedRevenue==='string'?i.estimatedRevenue:null,currency:'USD',stageHistory:[{state:'NEW',actor:a.userId,at:new Date().toISOString()}]}}),'opportunity_created');
 }
 if(action==='advance_lead'){
  const r=await get(tx,a,'opportunities',i.id,true),next=text(i.state);
  if(['WON','LOST'].includes(r.status)&&next==='QUALIFIED'){if(!['owner','manager'].includes(a.role))fail('REOPEN_PERMISSION_REQUIRED',403);text(i.reason,1000);}else transition(r.status,next,leadTransitions);
  const history=Array.isArray(r.data.stageHistory)?r.data.stageHistory:[];
  return changed(tx,a,'opportunities',await update(tx,a,'opportunities',r.id,{status:next,data:{...r.data,stageHistory:[...history,{state:next,actor:a.userId,at:new Date().toISOString(),reason:typeof i.reason==='string'?text(i.reason,1000):null}]}}),'lead_advanced');
 }
 if(action==='record_activity'||action==='create_follow_up'){
  const c=await get(tx,a,'contacts',i.contactId),table=action==='record_activity'?'activities':'follow_ups';
  const dueAt=i.dueAt?new Date(text(i.dueAt)).toISOString():null;
  return changed(tx,a,table,await create(tx,a,table,{title:text(i.title??i.note,2000),status:table==='activities'?'RECORDED':'OPEN',contact_id:c.id,data:{contactId:c.id,kind:typeof i.kind==='string'?text(i.kind):'NOTE',dueAt,externalCommunication:'NOT_SENT'}}),action);
 }
 if(action==='import_leads'){
  if(!Array.isArray(i.rows)||i.rows.length>1000)return fail('INVALID_LEAD_ROWS',400);
  const inputRows=i.rows;
  return idempotent(tx,a,'crm.import_leads',i.idempotencyKey,inputRows,async()=>{
   const imported:Row[]=[],issues:Input[]=[],known=new Set((await list(tx,a,'contacts',1000)).map(r=>String(r.data.email)));
   for(const [index,row] of inputRows.entries()){
    if(!row||typeof row!=='object'){issues.push({row:index+1,code:'INVALID_ROW'});continue;}
    const input=row as Input;let email:string,name:string;
    try{email=validEmail(input.email);name=text(input.name);}catch{issues.push({row:index+1,code:'INVALID_CONTACT'});continue;}
    if(known.has(email)){issues.push({row:index+1,code:'DUPLICATE_EMAIL'});continue;}
    known.add(email);
    imported.push(await create(tx,a,'contacts',{title:name,status:'ACTIVE',data:{email,consent:{marketing:false,recordedAt:new Date().toISOString(),source:'lead_import'},imported:true}}));
   }
   await event(tx,a,'crm.leads_imported',a.workspaceId,{count:imported.length,issueCount:issues.length});return {imported,issues};
  });
 }
 if(['archive','review','approve'].includes(action)){
  const r=await get(tx,a,'contacts',i.id,true);if(action==='archive')return changed(tx,a,'contacts',await update(tx,a,'contacts',r.id,{status:'ARCHIVED'}),'contact_archived');
  return changed(tx,a,'contacts',await update(tx,a,'contacts',r.id,{data:{...r.data,reviewedBy:a.userId,reviewedAt:new Date().toISOString()}}),'contact_reviewed');
 }
 return fail('UNSUPPORTED_CRM_COMMAND',400);
}
