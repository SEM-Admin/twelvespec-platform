import {z} from 'zod';
import {authorize,event,fail,get,hash,text,type Actor,type Input,type Tx} from '../../kernel/src';
import {sourceEvidenceState} from '../../intelligence/src';
import {evidenceLibrary,evidenceOptions} from '../../intelligence/src/library';

export const PROFILE_VERSION='process-planning/1';
const profileSchema=z.object({
 profileKey:z.string().trim().min(1).max(200),title:z.string().trim().min(1).max(200),sourceId:z.string().uuid(),previousProfileId:z.string().uuid().optional(),
 productId:z.string().uuid(),variantId:z.string().uuid(),expectedProductRevision:z.number().int().positive(),expectedVariantRevision:z.number().int().positive(),
 producerReference:z.string().trim().max(500).nullable(),facilityReference:z.string().trim().max(500).nullable(),substrateReference:z.string().trim().max(500).nullable(),
 method:z.enum(['screen_print','embroidery','digital','sublimation','laser','offset','heat_transfer','none']),location:z.string().trim().min(1).max(100),
 zoneWidthMm:z.number().positive().max(100000).nullable(),zoneHeightMm:z.number().positive().max(100000).nullable(),
 outputContractReference:z.string().trim().max(1000).nullable(),documentationReviewed:z.boolean(),reviewReference:z.string().trim().max(1000).nullable()
}).strict();
export type ProfileData=z.infer<typeof profileSchema>;
export type ProcessProfile={id:string;product_id:string;variant_id:string;product_revision:number;variant_revision:number;source_id:string;verification:'SYNTHETIC'|'UNVERIFIED'|'DOCUMENTED';fingerprint:string;data:ProfileData;[key:string]:unknown};
export async function recordProcessProfile(tx:Tx,a:Actor,input:Input):Promise<ProcessProfile>{
 authorize(a,'orders','record_process_profile');const parsed=profileSchema.safeParse(input);if(!parsed.success)fail('PROCESS_PROFILE_INVALID',400);const v=parsed.data;
 const source=await sourceEvidenceState(tx,a,v.sourceId,'INTERNAL_RESEARCH');if(source.reasons.length)fail('PROCESS_PROFILE_SOURCE_UNAVAILABLE');
 const product=await get(tx,a,'products',v.productId),variant=await get(tx,a,'variants',v.variantId);
 if(variant.product_id!==product.id)fail('PROCESS_PROFILE_VARIANT_MISMATCH');
 if(product.revision!==v.expectedProductRevision||variant.revision!==v.expectedVariantRevision)fail('PROCESS_PROFILE_REVISION_CONFLICT');
 if(!Array.isArray(product.data.methods)||!product.data.methods.includes(v.method)||!Array.isArray(product.data.locations)||!product.data.locations.includes(v.location))fail('PROCESS_PROFILE_CONFIGURATION_MISMATCH');
 if(v.documentationReviewed&&!v.reviewReference)fail('PROCESS_PROFILE_REVIEW_REFERENCE_REQUIRED',400);
 let versionNumber=1;
 if(v.previousProfileId){const previous=await readProcessProfile(tx,a,v.previousProfileId);if(previous.product_id!==product.id||previous.variant_id!==variant.id)fail('PROCESS_PROFILE_PREDECESSOR_MISMATCH');versionNumber=Number(previous.version_number)+1;}
 const fingerprint=hash(v);
 await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`${a.tenantId}/${a.workspaceId}/process-profile/${v.profileKey}`]);
 const previous=(await tx.query('select * from app.process_profile_versions where tenant_id=$1 and workspace_id=$2 and profile_key=$3',[a.tenantId,a.workspaceId,v.profileKey])).rows[0];
 if(previous){if(previous.fingerprint!==fingerprint)fail('PROCESS_PROFILE_KEY_CONFLICT');return previous;}
 const verification=source.source.origin==='SYNTHETIC'?'SYNTHETIC':v.documentationReviewed?'DOCUMENTED':'UNVERIFIED';
 const row=(await tx.query(`insert into app.process_profile_versions(tenant_id,workspace_id,created_by,profile_key,title,product_id,variant_id,product_revision,variant_revision,source_id,previous_profile_id,version_number,verification,data,fingerprint)
 values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)returning *`,[a.tenantId,a.workspaceId,a.userId,v.profileKey,v.title,product.id,variant.id,product.revision,variant.revision,source.source.id,v.previousProfileId??null,versionNumber,verification,v,fingerprint])).rows[0];
 await event(tx,a,'production.process_profile_recorded',row.id,{version:PROFILE_VERSION,verification});return row;
}
export async function readProcessProfile(tx:Tx,a:Actor,id:unknown):Promise<ProcessProfile>{
 if(!['owner','operations','sales','manager','integration_admin','buyer','finance'].includes(a.role))fail('PROCESS_PROFILE_ACCESS_DENIED',403);
 const row=(await tx.query('select * from app.process_profile_versions where tenant_id=$1 and workspace_id=$2 and id=$3',[a.tenantId,a.workspaceId,text(id)])).rows[0];
 if(!row)fail('PROCESS_PROFILE_NOT_FOUND',404);return row;
}
export async function processProfileLibrary(tx:Tx,a:Actor,input:Input){
 if(!['owner','operations','sales','manager','integration_admin','buyer','finance'].includes(a.role))fail('PROCESS_PROFILE_ACCESS_DENIED',403);
 const schema=z.object({page:z.number().int().min(1).max(100000).default(1),productId:z.string().uuid().optional(),variantId:z.string().uuid().optional(),search:z.string().max(200).default('')}).strict(),parsed=schema.safeParse(input);
 if(!parsed.success)fail('PROCESS_PROFILE_QUERY_INVALID',400);const v=parsed.data,params:unknown[]=[a.tenantId,a.workspaceId],where=['p.tenant_id=$1','p.workspace_id=$2'];
 const bind=(value:unknown)=>{params.push(value);return '$'+params.length;};
 if(v.productId)where.push('p.product_id='+bind(v.productId));if(v.variantId)where.push('p.variant_id='+bind(v.variantId));
 if(v.search)where.push('p.title ilike '+bind('%'+v.search.replace(/[\\%_]/g,'\\$&')+'%'));
 const condition=where.join(' and '),total=Number((await tx.query(`select count(*) n from app.process_profile_versions p where ${condition}`,params)).rows[0].n);
 const rows=(await tx.query(`select p.*,product.title as product_title,v.title as variant_title from app.process_profile_versions p join app.products product on product.tenant_id=p.tenant_id and product.workspace_id=p.workspace_id and product.id=p.product_id join app.variants v on v.tenant_id=p.tenant_id and v.workspace_id=p.workspace_id and v.id=p.variant_id where ${condition} order by p.created_at desc,p.id limit 20 offset $${params.length+1}`,[...params,(v.page-1)*20])).rows;
 return {rows,total,page:v.page,totalPages:Math.max(1,Math.ceil(total/20))};
}
export async function processProfileContext(tx:Tx,a:Actor,input:Input){
 authorize(a,'orders','record_process_profile');
 const schema=z.object({search:z.string().max(200).default(''),page:z.number().int().positive().default(1),productId:z.string().uuid().optional(),variantPage:z.number().int().positive().default(1),variantSearch:z.string().max(200).default(''),sourcePage:z.number().int().positive().default(1),sourceSearch:z.string().max(200).default('')}).strict(),parsed=schema.safeParse(input);
 if(!parsed.success)fail('PROCESS_PROFILE_QUERY_INVALID',400);const {sourcePage,sourceSearch,...pickers}=parsed.data;
 const options=await evidenceOptions(tx,a,pickers,true),sources=await evidenceLibrary(tx,a,{kind:'sources',page:sourcePage,search:sourceSearch});
 let configuration:Input|null=null;if(pickers.productId){const product=await get(tx,a,'products',pickers.productId);configuration={id:product.id,revision:product.revision,methods:product.data.methods,locations:product.data.locations};}
 return {...options,sources,configuration};
}
