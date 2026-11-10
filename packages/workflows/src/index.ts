import { authorize,create,get,list,update,event,fail,text,number,idempotent,type Actor,type Tx,type Input,type Row } from '../../kernel/src/index';
import {validateRule,evaluateRule,assertNoCycles,validateAction,type Rule,type SafeAction} from './rules';
export {validateRule,evaluateRule,assertNoCycles,validateAction} from './rules';
const ALLOWED_EVENTS=new Set(['proof.approved','creative.proof_approved','sales.quote_issued','sales.quote_accepted','orders.created','orders.job_ready','fulfillment.shipped','supplier.sync_failed','catalog.cost_stale','commerce.request_submitted']);
function definition(i:Input){const eventType=text(i.eventType??'proof.approved');if(!ALLOWED_EVENTS.has(eventType))fail('AUTOMATION_EVENT_NOT_ALLOWED',400);const condition=validateRule(i.condition??{op:'eq',field:'status',value:'READY'}),action=validateAction(i.action??{type:'create_task',title:'Review event'});const dependencies=Array.isArray(i.dependencies)?i.dependencies.map(v=>text(v)):[];if(dependencies.length>20)fail('TOO_MANY_DEPENDENCIES',400);return {condition,action,eventType,dependencies,maxDepth:number(i.maxDepth??4,1,4),throttleSeconds:number(i.throttleSeconds??0,0,86400)};}
export function simulateRule(condition:unknown,action:unknown,inputs:Input){const ast=validateRule(condition),command=validateAction(action),matches=evaluateRule(ast,inputs);return {matches,wouldPerform:matches?[{...command,externalEffect:false}]:[],trace:[{condition:ast,result:matches}],sideEffects:0};}
export async function processAutomationEvent(tx:Tx,a:Actor,eventRow:Row,depth=0){
 if(depth>=4)fail('AUTOMATION_DEPTH_EXCEEDED');if(!ALLOWED_EVENTS.has(eventRow.title))return [];const rules=(await list(tx,a,'automation_rules',1000)).filter(r=>r.status==='ACTIVE'&&r.data.eventType===eventRow.title);const results:unknown[]=[];
 for(const rule of rules){const condition=validateRule(rule.data.condition),command=validateAction(rule.data.action);if(!evaluateRule(condition,{...eventRow.data,eventType:eventRow.title}))continue;results.push(await idempotent(tx,a,`workflow.event.${rule.id}`,eventRow.id,{eventId:eventRow.id,ruleId:rule.id,version:rule.data.publishedVersion??rule.revision},async()=>{
   const prior=(await list(tx,a,'automation_runs',1000)).find(r=>r.rule_id===rule.id&&r.status==='COMPLETE');if(prior&&Date.now()-Date.parse(String(prior.created_at))<Number(rule.data.throttleSeconds??0)*1000)return {throttled:true};
   let effect:Row;if(command.type==='create_task')effect=await create(tx,a,'work_items',{title:command.title,status:'OPEN',data:{sourceRuleId:rule.id,sourceEventId:eventRow.id,severity:command.severity??'MEDIUM'}});else if(command.type==='raise_exception')effect=await create(tx,a,'exceptions',{title:command.title,status:'OPEN',data:{sourceRuleId:rule.id,sourceEventId:eventRow.id,severity:command.severity??'MEDIUM'}});else effect=await create(tx,a,'notifications',{title:command.title,status:'DRAFT',data:{sourceRuleId:rule.id,sourceEventId:eventRow.id,externalSend:false}});
   const run=await create(tx,a,'automation_runs',{title:rule.title,status:'COMPLETE',rule_id:rule.id,data:{sourceEventId:eventRow.id,ruleRevision:rule.data.publishedVersion??rule.revision,effectId:effect.id,action:command.type,depth,externalEffect:false}});await event(tx,a,'workflow.executed',run.id,{ruleId:rule.id,effectId:effect.id});return {runId:run.id,effectId:effect.id,externalEffect:false};}));}
 return results;
}
export async function handleWorkflow(tx:Tx,a:Actor,action:string,i:Input):Promise<unknown>{
 authorize(a,'workflow',action);
 if(['create','create_rule'].includes(action)){const def=definition(i),r=await create(tx,a,'automation_rules',{title:text(i.title),status:'DRAFT',data:{...def,owner:a.userId}});await event(tx,a,'workflow.rule_created',r.id);return r;}
 if(action==='update'){const r=await get(tx,a,'automation_rules',i.id,true);if(r.status==='ACTIVE')fail('DISABLE_RULE_BEFORE_EDIT');const result=await update(tx,a,'automation_rules',r.id,{title:i.title?text(i.title):r.title,status:'DRAFT',data:{...r.data,...definition({...r.data,...i})}});await event(tx,a,'workflow.rule_updated',r.id);return result;}
 if(action==='simulate_rule'){
  const r=i.id?await get(tx,a,'automation_rules',i.id):null;const inputs=i.inputs&&typeof i.inputs==='object'?i.inputs as Input:{};return simulateRule(r?.data.condition??i.condition,r?.data.action??i.action,inputs);
 }
 if(action==='publish_rule'||action==='approve'){
  const r=await get(tx,a,'automation_rules',i.id,true);if(!['DRAFT','DISABLED','TESTING'].includes(r.status))fail('INVALID_RULE_TRANSITION');const condition=validateRule(r.data.condition),command=validateAction(r.data.action);const rules=await list(tx,a,'automation_rules',1000);const graph:Record<string,string[]>={};for(const row of rules)graph[row.id]=Array.isArray(row.data.dependencies)?row.data.dependencies.map(String):[];assertNoCycles(graph);if((graph[r.id]??[]).some(id=>!rules.some(x=>x.id===id)))fail('UNKNOWN_RULE_DEPENDENCY');
  const fixture=i.fixture&&typeof i.fixture==='object'?i.fixture as Input:{status:'READY',state:'READY'};const simulation=simulateRule(condition,command,fixture);
  if(!simulation.matches)fail('RULE_SIMULATION_DID_NOT_MATCH');
  const version=await create(tx,a,'automation_runs',{title:`${r.title} version ${r.revision}`,status:'DEFINITION_REVISION',rule_id:r.id,data:{definition:r.data,ruleRevision:r.revision,simulation,publishedBy:a.userId}});const result=await update(tx,a,'automation_rules',r.id,{status:'ACTIVE',data:{...r.data,publishedVersion:r.revision,versionId:version.id,publishedBy:a.userId}});await event(tx,a,'workflow.rule_published',r.id,{versionId:version.id});return result;
 }
 if(action==='disable_rule'||action==='archive'){const r=await get(tx,a,'automation_rules',i.id,true);const result=await update(tx,a,'automation_rules',r.id,{status:'DISABLED'});await event(tx,a,'workflow.rule_disabled',r.id);return result;}
 if(action==='process_event'){const row=await get(tx,a,'outbox_events',i.eventId);return processAutomationEvent(tx,a,row);}
 return fail('UNSUPPORTED_WORKFLOW_COMMAND',400);
}
