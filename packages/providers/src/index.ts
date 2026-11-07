import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomBytes, createCipheriv, createDecipheriv, randomUUID } from 'node:crypto';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import https from 'node:https';
import { XMLParser, XMLValidator } from 'fast-xml-parser';
import Decimal from 'decimal.js';
import { createClientAsync, HttpClient } from 'soap';
import { fail, hash, type Input } from '../../kernel/src/index';

export type Verification = 'NOT_CONFIGURED'|'MOCKED'|'SANDBOX_VERIFIED'|'LIVE_VERIFIED'|'BLOCKED';
export type ProviderType = 'PROMOSTANDARDS_SOAP'|'ASI_SMARTLINK'|'GENERIC_REST'|'CSV'|'XML'|'POD'|'SHIPPING'|'ACCOUNTING'|'SHOPIFY';
export type Capability = { capability:string; verification:Verification; available:boolean; version?:string; reason?:string; checkedAt?:string };
export const PROVIDERS:Record<ProviderType,{title:string;credentials:string[];services:string[];enabled:boolean;help:string}> = {
 SHOPIFY:{title:'Shopify sales channel',credentials:[],services:['shop_identity','catalog_read'],enabled:true,help:'Read-only connector development preview. Demo imports are synthetic and private. Merchant installation, expiring OAuth, durable tokens and development-store verification are required before connecting a real store. No order, payment, publishing or fulfillment writes.'},
 PROMOSTANDARDS_SOAP:{title:'Direct PromoStandards supplier',credentials:['accountNumber','username','password'],services:['product_data','media','inventory','pricing_configuration','purchase_order','order_status','shipment_notification','invoice'],enabled:true,help:'Supplier API credentials are separate from the supplier website login. Each service/version is verified independently.'},
 ASI_SMARTLINK:{title:'ASI SmartLink (authorized accounts)',credentials:['accountId','clientId','clientSecret'],services:['catalog_search','product_details'],enabled:true,help:'ESP+ website access does not authorize SmartLink APIs. A developer agreement, API entitlement, official schema and image rights are required. No ESP+ scraping.'},
 GENERIC_REST:{title:'Direct REST supplier',credentials:['apiKey'],services:['catalog','price','inventory','fulfillment'],enabled:true,help:'Only registered, versioned provider schemas are supported. Unknown APIs use CSV/XML or manual fulfillment.'},
 CSV:{title:'Upload CSV',credentials:[],services:['import_products','import_variants','import_prices'],enabled:true,help:'Private staged import; mapped data is reviewed before commit and never automatically published.'},
 XML:{title:'Upload XML',credentials:[],services:['import_products','import_variants','import_prices'],enabled:true,help:'Hardened XML parser; DTD and external entities are rejected.'},
 POD:{title:'POD fulfillment',credentials:['apiKey'],services:['quote','production','status','tracking'],enabled:true,help:'Deterministic local simulator. Real provider account and tested API profile required for activation.'},
 SHIPPING:{title:'Shipping',credentials:['apiKey'],services:['quote','label','tracking'],enabled:true,help:'Simulated tracking only. External supplier shipments never buy an additional label.'},
 ACCOUNTING:{title:'Accounting',credentials:['clientId','clientSecret'],services:['invoice','payment_reference'],enabled:true,help:'Reference reconciliation only; no general ledger, settlement or live financial writes.'}
};

function localDirectory(){
 const configured=process.env.TWELVESPEC_LOCAL_DIR??(process.env.TWELVESPEC_ROOT?path.join(process.env.TWELVESPEC_ROOT,'.local'):undefined);
 if(configured) return path.resolve(configured);
 let directory=process.cwd();
 // Next.js apps start two directories beneath the monorepo root.
 if(path.basename(path.dirname(directory))==='apps') directory=path.resolve(directory,'../..');
 return path.join(directory,'.local');
}
/** Development-only encrypted secret store. Production activation requires a managed vault implementation. */
export class LocalEncryptedVault {
 readonly directory:string;
 constructor(directory=path.join(localDirectory(),'vault')){this.directory=directory;}
 private async key(){
  if(process.env.TWELVESPEC_ENV && !['local','test','preview'].includes(process.env.TWELVESPEC_ENV)) fail('MANAGED_VAULT_REQUIRED',503);
  await fs.mkdir(this.directory,{recursive:true,mode:0o700});
  const file=path.join(this.directory,'local-development.key');
  try {return await fs.readFile(file);} catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
  const value=randomBytes(32);
  try{await fs.writeFile(file,value,{flag:'wx',mode:0o600});return value;}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;return fs.readFile(file);}
 }
 async replace(scope:string,value:string){
  if(!value||value.length>16384)fail('INVALID_CREDENTIAL',400);
  const key=await this.key(),id=randomUUID(),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
  cipher.setAAD(Buffer.from(scope));
  const encrypted=Buffer.concat([cipher.update(value,'utf8'),cipher.final()]);
  await fs.writeFile(path.join(this.directory,`${id}.json`),JSON.stringify({iv:iv.toString('base64'),tag:cipher.getAuthTag().toString('base64'),ciphertext:encrypted.toString('base64')}),{flag:'wx',mode:0o600});
  return {reference:`local-vault:${id}`,maskedHint:`••••${value.slice(-4)}`,mode:'LOCAL_ENCRYPTED_DEVELOPMENT_VAULT'};
 }
 async resolve(scope:string,reference:string){
  if(!/^local-vault:[a-f0-9-]{36}$/.test(reference))fail('INVALID_SECRET_REFERENCE',400);
  const key=await this.key(),stored=JSON.parse(await fs.readFile(path.join(this.directory,`${reference.slice(12)}.json`),'utf8')) as {iv:string;tag:string;ciphertext:string};
  const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(stored.iv,'base64'));decipher.setAAD(Buffer.from(scope));decipher.setAuthTag(Buffer.from(stored.tag,'base64'));
  return Buffer.concat([decipher.update(Buffer.from(stored.ciphertext,'base64')),decipher.final()]).toString('utf8');
 }
}

export function privateAddress(address:string):boolean {
 const normalized=address.toLowerCase().split('%')[0];
 if(normalized.startsWith('::ffff:')) return privateAddress(normalized.slice(7));
 if(isIP(normalized)===4){const b=normalized.split('.').map(Number);return b[0]===0||b[0]===10||b[0]===127||b[0]===169&&b[1]===254||b[0]===172&&b[1]>=16&&b[1]<=31||b[0]===192&&b[1]===168||b[0]===100&&b[1]>=64&&b[1]<=127||b[0]>=224||b[0]===198&&(b[1]===18||b[1]===19);}
 if(isIP(normalized)===6)return normalized==='::'||normalized==='::1'||normalized.startsWith('fc')||normalized.startsWith('fd')||/^fe[89ab]/.test(normalized)||normalized.startsWith('ff')||normalized.startsWith('2001:db8')||normalized.startsWith('2002:')||normalized.startsWith('2001:0:');
 return true;
}
export function validateEndpoint(value:string,allowedHosts:readonly string[]):URL {
 let u:URL;try{u=new URL(value);}catch{return fail('ENDPOINT_INVALID',400);}
 if(u.protocol!=='https:'||u.username||u.password||u.hash||u.port&&u.port!=='443'||u.hostname.endsWith('.')||isIP(u.hostname.replace(/^\[|\]$/g,''))||!allowedHosts.includes(u.hostname.toLowerCase()))fail('ENDPOINT_NOT_ALLOWLISTED',400);
 return u;
}
export const supplierHosts=()=> (process.env.TWELVESPEC_SUPPLIER_HOSTS??'promostandards.ssactivewear.com').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean);
/** HTTPS transport pins a public DNS result, rejects redirects, and limits bytes/time. */
export async function boundedSupplierRequest(value:string,body:string,headers:Record<string,string>={},allowedHosts=supplierHosts()):Promise<string>{
 const url=validateEndpoint(value,allowedHosts);
 let dnsTimer:ReturnType<typeof setTimeout>|undefined;
 const addresses=await Promise.race([lookup(url.hostname,{all:true}),new Promise<never>((_,reject)=>{dnsTimer=setTimeout(()=>reject(new Error('SUPPLIER_DNS_TIMEOUT')),10000);})]).finally(()=>{if(dnsTimer)clearTimeout(dnsTimer);});
 if(!addresses.length||addresses.some(x=>privateAddress(x.address)))fail('ENDPOINT_PRIVATE_ADDRESS',400);
 const pinned=addresses[0];
 return new Promise((resolve,reject)=>{
  let deadline:ReturnType<typeof setTimeout>|undefined;
  const finish=(error:Error|null,result?:string)=>{if(deadline)clearTimeout(deadline);error?reject(error):resolve(result??'');};
  const request=https.request(url,{method:'POST',headers:{'Content-Type':'text/xml; charset=utf-8',...headers},lookup:(_host,_options,callback)=>callback(null,pinned.address,pinned.family),timeout:10000,rejectUnauthorized:true},response=>{
   if((response.statusCode??500)>=300&&response.statusCode!==500){response.resume();finish(new Error(response.statusCode&&response.statusCode<400?'SUPPLIER_REDIRECT_BLOCKED':'SUPPLIER_HTTP_ERROR'));return;}
   let bytes=0;const chunks:Buffer[]=[];response.on('data',(chunk:Buffer)=>{bytes+=chunk.length;if(bytes>5*1024*1024){response.destroy();finish(new Error('SUPPLIER_RESPONSE_TOO_LARGE'));return;}chunks.push(chunk);});
   response.on('end',()=>finish(null,Buffer.concat(chunks).toString('utf8')));response.on('error',()=>finish(new Error('SUPPLIER_RESPONSE_ERROR')));
  });
  deadline=setTimeout(()=>request.destroy(new Error('SUPPLIER_TIMEOUT')),10000);request.on('timeout',()=>request.destroy(new Error('SUPPLIER_TIMEOUT')));request.on('error',()=>finish(new Error('SUPPLIER_REQUEST_FAILED')));request.end(body);
 });
}
export function parseSafeXML(xml:string):Input{
 if(Buffer.byteLength(xml)>5*1024*1024)fail('XML_TOO_LARGE',400);
 if(/<!\s*(?:DOCTYPE|ENTITY)/i.test(xml))fail('XML_DTD_FORBIDDEN',400);
 if(XMLValidator.validate(xml)!==true)fail('XML_MALFORMED',400);
 return new XMLParser({ignoreAttributes:false,removeNSPrefix:true,parseTagValue:false,processEntities:false,trimValues:true}).parse(xml) as Input;
}
const obj=(v:unknown):Input=>v&&typeof v==='object'&&!Array.isArray(v)?v as Input:{};
const arr=(v:unknown):unknown[]=>v===undefined?[]:Array.isArray(v)?v:[v];
function validateSoapOperation(xml:string,operation:string,namespace:string):void {
 parseSafeXML(xml);
 const document=new XMLParser({ignoreAttributes:false,removeNSPrefix:false,parseTagValue:false,processEntities:false}).parse(xml) as Input;
 const entries=(value:Input,name:string)=>Object.entries(value).filter(([key])=>!key.startsWith('@_')&&key.split(':').at(-1)===name);
 const envelopeEntry=entries(document,'Envelope');if(envelopeEntry.length!==1)fail('SOAP_ENVELOPE_INVALID',400);
 const [envelopeName,envelopeRaw]=envelopeEntry[0],envelope=obj(envelopeRaw);
 const namespaceFor=(qualified:string,scopes:Input[])=>{const prefix=qualified.includes(':')?qualified.split(':')[0]:'';const key=prefix?'@_xmlns:'+prefix:'@_xmlns';for(const scope of scopes)if(scope[key])return String(scope[key]);return '';};
 const soapNamespace=namespaceFor(envelopeName,[envelope]);if(!['http://schemas.xmlsoap.org/soap/envelope/','http://www.w3.org/2003/05/soap-envelope'].includes(soapNamespace))fail('SOAP_ENVELOPE_INVALID',400);
 const bodyEntries=entries(envelope,'Body');if(bodyEntries.length!==1)fail('SOAP_BODY_INVALID',400);const[bodyName,bodyRaw]=bodyEntries[0],body=obj(bodyRaw);
 if(namespaceFor(bodyName,[body,envelope])!==soapNamespace)fail('SOAP_BODY_INVALID',400);
 if(entries(body,'Fault').length)fail('SUPPLIER_SOAP_FAULT',502);
 const operationEntries=entries(body,operation);if(operationEntries.length!==1)fail('SOAP_OPERATION_UNSUPPORTED',400);const[name,response]=operationEntries[0];
 if(namespaceFor(name,[obj(response),body,envelope])!==namespace)fail('SOAP_NAMESPACE_UNSUPPORTED',400);
}
const escapeXML=(v:string)=>v.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));
export const PRODUCT_NAMESPACE='http://www.promostandards.org/WSDL/ProductDataService/1.0.0/';
export interface ProductEvidence {sourceId:string;partId:string;name:string;brand:string;color:string;size:string;currency:string;cost:string|null;inventory:string|null;sourceHash:string;serviceVersion:string;observedAt:string;}
export class PromoStandardsAdapter {
 readonly type='PROMOSTANDARDS_SOAP';
 readonly version='1.0.0';
 buildProductRequest(credentials:{id:string;password:string},productId:string){
  return `<?xml version="1.0" encoding="UTF-8"?><soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><getProduct xmlns="${PRODUCT_NAMESPACE}"><wsVersion>${this.version}</wsVersion><id>${escapeXML(credentials.id)}</id><password>${escapeXML(credentials.password)}</password><productId>${escapeXML(productId)}</productId><localizationCountry>US</localizationCountry><localizationLanguage>en</localizationLanguage></getProduct></soap:Body></soap:Envelope>`;
 }
 parseProductResponse(xml:string):ProductEvidence[]{
  // Only the declared WSDL profile is accepted. Unknown supplier schemas are not silently normalized.
  validateSoapOperation(xml,'getProductResponse',PRODUCT_NAMESPACE);
  const root=parseSafeXML(xml),envelope=obj(root.Envelope),body=obj(envelope.Body);
  if(body.Fault)fail('SUPPLIER_SOAP_FAULT',502);
  const response=obj(body.getProductResponse),error=obj(response.ErrorMessage);
  if(error.code||error.description)fail('SUPPLIER_REJECTED_REQUEST',502);
  const product=obj(response.Product??obj(response.GetProductResponse).Product),sourceId=String(product.productId??'');
  if(!sourceId)fail('SUPPLIER_PRODUCT_ID_MISSING',400);
  const rows=arr(obj(product.ProductPartArray).ProductPart);
  if(!rows.length)fail('SUPPLIER_PARTS_MISSING',400);
  const seen=new Set<string>();
  return rows.map(raw=>{const part=obj(raw),partId=String(part.partId??'');if(!partId||seen.has(partId))fail('SUPPLIER_PART_MAPPING_INVALID',400);seen.add(partId);
   const cost=part.unitCost===undefined?null:String(part.unitCost),currency=String(part.currency??'USD');
   if(!/^[A-Z]{3}$/.test(currency))fail('SUPPLIER_CURRENCY_INVALID',400);
   if(cost!==null){try{if(!new Decimal(cost).isFinite()||new Decimal(cost).isNegative())fail('SUPPLIER_PRICE_INVALID',400);}catch{fail('SUPPLIER_PRICE_INVALID',400);}}
   return {sourceId,partId,name:String(product.productName??''),brand:String(product.brand??''),color:String(obj(part.ColorArray).Color??part.color??''),size:String(part.size??''),currency,cost,inventory:part.quantityAvailable===undefined?null:String(part.quantityAvailable),sourceHash:hash(xml),serviceVersion:this.version,observedAt:new Date().toISOString()};
  });
 }
 async fetchProduct(endpoint:string,credentials:{id:string;password:string},productId:string){
  validateEndpoint(endpoint,supplierHosts());
  const root=process.env.TWELVESPEC_ROOT??path.dirname(localDirectory());
  // The WSDL is a reviewed bundled schema, never a browser-supplied or remote URL.
  const client=await createClientAsync(path.join(root,'packages/providers/profiles/promostandards-product-v1.wsdl'),{httpClient:new AllowlistedSoapHttpClient(),disableCache:true});
  client.setEndpoint(endpoint);
  const response=await client.getProductAsync({wsVersion:this.version,id:credentials.id,password:credentials.password,productId,localizationCountry:'US',localizationLanguage:'en'});
  return this.parseProductResponse(String(response[1]));
 }
}
export function mockCapabilities(providerType:ProviderType,options:{hasCredentials:boolean;failService?:string}):Capability[]{
 return PROVIDERS[providerType].services.map(capability=>{
  const requiresSecret=PROVIDERS[providerType].credentials.length>0;
  const blocked=providerType==='ASI_SMARTLINK'||providerType==='GENERIC_REST'||requiresSecret&&!options.hasCredentials||capability===options.failService;
  return {capability,available:!blocked,verification:blocked?'BLOCKED':'MOCKED',version:providerType==='PROMOSTANDARDS_SOAP'?(capability==='inventory'?'2.0.0':'1.0.0'):undefined,checkedAt:new Date().toISOString(),reason:providerType==='ASI_SMARTLINK'?'Authorized ASI developer agreement, entitlement and official API schema required':providerType==='GENERIC_REST'?'Unknown proprietary API requires a registered adapter. Use CSV/XML or manual fulfillment.':requiresSecret&&!options.hasCredentials?'Save a supplier API credential before verification':capability===options.failService?'Simulated supplier rejected this service credential':'Deterministic local simulator; no vendor endpoint contacted'};
 });
}
export const smartLinkActivationRequirements = ['Account ID','Developer API Client ID','Server-only secret/token','Verified API entitlement','Official account-specific schema','Catalog/image redistribution agreement'];

/** node-soap generates supplier requests from the reviewed bundled WSDL. Remote WSDL imports are denied. */
export class AllowlistedSoapHttpClient extends HttpClient {
 override request(...args:Parameters<HttpClient['request']>):ReturnType<HttpClient['request']>{
  const [url,data,callback,headers]=args;
  const response=(async()=>{
   if(typeof data!=='string')fail('REMOTE_WSDL_FETCH_FORBIDDEN',400);
   const body=await boundedSupplierRequest(url,data,headers as Record<string,string>|undefined);
   const result={data:body,status:200,statusText:'OK',headers:{'content-type':'text/xml'},config:{}};
   callback(null,result,body);return result;
  })();
  response.catch(()=>callback(new Error('SUPPLIER_REQUEST_FAILED')));
  return response as ReturnType<HttpClient['request']>;
 }
}
