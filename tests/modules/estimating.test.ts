import {describe,it,expect} from 'vitest';
import {landedCost,priceForTargetMargin,grossMargin,type Components} from '../../packages/pricing/src/index';
describe('estimate completeness',()=>{it('includes setup, outsourced labor and freight before computing margin',()=>{const d:Components={material_cost:'60',decoration_run_cost:'10',setup:'20',prepress:'5',outsourced_labor:'15',packaging:'5',allocated_freight:'5',other_direct_cost:'0'};const cost=landedCost(d);expect(cost).toBe('120.00');expect(priceForTargetMargin(cost,'.40')).toBe('200.00');expect(grossMargin(cost,'160')).toBe('0.25000000');expect(()=>landedCost({...d,allocated_freight:null})).toThrow();});});

import {costLine,type ConfigLine} from '../../packages/sales/src/index';
import {type Tx,type Actor,type Row} from '../../packages/kernel/src/index';
const actor={userId:'owner',tenantId:'tenant',workspaceId:'workspace',role:'owner'} as Actor;
const config:ConfigLine={productId:'product',quantity:24,method:'screen_print',location:'front'};
function costFixture(overrides:Record<string,unknown>={},productOverrides:Record<string,unknown>={}){
 const now=new Date().toISOString();const product={id:'product',status:'PUBLISHED',title:'Hat',revision:1,data:{minimumQuantity:12,methods:['screen_print'],locations:['front'],...productOverrides}} as unknown as Row;
 const offer={id:'offer',status:'ACTIVE',product_id:'product',updated_at:now,data:{unitCost:'6.00',currency:'USD',minimumQuantity:12,priceBreaks:[{quantity:12,unitCost:'6.00'},{quantity:100,unitCost:'5.00'}],decorationCost:'1.00',setupCost:'10.00',freight:'15.00',observedAt:now,validUntil:new Date(Date.now()+3600000).toISOString(),verification:'MOCKED',...overrides}} as unknown as Row;
 return {query:async(sql:string)=>({rows:sql.includes('app.products')?[product]:sql.includes('app.supplier_offers')?[offer]:[]})} as unknown as Tx;
}
describe('server quote evidence gates',()=>{
 it('never converts missing freight or ambiguous currency to a price',async()=>{await expect(costLine(costFixture({freight:undefined}),actor,config,undefined,'.40')).rejects.toThrow('MISSING_ALLOCATED_FREIGHT');await expect(costLine(costFixture({currency:undefined}),actor,config,undefined,'.40')).rejects.toThrow('CURRENCY_REQUIRED');});
 it('recalculates quantity breaks and blocks option-rule bypass',async()=>{const quote=await costLine(costFixture(),actor,{...config,quantity:100},undefined,'.40');expect(quote.components.material_cost).toBe('500.00');await expect(costLine(costFixture(),actor,{...config,method:'embroidery'},undefined,'.40')).rejects.toThrow('DECORATION_INCOMPATIBLE');});
 it('rejects stale supplier prices rather than quoting last supplier success',async()=>{await expect(costLine(costFixture({observedAt:new Date(Date.now()-25*3600000).toISOString()}),actor,config,undefined,'.40')).rejects.toThrow('STALE_COST');});
});
