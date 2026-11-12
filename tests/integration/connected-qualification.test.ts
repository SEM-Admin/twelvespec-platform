import {randomUUID} from 'node:crypto';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {actors} from '../helpers';
import {transaction,pool,create,get,update,hash,type Actor,type Input,type Row} from '../../packages/kernel/src';
import {COST_COMPONENTS} from '../../packages/contracts/src/intelligence';
import {handleSupplier} from '../../packages/supplier/src';
import {handleOrders} from '../../packages/orders/src';
import {handleSales,publicQuote} from '../../packages/sales/src';
import {recordPriceObservation,readPriceObservation,registerEvidenceSource,restrictEvidenceSource,type PriceObservation} from '../../packages/intelligence/src';
import {readProcessProfile,type ProcessProfile} from '../../packages/production/src/profiles';
import {handleCreative} from '../../packages/creative/src';
let owner:Actor,customer:Actor,otherOwner:Actor,operations:Actor;
beforeAll(async()=>{
 ({owner,customer,otherOwner}=await actors());
 const id=randomUUID();await pool().query('insert into "user"(id,name,email) values($1,$2,$3)',[id,'SYNTHETIC operations',`operations-${id}@example.test`]);
 await pool().query('insert into memberships(user_id,tenant_id,workspace_id,role) values($1,$2,$3,$4)',[id,owner.tenantId,owner.workspaceId,'operations']);
 operations={...owner,userId:id,role:'operations'};
});afterAll(async()=>{await pool().end();});
const future=()=>new Date(Date.now()+86400000).toISOString();
async function fixture(synthetic=true,published=false){
 const origin=synthetic?'SYNTHETIC':'OPERATOR_DOCUMENT';
 const product=await transaction(owner,tx=>create(tx,owner,'products',{title:'SYNTHETIC 48-cap pilot',status:published?'PUBLISHED':'DRAFT',data:{minimumQuantity:1,methods:['embroidery','none'],locations:['front'],synthetic:true}}));
 const variant=await transaction(owner,tx=>create(tx,owner,'variants',{title:'SYNTHETIC navy',product_id:product.id,status:'ACTIVE',data:{color:'Navy',size:'One size'}}));
 if(published)await transaction(owner,tx=>tx.query('update app.products set data=data||$1::jsonb where id=$2',[{publicSnapshot:{title:product.title,revision:product.revision,product:product.data,variants:[variant]}},product.id]));
 const source=await transaction(owner,tx=>registerEvidenceSource(tx,owner,{sourceKey:randomUUID(),title:'SYNTHETIC fixture permissions, never a real supplier',publisher:'Test fixtures',edition:'2026',contentHash:hash('SYNTHETIC TEST ONLY'),origin,rightsReference:'SYNTHETIC fixture test only',allowedUses:['INTERNAL_RESEARCH','QUOTE_COST'],rightsValidFrom:new Date(Date.now()-3600000).toISOString(),rightsValidUntil:future(),retentionUntil:new Date(Date.now()+172800000).toISOString(),parserVersion:'fixture/1'}));
 const profileInput={profileKey:randomUUID(),title:'SYNTHETIC cap embroidery planning',productId:product.id,variantId:variant.id,expectedProductRevision:product.revision,expectedVariantRevision:variant.revision,sourceId:source.id,producerReference:'SYNTHETIC decorator',facilityReference:'SYNTHETIC test facility',substrateReference:'SYNTHETIC cotton cap',method:'embroidery',location:'front',zoneWidthMm:100,zoneHeightMm:60,outputContractReference:'SYNTHETIC method contract; no machine output enabled',documentationReviewed:!synthetic,reviewReference:synthetic?null:'SYNTHETIC test reviewer'};
 const profile=await transaction(owner,tx=>handleOrders(tx,owner,'record_process_profile',profileInput)) as ProcessProfile;
 const observedAt=new Date().toISOString(),effectiveFrom=new Date(Date.now()-3600000).toISOString(),effectiveUntil=future();
 const record=(change:Input={})=>transaction(owner,tx=>recordPriceObservation(tx,owner,{sourceId:source.id,observationKey:randomUUID(),productId:product.id,variantId:variant.id,expectedProductRevision:product.revision,expectedVariantRevision:variant.revision,priceClass:'DISTRIBUTOR_NET',originalValue:'0.00',currency:'USD',unitBasis:'EACH',unitsPerPrice:1,minimumQuantity:24,maximumQuantity:100,orderMultiple:1,territory:'US',channel:'DIRECT',observedAt,effectiveFrom,effectiveUntil,freshnessHours:24,evidenceState:synthetic?'SYNTHETIC':'OPERATOR_REVIEWED',...(!synthetic?{reviewReference:'SYNTHETIC test review'}:{}),processProfileId:profile.id,method:'embroidery',location:'front',...change}));
 const evidence:Input={};const prices:PriceObservation[]=[];
 for(const component of COST_COMPONENTS){
  const price=await record({componentCode:component,originalValue:component==='material_cost'?'4.1250':component==='decoration_run_cost'?'2.50':component==='setup'?'25.00':component==='allocated_freight'?'10.00':'0.00',chargeBasis:['material_cost','decoration_run_cost'].includes(component)?'PER_ITEM':component==='allocated_freight'?'PER_SHIPMENT':'PER_ORDER'});
  prices.push(price);evidence[component]=[{observationId:price.id,...(component==='allocated_freight'?{freightLeg:'BLANK_TO_DECORATOR'}:{})}];
 }
 const secondFreight=await record({componentCode:'allocated_freight',originalValue:'15.00',chargeBasis:'PER_SHIPMENT'});(evidence.allocated_freight as Input[]).push({observationId:secondFreight.id,freightLeg:'DECORATOR_TO_CUSTOMER'});prices.push(secondFreight);
 const request=await transaction(owner,tx=>create(tx,owner,'requests',{title:'SYNTHETIC 48-cap quote request',owner_id:customer.userId,status:'NEW',data:{lines:[{productId:product.id,variantId:variant.id,quantity:48,method:'embroidery',location:'front'}],brief:{deliveryCountry:'US',deliveryPostalCode:'60601',requestedDate:new Date(Date.now()+14*86400000).toISOString().slice(0,10)}}}));
 const quote=await transaction(owner,tx=>handleSales(tx,owner,'create',{requestId:request.id})) as Row;
 const input={quoteId:quote.id,lineIndex:0,processProfileId:profile.id,idempotencyKey:randomUUID(),channel:'DIRECT',evidence,route:{sourceId:source.id,reviewReference:'SYNTHETIC availability and all route dates',observedAt:new Date().toISOString(),validUntil:future(),freshnessHours:24,supplyMode:'BLANK_TO_DECORATOR',availableQuantity:50,confirmedDeliveryDate:new Date(Date.now()+10*86400000).toISOString().slice(0,10),destinationCountry:'US',destinationPostalCode:'60601',flexibleDeadlineReviewed:false,artworkWidthMm:80,artworkHeightMm:40}};
 const qualify=(change:Input={})=>transaction(owner,tx=>handleSales(tx,owner,'qualify_quote',{...input,idempotencyKey:randomUUID(),...change})) as Promise<{id:string;result:Input;request:Input}>;
 return {product,variant,source,profile,profileInput,prices,record,quote,input,qualify,evidence};
}
describe('connected producer planning and 48-cap evidence qualification',()=>{
 it('extends precise item costs and charges setup/order and two freight legs once; never commits a synthetic proposal',async()=>{
  const f=await fixture(),result=await f.qualify();expect(result.result).toMatchObject({status:'SYNTHETIC_PREVIEW',synthetic:true,scenarioComplete:true,eligibleForQuoteCost:false,commitPermission:false,landedCost:'368.00',suggestedSellTotal:'613.33',productionReadiness:'BLOCKED',components:{material_cost:'198.00',decoration_run_cost:'120.00',setup:'25.00',allocated_freight:'25.00',prepress:'0.00'},reasons:[]});
  expect((await transaction(owner,tx=>get(tx,owner,'quotes',f.quote.id)))).toEqual(f.quote);
  expect((await pool().query('select count(*)::int n from app.qualification_cost_evidence where qualification_id=$1',[result.id])).rows[0].n).toBe(9);
  await expect(transaction(owner,tx=>handleSales(tx,owner,'issue_quote',{id:f.quote.id,key:randomUUID()}))).rejects.toThrow('QUOTE_NOT_READY');
  expect(JSON.stringify(publicQuote({...f.quote,data:{...f.quote.data,qualification:result}}))).not.toMatch(/landedCost|profileFingerprint|qualification|SYNTHETIC fixture permissions/);
 });
 it('qualifies canonical published revision-bearing definitions without relaxing the identity gate',async()=>{const f=await fixture(true,true),result=await f.qualify();expect(result.result).toMatchObject({status:'SYNTHETIC_PREVIEW',scenarioComplete:true,eligibleForQuoteCost:false,landedCost:'368.00',reasons:[]});});
 it('uses the same price policy for documentary proposals and material-only assessments; explicit zeros remain evidence',async()=>{
  const f=await fixture(false),result=await f.qualify();expect(result.result).toMatchObject({status:'COST_PROPOSAL_FOR_REVIEW',eligibleForQuoteCost:true,landedCost:'368.00',commitPermission:false});
  const material=await transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',{quoteId:f.quote.id,lineIndex:0,observationId:f.prices[0].id,currency:'USD',territory:'US',channel:'DIRECT',idempotencyKey:randomUUID()})) as {result:Input};
  expect(material.result.reasons).toContain('MATERIAL_ONLY_ASSESSMENT');expect(material.result.materialCost).toBeNull();
  const missing=await f.qualify({evidence:{...f.evidence,prepress:[]}});expect(missing.result.reasons).toContain('PREPRESS_EVIDENCE_MISSING');expect(missing.result.landedCost).toBeNull();
 });
 it('rejects unknown and overlapping freight legs and duplicate or misclassified components',async()=>{
  const f=await fixture();
  for(const freight of [[],(f.evidence.allocated_freight as Input[]).slice(0,1),(f.evidence.allocated_freight as Input[]).map(x=>({...x,freightLeg:'ALL_LEGS'}))]){
   const result=await f.qualify({evidence:{...f.evidence,allocated_freight:freight}});expect(result.result.reasons).toContain('FREIGHT_ROUTE_SCOPE_INCOMPLETE_OR_DUPLICATED');expect(result.result.landedCost).toBeNull();
  }
  const wrong=await f.qualify({evidence:{...f.evidence,setup:f.evidence.decoration_run_cost}});expect(wrong.result.reasons).toContain('SETUP:COST_COMPONENT_MISMATCH');expect(wrong.result.reasons).toContain('COST_EVIDENCE_REUSED');
 });
 it('retains unknown stock, delivery, artwork, destination and stale-route reasons without inventing missing facts',async()=>{
  const f=await fixture();const result=await f.qualify({route:{...f.input.route,availableQuantity:null,confirmedDeliveryDate:null,destinationPostalCode:'00000',artworkWidthMm:null,validUntil:new Date(Date.now()-1000).toISOString()}});
  expect(result.result.reasons).toEqual(expect.arrayContaining(['AVAILABILITY_UNKNOWN','DELIVERY_DATE_UNKNOWN','QUOTE_DESTINATION_UNVERIFIED','ARTWORK_DIMENSIONS_UNKNOWN','ROUTE_FACTS_STALE']));
  const outside=await f.qualify({route:{...f.input.route,artworkWidthMm:101,availableQuantity:47,confirmedDeliveryDate:new Date(Date.now()+20*86400000).toISOString().slice(0,10)}});
  expect(outside.result.reasons).toEqual(expect.arrayContaining(['ARTWORK_OUTSIDE_PRODUCER_ZONE','INSUFFICIENT_AVAILABLE_QUANTITY','REQUESTED_DATE_NOT_MET']));
 });
 it('blocks stale or wrong profiles and evidence rights while retaining immutable as-of decisions',async()=>{
  const f=await fixture(false);const input={...f.input,idempotencyKey:randomUUID()};
  const original=await f.qualify(input);await transaction(owner,tx=>restrictEvidenceSource(tx,owner,{sourceId:f.source.id,reason:'SYNTHETIC rights revocation'}));
  const replay=await f.qualify(input);expect(JSON.parse(JSON.stringify(replay))).toEqual(JSON.parse(JSON.stringify(original)));
  const fresh=await f.qualify();expect(fresh.result.eligibleForQuoteCost).toBe(false);expect(fresh.result.reasons).toContain('MATERIAL_COST:SOURCE_RIGHTS_RESTRICTED');expect(fresh.result.reasons).toContain('PROFILE_SOURCE_RIGHTS_RESTRICTED');
  await transaction(owner,tx=>update(tx,owner,'variants',f.variant.id,{data:{...f.variant.data,material:'SYNTHETIC changed fabric'}}));
  const stale=await f.qualify();expect(stale.result.reasons).toContain('PROFILE_PRODUCT_REVISION_CHANGED');
  await expect(pool().query('delete from app.commercial_qualifications where id=$1',[original.id])).rejects.toThrow('IMMUTABLE_RECORD');
  await expect(pool().query('update app.process_profile_versions set title=title where id=$1',[f.profile.id])).rejects.toThrow('IMMUTABLE_RECORD');
 });
 it('preserves M1 material fingerprints for omitted and explicit defaults and validates component charging/profile scope',async()=>{
  const f=await fixture();const key=randomUUID(),original=await f.record({observationKey:key,processProfileId:undefined,method:undefined,location:undefined});
  const retry=await f.record({observationKey:key,componentCode:'material_cost',chargeBasis:'PER_ITEM',processProfileId:undefined,method:undefined,location:undefined});expect(retry.id).toBe(original.id);
  await expect(f.record({componentCode:'setup',processProfileId:undefined})).rejects.toThrow('EVIDENCE_PROCESS_PROFILE_REQUIRED');
  await expect(f.record({componentCode:'setup',chargeBasis:'PER_SHIPMENT'})).rejects.toThrow('EVIDENCE_CHARGE_BASIS_INVALID');
  await expect(f.record({componentCode:'setup',chargeBasis:'PER_ORDER',unitBasis:'PACK',unitsPerPrice:12})).rejects.toThrow('EVIDENCE_CHARGE_BASIS_INVALID');
  await expect(f.record({componentCode:'setup',method:'none'})).rejects.toThrow('EVIDENCE_PROCESS_PROFILE_MISMATCH');
 });
 it('keeps operations provenance-only and denies customer/cross-workspace access to profiles and private economics',async()=>{
  const f=await fixture();
  const context=await transaction(operations,tx=>handleOrders(tx,operations,'process_profile_context',{productId:f.product.id,search:'SYNTHETIC 48-cap pilot'})) as Input;
  expect(context.accounts).toEqual([]);expect(context.configuration).toMatchObject({methods:['embroidery','none']});
  const operationsProfile=await transaction(operations,tx=>handleOrders(tx,operations,'record_process_profile',{...f.profileInput,profileKey:randomUUID()})) as ProcessProfile;expect(operationsProfile.verification).toBe('SYNTHETIC');
  await transaction(operations,async tx=>{expect((await tx.query('select * from app.price_observations')).rows).toEqual([]);expect((await tx.query('select * from app.commercial_qualifications')).rows).toEqual([]);});
  await expect(transaction(customer,tx=>handleOrders(tx,customer,'process_profile_library',{}))).rejects.toThrow('PERMISSION_DENIED');
  await expect(transaction(customer,tx=>handleSales(tx,customer,'qualify_quote',f.input))).rejects.toThrow('PERMISSION_DENIED');
  await expect(transaction(otherOwner,tx=>readProcessProfile(tx,otherOwner,f.profile.id))).rejects.toThrow('PROCESS_PROFILE_NOT_FOUND');
  await expect(transaction(otherOwner,tx=>handleSales(tx,otherOwner,'qualify_quote',f.input))).rejects.toThrow('NOT_FOUND');
 });
 it('rejects stale record creation and incompatible profile predecessors; does not promote mixed synthetic evidence',async()=>{
  const f=await fixture();
  await expect(transaction(owner,tx=>handleOrders(tx,owner,'record_process_profile',{...f.profileInput,profileKey:randomUUID(),expectedVariantRevision:99}))).rejects.toThrow('PROCESS_PROFILE_REVISION_CONFLICT');
  const unknown=await transaction(owner,tx=>handleOrders(tx,owner,'record_process_profile',{...f.profileInput,profileKey:randomUUID(),producerReference:null,zoneWidthMm:null})) as ProcessProfile;
  const unqualified=await f.qualify({processProfileId:unknown.id});expect(unqualified.result.reasons).toContain('PROFILE_GEOMETRY_UNKNOWN');expect(unqualified.result.reasons).toContain('PROFILE_PRODUCER_REFERENCE_UNKNOWN');
  const real=await fixture(false);const mixed=await f.qualify({route:{...f.input.route,sourceId:real.source.id}});expect(mixed.result.reasons).toContain('MIXED_SYNTHETIC_AND_REAL_EVIDENCE');expect(mixed.result.eligibleForQuoteCost).toBe(false);
  await expect(transaction(owner,tx=>handleSupplier(tx,owner,'price_process_profiles',{productId:f.product.id,page:0}))).rejects.toThrow('PROCESS_PROFILE_QUERY_INVALID');
  await expect(transaction(owner,tx=>handleOrders(tx,owner,'record_process_profile',{...f.profileInput,profileKey:randomUUID(),previousProfileId:real.profile.id}))).rejects.toThrow('PROCESS_PROFILE_PREDECESSOR_MISMATCH');
  const version=await transaction(owner,tx=>handleOrders(tx,owner,'record_process_profile',{...f.profileInput,profileKey:randomUUID(),previousProfileId:f.profile.id,zoneWidthMm:90})) as ProcessProfile;
  expect(version.version_number).toBe(2);expect(version.previous_profile_id).toBe(f.profile.id);expect((await transaction(owner,tx=>readProcessProfile(tx,owner,f.profile.id))).data.zoneWidthMm).toBe(100);
 });
 it('derives geometry from immutable saved artwork instead of accepting a smaller declared substitute',async()=>{
  const f=await fixture();
  const project=await transaction(owner,tx=>handleCreative(tx,owner,'create',{title:'SYNTHETIC oversized mark',productId:f.product.id,variantId:f.variant.id})) as Row;
  const version=await transaction(owner,tx=>handleCreative(tx,owner,'save_design_version',{id:project.id,layers:[{id:'text',type:'text',text:'SYNTHETIC',x:0,y:0,width:500,height:200,fill:'#123456'}],placement:{xMm:0,yMm:0,widthMm:101,heightMm:40,location:'front',bleedMm:0},physicalWidthMm:101,physicalHeightMm:40,method:'embroidery'})) as Row;
  await transaction(owner,tx=>handleSales(tx,owner,'update',{id:f.quote.id,lines:[{...(f.quote.data.lines as Input[])[0],designVersionId:version.id}]}));
  const result=await f.qualify();expect(result.result.reasons).toContain('ARTWORK_DIMENSION_MISMATCH');expect(result.result.reasons).toContain('ARTWORK_OUTSIDE_PRODUCER_ZONE');expect(result.result.designFingerprint).toBe(hash(version.data));
 });
 it('lists scoped historical decisions and requires a draft for each new decision',async()=>{
  const f=await fixture();const first=await f.qualify();
  const history=await transaction(owner,tx=>handleSales(tx,owner,'qualification_history',{quoteId:f.quote.id})) as {rows:Input[];total:number};expect(history.total).toBe(1);expect(history.rows[0].id).toBe(first.id);
  await expect(transaction(customer,tx=>handleSales(tx,customer,'qualification_history',{quoteId:f.quote.id}))).rejects.toThrow('PERMISSION_DENIED');
  await expect(transaction(otherOwner,tx=>handleSales(tx,otherOwner,'qualification_history',{quoteId:f.quote.id}))).rejects.toThrow('NOT_FOUND');
  await transaction(owner,tx=>update(tx,owner,'quotes',f.quote.id,{status:'COSTED'}));await expect(f.qualify()).rejects.toThrow('QUALIFICATION_REQUIRES_DRAFT');
 });
 it('hides component and profile-bound prices from older readers while preserving M1 prices and scoped new readers',async()=>{
  const f=await fixture();const legacy=await f.record({processProfileId:undefined,method:undefined,location:undefined});
  await transaction(owner,async tx=>{
   const oldRows=(await tx.query('select * from app.price_observations where tenant_id=$1 and workspace_id=$2 and source_id=$3',[owner.tenantId,owner.workspaceId,f.source.id])).rows;
   expect(oldRows.map(r=>r.id)).toEqual([legacy.id]);
   expect((await tx.query('select * from app.price_observations where id=$1',[f.prices[2].id])).rows).toEqual([]);
   expect((await readPriceObservation(tx,owner,f.prices[2].id)).component_code).toBe('setup');
  });
  // Opt-in is SET LOCAL, so a connection reused by an older binary cannot inherit it.
  await transaction(owner,async tx=>{expect((await tx.query('select * from app.price_observations where source_id=$1',[f.source.id])).rows.map(r=>r.id)).toEqual([legacy.id]);});
  await transaction(customer,async tx=>{await tx.query("select set_config('ts.component_price_reader','1',true)");expect((await tx.query('select * from app.price_observations where source_id=$1',[f.source.id])).rows).toEqual([]);});
  await expect(transaction(otherOwner,tx=>readPriceObservation(tx,otherOwner,f.prices[2].id))).rejects.toThrow('PRICE_OBSERVATION_NOT_FOUND');
 });
 it('rejects current private prices/profiles against an older published variant, even when all current revisions match',async()=>{
  const f=await fixture(false);
  const product=await transaction(owner,tx=>update(tx,owner,'products',f.product.id,{status:'PUBLISHED',data:{...f.product.data,publicSnapshot:{revision:2,title:f.product.title,product:f.product.data,variants:[f.variant]}}}));
  const variant=await transaction(owner,tx=>update(tx,owner,'variants',f.variant.id,{data:{...f.variant.data,color:'SYNTHETIC changed Clay'}}));
  const profile=await transaction(owner,tx=>handleOrders(tx,owner,'record_process_profile',{...f.profileInput,profileKey:randomUUID(),expectedProductRevision:product.revision,expectedVariantRevision:variant.revision,previousProfileId:f.profile.id})) as ProcessProfile;
  const evidence:Input={};
  for(const [index,old]of f.prices.entries()){
   const price=await f.record({componentCode:old.component_code,chargeBasis:old.charge_basis,originalValue:old.original_value,expectedProductRevision:product.revision,expectedVariantRevision:variant.revision,processProfileId:profile.id});
   const component=old.component_code!,rows=(evidence[component]??[]) as Input[];rows.push({observationId:price.id,...(component==='allocated_freight'?{freightLeg:index===6?'BLANK_TO_DECORATOR':'DECORATOR_TO_CUSTOMER'}:{})});evidence[component]=rows;
  }
  const result=await f.qualify({processProfileId:profile.id,evidence});expect(result.result.eligibleForQuoteCost).toBe(false);expect(result.result.reasons).toContain('PUBLISHED_CONFIGURATION_DIVERGES');expect(result.result.reasons).not.toContain('PROFILE_PRODUCT_REVISION_CHANGED');
  const legacyMaterial=await f.record({expectedProductRevision:product.revision,expectedVariantRevision:variant.revision,processProfileId:undefined,method:undefined,location:undefined});
  const assessed=await transaction(owner,tx=>handleSales(tx,owner,'assess_quote_price',{quoteId:f.quote.id,lineIndex:0,observationId:legacyMaterial.id,currency:'USD',territory:'US',channel:'DIRECT',idempotencyKey:randomUUID()})) as {result:Input};expect(assessed.result.reasons).toContain('PUBLISHED_CONFIGURATION_DIVERGES');expect(assessed.result.materialCost).toBeNull();
 });
});
