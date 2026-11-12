import {get,number,fail,type Actor,type Tx,type Input,type Row} from '../../kernel/src';
import {publicProduct} from '../../catalog/src';
import {validateConfiguration} from '../../configuration/src';
import type {ConfigLine} from './line-input';

/** A staged private edit is not the customer's still-published definition. */
export function currentPublishedDefinition(product:Row,variant:Row|null):boolean{
 if(product.status!=='PUBLISHED')return true;
 const value=product.data.publicSnapshot;if(!value||typeof value!=='object'||!Object.keys(value).length)return true;
 const snapshot=value as Input,publishedRevision=Number(snapshot.catalogRevision??snapshot.revision??product.data.publishedRevision);
 if(!Number.isSafeInteger(publishedRevision)||publishedRevision!==product.revision)return false;
 if(variant){const published=Array.isArray(snapshot.variants)?(snapshot.variants as Row[]).find(v=>v.id===variant.id):null;if(!published||published.revision!==variant.revision)return false;}
 return true;
}

export async function validateLine(tx:Tx,a:Actor,line:ConfigLine,requirePublished=true){
 const original=await get(tx,a,'products',line.productId);
 if((requirePublished||line.catalogRevision!==undefined)&&original.status!=='PUBLISHED')fail('PRODUCT_UNAVAILABLE');
 const variants=(await tx.query("select * from app.variants where tenant_id=$1 and workspace_id=$2 and product_id=$3 order by id",[a.tenantId,a.workspaceId,original.id])).rows as Row[];
 if(line.variantId){const variant=await get(tx,a,'variants',line.variantId);if(variant.product_id!==original.id&&variant.data.productId!==original.id)fail('VARIANT_PRODUCT_MISMATCH');}
 const usePublished=original.status==='PUBLISHED'&&(requirePublished||line.catalogRevision!==undefined);
 const published=publicProduct(original,variants);
 let data=original.data,variantData:Input={};
 if(usePublished){
  const snapshot=original.data.publicSnapshot as Input|undefined;
  data=snapshot&&typeof snapshot.product==='object'&&snapshot.product!==null?snapshot.product as Input:snapshot??original.data;
  if(line.catalogRevision!==undefined&&line.catalogRevision!==Number(published.catalogRevision))fail('CATALOG_CHANGED_REVIEW_CART');
  const choices=published.variants as Input[];
  if(choices.length&&!line.variantId)fail('VARIANT_REQUIRED',400);
  if(line.variantId){const chosen=choices.find(v=>v.id===line.variantId);if(!chosen)fail('VARIANT_UNAVAILABLE');variantData=chosen;}
 }else if(line.variantId){
  const variant=await get(tx,a,'variants',line.variantId);
  if(variant.product_id!==original.id&&variant.data.productId!==original.id)fail('VARIANT_PRODUCT_MISMATCH');
  if(variant.status==='ARCHIVED')fail('VARIANT_UNAVAILABLE');variantData=variant.data;
 }
 const minimum=number(data.minimumQuantity??data.moq??1,1);if(line.quantity<minimum)fail('MOQ_NOT_MET');
 const allowed=data.methods??data.decorationMethods;if(Array.isArray(allowed)&&!allowed.includes(line.method))fail('DECORATION_INCOMPATIBLE');
 if(line.method==='embroidery'&&String(data.family??data.category).toUpperCase().includes('PRINT'))fail('DECORATION_INCOMPATIBLE');
 if(Array.isArray(data.locations)&&!data.locations.includes(line.location))fail('LOCATION_INCOMPATIBLE');
 let templateData:Input={};if(data.configurationTemplateId){const template=await get(tx,a,'configuration_templates',data.configurationTemplateId);if(template.status!=='PUBLISHED')fail('CONFIGURATION_TEMPLATE_NOT_PUBLISHED');templateData=template.data;}
 const configResult=validateConfiguration(data,variantData,line,templateData);if(!configResult.valid)fail('CONFIGURATION_INVALID');
 if(line.designVersionId){const design=await get(tx,a,'design_versions',line.designVersionId);const productId=design.product_id??design.data.productId,variantId=design.variant_id??design.data.variantId;if(!productId||(line.variantId&&!variantId))fail('DESIGN_BINDING_UNVERIFIED');if(productId!==line.productId)fail('DESIGN_PRODUCT_MISMATCH');if(line.variantId&&variantId!==line.variantId)fail('DESIGN_VARIANT_MISMATCH');if(design.data.method!==line.method||(design.data.placement as Input|undefined)?.location!==line.location)fail('DESIGN_CONFIGURATION_MISMATCH');}
 return {...original,title:usePublished?String(published.title):original.title,data:{...original.data,...data}};
}
