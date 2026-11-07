import {type Tx,type Actor,type Table,type Row,TABLES,fail,text} from '../../kernel/src/index';
const scopedColumns=new Set(['product_id','variant_id','connection_id','project_id','version_id','quote_id','order_id','job_id','shipment_id','owner_id']);
/** Bound the result within one aggregate; unrelated high-volume records never evict its evidence. */
export async function related(tx:Tx,a:Actor,table:Table,column:string,id:unknown):Promise<Row[]>{
 if(!TABLES.includes(table)||!scopedColumns.has(column))return fail('INVALID_RELATION',400);
 return (await tx.query(`select * from app.${table} where tenant_id=$1 and workspace_id=$2 and ${column}=$3 order by created_at,id limit 1000`,[a.tenantId,a.workspaceId,text(id)])).rows;
}
