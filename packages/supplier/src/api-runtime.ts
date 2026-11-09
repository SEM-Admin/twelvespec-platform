import {databaseConfig} from '../../kernel/src/database-config';
import type {NativeEnvironment,NativeProvider} from './api-budget';

/** A toggle alone must never declare an ephemeral hosted preview meter durable. */
export function durableApiMeter(env:NodeJS.ProcessEnv=process.env):boolean {
 if(env.TWELVESPEC_API_METER_STORAGE!=='durable')return false;
 if(env.TWELVESPEC_PREVIEW!=='1')return true;
 try{
  const url=new URL(env.DATABASE_URL??'');
  if(['127.0.0.1','localhost','[::1]'].includes(url.hostname))return false;
  databaseConfig(env);return true;
 }catch{return false;}
}
export function previewReadBlock(provider:NativeProvider,environment:NativeEnvironment,publicSandbox:boolean,env:NodeJS.ProcessEnv=process.env):string|null {
 if(environment==='mock'||env.TWELVESPEC_PREVIEW!=='1')return null;
 if(env.TWELVESPEC_PREVIEW_ACCOUNT_READS==='1'&&durableApiMeter(env))return null;
 if(env.TWELVESPEC_PREVIEW_CATALOG_READS==='1'&&provider==='SINALITE'&&environment==='sandbox'&&publicSandbox)return null;
 return env.TWELVESPEC_PREVIEW_CATALOG_READS==='1'?'PREVIEW_PUBLIC_SANDBOX_ONLY':'PREVIEW_SUPPLIER_READS_NOT_ENABLED';
}
