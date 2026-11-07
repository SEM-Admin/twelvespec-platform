import {describe,it,expect} from 'vitest';
import {validateRoleChange,handleFoundation} from '../../packages/foundation/src/index';
import type {Actor,Tx} from '../../packages/kernel/src/index';
describe('Administration authority',()=>{
 it('preserves at least one owner and prevents accidental self demotion',()=>{expect(()=>validateRoleChange('owner','staff',1,false)).toThrow('LAST_OWNER_CANNOT_BE_REMOVED');expect(()=>validateRoleChange('owner','staff',2,true)).toThrow('SELF_DEMOTION_REQUIRES_ANOTHER_OWNER');expect(validateRoleChange('staff','sales',1,false)).toBe('sales');});
 it('does not accept invented roles or customer authority',async()=>{expect(()=>validateRoleChange('staff','superadmin',2,false)).toThrow('INVALID_ROLE');await expect(handleFoundation({} as Tx,{role:'customer'} as Actor,'set_member_role',{role:'owner'})).rejects.toThrow('PERMISSION_DENIED');});
 it('rejects activation of future modules from the backend',async()=>{await expect(handleFoundation({} as Tx,{role:'owner'} as Actor,'enable_future',{})).rejects.toThrow('FEATURE_NOT_ACTIVE');});
});
