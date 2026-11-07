import {pool} from '../../../../../packages/kernel/src';
export const dynamic='force-dynamic';
export async function GET(){try{await pool().query('select 1');return Response.json({status:'ok',synthetic:true},{headers:{'Cache-Control':'no-store'}})}catch{return Response.json({status:'starting'},{status:503})}}
