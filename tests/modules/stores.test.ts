import {describe,it,expect} from 'vitest';
import {validateStorePolicy,STORE_TYPES,handleStores} from '../../packages/stores/src/index';
import type {Actor,Tx} from '../../packages/kernel/src/index';
const policy={startsAt:'2026-11-01T00:00:00.000Z',closesAt:'2026-11-10T00:00:00.000Z',brandKitId:'kit-a',fundraisingPercent:'15',approvalRequired:true};
const buyer={eligible:true},budget={limit:'100.00',spent:'10.00',reserved:'5.00'},request={amount:'20.00',brandKitId:'kit-a'},now=new Date('2026-11-05T00:00:00Z');
describe('Company and school store policy',()=>{
 it('supports the complete program type registry',()=>expect(STORE_TYPES).toEqual(['CORPORATE_ON_GOING','POPUP','SCHOOL','FUNDRAISER','REDEMPTION','EVENT']));
 it('computes allowance remaining and fundraiser allocation with decimal arithmetic',()=>expect(validateStorePolicy(policy,buyer,budget,request,now)).toMatchObject({remaining:'65.00',fundraisingAllocation:'3.00',approvalRequired:true}));
 it('rejects invalid campaign dates rather than bypassing the deadline',()=>expect(()=>validateStorePolicy({...policy,closesAt:'invalid'},buyer,budget,request,now)).toThrow('INVALID_CAMPAIGN_WINDOW'));
 it('rejects an ineligible buyer',()=>expect(()=>validateStorePolicy(policy,{eligible:false},budget,request,now)).toThrow('STORE_BUYER_NOT_ELIGIBLE'));
 it('rejects overspending including existing reservations',()=>expect(()=>validateStorePolicy(policy,buyer,budget,{...request,amount:'85.01'},now)).toThrow('STORE_BUDGET_EXCEEDED'));
 it('enforces the campaign cutoff exactly at closing time',()=>expect(()=>validateStorePolicy(policy,buyer,budget,request,new Date('2026-11-10T00:00:00Z'))).toThrow('CAMPAIGN_CLOSED'));
 it('enforces the opening time and brand kit',()=>{expect(()=>validateStorePolicy(policy,buyer,budget,request,new Date('2026-10-31'))).toThrow('CAMPAIGN_NOT_STARTED');expect(()=>validateStorePolicy(policy,buyer,budget,{...request,brandKitId:'other'},now)).toThrow('STORE_BRAND_KIT_REQUIRED');});
 it('prevents customer store policy creation even with module access',async()=>{await expect(handleStores({} as Tx,{role:'customer'} as Actor,'create',{name:'Escalation',type:'SCHOOL'})).rejects.toThrow('STORE_ADMIN_REQUIRED');});
});
