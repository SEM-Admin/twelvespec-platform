import {beforeAll,describe,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import {actors} from '../helpers';
import {create,get,hash,transaction,type Actor,type Input,type Row} from '../../packages/kernel/src';
import {handleCatalog,publicProduct} from '../../packages/catalog/src';
import {catalogSourceLibrary,createSourceDraft,stageCatalogSources} from '../../packages/catalog/src/sources';
import {readCatalogImage} from '../../packages/catalog/src/media';
import {handleCommerce} from '../../packages/commerce/src';
import {handleSales,publicQuote,safeLines} from '../../packages/sales/src';

let owner:Actor,customer:Actor,otherOwner:Actor;
beforeAll(async()=>{({owner,customer,otherOwner}=await actors());});
const unique=()=>randomUUID();
const catalog=(action:string,input:Input)=>transaction(owner,tx=>handleCatalog(tx,owner,action,input));
const commerce=(action:string,input:Input)=>transaction(customer,tx=>handleCommerce(tx,customer,action,input));
const sales=(action:string,input:Input)=>transaction(owner,tx=>handleSales(tx,owner,action,input));
async function fixture(){
 return transaction(owner,async tx=>{
  const product=await create(tx,owner,'products',{title:'Reviewed catalog item '+unique(),status:'PUBLISHED',data:{sku:'OWN-'+unique(),brand:'Example brand',category:'APPAREL',description:'Reviewed synthetic fixture',minimumQuantity:12,methods:['none'],locations:['front'],licenseApproved:true,synthetic:true,image:'/products/TS-0001-0.svg'}});
  const variant=await create(tx,owner,'variants',{title:'Navy M',status:'ACTIVE',product_id:product.id,data:{color:'Navy',size:'M',hex:'#123456',image:'/products/TS-0001-0.svg'}});
  return {product,variant,line:{productId:product.id,variantId:variant.id,quantity:12,method:'none',location:'front',catalogRevision:1}};
 });
}
const brief=()=>({projectName:'Customer launch '+unique(),deliveryCountry:'US',deliveryPostalCode:'60601',artworkStatus:'NEED_HELP',company:'Synthetic Studio',notes:'Pack in sets of two.'});

describe('OC-01–03: private source library and owned product drafts',()=>{
 it('deduplicates immutable snapshots and promotes one draft without guessed commercial facts',async()=>{
  const externalId=unique(),source={supplier:'Example supplier',externalId,title:'Source style',description:'Verified source description',environment:'PUBLIC_CATALOG'};
  const staged=await transaction(owner,tx=>stageCatalogSources(tx,owner,{sources:[source],idempotencyKey:unique()}));expect(staged.created).toBe(1);
  const again=await transaction(owner,tx=>stageCatalogSources(tx,owner,{sources:[source],idempotencyKey:unique()}));expect(again.unchanged).toBe(1);
  const library=await transaction(owner,tx=>catalogSourceLibrary(tx,owner,{search:externalId}));expect(library.total).toBe(1);
  const sourceRow=library.items[0] as Row;
  const [draft,repeat]=await Promise.all([transaction(owner,tx=>createSourceDraft(tx,owner,{id:sourceRow.id})),transaction(owner,tx=>createSourceDraft(tx,owner,{id:sourceRow.id}))]);
  expect(repeat.id).toBe(draft.id);expect(draft.source_id).toBe(sourceRow.id);expect(draft.status).toBe('DRAFT');expect(draft.data.minimumQuantity).toBeNull();expect(draft.data.methods).toEqual([]);expect(draft.data.image).toBeNull();expect(draft.data.licenseApproved).toBe(false);
  const preview=await catalog('publish',{ids:[draft.id]}) as Input;expect((preview.blocked as Input[])[0].issues).toEqual(expect.arrayContaining(['MOQ_REQUIRED','VARIANTS_REQUIRED','APPROVED_LOCAL_IMAGE_REQUIRED']));
  await expect(transaction(customer,tx=>catalogSourceLibrary(tx,customer))).rejects.toThrow('PERMISSION_DENIED');await expect(transaction(otherOwner,tx=>createSourceDraft(tx,otherOwner,{id:sourceRow.id}))).rejects.toThrow('NOT_FOUND');
 });
 it('searches and paginates all source records rather than the first generic record page',async()=>{
  const marker=unique(),sources=Array.from({length:25},(_,i)=>({supplier:'Search source',externalId:`${marker}-${i}`,title:`Search source style ${i}`,model:marker,environment:'SYNTHETIC'}));
  await transaction(owner,tx=>stageCatalogSources(tx,owner,{sources,idempotencyKey:unique()}));
  const first=await transaction(owner,tx=>catalogSourceLibrary(tx,owner,{search:marker,page:1,pageSize:20})),second=await transaction(owner,tx=>catalogSourceLibrary(tx,owner,{search:marker,page:2,pageSize:20}));
  expect(first.total).toBe(25);expect(first.items).toHaveLength(20);expect(second.items).toHaveLength(5);expect(first.items.some(r=>second.items.some(s=>s.id===r.id))).toBe(false);
  expect((await transaction(otherOwner,tx=>catalogSourceLibrary(tx,otherOwner,{search:marker}))).total).toBe(0);
 });
 it('accepts source-only CSV without commercial defaults, and rolls back an invalid file',async()=>{
  const marker=unique(),result=await catalog('stage_source_file',{format:'CSV',supplier:'CSV source',content:`styleID,title,brandName,description\n${marker},Known style,Example Brand,<p>Known fabric</p>\n`}) as Input;
  expect(result.created).toBe(1);const library=await transaction(owner,tx=>catalogSourceLibrary(tx,owner,{search:marker}));expect(library.items[0].data.description).toBe('Known fabric');expect(library.items[0].data.pricingCoverage).toBe('UNVERIFIED');
  await expect(catalog('stage_source_file',{format:'CSV',supplier:'CSV source',content:'styleID,title\nvalid-id,Valid\n,Missing identity'})).rejects.toThrow('INVALID_TEXT');
  await expect(catalog('stage_source_file',{format:'CSV',supplier:'CSV source',content:'styleID,styleID,title\nfirst,second,Ambiguous identity'})).rejects.toThrow('SOURCE_CSV_INVALID');
 });
 it('keeps uploaded derivatives private until their exact product snapshot is published',async()=>{
  const {product}=await fixture(),bytes=await sharp({create:{width:8,height:8,channels:3,background:'#123456'}}).png().toBuffer(),content='data:image/png;base64,'+bytes.toString('base64');
  await expect(catalog('save_catalog_image',{productId:product.id,content})).rejects.toThrow('CATALOG_IMAGE_RIGHTS_REVIEW_REQUIRED');
  const image=await catalog('save_catalog_image',{productId:product.id,content,rightsConfirmed:true,fileName:'Approved synthetic photo.png'}) as Input;
  await expect(transaction(customer,tx=>readCatalogImage(tx,customer,String(image.id)))).rejects.toThrow('NOT_FOUND');
  await catalog('update',{id:product.id,data:{image:image.imagePath}});
  const preview=await catalog('publish',{ids:[product.id]}) as Input;await catalog('publish',{ids:[product.id],dryRun:false,previewHash:preview.previewHash,approvalReason:'Synthetic photo rights and exact product reviewed',idempotencyKey:unique()});
  const visible=await transaction(customer,tx=>readCatalogImage(tx,customer,String(image.id)));expect(visible.mimeType).toBe('image/webp');expect(visible.bytes.length).toBeGreaterThan(0);
  await expect(transaction(otherOwner,tx=>readCatalogImage(tx,otherOwner,String(image.id)))).rejects.toThrow('NOT_FOUND');
  const second=await fixture();await catalog('update',{id:second.product.id,data:{image:image.imagePath}});const invalid=await catalog('publish',{ids:[second.product.id]}) as Input;expect((invalid.blocked as Input[])[0].issues).toContain('CATALOG_IMAGE_PRODUCT_REVIEW_REQUIRED');
  await catalog('pause',{id:product.id});await expect(transaction(customer,tx=>readCatalogImage(tx,customer,String(image.id)))).rejects.toThrow('NOT_FOUND');
 });
});

describe('OC-04–07: customer brief, immutable request evidence and reviewed quote',()=>{
 it('persists exact request snapshots and scopes them to the customer; duplicate submission does not duplicate lines',async()=>{
  const {product,variant,line}=await fixture(),cart=await commerce('create',{lines:[{...line,notes:'Use the event palette',specifications:{imprintColors:2},sellTotal:'0.01'}]}) as Row;
  const input={id:cart.id,key:unique(),brief:brief()},request=await commerce('submit_request',input) as Row,repeat=await commerce('submit_request',input) as Row;
  expect(repeat.id).toBe(request.id);expect(request.data.brief).toEqual(expect.objectContaining({deliveryPostalCode:'60601',artworkStatus:'NEED_HELP'}));
  const saved=await transaction(customer,async tx=>(await tx.query('select * from app.request_lines where request_id=$1',[request.id])).rows as Row[]);
  expect(saved).toHaveLength(1);expect((saved[0].data.snapshot as Input).title).toBe(product.title);expect((saved[0].data.snapshot as Input).color).toBe('Navy');expect(saved[0].variant_id).toBe(variant.id);expect(JSON.stringify(saved[0])).not.toContain('sellTotal');
  expect((await transaction(otherOwner,async tx=>tx.query('select id from app.request_lines where request_id=$1',[request.id]))).rowCount).toBe(0);
  await expect(commerce('submit_request',{...input,brief:{...input.brief,notes:'Changed'}})).rejects.toThrow('IDEMPOTENCY_CONFLICT');
  const otherProduct=await fixture();await expect(transaction(owner,tx=>create(tx,owner,'request_lines',{title:'Mismatched variant',request_id:request.id,product_id:product.id,variant_id:otherProduct.variant.id,owner_id:customer.userId,data:{quantity:1}}))).rejects.toMatchObject({code:'23503'});
  await expect(transaction(owner,tx=>create(tx,owner,'request_lines',{title:'Mismatched owner',request_id:request.id,product_id:product.id,variant_id:variant.id,owner_id:owner.userId,data:{quantity:1}}))).rejects.toMatchObject({code:'23503'});
 });
 it('uses the published catalog during draft edits, then detects a changed publication before submission',async()=>{
  const {product,line}=await fixture(),cart=await commerce('create',{lines:[line]}) as Row;
  await catalog('update',{id:product.id,title:'Private unreviewed title',data:{minimumQuantity:500}});
  const after=await transaction(owner,tx=>get(tx,owner,'products',product.id));expect(publicProduct(after).title).toBe(product.title);expect(publicProduct(after).catalogRevision).toBe(1);
  const safe=await commerce('create',{lines:[line]}) as Row;expect(safe.status).toBe('DRAFT');
  const preview=await catalog('publish',{ids:[product.id]}) as Input;
  await catalog('publish',{ids:[product.id],dryRun:false,previewHash:preview.previewHash,approvalReason:'Reviewed synthetic source change',idempotencyKey:unique()});
  await expect(commerce('submit_request',{id:cart.id,key:unique(),brief:brief()})).rejects.toThrow('CATALOG_CHANGED_REVIEW_CART');
 });
 it('prepares one quote, costs exact requested quantities, hides draft prices and issues a reviewed snapshot',async()=>{
  const {line}=await fixture(),cart=await commerce('create',{lines:[line]}) as Row,request=await commerce('submit_request',{id:cart.id,key:unique(),brief:brief()}) as Row;
  const quote=await sales('create',{requestId:request.id}) as Row,repeat=await sales('create',{requestId:request.id,idempotencyKey:unique()}) as Row;expect(repeat.id).toBe(quote.id);expect(quote.request_id).toBe(request.id);expect(quote.owner_id).toBe(customer.userId);
  const config=safeLines(quote.data.lines)[0];
  const input={id:quote.id,expectedRevision:quote.revision,currency:'USD',targetMargin:'0.40',costReference:'PRIVATE reviewed supplier quotation',observedAt:new Date().toISOString(),validUntil:new Date(Date.now()+3600000).toISOString(),lineCosts:[{configurationHash:hash(config),components:{material_cost:'60',decoration_run_cost:'18',setup:'25',prepress:'0',outsourced_labor:'0',packaging:'5',allocated_freight:'12',other_direct_cost:'0'}}],commercialReview:{productOptionsConfirmed:true,availabilityConfirmed:true,deliveryConfirmed:true,deliveryNote:'Reviewed synthetic delivery to 60601; packing included.',taxTreatment:'EXCLUDED'}};
  await expect(transaction(customer,tx=>handleSales(tx,customer,'cost_quote',input))).rejects.toThrow('PERMISSION_DENIED');
  const costed=await sales('cost_quote',input) as Row;expect(costed.status).toBe('READY_TO_ISSUE');expect(costed.data.total).toBe('200.00');expect(publicQuote(costed).data.total).toBeNull();
  const issued=await sales('issue_quote',{id:quote.id,key:unique(),expectedRevision:costed.revision}) as Row;expect(issued.status).toBe('ISSUED');expect(publicQuote(issued).data.total).toBe('200.00');expect(JSON.stringify(publicQuote(issued))).not.toMatch(/PRIVATE|sourceEvidence|landedCost|components/);
  const requestAfter=await transaction(customer,tx=>get(tx,customer,'requests',request.id));expect(requestAfter.status).toBe('QUOTED');expect(issued.data.commercialAssumptions).toEqual(expect.objectContaining({taxTreatment:'EXCLUDED',freightIncluded:true}));
 });
});
