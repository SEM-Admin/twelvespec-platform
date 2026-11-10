import {readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {spawn,type ChildProcess} from 'node:child_process';
import {createEnv,loadEnv} from './env';
import {databaseConfig} from '../packages/kernel/src/database-config';
export function validatePreviewEnvironment(env:NodeJS.ProcessEnv){
 if(env.TWELVESPEC_PREVIEW!=='1')throw new Error('Explicit preview mode is required');
 for(const key of ['BETTER_AUTH_SECRET','ASSET_SIGNING_KEY','WEBHOOK_SIGNING_KEY','TWELVESPEC_DEMO_PASSWORD'])if(!env[key]||env[key]!.length<24||env[key]==='TwelveSpec-Demo-2026!')throw new Error('Independent preview credentials are required: '+key);
 for(const key of ['SHOP_ORIGIN','OS_ORIGIN']){const url=new URL(env[key]??'');if(url.protocol!=='https:'||!url.hostname.endsWith('.workers.dev')||url.port||url.pathname!=='/'||url.search||url.hash)throw new Error('Isolated HTTPS workers.dev origins are required');}
 if(env.SHOP_ORIGIN===env.OS_ORIGIN)throw new Error('Separate app origins are required');
 databaseConfig(env);
}
async function main(){validatePreviewEnvironment(process.env);createEnv();const root=loadEnv();const children:ChildProcess[]=[];
 const remote=!!process.env.DATABASE_URL&&!['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL).hostname);
 if(remote){const {Client}=await import('pg');const db=new Client(databaseConfig(process.env));try{await db.connect();const r=await db.query('select name from public._migrations');if(!readdirSync(resolve(root,'database/migrations')).filter(name=>name.endsWith('.sql')).every(name=>r.rows.some(row=>row.name===name)))throw new Error('Development database migrations are incomplete');}finally{await db.end();}}
 const setup=spawn(process.execPath,['--import','tsx',remote?'scripts/seed.ts':'scripts/setup.ts'],{cwd:root,env:process.env,stdio:'inherit'});const code=await new Promise<number|null>(r=>setup.on('exit',r));if(code!==0)throw new Error('Synthetic database setup failed');
 for(const app of ['shop','os']){const port=app==='shop'?'3000':'3001';children.push(spawn(process.execPath,[root+'/node_modules/next/dist/bin/next','start','-p',port,'-H','0.0.0.0'],{cwd:root+'/apps/'+app,env:{...process.env,TWELVESPEC_APP:app,APP_ORIGIN:app==='shop'?process.env.SHOP_ORIGIN:process.env.OS_ORIGIN},stdio:'inherit'}));}
 children.push(spawn(process.execPath,['--import','tsx','apps/worker/src/index.ts'],{cwd:root,env:process.env,stdio:'inherit'}));
 const stop=()=>{children.forEach(p=>p.kill('SIGTERM'));process.exitCode=0;};process.on('SIGINT',stop);process.on('SIGTERM',stop);
 for(const child of children)child.on('exit',code=>{if(code&&code!==0){console.error('Preview process exited; container restart is required.');stop();}});
 console.log(remote?'Synthetic preview runtime started with the approved persistent development database.':'Synthetic preview runtime started. State is temporary and resets after container replacement.');
}
if(process.argv[1]?.endsWith('preview-runtime.ts'))main().catch(e=>{console.error(e.message);process.exitCode=1;});
