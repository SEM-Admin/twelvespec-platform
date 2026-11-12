export type Data = Record<string,unknown>;
export type Row = { id:string;title:string;status:string;data:Data;revision?:number;created_at?:string;owner_id?:string;[key:string]:unknown };
export type Variant = {id:string;color:string;hex:string;size?:string;image?:string;sku?:string};
export type Product = {id:string;title:string;description?:string;category?:string;brand?:string;minimumQuantity?:number;leadTime?:string;methods?:string[];locations?:string[];variants:Variant[];image?:string;status?:string;priceLabel?:string;[key:string]:unknown};
export type PublicData={products:Product[];stores:Row[];bundles:Row[]};
export type Session={actor:{userId:string;role:string;workspaceId:string;email?:string};user?:{name?:string;email?:string}};
export type AccountData={tables:Record<string,Row[]>};
export type CartLine={productId:string;variantId:string;quantity:number;method:string;location:string;designVersionId?:string;storeId?:string;brandKitId?:string;catalogRevision?:number;notes?:string;specifications?:Data};
export type Command=(module:string,action:string,input:Data)=>Promise<unknown>;
export const designSelectionKey=(v:{productId:unknown;variantId:unknown;method:unknown;location:unknown})=>JSON.stringify([v.productId,v.variantId,v.method,v.location]);
export function stringValue(value:unknown,fallback=''){return typeof value==='string'?value:typeof value==='number'?String(value):fallback;}
export function numberValue(value:unknown,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback;}
export function record(value:unknown):Data{return value&&typeof value==='object'&&!Array.isArray(value)?value as Data:{};}
export function rows(value:unknown):Row[]{return Array.isArray(value)?value as Row[]:[];}
export function money(value:unknown,currency='USD'){const n=Number(value);if(value===undefined||value===null||value===''||!Number.isFinite(n))return 'Pending quote';try{return new Intl.NumberFormat('en-US',{style:'currency',currency}).format(n);}catch{return n.toFixed(2);}}
export function displayStatus(s:string){return s.replace(/_/g,' ').toLowerCase();}
