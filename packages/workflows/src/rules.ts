import { fail,type Input } from '../../kernel/src/index';
export type Rule = {op:'and'|'or';items:Rule[]}|{op:'not';item:Rule}|{op:'eq'|'ne'|'gte'|'lte'|'in';field:string;value:string|number|boolean|string[]};
export const RULE_FIELDS=new Set(['quantity','total','stock','status','method','color','shipRegion','margin','dueDays','consent','productId','severity','eventType','state']);
export function validateRule(value:unknown,depth=0,counter={nodes:0}):Rule {
 if(depth>16||++counter.nodes>100)fail('RULE_LIMIT_EXCEEDED',400);if(!value||typeof value!=='object'||Array.isArray(value))fail('INVALID_RULE',400);const v=value as Input;
 if(v.op==='and'||v.op==='or'){if(!Array.isArray(v.items)||!v.items.length||v.items.length>30)fail('INVALID_RULE_ITEMS',400);const items=(v.items as unknown[]).map(item=>validateRule(item,depth+1,counter));if(v.op==='and'){
  const equal=new Map<string,unknown>();for(const item of items)if(item.op==='eq'){if(equal.has(item.field)&&equal.get(item.field)!==item.value)fail('RULE_CONTRADICTION',400);equal.set(item.field,item.value);}
 }return {op:v.op,items};}
 if(v.op==='not')return {op:'not',item:validateRule(v.item,depth+1,counter)};
 if(!['eq','ne','gte','lte','in'].includes(String(v.op))||typeof v.field!=='string'||!RULE_FIELDS.has(v.field))fail('RULE_FIELD_OR_OPERATOR_NOT_ALLOWED',400);
 if(v.op==='in'){if(!Array.isArray(v.value)||v.value.length>100||!v.value.every(x=>typeof x==='string'&&x.length<500))fail('INVALID_RULE_VALUE',400);}else if(!['string','number','boolean'].includes(typeof v.value))fail('INVALID_RULE_VALUE',400);
 if(['gte','lte'].includes(String(v.op))&&(typeof v.value!=='number'||!Number.isFinite(v.value)))fail('RULE_NUMERIC_VALUE_REQUIRED',400);
 return {op:v.op as 'eq'|'ne'|'gte'|'lte'|'in',field:String(v.field),value:v.value as string|number|boolean|string[]};
}
export function evaluateRule(rule:Rule,inputs:Input):boolean {if(rule.op==='and')return rule.items.every(r=>evaluateRule(r,inputs));if(rule.op==='or')return rule.items.some(r=>evaluateRule(r,inputs));if(rule.op==='not')return !evaluateRule(rule.item,inputs);if(!('field' in rule))return false;const actual=inputs[rule.field];switch(rule.op){case'eq':return actual===rule.value;case'ne':return actual!==rule.value;case'gte':return typeof actual==='number'&&typeof rule.value==='number'&&actual>=rule.value;case'lte':return typeof actual==='number'&&typeof rule.value==='number'&&actual<=rule.value;case'in':return Array.isArray(rule.value)&&rule.value.includes(String(actual));}}
export function assertNoCycles(graph:Record<string,string[]>){const done=new Set<string>(),visiting=new Set<string>();function visit(node:string){if(visiting.has(node))fail('AUTOMATION_CYCLE',400);if(done.has(node))return;visiting.add(node);for(const dep of graph[node]??[])visit(dep);visiting.delete(node);done.add(node);}for(const node of Object.keys(graph))visit(node);}
export type SafeAction={type:'create_task'|'draft_notification'|'raise_exception';title:string;severity?:string};
export function validateAction(value:unknown):SafeAction {if(!value||typeof value!=='object')fail('INVALID_AUTOMATION_ACTION',400);const v=value as Input;if(!['create_task','draft_notification','raise_exception'].includes(String(v.type)))fail('AUTOMATION_ACTION_BLOCKED',403);if(typeof v.title!=='string'||!v.title.trim()||v.title.length>500)fail('INVALID_ACTION_TITLE',400);return {type:v.type as SafeAction['type'],title:String(v.title), ...(typeof v.severity==='string'?{severity:v.severity}:{})};}
