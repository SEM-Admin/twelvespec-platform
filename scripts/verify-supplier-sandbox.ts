/** Read-only, unauthenticated SinaLite sandbox smoke test. Never accepts production URLs or keys. */
import {writeFileSync,mkdirSync} from 'node:fs';
import {loadEnv} from './env';
loadEnv();
async function main(){
 const {pool,DEMO,get,transaction}=await import('../packages/kernel/src');
 const {handleNativeSupplier}=await import('../packages/supplier/src/native');
 const member=(await pool().query("select user_id from memberships where tenant_id=$1 and workspace_id=$2 and role='owner' limit 1",[DEMO.tenant,DEMO.workspace])).rows[0];
 if(!member)throw new Error('Seed the isolated development database first.');
 const url=new URL(process.env.DATABASE_URL!);if(!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('Sandbox smoke test writes to an isolated local database only.');
 const actor={userId:member.user_id,tenantId:DEMO.tenant,workspaceId:DEMO.workspace,role:'owner' as const};
 const title='SinaLite public sandbox · verified read only';
 const existing=(await transaction(actor,tx=>tx.query("select id from app.connections where tenant_id=$1 and workspace_id=$2 and title=$3 and data->>'providerType'='SINALITE' and data->>'environment'='sandbox' limit 1",[DEMO.tenant,DEMO.workspace,title]))).rows[0];
 const c=existing??await handleNativeSupplier(actor,'api_create_connection',{providerType:'SINALITE',environment:'sandbox',displayName:title}) as {id:string};
 const dashboard=await handleNativeSupplier(actor,'api_dashboard',{id:c.id}) as {policy:Record<string,unknown>;revision:number};
 await handleNativeSupplier(actor,'api_save_policy',{id:c.id,expectedRevision:dashboard.revision,policy:{...dashboard.policy,enabled:true,dailyCalls:20,monthlyCalls:50,runCalls:5,cacheMinutes:1440},reason:'Owner-authorized public sandbox read test; no supplier account credentials or orders.'});
 const run=async(operation:string,input:Record<string,unknown>={})=>await handleNativeSupplier(actor,'api_read',{id:c.id,operation,...input,idempotencyKey:crypto.randomUUID()}) as {callId:string;verification:string;cacheHit:boolean;result:Record<string,unknown>};
 const catalog=await run('catalog');
 const items=catalog.result.items as {id:number;name:string;enabled:boolean}[];
 const options=await run('options',{productId:1,storeCode:9});
 const selected=[4,5,30,140,93,540];
 const price=await run('price',{productId:1,storeCode:9,optionIds:selected});
 const ids=items.filter(row=>row.enabled).slice(0,3).map(row=>row.id);
 const staged=await handleNativeSupplier(actor,'api_stage_result',{id:c.id,callId:catalog.callId,selectedIds:ids});
 const cached=await run('catalog');
 const final=await handleNativeSupplier(actor,'api_dashboard',{id:c.id}) as Record<string,unknown>;
 const evidence={checkedAt:new Date().toISOString(),environment:'ISOLATED_LOCAL_DB_AND_PUBLIC_SINALITE_SANDBOX',connectionId:c.id,verification:catalog.verification,products:items.length,enabled:items.filter(row=>row.enabled).length,optionCount:(options.result.options as unknown[]).length,configuration:{productId:1,storeCode:9,optionIds:selected,supplierPrice:price.result.price,currency:price.result.currency,shipping:price.result.shipping,customerPrice:price.result.customerPrice},staged,cachedRead:cached.cacheHit,usage:final.usage,paidFeesApproved:'0.00',supplierOrdersSubmitted:0,productsPublished:0,imagesOrTemplatesVerified:false};
 mkdirSync('docs/supplier-api/evidence',{recursive:true});writeFileSync('docs/supplier-api/evidence/sinalite-sandbox.json',JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify(evidence,null,2));await pool().end();
}
main().catch(error=>{console.error(error instanceof Error?error.message:'Sandbox verification failed');process.exitCode=1;});
