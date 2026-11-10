import {spawn,type ChildProcess} from 'node:child_process';import {loadEnv} from './env';
const root=loadEnv();
const children:ChildProcess[]=[];
const stop=()=>{children.forEach(p=>p.kill('SIGTERM'));process.exit(0)};process.on('SIGINT',stop);process.on('SIGTERM',stop);
async function main(){
 const setup=spawn(process.execPath,['--import','tsx','scripts/setup.ts'],{cwd:root,env:process.env,stdio:'inherit'});
 const result=await new Promise<number|null>((resolve,reject)=>{setup.on('error',reject);setup.on('exit',resolve)});
 if(result!==0)throw new Error('Local synthetic database setup failed');
 loadEnv();
 for(const [app,port] of [['os','3001'],['shop','3000']])children.push(spawn(process.execPath,[root+'/node_modules/next/dist/bin/next','dev','-p',port,'-H','0.0.0.0'],{cwd:root+'/apps/'+app,env:{...process.env,APP_ORIGIN:'http://localhost:'+port,NEXT_TELEMETRY_DISABLED:'1'},stdio:'inherit'}));
 children.push(spawn(process.execPath,['--import','tsx','apps/worker/src/index.ts'],{cwd:root,env:process.env,stdio:'inherit'}));
}
main().catch(e=>{console.error(e.message);process.exitCode=1});
