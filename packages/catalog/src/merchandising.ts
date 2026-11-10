import {z} from 'zod';
import {create,event,fail,get,update,type Actor,type Input,type Row,type Tx} from '../../kernel/src';

const collectionSchema=z.object({id:z.uuid().optional(),expectedRevision:z.number().int().positive().optional(),siteId:z.uuid(),title:z.string().trim().min(1).max(160),slug:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(120),description:z.string().max(2000),seoTitle:z.string().max(70),seoDescription:z.string().max(180),industries:z.array(z.string().max(80)).max(20).default([]),solutions:z.array(z.string().max(80)).max(20).default([]),occasions:z.array(z.string().max(80)).max(20).default([]),items:z.array(z.object({productId:z.uuid(),variantId:z.uuid().optional(),hidden:z.boolean().default(false),featured:z.boolean().default(false)}).strict()).max(500)}).strict();

/** Collection membership belongs to Catalog; no copied products or prices. */
export async function saveWebsiteCollection(tx:Tx,a:Actor,input:Input){
 const parsed=collectionSchema.safeParse(input);if(!parsed.success)fail('CATALOG_COLLECTION_INPUT_INVALID',400);const i=parsed.data;
 const site=await get(tx,a,'websites',i.siteId);
 if(!(await tx.query('select app.website_can($1,$2,$3,$4,$5) allowed',[a.tenantId,a.workspaceId,site.id,site.store_id,'MERCHANDISE'])).rows[0]?.allowed)fail('CATALOG_MERCHANDISING_PERMISSION_REQUIRED',403);
 if(new Set(i.items.map(item=>item.productId)).size!==i.items.length)fail('CATALOG_COLLECTION_DUPLICATE_PRODUCT',400);
 const records:Row[]=[];
 for(const item of i.items){
  const product=await get(tx,a,'products',item.productId);if(product.status!=='PUBLISHED')fail('CATALOG_COLLECTION_PUBLISHED_PRODUCT_REQUIRED');
  if(item.variantId){const variant=await get(tx,a,'variants',item.variantId);if(variant.product_id!==product.id||variant.status==='ARCHIVED')fail('CATALOG_COLLECTION_VARIANT_MISMATCH');}
  if(site.store_id){const assignment=await tx.query("select 1 from app.store_products where tenant_id=$1 and workspace_id=$2 and store_id=$3 and product_id=$4 and status='ACTIVE'",[a.tenantId,a.workspaceId,site.store_id,product.id]);if(!assignment.rowCount)fail('PRODUCT_NOT_IN_STORE',403);}
  records.push(product);
 }
 let collection:Row;
 const data={description:i.description,slug:i.slug,seoTitle:i.seoTitle,seoDescription:i.seoDescription,industries:i.industries,solutions:i.solutions,occasions:i.occasions,productIds:i.items.filter(item=>!item.hidden).map(item=>item.productId),membershipSource:'COLLECTION_PRODUCTS',publishedBy:a.userId,publishedAt:new Date().toISOString()};
 if(i.id){const old=await get(tx,a,'collections',i.id,true);if((old.store_id??null)!==(site.store_id??null))fail('CATALOG_COLLECTION_SCOPE_MISMATCH',403);if(i.expectedRevision!==old.revision)fail('REVISION_CONFLICT');collection=await update(tx,a,'collections',old.id,{title:i.title,status:'PUBLISHED',expectedRevision:i.expectedRevision,data});}
 else collection=await create(tx,a,'collections',{title:i.title,status:'PUBLISHED',...(site.store_id?{store_id:site.store_id}:{}),data});
 await tx.query("update app.collection_products set status='REMOVED',revision=revision+1,updated_at=now() where tenant_id=$1 and workspace_id=$2 and collection_id=$3",[a.tenantId,a.workspaceId,collection.id]);
 for(const [rank,item]of i.items.entries()){
  const existing=(await tx.query('select id from app.collection_products where tenant_id=$1 and workspace_id=$2 and collection_id=$3 and product_id=$4',[a.tenantId,a.workspaceId,collection.id,item.productId])).rows[0];
  if(existing)await tx.query('update app.collection_products set title=$4,status=$5,data=$6,variant_id=$7,revision=revision+1,updated_at=now() where tenant_id=$1 and workspace_id=$2 and id=$3',[a.tenantId,a.workspaceId,existing.id,records[rank].title,item.hidden?'HIDDEN':'ACTIVE',{rank,featured:item.featured},item.variantId??null]);
  else await create(tx,a,'collection_products',{title:records[rank].title,status:item.hidden?'HIDDEN':'ACTIVE',collection_id:collection.id,product_id:item.productId,...(item.variantId?{variant_id:item.variantId}:{}),data:{rank,featured:item.featured}});
 }
 await event(tx,a,'catalog.collection_published',collection.id,{siteId:site.id,count:i.items.length,canonicalProductsReused:true});return collection;
}
