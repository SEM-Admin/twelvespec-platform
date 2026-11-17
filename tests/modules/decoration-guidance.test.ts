import {describe,it,expect} from 'vitest';
import {readDecorationGuidance} from '../../packages/catalog/src/decoration-guidance';

describe('complete owner decoration research, separate from sellable SKU methods',()=>{
 it('retains all families/methods/references with explicit unverified, nonselectable status',()=>{
  const result=readDecorationGuidance({});expect(result).toMatchObject({familyCount:106,methodCount:54,sourceCount:24,status:'PRIVATE_REFERENCE_ONLY',automaticCatalogWrites:0,automaticPublications:0});expect(result.categories).toHaveLength(9);expect(result.methods).toHaveLength(54);
  expect(result.families).toHaveLength(10);for(const row of result.families){expect(row.skuVerified).toBe(false);expect(row.availableForSelection).toBe(false);expect(row.verification).toBe('CATEGORY_GUIDANCE_ONLY');}
  for(const method of result.methods)expect(method.availableForSelection).toBe(false);
 });
 it('pages through every family exactly once and resolves all suggested methods and references',()=>{
  const first=readDecorationGuidance({}),seen=new Set<string>(),methods=new Set(first.methods.map(m=>m.id));
  for(let page=1;page<=first.totalPages;page++)for(const family of readDecorationGuidance({page}).families){expect(seen.has(family.referenceId)).toBe(false);seen.add(family.referenceId);for(const id of [...family.suggested,...family.alternatives,...family.premium])expect(methods.has(id)).toBe(true);for(const source of family.sources)expect(new URL(source.url).protocol).toBe('https:');}
  expect(seen.size).toBe(106);expect(readDecorationGuidance({page:100}).families).toEqual([]);
 });
 it('searches materials/method descriptions and combines category and method filters without guessing compatibility',()=>{
  const nylon=readDecorationGuidance({search:'nylon',category:'Apparel & uniforms'});expect(nylon.total).toBeGreaterThan(0);expect(nylon.families.some(f=>f.watchOut.includes('Waterproof'))).toBe(true);
  const puff=readDecorationGuidance({category:'Headwear',methodId:'EMB_PUFF'});expect(puff.total).toBeGreaterThan(0);expect(puff.families.every(f=>f.category==='Headwear'&&[...f.suggested,...f.alternatives,...f.premium].includes('EMB_PUFF'))).toBe(true);
  expect(readDecorationGuidance({search:'does-not-exist-'+crypto.randomUUID()}).total).toBe(0);
 });
 it('rejects publication flags, supplier credentials, scope injection and invalid paging or taxonomy filters',()=>{
  for(const query of [{page:0},{pageSize:21},{search:'x'.repeat(201)},{publish:true},{skuVerified:true},{tenantId:'forged'},{apiKey:'not-a-real-key'}])expect(()=>readDecorationGuidance(query)).toThrow('DECORATION_GUIDANCE_QUERY_INVALID');
  expect(()=>readDecorationGuidance({methodId:'embroidery'})).toThrow('DECORATION_GUIDANCE_METHOD_UNKNOWN');expect(()=>readDecorationGuidance({category:'invalid'})).toThrow('DECORATION_GUIDANCE_CATEGORY_UNKNOWN');
 });
});
