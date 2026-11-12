import Decimal from 'decimal.js';
import {type Actor,type Tx,type Input,type Row,authorize,create,get,list,update,event,idempotent,fail,text,number,hash,transition} from '../../kernel/src/index';
import {related} from '../../production/src/records';
import {validateConfiguration} from '../../configuration/src/index';
import {amount,money,unitCost,extendUnitCost,priceForTargetMargin,grossMargin,landedCost,tierCost,termsForOrder,type Components} from '../../pricing/src/index';
import {assessEvidenceInScope,PRICE_ASSESSMENT_VERSION,type PriceContext} from '../../intelligence/src';
import {reviewedCostWorksheet} from './manual-costing';
import {publicProduct} from '../../catalog/src';
import {safeLines,type ConfigLine} from './line-input';
export {safeLines,type ConfigLine} from './line-input';
export const QUOTE_GRAPH:Record<string,string[]>={DRAFT:['COSTED'],COSTED:['APPROVAL_REQUIRED','READY_TO_ISSUE'],APPROVAL_REQUIRED:['READY_TO_ISSUE','DRAFT'],READY_TO_ISSUE:['ISSUED','DRAFT'],ISSUED:['ACCEPTED','EXPIRED','DECLINED'],ACCEPTED:[],EXPIRED:[],DECLINED:[]};
export async function validateLine(tx:Tx,a:Actor,line:ConfigLine,requirePublished=true){
 const original=await get(tx,a,'products',line.productId);
 if((requirePublished||line.catalogRevision!==undefined)&&original.status!=='PUBLISHED')fail('PRODUCT_UNAVAILABLE');
 const variants=(await tx.query("select * from app.variants where tenant_id=$1 and workspace_id=$2 and product_id=$3 order by id",[a.tenantId,a.workspaceId,original.id])).rows as Row[];
 if(line.variantId){const variant=await get(tx,a,'variants',line.variantId);if(variant.product_id!==original.id&&variant.data.productId!==original.id)fail('VARIANT_PRODUCT_MISMATCH');}
 const usePublished=original.status==='PUBLISHED'&&(requirePublished||line.catalogRevision!==undefined);
 const published=publicProduct(original,variants);
 let data=original.data,variantData:Input={};
 if(usePublished){
  const snapshot=original.data.publicSnapshot as Input|undefined;
  data=snapshot&&typeof snapshot.product==='object'&&snapshot.product!==null?snapshot.product as Input:snapshot??original.data;
  if(line.catalogRevision!==undefined&&line.catalogRevision!==Number(published.catalogRevision))fail('CATALOG_CHANGED_REVIEW_CART');
  const choices=published.variants as Input[];
  if(choices.length&&!line.variantId)fail('VARIANT_REQUIRED',400);
  if(line.variantId){const chosen=choices.find(v=>v.id===line.variantId);if(!chosen)fail('VARIANT_UNAVAILABLE');variantData=chosen;}
 }else if(line.variantId){
  const variant=await get(tx,a,'variants',line.variantId);
  if(variant.product_id!==original.id&&variant.data.productId!==original.id)fail('VARIANT_PRODUCT_MISMATCH');
  if(variant.status==='ARCHIVED')fail('VARIANT_UNAVAILABLE');variantData=variant.data;
 }
 const minimum=number(data.minimumQuantity??data.moq??1,1);if(line.quantity<minimum)fail('MOQ_NOT_MET');
 const allowed=data.methods??data.decorationMethods;if(Array.isArray(allowed)&&!allowed.includes(line.method))fail('DECORATION_INCOMPATIBLE');
 if(line.method==='embroidery'&&String(data.family??data.category).toUpperCase().includes('PRINT'))fail('DECORATION_INCOMPATIBLE');
 if(Array.isArray(data.locations)&&!data.locations.includes(line.location))fail('LOCATION_INCOMPATIBLE');
 let templateData:Input={};if(data.configurationTemplateId){const template=await get(tx,a,'configuration_templates',data.configurationTemplateId);if(template.status!=='PUBLISHED')fail('CONFIGURATION_TEMPLATE_NOT_PUBLISHED');templateData=template.data;}
 const configResult=validateConfiguration(data,variantData,line,templateData);if(!configResult.valid)fail('CONFIGURATION_INVALID');
 if(line.designVersionId){const design=await get(tx,a,'design_versions',line.designVersionId);const productId=design.product_id??design.data.productId,variantId=design.variant_id??design.data.variantId;if(!productId||(line.variantId&&!variantId))fail('DESIGN_BINDING_UNVERIFIED');if(productId!==line.productId)fail('DESIGN_PRODUCT_MISMATCH');if(line.variantId&&variantId!==line.variantId)fail('DESIGN_VARIANT_MISMATCH');if(design.data.method!==line.method||(design.data.placement as Input|undefined)?.location!==line.location)fail('DESIGN_CONFIGURATION_MISMATCH');}
 return {...original,title:usePublished?String(published.title):original.title,data:{...original.data,...data}};
}
export async function quoteLineSnapshot(tx:Tx,a:Actor,line:ConfigLine):Promise<Input>{
 const product=await validateLine(tx,a,line);
 const variants=(await tx.query('select * from app.variants where tenant_id=$1 and workspace_id=$2 and product_id=$3',[a.tenantId,a.workspaceId,product.id])).rows as Row[];
 const view=publicProduct(product,variants),variant=(view.variants as Input[]).find(v=>v.id===line.variantId);
 return {...line,title:view.title,sku:view.sku,brand:view.brand,category:view.category,color:variant?.color??null,size:variant?.size??null,image:variant?.image??view.image,catalogRevision:view.catalogRevision,configurationHash:hash(line)};
}
async function quotesForCustomer(tx:Tx,a:Actor,customerId:string){return related(tx,a,'orders','owner_id',customerId);}
export async function costLine(tx:Tx,a:Actor,line:ConfigLine,freight:unknown,targetMargin:unknown){
 const product=await validateLine(tx,a,line,false);
 const all=await related(tx,a,'supplier_offers','product_id',line.productId);
 const offers=all.filter(o=>(o.product_id===line.productId||o.data.productId===line.productId)&&(!line.variantId||!o.variant_id||o.variant_id===line.variantId||o.data.variantId===line.variantId)).filter(o=>o.status!=='DISABLED');
 if(!offers.length)fail('MISSING_COST');
 const offer=offers.sort((a,b)=>String(b.data.observedAt??b.updated_at).localeCompare(String(a.data.observedAt??a.updated_at)))[0];
 const d=offer.data;const observedAt=new Date(String(d.observedAt??d.verifiedAt??offer.updated_at)).getTime();if(!Number.isFinite(observedAt)||Date.now()-observedAt>24*3600000||observedAt>Date.now()+60000||(d.validUntil&&new Date(String(d.validUntil)).getTime()<=Date.now()))fail('STALE_COST');if(typeof d.currency!=='string'||!/^[A-Z]{3}$/.test(d.currency))fail('CURRENCY_REQUIRED');const currency=String(d.currency);if(currency!=='USD')fail('CURRENCY_NOT_APPROVED');
 const breaks=Array.isArray(d.priceBreaks)?(d.priceBreaks as Input[]).map(x=>({minimum:number(x.minimum??x.minQuantity??x.quantity,1),cost:String(x.cost??x.unitCost??x.price)})):null;
 const unit=breaks?tierCost(breaks,line.quantity):unitCost(d.unitCost??d.cost??d.baseCost).toString();
 if(line.quantity<number(d.moq??d.minimumQuantity??1,1))fail('MOQ_NOT_MET');
 const components:Components={material_cost:extendUnitCost(unit,line.quantity),decoration_run_cost:line.method==='none'?'0.00':d.decorationCost===undefined?null:extendUnitCost(d.decorationCost,line.quantity),setup:line.method==='none'?'0.00':d.setupCost===undefined?null:amount(money(d.setupCost)),prepress:amount(money(d.prepressCost??'0.00')),outsourced_labor:amount(money(d.laborCost??'0.00')),packaging:amount(money(d.packagingCost??'0.00')),allocated_freight:freight===undefined?d.freight===undefined?null:amount(money(d.freight)):amount(money(freight)),other_direct_cost:amount(money(d.otherCost??'0.00'))};
 const designVersion=line.designVersionId?await get(tx,a,'design_versions',line.designVersionId):undefined;
 const cost=landedCost(components);const sell=priceForTargetMargin(cost,targetMargin);
 return {...line,title:product.title,designVersionHash:designVersion?.data.contentHash??designVersion?.data.versionHash??designVersion?.data.hash??null,configurationHash:hash(line),currency,components,landedCost:cost,sellTotal:sell,unitSell:money(sell).div(line.quantity).toFixed(4),productRevision:product.revision,sourceEvidence:{offerId:offer.id,connectionId:offer.connection_id,observedAt:d.observedAt??offer.updated_at,rawHash:d.rawHash??hash(d),verification:d.verification??'MOCKED',validUntil:d.validUntil??new Date(observedAt+24*3600000).toISOString()},artworkStatus:line.designVersionId?'VERSION_BOUND':'ARTWORK_NOT_REQUIRED_FOR_ESTIMATE'};
}
function restricted(a:Actor){if(a.role==='customer')fail('PERMISSION_DENIED',403);}
export function publicQuote(row:Row){
 const d=row.data,issued=['ISSUED','ACCEPTED','EXPIRED','DECLINED'].includes(row.status);
 const b=d.brief&&typeof d.brief==='object'?d.brief as Input:{};
 const assumptions=d.commercialAssumptions&&typeof d.commercialAssumptions==='object'?d.commercialAssumptions as Input:{};
 return {id:row.id,title:row.title,status:row.status,revision:row.revision,created_at:row.created_at,data:{currency:d.currency,total:issued?d.total:null,validUntil:issued?d.validUntil:null,revisionId:issued?d.revisionId:null,seller:issued?d.seller:null,terms:issued?d.terms:null,brief:{projectName:b.projectName,company:b.company,contactName:b.contactName,phone:b.phone,deliveryCountry:b.deliveryCountry,deliveryPostalCode:b.deliveryPostalCode,requestedDate:b.requestedDate,hardDeadline:b.hardDeadline,artworkStatus:b.artworkStatus,notes:b.notes},commercialAssumptions:issued?{deliveryNote:assumptions.deliveryNote,taxTreatment:assumptions.taxTreatment,taxNote:assumptions.taxNote,freightIncluded:assumptions.freightIncluded}:null,lines:Array.isArray(d.lines)?d.lines.map((v,i)=>{const l=v as Input,snapshot=Array.isArray(d.lineSnapshots)&&d.lineSnapshots[i]&&typeof d.lineSnapshots[i]==='object'?d.lineSnapshots[i] as Input:{};return {productId:l.productId,variantId:l.variantId,title:l.title??snapshot.title,color:snapshot.color,size:snapshot.size,quantity:l.quantity,method:l.method,location:l.location,notes:l.notes,specifications:l.specifications,designVersionId:l.designVersionId,...(issued?{sellTotal:l.sellTotal,unitSell:l.unitSell}:{})};}):[]}};
}
export function publicOrder(row:Row){const d=row.data;return {id:row.id,title:row.title,status:row.status,created_at:row.created_at,data:{currency:d.currency,total:d.total,seller:d.seller,terms:d.terms,paymentStatus:d.paymentStatus,lines:Array.isArray(d.lines)?d.lines.map(v=>{const l=v as Input;return {productId:l.productId,variantId:l.variantId,title:l.title,quantity:l.quantity,method:l.method,location:l.location,sellTotal:l.sellTotal,designVersionId:l.designVersionId};}):[]}};}
export async function handleSales(tx:Tx,a:Actor,action:string,input:Input):Promise<unknown>{
 authorize(a,'sales',action);
 if(action==='assess_quote_price'){
  restricted(a);
  const quoteId=text(input.quoteId),observationId=text(input.observationId),lineIndex=input.lineIndex;
  if(typeof lineIndex!=='number'||!Number.isSafeInteger(lineIndex)||lineIndex<0||lineIndex>99)fail('INVALID_LINE_INDEX',400);
  const currency=text(input.currency,3),territory=text(input.territory,2),channel=text(input.channel,30);
  if(!/^[A-Z]{3}$/.test(currency)||!/^[A-Z]{2}$/.test(territory)||!['DIRECT','COMPANY_STORE','MARKETPLACE'].includes(channel))fail('PRICE_ASSESSMENT_CONTEXT_INVALID',400);
  const accountId=input.accountId?text(input.accountId):null;
  return idempotent(tx,a,'sales.assess_quote_price',input.idempotencyKey,{quoteId,observationId,lineIndex,currency,territory,channel,accountId},async()=>{
   const quote=await get(tx,a,'quotes',quoteId,true);if(quote.status!=='DRAFT')fail('PRICE_ASSESSMENT_REQUIRES_DRAFT');
   const line=safeLines(quote.data.lines)[lineIndex];if(!line)fail('QUOTE_LINE_NOT_FOUND',404);
   if(currency!==quote.data.currency)fail('CURRENCY_MISMATCH',400);
   if(accountId){const account=await get(tx,a,'accounts',accountId);if((account.data.customerUserId??account.data.userId)!==quote.owner_id)fail('QUOTE_ACCOUNT_MISMATCH',400);}
   const product=await validateLine(tx,a,line,false),variant=line.variantId?await get(tx,a,'variants',line.variantId):null;
   const context:PriceContext={productId:line.productId,variantId:line.variantId??null,productRevision:product.revision,variantRevision:variant?.revision??null,quantity:line.quantity,accountId,currency,territory,channel};
   const result=await assessEvidenceInScope(tx,a,observationId,context);
   const request={...context,lineIndex,configurationHash:hash(line)};
   const assessment=(await tx.query(`insert into app.price_assessments(tenant_id,workspace_id,created_by,quote_id,observation_id,quote_revision,assessment_version,request,result)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9)returning *`,[a.tenantId,a.workspaceId,a.userId,quote.id,observationId,quote.revision,PRICE_ASSESSMENT_VERSION,request,result])).rows[0];
   await event(tx,a,'intelligence.quote_price_assessed',assessment.id,{quoteId:quote.id,eligible:result.eligibleForQuoteCost});return assessment;
  });
 }
 if(action==='create'){
  restricted(a);
  const prepare=async()=>{
   let lines=input.lines,ownerId=a.userId,request:Row|undefined;
   if(input.requestId){
    request=await get(tx,a,'requests',input.requestId,true);
    if(request.status==='CLOSED')fail('REQUEST_CLOSED');
    const prior=await tx.query('select * from app.quotes where tenant_id=$1 and workspace_id=$2 and request_id=$3 order by created_at desc limit 1',[a.tenantId,a.workspaceId,request.id]);
    if(prior.rows[0])return prior.rows[0];
    lines=request.data.lines;ownerId=request.owner_id;
   }
   const normalized=safeLines(lines);for(const line of normalized)await validateLine(tx,a,line,false);
   const quote=await create(tx,a,'quotes',{title:input.title?text(input.title):request?.title??'Quote · '+new Date().toISOString().slice(0,10),status:'DRAFT',owner_id:ownerId,...(request?{request_id:request.id}:{}),data:{lines:normalized,customerId:input.customerId??ownerId,requestId:request?.id,currency:'USD',version:1,brief:request?.data.brief??null,lineSnapshots:request?.data.lineSnapshots??[]}});
   for(const line of normalized)await create(tx,a,'quote_lines',{title:line.productId,quote_id:quote.id,product_id:line.productId,...(line.variantId?{variant_id:line.variantId}:{}),data:line});
   if(request)await update(tx,a,'requests',request.id,{status:'IN_REVIEW',data:{...request.data,quoteId:quote.id}});
   await event(tx,a,'quote.created',quote.id,{requestId:request?.id??null});return quote;
  };
  return input.requestId?idempotent(tx,a,'sales.prepare_request',input.idempotencyKey??`request-${text(input.requestId)}`,{requestId:input.requestId},prepare):prepare();
 }
 if(action==='review_request'){
  restricted(a);const request=await get(tx,a,'requests',input.id,true);
  const graph:Record<string,string[]>={NEW:['IN_REVIEW','AWAITING_CUSTOMER','CLOSED'],IN_REVIEW:['AWAITING_CUSTOMER','CLOSED'],AWAITING_CUSTOMER:['IN_REVIEW','CLOSED'],QUOTED:['CLOSED'],CLOSED:[]};
  const status=text(input.status,40);transition(request.status,status,graph);
  const note=text(input.note,2000);const saved=await update(tx,a,'requests',request.id,{status,data:{...request.data,operatorNote:note,reviewedBy:a.userId},expectedRevision:input.expectedRevision===undefined?undefined:number(input.expectedRevision,1)});
  await event(tx,a,'request.reviewed',request.id,{status});return saved;
 }
 if(action==='cost_quote'||action==='review'){
  restricted(a);const q=await get(tx,a,'quotes',input.id,true);if(!['DRAFT','COSTED','APPROVAL_REQUIRED','READY_TO_ISSUE'].includes(q.status))fail('QUOTE_IMMUTABLE');
  if(input.expectedRevision!==undefined&&q.revision!==number(input.expectedRevision,1))fail('REVISION_CONFLICT');
  const normalized=safeLines(q.data.lines),worksheet=input.lineCosts!==undefined?reviewedCostWorksheet(input,normalized):null;
  const lines=[];
  for(let i=0;i<normalized.length;i++){
   const l=normalized[i];
   if(worksheet){
    const product=await validateLine(tx,a,l,false),design=l.designVersionId?await get(tx,a,'design_versions',l.designVersionId):null;
    lines.push({...l,title:product.title,configurationHash:hash(l),designVersionHash:design?.data.contentHash??design?.data.versionHash??null,currency:'USD',...worksheet.costs[i],productRevision:product.revision,sourceEvidence:{verification:'OPERATOR_REVIEWED',reviewedBy:a.userId,reference:worksheet.costReference,observedAt:worksheet.observedAt,validUntil:worksheet.validUntil,rawHash:hash({line:l,cost:worksheet.costs[i],reference:worksheet.costReference})},artworkStatus:l.designVersionId?'VERSION_BOUND':'ARTWORK_REVIEW_REQUIRED'});
   }else lines.push(await costLine(tx,a,l,input.freight===undefined?undefined:money(input.freight).div(normalized.length).toFixed(4),input.targetMargin??'0.40'));
  }
  const cost=lines.reduce((s,l)=>s.plus(l.landedCost),new Decimal(0));let total=lines.reduce((s,l)=>s.plus(l.sellTotal),new Decimal(0));if(input.sellTotal!==undefined){const original=total;total=money(input.sellTotal);let allocated=new Decimal(0);for(let i=0;i<lines.length;i++){const share=i===lines.length-1?total.minus(allocated):(original.isZero()?new Decimal(1).div(lines.length):money(lines[i].sellTotal).div(original)).mul(total).toDecimalPlaces(2,Decimal.ROUND_HALF_UP);lines[i].sellTotal=amount(share);lines[i].unitSell=share.div(lines[i].quantity).toFixed(4);allocated=allocated.plus(share);}}
  const margin=grossMargin(amount(cost),amount(total));const needsApproval=new Decimal(margin).lt('0.30');
  const costed=await update(tx,a,'quotes',q.id,{status:needsApproval?'APPROVAL_REQUIRED':'READY_TO_ISSUE',data:{...q.data,lines,...(worksheet?{commercialAssumptions:worksheet.commercialAssumptions,costingMode:'OPERATOR_REVIEWED'}:{costingMode:'SUPPLIER_OFFER'}),landedCost:amount(cost),total:amount(total),margin,currency:'USD',costedAt:new Date().toISOString(),validUntil:new Date(Math.min(Date.now()+7*86400000,...lines.map(l=>new Date(String(l.sourceEvidence.validUntil)).getTime()))).toISOString(),marginApproved:false,pricingHash:hash({lines,total:amount(total)})}});
  await create(tx,a,'estimates',{title:q.title,status:'COSTED',quote_id:q.id,data:{quoteId:q.id,quoteRevision:q.revision+1,cost:amount(cost),total:amount(total),margin,lines}});
  if(needsApproval)await create(tx,a,'approvals',{title:'Margin exception · '+q.title,status:'PENDING',quote_id:q.id,data:{quoteId:q.id,pricingHash:costed.data.pricingHash,margin}});
  await event(tx,a,'quote.costed',q.id,{from:q.status,to:costed.status});return costed;
 }
 if(action==='approve_margin'||action==='approve'){
  if(!['owner','manager'].includes(a.role))fail('MARGIN_APPROVER_REQUIRED',403);const q=await get(tx,a,'quotes',input.id,true);if(q.status!=='APPROVAL_REQUIRED')fail('INVALID_TRANSITION');const reason=text(input.reason,2000);
  await create(tx,a,'approvals',{title:'Approved margin exception',status:'APPROVED',quote_id:q.id,data:{quoteId:q.id,pricingHash:q.data.pricingHash,reason,approvedBy:a.userId}});
  const updated=await update(tx,a,'quotes',q.id,{status:'READY_TO_ISSUE',data:{...q.data,marginApproved:true,approvalReason:reason,approvedBy:a.userId}});await event(tx,a,'quote.margin_approved',q.id,{reason});return updated;
 }
 if(action==='issue_quote'){
  restricted(a);return idempotent(tx,a,'quote.issue',input.key,{id:input.id},async()=>{
   const q=await get(tx,a,'quotes',input.id,true);if(input.expectedRevision!==undefined&&q.revision!==number(input.expectedRevision,1))fail('REVISION_CONFLICT');if(q.status!=='READY_TO_ISSUE')fail('QUOTE_NOT_READY');if(new Date(String(q.data.validUntil)).getTime()<=Date.now())fail('QUOTE_EXPIRED');
   if(new Decimal(String(q.data.margin)).lt('.30')&&!q.data.marginApproved)fail('MARGIN_APPROVAL_REQUIRED');for(const line of safeLines(q.data.lines))await validateLine(tx,a,line,false);
   const sellers=await list(tx,a,'legal_entities');if(!sellers.length)fail('LEGAL_SELLER_REQUIRED');const seller=sellers[0];
   const priorOrders=await quotesForCustomer(tx,a,q.owner_id);const accounts=await list(tx,a,'accounts',1000);const credit=accounts.find(account=>(account.data.customerUserId===q.owner_id||account.data.userId===q.owner_id)&&account.data.creditApproved===true&&account.data.creditApprovedBy);const creditExposure=priorOrders.filter(o=>o.data.terms==='NET_15'&&o.data.paymentStatus!=='SETTLED').reduce((sum,o)=>sum.plus(money(o.data.total)),new Decimal(0));const creditAllowed=credit&&credit.data.creditLimit!==undefined&&creditExposure.plus(money(q.data.total)).lte(money(credit.data.creditLimit));const terms=termsForOrder(priorOrders.filter(o=>o.data.paymentStatus==='SETTLED').length,Boolean(creditAllowed));
   const data={...q.data,terms,creditApprovalId:credit?.id??null,seller:{name:seller.data.legalName??seller.title,address:seller.data.address??'Synthetic local demonstration',terms:seller.data.terms??'Synthetic quote. No live payment or supplier commitment.'},issuedAt:new Date().toISOString(),quoteId:q.id,quoteRevision:q.revision,snapshotHash:hash(q.data)};
   const revision=await create(tx,a,'quote_revisions',{title:q.title+' · issued revision '+q.revision,status:'ISSUED',quote_id:q.id,owner_id:q.owner_id,data});
   const issued=await update(tx,a,'quotes',q.id,{status:'ISSUED',data:{...data,revisionId:revision.id}});if(q.request_id){const request=await get(tx,a,'requests',q.request_id,true);await update(tx,a,'requests',request.id,{status:'QUOTED',data:{...request.data,quoteId:q.id}});}await event(tx,a,'quote.issued',q.id,{revisionId:revision.id});return issued;
  });
 }
 if(action==='accept_quote')return idempotent(tx,a,'quote.accept',input.key,{id:input.id,termsAccepted:input.termsAccepted},async()=>{
  if(input.termsAccepted!==true)fail('TERMS_ACCEPTANCE_REQUIRED');const q=await get(tx,a,'quotes',input.id,true);if(a.role==='customer'&&q.owner_id!==a.userId)fail('NOT_FOUND',404);if(q.status!=='ISSUED')fail('INVALID_TRANSITION');
  if(new Date(String(q.data.validUntil)).getTime()<=Date.now())fail('QUOTE_EXPIRED');const revision=await get(tx,a,'quote_revisions',q.data.revisionId);
  const terms=revision.data.terms==='NET_15'?'NET_15':'PREPAID';
  const order=await create(tx,a,'orders',{title:'Order · '+q.title,status:terms==='NET_15'?'CONFIRMED':'AWAITING_PAYMENT',revision_id:revision.id,quote_id:q.id,owner_id:q.owner_id,data:{...revision.data,customerId:q.owner_id,quoteId:q.id,revisionId:revision.id,terms,paymentStatus:'PENDING',acceptedBy:a.userId,acceptedAt:new Date().toISOString(),agreementHash:hash(revision.data)}});
  for(const raw of revision.data.lines as Input[]){await create(tx,a,'order_lines',{title:String(raw.title),order_id:order.id,product_id:raw.productId,...(raw.variantId?{variant_id:raw.variantId}:{}),owner_id:q.owner_id,status:'CONFIRMED',data:{...raw,shippedQuantity:0}});}
  await update(tx,a,'quotes',q.id,{status:'ACCEPTED'});await event(tx,a,'quote.accepted',q.id,{orderId:order.id});return a.role==='customer'?publicOrder(order):order;
 });
 if(action==='update'){
  restricted(a);const q=await get(tx,a,'quotes',input.id,true);if(q.status!=='DRAFT')fail('QUOTE_IMMUTABLE');const lines=input.lines?safeLines(input.lines):safeLines(q.data.lines);for(const line of lines)await validateLine(tx,a,line,false);const row=await update(tx,a,'quotes',q.id,{title:input.title?text(input.title):q.title,data:{...q.data,lines},expectedRevision:input.expectedRevision===undefined?undefined:number(input.expectedRevision,1)});await event(tx,a,'quote.updated',q.id);return row;
 }
 if(action==='revise_quote'){
  restricted(a);const q=await get(tx,a,'quotes',input.id);if(!['ISSUED','DECLINED','EXPIRED'].includes(q.status))fail('INVALID_TRANSITION');const row=await create(tx,a,'quotes',{title:q.title+' · revision',owner_id:q.owner_id,data:{lines:q.data.lines,customerId:q.data.customerId,previousQuoteId:q.id,currency:q.data.currency}});await event(tx,a,'quote.revised',row.id,{previousQuoteId:q.id});return row;
 }
 if(action==='archive'){restricted(a);const q=await get(tx,a,'quotes',input.id,true);if(q.status!=='DRAFT')fail('QUOTE_IMMUTABLE');const row=await update(tx,a,'quotes',q.id,{status:'ARCHIVED'});await event(tx,a,'quote.archived',q.id);return row;}
 return fail('UNSUPPORTED_ACTION',400);
}
