import {describe,it,expect} from 'vitest';
import {normalizeCatalogSource} from '../../packages/catalog/src/sources';
import {normalizeQuoteBrief,briefMissingFields} from '../../packages/commerce/src/brief';
import {reviewedCostWorksheet} from '../../packages/sales/src/manual-costing';
import {safeLines,publicQuote} from '../../packages/sales/src';
import {hash,type Row} from '../../packages/kernel/src';
import {customerSafeObject} from '../../packages/server/src/customer-projection';

const line={productId:'product',variantId:'variant',quantity:12,method:'none',location:'front'};
const components={material_cost:'60.00',decoration_run_cost:'18.00',setup:'25.00',prepress:'0.00',outsourced_labor:'0.00',packaging:'5.00',allocated_freight:'12.00',other_direct_cost:'0.00'};
function worksheet(){return {currency:'USD',targetMargin:'0.40',costReference:'PRIVATE supplier quotation',observedAt:new Date().toISOString(),validUntil:new Date(Date.now()+3600000).toISOString(),lineCosts:[{configurationHash:hash(line),components:{...components}}],commercialReview:{productOptionsConfirmed:true,availabilityConfirmed:true,deliveryConfirmed:true,deliveryNote:'Reviewed destination and delivery window.',taxTreatment:'EXCLUDED'}};}

describe('Owned catalog source facts and customer quote inputs',()=>{
 it('keeps unknown commercial facts unknown and removes submitted privileges/costs',()=>{
  const source=normalizeCatalogSource({supplier:'Example',externalId:'STYLE-1',title:'Actual style',description:'<p>Material</p><script>steal()</script>',price:'1.00',licenseApproved:true,verified:true,variants:[{color:'Invented'}]});
  expect(source.description).toBe('Material');expect(source.rightsStatus).toBe('UNREVIEWED');expect(source.variantCoverage).toBe('UNVERIFIED');expect(source).not.toHaveProperty('price');expect(source).not.toHaveProperty('variants');expect(source).not.toHaveProperty('licenseApproved');
 });
 it('does not allow source reference URLs to carry credentials or query tokens',()=>{
  for(const sourceUrl of ['http://example.test/feed','https://user:pass@example.test/feed','https://example.test/feed?token=private'])expect(()=>normalizeCatalogSource({supplier:'Example',externalId:'1',title:'Style',sourceUrl})).toThrow('SOURCE_REFERENCE_URL_INVALID');
 });
 it('preserves requested specifications while discarding forged price and supplier data',()=>{
  const result=safeLines([{...line,notes:'Match the event color',specifications:{widthMm:'210',printSides:'DOUBLE',paperStock:'Uncoated',unitCost:'0',credential:'secret'},sellTotal:'0.01',sourceEvidence:{verified:true}}])[0];
  expect(result.specifications).toEqual({widthMm:210,paperStock:'Uncoated',printSides:'DOUBLE'});expect(result.notes).toBe('Match the event color');expect(result).not.toHaveProperty('sellTotal');expect(result).not.toHaveProperty('sourceEvidence');
  expect(()=>safeLines([{...line,specifications:{pageCount:1.5}}])).toThrow('LINE_SPECIFICATIONS_INVALID');
 });
 it('validates dates and explicit deadline assertions without inventing delivery facts',()=>{
  expect(briefMissingFields(normalizeQuoteBrief(undefined,'Project'))).toEqual(['deliveryCountry','deliveryPostalCode','artworkStatus']);
  expect(()=>normalizeQuoteBrief({requestedDate:'2020-01-01'},'Project')).toThrow('REQUESTED_DATE_INVALID');
  expect(()=>normalizeQuoteBrief({hardDeadline:true},'Project')).toThrow('DEADLINE_DATE_REQUIRED');
  const brief=normalizeQuoteBrief({projectName:'Launch',deliveryCountry:'us',deliveryPostalCode:'60601',artworkStatus:'NEED_HELP',price:'0',supplierSecret:'private'},'Project');
  expect(brief.deliveryCountry).toBe('US');expect(briefMissingFields(brief)).toEqual([]);expect(brief).not.toHaveProperty('price');expect(brief).not.toHaveProperty('supplierSecret');
 });
});

describe('Complete reviewed costs and customer price visibility',()=>{
 it('prices full line costs exactly, with explicit delivery/tax assumptions',()=>{
  const result=reviewedCostWorksheet(worksheet(),[line]);
  expect(result.costs[0].landedCost).toBe('120.00');expect(result.costs[0].sellTotal).toBe('200.00');expect(result.costs[0].unitSell).toBe('16.6667');expect(result.commercialAssumptions.taxTreatment).toBe('EXCLUDED');expect(result.commercialAssumptions.freightIncluded).toBe(true);
 });
 it('rejects blank costs, stale evidence and unconfirmed commercial assumptions',()=>{
  const missing=worksheet();delete (missing.lineCosts[0].components as Record<string,string>).prepress;expect(()=>reviewedCostWorksheet(missing,[line])).toThrow('MISSING_PREPRESS');
  const stale={...worksheet(),observedAt:new Date(Date.now()-2*86400000).toISOString()};expect(()=>reviewedCostWorksheet(stale,[line])).toThrow('COST_OBSERVATION_STALE');
  const notReviewed=worksheet();notReviewed.commercialReview.deliveryConfirmed=false;expect(()=>reviewedCostWorksheet(notReviewed,[line])).toThrow('COMMERCIAL_REVIEW_REQUIRED');
  expect(()=>reviewedCostWorksheet(worksheet(),[{...line,quantity:13}])).toThrow('COST_CONFIGURATION_CHANGED');
 });
 it('hides unissued prices and all private costs from customer projections',()=>{
  const quote={id:'quote',title:'Project',status:'READY_TO_ISSUE',revision:3,data:{total:'200.00',landedCost:'120.00',lines:[{...line,sellTotal:'200.00',components,sourceEvidence:{reference:'PRIVATE'}}]}} as unknown as Row;
  const draft=publicQuote(quote);expect(draft.data.total).toBeNull();expect(JSON.stringify(draft)).not.toContain('200.00');
  const issued=publicQuote({...quote,status:'ISSUED'});expect(issued.data.total).toBe('200.00');expect(JSON.stringify(issued)).not.toMatch(/PRIVATE|landedCost|components|sourceEvidence/);
 });
 it('retains timestamps and legitimate bundle components while removing nested costs',()=>{
  const result=customerSafeObject({created_at:new Date('2026-11-07T00:00:00Z'),operatorNote:'PRIVATE sourcing discussion',components:[{productId:'product',quantity:2,cost:'PRIVATE',material_cost:'PRIVATE',setup:'PRIVATE'}]});
  expect(result).toEqual({created_at:'2026-11-07T00:00:00.000Z',components:[{productId:'product',quantity:2}]});
 });
});
