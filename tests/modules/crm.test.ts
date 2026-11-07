import {describe,it,expect} from 'vitest';
import {validEmail,leadTransitions,handleCrm} from '../../packages/crm/src/index';
import {transition,type Actor,type Tx} from '../../packages/kernel/src/index';
const customer:Actor={userId:'u',tenantId:'t',workspaceId:'w',role:'customer'};
describe('CRM contracts',()=>{
 it('normalizes a contact email and rejects control/invalid addresses',()=>{expect(validEmail('Ada@Example.test')).toBe('ada@example.test');for(const value of ['bad','a@b','a b@example.test','a\n@example.test'])expect(()=>validEmail(value)).toThrow();});
 it('only permits explicit lead state progression',()=>{expect(()=>transition('NEW','QUALIFIED',leadTransitions)).not.toThrow();expect(()=>transition('NEW','WON',leadTransitions)).toThrow('INVALID_TRANSITION');expect(()=>transition('WON','NEW',leadTransitions)).toThrow();});
 it('denies customer contact administration before touching a database',async()=>{await expect(handleCrm({} as Tx,customer,'create_contact',{name:'Private',email:'p@example.test'})).rejects.toThrow('PERMISSION_DENIED');});
});
