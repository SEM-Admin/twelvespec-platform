/** Private evidence history. Transactional domains retain every business transition. */
import {z} from 'zod';
import {authorize,event,fail,get,hash,text,type Actor,type Input,type Tx} from '../../kernel/src';
import {unitCost,extendUnitCost} from '../../pricing/src';
import {PRICE_CLASSES,COST_COMPONENTS,CHARGE_BASES,type CostComponent,type ChargeBasis} from '../../contracts/src/intelligence';
export {PRICE_CLASSES} from '../../contracts/src/intelligence';

export type PriceClass=typeof PRICE_CLASSES[number];
export const PRICE_ASSESSMENT_VERSION='price-evidence/1';
const uuid=z.string().uuid(), instant=z.string().datetime({offset:true});
const label=(max=500)=>z.string().trim().min(1).max(max);
const sourceSchema=z.object({
 sourceKey:label(200),title:label(),publisher:label(),edition:label(100),
 sourceUri:z.string().max(2000).optional(),contentHash:z.string().regex(/^[a-f0-9]{64}$/),
 sourceRecordId:uuid.optional(),origin:z.enum(['SYNTHETIC','OPERATOR_DOCUMENT']),
 rightsReference:label(1000),allowedUses:z.array(z.enum(['INTERNAL_RESEARCH','QUOTE_COST','PUBLIC_CLAIM'])).min(1).max(3),
 rightsValidFrom:instant,rightsValidUntil:instant,retentionUntil:instant,parserVersion:label(100)
}).strict();
const observationSchema=z.object({
 sourceId:uuid,observationKey:label(200),productId:uuid,variantId:uuid,
 expectedProductRevision:z.number().int().positive(),expectedVariantRevision:z.number().int().positive(),accountId:uuid.optional(),
 priceClass:z.enum(PRICE_CLASSES),originalValue:z.string().regex(/^[0-9]{1,14}(\.[0-9]{1,8})?$/),
 currency:z.string().regex(/^[A-Z]{3}$/),unitBasis:z.enum(['EACH','PACK']),unitsPerPrice:z.number().int().min(1).max(1000000),
 minimumQuantity:z.number().int().min(1).max(1000000),maximumQuantity:z.number().int().min(1).max(1000000).optional(),
 orderMultiple:z.number().int().min(1).max(1000000),territory:z.string().regex(/^[A-Z]{2}$/),
 channel:z.enum(['DIRECT','COMPANY_STORE','MARKETPLACE']),observedAt:instant,effectiveFrom:instant,effectiveUntil:instant,
 freshnessHours:z.number().int().min(1).max(8760),evidenceState:z.enum(['SYNTHETIC','UNVERIFIED','OPERATOR_REVIEWED']),reviewReference:label(1000).optional(),
 componentCode:z.enum(COST_COMPONENTS).optional(),chargeBasis:z.enum(CHARGE_BASES).optional(),processProfileId:uuid.optional(),method:label(100).optional(),location:label(100).optional()
}).strict();
export type EvidenceSource={
 id:string;source_key:string;title:string;publisher:string;edition:string;source_uri:string|null;content_hash:string;
 origin:'SYNTHETIC'|'OPERATOR_DOCUMENT';allowed_uses:string[];rights_valid_from:string;rights_valid_until:string;retention_until:string;fingerprint:string;
};
export type PriceObservation={
 id:string;source_id:string;product_id:string;variant_id:string;product_revision:number;variant_revision:number;account_id:string|null;
 price_class:PriceClass;original_value:string;unit_amount:string;source_scale:number;currency:string;
 unit_basis:'EACH'|'PACK';units_per_price:number;minimum_quantity:number;maximum_quantity:number|null;order_multiple:number;
 territory:string;channel:string;observed_at:string;effective_from:string;effective_until:string;freshness_hours:number;
 evidence_state:'SYNTHETIC'|'UNVERIFIED'|'OPERATOR_REVIEWED';review_reference:string|null;fingerprint:string;
 component_code?:CostComponent;charge_basis?:ChargeBasis;process_profile_id?:string|null;method?:string|null;location?:string|null;
};
export type PriceContext={productId:string;variantId:string|null;productRevision:number;variantRevision:number|null;quantity:number;accountId:string|null;currency:string;territory:string;channel:string;publicationCurrent?:boolean};
function parse<T>(schema:z.ZodType<T>,input:unknown,code:string):T{const r=schema.safeParse(input);return r.success?r.data:fail(code,400);}
function reader(a:Actor){if(!['owner','integration_admin','sales','manager','buyer','finance'].includes(a.role))fail('EVIDENCE_ACCESS_DENIED',403);}
/** Local protocol opt-in; the database still enforces scope and authorized role. */
export async function allowComponentPriceReads(tx:Tx,a:Actor){reader(a);await tx.query("select set_config('ts.component_price_reader','1',true)");}
function steward(a:Actor){authorize(a,'supplier');}
function safeUri(value:string|undefined):string|null{
 if(value===undefined)return null;
 let url:URL;try{url=new URL(value);}catch{return fail('EVIDENCE_URI_INVALID',400);}
 // References only; never fetched. Authentication/query strings cannot enter evidence metadata.
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)return fail('EVIDENCE_URI_INVALID',400);
 return url.toString();
}
const iso=(v:string)=>new Date(v).toISOString();

export async function registerEvidenceSource(tx:Tx,a:Actor,input:Input):Promise<EvidenceSource>{
 steward(a);const v=parse(sourceSchema,input,'EVIDENCE_SOURCE_INVALID');
 if(Date.parse(v.retentionUntil)<=Date.now())fail('EVIDENCE_RETENTION_EXPIRED',400);
 if(Date.parse(v.rightsValidFrom)>Date.now()+60000||Date.parse(v.rightsValidUntil)<=Date.now()||Date.parse(v.rightsValidUntil)<=Date.parse(v.rightsValidFrom)||Date.parse(v.retentionUntil)<Date.parse(v.rightsValidUntil))fail('EVIDENCE_RIGHTS_DATES_INVALID',400);
 if(v.sourceRecordId)await get(tx,a,'source_records',v.sourceRecordId);
 const normalized={...v,sourceUri:safeUri(v.sourceUri),sourceRecordId:v.sourceRecordId??null,allowedUses:[...new Set(v.allowedUses)].sort(),rightsValidFrom:iso(v.rightsValidFrom),rightsValidUntil:iso(v.rightsValidUntil),retentionUntil:iso(v.retentionUntil)};
 const fingerprint=hash(normalized);
 await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`${a.tenantId}/${a.workspaceId}/evidence-source/${v.sourceKey}`]);
 const prior=(await tx.query('select * from app.intelligence_sources where tenant_id=$1 and workspace_id=$2 and source_key=$3',[a.tenantId,a.workspaceId,v.sourceKey])).rows[0] as EvidenceSource|undefined;
 if(prior){if(prior.fingerprint!==fingerprint)fail('EVIDENCE_SOURCE_KEY_CONFLICT');return prior;}
 const row=(await tx.query(`insert into app.intelligence_sources
 (tenant_id,workspace_id,created_by,source_key,title,publisher,edition,source_uri,content_hash,source_record_id,origin,rights_reference,allowed_uses,rights_valid_from,rights_valid_until,retention_until,parser_version,fingerprint)
 values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) returning *`,
 [a.tenantId,a.workspaceId,a.userId,v.sourceKey,v.title,v.publisher,v.edition,normalized.sourceUri,v.contentHash,normalized.sourceRecordId,v.origin,v.rightsReference,normalized.allowedUses,normalized.rightsValidFrom,normalized.rightsValidUntil,normalized.retentionUntil,v.parserVersion,fingerprint])).rows[0] as EvidenceSource;
 await event(tx,a,'intelligence.source_recorded',row.id);return row;
}
export async function readEvidenceSource(tx:Tx,a:Actor,id:unknown):Promise<EvidenceSource>{
 if(a.role!=='operations')reader(a);const sourceId=text(id);
 await tx.query('select pg_advisory_xact_lock_shared(hashtextextended($1,0))',[`${a.tenantId}/${a.workspaceId}/evidence-rights/${sourceId}`]);
 const row=(await tx.query('select * from app.intelligence_sources where tenant_id=$1 and workspace_id=$2 and id=$3',[a.tenantId,a.workspaceId,sourceId])).rows[0];
 if(!row)fail('EVIDENCE_SOURCE_NOT_FOUND',404);return row;
}
export async function sourceEvidenceState(tx:Tx,a:Actor,id:string,use:'INTERNAL_RESEARCH'|'QUOTE_COST',now=new Date()){
 const source=await readEvidenceSource(tx,a,id);
 const restricted=Boolean((await tx.query('select id from app.intelligence_restrictions where tenant_id=$1 and workspace_id=$2 and source_id=$3',[a.tenantId,a.workspaceId,source.id])).rowCount);
 const reasons:string[]=[];
 if(restricted)reasons.push('SOURCE_RIGHTS_RESTRICTED');
 if(!source.allowed_uses.includes(use))reasons.push('SOURCE_USE_NOT_PERMITTED');
 if(Date.parse(String(source.rights_valid_from))>now.getTime()||Date.parse(String(source.rights_valid_until))<=now.getTime())reasons.push('SOURCE_RIGHTS_OUTSIDE_EFFECTIVE_WINDOW');
 if(Date.parse(String(source.retention_until))<=now.getTime())reasons.push('SOURCE_RETENTION_EXPIRED');
 return {source,restricted,reasons};
}
export async function restrictEvidenceSource(tx:Tx,a:Actor,input:Input){
 steward(a);const sourceId=text(input.sourceId),reason=text(input.reason,1000);
 await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`${a.tenantId}/${a.workspaceId}/evidence-rights/${sourceId}`]);
 const source=(await tx.query('select * from app.intelligence_sources where tenant_id=$1 and workspace_id=$2 and id=$3',[a.tenantId,a.workspaceId,sourceId])).rows[0];
 if(!source)fail('EVIDENCE_SOURCE_NOT_FOUND',404);
 const prior=(await tx.query('select * from app.intelligence_restrictions where tenant_id=$1 and workspace_id=$2 and source_id=$3',[a.tenantId,a.workspaceId,sourceId])).rows[0];
 if(prior){if(prior.reason!==reason)fail('EVIDENCE_RESTRICTION_CONFLICT');return prior;}
 const row=(await tx.query('insert into app.intelligence_restrictions(tenant_id,workspace_id,source_id,created_by,reason)values($1,$2,$3,$4,$5)returning *',[a.tenantId,a.workspaceId,sourceId,a.userId,reason])).rows[0];
 await event(tx,a,'intelligence.source_restricted',sourceId);return row;
}
export async function recordPriceObservation(tx:Tx,a:Actor,input:Input):Promise<PriceObservation>{
 steward(a);await allowComponentPriceReads(tx,a);const v=parse(observationSchema,input,'PRICE_OBSERVATION_INVALID');
 const source=await readEvidenceSource(tx,a,v.sourceId);
 if(Date.parse(String(source.retention_until))<=Date.now())fail('EVIDENCE_RETENTION_EXPIRED');
 if(Date.parse(String(source.rights_valid_from))>Date.now()||Date.parse(String(source.rights_valid_until))<=Date.now())fail('EVIDENCE_SOURCE_RIGHTS_EXPIRED');
 const restricted=(await tx.query('select id from app.intelligence_restrictions where tenant_id=$1 and workspace_id=$2 and source_id=$3',[a.tenantId,a.workspaceId,source.id])).rowCount;
 if(restricted)fail('EVIDENCE_SOURCE_RESTRICTED');
 const product=await get(tx,a,'products',v.productId),variant=await get(tx,a,'variants',v.variantId);
 if(variant.product_id!==product.id)fail('EVIDENCE_VARIANT_PRODUCT_MISMATCH',400);
 if(product.revision!==v.expectedProductRevision||variant.revision!==v.expectedVariantRevision)fail('EVIDENCE_REVISION_CONFLICT');
 if(v.accountId)await get(tx,a,'accounts',v.accountId);
 if(['ACCOUNT_NET','NEGOTIATED'].includes(v.priceClass)&&!v.accountId)fail('EVIDENCE_ACCOUNT_REQUIRED',400);
 if(v.unitBasis==='EACH'&&v.unitsPerPrice!==1)fail('EVIDENCE_UNIT_BASIS_INVALID',400);
 if(v.maximumQuantity!==undefined&&v.maximumQuantity<v.minimumQuantity)fail('EVIDENCE_QUANTITY_RANGE_INVALID',400);
 if(Date.parse(v.effectiveUntil)<=Date.parse(v.effectiveFrom)||Date.parse(v.observedAt)>Date.now()+60000)fail('EVIDENCE_DATES_INVALID',400);
 if((source.origin==='SYNTHETIC')!==(v.evidenceState==='SYNTHETIC'))fail('EVIDENCE_ORIGIN_MISMATCH',400);
 if(v.evidenceState==='OPERATOR_REVIEWED'&&!v.reviewReference)fail('EVIDENCE_REVIEW_REQUIRED',400);
 const component=v.componentCode??'material_cost',charge=v.chargeBasis??'PER_ITEM';
 if(charge!=='PER_ITEM'&&(v.unitBasis!=='EACH'||v.unitsPerPrice!==1))fail('EVIDENCE_CHARGE_BASIS_INVALID',400);
 if(charge==='PER_SHIPMENT'&&component!=='allocated_freight')fail('EVIDENCE_CHARGE_BASIS_INVALID',400);
 if(component!=='material_cost'||charge!=='PER_ITEM'||v.processProfileId||v.method||v.location){
  if(!v.processProfileId||!v.method||!v.location)fail('EVIDENCE_PROCESS_PROFILE_REQUIRED',400);
  const profile=(await tx.query('select * from app.process_profile_versions where tenant_id=$1 and workspace_id=$2 and id=$3',[a.tenantId,a.workspaceId,v.processProfileId])).rows[0];
  if(!profile)fail('PROCESS_PROFILE_NOT_FOUND',404);
  if(profile.product_id!==product.id||profile.variant_id!==variant.id||profile.product_revision!==product.revision||profile.variant_revision!==variant.revision||profile.data.method!==v.method||profile.data.location!==v.location)fail('EVIDENCE_PROCESS_PROFILE_MISMATCH');
  const state=await sourceEvidenceState(tx,a,profile.source_id,'INTERNAL_RESEARCH');if(state.reasons.length)fail('PROCESS_PROFILE_SOURCE_UNAVAILABLE');
 }
 const numeric=unitCost(v.originalValue).toFixed(8),scale=v.originalValue.split('.')[1]?.length??0;
 const normalized={...v,accountId:v.accountId??null,maximumQuantity:v.maximumQuantity??null,reviewReference:v.reviewReference??null,observedAt:iso(v.observedAt),effectiveFrom:iso(v.effectiveFrom),effectiveUntil:iso(v.effectiveUntil)};
 // Preserve M1 retry fingerprints when callers omit or explicitly send original defaults.
 if(normalized.componentCode==='material_cost')delete normalized.componentCode;
 if(normalized.chargeBasis==='PER_ITEM')delete normalized.chargeBasis;
 const fingerprint=hash(normalized);
 await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`${a.tenantId}/${a.workspaceId}/price-observation/${source.id}/${v.observationKey}`]);
 const prior=(await tx.query('select * from app.price_observations where tenant_id=$1 and workspace_id=$2 and source_id=$3 and observation_key=$4',[a.tenantId,a.workspaceId,source.id,v.observationKey])).rows[0] as PriceObservation|undefined;
 if(prior){if(prior.fingerprint!==fingerprint)fail('PRICE_OBSERVATION_KEY_CONFLICT');return prior;}
 const row=(await tx.query(`insert into app.price_observations
 (tenant_id,workspace_id,created_by,source_id,observation_key,product_id,variant_id,product_revision,variant_revision,account_id,price_class,original_value,unit_amount,source_scale,currency,unit_basis,units_per_price,minimum_quantity,maximum_quantity,order_multiple,territory,channel,observed_at,effective_from,effective_until,freshness_hours,evidence_state,review_reference,fingerprint,component_code,charge_basis,process_profile_id,method,location)
 values(${Array.from({length:34},(_,i)=>'$'+(i+1)).join(',')}) returning *`,
 [a.tenantId,a.workspaceId,a.userId,source.id,v.observationKey,v.productId,v.variantId,product.revision,variant.revision,normalized.accountId,v.priceClass,v.originalValue,numeric,scale,v.currency,v.unitBasis,v.unitsPerPrice,v.minimumQuantity,normalized.maximumQuantity,v.orderMultiple,v.territory,v.channel,normalized.observedAt,normalized.effectiveFrom,normalized.effectiveUntil,v.freshnessHours,v.evidenceState,normalized.reviewReference,fingerprint,component,charge,v.processProfileId??null,v.method??null,v.location??null])).rows[0] as PriceObservation;
 await event(tx,a,'intelligence.price_observed',row.id);return row;
}
export async function readPriceObservation(tx:Tx,a:Actor,id:unknown):Promise<PriceObservation>{
 await allowComponentPriceReads(tx,a);const row=(await tx.query('select * from app.price_observations where tenant_id=$1 and workspace_id=$2 and id=$3',[a.tenantId,a.workspaceId,text(id)])).rows[0];
 if(!row)fail('PRICE_OBSERVATION_NOT_FOUND',404);return row;
}

/** Deterministic financial applicability only. Never a quote, supplier or manufacturing approval. */
export function priceApplicabilityReasons(p:PriceObservation,source:EvidenceSource,restricted:boolean,context:PriceContext,now=new Date()){
 const reasons:string[]=[];
 if(!Number.isSafeInteger(context.quantity)||context.quantity<1||context.quantity>1000000)fail('INVALID_QUANTITY',400);
 if(p.source_id!==source.id)fail('EVIDENCE_SOURCE_MISMATCH',400);
 if(!['DISTRIBUTOR_NET','ACCOUNT_NET','NEGOTIATED'].includes(p.price_class))reasons.push('PRICE_CLASS_NOT_QUOTE_COST');
 if(source.origin==='SYNTHETIC'||p.evidence_state==='SYNTHETIC')reasons.push('SYNTHETIC_EVIDENCE');
 if(p.evidence_state!=='OPERATOR_REVIEWED'||!p.review_reference)reasons.push('EVIDENCE_REVIEW_REQUIRED');
 if(restricted)reasons.push('SOURCE_RIGHTS_RESTRICTED');
 if(!source.allowed_uses.includes('QUOTE_COST'))reasons.push('QUOTE_COST_RIGHTS_MISSING');
 const rightsFrom=Date.parse(String(source.rights_valid_from)),rightsUntil=Date.parse(String(source.rights_valid_until)),retention=Date.parse(String(source.retention_until));
 if(!Number.isFinite(rightsFrom)||!Number.isFinite(rightsUntil)||rightsFrom>now.getTime()||rightsUntil<=now.getTime())reasons.push('SOURCE_RIGHTS_OUTSIDE_EFFECTIVE_WINDOW');
 if(!Number.isFinite(retention)||retention<=now.getTime())reasons.push('SOURCE_RETENTION_EXPIRED');
 if(p.product_id!==context.productId||p.variant_id!==context.variantId)reasons.push('EXACT_VARIANT_MISMATCH');
 if(p.product_revision!==context.productRevision||p.variant_revision!==context.variantRevision)reasons.push('PRODUCT_REVISION_CHANGED');
 if(context.publicationCurrent===false)reasons.push('PUBLISHED_CONFIGURATION_DIVERGES');
 if(['ACCOUNT_NET','NEGOTIATED'].includes(p.price_class)&&!p.account_id)reasons.push('ACCOUNT_SCOPE_REQUIRED');
 if(p.account_id!==null&&p.account_id!==context.accountId)reasons.push('ACCOUNT_SCOPE_MISMATCH');
 // Reuse the current Sales USD policy; other source currencies remain evidence,
 // not permission to assume a two-decimal currency or perform implicit FX.
 if(p.currency!=='USD')reasons.push('CURRENCY_NOT_APPROVED');
 if(p.currency!==context.currency)reasons.push('CURRENCY_MISMATCH');
 if(p.territory!==context.territory)reasons.push('TERRITORY_MISMATCH');
 if(p.channel!==context.channel)reasons.push('CHANNEL_MISMATCH');
 const effectiveFrom=Date.parse(String(p.effective_from)),effectiveUntil=Date.parse(String(p.effective_until)),observed=Date.parse(String(p.observed_at));
 if(!Number.isFinite(effectiveFrom)||!Number.isFinite(effectiveUntil)||effectiveFrom>now.getTime()||effectiveUntil<=now.getTime())reasons.push('PRICE_OUTSIDE_EFFECTIVE_WINDOW');
 if(!Number.isFinite(observed)||observed>now.getTime()+60000||now.getTime()-observed>=p.freshness_hours*3600000)reasons.push('STALE_PRICE_OBSERVATION');
 if(context.quantity<p.minimum_quantity)reasons.push('MOQ_NOT_MET');
 // Missing upper scope is unknown here, not an implicit unlimited price promise.
 if(p.maximum_quantity===null)reasons.push('QUANTITY_SCOPE_UNVERIFIED');
 if(p.maximum_quantity!==null&&context.quantity>p.maximum_quantity)reasons.push('QUANTITY_TIER_EXCEEDED');
 if(context.quantity%p.order_multiple!==0||context.quantity%p.units_per_price!==0)reasons.push('PACK_OR_INCREMENT_MISMATCH');
 return reasons;
}
export function assessPriceObservation(p:PriceObservation,source:EvidenceSource,restricted:boolean,context:PriceContext,now=new Date()){
 const reasons=priceApplicabilityReasons(p,source,restricted,context,now);
 if((p.component_code??'material_cost')!=='material_cost'||(p.charge_basis??'PER_ITEM')!=='PER_ITEM'||p.process_profile_id)reasons.push('MATERIAL_ONLY_ASSESSMENT');
 const quantityUnits=context.quantity/p.units_per_price;
 const eligible=!reasons.length;
 return {version:PRICE_ASSESSMENT_VERSION,scope:'MATERIAL_ONLY' as const,status:eligible?'MATERIAL_COST_ELIGIBLE':'REQUIRES_REVIEW',eligibleForQuoteCost:eligible,
  reasons,materialCost:eligible?extendUnitCost(p.original_value,quantityUnits):null,currency:p.currency,
  landedCost:null,customerPrice:null,productionReadiness:'BLOCKED' as const,recheckRequiredBeforeCommit:true,
  assessedAt:now.toISOString(),observationId:p.id,observationFingerprint:p.fingerprint,sourceId:source.id,sourceFingerprint:source.fingerprint};
}
export async function assessEvidenceInScope(tx:Tx,a:Actor,id:string,context:PriceContext){
 const observation=await readPriceObservation(tx,a,id),source=await readEvidenceSource(tx,a,observation.source_id);
 const restricted=Boolean((await tx.query('select id from app.intelligence_restrictions where tenant_id=$1 and workspace_id=$2 and source_id=$3',[a.tenantId,a.workspaceId,source.id])).rowCount);
 return assessPriceObservation(observation,source,restricted,context);
}
