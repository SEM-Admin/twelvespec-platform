import Decimal from 'decimal.js';
import {fail,text,type Input} from '../../kernel/src';

const object=(v:unknown):Input=>v&&typeof v==='object'&&!Array.isArray(v)?v as Input:fail('SAGE_DETAIL_SCHEMA',502);
const optionalText=(v:unknown,max=500)=>v===undefined||v===null||v===''?'':text(String(v),max);
function values(v:unknown):string[]{if(v===undefined)return [];if(!Array.isArray(v)||v.length>100)fail('SAGE_DETAIL_SCHEMA',502);return v.map(x=>optionalText(x,100));}
function amount(v:unknown):string|null{if(v===undefined||v===null||v==='')return null;try{const n=new Decimal(String(v));if(!n.isFinite()||n.isNegative()||n.decimalPlaces()>6)throw new Error();return n.toFixed(4);}catch{return fail('SAGE_PRICE_SCHEMA',502);}}
function picture(value:unknown,productId:string){
 const v=object(value);let url:URL;try{url=new URL(String(v.url));}catch{return fail('SAGE_IMAGE_REFERENCE_INVALID',502);}
 if(url.protocol!=='https:'||url.hostname!=='www.promoplace.com'||url.pathname!=='/ws/ws.dll/QPic'||url.username||url.password||url.hash||url.port||url.searchParams.get('P')!==productId||[...url.searchParams.keys()].some(k=>!['SN','P','RS','I'].includes(k))||[...url.searchParams.values()].some(x=>!/^\d{1,12}$/.test(x)))fail('SAGE_IMAGE_REFERENCE_INVALID',502);
 return {index:Number(v.index),caption:optionalText(v.caption,500),url:url.toString(),hasLogo:v.hasLogo===1,kind:v.hasLogo===0?'BLANK_CANDIDATE':'BRANDED_REFERENCE',rightsStatus:'UNREVIEWED'};
}
/** Module104 and105 v130, supplied current portal contracts. All pricing remains private evidence. */
export function normalizeSageDetail(raw:unknown,expectedId:unknown,full:boolean):Input {
 const root=object(raw);if(root.ok===false||Number(root.ErrNum??0)!==0)fail('SAGE_REQUEST_REJECTED',502);
 const p=object(root.product),id=String(p.prodEId??p.prodEid??'');if(id!==String(expectedId))fail('SAGE_PRODUCT_ID_MISMATCH',502);
 const quantities=values(p.qty),retail=values(p.prc),catalog=values(p.catPrc),net=full?values(p.net):[],pieces=values(p.piecesPerUnit);
 if(!quantities.length||retail.length!==quantities.length||catalog.length&&catalog.length!==quantities.length||net.length&&net.length!==quantities.length||pieces.length&&pieces.length!==quantities.length)fail('SAGE_PRICE_TIERS_MISMATCH',502);
 const priceTiers:Input[]=[];let last=0;
 quantities.forEach((q,index)=>{const quantity=Number(q);if(!Number.isSafeInteger(quantity)||quantity<0)fail('SAGE_QUANTITY_INVALID',502);if(quantity===0)return;if(quantity<=last)fail('SAGE_QUANTITY_INVALID',502);last=quantity;
  const units=pieces[index]?Number(pieces[index]):null;if(units!==null&&(!Number.isSafeInteger(units)||units<1))fail('SAGE_PIECES_PER_UNIT_INVALID',502);
  priceTiers.push({quantity,displayPrice:amount(retail[index]),catalogPrice:amount(catalog[index]),netCost:full?amount(net[index]):null,piecesPerUnit:units});
 });
 if(!priceTiers.length)fail('SAGE_QUANTITY_INVALID',502);
 const currency=optionalText(p.currency,3);if(!/^[A-Z]{3}$/.test(currency))fail('SAGE_CURRENCY_INVALID',502);
 const options=p.options===undefined?[]:p.options;if(!Array.isArray(options)||options.length>100)fail('SAGE_OPTIONS_SCHEMA',502);
 const normalizedOptions=options.map(rawOption=>{const o=object(rawOption);if(!Array.isArray(o.values)||o.values.length>200)fail('SAGE_OPTIONS_SCHEMA',502);return {name:text(o.name,200),pricingIsTotal:o.pricingIsTotal===1,priceCode:optionalText(o.priceCode,100),values:o.values.map(rawValue=>{const v=object(rawValue);return {value:text(v.value,500),prices:values(v.prc).map(amount),net:full?values(v.net).map(amount):[]};})};});
 const pics=p.pics??[];if(!Array.isArray(pics)||pics.length>100)fail('SAGE_PICTURES_SCHEMA',502);
 const expiresOn=optionalText(p.expDate,10);if(expiresOn&&!/^\d{4}-\d{2}-\d{2}$/.test(expiresOn))fail('SAGE_EXPIRY_SCHEMA',502);
 const supplier=full&&p.supplier?object(p.supplier):{};
 return {id,name:text(p.prName,500),brand:optionalText(p.lineName,200),sku:optionalText(p.itemNum,200),spc:optionalText(p.spc,100),category:optionalText(p.category,500),description:optionalText(p.description,10000),dimensions:optionalText(p.dimensions,1000),colors:optionalText(p.colors,2000),currency,minimumQuantity:priceTiers[0].quantity,priceTiers,options:normalizedOptions,priceCode:optionalText(p.priceCode,100),catalogPriceCode:optionalText(p.catPriceCode,100),priceAdjustMessage:optionalText(p.priceAdjustMsg,2000),setupCharge:amount(p.setupChg),priceIncludes:optionalText(p.priceIncludes,1000),decorationMethod:optionalText(p.decorationMethod,1000),decorationNotOffered:p.decorationNotOffered===1,productionTime:optionalText(p.prodTime,1000),imprintArea:optionalText(p.imprintArea,1000),imprintLocation:optionalText(p.imprintLoc,1000),supplierId:optionalText(p.suppId,100),supplierName:optionalText(supplier.coName,500),pictures:pics.map(v=>picture(v,id)),expiresOn:expiresOn||null,costCoverage:full&&net.length?'EXPLICIT_NET_TIERS':'NET_COST_UNKNOWN',freight:null,tax:null,customerPrice:null,legalNote:optionalText(root.legalNote,2000)};
}
