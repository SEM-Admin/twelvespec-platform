import {readFileSync} from 'node:fs';
import {loadEnv} from './env';
loadEnv();

async function main(){
 const url=new URL(process.env.DATABASE_URL??'');
 if(!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('Source staging script requires the isolated local development database');
 const file=process.argv[2]??'.local/owned-catalog/source-candidates.json';
 const raw=readFileSync(file,'utf8');if(Buffer.byteLength(raw)>12*1024*1024)throw new Error('Source bundle exceeds 12 MB');
 const document=JSON.parse(raw) as {sources:unknown[]};if(!Array.isArray(document.sources)||document.sources.length>10000)throw new Error('Invalid source bundle');
 const {pool,transaction,DEMO,hash}=await import('../packages/kernel/src');
 const {stageCatalogSources}=await import('../packages/catalog/src/sources');
 const membership=(await pool().query("select user_id from memberships where tenant_id=$1 and workspace_id=$2 and role='owner' order by user_id limit 1",[DEMO.tenant,DEMO.workspace])).rows[0];
 if(!membership)throw new Error('Run local setup before staging source data');
 const actor={userId:membership.user_id,tenantId:DEMO.tenant,workspaceId:DEMO.workspace,role:'owner' as const};
 let created=0,unchanged=0;
 for(let i=0;i<document.sources.length;i+=200){const sources=document.sources.slice(i,i+200);const result=await transaction(actor,tx=>stageCatalogSources(tx,actor,{sources,idempotencyKey:`known-sources-${hash(sources)}`}));created+=result.created;unchanged+=result.unchanged;}
 console.log(JSON.stringify({staged:created,unchanged,total:document.sources.length,published:0,environment:'ISOLATED_LOCAL_DATABASE'}));
 await pool().end();
}
main().catch(e=>{console.error(e instanceof Error?e.message:'Source staging failed');process.exitCode=1;});
