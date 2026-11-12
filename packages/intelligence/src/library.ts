import {z} from 'zod';
import {fail,type Actor,type Input,type Tx} from '../../kernel/src';

const inputSchema=z.object({kind:z.enum(['sources','prices']),page:z.number().int().min(1).max(100000).default(1),search:z.string().max(200).default(''),productId:z.string().uuid().optional()}).strict();
/** Private, explicitly paged evidence; never registered in a public generic table list. */
export async function evidenceLibrary(tx:Tx,a:Actor,input:Input){
 if(!['owner','integration_admin','sales','manager','buyer','finance'].includes(a.role))fail('EVIDENCE_ACCESS_DENIED',403);
 const parsed=inputSchema.safeParse(input);if(!parsed.success)fail('EVIDENCE_QUERY_INVALID',400);const v=parsed.data;
 const params:unknown[]=[a.tenantId,a.workspaceId],where=['e.tenant_id=$1','e.workspace_id=$2'];
 const bind=(value:unknown)=>{params.push(value);return '$'+params.length;};
 const pattern='%'+v.search.replace(/[\\%_]/g,'\\$&')+'%';
 if(v.kind==='sources'){
  if(v.productId)fail('EVIDENCE_QUERY_INVALID',400);
  if(v.search)where.push(`(e.title ilike ${bind(pattern)} or e.publisher ilike ${bind(pattern)} or e.edition ilike ${bind(pattern)})`);
  const condition=where.join(' and '),total=Number((await tx.query(`select count(*) n from app.intelligence_sources e where ${condition}`,params)).rows[0].n);
  const rows=(await tx.query(`select e.*,r.created_at as restricted_at,r.reason as restriction_reason from app.intelligence_sources e left join app.intelligence_restrictions r on r.tenant_id=e.tenant_id and r.workspace_id=e.workspace_id and r.source_id=e.id where ${condition} order by e.created_at desc,e.id limit 20 offset $${params.length+1}`,[...params,(v.page-1)*20])).rows;
  return {rows,page:v.page,total,pageSize:20,totalPages:Math.max(1,Math.ceil(total/20))};
 }
 if(v.productId)where.push(`e.product_id=${bind(v.productId)}`);
 if(v.search)where.push(`(p.title ilike ${bind(pattern)} or s.title ilike ${bind(pattern)} or e.observation_key ilike ${bind(pattern)})`);
 const from='app.price_observations e join app.products p on p.tenant_id=e.tenant_id and p.workspace_id=e.workspace_id and p.id=e.product_id join app.variants v on v.tenant_id=e.tenant_id and v.workspace_id=e.workspace_id and v.id=e.variant_id join app.intelligence_sources s on s.tenant_id=e.tenant_id and s.workspace_id=e.workspace_id and s.id=e.source_id';
 const condition=where.join(' and '),total=Number((await tx.query(`select count(*) n from ${from} where ${condition}`,params)).rows[0].n);
 const rows=(await tx.query(`select e.*,p.title as product_title,v.title as variant_title,s.title as source_title,s.edition as source_edition,s.origin as source_origin,s.rights_valid_until,s.retention_until,r.created_at as restricted_at from ${from} left join app.intelligence_restrictions r on r.tenant_id=e.tenant_id and r.workspace_id=e.workspace_id and r.source_id=e.source_id where ${condition} order by e.created_at desc,e.id limit 20 offset $${params.length+1}`,[...params,(v.page-1)*20])).rows;
 return {rows,page:v.page,total,pageSize:20,totalPages:Math.max(1,Math.ceil(total/20))};
}
export async function evidenceOptions(tx:Tx,a:Actor,input:Input){
 if(!['owner','integration_admin'].includes(a.role))fail('EVIDENCE_ACCESS_DENIED',403);
 const schema=z.object({search:z.string().max(200).default(''),page:z.number().int().min(1).max(100000).default(1),productId:z.string().uuid().optional(),variantSearch:z.string().max(200).default(''),variantPage:z.number().int().min(1).max(100000).default(1),accountSearch:z.string().max(200).default(''),accountPage:z.number().int().min(1).max(100000).default(1)}).strict(),parsed=schema.safeParse(input);
 if(!parsed.success)fail('EVIDENCE_QUERY_INVALID',400);const v=parsed.data,query='%'+v.search.replace(/[\\%_]/g,'\\$&')+'%';
 const scope=[a.tenantId,a.workspaceId],products=(await tx.query("select id,title,revision,status from app.products where tenant_id=$1 and workspace_id=$2 and status<>'ARCHIVED' and title ilike $3 order by title,id limit 50 offset $4",[...scope,query,(v.page-1)*50])).rows;
 const total=Number((await tx.query("select count(*) n from app.products where tenant_id=$1 and workspace_id=$2 and status<>'ARCHIVED' and title ilike $3",[...scope,query])).rows[0].n);
 const literal=(s:string)=>'%'+s.replace(/[\\%_]/g,'\\$&')+'%';
 const variants=v.productId?(await tx.query("select id,product_id,title,revision,data->>'color' as color,data->>'size' as size from app.variants where tenant_id=$1 and workspace_id=$2 and product_id=$3 and status<>'ARCHIVED' and title ilike $4 order by title,id limit 50 offset $5",[...scope,v.productId,literal(v.variantSearch),(v.variantPage-1)*50])).rows:[];
 const variantTotal=v.productId?Number((await tx.query("select count(*) n from app.variants where tenant_id=$1 and workspace_id=$2 and product_id=$3 and status<>'ARCHIVED' and title ilike $4",[...scope,v.productId,literal(v.variantSearch)])).rows[0].n):0;
 const accounts=(await tx.query('select id,title from app.accounts where tenant_id=$1 and workspace_id=$2 and title ilike $3 order by title,id limit 50 offset $4',[...scope,literal(v.accountSearch),(v.accountPage-1)*50])).rows;
 const accountTotal=Number((await tx.query('select count(*) n from app.accounts where tenant_id=$1 and workspace_id=$2 and title ilike $3',[...scope,literal(v.accountSearch)])).rows[0].n);
 return {products,variants,accounts,page:v.page,total,totalPages:Math.max(1,Math.ceil(total/50)),variantPage:v.variantPage,variantTotal,variantTotalPages:Math.max(1,Math.ceil(variantTotal/50)),accountPage:v.accountPage,accountTotal,accountTotalPages:Math.max(1,Math.ceil(accountTotal/50))};
}
