import { type Actor, type Tx, type Input, type Row, authorize, create, get, list, update, event, idempotent, fail, text, number, hash } from '../../kernel/src/index';

export type Rule = {op:'and';items:Rule[]} | {op:'or';items:Rule[]} | {op:'not';item:Rule} | {op:'eq'|'ne'|'gte'|'lte'|'in';field:string;value:string|number|boolean|string[]};
export const RULE_FIELDS = new Set(['method','color','quantity','material','stock','status','shipRegion','location','size','widthMm','heightMm','leadTimeDays']);
const isObject = (v:unknown):v is Input => typeof v==='object' && v!==null && !Array.isArray(v);

export function validateRule(input:unknown):Rule {
 const seen=new WeakSet<object>(); let count=0;
 function walk(v:unknown,depth:number):Rule {
  if(depth>16 || ++count>500) return fail('RULE_LIMIT_EXCEEDED',400);
  if(!isObject(v)) return fail('INVALID_RULE',400);
  if(seen.has(v)) return fail('RULE_CYCLE',400);
  seen.add(v);
  try {
   if(v.op==='and'||v.op==='or') {
    if(!Array.isArray(v.items)||v.items.length===0||v.items.length>100) return fail('INVALID_RULE_ITEMS',400);
    return {op:v.op,items:v.items.map(x=>walk(x,depth+1))};
   }
   if(v.op==='not')return {op:'not',item:walk(v.item,depth+1)};
   if(!['eq','ne','gte','lte','in'].includes(String(v.op))||typeof v.field!=='string'||!RULE_FIELDS.has(v.field)) return fail('RULE_FIELD_OR_OPERATION_NOT_ALLOWED',400);
   const op=v.op as 'eq'|'ne'|'gte'|'lte'|'in';
   if(op==='in') {
    if(!Array.isArray(v.value)||v.value.length===0||v.value.length>100||!v.value.every(x=>typeof x==='string'&&x.length<=200))return fail('INVALID_RULE_VALUE',400);
    return {op,field:v.field,value:[...v.value] as string[]};
   }
   if(op==='gte'||op==='lte') {
    if(typeof v.value!=='number'||!Number.isFinite(v.value))return fail('INVALID_RULE_VALUE',400);
   } else if(!['string','number','boolean'].includes(typeof v.value)||(typeof v.value==='number'&&!Number.isFinite(v.value))||(typeof v.value==='string'&&v.value.length>200))return fail('INVALID_RULE_VALUE',400);
   return {op,field:v.field,value:v.value as string|number|boolean};
  }finally{seen.delete(v);}
 }
 return walk(input,0);
}

export function evaluateRule(input:unknown,inputs:Input):boolean {
 const rule=validateRule(input);
 function run(r:Rule):boolean {
  if(r.op==='and')return r.items.every(run);
  if(r.op==='or')return r.items.some(run);
  if(r.op==='not')return !run(r.item);
  const actual=inputs[r.field];
  switch(r.op){case 'eq':return actual===r.value;case 'ne':return actual!==r.value;case 'gte':return typeof actual==='number'&&typeof r.value==='number'&&actual>=r.value;case 'lte':return typeof actual==='number'&&typeof r.value==='number'&&actual<=r.value;case 'in':return Array.isArray(r.value)&&typeof actual==='string'&&r.value.includes(actual);}
 }
 return run(rule);
}

export function analyzeRule(input:unknown):{valid:boolean;issues:string[];fields:string[]} {
 const rule=validateRule(input),issues:string[]=[],fields=new Set<string>();
 type Constraints={eq?:unknown;ne:Set<unknown>;min?:number;max?:number;allowed?:Set<string>};
 function inspect(r:Rule){
  if(r.op==='not'){inspect(r.item);return;}
  if(r.op==='or'){r.items.forEach(inspect);return;}
  if(r.op!=='and'){fields.add(r.field);return;}
  const limits=new Map<string,Constraints>();
  function collect(n:Rule){
   if(n.op==='and'){n.items.forEach(collect);return;}
   if(n.op==='or'||n.op==='not'){inspect(n);return;}
   fields.add(n.field);const c=limits.get(n.field)??{ne:new Set()};
   if(n.op==='eq'){if(c.eq!==undefined&&c.eq!==n.value)issues.push(`CONTRADICTORY_EQUALITY:${n.field}`);c.eq=n.value;}
   if(n.op==='ne')c.ne.add(n.value);
   if(n.op==='gte')c.min=Math.max(c.min??-Infinity,n.value as number);
   if(n.op==='lte')c.max=Math.min(c.max??Infinity,n.value as number);
   if(n.op==='in'){const vals=new Set(n.value as string[]);c.allowed=c.allowed?new Set([...c.allowed].filter(v=>vals.has(v))):vals;}
   limits.set(n.field,c);
  }
  r.items.forEach(collect);
  for(const [field,c] of limits){
   if(c.min!==undefined&&c.max!==undefined&&c.min>c.max)issues.push(`CONTRADICTORY_RANGE:${field}`);
   if(c.eq!==undefined&&c.ne.has(c.eq))issues.push(`CONTRADICTORY_EQUALITY:${field}`);
   if(c.eq!==undefined&&typeof c.eq==='number'&&((c.min!==undefined&&c.eq<c.min)||(c.max!==undefined&&c.eq>c.max)))issues.push(`EQUALITY_OUTSIDE_RANGE:${field}`);
   if(c.allowed&&(!c.allowed.size||(c.eq!==undefined&&!c.allowed.has(String(c.eq)))))issues.push(`EMPTY_ALLOWED_VALUES:${field}`);
  }
 }
 inspect(rule);return {valid:issues.length===0,issues:[...new Set(issues)],fields:[...fields]};
}

function stringArray(value:unknown,fallback:string[]=[]):string[]{if(value===undefined)return fallback;if(!Array.isArray(value)||value.length>100||!value.every(x=>typeof x==='string'&&x.trim()&&x.length<100))return fail('INVALID_OPTIONS',400);return [...new Set(value as string[])];}
export type ConfigurationResult={valid:boolean;errors:string[];requiredInputs:string[];quantity:number;method:string;location:string;readiness:'REQUEST_QUOTE_ONLY';configurationHash:string};
export function validateConfiguration(product:Input,variant:Input,input:Input,template:Input={}):ConfigurationResult {
 const errors:string[]=[],requiredInputs:string[]=[];
 const quantity=number(input.quantity,1,1000000);if(!Number.isInteger(quantity))errors.push('QUANTITY_MUST_BE_INTEGER');
 const minimum=number(template.minQuantity??product.minimumQuantity??product.moq??product.minQuantity??1,1,1000000);
 if(quantity<minimum)errors.push('MOQ_NOT_MET');
 const methods=stringArray(template.methods??product.methods??product.decorationMethods,[]);
 const locations=stringArray(template.locations??product.locations,[]);
 const method=typeof input.method==='string'?input.method:'';const location=typeof input.location==='string'?input.location:'';
 if(!method)requiredInputs.push('method');else if(!methods.length||!methods.includes(method))errors.push('INCOMPATIBLE_METHOD');
 if(!location)requiredInputs.push('location');else if(!locations.length||!locations.includes(location))errors.push('INCOMPATIBLE_LOCATION');
 const compatibility=isObject(template.compatibility)?template.compatibility:isObject(product.compatibility)?product.compatibility:{};
 if(Array.isArray(compatibility[method])&&!(compatibility[method] as unknown[]).includes(location))errors.push('INCOMPATIBLE_METHOD_LOCATION');
 if(variant.available===false||variant.status==='DISCONTINUED')errors.push('VARIANT_UNAVAILABLE');
 if(variant.color!==undefined&&input.color!==undefined&&variant.color!==input.color)errors.push('VARIANT_COLOR_MISMATCH');
 if(variant.size!==undefined&&input.size!==undefined&&variant.size!==input.size)errors.push('VARIANT_SIZE_MISMATCH');
 const rule=template.rule??product.rule;
 if(rule&&!evaluateRule(rule,{...variant,...input,quantity,method,location}))errors.push('RULE_CONSTRAINT_FAILED');
 const safe={quantity,method,location,color:variant.color??null,size:variant.size??null,templateVersion:template.version??1};
 return {valid:!errors.length&&!requiredInputs.length,errors,requiredInputs,quantity,method,location,readiness:'REQUEST_QUOTE_ONLY',configurationHash:hash(safe)};
}

export async function handleConfiguration(tx:Tx,a:Actor,action:string,input:Input):Promise<unknown>{
 if(a.role==='customer'&&['configure','simulate'].includes(action))authorize(a,'commerce','configure');else authorize(a,'configuration',action);
 if(action==='simulate'){const analysis=analyzeRule(input.rule);return {...analysis,matches:analysis.valid&&evaluateRule(input.rule,isObject(input.inputs)?input.inputs:{})};}
 if(['create','create_template','update','update_template'].includes(action)){
  const methods=stringArray(input.methods),locations=stringArray(input.locations);if(!methods.length||!locations.length)fail('METHODS_AND_LOCATIONS_REQUIRED',400);
  const rule=input.rule===undefined?undefined:validateRule(input.rule);if(rule&&!analyzeRule(rule).valid)fail('CONTRADICTORY_RULE',400);
  const data:Input={methods,locations,minQuantity:number(input.minQuantity??1,1,1000000),rule:rule??null,compatibility:isObject(input.compatibility)?input.compatibility:{},version:1};
  if(input.id){const old=await get(tx,a,'configuration_templates',input.id,true);data.previousId=old.id;data.version=Number(old.data.version??1)+1;await update(tx,a,'configuration_templates',old.id,{status:'ARCHIVED'});}
  const row=await create(tx,a,'configuration_templates',{title:text(input.title),data});await event(tx,a,'configuration.template_created',row.id,{version:data.version});return row;
 }
 if(action==='save_rule'){
  const rule=validateRule(input.rule),analysis=analyzeRule(rule);if(!analysis.valid)fail('CONTRADICTORY_RULE',400);
  const row=await create(tx,a,'configuration_rules',{title:text(input.title),data:{rule,version:1,effectiveAt:null,fields:analysis.fields}});await event(tx,a,'configuration.rule_created',row.id);return row;
 }
 if(action==='save_print_zone'){
  const product=await get(tx,a,'products',input.productId);const widthMm=number(input.widthMm,1,10000),heightMm=number(input.heightMm,1,10000);
  const row=await create(tx,a,'imprint_areas',{title:text(input.title),product_id:product.id,status:'DRAFT',data:{productId:product.id,widthMm,heightMm,xMm:number(input.xMm??0,0,10000),yMm:number(input.yMm??0,0,10000),unit:'mm'}});await event(tx,a,'configuration.print_zone_saved',row.id);return row;
 }
 if(['review','approve','archive'].includes(action)){
  const row=await get(tx,a,'configuration_templates',input.id,true);
  if(action==='approve'&&row.status!=='DRAFT'&&row.status!=='IN_REVIEW')fail('INVALID_TRANSITION');
  if(action==='review'&&row.status!=='DRAFT')fail('INVALID_TRANSITION');
  const status=action==='review'?'IN_REVIEW':action==='approve'?'PUBLISHED':'ARCHIVED';
  const saved=await update(tx,a,'configuration_templates',row.id,{status});await event(tx,a,`configuration.template_${action}`,row.id,{from:row.status,to:status});return saved;
 }
 if(action==='assign_template'){
  const template=await get(tx,a,'configuration_templates',input.id);if(template.status!=='PUBLISHED')fail('TEMPLATE_NOT_PUBLISHED');
  if(!Array.isArray(input.productIds)||!input.productIds.length||input.productIds.length>500)fail('INVALID_BATCH_SIZE',400);
  const ids=[...new Set(input.productIds as string[])],eligible:Row[]=[],rejected:Input[]=[];
  const methods=stringArray(template.data.methods),locations=stringArray(template.data.locations);
  for(const id of ids){const product=await get(tx,a,'products',id);const pm=stringArray(product.data.methods??product.data.decorationMethods),pl=stringArray(product.data.locations);
   if(!methods.every(m=>pm.includes(m))||!locations.every(l=>pl.includes(l)))rejected.push({productId:product.id,reason:'INCOMPATIBLE_TEMPLATE'});else eligible.push(product);
  }
  if(input.dryRun!==false)return {dryRun:true,affectedCount:eligible.length,eligibleIds:eligible.map(p=>p.id),rejected,templateId:template.id,templateVersion:template.data.version};
  return idempotent(tx,a,'configuration.assign_template',input.idempotencyKey,{templateId:template.id,ids},async()=>{
   const snapshots:Input[]=[];
   for(const product of eligible){const changed=await update(tx,a,'products',product.id,{expectedRevision:product.revision,data:{...product.data,configurationTemplateId:template.id,configurationTemplateVersion:template.data.version}});snapshots.push({id:product.id,beforeData:product.data,appliedRevision:changed.revision});}
   const manifest=await create(tx,a,'catalog_rollback_manifests',{title:`Template assignment · ${template.title}`,status:'COMMITTED',data:{kind:'CONFIGURATION_TEMPLATE',templateId:template.id,snapshots}});
   await event(tx,a,'configuration.template_bulk_assigned',template.id,{count:snapshots.length,rollbackManifestId:manifest.id});return {affectedCount:snapshots.length,rejected,rollbackManifestId:manifest.id};
  });
 }
 if(action==='rollback_template'){
  const manifest=await get(tx,a,'catalog_rollback_manifests',input.id);if(manifest.data.kind!=='CONFIGURATION_TEMPLATE')fail('WRONG_ROLLBACK_KIND');
  return idempotent(tx,a,'configuration.rollback_template',input.idempotencyKey,{manifestId:manifest.id},async()=>{
   const snapshots=manifest.data.snapshots as Input[];if(!Array.isArray(snapshots))fail('INVALID_ROLLBACK_MANIFEST');
   for(const snapshot of snapshots){const product=await get(tx,a,'products',snapshot.id,true);if(product.revision!==snapshot.appliedRevision)fail('ROLLBACK_CONFLICT');}
   for(const snapshot of snapshots)await update(tx,a,'products',snapshot.id,{expectedRevision:snapshot.appliedRevision as number,data:snapshot.beforeData as Input});
   const receipt=await create(tx,a,'catalog_rollback_manifests',{title:`Revert · ${manifest.title}`,status:'ROLLED_BACK',data:{originalManifestId:manifest.id,affectedCount:snapshots.length}});await event(tx,a,'configuration.template_assignment_reverted',receipt.id,{affectedCount:snapshots.length});return {affectedCount:snapshots.length,receiptId:receipt.id};
  });
 }
 if(action==='configure'){
  const product=await get(tx,a,'products',input.productId),variant=await get(tx,a,'variants',input.variantId);
  if((variant.product_id??variant.data.productId)!==product.id)fail('VARIANT_PRODUCT_MISMATCH');
  let template:Row|undefined;
  if(input.templateId){template=await get(tx,a,'configuration_templates',input.templateId);if(template.status!=='PUBLISHED')fail('TEMPLATE_NOT_PUBLISHED');}
  const result=validateConfiguration(product.data,variant.data,input,template?.data);
  if(!result.valid)fail(result.errors[0]??'CONFIGURATION_INPUT_REQUIRED');
  const saved=await create(tx,a,'saved_configurations',{title:product.title,product_id:product.id,variant_id:variant.id,status:'VALIDATED',data:{...result,productId:product.id,variantId:variant.id,productRevision:product.revision,variantRevision:variant.revision,templateId:template?.id??null,templateVersion:template?.data.version??null,configuration:{quantity:result.quantity,method:result.method,location:result.location,color:variant.data.color??null,size:variant.data.size??null}}});await event(tx,a,'configuration.saved',saved.id,{productId:product.id,variantId:variant.id});return saved;
 }
 if(action==='read')return {templates:await list(tx,a,'configuration_templates'),rules:await list(tx,a,'configuration_rules'),zones:await list(tx,a,'imprint_areas')};
 return fail('UNSUPPORTED_ACTION',400);
}
