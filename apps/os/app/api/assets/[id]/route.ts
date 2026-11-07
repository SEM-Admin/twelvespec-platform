import {assetGET} from '../../../../../../packages/server/src';
export async function GET(req:Request,ctx:{params:Promise<{id:string}>}){return assetGET(req,(await ctx.params).id)}
export const dynamic="force-dynamic";
export const runtime="nodejs";
