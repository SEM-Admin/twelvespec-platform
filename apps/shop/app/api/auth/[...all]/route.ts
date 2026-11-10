import {getAuth} from '../../../../../../packages/server/src/auth';
export const GET=(request:Request)=>getAuth().handler(request);export const POST=GET;
export const dynamic="force-dynamic";
export const runtime="nodejs";
