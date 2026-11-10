import {websiteMediaGET} from '../../../../../../../packages/server/src/website';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){return websiteMediaGET(req,(await params).id);}
export const runtime='nodejs';
