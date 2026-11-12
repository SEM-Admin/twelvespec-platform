import {z} from 'zod';
import {authorize,create,event,fail,idempotent,type Actor,type Input,type Tx} from '../../kernel/src';
import {normalizeQuoteBrief} from './brief';
const schema=z.object({key:z.string().min(1).max(200),projectName:z.string().trim().min(3).max(200),contactName:z.string().trim().min(1).max(150),company:z.string().max(200).default(''),phone:z.string().max(50).default(''),notes:z.string().trim().min(20).max(4000),deliveryCountry:z.string().regex(/^[A-Z]{2}$/),deliveryPostalCode:z.string().max(20).default(''),requestedDate:z.string().max(10).default(''),hardDeadline:z.boolean().default(false),contactPermission:z.literal(true),website:z.string().max(200).default('')}).strict();
/** Authenticated, requested project contact; not marketing consent or an order. */
export async function submitInquiry(tx:Tx,a:Actor,input:Input){
 authorize(a,'commerce','submit_inquiry');
 const parsed=schema.safeParse(input);if(!parsed.success)fail('INQUIRY_INPUT_INVALID',400);const v=parsed.data;
 if(v.website)fail('INQUIRY_REJECTED',400);
 const brief=normalizeQuoteBrief({...v,artworkStatus:'UNKNOWN'},v.projectName);
 return idempotent(tx,a,'commerce.project_inquiry',v.key,{brief,contactPermission:true},async()=>{
  await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`${a.tenantId}/${a.workspaceId}/inquiry-rate/${a.userId}`]);
  const count=(await tx.query("select count(*) filter(where created_at>now()-interval '1 hour')::int hourly,count(*)::int daily from app.requests where tenant_id=$1 and workspace_id=$2 and owner_id=$3 and data->>'kind'='PROJECT_INQUIRY' and created_at>now()-interval '1 day'",[a.tenantId,a.workspaceId,a.userId])).rows[0];
  if(count.hourly>=5||count.daily>=20)fail('INQUIRY_RATE_LIMIT',429);
  const request=await create(tx,a,'requests',{title:v.projectName,owner_id:a.userId,status:'NEW',data:{kind:'PROJECT_INQUIRY',lines:[],lineSnapshots:[],brief,currency:'USD',submittedAt:new Date().toISOString(),intakeReview:{status:'NEEDS_PRODUCT_SCOPE',missingFields:['PRODUCT_SELECTION']},contactPermission:{purpose:'REQUESTED_PROJECT_FOLLOW_UP',marketing:false,recordedAt:new Date().toISOString()},quoteFirst:true}});
  await event(tx,a,'inquiry.submitted',request.id,{purpose:'REQUESTED_PROJECT_FOLLOW_UP'});return request;
 });
}
