import {z} from 'zod';
import {pool,transaction,fail,type Actor} from '../../kernel/src';
import {defaultInquiryLimits,publicInquirySchema,savePublicInquiry,type InquiryLimits} from '../../crm/src/public-inquiries';
import {errorResponse} from './index';

const headers={'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow','X-Content-Type-Options':'nosniff'};
const action='quote_inquiry',maxBytes=16384;
type Config={origin:URL;synthetic:boolean;sitekey:string;secret:string;tenantId:string;workspaceId:string;userId:string;limits:InquiryLimits};
function config(env:NodeJS.ProcessEnv=process.env):Config{
 const synthetic=env.PUBLIC_INQUIRY_MODE==='synthetic-local';
 if(!synthetic&&env.PUBLIC_INQUIRY_MODE!=='live')fail('PUBLIC_INQUIRY_DISABLED',503);
 const parsed=z.object({origin:z.url(),database:z.url(),tenantId:z.uuid(),workspaceId:z.uuid(),userId:z.string().min(1).max(200)}).safeParse({origin:env.APP_ORIGIN,database:env.DATABASE_URL,tenantId:env.PUBLIC_INQUIRY_TENANT_ID,workspaceId:env.PUBLIC_INQUIRY_WORKSPACE_ID,userId:env.PUBLIC_INQUIRY_ASSIGNEE_ID});
 if(!parsed.success)fail('PUBLIC_INQUIRY_CONFIGURATION_REQUIRED',503);
 const v=parsed.data,origin=new URL(v.origin),db=new URL(v.database),local=(host:string)=>['localhost','127.0.0.1','[::1]'].includes(host);
 if(origin.username||origin.password||origin.pathname!=='/'||origin.search||origin.hash||!['postgres:','postgresql:'].includes(db.protocol))fail('PUBLIC_INQUIRY_CONFIGURATION_REQUIRED',503);
 if(synthetic){
  if(!['test','development'].includes(env.TWELVESPEC_ENV??'')||!local(origin.hostname)||!local(db.hostname))fail('PUBLIC_INQUIRY_LOCAL_ONLY',503);
 }else{
  if(origin.protocol!=='https:'||local(origin.hostname)||local(db.hostname)||env.TWELVESPEC_ENV!=='production'||env.TWELVESPEC_PREVIEW==='1'||env.SEED_AUTH==='1'||env.PUBLIC_INQUIRY_LIVE_APPROVED!=='1'||!env.TURNSTILE_SITE_KEY||!env.TURNSTILE_SECRET)fail('PUBLIC_INQUIRY_ACTIVATION_REQUIRED',503);
 }
 const limits={...defaultInquiryLimits};
 for(const [key,name] of Object.entries({hourly:'PUBLIC_INQUIRY_HOURLY_LIMIT',daily:'PUBLIC_INQUIRY_DAILY_LIMIT',emailHourly:'PUBLIC_INQUIRY_EMAIL_HOURLY_LIMIT',emailDaily:'PUBLIC_INQUIRY_EMAIL_DAILY_LIMIT'})){
  const raw=env[name];if(raw===undefined)continue;const n=Number(raw);if(!Number.isSafeInteger(n)||n<1||n>10000)fail('PUBLIC_INQUIRY_CONFIGURATION_REQUIRED',503);limits[key as keyof InquiryLimits]=n;
 }
 return {origin,synthetic,sitekey:synthetic?'':env.TURNSTILE_SITE_KEY!,secret:synthetic?'':env.TURNSTILE_SECRET!,tenantId:v.tenantId,workspaceId:v.workspaceId,userId:v.userId,limits};
}
async function assignee(c:Config):Promise<Actor>{
 const member=(await pool().query('select role from memberships where tenant_id=$1 and workspace_id=$2 and user_id=$3',[c.tenantId,c.workspaceId,c.userId])).rows[0];
 if(!member||!['owner','manager','sales'].includes(member.role))fail('PUBLIC_INQUIRY_ASSIGNEE_UNAVAILABLE',503);
 return {tenantId:c.tenantId,workspaceId:c.workspaceId,userId:c.userId,role:member.role};
}
/** Stream and stop at the actual byte bound, including chunked/lying Content-Length. */
async function boundedJson(req:Request){
 const length=req.headers.get('content-length');if(length&&(!/^\d+$/.test(length)||Number(length)>maxBytes))fail('REQUEST_TOO_LARGE',413);
 if(!req.body)fail('INVALID_JSON',400);const reader=req.body.getReader(),chunks:Uint8Array[]=[];let bytes=0;
 try{while(true){const next=await reader.read();if(next.done)break;bytes+=next.value.byteLength;if(bytes>maxBytes){await reader.cancel();fail('REQUEST_TOO_LARGE',413);}chunks.push(next.value);}}
 finally{reader.releaseLock();}
 try{return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;}catch{fail('INVALID_JSON',400);}
}
async function verifyChallenge(c:Config,token:string){
 if(c.synthetic){if(token!=='synthetic-local-inquiry')fail('INQUIRY_CHALLENGE_FAILED',403);return;}
 let result:unknown;
 try{
  const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret:c.secret,response:token}),signal:AbortSignal.timeout(10000),cache:'no-store'});
  if(!response.ok)fail('INQUIRY_CHALLENGE_FAILED',403);result=await response.json();
 }catch{fail('INQUIRY_CHALLENGE_FAILED',403);}
 const r=result as Record<string,unknown>|null;
 if(!r||r.success!==true||r.hostname!==c.origin.hostname||r.action!==action)fail('INQUIRY_CHALLENGE_FAILED',403);
 const at=typeof r.challenge_ts==='string'?Date.parse(r.challenge_ts):NaN,age=Date.now()-at;
 if(!Number.isFinite(at)||age>300000||age< -30000)fail('INQUIRY_CHALLENGE_FAILED',403);
}
function error(e:unknown){const r=errorResponse(e);for(const [k,v] of Object.entries(headers))r.headers.set(k,v);return r;}
export async function publicInquiryGET(){
 try{const c=config();await assignee(c);return Response.json({enabled:true,synthetic:c.synthetic,sitekey:c.sitekey,action},{headers});}
 catch(e){
  // Disabled is an ordinary state; malformed/failed activation is a visible failure.
  if(e instanceof Error&&e.message==='PUBLIC_INQUIRY_DISABLED')return Response.json({enabled:false},{headers});
  return error(e);
 }
}
export async function publicInquiryPOST(req:Request){
 try{
  // The existing gateway validates its host and forwards to an internal
  // container URL. Compare the browser Origin to the configured public origin.
  const c=config();if(req.headers.get('origin')!==c.origin.origin)fail('INVALID_ORIGIN',403);
  if(req.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')fail('JSON_REQUIRED',415);
  const parsed=publicInquirySchema.extend({challengeToken:z.string().min(1).max(2048)}).safeParse(await boundedJson(req));
  if(!parsed.success)fail('INQUIRY_INPUT_INVALID',400);const {challengeToken,...input}=parsed.data;
  if(input.website)fail('INQUIRY_REJECTED',400);
  const actor=await assignee(c);await verifyChallenge(c,challengeToken);
  const receipt=await transaction(actor,tx=>savePublicInquiry(tx,actor,input,c.limits));
  // A reference is a receipt only. There is no anonymous read/lookup endpoint.
  return Response.json({receipt},{status:201,headers});
 }catch(e){return error(e);}
}
