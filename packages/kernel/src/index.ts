import { Pool, type PoolClient } from 'pg';
import { randomUUID, createHash } from 'node:crypto';
import { databaseConfig } from './database-config';
export type Role = 'owner'|'manager'|'staff'|'customer'|'sales'|'catalog_manager'|'designer'|'operations'|'buyer'|'finance'|'marketing'|'integration_admin'|'store_admin';
export type Actor = { userId:string; tenantId:string; workspaceId:string; role:Role; email?:string };
export type Tx = PoolClient;
export type Input = Record<string, unknown>;
export type Row<T extends Input=Input> = { id:string; tenant_id:string; workspace_id:string; owner_id:string; title:string; status:string; data:T; revision:number; created_at:string; updated_at:string; [key:string]:unknown };
export class DomainError extends Error { constructor(public code:string, public status=409, message?:string){super(message??code);} }
export function fail(code:string,status=409):never {throw new DomainError(code,status)}
export const text=(v:unknown,max=500):string=>{if(typeof v!=='string'||!v.trim()||v.length>max) return fail('INVALID_TEXT',400);return v.trim()};
export const number=(v:unknown,min=0,max=1e9):number=>{const n=Number(v);if(!Number.isFinite(n)||n<min||n>max) return fail('INVALID_NUMBER',400);return n};
export const uid=()=>randomUUID();
export const hash=(v:unknown)=>createHash('sha256').update(typeof v==='string'?v:JSON.stringify(v)).digest('hex');
export const TABLES = ['legal_entities','ventures','resource_grants','work_items','exceptions','time_entries','contacts','accounts','opportunities','activities','follow_ups','products','variants','product_families','collections','catalog_revisions','source_records','supplier_offers','connections','capabilities','mapping_profiles','sync_runs','import_batches','import_rows','merge_reviews','configuration_templates','configuration_rules','imprint_areas','saved_configurations','brand_kits','assets','design_projects','design_versions','placements','render_jobs','proofs','preflight_results','production_assets','carts','cart_lines','requests','request_lines','estimates','quote_lines','quotes','quote_revisions','approvals','orders','order_lines','jobs','job_components','operations','qc_checks','production_events','purchase_requirements','sourcing_decisions','purchase_orders','purchase_order_lines','provider_transactions','fulfillment_allocations','shipments','shipment_lines','tracking_events','returns','remakes','actual_costs','invoice_references','payment_references','reconciliations','profit_snapshots','stores','store_memberships','store_products','spending_budgets','allowances','campaigns','bundle_templates','bundle_components','bundle_configurations','content_assets','content_revisions','campaign_segments','publications','attributions','automation_rules','automation_runs','notifications','report_definitions','kpi_snapshots','data_quality_issues','dashboards','outbox_events','audit_events','command_receipts','webhook_receipts','catalog_rollback_manifests','secret_metadata','websites','website_releases','website_publish_jobs','content_references','collection_products'] as const;
export type Table = typeof TABLES[number];
let globalPool:Pool|undefined;
export function pool(){return globalPool??=new Pool(databaseConfig(process.env));}
export async function transaction<T>(a:Actor,fn:(tx:Tx)=>Promise<T>):Promise<T>{
 const tx=await pool().connect();
 try { await tx.query('BEGIN');
 const membership=await tx.query('select role from memberships where user_id=$1 and tenant_id=$2 and workspace_id=$3',[a.userId,a.tenantId,a.workspaceId]);
 if(membership.rows[0]?.role!==a.role) fail('MEMBERSHIP_REQUIRED',403);
 await tx.query('SET LOCAL ROLE ts_runtime');
 await tx.query("select set_config('ts.tenant',$1,true),set_config('ts.workspace',$2,true),set_config('ts.user',$3,true),set_config('ts.role',$4,true)",[a.tenantId,a.workspaceId,a.userId,a.role]);
 const r=await fn(tx);await tx.query('COMMIT');return r;
 }catch(e){await tx.query('ROLLBACK');throw e;}finally{tx.release();}
}
const moduleRoles:Record<string,Role[]>={foundation:['owner'],today:['owner','manager'],crm:['sales','manager'],catalog:['catalog_manager'],supplier:['integration_admin'],configuration:['catalog_manager'],creative:['designer','customer'],estimating:['sales','manager'],commerce:['staff','customer'],stores:['store_admin','customer'],byob:['catalog_manager','customer'],sales:['sales','manager','customer'],orders:['operations'],procurement:['buyer','manager'],fulfillment:['operations'],finance:['finance'],marketing:['marketing','manager'],workflow:['manager'],analytics:['manager']};
export function authorize(a:Actor,module:string,action='read'){
 if(module==='future'||action.startsWith('live_'))fail('FEATURE_NOT_ACTIVE',403);
 if(a.role==='owner')return;
 if(!moduleRoles[module]?.includes(a.role))fail('PERMISSION_DENIED',403);
 if(a.role==='customer'&& !['read','create','update','archive','save_bundle','save_design_version','upload_asset','request_proof','approve_proof','configure','submit_request','submit_inquiry','accept_quote','reorder','validate_budget','price_bundle'].includes(action))fail('PERMISSION_DENIED',403);
}
function tbl(t:Table){if(!TABLES.includes(t))fail('INVALID_TABLE',400);return `app.${t}`;}
export async function list<T extends Input=Input>(tx:Tx,a:Actor,t:Table,limit=200):Promise<Row<T>[]>{return (await tx.query(`select * from ${tbl(t)} where tenant_id=$1 and workspace_id=$2 order by created_at desc,id limit $3`,[a.tenantId,a.workspaceId,Math.min(limit,1000)])).rows;}
export async function get<T extends Input=Input>(tx:Tx,a:Actor,t:Table,id:unknown,lock=false):Promise<Row<T>>{const r=await tx.query(`select * from ${tbl(t)} where tenant_id=$1 and workspace_id=$2 and id=$3 ${lock?'for update':''}`,[a.tenantId,a.workspaceId,text(id)]);if(!r.rows[0])fail('NOT_FOUND',404);return r.rows[0];}
const refs=['product_id','variant_id','connection_id','batch_id','project_id','version_id','quote_id','revision_id','order_id','job_id','store_id','contact_id','bundle_id','rule_id','cart_id','shipment_id','source_id','request_id','site_id','content_id','content_revision_id','parent_content_revision_id','source_revision_id','release_id','previous_release_id','asset_id','collection_id','brand_kit_id','evidence_source_id','original_asset_id','document_type','website_path','run_at','expires_at','expected_generation','web_bytes'] as const;
export async function create<T extends Input=Input>(tx:Tx,a:Actor,t:Table,v:{title:string;status?:string;data?:T;owner_id?:string;[key:string]:unknown}):Promise<Row<T>>{
 const columns=['id','tenant_id','workspace_id','owner_id','title','status','data'];const values:unknown[]=[uid(),a.tenantId,a.workspaceId,v.owner_id??a.userId,text(v.title,1000),v.status??'DRAFT',v.data??{}];
 for(const k of refs)if(v[k]!==undefined){columns.push(k);values.push(v[k]);}
 return (await tx.query(`insert into ${tbl(t)} (${columns.join(',')}) values (${values.map((_,i)=>'$'+(i+1)).join(',')}) returning *`,values)).rows[0];
}
export async function update<T extends Input=Input>(tx:Tx,a:Actor,t:Table,id:unknown,v:{title?:string;status?:string;data?:T;expectedRevision?:number}):Promise<Row<T>>{
 const old=await get<T>(tx,a,t,id,true);if(v.expectedRevision!==undefined&&old.revision!==v.expectedRevision)fail('REVISION_CONFLICT');
 return (await tx.query(`update ${tbl(t)} set title=$4,status=$5,data=$6,revision=revision+1,updated_at=now() where tenant_id=$1 and workspace_id=$2 and id=$3 returning *`,[a.tenantId,a.workspaceId,old.id,v.title??old.title,v.status??old.status,v.data??old.data])).rows[0];
}
export function transition(current:string,next:string,graph:Record<string,string[]>){if(!graph[current]?.includes(next))fail('INVALID_TRANSITION');}
export async function event(tx:Tx,a:Actor,type:string,id:string,data:Input={}){const correlationId=uid();const safe=JSON.parse(JSON.stringify(data, (k,v)=>/secret|password|token|credential/i.test(k)?'[REDACTED]':v));await create(tx,a,'audit_events',{title:type,status:'RECORDED',data:{entityId:id,actorId:a.userId,role:a.role,correlationId,...safe}});await create(tx,a,'outbox_events',{title:type,status:'PENDING',data:{entityId:id,correlationId,attempts:0,...safe}});}
export async function idempotent<T>(tx:Tx,a:Actor,operation:string,key:unknown,input:unknown,fn:()=>Promise<T>):Promise<T>{
 const k=text(key,200),digest=hash(input);await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`${a.tenantId}/${a.workspaceId}/${operation}/${k}`]);
 const r=await tx.query('select * from app.command_receipts where tenant_id=$1 and workspace_id=$2 and data->>\'key\'=$3 and title=$4',[a.tenantId,a.workspaceId,k,operation]);
 if(r.rows[0]){if(r.rows[0].data.digest!==digest)fail('IDEMPOTENCY_CONFLICT');return r.rows[0].data.result;}
 const result=await fn();await create(tx,a,'command_receipts',{title:operation,status:'COMPLETE',data:{key:k,digest,result}});return result;
}
export const DEMO={tenant:'11111111-1111-4111-8111-111111111111',workspace:'22222222-2222-4222-8222-222222222222',otherTenant:'11111111-1111-4111-8111-111111111112',otherWorkspace:'22222222-2222-4222-8222-222222222223'};
