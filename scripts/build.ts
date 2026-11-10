import {spawn} from 'node:child_process';import {loadEnv} from './env';
const root=loadEnv();
async function main(){for(const app of ['os','shop']){const code=await new Promise<number>((res,rej)=>{const child=spawn(process.execPath,[root+'/node_modules/next/dist/bin/next','build'],{cwd:root+'/apps/'+app,env:{...process.env,TWELVESPEC_APP:app,NEXT_TELEMETRY_DISABLED:'1',XDG_CONFIG_HOME:root+'/.local/config'},stdio:'inherit'});child.on('error',rej);child.on('exit',code=>res(code??1));});if(code){process.exitCode=code;return;}}}
main().catch(e=>{console.error(e.message);process.exitCode=1});
