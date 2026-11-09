import type {PoolConfig} from 'pg';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
/** Only the development project explicitly selected by the owner is permitted. */
export const PREVIEW_PROJECT='mtihnarlkprmyahbxlrl';
export function databaseConfig(env:NodeJS.ProcessEnv):PoolConfig {
 const connectionString=env.DATABASE_URL??'postgresql://twelvespec@127.0.0.1:55432/twelvespec_local';
 const url=new URL(connectionString),local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
 if(!['postgres:','postgresql:'].includes(url.protocol))throw new Error('INVALID_DATABASE_PROTOCOL');
 if(!local){
  if(env.TWELVESPEC_PREVIEW==='1'){
   if(env.SUPABASE_PROJECT_REF!==PREVIEW_PROJECT)throw new Error('UNAPPROVED_PREVIEW_DATABASE');
   const direct=url.hostname===`db.${PREVIEW_PROJECT}.supabase.co`&&decodeURIComponent(url.username)==='ts_app_server';
   const pooled=/^aws-[0-9]+-us-east-1\.pooler\.supabase\.com$/.test(url.hostname)&&decodeURIComponent(url.username)===`ts_app_server.${PREVIEW_PROJECT}`;
   if((!direct&&!pooled)||url.pathname!=='/postgres'||url.port!=='5432'||!url.password||url.search)throw new Error('UNAPPROVED_PREVIEW_DATABASE');
  }else if(env.TWELVESPEC_ENV!=='staging')throw new Error('NONLOCAL_DATABASE_BLOCKED');
 }
 const approvedPreview=!local&&env.TWELVESPEC_PREVIEW==='1';
 const ca=approvedPreview?readFileSync(resolve(env.TWELVESPEC_ROOT??process.env.TWELVESPEC_ROOT??process.cwd(),'infra/supabase/prod-ca-2021.crt'),'utf8'):undefined;
 return {connectionString,max:local?12:4,idleTimeoutMillis:20000,connectionTimeoutMillis:15000,...(!local?{ssl:{rejectUnauthorized:true,...(ca?{ca}:{})}}:{})};
}
