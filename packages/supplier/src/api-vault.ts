import {createCipheriv,createDecipheriv,hkdfSync,randomBytes} from 'node:crypto';
import {fail,get,hash,type Actor,type Input,type Row,type Tx} from '../../kernel/src';
import type {NativeProvider} from './api-budget';

function encryptionKey(){
 const dedicated=process.env.TWELVESPEC_SUPPLIER_VAULT_KEY;
 if(dedicated){const bytes=Buffer.from(dedicated,'base64');if(bytes.length!==32)fail('API_VAULT_KEY_INVALID',503);return bytes;}
 const root=process.env.BETTER_AUTH_SECRET;
 if(!root||root.length<32)fail('API_VAULT_KEY_REQUIRED',503);
 // A purpose-separated existing server secret, never a random ephemeral filesystem key.
 return Buffer.from(hkdfSync('sha256',Buffer.from(root),Buffer.from('TwelveSpec/v1'),Buffer.from('supplier-credentials'),32));
}
const scope=(a:Actor,connectionId:string,accountId:string,version:number)=>`${a.tenantId}/${a.workspaceId}/${connectionId}/${accountId}/${version}`;
export function normalizeNativeCredentials(provider:NativeProvider,value:unknown):Input {
 if(!value||typeof value!=='object'||Array.isArray(value))fail('API_CREDENTIAL_INVALID',400);
 const v=value as Input,keys=provider==='SAGE_CONNECT'?['accountId','loginId','authKey']:['clientId','clientSecret'];
 if(Object.keys(v).some(k=>!keys.includes(k)))fail('API_CREDENTIAL_FIELDS_INVALID',400);
 const result:Input={};for(const field of keys){if(typeof v[field]!=='string'||!v[field].trim()||String(v[field]).length>4096||/[\r\n\0]/.test(String(v[field])))fail('API_CREDENTIAL_INVALID',400);result[field]=String(v[field]).trim();}
 if(provider==='SAGE_CONNECT'){if(!/^\d{1,12}$/.test(String(result.accountId))||Number(result.accountId)<1)fail('SAGE_ACCOUNT_ID_INVALID',400);result.accountId=String(Number(result.accountId));}
 return result;
}
export async function replaceNativeCredentials(tx:Tx,a:Actor,connection:Row,value:unknown){
 const provider=connection.data.providerType as NativeProvider,credentials=normalizeNativeCredentials(provider,value);
 const accountId=String(connection.data.apiAccountId),identity=provider==='SAGE_CONNECT'?`${credentials.accountId}/${String(credentials.loginId).toLowerCase()}`:String(credentials.clientId);
 const account=(await tx.query('select * from app.supplier_api_accounts where id=$1 and tenant_id=$2 and workspace_id=$3 for update',[accountId,a.tenantId,a.workspaceId])).rows[0];
 if(!account||account.account_hash!==hash(identity))fail('API_ACCOUNT_IDENTITY_MISMATCH',400);
 const old=(await tx.query('select version from app.supplier_api_secrets where tenant_id=$1 and workspace_id=$2 and connection_id=$3',[a.tenantId,a.workspaceId,connection.id])).rows[0];
 const version=Number(old?.version??0)+1,key=encryptionKey(),iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);
 cipher.setAAD(Buffer.from(scope(a,connection.id,accountId,version)));
 const ciphertext=Buffer.concat([cipher.update(JSON.stringify(credentials),'utf8'),cipher.final()]);
 await tx.query(`insert into app.supplier_api_secrets(tenant_id,workspace_id,connection_id,account_id,version,key_id,ciphertext,iv,tag)
 values($1,$2,$3,$4,$5,$6,$7,$8,$9) on conflict(tenant_id,workspace_id,connection_id) do update set version=excluded.version,key_id=excluded.key_id,ciphertext=excluded.ciphertext,iv=excluded.iv,tag=excluded.tag,updated_at=now()`,
 [a.tenantId,a.workspaceId,connection.id,accountId,version,hash(key.toString('base64')).slice(0,16),ciphertext.toString('base64'),iv.toString('base64'),cipher.getAuthTag().toString('base64')]);
 return {version,maskedHint:`Configured · version ${version}`,vaultMode:'SCOPED_DATABASE_ENCRYPTION'};
}
export async function resolveNativeCredentials(tx:Tx,a:Actor,connectionId:string):Promise<{credentials:Input;version:number}|null>{
 await get(tx,a,'connections',connectionId);
 const row=(await tx.query('select * from app.supplier_api_secrets where tenant_id=$1 and workspace_id=$2 and connection_id=$3',[a.tenantId,a.workspaceId,connectionId])).rows[0];
 if(!row)return null;
 const key=encryptionKey();if(row.key_id!==hash(key.toString('base64')).slice(0,16))fail('API_VAULT_KEY_ROTATED_REENTRY_REQUIRED',503);
 try{
  const decipher=createDecipheriv('aes-256-gcm',key,Buffer.from(row.iv,'base64'));
  decipher.setAAD(Buffer.from(scope(a,connectionId,row.account_id,row.version)));decipher.setAuthTag(Buffer.from(row.tag,'base64'));
  return {credentials:JSON.parse(Buffer.concat([decipher.update(Buffer.from(row.ciphertext,'base64')),decipher.final()]).toString('utf8')) as Input,version:row.version};
 }catch{return fail('API_VAULT_DECRYPTION_FAILED',503);}
}
