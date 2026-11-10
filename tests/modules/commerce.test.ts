import {describe,it,expect} from 'vitest';
import {safeLines} from '../../packages/sales/src/index';
import {authorize,type Actor} from '../../packages/kernel/src/index';
const customer={userId:'customer',tenantId:'tenant',workspaceId:'workspace',role:'customer'} as Actor;
describe('customer commerce boundary',()=>{
 it('discards forged sell prices, wholesale costs and source metadata in submitted cart lines',()=>{const [line]=safeLines([{productId:'product',variantId:'variant',quantity:24,method:'screen_print',location:'front',sellTotal:'0.01',landedCost:'0',supplierName:'stolen',sourceEvidence:{trusted:true}}]);expect(line).toEqual({productId:'product',variantId:'variant',quantity:24,method:'screen_print',location:'front'});});
 it('does not let customer cost or issue its own quote or approve financial activity',()=>{expect(()=>authorize(customer,'sales','cost_quote')).toThrow('PERMISSION_DENIED');expect(()=>authorize(customer,'sales','issue_quote')).toThrow('PERMISSION_DENIED');expect(()=>authorize(customer,'finance','reconcile_mock_payment')).toThrow('PERMISSION_DENIED');expect(()=>authorize(customer,'sales','accept_quote')).not.toThrow();});
});
