import {fail,number,text,type Input} from '../../kernel/src';

export type ConfigLine={productId:string;variantId?:string;quantity:number;method:string;location:string;designVersionId?:string;catalogRevision?:number;notes?:string;specifications?:Input;[key:string]:unknown};
export function safeLines(value:unknown):ConfigLine[] {
 if(!Array.isArray(value)||value.length<1||value.length>100)fail('LINES_REQUIRED',400);
 return value.map(raw=>{
  if(!raw||typeof raw!=='object'||Array.isArray(raw))fail('INVALID_LINE',400);
  const d=raw as Input,quantity=number(d.quantity,1,1000000);
  if(!Number.isSafeInteger(quantity))fail('INVALID_QUANTITY',400);
  const line:ConfigLine={productId:text(d.productId),...(d.variantId?{variantId:text(d.variantId)}:{}),quantity,method:d.method?text(d.method):'none',location:d.location?text(d.location):'front',...(d.designVersionId?{designVersionId:text(d.designVersionId)}:{})};
  if(d.catalogRevision!==undefined){const revision=number(d.catalogRevision,1,1e9);if(!Number.isInteger(revision))fail('CATALOG_REVISION_INVALID',400);line.catalogRevision=revision;}
  if(d.notes!==undefined&&d.notes!=='')line.notes=text(d.notes,2000);
  if(d.specifications!==undefined){
   if(!d.specifications||typeof d.specifications!=='object'||Array.isArray(d.specifications))fail('LINE_SPECIFICATIONS_INVALID',400);
   const values=d.specifications as Input,specifications:Input={};
   for(const key of ['widthMm','heightMm','pageCount','imprintColors','stitchCount'])if(values[key]!==undefined&&values[key]!==''){
    const n=number(values[key],1,key==='stitchCount'?1e7:100000);
    if(['pageCount','imprintColors','stitchCount'].includes(key)&&!Number.isInteger(n))fail('LINE_SPECIFICATIONS_INVALID',400);
    if(key==='imprintColors'&&n>32)fail('LINE_SPECIFICATIONS_INVALID',400);specifications[key]=n;
   }
   for(const key of ['paperStock','finish'])if(values[key]!==undefined&&values[key]!=='')specifications[key]=text(values[key],200);
   if(values.printSides!==undefined&&values.printSides!==''){
    if(!['SINGLE','DOUBLE'].includes(String(values.printSides)))fail('LINE_SPECIFICATIONS_INVALID',400);specifications.printSides=values.printSides;
   }
   if(Object.keys(specifications).length)line.specifications=specifications;
  }
  return line;
 });
}
