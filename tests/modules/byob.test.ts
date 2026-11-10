import {describe,it,expect} from 'vitest';
import {priceBundle,handleByob} from '../../packages/byob/src/index';
import type {Actor,Tx} from '../../packages/kernel/src/index';
describe('BYOB component and kitting costs',()=>{
 it('retains individual component quantities and per-kit packaging/assembly',()=>expect(priceBundle([{quantity:2,unitCost:'4.50'},{quantity:1,unitCost:'6.00'}],'2.00','1.00',10)).toMatchObject({landedCost:'180.00',packagingAndAssembly:'30.00',estimatedTotal:'300.00',quoteOnly:true}));
 it('never interprets unknown component costs as zero',()=>expect(()=>priceBundle([{quantity:1,unitCost:null}],'0','0',1)).toThrow('BUNDLE_COST_UNKNOWN'));
 it('validates component MOQ over the total kit quantity',()=>{expect(()=>priceBundle([{quantity:2,unitCost:'1',moq:25}],'0','0',10)).toThrow('BUNDLE_COMPONENT_MOQ');expect(priceBundle([{quantity:2,unitCost:'1',moq:20}],'0','0',10).landedCost).toBe('20.00');});
 it('rejects unavailable parts and fractional kit quantities',()=>{expect(()=>priceBundle([{quantity:1,unitCost:'1',available:false}],'0','0',1)).toThrow('BUNDLE_COMPONENT_UNAVAILABLE');expect(()=>priceBundle([{quantity:1,unitCost:'1'}],'0','0',1.5)).toThrow('INVALID_KIT_QUANTITY');});
 it('rejects invalid target margin and negative packaging',()=>{expect(()=>priceBundle([{quantity:1,unitCost:'1'}],'0','0',1,'1')).toThrow('INVALID_MARGIN');expect(()=>priceBundle([{quantity:1,unitCost:'1'}],'-1','0',1)).toThrow();});
 it('does not allow customers to edit reusable bundle templates',async()=>await expect(handleByob({} as Tx,{role:'customer'} as Actor,'create',{name:'Unsafe'})).rejects.toThrow('BUNDLE_ADMIN_REQUIRED'));
});
