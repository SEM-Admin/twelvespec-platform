import {describe,it,expect} from 'vitest';
import {ensureDispatchReady} from '../../packages/orders/src/index';
import {type Actor,type Tx,type Row} from '../../packages/kernel/src/index';
const actor={userId:'owner',tenantId:'tenant',workspaceId:'workspace',role:'owner'} as Actor;
const order={id:'order',data:{terms:'PREPAID',paymentStatus:'SETTLED',lines:[{method:'screen_print',designVersionId:'version-1'}]}} as unknown as Row;
function artState(proofStatus:string,preflightStatus:string){return {query:async(sql:string)=>({rows:sql.includes('app.proofs')?[{version_id:'version-1',status:proofStatus}]:sql.includes('app.preflight_results')?[{version_id:'version-1',status:preflightStatus}]:[]})} as unknown as Tx;}
describe('production dispatch gates',()=>{
 it('keeps failed-DPI preflight blocked even after visual proof approval',async()=>{await expect(ensureDispatchReady(artState('APPROVED','BLOCKED'),actor,order)).rejects.toThrow('PRODUCTION_PREFLIGHT_REQUIRED');});
 it('invalidates dispatch permission when an art revision supersedes its proof',async()=>{await expect(ensureDispatchReady(artState('SUPERSEDED','PASSED'),actor,order)).rejects.toThrow('PROOF_APPROVAL_REQUIRED');});
 it('requires prepaid reconciliation independently of artwork approval',async()=>{await expect(ensureDispatchReady(artState('APPROVED','PASSED'),actor,{...order,data:{...order.data,paymentStatus:'PENDING'}})).rejects.toThrow('PREPAYMENT_NOT_RECONCILED');});
});
