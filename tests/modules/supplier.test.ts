import { describe,it,expect } from 'vitest';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { LocalEncryptedVault,PromoStandardsAdapter,PROVIDERS,mockCapabilities,parseSafeXML,privateAddress,validateEndpoint,PRODUCT_NAMESPACE } from '../../packages/providers/src/index';
import { parseImport,escapeCSVCell,inferMapping,validateMapping } from '../../packages/supplier/src/imports';
import { validatePricePolicy,connectionSummary } from '../../packages/supplier/src/index';
import type {Row} from '../../packages/kernel/src/index';
import { createClientAsync,HttpClient } from 'soap';

const fixture=(name:string)=>fs.readFile(path.resolve('tests/fixtures',name),'utf8');
describe('A03 / Integration Center credentials and independent capability evidence',()=>{
 it('encrypts secret ciphertext and authenticates workspace-bound access',async()=>{
  const directory=await fs.mkdtemp(path.join(tmpdir(),'ts-vault-'));try{
   const vault=new LocalEncryptedVault(directory),secret='synthetic-only-secret-1234',saved=await vault.replace('tenant-A/workspace-A/connection-A',secret);
   expect(saved.maskedHint).toBe('••••1234');expect(saved.reference).not.toContain(secret);
   const files=await fs.readdir(directory);for(const file of files)expect((await fs.readFile(path.join(directory,file))).toString()).not.toContain(secret);
   expect(await vault.resolve('tenant-A/workspace-A/connection-A',saved.reference)).toBe(secret);
   await expect(vault.resolve('tenant-B/workspace-B/connection-A',saved.reference)).rejects.toThrow();
   const replacement=await vault.replace('tenant-A/workspace-A/connection-A','rotated-synthetic-secret-5678');expect(replacement.reference).not.toBe(saved.reference);
  }finally{await fs.rm(directory,{recursive:true,force:true});}
 });
 it('connection summary has no credential pointer or token',()=>{
  const summary=connectionSummary({id:'id',tenant_id:'tenant',workspace_id:'workspace',owner_id:'user',created_at:'2026-11-05',updated_at:'2026-11-05',title:'Demo',status:'CREDENTIALS_SAVED',revision:2,data:{providerType:'PROMOSTANDARDS_SOAP',environment:'mock',secretReference:'private-vault-ref',password:'never-return-me',maskedHint:'••••1234'}} as Row);
  expect(JSON.stringify(summary)).not.toMatch(/private-vault-ref|never-return-me|secretReference|password/);
 });
 it('A04: one rejected service never upgrades or fails unrelated services',()=>{
  const caps=mockCapabilities('PROMOSTANDARDS_SOAP',{hasCredentials:true,failService:'inventory'});
  expect(caps.find(c=>c.capability==='inventory')?.verification).toBe('BLOCKED');expect(caps.find(c=>c.capability==='product_data')?.verification).toBe('MOCKED');
  expect(caps.every(c=>!['SANDBOX_VERIFIED','LIVE_VERIFIED'].includes(c.verification))).toBe(true);
 });
 it('ESP+ does not imply ASI API entitlement',()=>{
  expect(mockCapabilities('ASI_SMARTLINK',{hasCredentials:true}).every(c=>c.verification==='BLOCKED')).toBe(true);
  expect(PROVIDERS.ASI_SMARTLINK.help).toContain('does not authorize');
 });
 it('A33: unknown proprietary REST services stay blocked and offer file fallback',()=>{expect(mockCapabilities('GENERIC_REST',{hasCredentials:true}).every(c=>c.verification==='BLOCKED'&&c.reason?.includes('CSV/XML'))).toBe(true);});
 it('validates no-code margin policies independently of source code',()=>{
  expect(validatePricePolicy({targetMargin:0.45,floorMargin:0.32}).targetMargin).toBe(0.45);
  expect(()=>validatePricePolicy({targetMargin:0.4,floorMargin:0.5})).toThrow();
 });
});
describe('A05–A07 / hardened CSV and XML import staging',()=>{
 it('infers versionable mappings and retains zero/unknown stock semantics',async()=>{
  const {rows,mapping}=await parseImport(await fixture('supplier-products.csv'),'CSV');
  expect(mapping.sourceId).toBe('sku');expect(rows).toHaveLength(3);expect(rows[0].outcome).toBe('GREEN');expect(rows[1].normalized.inventory).toBe('0');expect(rows[2].normalized.cost).toBeNull();expect(rows[2].normalized.freight).toBeNull();expect(rows[2].outcome).toBe('AMBER');
 });
 it('parses namespace-safe XML product rows',async()=>{
  const parsed=await parseImport(await fixture('supplier-products.xml'),'XML');expect(parsed.rows).toHaveLength(1);expect(parsed.rows[0].normalized.sourceId).toBe('XML-001');expect(parsed.rows[0].normalized.cost).toBe('4.2500');
 });
 it('rejects DTD/entities before parsing or resolving any external resource',async()=>{
  const malicious='<!DOCTYPE x [<!ENTITY ex SYSTEM "http://127.0.0.1/private">]><products><product><name>&ex;</name></product></products>';
  await expect(parseImport(malicious,'XML')).rejects.toThrow('XML_DTD_FORBIDDEN');
 });
 it('rejects malformed XML, deeply nested XML and CSV row shape errors',async()=>{
  expect(()=>parseSafeXML('<products><product></products>')).toThrow('XML_MALFORMED');
  await expect(parseImport('<products>'+ '<a>'.repeat(40)+'</a>'.repeat(40)+'</products>','XML')).rejects.toThrow('XML_DEPTH_EXCEEDED');
  await expect(parseImport('sku,name\n123,a,b','CSV')).rejects.toThrow('CSV_MALFORMED');
 });
 it('marks duplicate IDs, invalid money/currency/MOQ and negative weight red',async()=>{
  const {rows}=await parseImport('sku,name,currency,cost,moq,weight,freight\nA,One,USD,1.00,12,0.5,1\nA,Two,usd,-1,0,-4,1','CSV');
  expect(rows[1].outcome).toBe('RED');expect(rows[1].issues.map(i=>i.code)).toEqual(expect.arrayContaining(['DUPLICATE_SOURCE_ID','CURRENCY_REQUIRED','INVALID_COST','MOQ_INVALID','INVALID_WEIGHT']));
 });
 it('validates explicit quantity tiers instead of ignoring malformed supplier price breaks',async()=>{
  const malformed='sku,name,currency,cost,moq,freight,priceBreaks\nA,Product,USD,1,12,1,"[{""quantity"":24,""unitCost"":""1.00""},{""quantity"":12,""unitCost"":""0.80""}]"';
  const result=await parseImport(malformed,'CSV');expect(result.rows[0].issues.map(x=>x.code)).toContain('PRICE_BREAKS_INVALID');
 });
 it('enforces the row ceiling while parsing ten thousand source variants',async()=>{
  const header='sku,name,currency,cost,moq,freight\n';const body=Array.from({length:10000},(_,i)=>`PART-${i},Synthetic product ${i},USD,1.00,12,5.00`).join('\n');
  expect((await parseImport(header+body,'CSV')).rows).toHaveLength(10000);
  await expect(parseImport(header+body+'\nPART-over,Over limit,USD,1.00,12,5.00','CSV')).rejects.toThrow('IMPORT_ROW_LIMIT');
 });
 it('rejects ambiguous or executable mapping selectors and mismatched file magic',async()=>{
  expect(()=>validateMapping({name:'//product[1]'})).toThrow('MAPPING_SELECTOR_INVALID');
  await expect(parseImport('<products/>','CSV')).rejects.toThrow('IMPORT_MIME_MISMATCH');
  expect(inferMapping(['Part ID','Product Name','Minimum Quantity'])).toEqual({sourceId:'Part ID',name:'Product Name',moq:'Minimum Quantity'});
 });
 it('escapes spreadsheet formula prefixes on exports',()=>{
  for(const cell of ['=1+1','+SUM(A1)','-12','@cmd',' \t=1'])expect(escapeCSVCell(cell)).toMatch(/^'/);
  expect(escapeCSVCell('normal "quoted" text')).toBe('"normal ""quoted"" text"');
 });
});
describe('A34 / supplier network boundary',()=>{
 it('denies arbitrary, private, credentialed and deceptive endpoint hosts',()=>{
  for(const url of ['http://supplier.example/api','https://127.0.0.1/api','https://supplier.example.evil/api','https://user:pass@supplier.example/api','https://supplier.example:444/api','https://supplier.example./api'])expect(()=>validateEndpoint(url,['supplier.example'])).toThrow();
  expect(validateEndpoint('https://supplier.example/product',['supplier.example']).hostname).toBe('supplier.example');
 });
 it('rejects private DNS results including IPv4 mapped IPv6',()=>{
  for(const value of ['127.0.0.1','10.0.0.2','172.16.3.4','192.168.0.2','169.254.169.254','100.64.0.1','::1','::ffff:127.0.0.1','fe80::1','fd00::1'])expect(privateAddress(value),value).toBe(true);
  expect(privateAddress('93.184.216.34')).toBe(false);
 });
});
describe('Direct native PromoStandards fixture wire contract',()=>{
 const adapter=new PromoStandardsAdapter();
 it('normalizes exact supplier part IDs without deriving identity from titles',async()=>{
  const rows=adapter.parseProductResponse(await fixture('promostandards-product-v1-response.xml'));
  expect(rows.map(r=>r.partId)).toEqual(['PART-100-NAV-M','PART-100-BLK-M']);expect(rows[0].cost).toBeNull();expect(rows[0].inventory).toBeNull();
 });
 it('validates namespace, malformed data, duplicate parts and SOAP faults',async()=>{
  const xml=await fixture('promostandards-product-v1-response.xml');
  expect(()=>adapter.parseProductResponse(xml.replaceAll(PRODUCT_NAMESPACE,'urn:unknown'))).toThrow('SOAP_NAMESPACE_UNSUPPORTED');
  expect(()=>adapter.parseProductResponse(xml.replace('PART-100-BLK-M','PART-100-NAV-M'))).toThrow('SUPPLIER_PART_MAPPING_INVALID');
  expect(()=>adapter.parseProductResponse(`<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"><soap:Body><soap:Fault xmlns="${PRODUCT_NAMESPACE}"><faultcode>Auth</faultcode></soap:Fault></soap:Body></soap:Envelope>`)).toThrow('SUPPLIER_SOAP_FAULT');
 });
 it('generates native SOAP requests from the reviewed fixture WSDL without network access',async()=>{
  const xml=await fixture('promostandards-product-v1-response.xml');let request='';
  const httpClient=new HttpClient();
  httpClient.request=(...args:Parameters<HttpClient['request']>):ReturnType<HttpClient['request']>=>{
   const [,body,callback]=args;request=String(body);queueMicrotask(()=>callback(null,{status:200,headers:{}},xml));
   return Promise.resolve({data:xml,status:200,statusText:'OK',headers:{},config:{}}) as ReturnType<HttpClient['request']>;
  };
  const client=await createClientAsync(path.resolve('tests/fixtures/promostandards-product-v1.wsdl'),{httpClient,disableCache:true});
  const result=await client.getProductAsync({wsVersion:'1.0.0',id:'synthetic-account',password:'synthetic-only',productId:'MODEL-100',localizationCountry:'US',localizationLanguage:'en'});
  expect(request).toContain('<productId>MODEL-100</productId>');expect(request).toContain(PRODUCT_NAMESPACE);expect(adapter.parseProductResponse(String(result[1]))).toHaveLength(2);
 });
 it('does not accept namespace text in an unrelated comment as a valid operation namespace',async()=>{
  const xml=await fixture('promostandards-product-v1-response.xml');expect(()=>adapter.parseProductResponse(xml.replaceAll(PRODUCT_NAMESPACE,'urn:unknown')+`<!--${PRODUCT_NAMESPACE}-->`)).toThrow('SOAP_NAMESPACE_UNSUPPORTED');
 });
 it('escapes credentials in versioned SOAP envelopes',()=>{
  const request=adapter.buildProductRequest({id:'demo<id',password:'synthetic<&password'},'MODEL-100');expect(request).toContain('<wsVersion>1.0.0</wsVersion>');expect(request).toContain('demo&lt;id');expect(request).not.toContain('synthetic<&password');
 });
});
