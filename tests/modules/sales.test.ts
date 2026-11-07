import {describe,it,expect} from 'vitest';
import {safeLines,publicQuote,publicOrder,QUOTE_GRAPH} from '../../packages/sales/src/index';
import {transition,type Row} from '../../packages/kernel/src/index';
const row={id:'quote-1',title:'Hat',status:'ISSUED',revision:3,created_at:'2026-11-05',data:{total:'100',landedCost:'60',margin:'.4',lines:[{productId:'1',quantity:12,title:'Hat',sellTotal:'100',components:{material_cost:'60'},sourceEvidence:{supplierName:'PRIVATE',cost:'60'},sourceSku:'PRIVATE-SKU'}]}} as unknown as Row;
describe('sales security and state contracts',()=>{
 it('rejects fractional quantities and malformed line batches',()=>{expect(()=>safeLines([{productId:'one',quantity:1.2}])).toThrow('INVALID_QUANTITY');expect(()=>safeLines([])).toThrow('LINES_REQUIRED');});
 it('strips every private supplier and cost field in customer quote/order projections',()=>{for(const projection of [publicQuote(row),publicOrder(row)]){const json=JSON.stringify(projection);for(const privateValue of ['PRIVATE','landedCost','components','margin','sourceSku','sourceEvidence'])expect(json).not.toContain(privateValue);expect(json).toContain('sellTotal');}});
 it('allows acceptance only from issued states',()=>{expect(()=>transition('DRAFT','ACCEPTED',QUOTE_GRAPH)).toThrow('INVALID_TRANSITION');expect(()=>transition('ISSUED','ACCEPTED',QUOTE_GRAPH)).not.toThrow();});
});
