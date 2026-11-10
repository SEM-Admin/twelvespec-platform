import { parse } from 'csv-parse';
import { Readable } from 'node:stream';
import Decimal from 'decimal.js';
import { parseSafeXML } from '../../providers/src/index';
import { fail, hash, type Input } from '../../kernel/src/index';

export type ImportMapping = Partial<Record<'sourceId'|'name'|'brand'|'mpn'|'gtin'|'color'|'size'|'currency'|'cost'|'moq'|'freight'|'weight'|'inventory'|'image'|'priceBreaks',string>>;
export type ImportIssue={severity:'ERROR'|'WARNING';code:string;message:string};
export type NormalizedProduct={sourceId:string;name:string;brand:string;mpn:string;gtin:string;color:string;size:string;currency:string;cost:string|null;moq:number|null;freight:string|null;weight:string|null;inventory:string|null;image:string|null;priceBreaks:Array<{quantity:number;unitCost:string}>;rawHash:string};
export type ParsedRow={raw:Input;normalized:NormalizedProduct;issues:ImportIssue[];outcome:'GREEN'|'AMBER'|'RED'};
export const MAX_IMPORT_BYTES=5*1024*1024;
export const MAX_IMPORT_ROWS=10000;
const aliases:Record<keyof NormalizedProduct,string[]>={sourceId:['sourceid','sourcesku','sku','partid','id','productid'],name:['name','title','productname'],brand:['brand','manufacturer'],mpn:['mpn','manufacturermodel','model','manufacturerpartnumber'],gtin:['gtin','upc','ean'],color:['color','colour'],size:['size'],currency:['currency','currencycode'],cost:['cost','unitcost','basecost','price','wholesaleprice'],moq:['moq','minimumquantity','minimumorderquantity'],freight:['freight','shipping','shippingcost'],weight:['weight'],inventory:['inventory','stock','quantityavailable'],image:['image','imageurl','mediaurl'],priceBreaks:['pricebreaks','pricetiers','quantitybreaks'],rawHash:[]};
const key=(v:string)=>v.replace(/[^a-z0-9]/gi,'').toLowerCase();
export function inferMapping(columns:string[]):ImportMapping {
 const mapped:ImportMapping={};for(const [field,names]of Object.entries(aliases)){const column=columns.find(x=>names.includes(key(x)));if(column)mapped[field as keyof ImportMapping]=column;}return mapped;
}
export function validateMapping(value:unknown):ImportMapping{
 if(value===undefined)return {};
 if(!value||typeof value!=='object'||Array.isArray(value))fail('MAPPING_INVALID',400);
 const mapping:ImportMapping={};for(const[k,v]of Object.entries(value as Input)){if(!(k in aliases)||k==='rawHash'||typeof v!=='string'||!v||v.length>120||/[\[\]\/\(\)@*]/.test(v))fail('MAPPING_SELECTOR_INVALID',400);mapping[k as keyof ImportMapping]=String(v);}
 return mapping;
}
function money(value:string,field:string,issues:ImportIssue[],required=false):string|null{
 if(!value){if(required)issues.push({severity:'WARNING',code:`MISSING_${field.toUpperCase()}`,message:`${field} is unknown. Request Quote only.`});return null;}
 try{const amount=new Decimal(value);if(!amount.isFinite()||amount.isNegative()||amount.decimalPlaces()>4||amount.gte('100000000000000'))throw new Error();return amount.toFixed(4);}catch{issues.push({severity:'ERROR',code:`INVALID_${field.toUpperCase()}`,message:`${field} must be nonnegative fixed-precision decimal.`});return null;}
}
export function normalizeRow(raw:Input,mapping:ImportMapping):ParsedRow{
 const issues:ImportIssue[]=[];const read=(field:keyof ImportMapping)=>String(raw[mapping[field]??'']??'').trim();
 const sourceId=read('sourceId'),name=read('name'),brand=read('brand'),mpn=read('mpn'),gtin=read('gtin'),color=read('color'),size=read('size'),currency=read('currency');
 if(!sourceId||sourceId.length>160)issues.push({severity:'ERROR',code:'SOURCE_ID_REQUIRED',message:'Stable supplier part/SKU identity is required.'});
 if(!name||name.length>500)issues.push({severity:'ERROR',code:'NAME_REQUIRED',message:'Product name is required (500 characters maximum).'});
 if(!/^[A-Z]{3}$/.test(currency))issues.push({severity:'ERROR',code:'CURRENCY_REQUIRED',message:'Explicit ISO currency (for example USD) is required.'});
 const minimum=read('moq');const moq=minimum?Number(minimum):null;
 if(moq===null||!Number.isInteger(moq)||moq<1||moq>1e7)issues.push({severity:'ERROR',code:'MOQ_INVALID',message:'An explicit positive minimum order quantity is required.'});
 if(gtin&&!/^\d{8}$|^\d{12,14}$/.test(gtin))issues.push({severity:'ERROR',code:'GTIN_INVALID',message:'GTIN must contain 8 or 12–14 digits; verification is separate.'});
 const cost=money(read('cost'),'cost',issues,true),freight=money(read('freight'),'freight',issues,true),weight=money(read('weight'),'weight',issues);
 let image=read('image')||null;if(image){try{const u=new URL(image);if(u.protocol!=='https:'||u.username||u.password)throw new Error();}catch{issues.push({severity:'ERROR',code:'IMAGE_URL_INVALID',message:'Image URL must be HTTPS without embedded credentials.'});image=null;}}
 if(image&&!color)issues.push({severity:'WARNING',code:'IMAGE_VARIANT_REVIEW',message:'Confirm image and color mapping before public publication.'});
 const inventory=read('inventory')||null;if(inventory!==null&&(!/^\d+$/.test(inventory)||Number(inventory)>1e9))issues.push({severity:'ERROR',code:'INVENTORY_INVALID',message:'Inventory must be a nonnegative whole number or blank for unknown.'});
 // Inventory zero is retained as provider evidence and never interpreted as sellability by itself.
 let priceBreaks:Array<{quantity:number;unitCost:string}>=[];const rawTiers=read('priceBreaks');
 if(rawTiers){try{const tiers=JSON.parse(rawTiers) as unknown;if(!Array.isArray(tiers)||!tiers.length||tiers.length>100)throw new Error();let last=0;priceBreaks=tiers.map(t=>{if(!t||typeof t!=='object')throw new Error();const tier=t as Input,quantity=Number(tier.quantity),unitCost=new Decimal(String(tier.unitCost));if(!Number.isInteger(quantity)||quantity<1||quantity<=last||moq!==null&&quantity<moq||unitCost.isNegative()||!unitCost.isFinite()||unitCost.decimalPlaces()>4||tier.currency!==undefined&&tier.currency!==currency)throw new Error();last=quantity;return {quantity,unitCost:unitCost.toFixed(4)};});}catch{issues.push({severity:'ERROR',code:'PRICE_BREAKS_INVALID',message:'Quantity tiers must be ascending, unique positive quantities with nonnegative cost and matching currency.'});priceBreaks=[];}}else if(cost!==null&&moq!==null)priceBreaks=[{quantity:moq,unitCost:cost}];
 const normalized={sourceId,name,brand,mpn,gtin,color,size,currency,cost,priceBreaks,moq:moq!==null&&Number.isInteger(moq)&&moq>0?moq:null,freight,weight,inventory,image,rawHash:hash(raw)};
 return {raw,normalized,issues,outcome:issues.some(x=>x.severity==='ERROR')?'RED':issues.length?'AMBER':'GREEN'};
}
function xmlRecords(content:string):Input[]{
 let depth=0;for(const token of content.matchAll(/<\/?[A-Za-z_][^>]*>/g)){const t=token[0];if(t.startsWith('</'))depth--;else if(!t.endsWith('/>'))depth++;if(depth>32)fail('XML_DEPTH_EXCEEDED',400);}
 const document=parseSafeXML(content);const root=Object.entries(document).find(([k,v])=>!k.startsWith('?')&&v&&typeof v==='object'&&!Array.isArray(v))?.[1] as Input|undefined;
 const found=root??fail('XML_PRODUCT_ROOT_REQUIRED',400);
 const rows=found.Product??found.product??found.item??found.Item;
 if(rows===undefined)fail('XML_PRODUCT_ROWS_REQUIRED',400);
 const values=Array.isArray(rows)?rows:[rows];if(values.length>MAX_IMPORT_ROWS)fail('IMPORT_ROW_LIMIT',400);
 return values.map(v=>{if(!v||typeof v!=='object'||Array.isArray(v))return fail('XML_PRODUCT_ROW_INVALID',400);const row:Input={};for(const[k,value]of Object.entries(v)){if(typeof value==='object')fail('XML_NESTED_PRODUCT_UNSUPPORTED',400);row[k]=String(value??'');}return row;});
}
export async function parseImport(content:string,format:'CSV'|'XML',mappingInput?:unknown):Promise<{rows:ParsedRow[];mapping:ImportMapping;columns:string[]}> {
 if(typeof content!=='string'||!content.trim()||Buffer.byteLength(content)>MAX_IMPORT_BYTES||content.includes('\u0000'))fail('IMPORT_FILE_INVALID',400);
 let rows:Input[]=[];
 if(format==='XML'){
  if(!/^\s*(<\?xml\b[^>]*>\s*)?</i.test(content))fail('IMPORT_MIME_MISMATCH',400);
  rows=xmlRecords(content);
 }else{
  if(/^\s*</.test(content))fail('IMPORT_MIME_MISMATCH',400);
  const parser=parse({bom:true,columns:(columns:string[])=>{if(columns.length>64||new Set(columns).size!==columns.length||columns.some(x=>!x||x.length>120))fail('CSV_COLUMNS_INVALID',400);return columns;},skip_empty_lines:true,relax_column_count:false,max_record_size:65536});
  const stream=Readable.from([content]).pipe(parser);
  try{for await(const row of stream){rows.push(row as Input);if(rows.length>MAX_IMPORT_ROWS)fail('IMPORT_ROW_LIMIT',400);}}catch(error){if(error instanceof Error&&'code' in error&&String(error.code).startsWith('CSV'))fail('CSV_MALFORMED',400);throw error;}
 }
 if(!rows.length)fail('IMPORT_EMPTY',400);
 const columns=Object.keys(rows[0]);const mapping={...inferMapping(columns),...validateMapping(mappingInput)};
 for(const value of Object.values(mapping))if(!columns.includes(value))fail('MAPPING_COLUMN_MISSING',400);
 const normalized=rows.map(raw=>normalizeRow(raw,mapping));const seen=new Set<string>();
 for(const row of normalized){const id=row.normalized.sourceId;if(seen.has(id)){row.issues.push({severity:'ERROR',code:'DUPLICATE_SOURCE_ID',message:'Duplicate supplier variant identity within this file.'});row.outcome='RED';}seen.add(id);}
 return {rows:normalized,mapping,columns};
}
export function escapeCSVCell(value:unknown):string{let cell=String(value??'');if(/^[\s\u0000-\u001f]*[=+\-@]/.test(cell))cell="'"+cell;return /[",\r\n]/.test(cell)?'"'+cell.replace(/"/g,'""')+'"':cell;}
export function exportCSV(rows:Input[],columns:string[]):string{return [columns.map(escapeCSVCell).join(','),...rows.map(row=>columns.map(key=>escapeCSVCell(row[key])).join(','))].join('\r\n');}
