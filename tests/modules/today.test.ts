import {describe,it,expect} from 'vitest';
import {rankExceptions,handleToday} from '../../packages/today/src/index';
import type {Actor,Tx} from '../../packages/kernel/src/index';
describe('Today contracts',()=>{
 it('orders operator exceptions by severity then deadline',()=>{const rows=rankExceptions([{severity:'LOW',dueAt:'2026-01-01'},{severity:'CRITICAL',dueAt:'2026-12-01'},{severity:'CRITICAL',dueAt:'2026-11-01'}]);expect(rows[0].dueAt).toBe('2026-11-01');expect(rows[2].severity).toBe('LOW');});
 it('does not permit a customer to alter operator tasks',async()=>{await expect(handleToday({} as Tx,{role:'customer'} as Actor,'create_task',{title:'Task'})).rejects.toThrow('PERMISSION_DENIED');});
});
