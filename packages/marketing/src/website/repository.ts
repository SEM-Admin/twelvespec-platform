import {pool,type Input,type Row,type Tx} from '../../../kernel/src';
import {publicProduct} from '../../../catalog/src';
import {type FooterDocument,type NavigationDocument,type PageDocument,type PublicWebsiteCollection,type PublicWebsiteProduct,type ResolvedWebsite,type ThemeDocument,type WebsiteDocument,type WebsiteLink} from '../../../contracts/src/website';
import {defaultWebsiteDocuments} from './defaults';
import {activeMedia,type ReleaseManifest,type WebsiteRevision,type WebsiteSite} from './model';
import {documentReferences} from './references';
import {publicClaimEntries} from './claims';

export type WebsiteIdentity={tenantId:string;workspaceId:string;userId?:string};
/** Only server-validated session identity may populate userId. Anonymous stays empty. */
export async function withWebsiteReader<T>(identity:WebsiteIdentity,read:(tx:Tx)=>Promise<T>):Promise<T>{
 const tx=await pool().connect();try{
  await tx.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');await tx.query('SET LOCAL ROLE ts_website_reader');
  await tx.query("select set_config('ts.web_tenant',$1,true),set_config('ts.web_workspace',$2,true),set_config('ts.web_user',$3,true)",[identity.tenantId,identity.workspaceId,identity.userId??'']);
  await tx.query("select set_config('ts.website_claim_reader','1',true)");
  const result=await read(tx);await tx.query('COMMIT');return result;
 }catch(e){await tx.query('ROLLBACK');throw e;}finally{tx.release();}
}
function asProduct(row:Row,variants:Row[]=[]):PublicWebsiteProduct{
 const p=publicProduct(row,variants);
 return {id:String(p.id),title:String(p.title),description:String(p.description),category:String(p.category),brand:String(p.brand),minimumQuantity:Number(p.minimumQuantity),image:typeof p.image==='string'?p.image:null,variants:(p.variants as PublicWebsiteProduct['variants']).map(v=>({id:v.id,color:v.color,hex:v.hex,size:v.size,image:v.image??null}))};
}
export async function publicCatalogPage(tx:Tx,identity:WebsiteIdentity,input:Input={}){
 const page=Math.max(1,Math.floor(Number(input.page)||1)),pageSize=Math.min(48,Math.max(1,Math.floor(Number(input.pageSize)||12)));
 const query=typeof input.search==='string'?input.search.trim().slice(0,200):'',category=typeof input.category==='string'?input.category.slice(0,100):'',brand=typeof input.brand==='string'?input.brand.slice(0,100):'',method=typeof input.method==='string'?input.method.slice(0,80):'',moq=Number(input.moq)||0;
 const collection=typeof input.collection==='string'?input.collection.slice(0,120):'',storeId=typeof input.storeId==='string'?input.storeId:'',productId=typeof input.productId==='string'?input.productId:'';
 const field=(name:string)=>`coalesce(p.data->'publicSnapshot'->'product'->>'${name}',p.data->'publicSnapshot'->>'${name}',p.data->>'${name}','')`;
 const values:unknown[]=[identity.tenantId,identity.workspaceId];const where=['p.tenant_id=$1','p.workspace_id=$2',"p.status='PUBLISHED'"];
 const param=(value:unknown)=>{values.push(value);return '$'+values.length;};
 if(query){const p=param('%'+query.replace(/[\\%_]/g,'\\$&')+'%');where.push(`(coalesce(p.data->'publicSnapshot'->>'title',p.title) ilike ${p} or ${field('description')} ilike ${p} or ${field('brand')} ilike ${p})`);}
 if(category)where.push(`${field('category')}=${param(category)}`);
 if(brand)where.push(`${field('brand')}=${param(brand)}`);
 if(method)where.push(`coalesce(p.data->'publicSnapshot'->'product'->'methods',p.data->'publicSnapshot'->'methods',p.data->'methods','[]'::jsonb) ? ${param(method)}`);
 if(moq>0)where.push(`nullif(${field('minimumQuantity')},'')::numeric<=${param(moq)}`);
 if(productId)where.push(`p.id::text=${param(productId)}`);
 if(storeId)where.push(`exists(select 1 from app.store_products sp where sp.product_id=p.id and sp.store_id::text=${param(storeId)} and sp.status='ACTIVE')`);
 let collectionParam='';
 if(collection){const c=param(collection);collectionParam=c;where.push(`exists(select 1 from app.collection_products cp join app.collections c on c.id=cp.collection_id where cp.product_id=p.id and cp.status='ACTIVE' and c.status='PUBLISHED' and (c.id::text=${c} or c.data->>'slug'=${c}))`);}
 const condition=where.join(' and ');const total=Number((await tx.query(`select count(*)::int total from app.products p where ${condition}`,values)).rows[0].total);
 const sort=input.sort==='name'?"coalesce(p.data->'publicSnapshot'->>'title',p.title),p.id":input.sort==='moq'?`nullif(${field('minimumQuantity')},'')::numeric,p.id`:collection?`(select min((cp.data->>'rank')::integer) from app.collection_products cp join app.collections c on c.id=cp.collection_id where cp.product_id=p.id and cp.status='ACTIVE' and (c.id::text=${collectionParam} or c.data->>'slug'=${collectionParam})),p.id`:'p.created_at,p.id';
 const rows=(await tx.query(`select p.* from app.products p where ${condition} order by ${sort} limit $${values.length+1} offset $${values.length+2}`,[...values,pageSize,(page-1)*pageSize])).rows as Row[];
 const variants=rows.length?(await tx.query("select * from app.variants where tenant_id=$1 and workspace_id=$2 and product_id=any($3::uuid[]) and status<>'ARCHIVED' order by product_id,id",[identity.tenantId,identity.workspaceId,rows.map(r=>r.id)])).rows as Row[]:[];
 const facets=(await tx.query(`select distinct ${field('category')} category,${field('brand')} brand from app.products p where p.tenant_id=$1 and p.workspace_id=$2 and p.status='PUBLISHED'`,[identity.tenantId,identity.workspaceId])).rows as {category:string;brand:string}[];
 return {products:rows.map(row=>({...publicProduct(row,variants.filter(v=>v.product_id===row.id))})),page,pageSize,total,totalPages:Math.max(1,Math.ceil(total/pageSize)),facets:{categories:[...new Set(facets.map(f=>f.category).filter(Boolean))].sort(),brands:[...new Set(facets.map(f=>f.brand).filter(Boolean))].sort()}};
}
export async function publicWebsiteCollection(tx:Tx,site:WebsiteSite,id:string):Promise<PublicWebsiteCollection|null>{
 const collection=(await tx.query("select * from app.collections where tenant_id=$1 and workspace_id=$2 and id=$3 and status='PUBLISHED'",[site.tenant_id,site.workspace_id,id])).rows[0] as Row|undefined;
 if(!collection||collection.store_id&&collection.store_id!==site.store_id)return null;
 const rows=(await tx.query(`select p.*,cp.variant_id as featured_variant_id from app.collection_products cp join app.products p on p.id=cp.product_id and p.tenant_id=cp.tenant_id and p.workspace_id=cp.workspace_id
  where cp.tenant_id=$1 and cp.workspace_id=$2 and cp.collection_id=$3 and cp.status='ACTIVE' and p.status='PUBLISHED'
  ${site.store_id?"and exists(select 1 from app.store_products sp where sp.store_id=$4 and sp.product_id=p.id and sp.status='ACTIVE')":''}
  order by (cp.data->>'rank')::integer,cp.id limit 500`,[site.tenant_id,site.workspace_id,id,...(site.store_id?[site.store_id]:[])])).rows as Row[];
 const variants=rows.length?(await tx.query("select * from app.variants where tenant_id=$1 and workspace_id=$2 and product_id=any($3::uuid[]) and status<>'ARCHIVED'",[site.tenant_id,site.workspace_id,rows.map(r=>r.id)])).rows as Row[]:[];
 const products=rows.map(row=>{const p=asProduct(row,variants.filter(v=>v.product_id===row.id));if(row.featured_variant_id){const chosen=p.variants.find(v=>v.id===row.featured_variant_id);if(chosen){p.variants=[chosen,...p.variants.filter(v=>v.id!==chosen.id)];p.image=chosen.image??p.image;}}return p;});
 return {id:collection.id,title:collection.title,description:String(collection.data.description??''),slug:String(collection.data.slug??collection.id),products};
}
export const websiteLinkKey=(link:WebsiteLink)=>link.kind+':'+(link.targetId??link.href??'');
export async function resolveWebsite(tx:Tx,site:WebsiteSite,revisions:WebsiteRevision[],path:string,preview=false):Promise<ResolvedWebsite>{
 const docs=revisions.map(r=>({record:r,document:structuredClone(r.data.document)}));const defaults=defaultWebsiteDocuments(site.id);
 const global=<T extends WebsiteDocument>(type:T['documentType'])=>(docs.find(d=>d.document.documentType===type)?.document??defaults.find(d=>d.documentType===type)) as T;
 const pageDoc=docs.find(d=>d.document.documentType==='WEBSITE_PAGE'&&d.document.path===path);
 const page=pageDoc?.document as PageDocument|undefined;const pages:ResolvedWebsite['pages']={};
 for(const {record,document}of docs)if(document.documentType==='WEBSITE_PAGE')pages[record.content_id]={id:record.content_id,title:document.title,path:site.store_id?`/stores/${site.store_id}${document.path==='/'?'':document.path}`:document.path,description:document.seo.description};
 const navigation=global<NavigationDocument>('WEBSITE_NAVIGATION'),footer=global<FooterDocument>('WEBSITE_FOOTER'),theme=global<ThemeDocument>('WEBSITE_THEME');
 const relevant=[...(page?[page]:[]),navigation,footer,theme];const references=relevant.flatMap(documentReferences);
 const media:ResolvedWebsite['media']={};
 const assets=[...new Set(references.filter(r=>r.column==='asset_id'&&r.purpose!=='CONSENT').map(r=>r.id))];
 if(assets.length){
  const rows=(await tx.query('select id,title,status,data,site_id from app.assets where tenant_id=$1 and workspace_id=$2 and id=any($3::uuid[])',[site.tenant_id,site.workspace_id,assets])).rows as Row[];
  for(const row of rows)if(activeMedia(row,site.id))media[row.id]={url:`/api/website/media/${row.id}${preview?'?preview=1&workspaceId='+site.workspace_id:''}`,alt:String(row.data.alt??''),width:Number(row.data.width),height:Number(row.data.height)};
 }
 const collections:ResolvedWebsite['collections']={};
 for(const id of new Set(references.filter(r=>r.column==='collection_id').map(r=>r.id))){const collection=await publicWebsiteCollection(tx,site,id);if(collection)collections[id]=collection;}
 const stores:ResolvedWebsite['stores']={};
 for(const id of new Set([...references.filter(r=>r.column==='store_id').map(r=>r.id),...(site.store_id?[site.store_id]:[])])){
  const row=(await tx.query("select id,title,data from app.stores where tenant_id=$1 and workspace_id=$2 and id=$3 and status='ACTIVE'",[site.tenant_id,site.workspace_id,id])).rows[0];
  if(row)stores[id]={id:row.id,title:row.title,description:String(row.data.description??''),startsAt:row.data.startsAt??null,closesAt:row.data.closesAt??null};
 }
 if(page){
  delete page.campaignId;page.sections=page.sections.filter(s=>s.visible);
  for(const section of page.sections){
   if(section.type==='capability_claims'){
    section.content.entries=await publicClaimEntries(tx,site,pageDoc!.record.id,section.content.entries as unknown[],preview);
   }
   if(section.type==='testimonials'){
    const entries=section.content.entries as {quote:string;publicAttribution:string;consentEvidenceId:string}[];
    const valid=(await tx.query("select id from app.assets where tenant_id=$1 and workspace_id=$2 and id=any($3::uuid[]) and data->>'kind'='WEBSITE_CONSENT' and status='VERIFIED'",[site.tenant_id,site.workspace_id,entries.map(e=>e.consentEvidenceId)])).rows.map(r=>r.id);
    section.content.entries=entries.filter(e=>valid.includes(e.consentEvidenceId)).map(e=>({quote:e.quote,publicAttribution:e.publicAttribution}));
   }
  }
  page.sections=page.sections.filter(s=>s.type!=='capability_claims'||(s.content.entries as unknown[]).length>0);
 }
 const links:Record<string,string>={};
 const walk=(value:unknown)=>{if(Array.isArray(value)){value.forEach(walk);return;}if(!value||typeof value!=='object')return;const obj=value as Input;
  if(typeof obj.kind==='string'&&typeof obj.label==='string'){
   const link=obj as unknown as WebsiteLink;const target=link.targetId;const href=link.kind==='PAGE'&&target?pages[target]?.path:link.kind==='COLLECTION'&&target&&collections[target]?`/collections/${collections[target].slug}`:link.kind==='STORE'&&target&&stores[target]?`/stores/${target}`:link.href;
   if(href)links[websiteLinkKey(link)]=href;
  }
  Object.values(obj).forEach(walk);
 };relevant.forEach(walk);
 const categoryRows=(await tx.query("select distinct coalesce(data->'publicSnapshot'->'product'->>'category',data->'publicSnapshot'->>'category',data->>'category') category,coalesce(data->'publicSnapshot'->'product'->>'brand',data->'publicSnapshot'->>'brand',data->>'brand') brand from app.products where tenant_id=$1 and workspace_id=$2 and status='PUBLISHED'",[site.tenant_id,site.workspace_id])).rows;
 return {site:{id:site.id,title:site.title,storeId:site.store_id,timezone:String(site.data.timezone??'America/Chicago'),private:site.store_id?!(await tx.query("select 1 from app.stores where id=$1 and data->>'visibility'='PUBLIC'",[site.store_id])).rowCount:false},releaseId:site.active_release_id,generation:site.generation,page:page??null,theme,navigation,footer,links,media,collections,pages,stores,taxonomy:{categories:[...new Set(categoryRows.map(r=>String(r.category??'')))].filter(Boolean).sort(),brands:[...new Set(categoryRows.map(r=>String(r.brand??'')))].filter(Boolean).sort()},preview};
}
export async function readPublishedWebsite(identity:WebsiteIdentity,path:string,storeId?:string){
 return withWebsiteReader(identity,async tx=>{
  const site=(await tx.query(`select * from app.websites where tenant_id=$1 and workspace_id=$2 and ${storeId?'store_id::text=$3':'store_id is null'} and status='ACTIVE'`,[identity.tenantId,identity.workspaceId,...(storeId?[storeId]:[])])).rows[0] as WebsiteSite|undefined;
  if(!site?.active_release_id)return null;
  const release=(await tx.query('select * from app.website_releases where id=$1',[site.active_release_id])).rows[0];if(!release)return null;
  const revisions=(await tx.query('select * from app.content_revisions where site_id=$1 and id=any($2::uuid[])',[site.id,release.data.revisionIds])).rows as WebsiteRevision[];
  const resolved=await resolveWebsite(tx,site,revisions,path);return {...resolved,redirectTo:(release.data.manifest as ReleaseManifest).redirects[path]??null};
 });
}
