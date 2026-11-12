import {describe,it,expect} from 'vitest';
import {assessPriceObservation,PRICE_CLASSES,type PriceObservation,type EvidenceSource,type PriceContext} from '../../packages/intelligence/src';
import {extendUnitCost,tierCost,unitCost} from '../../packages/pricing/src';
import golden from '../fixtures/cia-price-golden.json';

const now=new Date('2026-11-12T12:00:00Z');
// Synthetic fixture representing a manually reviewed document; no real entitlement is asserted.
const source:EvidenceSource={id:'source',source_key:'test',title:'SYNTHETIC financial fixture',publisher:'TEST',edition:'2026',source_uri:null,content_hash:'a'.repeat(64),origin:'OPERATOR_DOCUMENT',allowed_uses:['INTERNAL_RESEARCH','QUOTE_COST'],rights_valid_from:'2026-01-01T00:00:00Z',rights_valid_until:'2026-12-01T00:00:00Z',retention_until:'2027-01-01T00:00:00Z',fingerprint:'source-hash'};
const price:PriceObservation={id:'observation',source_id:'source',product_id:'product',variant_id:'navy-cap',product_revision:2,variant_revision:3,account_id:null,price_class:'DISTRIBUTOR_NET',original_value:'0.0250',unit_amount:'0.02500000',source_scale:4,currency:'USD',unit_basis:'EACH',units_per_price:1,minimum_quantity:24,maximum_quantity:1000,order_multiple:1,territory:'US',channel:'DIRECT',observed_at:'2026-11-12T11:00:00Z',effective_from:'2026-11-01T00:00:00Z',effective_until:'2026-12-01T00:00:00Z',freshness_hours:24,evidence_state:'OPERATOR_REVIEWED',review_reference:'SYNTHETIC reviewed-document reference',fingerprint:'observation-hash'};
const context:PriceContext={productId:'product',variantId:'navy-cap',productRevision:2,variantRevision:3,quantity:1000,accountId:null,currency:'USD',territory:'US',channel:'DIRECT'};

describe('CIA precision and commercial evidence rules',()=>{
 it.each(golden.extensionCases)('extends $unit at quantity $quantity to $total before rounding',({unit,quantity,total})=>{
  expect(extendUnitCost(unit,quantity)).toBe(total);
  expect(extendUnitCost(tierCost([{minimum:1,cost:unit}],quantity),quantity)).toBe(total);
 });
 it('rejects invalid or missing unit costs and fractional/zero quantities',()=>{
  for(const value of [null,undefined,'','NaN','Infinity','-0.1','0.000000001'])expect(()=>unitCost(value)).toThrow();
  for(const quantity of [0,-1,1.2,NaN,Infinity])expect(()=>extendUnitCost('.025',quantity)).toThrow('INVALID_QUANTITY');
 });
 it('qualifies only the exact financial component, never a complete quote or production route',()=>{
  expect(assessPriceObservation(price,source,false,context,now)).toMatchObject({eligibleForQuoteCost:true,materialCost:'25.00',scope:'MATERIAL_ONLY',landedCost:null,customerPrice:null,productionReadiness:'BLOCKED',recheckRequiredBeforeCommit:true});
 });
 it.each(PRICE_CLASSES.filter(c=>!['DISTRIBUTOR_NET','ACCOUNT_NET','NEGOTIATED'].includes(c)))('keeps %s separate from authorized quote cost',priceClass=>{
  expect(assessPriceObservation({...price,price_class:priceClass},source,false,context,now)).toMatchObject({eligibleForQuoteCost:false,materialCost:null,reasons:['PRICE_CLASS_NOT_QUOTE_COST']});
 });
 it.each([
  [{variantId:'clay-cap'},'EXACT_VARIANT_MISMATCH'],[{productId:'other'},'EXACT_VARIANT_MISMATCH'],[{variantId:null},'EXACT_VARIANT_MISMATCH'],
  [{productRevision:3},'PRODUCT_REVISION_CHANGED'],[{variantRevision:4},'PRODUCT_REVISION_CHANGED'],
  [{currency:'CAD'},'CURRENCY_MISMATCH'],[{territory:'CA'},'TERRITORY_MISMATCH'],[{channel:'COMPANY_STORE'},'CHANNEL_MISMATCH'],
  [{quantity:12},'MOQ_NOT_MET'],[{quantity:1001},'QUANTITY_TIER_EXCEEDED']
 ] as const)('excludes incompatible request context %j', (change,reason)=>{
  const result=assessPriceObservation(price,source,false,{...context,...change},now);expect(result.reasons).toContain(reason);expect(result.materialCost).toBeNull();
 });
 it('requires an exact account grant and respects pack/MOQ scope',()=>{
  const scoped={...price,price_class:'ACCOUNT_NET' as const,account_id:'account',unit_basis:'PACK' as const,units_per_price:12,original_value:'3.0000',order_multiple:12};
  expect(assessPriceObservation(scoped,source,false,{...context,quantity:48},now).reasons).toContain('ACCOUNT_SCOPE_MISMATCH');
  expect(assessPriceObservation(scoped,source,false,{...context,quantity:50,accountId:'account'},now).reasons).toContain('PACK_OR_INCREMENT_MISMATCH');
  expect(assessPriceObservation(scoped,source,false,{...context,quantity:48,accountId:'account'},now).materialCost).toBe('12.00');
 });
 it('keeps source revocation, rights, retention, stale and future evidence blocking',()=>{
  const cases=[
   assessPriceObservation(price,source,true,context,now),
   assessPriceObservation(price,{...source,allowed_uses:['INTERNAL_RESEARCH']},false,context,now),
   assessPriceObservation(price,{...source,rights_valid_until:now.toISOString()},false,context,now),
   assessPriceObservation(price,{...source,rights_valid_from:'2026-12-01T00:00:00Z'},false,context,now),
   assessPriceObservation(price,{...source,retention_until:now.toISOString()},false,context,now),
   assessPriceObservation({...price,observed_at:'2026-11-11T12:00:00Z'},source,false,context,now),
   assessPriceObservation({...price,effective_until:now.toISOString()},source,false,context,now),
   assessPriceObservation({...price,effective_from:'2026-11-13T12:00:00Z'},source,false,context,now),
   assessPriceObservation({...price,observed_at:'2026-11-13T12:00:00Z'},source,false,context,now)
  ];
  for(const result of cases){expect(result.eligibleForQuoteCost).toBe(false);expect(result.materialCost).toBeNull();}
  expect(cases[2].reasons).toContain('SOURCE_RIGHTS_OUTSIDE_EFFECTIVE_WINDOW');
 });
 it('keeps synthetic and unreviewed facts distinct, while an explicit reviewed zero remains zero',()=>{
  for(const evidenceState of ['SYNTHETIC','UNVERIFIED'] as const)expect(assessPriceObservation({...price,evidence_state:evidenceState},source,false,context,now).materialCost).toBeNull();
  expect(assessPriceObservation(price,{...source,origin:'SYNTHETIC'},false,context,now).materialCost).toBeNull();
  expect(assessPriceObservation({...price,original_value:'0.0000'},source,false,context,now).materialCost).toBe('0.00');
 });
 it('retains foreign-currency facts without inventing approved FX or currency rounding rules',()=>{
  const result=assessPriceObservation({...price,currency:'JPY'},source,false,{...context,currency:'JPY'},now);
  expect(result).toMatchObject({eligibleForQuoteCost:false,materialCost:null,currency:'JPY',reasons:['CURRENCY_NOT_APPROVED']});
 });
 it('does not turn missing quantity applicability into an unlimited price grant',()=>{
  expect(assessPriceObservation({...price,maximum_quantity:null},source,false,context,now)).toMatchObject({eligibleForQuoteCost:false,materialCost:null,reasons:['QUANTITY_SCOPE_UNVERIFIED']});
 });
});
