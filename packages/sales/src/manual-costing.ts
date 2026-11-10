import {fail,hash,text,type Input} from '../../kernel/src';
import {amount,COST_COMPONENTS,landedCost,money,priceForTargetMargin,type Components} from '../../pricing/src';
import type {ConfigLine} from './line-input';

export function reviewedCostWorksheet(input:Input,lines:ConfigLine[]) {
 if(input.currency!=='USD')fail('CURRENCY_NOT_APPROVED',400);
 if(!Array.isArray(input.lineCosts)||input.lineCosts.length!==lines.length)fail('COMPLETE_COST_WORKSHEET_REQUIRED',400);
 const review=input.commercialReview as Input|undefined;
 if(!review||review.productOptionsConfirmed!==true||review.availabilityConfirmed!==true||review.deliveryConfirmed!==true)fail('COMMERCIAL_REVIEW_REQUIRED',400);
 if(review.taxTreatment!=='EXCLUDED')fail('EXPLICIT_TAX_TREATMENT_REQUIRED',400);
 const deliveryNote=text(review.deliveryNote,2000),costReference=text(input.costReference,1000);
 const observedAt=text(input.observedAt,40),validUntil=text(input.validUntil,40),observed=Date.parse(observedAt),expires=Date.parse(validUntil),now=Date.now();
 if(!Number.isFinite(observed)||observed>now+60000||observed<now-86400000)fail('COST_OBSERVATION_STALE',400);
 if(!Number.isFinite(expires)||expires<=now||expires>now+7*86400000)fail('COST_VALIDITY_INVALID',400);
 const costs=input.lineCosts.map((raw,i)=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('COST_LINE_INVALID',400);
  const row=raw as Input;
  if(row.configurationHash!==hash(lines[i]))fail('COST_CONFIGURATION_CHANGED');
  const data=row.components as Input|undefined;if(!data||typeof data!=='object'||Array.isArray(data))fail('COMPLETE_COST_WORKSHEET_REQUIRED',400);
  const components={} as Components;
  for(const key of COST_COMPONENTS){if(data[key]===undefined||data[key]===null||data[key]==='')fail('MISSING_'+key.toUpperCase(),400);components[key]=amount(money(data[key]));}
  const cost=landedCost(components),sell=priceForTargetMargin(cost,input.targetMargin??'0.40');
  return {components,landedCost:cost,sellTotal:sell,unitSell:money(sell).div(lines[i].quantity).toFixed(4)};
 });
 return {costs,costReference,observedAt,validUntil,commercialAssumptions:{productOptionsConfirmed:true,availabilityConfirmed:true,deliveryConfirmed:true,deliveryNote,taxTreatment:'EXCLUDED',taxNote:'Sales tax is excluded from this quote and will be determined separately before invoicing.',freightIncluded:true}};
}
