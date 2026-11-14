import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {create,fail,get,type Actor,type Input,type Row,type Tx} from '../../../kernel/src';
import {WEBSITE_COMPONENTS,type MenuItem,type RichNode,type WebsiteDocument,type WebsiteLink} from '../../../contracts/src/website';
import {activeMedia,type WebsiteSite} from './model';
import type {CapabilityClaim} from '../../../contracts/src/claims';
import {claimSourceChoice,lockClaimEvidence,validateClaimAssertions,visibleClaims,type ClaimSourceChoice} from './claims';

export type ContentReference={column:'asset_id'|'collection_id'|'content_id'|'store_id'|'brand_kit_id'|'evidence_source_id';id:string;placement:string;purpose?:'CONSENT'|'CLAIM_SUPPORT';claimId?:string};
export function documentReferences(doc:WebsiteDocument):ContentReference[]{
 const refs:ContentReference[]=[];
 const add=(column:ContentReference['column'],id:unknown,placement:string,purpose?:'CONSENT')=>{if(typeof id==='string')refs.push({column,id,placement,...(purpose?{purpose}:{})});};
 const link=(value:WebsiteLink|undefined,path:string)=>{if(value?.targetId)add(value.kind==='PAGE'?'content_id':value.kind==='COLLECTION'?'collection_id':'store_id',value.targetId,path);};
 const rich=(nodes:RichNode[],path:string)=>{for(const [n,node]of nodes.entries()){if(node.link)link(node.link,`${path}.${n}.link`);if(node.children)rich(node.children,`${path}.${n}.children`);}};
 const menu=(items:MenuItem[],path:string)=>{for(const [n,item]of items.entries()){link(item.link,`${path}.${n}.link`);add('asset_id',item.featuredAssetId,`${path}.${n}.featuredAssetId`);menu(item.children,`${path}.${n}.children`);}};
 if(doc.documentType==='WEBSITE_NAVIGATION')menu(doc.items,'items');
 if(doc.documentType==='WEBSITE_FOOTER'){for(const [n,g]of doc.groups.entries())g.links.forEach((l,m)=>link(l,`groups.${n}.links.${m}`));doc.legalLinks.forEach((l,n)=>link(l,`legalLinks.${n}`));doc.socialLinks.forEach((l,n)=>link(l,`socialLinks.${n}`));}
 if(doc.documentType==='WEBSITE_THEME')add('brand_kit_id',doc.approvedBrandKitId,'approvedBrandKitId');
 if(doc.documentType==='WEBSITE_PAGE')for(const section of doc.sections){
  const c=section.content,p=`sections.${section.id}`;
  add('asset_id',c.imageAssetId,`${p}.imageAssetId`);add('collection_id',c.collectionId,`${p}.collectionId`);add('brand_kit_id',c.approvedBrandKitId,`${p}.approvedBrandKitId`);add('store_id',c.storeId,`${p}.storeId`);
  for(const key of ['primaryLink','secondaryLink','link'])if(c[key])link(c[key] as WebsiteLink,`${p}.${key}`);
  for(const key of ['collectionIds','solutionPageIds','storeIds'])if(Array.isArray(c[key]))(c[key] as string[]).forEach((id,n)=>add(key==='collectionIds'?'collection_id':key==='solutionPageIds'?'content_id':'store_id',id,`${p}.${key}.${n}`));
  if(section.type==='rich_text_image')rich(c.body as RichNode[],`${p}.body`);
  if(section.type==='faq')for(const [n,item]of (c.entries as {answer:RichNode[]}[]).entries())rich(item.answer,`${p}.entries.${n}`);
  if(section.type==='image_gallery')for(const [n,item]of (c.items as {assetId:string}[]).entries())add('asset_id',item.assetId,`${p}.items.${n}`);
  if(section.type==='testimonials')for(const [n,item]of (c.entries as {consentEvidenceId:string}[]).entries())add('asset_id',item.consentEvidenceId,`${p}.entries.${n}.consentEvidenceId`,'CONSENT');
  if(section.type==='capability_claims')for(const claim of c.entries as CapabilityClaim[])for(const id of claim.sourceIds)refs.push({column:'evidence_source_id',id,placement:`${p}.claims.${claim.id}`,purpose:'CLAIM_SUPPORT',claimId:claim.id});
 }
 return refs;
}
export async function validateDocumentReferences(tx:Tx,a:Actor,site:WebsiteSite,doc:WebsiteDocument,publishing=false){
 if(doc.siteId!==site.id)fail('WEBSITE_SITE_MISMATCH',400);
 if(a.role==='store_admin'&&doc.documentType==='WEBSITE_PAGE'&&doc.sections.some(s=>s.type==='capability_claims'))fail('WEBSITE_CLAIM_INTERNAL_REVIEW_REQUIRED',403);
 if(publishing){validateClaimAssertions(doc);await lockClaimEvidence(tx,site,doc);}
 if(doc.documentType==='WEBSITE_PAGE'){
  if(doc.campaignId)await get(tx,a,'campaigns',doc.campaignId);
  for(const section of doc.sections){
   const definition=WEBSITE_COMPONENTS.find(c=>c.type===section.type)!;
   if(!definition.enabled)fail('WEBSITE_COMPONENT_NOT_ACTIVE',403);
   if(definition.organizationOnly&&!site.store_id)fail('WEBSITE_ORGANIZATION_COMPONENT_REQUIRED',400);
   if(section.content.builtInImage&&!existsSync(resolve(process.env.TWELVESPEC_ROOT??process.cwd(),'apps/shop/public'+String(section.content.builtInImage))))fail('WEBSITE_BUILTIN_IMAGE_NOT_FOUND',400);
   if(section.type==='campaign_window_notice'&&section.content.storeId&&section.content.storeId!==site.store_id)fail('WEBSITE_STORE_SCOPE_MISMATCH',403);
  }
 }
 const refs=documentReferences(doc);
 const evidenceSources=new Map<string,ClaimSourceChoice|null>();
 const publishedClaimIds=new Set(publishing?visibleClaims(doc).map(c=>c.id):[]);
 for(const reference of refs){
  let target:Row;
  if(reference.column==='evidence_source_id'){
   if(!evidenceSources.has(reference.id))evidenceSources.set(reference.id,await claimSourceChoice(tx,site,reference.id));
   const source=evidenceSources.get(reference.id);
   if(!source)fail('WEBSITE_CLAIM_PUBLIC_SOURCE_REQUIRED',409);
   if(publishedClaimIds.has(reference.claimId??'')&&!source.eligible)fail('WEBSITE_CLAIM_EVIDENCE_UNAVAILABLE',409);
   continue;
  }else if(reference.column==='asset_id'){
   target=await get(tx,a,'assets',reference.id);
   if(reference.purpose==='CONSENT'){
    if(target.site_id!==site.id||target.data.kind!=='WEBSITE_CONSENT'||target.status!=='VERIFIED')fail('WEBSITE_CONSENT_EVIDENCE_REQUIRED',400);
   }else if(!activeMedia(target,site.id))fail('WEBSITE_MEDIA_NOT_APPROVED',409);
  }else if(reference.column==='collection_id'){
   target=await get(tx,a,'collections',reference.id);
   if(target.status!=='PUBLISHED'||target.store_id&&target.store_id!==site.store_id)fail('WEBSITE_COLLECTION_NOT_PUBLISHED',409);
  }else if(reference.column==='content_id'){
   target=await get(tx,a,'content_assets',reference.id);
   if(target.site_id!==site.id||target.document_type!=='WEBSITE_PAGE'||target.status==='ARCHIVED')fail('WEBSITE_PAGE_REFERENCE_INVALID',409);
  }else if(reference.column==='store_id'){
   target=await get(tx,a,'stores',reference.id);
   if(target.status!=='ACTIVE'||(!site.store_id&&target.data.visibility!=='PUBLIC')||site.store_id&&target.id!==site.store_id)fail('WEBSITE_STORE_REFERENCE_INVALID',409);
  }else{
   target=await get(tx,a,'brand_kits',reference.id);
   if(!site.store_id)fail('WEBSITE_BRAND_KIT_SCOPE_REQUIRED',403);
   const store=await get(tx,a,'stores',site.store_id);if(store.data.brandKitId!==target.id)fail('WEBSITE_BRAND_KIT_SCOPE_REQUIRED',403);
  }
 }
 if(publishing){const issues=publicationIssues(doc);if(issues.length)fail('WEBSITE_PUBLICATION_INCOMPLETE: '+issues.join('; '),409);}
 return refs;
}
export function publicationIssues(doc:WebsiteDocument):string[]{
 const issues:string[]=[];
 if(!doc.title.trim())issues.push('Document title is required');
 const required=(value:unknown,label:string)=>{if(typeof value!=='string'||!value.trim())issues.push(label+' is required');};
 if(doc.documentType==='WEBSITE_PAGE'){
  required(doc.seo.title,'SEO title');required(doc.seo.description,'SEO description');
  for(const section of doc.sections.filter(s=>s.visible)){
   const c=section.content,label=WEBSITE_COMPONENTS.find(d=>d.type===section.type)?.label??section.type;
   if('heading'in c)required(c.heading,label+' heading');
   for(const key of ['primaryLink','secondaryLink','link'])if(c[key])required((c[key] as WebsiteLink).label,label+' action label');
   if(section.type==='hero'&&!c.imageAssetId&&!c.builtInImage)issues.push('Hero image is required');
   if(c.imageAssetId||c.builtInImage)required(c.imageAlt,label+' image description');
   if(section.type==='product_carousel'&&!c.collectionId)issues.push('Choose a published canonical collection');
   const arrayKey=section.type==='featured_collections'?'collectionIds':section.type==='category_grid'?'categoryIds':section.type==='brand_showcase'?'brandIds':section.type==='image_gallery'?'items':section.type==='testimonials'||section.type==='faq'||section.type==='capability_claims'?'entries':section.type==='solution_cards'?'solutionPageIds':section.type==='store_grid'?'storeIds':null;
   if(arrayKey&&!(c[arrayKey] as unknown[])?.length)issues.push(label+' needs at least one entry');
   if(section.type==='image_gallery')for(const item of c.items as {alt:string}[])required(item.alt,'Gallery image description');
   if(section.type==='testimonials')for(const item of c.entries as {quote:string;publicAttribution:string}[]){required(item.quote,'Testimonial');required(item.publicAttribution,'Public attribution');}
   if(section.type==='faq')for(const item of c.entries as {question:string;answer:RichNode[]}[]){required(item.question,'FAQ question');if(!item.answer.length)issues.push('FAQ answer is required');}
   if(section.type==='campaign_window_notice'&&!c.storeId)issues.push('Program notice must reference its store');
  }
 }
 if(doc.documentType==='WEBSITE_NAVIGATION'){
  const visit=(items:MenuItem[])=>{for(const item of items){required(item.label,'Navigation label');required(item.link.label,'Navigation action label');visit(item.children);}};visit(doc.items);
 }
 return issues;
}
export async function recordDocumentReferences(tx:Tx,a:Actor,siteId:string,revisionId:string,references:ContentReference[]){
 for(const reference of references)await create(tx,a,'content_references',{site_id:siteId,source_revision_id:revisionId,[reference.column]:reference.id,title:reference.placement,status:'ACTIVE',data:{purpose:reference.purpose??'PRESENTATION',placement:reference.placement,...(reference.claimId?{claimId:reference.claimId}:{})}});
}
export function referencedPageIds(doc:WebsiteDocument){return documentReferences(doc).filter(r=>r.column==='content_id').map(r=>r.id);}
