/** Advisory Sales qualification. No quote, payment, purchase or production transition. */
import {z} from 'zod';
import Decimal from 'decimal.js';
import {authorize,event,fail,get,hash,idempotent,type Actor,type Input,type Tx} from '../../kernel/src';
import {COST_COMPONENTS,type CostComponent} from '../../contracts/src/intelligence';
import {amount,extendUnitCost,landedCost,priceForTargetMargin,unitCost,type Components} from '../../pricing/src';
import {priceApplicabilityReasons,readPriceObservation,sourceEvidenceState,type PriceContext} from '../../intelligence/src';
import {PROFILE_VERSION,readProcessProfile} from '../../production/src/profiles';
import {safeLines} from './line-input';
import {validateLine,currentPublishedDefinition} from './validation';

export const QUALIFICATION_VERSION='connected-qualification/1';
export async function qualificationHistory(tx:Tx,a:Actor,input:Input){
 authorize(a,'sales','qualification_history');
 const parsed=z.object({quoteId:z.string().uuid(),page:z.number().int().min(1).max(100000).default(1)}).strict().safeParse(input);
 if(!parsed.success)fail('QUALIFICATION_QUERY_INVALID',400);const v=parsed.data;await get(tx,a,'quotes',v.quoteId);
 const params=[a.tenantId,a.workspaceId,v.quoteId],total=Number((await tx.query('select count(*) n from app.commercial_qualifications where tenant_id=$1 and workspace_id=$2 and quote_id=$3',params)).rows[0].n);
 const rows=(await tx.query('select * from app.commercial_qualifications where tenant_id=$1 and workspace_id=$2 and quote_id=$3 order by created_at desc,id limit 20 offset $4',[...params,(v.page-1)*20])).rows;
 return {rows,total,page:v.page,totalPages:Math.max(1,Math.ceil(total/20))};
}
const uuid=z.string().uuid(),instant=z.string().datetime({offset:true}),date=z.iso.date();
const allocation=z.object({observationId:uuid,freightLeg:z.enum(['ALL_LEGS','BLANK_TO_DECORATOR','DECORATOR_TO_CUSTOMER','PRODUCER_TO_CUSTOMER']).optional()}).strict();
const allocations=z.partialRecord(z.enum(COST_COMPONENTS),z.array(allocation).max(5));
const schema=z.object({quoteId:uuid,lineIndex:z.number().int().min(0).max(99),processProfileId:uuid,idempotencyKey:z.string().min(1).max(200),
 evidence:allocations,accountId:uuid.optional(),channel:z.enum(['DIRECT','COMPANY_STORE','MARKETPLACE']),
 route:z.object({sourceId:uuid,reviewReference:z.string().trim().min(1).max(1000),observedAt:instant,validUntil:instant,freshnessHours:z.number().int().min(1).max(168),
  supplyMode:z.enum(['BLANK_TO_DECORATOR','SINGLE_PRODUCER']),availableQuantity:z.number().int().min(0).max(1000000).nullable(),
  confirmedDeliveryDate:date.nullable(),destinationCountry:z.string().regex(/^[A-Z]{2}$/),destinationPostalCode:z.string().trim().min(1).max(30),
  flexibleDeadlineReviewed:z.boolean(),artworkWidthMm:z.number().positive().max(100000).nullable(),artworkHeightMm:z.number().positive().max(100000).nullable()
 }).strict()
}).strict();

export async function qualifyQuote(tx:Tx,a:Actor,input:Input){
 authorize(a,'sales','qualify_quote');
 const parsed=schema.safeParse(input);if(!parsed.success)fail('QUALIFICATION_INPUT_INVALID',400);const v=parsed.data;
 const {idempotencyKey,...request}=v;
 return idempotent(tx,a,'sales.qualify_quote',idempotencyKey,request,async()=>{
  const quote=await get(tx,a,'quotes',v.quoteId,true);if(quote.status!=='DRAFT')fail('QUALIFICATION_REQUIRES_DRAFT');
  const line=safeLines(quote.data.lines)[v.lineIndex];if(!line)fail('QUOTE_LINE_NOT_FOUND',404);
  const product=await validateLine(tx,a,line,false),variant=line.variantId?await get(tx,a,'variants',line.variantId):null;
  const profile=await readProcessProfile(tx,a,v.processProfileId),now=new Date(),blockers:string[]=[];
  const profileSource=await sourceEvidenceState(tx,a,profile.source_id,'INTERNAL_RESEARCH',now),routeSource=await sourceEvidenceState(tx,a,v.route.sourceId,'INTERNAL_RESEARCH',now);
  blockers.push(...profileSource.reasons.map(r=>'PROFILE_'+r),...routeSource.reasons.map(r=>'ROUTE_'+r));
  if(profile.product_id!==line.productId||profile.variant_id!==line.variantId)blockers.push('PROFILE_EXACT_VARIANT_MISMATCH');
  if(profile.product_revision!==product.revision||profile.variant_revision!==variant?.revision)blockers.push('PROFILE_PRODUCT_REVISION_CHANGED');
  if(profile.data.method!==line.method||profile.data.location!==line.location)blockers.push('PROFILE_METHOD_OR_ZONE_MISMATCH');
  for(const name of ['producerReference','facilityReference','substrateReference','outputContractReference'] as const)if(!profile.data[name])blockers.push('PROFILE_'+name.replace(/[A-Z]/g,c=>'_'+c).toUpperCase()+'_UNKNOWN');
  if(!profile.data.zoneWidthMm||!profile.data.zoneHeightMm)blockers.push('PROFILE_GEOMETRY_UNKNOWN');
  if(profile.verification==='UNVERIFIED')blockers.push('PROFILE_DOCUMENTATION_UNREVIEWED');
  const brief=(quote.data.brief??{}) as Input;
  if(brief.deliveryCountry!==v.route.destinationCountry||brief.deliveryPostalCode!==v.route.destinationPostalCode)blockers.push('QUOTE_DESTINATION_UNVERIFIED');
  if(v.route.availableQuantity===null)blockers.push('AVAILABILITY_UNKNOWN');else if(v.route.availableQuantity<line.quantity)blockers.push('INSUFFICIENT_AVAILABLE_QUANTITY');
  const observed=Date.parse(v.route.observedAt),until=Date.parse(v.route.validUntil);
  if(observed>now.getTime()+60000||until<=observed||until<=now.getTime()||now.getTime()-observed>=v.route.freshnessHours*3600000)blockers.push('ROUTE_FACTS_STALE');
  if(!v.route.confirmedDeliveryDate)blockers.push('DELIVERY_DATE_UNKNOWN');
  else if(v.route.confirmedDeliveryDate<now.toISOString().slice(0,10))blockers.push('DELIVERY_DATE_PAST');
  if(brief.requestedDate){if(typeof brief.requestedDate!=='string'||!date.safeParse(brief.requestedDate).success)blockers.push('REQUESTED_DATE_INVALID');else if(v.route.confirmedDeliveryDate&&v.route.confirmedDeliveryDate>brief.requestedDate)blockers.push('REQUESTED_DATE_NOT_MET');}
  else if(brief.hardDeadline===true||!v.route.flexibleDeadlineReviewed)blockers.push('DELIVERY_SCOPE_UNREVIEWED');
  let width=v.route.artworkWidthMm,height=v.route.artworkHeightMm,designFingerprint:string|null=null;
  if(line.designVersionId){
   const design=await get(tx,a,'design_versions',line.designVersionId),placement=design.data.placement as Input;
   designFingerprint=hash(design.data);
   if(design.data.productRevision!==product.revision||design.data.variantRevision!==variant?.revision)blockers.push('DESIGN_CATALOG_REVISION_CHANGED');
   width=typeof placement?.widthMm==='number'&&typeof placement?.xMm==='number'?placement.xMm+placement.widthMm:null;
   height=typeof placement?.heightMm==='number'&&typeof placement?.yMm==='number'?placement.yMm+placement.heightMm:null;
   if((v.route.artworkWidthMm!==null&&v.route.artworkWidthMm!==width)||(v.route.artworkHeightMm!==null&&v.route.artworkHeightMm!==height))blockers.push('ARTWORK_DIMENSION_MISMATCH');
  }
  if(line.specifications?.widthMm!==undefined&&line.specifications.widthMm!==width)blockers.push('REQUESTED_ARTWORK_WIDTH_MISMATCH');
  if(line.specifications?.heightMm!==undefined&&line.specifications.heightMm!==height)blockers.push('REQUESTED_ARTWORK_HEIGHT_MISMATCH');
  if(width===null||height===null)blockers.push('ARTWORK_DIMENSIONS_UNKNOWN');
  else if((profile.data.zoneWidthMm!==null&&width>profile.data.zoneWidthMm)||(profile.data.zoneHeightMm!==null&&height>profile.data.zoneHeightMm))blockers.push('ARTWORK_OUTSIDE_PRODUCER_ZONE');
  if(v.accountId){const account=await get(tx,a,'accounts',v.accountId);if((account.data.customerUserId??account.data.userId)!==quote.owner_id)fail('QUOTE_ACCOUNT_MISMATCH',400);}
  const context:PriceContext={productId:line.productId,variantId:line.variantId??null,productRevision:product.revision,variantRevision:variant?.revision??null,quantity:line.quantity,accountId:v.accountId??null,currency:String(quote.data.currency),territory:v.route.destinationCountry,channel:v.channel,publicationCurrent:currentPublishedDefinition(product,variant)};
  if(!context.publicationCurrent)blockers.push('PUBLISHED_CONFIGURATION_DIVERGES');
  const components:Components=Object.fromEntries(COST_COMPONENTS.map(c=>[c,null])) as Components;
  const evidence:Input[]=[],used=new Set<string>();let allSynthetic=profileSource.source.origin==='SYNTHETIC'&&profile.verification==='SYNTHETIC'&&routeSource.source.origin==='SYNTHETIC',anySynthetic=profileSource.source.origin==='SYNTHETIC'||routeSource.source.origin==='SYNTHETIC';
  const syntheticOnlyReasons=new Set(['SYNTHETIC_EVIDENCE','EVIDENCE_REVIEW_REQUIRED']);
  for(const component of COST_COMPONENTS){
   const selected=v.evidence[component]??[];let sum=new Decimal(0),complete=selected.length>0;
   if(!selected.length)blockers.push(component.toUpperCase()+'_EVIDENCE_MISSING');
   if(component!=='allocated_freight'&&selected.length>1){blockers.push(component.toUpperCase()+'_DUPLICATE_COST_SCOPE');complete=false;}
   if(component==='allocated_freight'){
    const legs=selected.map(s=>s.freightLeg),expected=v.route.supplyMode==='BLANK_TO_DECORATOR'?['BLANK_TO_DECORATOR','DECORATOR_TO_CUSTOMER']:['PRODUCER_TO_CUSTOMER'];
    const valid=(legs.length===1&&legs[0]==='ALL_LEGS')||(legs.length===expected.length&&expected.every(l=>legs.includes(l as NonNullable<typeof legs[number]>)));
    if(!valid){blockers.push('FREIGHT_ROUTE_SCOPE_INCOMPLETE_OR_DUPLICATED');complete=false;}
   }
   for(const selection of selected){
    if(used.has(selection.observationId)){blockers.push('COST_EVIDENCE_REUSED');complete=false;}used.add(selection.observationId);
    const observation=await readPriceObservation(tx,a,selection.observationId),source=await sourceEvidenceState(tx,a,observation.source_id,'QUOTE_COST',now);
    const synthetic=source.source.origin==='SYNTHETIC'&&observation.evidence_state==='SYNTHETIC';allSynthetic=allSynthetic&&synthetic;anySynthetic=anySynthetic||synthetic;
    const reasons=priceApplicabilityReasons(observation,source.source,source.restricted,context,now);
    if((observation.component_code??'material_cost')!==component)reasons.push('COST_COMPONENT_MISMATCH');
    if(observation.process_profile_id&&observation.process_profile_id!==profile.id)reasons.push('COST_PROCESS_PROFILE_MISMATCH');
    if(component!=='material_cost'&&!observation.process_profile_id)reasons.push('COST_PROCESS_PROFILE_REQUIRED');
    if(observation.process_profile_id&&(observation.method!==line.method||observation.location!==line.location))reasons.push('COST_METHOD_OR_ZONE_MISMATCH');
    const charge=observation.charge_basis??'PER_ITEM';
    const scenarioReasons=reasons.filter(r=>!(synthetic&&syntheticOnlyReasons.has(r)));
    const total=!scenarioReasons.length?(charge==='PER_ITEM'?extendUnitCost(observation.original_value,line.quantity/observation.units_per_price):amount(unitCost(observation.original_value))):null;
    if(total===null)complete=false;else sum=sum.plus(total);
    blockers.push(...scenarioReasons.map(r=>component.toUpperCase()+':'+r));
    evidence.push({component,observationId:observation.id,observationFingerprint:observation.fingerprint,sourceId:source.source.id,sourceFingerprint:source.source.fingerprint,chargeBasis:charge,freightLeg:selection.freightLeg??null,total,reasons});
   }
   if(complete)components[component]=amount(sum);
  }
  if(anySynthetic&&!allSynthetic)blockers.push('MIXED_SYNTHETIC_AND_REAL_EVIDENCE');
  if(!anySynthetic&&profile.verification!=='DOCUMENTED')blockers.push('DOCUMENTED_PROCESS_PROFILE_REQUIRED');
  const reasons=[...new Set(blockers)],complete=!reasons.length&&COST_COMPONENTS.every(c=>components[c]!==null),cost=complete?landedCost(components):null;
  const result={version:QUALIFICATION_VERSION,profileVersion:PROFILE_VERSION,status:complete?(allSynthetic?'SYNTHETIC_PREVIEW':'COST_PROPOSAL_FOR_REVIEW'):'REQUIRES_REVIEW',
   scenarioComplete:complete,eligibleForQuoteCost:complete&&!anySynthetic,synthetic:allSynthetic,components,landedCost:cost,
   suggestedSellTotal:cost!==null?priceForTargetMargin(cost):null,targetMargin:'0.40',currency:context.currency,reasons,
   productionReadiness:'BLOCKED',productionHolds:['EXACT_VERSION_PROOF_APPROVAL','METHOD_SPECIFIC_PREFLIGHT','MANUFACTURER_ACCEPTANCE',...(line.method==='embroidery'?['DIGITIZATION_AND_PHYSICAL_SEW_OUT']:[])],
   recheckRequiredBeforeCommit:true,commitPermission:false,assessedAt:now.toISOString(),configurationHash:hash(line),designFingerprint,
   profileFingerprint:profile.fingerprint,profileSourceFingerprint:profileSource.source.fingerprint,routeSourceFingerprint:routeSource.source.fingerprint,evidence};
  const row=(await tx.query(`insert into app.commercial_qualifications(tenant_id,workspace_id,created_by,quote_id,quote_revision,line_index,process_profile_id,qualification_version,request,result)
   values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)returning *`,[a.tenantId,a.workspaceId,a.userId,quote.id,quote.revision,v.lineIndex,profile.id,QUALIFICATION_VERSION,{...request,context},result])).rows[0];
  for(const e of evidence)await tx.query('insert into app.qualification_cost_evidence(tenant_id,workspace_id,qualification_id,component_code,observation_id)values($1,$2,$3,$4,$5) on conflict do nothing',[a.tenantId,a.workspaceId,row.id,e.component,e.observationId]);
  await event(tx,a,'intelligence.quote_qualified',row.id,{quoteId:quote.id,status:result.status});return row;
 });
}
