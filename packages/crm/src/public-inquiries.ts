import {z} from 'zod';
import {authorize,create,event,fail,get,idempotent,update,type Actor,type Input,type Row,type Tx} from '../../kernel/src';
import {normalizeQuoteBrief} from '../../commerce/src/brief';

export const publicInquirySchema=z.object({
 key:z.uuid(),projectName:z.string().trim().min(3).max(200),contactName:z.string().trim().min(1).max(150),
 email:z.email().max(254).transform(v=>v.toLowerCase()),company:z.string().trim().max(200).default(''),
 phone:z.string().trim().max(50).default(''),notes:z.string().trim().min(20).max(4000),
 deliveryCountry:z.string().regex(/^[A-Z]{2}$/),deliveryPostalCode:z.string().trim().max(20).default(''),
 requestedDate:z.string().max(10).default(''),hardDeadline:z.boolean().default(false),
 contactPermission:z.literal(true),website:z.string().max(200).default(''),
}).strict();
export type PublicInquiryInput=z.infer<typeof publicInquirySchema>;
export type InquiryLimits={hourly:number;daily:number;emailHourly:number;emailDaily:number};
export const defaultInquiryLimits:InquiryLimits={hourly:50,daily:200,emailHourly:3,emailDaily:10};

/** Only a fixed-purpose server endpoint supplies the assignee. A guest is never an Actor. */
export async function savePublicInquiry(tx:Tx,assignee:Actor,input:PublicInquiryInput,limits:InquiryLimits=defaultInquiryLimits){
 authorize(assignee,'crm','create_follow_up');
 const parsed=publicInquirySchema.safeParse(input);if(!parsed.success)fail('INQUIRY_INPUT_INVALID',400);
 const v=parsed.data;if(v.website)fail('INQUIRY_REJECTED',400);
 const brief=normalizeQuoteBrief({...v,artworkStatus:'UNKNOWN'},v.projectName);
 return idempotent(tx,assignee,'crm.public_quote_inquiry',v.key,{...v,brief},async()=>{
  // One workspace lock serializes the global and email budgets across workers.
  await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`${assignee.tenantId}/${assignee.workspaceId}/public-quote-intake`]);
  const counts=(await tx.query(`select
   count(*) filter(where created_at>now()-interval '1 hour')::int hourly,count(*)::int daily,
   count(*) filter(where created_at>now()-interval '1 hour' and data->>'submittedEmail'=$3)::int email_hourly,
   count(*) filter(where data->>'submittedEmail'=$3)::int email_daily
   from app.follow_ups where tenant_id=$1 and workspace_id=$2 and data->>'kind'='PUBLIC_QUOTE_INQUIRY' and created_at>now()-interval '1 day'`,[assignee.tenantId,assignee.workspaceId,v.email])).rows[0];
  if(counts.hourly>=limits.hourly||counts.daily>=limits.daily||counts.email_hourly>=limits.emailHourly||counts.email_daily>=limits.emailDaily)fail('INQUIRY_RATE_LIMIT',429);
  const row=await create(tx,assignee,'follow_ups',{title:v.projectName,status:'OPEN',data:{
   kind:'PUBLIC_QUOTE_INQUIRY',brief,submittedEmail:v.email,emailVerified:false,
   contactPermission:{purpose:'REQUESTED_PROJECT_FOLLOW_UP',marketing:false,recordedAt:new Date().toISOString()},
   externalCommunication:'NOT_SENT',quoteFirst:true,source:'PUBLIC_WEBSITE',submittedBy:'UNAUTHENTICATED_VISITOR',
  }});
  await create(tx,assignee,'work_items',{title:'Review quote request · '+v.projectName,status:'OPEN',data:{kind:'PUBLIC_QUOTE_REVIEW',publicInquiryId:row.id,severity:'MEDIUM',source:'PUBLIC_WEBSITE',reason:'Requested project follow-up. Submitted contact details are unverified.'}});
  // The private inbox is the durable operational queue, not an email-delivery promise.
  await event(tx,assignee,'crm.public_quote_inquiry_received',row.id,{externalCommunication:'NOT_SENT',initiator:'UNAUTHENTICATED_VISITOR',assignedTo:assignee.userId});
  return {reference:row.id,status:'RECEIVED' as const};
 });
}

export async function publicInquiryInbox(tx:Tx,a:Actor,input:Input){
 authorize(a,'crm');
 const parsed=z.object({page:z.number().int().min(1).max(100000).default(1),status:z.enum(['ALL','OPEN','IN_REVIEW','RESPONDED','CLOSED','SPAM']).default('OPEN')}).strict().safeParse(input);
 if(!parsed.success)fail('INQUIRY_INBOX_INPUT_INVALID',400);const {page,status}=parsed.data,pageSize=10;
 const args=[a.tenantId,a.workspaceId,status];
 const where="tenant_id=$1 and workspace_id=$2 and data->>'kind'='PUBLIC_QUOTE_INQUIRY' and ($3='ALL' or status=$3)";
 const total=Number((await tx.query(`select count(*)::int n from app.follow_ups where ${where}`,args)).rows[0].n);
 const rows=(await tx.query(`select * from app.follow_ups where ${where} order by created_at desc,id desc limit 10 offset $4`,[...args,(page-1)*pageSize])).rows as Row[];
 return {rows,total,page,pageSize,totalPages:Math.max(1,Math.ceil(total/pageSize))};
}

export async function reviewPublicInquiry(tx:Tx,a:Actor,input:Input):Promise<Row>{
 authorize(a,'crm','update');
 const parsed=z.object({id:z.uuid(),expectedRevision:z.number().int().min(1),status:z.enum(['OPEN','IN_REVIEW','RESPONDED','CLOSED','SPAM']),note:z.string().trim().min(3).max(2000),contacted:z.boolean().default(false)}).strict().safeParse(input);
 if(!parsed.success)fail('INQUIRY_REVIEW_INPUT_INVALID',400);const v=parsed.data;
 if(v.status==='RESPONDED'&&!v.contacted)fail('INQUIRY_CONTACT_CONFIRMATION_REQUIRED',400);
 const row=await get(tx,a,'follow_ups',v.id,true);if(row.data.kind!=='PUBLIC_QUOTE_INQUIRY')fail('PUBLIC_INQUIRY_REQUIRED');
 const updated=await update(tx,a,'follow_ups',row.id,{status:v.status,expectedRevision:v.expectedRevision,data:{...row.data,
  review:{note:v.note,at:new Date().toISOString(),by:a.userId},
  // Staff attests to contact performed outside this slice. No mail is sent here.
  ...(v.status==='RESPONDED'?{externalCommunication:'STAFF_REPORTED_CONTACT',contactReportedAt:new Date().toISOString(),contactReportedBy:a.userId}:{}),
 }});
 const tasks=(await tx.query("select id from app.work_items where tenant_id=$1 and workspace_id=$2 and data->>'kind'='PUBLIC_QUOTE_REVIEW' and data->>'publicInquiryId'=$3 for update",[a.tenantId,a.workspaceId,row.id])).rows;
 for(const task of tasks)await update(tx,a,'work_items',task.id,{status:['RESPONDED','CLOSED','SPAM'].includes(v.status)?'COMPLETE':'OPEN'});
 await event(tx,a,'crm.public_quote_inquiry_reviewed',row.id,{status:v.status});return updated;
}
