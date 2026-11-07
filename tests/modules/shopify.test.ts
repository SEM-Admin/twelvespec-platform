import {describe,it,expect,vi} from 'vitest';
import {ShopifyReadOnlyAdapter,shopifyDomain,shopifySource,shopifyDemoSources,SHOPIFY_API_VERSION,SHOPIFY_OPERATIONS} from '../../packages/providers/src/shopify';
import {normalizeCatalogSource} from '../../packages/catalog/src/sources';

const domain='twelvespec-example.myshopify.com',token='synthetic-test-only-admin-token';
const identity={shop:{id:'gid://shopify/Shop/123',name:'Synthetic shop',myshopifyDomain:domain,currencyCode:'USD'},currentAppInstallation:{accessScopes:[{handle:'read_products'}]}};
const product={id:'gid://shopify/Product/100',title:'Example tee',vendor:'Example brand',status:'ACTIVE',featuredMedia:{image:{url:'https://cdn.shopify.com/s/files/blank.jpg?v=123',altText:'Example'}},price:'19.99',cost:'9',credential:'PRIVATE'};
function response(data:unknown,version=SHOPIFY_API_VERSION){return Response.json({data},{headers:{'x-shopify-api-version':version}});}
const client=(transport:typeof fetch)=>new ShopifyReadOnlyAdapter({shopDomain:domain,accessToken:token,approvedDevelopmentStore:true,transport});

describe('Shopify read-only channel contract',()=>{
 it('accepts exact myshopify.com domains without arbitrary hosts, paths or credentials',()=>{
  expect(shopifyDomain(' EXAMPLE.myshopify.com ')).toBe('example.myshopify.com');
  for(const invalid of ['https://example.myshopify.com','example.myshopify.com.evil.test','localhost','127.0.0.1','example.myshopify.com/path','x@y.myshopify.com','a.b.myshopify.com','-a.myshopify.com','a.myshopify.com:443'])expect(()=>shopifyDomain(invalid)).toThrow('SHOPIFY_DOMAIN_INVALID');
 });
 it('has fixed query operations and never reads retail prices, customer data or payments',()=>{
  for(const operation of Object.values(SHOPIFY_OPERATIONS)){expect(operation.trim()).toMatch(/^query /);expect(operation).not.toMatch(/mutation|orders|customers|payments|\bprice\b|\bcost\b/);}
 });
 it('keeps source media unlicensed and commercial facts unknown',()=>{
  const source=normalizeCatalogSource(shopifySource(domain,product,'STAGING'));
  expect(source.environment).toBe('STAGING');expect(source.imageUrl).toBe('https://cdn.shopify.com/s/files/blank.jpg');expect(source.pricingCoverage).toBe('UNVERIFIED');expect(source.rightsStatus).toBe('UNREVIEWED');expect(source).not.toHaveProperty('price');expect(source).not.toHaveProperty('cost');expect(source).not.toHaveProperty('credential');
  expect(shopifyDemoSources(domain).every(s=>s.environment==='SYNTHETIC')).toBe(true);
  expect(()=>shopifySource(domain,{...product,featuredMedia:{image:{url:'https://evil.test/image'}}},'STAGING')).toThrow('SHOPIFY_MEDIA_REFERENCE_INVALID');
 });
 it('requires development authorization, identity and granted product scopes before catalog reads',async()=>{
  expect(()=>new ShopifyReadOnlyAdapter({shopDomain:domain,accessToken:token,approvedDevelopmentStore:false})).toThrow('SHOPIFY_DEVELOPMENT_AUTHORIZATION_REQUIRED');
  const transport=vi.fn(async()=>response(identity)),adapter=client(transport);
  await expect(adapter.catalogPage()).rejects.toThrow('SHOPIFY_IDENTITY_REQUIRED');expect(transport).not.toHaveBeenCalled();
  const wrong=client(async()=>response({...identity,shop:{...identity.shop,myshopifyDomain:'different.myshopify.com'}}));await expect(wrong.identity()).rejects.toThrow('SHOPIFY_STORE_IDENTITY_MISMATCH');
  const denied=client(async()=>response({...identity,currentAppInstallation:{accessScopes:[]}}));await expect(denied.identity()).rejects.toThrow('SHOPIFY_SCOPES_MISSING');
 });
 it('uses the official client with exact endpoint, no redirect/retry and explicit cursors',async()=>{
  const transport=vi.fn(async(_url:RequestInfo|URL,init?:RequestInit)=>{const body=JSON.parse(String(init?.body));return response(body.query.includes('ShopIdentity')?identity:{products:{nodes:[product],pageInfo:{hasNextPage:true,endCursor:'next-page'}}});});
  const adapter=client(transport);expect((await adapter.identity()).domain).toBe(domain);const page=await adapter.catalogPage(20,'previous-page');expect(page.products[0].externalId).toBe(product.id);expect(page.pageInfo).toEqual({hasNextPage:true,endCursor:'next-page'});
  const [url,options]=transport.mock.calls[1];expect(String(url)).toBe(`https://${domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`);expect(options?.redirect).toBe('manual');expect(JSON.parse(String(options?.body)).variables).toEqual({first:20,after:'previous-page'});expect(JSON.stringify(adapter)).not.toContain(token);
  await expect(adapter.catalogPage(101)).rejects.toThrow('SHOPIFY_PAGINATION_INVALID');
 });
 it('retains exact variant identity/options independently of product paging',async()=>{
  const adapter=client(async(_url,init)=>{const body=JSON.parse(String(init?.body));return response(body.query.includes('ShopIdentity')?identity:{product:{id:product.id,variants:{nodes:[{id:'gid://shopify/ProductVariant/500',sku:'TEE-NV-M',selectedOptions:[{name:'Color',value:'Navy'},{name:'Size',value:'M'}],image:null}],pageInfo:{hasNextPage:false,endCursor:null}}}});});
  await adapter.identity();const page=await adapter.variantPage(product.id);expect(page.variants[0].selectedOptions).toEqual([{name:'Color',value:'Navy'},{name:'Size',value:'M'}]);expect(page.variants[0].id).toBe('gid://shopify/ProductVariant/500');expect(page.variants[0]).not.toHaveProperty('price');
 });
 it('rejects redirect, throttling, API fall-forward and GraphQL errors without revealing secrets',async()=>{
  for(const transport of [async()=>new Response(null,{status:302,headers:{location:'https://evil.test'}}),async()=>new Response(null,{status:429}),async()=>response(identity,'2026-07'),async()=>Response.json({errors:[{message:'PRIVATE '+token}]},{headers:{'x-shopify-api-version':SHOPIFY_API_VERSION}})]){
   const adapter=client(transport);let message='';try{await adapter.identity();}catch(e){message=(e as Error).message;}
   expect(message).toBe('SHOPIFY_READ_FAILED');expect(message).not.toContain(token);
  }
 });
 it('refuses an incomplete page rather than silently treating it as a complete catalog',async()=>{
  const adapter=client(async(_url,init)=>response(JSON.parse(String(init?.body)).query.includes('ShopIdentity')?identity:{products:{nodes:[product],pageInfo:{hasNextPage:true,endCursor:null}}}));await adapter.identity();await expect(adapter.catalogPage()).rejects.toThrow('SHOPIFY_CURSOR_INVALID');
 });
});
