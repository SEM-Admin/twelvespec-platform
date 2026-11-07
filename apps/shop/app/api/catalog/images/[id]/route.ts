import {catalogImageGET} from '../../../../../../../packages/server/src';
export const runtime='nodejs';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;return catalogImageGET(req,id);}
