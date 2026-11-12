import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {actors} from '../helpers';
import {transaction,pool,create,hash,type Actor,type Input} from '../../packages/kernel/src';
import {registerEvidenceSource} from '../../packages/intelligence/src';
import {evidenceLibrary,evidenceOptions} from '../../packages/intelligence/src/library';
import {handleSupplier} from '../../packages/supplier/src';
import {handleSales} from '../../packages/sales/src';
let owner:Actor,customer:Actor,otherOwner:Actor;
beforeAll(async()=>({owner,customer,otherOwner}=await actors()));afterAll(async()=>{await pool().end();});
describe('private evidence discovery without capped hidden records',()=>{
 it('paginates and counts source history across editions and excludes other workspaces',async()=>{
  const prefix='SYNTHETIC-LIB-'+randomUUID();
  await transaction(owner,async tx=>{for(let i=0;i<23;i++)await registerEvidenceSource(tx,owner,{sourceKey:randomUUID(),title:prefix+String(i).padStart(2,'0'),publisher:'Synthetic fixtures',edition:'2026',contentHash:hash('SYNTHETIC SOURCE'),origin:'SYNTHETIC',rightsReference:'Test only',allowedUses:['INTERNAL_RESEARCH'],rightsValidFrom:new Date(Date.now()-3600000).toISOString(),rightsValidUntil:new Date(Date.now()+86400000).toISOString(),retentionUntil:new Date(Date.now()+2*86400000).toISOString(),parserVersion:'test/1'});});
  const first=await transaction(owner,tx=>handleSupplier(tx,owner,'evidence_library',{kind:'sources',search:prefix,page:1})) as {rows:Input[];total:number;totalPages:number};
  const second=await transaction(owner,tx=>evidenceLibrary(tx,owner,{kind:'sources',search:prefix,page:2}));
  expect(first.total).toBe(23);expect(first.totalPages).toBe(2);expect(first.rows).toHaveLength(20);expect(second.rows).toHaveLength(3);expect(new Set([...first.rows,...second.rows].map(r=>r.id)).size).toBe(23);
  expect((await transaction(otherOwner,tx=>evidenceLibrary(tx,otherOwner,{kind:'sources',search:prefix}))).rows).toEqual([]);
  await expect(transaction(customer,tx=>handleSupplier(tx,customer,'evidence_library',{kind:'sources'}))).rejects.toThrow('PERMISSION_DENIED');
  await expect(transaction(customer,tx=>handleSales(tx,customer,'price_evidence_library',{}))).rejects.toThrow('PERMISSION_DENIED');
 });
 it('searches and pages product, variant and account selectors rather than omitting later records',async()=>{
  const prefix='SYNTHETIC-PICKER-'+randomUUID();
  const product=await transaction(owner,async tx=>{
   const p=await create(tx,owner,'products',{title:prefix+'00',data:{synthetic:true}});
   for(let i=0;i<53;i++){
    const label=prefix+String(i).padStart(2,'0');
    if(i)await create(tx,owner,'products',{title:label,data:{synthetic:true}});
    await create(tx,owner,'variants',{title:label,product_id:p.id,data:{color:label,size:'Synthetic'}});
    await create(tx,owner,'accounts',{title:label,data:{synthetic:true}});
   }return p;
  });
  const result=await transaction(owner,tx=>evidenceOptions(tx,owner,{search:prefix,page:2,productId:product.id,variantSearch:prefix,variantPage:2,accountSearch:prefix,accountPage:2}));
  expect(result.total).toBe(53);expect(result.products).toHaveLength(3);expect(result.variantTotal).toBe(53);expect(result.variants).toHaveLength(3);expect(result.accountTotal).toBe(53);expect(result.accounts).toHaveLength(3);
  expect(result.products.every(p=>String(p.title).startsWith(prefix))).toBe(true);
  await expect(transaction(customer,tx=>evidenceOptions(tx,customer,{}))).rejects.toThrow('EVIDENCE_ACCESS_DENIED');
  await expect(transaction(owner,tx=>evidenceOptions(tx,owner,{page:-1}))).rejects.toThrow('EVIDENCE_QUERY_INVALID');
 });
});
