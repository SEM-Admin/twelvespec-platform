import {describe,it,expect} from 'vitest';
import {priceForTargetMargin,grossMargin,landedCost,tierCost,termsForOrder,profitability,type Components} from '../../packages/pricing/src/index';
const components:Components={material_cost:'60.0000',decoration_run_cost:'5.00',setup:'10.00',prepress:'0.00',outsourced_labor:'2.00',packaging:'3.00',allocated_freight:'10.00',other_direct_cost:'0.00'};
describe('component pricing contract',()=>{
 it('uses gross margin rather than markup, with Decimal round half up',()=>{expect(priceForTargetMargin('60','.40')).toBe('100.00');expect(grossMargin('60','100')).toBe('0.40000000');expect(priceForTargetMargin('0.03','.40')).toBe('0.05');});
 it('requires every landed cost component and refuses negative or nonfinite money',()=>{expect(landedCost(components)).toBe('90.00');expect(()=>landedCost({...components,allocated_freight:null})).toThrow('MISSING_ALLOCATED_FREIGHT');for(const v of [-1,'NaN','Infinity',null])expect(()=>priceForTargetMargin(v)).toThrow();});
 it('rejects invalid margin and zero sale',()=>{for(const m of ['1','1.1','-.1','NaN'])expect(()=>priceForTargetMargin('1',m)).toThrow();expect(()=>grossMargin('1','0')).toThrow();});
 it('applies quantity tiers and rejects below MOQ or duplicate tiers',()=>{const b=[{minimum:12,cost:'6'},{minimum:100,cost:'5.4'}];expect(tierCost(b,99)).toBe('6.00');expect(tierCost(b,100)).toBe('5.40');expect(()=>tierCost(b,1)).toThrow('MOQ_NOT_MET');expect(()=>tierCost([...b,{minimum:100,cost:'3'}],100)).toThrow('INVALID_PRICE_BREAKS');});
 it('keeps first two orders prepaid and later credit explicitly approved',()=>{expect(termsForOrder(0,true)).toBe('PREPAID');expect(termsForOrder(1,true)).toBe('PREPAID');expect(termsForOrder(2,false)).toBe('PREPAID');expect(termsForOrder(2,true)).toBe('NET_15');});
 it('computes actual margin/profit per owner hour and does not invent denominator',()=>{expect(profitability('100','60','70','2')).toMatchObject({grossProfit:'30.00',variance:'10.00',profitPerOwnerHour:'15.00'});expect(profitability('100','60','70','0').profitPerOwnerHour).toBeNull();});
});
