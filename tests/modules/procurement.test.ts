import {describe,it,expect} from 'vitest';
import {canSubmitPurchaseOrder,PO_GRAPH} from '../../packages/procurement/src/index';
import {transition} from '../../packages/kernel/src/index';
describe('supplier purchase state contract',()=>{
 it('only authorized purchase can submit',()=>{for(const state of ['DRAFT','APPROVAL_PENDING','SUBMITTING','UNKNOWN_OUTCOME','ACKNOWLEDGED'])expect(canSubmitPurchaseOrder(state)).toBe(false);expect(canSubmitPurchaseOrder('AUTHORIZED')).toBe(true);});
 it('does not blind retry uncertain writes',()=>{expect(()=>transition('UNKNOWN_OUTCOME','SUBMITTING',PO_GRAPH)).toThrow('INVALID_TRANSITION');expect(()=>transition('SUBMITTING','UNKNOWN_OUTCOME',PO_GRAPH)).not.toThrow();});
});
