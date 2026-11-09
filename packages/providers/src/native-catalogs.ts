import https from 'node:https';
import {lookup} from 'node:dns/promises';
import Decimal from 'decimal.js';
import {fail,text,type Input} from '../../kernel/src';
import {privateAddress,validateEndpoint} from './index';
import type {NativeEnvironment,NativeProvider,Operation} from '../../supplier/src/api-budget';

export type NativeRequest={provider:NativeProvider;environment:NativeEnvironment;operation:Operation;params:Input;credentials?:Input;bearer?:string};
export type NativeTransport=(request:NativeRequest)=>Promise<unknown>;
const object=(v:unknown):Input=>v&&typeof v==='object'&&!Array.isArray(v)?v as Input:fail('SUPPLIER_SCHEMA_MISMATCH',502);
const numericId=(v:unknown)=>{const id=Number(v);if(!Number.isSafeInteger(id)||id<1||id>1e12)fail('SUPPLIER_ID_INVALID',400);return id;};
export function storeCode(v:unknown):6|9 {if(v!==6&&v!==9)fail('SINALITE_STORE_INVALID',400);return v;}
export function nativeWireRequest(r:NativeRequest){
 if(r.environment==='mock')fail('MOCK_HAS_NO_NETWORK',403);
 if(r.provider==='SAGE_CONNECT'){
  if(!['search','research','detail','full_detail'].includes(r.operation)||r.environment!=='live_readonly')fail('SAGE_READ_PROFILE_REQUIRED',403);
  if(!r.credentials?.accountId||!r.credentials.loginId||!r.credentials.authKey)fail('API_CREDENTIAL_REQUIRED',403);
  return {url:'https://www.promoplace.com/ws/ws.dll/ConnectAPI',method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({serviceId:r.operation==='research'?101:r.operation==='detail'?104:r.operation==='full_detail'?105:103,apiVer:130,auth:{acctId:Number(r.credentials.accountId),loginId:r.credentials.loginId,key:r.credentials.authKey},...(r.operation==='research'?{listType:'categories'}:r.operation==='search'?{search:{categories:text(r.params.category,200)}}:{prodEId:numericId(r.params.productId),...(r.operation==='full_detail'?{includeSuppInfo:1}:{})})})};
 }
 if(r.provider!=='SINALITE')fail('NATIVE_PROVIDER_UNSUPPORTED',400);
 const base=r.environment==='sandbox'?'https://api.sinaliteuppy.com':'https://liveapi.sinalite.com';
 let path:string,body:string|undefined;
 if(r.operation==='auth'){
  if(!r.credentials?.clientId||!r.credentials.clientSecret)fail('API_CREDENTIAL_REQUIRED',403);
  path='/auth/token';body=JSON.stringify({client_id:r.credentials.clientId,client_secret:r.credentials.clientSecret,audience:'https://apiconnect.sinalite.com',grant_type:'client_credentials'});
 }else if(r.operation==='catalog')path='/product';
 else if(r.operation==='detail')path=`/product/${numericId(r.params.productId)}`;
 else if(r.operation==='options')path=`/product/${numericId(r.params.productId)}/${storeCode(r.params.storeCode)}`;
 else if(r.operation==='price'){
  path=`/price/${numericId(r.params.productId)}/${storeCode(r.params.storeCode)}`;
  if(!Array.isArray(r.params.optionIds)||!r.params.optionIds.length||r.params.optionIds.length>100)fail('PRINT_OPTION_IDS_REQUIRED',400);
  body=JSON.stringify({productOptions:r.params.optionIds.map(numericId)});
 }else return fail('NATIVE_OPERATION_UNSUPPORTED',400);
 return {url:base+path,method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(r.bearer?{Authorization:`Bearer ${r.bearer}`}:{})},body};
}

/** Fixed registered paths only. No arbitrary URLs, redirects, insecure TLS or automatic retries. */
export const boundedCatalogJson:NativeTransport=async request=>{
 const wire=nativeWireRequest(request),url=validateEndpoint(wire.url,['api.sinaliteuppy.com','liveapi.sinalite.com','www.promoplace.com']);
 let timer:ReturnType<typeof setTimeout>|undefined;
 const addresses=await Promise.race([lookup(url.hostname,{all:true}),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new Error('SUPPLIER_DNS_TIMEOUT')),10000);})]).finally(()=>{if(timer)clearTimeout(timer);});
 if(!addresses.length||addresses.some(a=>privateAddress(a.address)))fail('SUPPLIER_DNS_REJECTED',502);
 const pinned=addresses[0];
 const proxyConfigured=Boolean(process.env.HTTPS_PROXY||process.env.https_proxy);
 const agent=proxyConfigured?new https.Agent({proxyEnv:process.env,rejectUnauthorized:true}):undefined;
 return new Promise((resolve,reject)=>{
  let finished=false;
  const finish=(error:Error|null,value?:unknown)=>{if(finished)return;finished=true;if(timer)clearTimeout(timer);if(agent)agent.destroy();error?reject(error):resolve(value);};
  const req=https.request(url,{method:wire.method,headers:wire.headers,rejectUnauthorized:true,minVersion:'TLSv1.2',...(agent?{agent}:{lookup:(_h:string,_o:unknown,callback:(error:NodeJS.ErrnoException|null,address:string,family:number)=>void)=>callback(null,pinned.address,pinned.family)})},res=>{
   if(res.statusCode!==200){res.resume();finish(new Error(res.statusCode===429?'SUPPLIER_RATE_LIMITED':res.statusCode===401||res.statusCode===403?'SUPPLIER_AUTH_REJECTED':res.statusCode&&res.statusCode>=300&&res.statusCode<400?'SUPPLIER_REDIRECT_BLOCKED':'SUPPLIER_HTTP_ERROR'));return;}
   let size=0;const chunks:Buffer[]=[];
   res.on('data',(chunk:Buffer)=>{size+=chunk.length;if(size>5*1024*1024){res.destroy();finish(new Error('SUPPLIER_RESPONSE_TOO_LARGE'));return;}chunks.push(chunk);});
   res.on('error',()=>finish(new Error('SUPPLIER_RESPONSE_ERROR')));
   res.on('end',()=>{try{finish(null,JSON.parse(Buffer.concat(chunks).toString('utf8')));}catch{finish(new Error('SUPPLIER_JSON_INVALID'));}});
  });
  timer=setTimeout(()=>req.destroy(new Error('SUPPLIER_TIMEOUT')),12000);
  req.on('error',(error:NodeJS.ErrnoException)=>{const tls=['UNABLE_TO_VERIFY_LEAF_SIGNATURE','SELF_SIGNED_CERT_IN_CHAIN','UNABLE_TO_GET_ISSUER_CERT_LOCALLY','CERT_HAS_EXPIRED'];finish(new Error(tls.includes(error.code??'')?'SUPPLIER_TLS_REJECTED':error.code==='ECONNREFUSED'?'SUPPLIER_CONNECTION_REFUSED':error.message==='SUPPLIER_TIMEOUT'?'SUPPLIER_TIMEOUT':'SUPPLIER_REQUEST_UNKNOWN'));});req.end(wire.body);
 });
};

export type PrintOption={id:number;group:string;name:string;hidden:boolean};
export function normalizeSinaliteCatalog(raw:unknown):Input[]{
 if(!Array.isArray(raw)||raw.length>10000)fail('SINALITE_CATALOG_SCHEMA',502);
 const seen=new Set<number>();
 return raw.map(item=>{const row=object(item),id=numericId(row.id);if(seen.has(id))fail('SINALITE_DUPLICATE_ID',502);seen.add(id);
  if(row.enabled!==0&&row.enabled!==1)fail('SINALITE_ENABLED_SCHEMA',502);
  return {id,sku:text(row.sku,200),name:text(row.name,500),category:text(row.category,200),enabled:row.enabled===1};
 });
}
export function normalizeSinaliteOptions(raw:unknown):{options:PrintOption[]}{
 if(!Array.isArray(raw)||raw.length!==3||!Array.isArray(raw[0])||!raw[0].length||raw[0].length>5000)fail('SINALITE_OPTIONS_SCHEMA',502);
 const seen=new Set<number>();
 const options=raw[0].map(item=>{const row=object(item),id=numericId(row.id);if(seen.has(id))fail('SINALITE_DUPLICATE_OPTION',502);seen.add(id);return {id,group:text(row.group,100),name:text(row.name,250),hidden:row.hidden===1||row.hidden===true};});
 // Internal hash/markup/debug metadata is intentionally outside the reviewed contract.
 return {options};
}
export function validatePrintSelection(options:PrintOption[],ids:unknown):number[]{
 if(!Array.isArray(ids)||ids.length>100||!ids.length)fail('PRINT_OPTION_IDS_REQUIRED',400);
 const selected=ids.map(numericId),groups=new Set<string>();
 if(new Set(selected).size!==selected.length)fail('PRINT_OPTION_DUPLICATE',400);
 for(const id of selected){const o=options.find(x=>x.id===id);if(!o||o.hidden||groups.has(o.group))fail('PRINT_OPTION_SELECTION_INVALID',400);groups.add(o.group);}
 const visibleGroups=new Set(options.filter(o=>!o.hidden).map(o=>o.group));
 if([...visibleGroups].some(g=>!groups.has(g)))fail('PRINT_OPTION_GROUP_REQUIRED',400);
 return selected;
}
export function normalizeSinalitePrice(raw:unknown,code:6|9,ids:number[]):Input {
 const row=object(raw);let price:Decimal;
 try{price=new Decimal(String(row.price));if(!price.isFinite()||price.lte(0)||price.gt(10000000)||price.decimalPlaces()>4)throw new Error();}catch{return fail('SINALITE_PRICE_SCHEMA',502);}
 const configuration=object(row.productOptions),productOptions:Input={};
 if(Object.keys(configuration).length>100)fail('SINALITE_PRICE_SCHEMA',502);
 for(const [key,v] of Object.entries(configuration)){if(!/^[\p{L}\p{N} ()/._-]{1,100}$/u.test(key)||['__proto__','prototype','constructor'].includes(key))fail('SINALITE_PRICE_SCHEMA',502);productOptions[key]=text(String(v),250);}
 return {price:price.toFixed(4),currency:code===9?'USD':'CAD',storeCode:code,optionIds:[...ids],productOptions,shipping:null,tax:null,scope:'CONFIGURED_PRODUCT_ONLY',customerPrice:null,verification:'SANDBOX_OR_ACCOUNT_EVIDENCE'};
}

export type SageMapping={productsPath:string;idField:string;nameField:string;alternateNameField?:string;brandField?:string;descriptionField?:string;imageField?:string};
const validPath=(path:unknown,allowEmpty=false)=>typeof path==='string'&&(allowEmpty&&path===''||/^[A-Za-z][\w]*(\.[A-Za-z][\w]*){0,5}$/.test(path))&&!path.split('.').some(x=>['__proto__','constructor','prototype'].includes(x));
export function validateSageMapping(value:unknown):SageMapping {
 const v=object(value),mapping:Input={};
 for(const [key,item] of Object.entries(v)){if(!['productsPath','idField','nameField','alternateNameField','brandField','descriptionField','imageField'].includes(key)||!validPath(item,key==='productsPath'))fail('SAGE_RESPONSE_MAPPING_INVALID',400);mapping[key]=item;}
 if(mapping.productsPath===undefined||!mapping.idField||!mapping.nameField)fail('SAGE_RESPONSE_MAPPING_REQUIRED',400);
 return mapping as SageMapping;
}
function atPath(value:unknown,path:string):unknown {let current=value;for(const part of path?path.split('.'):[]){if(!current||typeof current!=='object'||!Object.hasOwn(current,part))return undefined;current=(current as Input)[part];}return current;}
export function normalizeSageSearch(raw:unknown,mapping:SageMapping):Input[]{
 const root=object(raw);if(root.ok!==true||Number(root.ErrNum??0)!==0)fail('SAGE_REQUEST_REJECTED',502);
 const rows=atPath(raw,mapping.productsPath);if(!Array.isArray(rows)||rows.length>1000)fail('SAGE_RESPONSE_SCHEMA_MISMATCH',502);
 const seen=new Set<string>();
 return rows.map(rawRow=>{const id=text(String(atPath(rawRow,mapping.idField)??''),160);if(seen.has(id))fail('SAGE_DUPLICATE_ID',502);seen.add(id);
  return {id,spc:typeof (rawRow as Input).spc==='string'?String((rawRow as Input).spc).slice(0,100):'',publicPriceRange:typeof (rawRow as Input).prc==='string'?String((rawRow as Input).prc).slice(0,100):null,name:text(atPath(rawRow,mapping.nameField)??(mapping.alternateNameField?atPath(rawRow,mapping.alternateNameField):undefined),500),brand:mapping.brandField?String(atPath(rawRow,mapping.brandField)??'').slice(0,200):'',description:mapping.descriptionField?String(atPath(rawRow,mapping.descriptionField)??'').slice(0,10000):'',imageUrl:mapping.imageField?String(atPath(rawRow,mapping.imageField)??'').slice(0,2000):''};
 });
}

export const SAGE_SEARCH_MAPPING:SageMapping={productsPath:'products',idField:'prodEId',nameField:'name',alternateNameField:'prName',imageField:'thumbPic'};
export function normalizeSageResearch(raw:unknown):Input {
 const root=object(raw);if(root.ok!==true||!Array.isArray(root.items)||root.items.length>10000)fail('SAGE_RESEARCH_SCHEMA',502);
 const seen=new Set<string>();const items=root.items.map(rawItem=>{const item=object(rawItem),id=text(String(item.id??''),100);if(seen.has(id))fail('SAGE_RESEARCH_DUPLICATE_ID',502);seen.add(id);return {id,name:text(item.name,300)};});
 return {items,listType:'categories',legalNote:typeof root.legalNote==='string'?root.legalNote.slice(0,2000):'SAGE data; use subject to customer agreement.'};
}

export function verifySinalitePriceSelection(price:Input,options:PrintOption[],ids:number[]){
 const actual=price.productOptions as Input;for(const id of ids){const option=options.find(o=>o.id===id);if(!option||actual[option.group]!==option.name)fail('SINALITE_PRICE_SELECTION_MISMATCH',502);}
}
