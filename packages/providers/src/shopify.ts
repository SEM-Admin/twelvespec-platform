/** Server-only, read-only channel adapter. No merchant credentials belong in client bundles. */
import {createAdminApiClient,type AdminApiClient} from '@shopify/admin-api-client';
import {fail,type Input} from '../../kernel/src';

import {SHOPIFY_API_VERSION} from '../../contracts/src/shopify';
export {SHOPIFY_API_VERSION,SHOPIFY_SCOPES,SHOPIFY_ACTIVATION_REQUIREMENTS} from '../../contracts/src/shopify';
export const SHOPIFY_OPERATIONS={
 identity:`query TwelveSpecShopIdentity {
  shop { id name myshopifyDomain currencyCode }
  currentAppInstallation { accessScopes { handle } }
 }`,
 catalog:`query TwelveSpecShopCatalog($first: Int!, $after: String) {
  products(first: $first, after: $after, sortKey: ID) {
   nodes { id title vendor status featuredMedia { ... on MediaImage { image { url altText } } } }
   pageInfo { hasNextPage endCursor }
  }
 }`,
 variants:`query TwelveSpecShopVariants($id: ID!, $first: Int!, $after: String) {
  product(id: $id) { id variants(first: $first, after: $after) {
   nodes { id sku selectedOptions { name value } }
   pageInfo { hasNextPage endCursor }
  } }
 }`,
} as const;

export function shopifyDomain(value:unknown):string {
 if(typeof value!=='string')return fail('SHOPIFY_DOMAIN_INVALID',400);
 const domain=value.trim().toLowerCase();
 if(!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.myshopify\.com$/.test(domain))fail('SHOPIFY_DOMAIN_INVALID',400);
 return domain;
}
const object=(value:unknown):Input=>value&&typeof value==='object'&&!Array.isArray(value)?value as Input:fail('SHOPIFY_RESPONSE_INVALID',502);
const string=(value:unknown,max=500)=>typeof value==='string'&&value.length<=max?value:fail('SHOPIFY_RESPONSE_INVALID',502);
const gid=(value:unknown,type:'Product'|'ProductVariant')=>{const id=string(value,160);if(!new RegExp(`^gid://shopify/${type}/[0-9]+$`).test(id))fail('SHOPIFY_RESPONSE_INVALID',502);return id;};
function pagination(first:number,after?:string){if(!Number.isInteger(first)||first<1||first>100||after!==undefined&&(typeof after!=='string'||after.length>2048))fail('SHOPIFY_PAGINATION_INVALID',400);return {first,after:after??null};}
function pageInfo(value:unknown){const p=object(value);if(typeof p.hasNextPage!=='boolean'||p.endCursor!==null&&typeof p.endCursor!=='string'||p.hasNextPage&&!p.endCursor)fail('SHOPIFY_CURSOR_INVALID',502);return {hasNextPage:p.hasNextPage,endCursor:p.endCursor===null?null:string(p.endCursor,2048)};}
function imageReference(value:unknown,domain:string){if(value===null||value===undefined)return null;const raw=object(value),url=new URL(string(raw.url,2000));if(url.protocol!=='https:'||url.username||url.password||url.port||!['cdn.shopify.com',domain].includes(url.hostname))fail('SHOPIFY_MEDIA_REFERENCE_INVALID',502);url.search='';url.hash='';return url.toString();}

/** Exact-host, bounded transport; never follow a redirect with an Admin access token. */
function guardedFetch(domain:string,transport:typeof fetch):typeof fetch {
 const expected=`https://${domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
 return async(input,init)=>{
  if(String(input)!==expected||init?.method!=='POST')fail('SHOPIFY_REQUEST_NOT_ALLOWLISTED',400);
  let response:Response;
  try{response=await transport(input,{...init,redirect:'manual',signal:AbortSignal.timeout(15000)});}catch{return fail('SHOPIFY_TRANSPORT_FAILED',502);}
  if(!response.ok){await response.body?.cancel();fail(response.status===429?'SHOPIFY_RATE_LIMITED':response.status>=300&&response.status<400?'SHOPIFY_REDIRECT_BLOCKED':response.status===401||response.status===403?'SHOPIFY_AUTHORIZATION_FAILED':'SHOPIFY_HTTP_FAILED',502);}
  if(response.headers.get('x-shopify-api-version')!==SHOPIFY_API_VERSION){await response.body?.cancel();fail('SHOPIFY_API_VERSION_MISMATCH',502);}
  const reader=response.body?.getReader();if(!reader)fail('SHOPIFY_RESPONSE_INVALID',502);
  const chunks:Uint8Array[]=[];let bytes=0;
  try{for(;;){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>5*1024*1024){await reader.cancel();fail('SHOPIFY_RESPONSE_TOO_LARGE',502);}chunks.push(part.value);}}catch{return fail('SHOPIFY_RESPONSE_READ_FAILED',502);}
  return new Response(Buffer.concat(chunks),{status:200,headers:response.headers});
 };
}

export class ShopifyReadOnlyAdapter {
 readonly domain:string;
 readonly apiVersion=SHOPIFY_API_VERSION;
 #client:AdminApiClient;
 #identityVerified=false;
 constructor(input:{shopDomain:string;accessToken:string;approvedDevelopmentStore:boolean;transport?:typeof fetch}){
  if(input.approvedDevelopmentStore!==true)fail('SHOPIFY_DEVELOPMENT_AUTHORIZATION_REQUIRED',403);
  this.domain=shopifyDomain(input.shopDomain);
  if(!input.accessToken||input.accessToken.length>16384)fail('SHOPIFY_TOKEN_REQUIRED',400);
  this.#client=createAdminApiClient({storeDomain:this.domain,apiVersion:SHOPIFY_API_VERSION,accessToken:input.accessToken,retries:0,logger:()=>{},customFetchApi:guardedFetch(this.domain,input.transport??fetch)});
 }
 async #query(operation:string,variables:Input={}){
  try{const result=await this.#client.request(operation,{variables});if(result.errors||!result.data)fail('SHOPIFY_GRAPHQL_REJECTED',502);return object(result.data);}catch{return fail('SHOPIFY_READ_FAILED',502);}
 }
 async identity(){
  const data=await this.#query(SHOPIFY_OPERATIONS.identity),shop=object(data.shop),installation=object(data.currentAppInstallation);
  if(shopifyDomain(shop.myshopifyDomain)!==this.domain)fail('SHOPIFY_STORE_IDENTITY_MISMATCH',502);
  if(!Array.isArray(installation.accessScopes))fail('SHOPIFY_SCOPES_MISSING',403);
  const scopes=installation.accessScopes.map(s=>string(object(s).handle,100));
  if(!scopes.includes('read_products')&&!scopes.includes('write_products'))fail('SHOPIFY_SCOPES_MISSING',403);
  const currency=string(shop.currencyCode,3);if(!/^[A-Z]{3}$/.test(currency))fail('SHOPIFY_RESPONSE_INVALID',502);
  this.#identityVerified=true;return {id:string(shop.id,160),name:string(shop.name),domain:this.domain,currency,scopes,apiVersion:this.apiVersion,verification:'DEVELOPMENT_READ_ONLY'};
 }
 async catalogPage(first=50,after?:string){
  if(!this.#identityVerified)fail('SHOPIFY_IDENTITY_REQUIRED',403);
  const data=await this.#query(SHOPIFY_OPERATIONS.catalog,pagination(first,after)),products=object(data.products);
  if(!Array.isArray(products.nodes)||products.nodes.length>first)fail('SHOPIFY_RESPONSE_INVALID',502);
  return {products:products.nodes.map(node=>shopifySource(this.domain,node,'STAGING')),pageInfo:pageInfo(products.pageInfo),apiVersion:this.apiVersion};
 }
 async variantPage(productId:string,first=100,after?:string){
  if(!this.#identityVerified)fail('SHOPIFY_IDENTITY_REQUIRED',403);
  const data=await this.#query(SHOPIFY_OPERATIONS.variants,{id:gid(productId,'Product'),...pagination(first,after)}),product=object(data.product);
  if(product.id!==productId)fail('SHOPIFY_PRODUCT_IDENTITY_MISMATCH',502);
  const variants=object(product.variants);if(!Array.isArray(variants.nodes)||variants.nodes.length>first)fail('SHOPIFY_RESPONSE_INVALID',502);
  return {productId,variants:variants.nodes.map(node=>{const v=object(node);if(!Array.isArray(v.selectedOptions)||v.selectedOptions.length>3)fail('SHOPIFY_RESPONSE_INVALID',502);return {id:gid(v.id,'ProductVariant'),sku:v.sku===null?null:string(v.sku,500),selectedOptions:v.selectedOptions.map(option=>{const o=object(option);return {name:string(o.name,255),value:string(o.value,255)};}),imageUrl:null,mediaCoverage:'NOT_REQUESTED'};}),pageInfo:pageInfo(variants.pageInfo)};
 }
}

export function shopifySource(domainInput:string,value:unknown,environment:'SYNTHETIC'|'STAGING'){
 const domain=shopifyDomain(domainInput),p=object(value),id=gid(p.id,'Product'),status=string(p.status,20);
 if(!['ACTIVE','DRAFT','ARCHIVED'].includes(status))fail('SHOPIFY_RESPONSE_INVALID',502);
 return {supplier:`Shopify ${domain}`,externalId:id,title:string(p.title),brand:string(p.vendor),environment,sourceEnabled:status==='ACTIVE',imageUrl:imageReference(p.featuredMedia?object(p.featuredMedia).image:null,domain),sourceUrl:`https://${domain}/admin/products/${id.split('/').at(-1)}`,observedAt:new Date().toISOString()};
}
export function shopifyDemoSources(domain:string){return [
 {id:'gid://shopify/Product/10001',title:'Shopify demo · cotton tee',vendor:'Synthetic example brand',status:'DRAFT',featuredMedia:null},
 {id:'gid://shopify/Product/10002',title:'Shopify demo · event tote',vendor:'Synthetic example brand',status:'ACTIVE',featuredMedia:null},
].map(product=>shopifySource(domain,product,'SYNTHETIC'));}
