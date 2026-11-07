/** Synthetic LOCAL restore drill. Production backup/storage activation remains independently gated. */
import {Client} from 'pg';import {readFileSync,readdirSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';import {resolve} from 'node:path';import {TABLES,fail} from './index';
const bootstrap=['tenants','workspaces','user','session','account','verification','memberships','rateLimit'] as const;
const quote=(v:string)=>'"'+v.replaceAll('"','""')+'"';
export async function localRestoreDrill(root:string,urlString:string){
 const url=new URL(urlString);if(!['127.0.0.1','localhost'].includes(url.hostname))fail('LOCAL_RESTORE_ONLY',403);
 const source=new Client({connectionString:url.toString()});await source.connect();const db='twelvespec_restore_'+Date.now();const dir=resolve(root,'.local/backups');mkdirSync(dir,{recursive:true,mode:0o700});const file=resolve(dir,db+'.json');let restore:Client|undefined;let created=false;
 try{
  await source.query('begin isolation level repeatable read read only');
  const data:Record<string,Record<string,unknown>[]>={};for(const table of bootstrap)data['public.'+table]=(await source.query(`select * from public.${quote(table)}`)).rows;for(const table of TABLES)data['app.'+table]=(await source.query(`select * from app.${quote(table)}`)).rows;
  writeFileSync(file,JSON.stringify({format:1,syntheticOnly:true,tables:data}),{mode:0o600});await source.query('commit');await source.query(`create database ${quote(db)}`);created=true;url.pathname='/'+db;restore=new Client({connectionString:url.toString()});await restore.connect();
  for(const fileName of readdirSync(resolve(root,'database/migrations')).filter(f=>f.endsWith('.sql')).sort())await restore.query(readFileSync(resolve(root,'database/migrations',fileName),'utf8'));
  // Deferral is confined to this brand-new restore target; all constraints validate on commit.
  const fks=(await restore.query("select n.nspname,c.relname,con.conname from pg_constraint con join pg_class c on c.oid=con.conrelid join pg_namespace n on n.oid=c.relnamespace where con.contype='f' and n.nspname in ('public','app')")).rows;
  for(const fk of fks)await restore.query(`alter table ${quote(fk.nspname)}.${quote(fk.relname)} alter constraint ${quote(fk.conname)} deferrable initially deferred`);
  await restore.query('begin');await restore.query('set constraints all deferred');
  const saved=JSON.parse(readFileSync(file,'utf8')) as {tables:typeof data};
  for(const [table,rows]of Object.entries(saved.tables))for(const row of rows){const columns=Object.keys(row);const [schema,name]=table.split('.');await restore.query(`insert into ${quote(schema)}.${quote(name)} (${columns.map(quote).join(',')}) values (${columns.map((_,i)=>'$'+(i+1)).join(',')})`,columns.map(c=>row[c]));}
  await restore.query('commit');const counts:Record<string,{source:number;restored:number}>={};for(const table of TABLES){const n=Number((await restore.query(`select count(*)::int n from app.${quote(table)}`)).rows[0].n);const original=saved.tables['app.'+table];if(n!==original.length)fail('RESTORE_COUNT_MISMATCH');const sourceScoped=groupCounts(original);const restoredScoped=groupCounts((await restore.query(`select tenant_id,workspace_id from app.${quote(table)}`)).rows);if(JSON.stringify(sourceScoped)!==JSON.stringify(restoredScoped))fail('RESTORE_SCOPE_MISMATCH');counts[table]={source:original.length,restored:n};}
  return {verification:'LOCAL_SYNTHETIC_RESTORE_VERIFIED',tables:Object.keys(counts).length,counts,foreignKeysValidated:fks.length,productionBackupVerified:false};
 }finally{await restore?.end();if(created)await source.query(`drop database if exists ${quote(db)} with(force)`);await source.end();rmSync(file,{force:true});}
}
function groupCounts(rows:Record<string,unknown>[]){const counts:Record<string,number>={};for(const row of rows){const k=String(row.tenant_id)+'/'+String(row.workspace_id);counts[k]=(counts[k]??0)+1;}return Object.fromEntries(Object.entries(counts).sort());}
