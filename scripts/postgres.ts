import EmbeddedPostgres from 'embedded-postgres';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {Client} from 'pg';
import {createEnv,loadEnv} from './env';
createEnv();const root=loadEnv();
const pg=new EmbeddedPostgres({databaseDir:resolve(root,'.local/postgres'),user:'twelvespec',password:'local-only-not-a-production-credential',port:55432,persistent:true,authMethod:'scram-sha-256',postgresFlags:['-h','127.0.0.1','-k',resolve(root,'.local')],initdbFlags:['--auth-local=trust','--auth-host=trust','--encoding=UTF8','--locale=C'],onLog:(message)=>{if(/FATAL|ERROR|Operation not permitted/.test(message))console.error(message)},onError:(e)=>console.error(String(e))});
async function main(){
 try{const test=new Client({connectionString:'postgresql://twelvespec@127.0.0.1:55432/postgres'});await test.connect();await test.end();console.log('Local Postgres already running on 55432');return;}catch{}
 if(!existsSync(resolve(root,'.local/postgres/PG_VERSION')))await pg.initialise();await pg.start();
 const c=pg.getPgClient();await c.connect();const existing=await c.query("select 1 from pg_database where datname='twelvespec_local'");if(!existing.rowCount)await c.query('create database twelvespec_local');await c.end();
 console.log('Synthetic local PostgreSQL ready on 127.0.0.1:55432');
 const shutdown=async()=>{await pg.stop();process.exit(0);};process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);await new Promise(()=>{});
}
main().catch((e)=>{console.error('Local Postgres startup failed:',String(e));process.exit(1);});
