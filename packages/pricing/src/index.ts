import Decimal from 'decimal.js';
import { fail } from '../../kernel/src/index';
export type Money=string;
export const COST_COMPONENTS=['material_cost','decoration_run_cost','setup','prepress','outsourced_labor','packaging','allocated_freight','other_direct_cost'] as const;
export type CostComponent=typeof COST_COMPONENTS[number];
export type Components=Record<CostComponent,Money|null>;
export function money(value:unknown):Decimal{
 if(typeof value!=='string'&&typeof value!=='number')return fail('MISSING_COST');
 let d:Decimal;try{d=new Decimal(value);}catch{return fail('INVALID_MONEY',400);}
 if(!d.isFinite()||d.isNegative()||d.decimalPlaces()>4||d.greaterThan('99999999999999'))return fail('INVALID_MONEY',400);return d;
}
export const amount=(value:Decimal.Value)=>new Decimal(value).toFixed(2,Decimal.ROUND_HALF_UP);
export function priceForTargetMargin(cost:unknown,margin:unknown='0.40'):Money{
 const c=money(cost);let m:Decimal;try{m=new Decimal(String(margin));}catch{return fail('INVALID_MARGIN',400);}
 if(!m.isFinite()||m.lessThan(0)||m.greaterThanOrEqualTo(1))return fail('INVALID_MARGIN',400);
 return amount(c.div(new Decimal(1).minus(m)));
}
export function grossMargin(cost:unknown,sell:unknown):string{const c=money(cost),s=money(sell);if(s.isZero())return fail('SALE_MUST_BE_POSITIVE');return s.minus(c).div(s).toFixed(8);}
export function landedCost(components:Components):Money{
 let sum=new Decimal(0);for(const name of COST_COMPONENTS){if(components[name]===null||components[name]===undefined)return fail('MISSING_'+name.toUpperCase());sum=sum.plus(money(components[name]));}return amount(sum);
}
export function tierCost(breaks:Array<{minimum:number;cost:string}>,quantity:number):Money{
 if(!Number.isSafeInteger(quantity)||quantity<1)return fail('INVALID_QUANTITY',400);
 if(!breaks.length)return fail('MISSING_PRICE_BREAKS');
 const sorted=[...breaks].sort((a,b)=>a.minimum-b.minimum);let previous=0;
 for(const b of sorted){if(!Number.isSafeInteger(b.minimum)||b.minimum<=previous)return fail('INVALID_PRICE_BREAKS');money(b.cost);previous=b.minimum;}
 const applicable=sorted.filter(x=>x.minimum<=quantity).at(-1);if(!applicable)return fail('MOQ_NOT_MET');return amount(applicable.cost);
}
export function termsForOrder(orderCount:number,approvedCredit:boolean):'PREPAID'|'NET_15'{return orderCount>=2&&approvedCredit?'NET_15':'PREPAID';}
export function profitability(revenue:string,estimatedCost:string,actualCost:string,ownerHours:string){
 const rev=money(revenue),estimate=money(estimatedCost),actual=money(actualCost),hours=money(ownerHours);
 return {revenue:amount(rev),estimatedCost:amount(estimate),actualCost:amount(actual),variance:amount(actual.minus(estimate)),grossProfit:amount(rev.minus(actual)),grossMargin:rev.isZero()?null:rev.minus(actual).div(rev).toFixed(8),ownerHours:hours.toFixed(2),profitPerOwnerHour:hours.isZero()?null:amount(rev.minus(actual).div(hours))};
}
