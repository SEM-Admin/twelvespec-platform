/** Bounded, transactional bytes in the existing canonical asset registry.
 * Domain readers must authorize originals/publication before calling this module.
 */
import {createHash} from 'node:crypto';
import {create,fail,text,type Actor,type Input,type Row,type Tx} from './index';

export const ASSET_STORAGE='POSTGRES_BYTEA_V1';
export const MAX_STORED_ASSET_BYTES=16*1024*1024;
export const assetBytesHash=(bytes:Buffer)=>createHash('sha256').update(bytes).digest('hex');

export async function createStoredAsset(tx:Tx,a:Actor,value:{title:string;data:Input;[key:string]:unknown},bytes:Buffer):Promise<Row>{
 if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>MAX_STORED_ASSET_BYTES)fail('ASSET_SIZE_LIMIT',400);
 return create(tx,a,'assets',{...value,web_bytes:bytes,data:{...value.data,storage:ASSET_STORAGE,bytes:bytes.length,contentHash:assetBytesHash(bytes)}});
}

export function verifiedAssetBytes(row:{web_bytes?:unknown;data:Input}):Buffer{
 const bytes=row.web_bytes;
 if(!Buffer.isBuffer(bytes)||!bytes.length||bytes.length>MAX_STORED_ASSET_BYTES)fail('ASSET_STORAGE_UNAVAILABLE',503);
 if(row.data.bytes!==bytes.length||row.data.contentHash!==assetBytesHash(bytes))fail('ASSET_INTEGRITY_FAILED',503);
 return bytes;
}

/** Scope and database RLS both apply. This is deliberately separate from metadata queries. */
export async function readStoredAssetBytes(tx:Tx,a:Actor,id:unknown):Promise<Buffer>{
 const row=(await tx.query('select web_bytes,data from app.assets where tenant_id=$1 and workspace_id=$2 and id=$3',[a.tenantId,a.workspaceId,text(id)])).rows[0];
 if(!row)fail('NOT_FOUND',404);
 return verifiedAssetBytes(row);
}
