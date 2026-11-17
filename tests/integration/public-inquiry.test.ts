import {randomUUID} from 'node:crypto';
import {afterAll,afterEach,beforeAll,describe,expect,it,vi} from 'vitest';
import {actors} from '../helpers';
import {pool,transaction,create,type Actor,type Row} from '../../packages/kernel/src';
import {handleCrm} from '../../packages/crm/src';
import {publicInquirySchema,savePublicInquiry,publicInquiryInbox,reviewPublicInquiry,type PublicInquiryInput} from '../../packages/crm/src/public-inquiries';
import {publicInquiryGET,publicInquiryPOST} from '../../packages/server/src/public-inquiry';
let owner:Actor,customer:Actor,otherOwner:Actor;
beforeAll(async()=>({owner,customer,otherOwner}=await actors()));afterAll(async()=>{await pool().end();});
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();});
const origin='http://localhost:3000';
function input():PublicInquiryInput{return {key:randomUUID(),projectName:'SYNTHETIC public project '+randomUUID().slice(0,8),contactName:'SYNTHETIC Visitor',email:`visitor-${randomUUID()}@example.test`,company:'Synthetic only',phone:'',notes:'SYNTHETIC request for caps and event printing; specifications and costs need a reviewed quote.',deliveryCountry:'US',deliveryPostalCode:'60601',requestedDate:'',hardDeadline:false,contactPermission:true,website:''};}
function configure(){for(const [k,v] of Object.entries({APP_ORIGIN:origin,TWELVESPEC_ENV:'test',PUBLIC_INQUIRY_MODE:'synthetic-local',PUBLIC_INQUIRY_TENANT_ID:owner.tenantId,PUBLIC_INQUIRY_WORKSPACE_ID:owner.workspaceId,PUBLIC_INQUIRY_ASSIGNEE_ID:owner.userId}))vi.stubEnv(k,v);}
function post(body:unknown,headers:Record<string,string>={},url=origin){return publicInquiryPOST(new Request(url+'/api/inquiry',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)}));}
function payload(v=input()){return {...v,challengeToken:'synthetic-local-inquiry'};}
async function row(reference:string){return transaction(owner,async tx=>(await tx.query('select * from app.follow_ups where id=$1',[reference])).rows[0] as Row);}

describe('account-free quote intake → existing private CRM',()=>{
 it('is disabled by default and requires explicit scope, an eligible assignee and safe activation',async()=>{
  vi.stubEnv('PUBLIC_INQUIRY_MODE','');expect(await (await publicInquiryGET()).json()).toEqual({enabled:false});expect((await post(payload())).status).toBe(503);
  configure();vi.stubEnv('PUBLIC_INQUIRY_ASSIGNEE_ID',customer.userId);expect((await publicInquiryGET()).status).toBe(503);
  vi.stubEnv('PUBLIC_INQUIRY_ASSIGNEE_ID',owner.userId);vi.stubEnv('PUBLIC_INQUIRY_WORKSPACE_ID',otherOwner.workspaceId);expect((await publicInquiryGET()).status).toBe(503);
  configure();vi.stubEnv('APP_ORIGIN','https://quotes.example.test');expect((await publicInquiryGET()).status).toBe(503);
  configure();vi.stubEnv('PUBLIC_INQUIRY_MODE','live');expect((await publicInquiryGET()).status).toBe(503);
 });
 it('commits one receipt and existing follow-up, never a customer, contact merge, quote, marketing grant or email',async()=>{
  configure();const v=input();const existing=await transaction(owner,tx=>create(tx,owner,'contacts',{title:'SYNTHETIC existing verified contact',status:'ACTIVE',data:{email:v.email,consent:{marketing:true,source:'Existing separate permission'},emailVerified:true}}));
  const before=Number((await pool().query('select count(*) n from "user"')).rows[0].n);
  const data=payload(v),responses=await Promise.all([post(data),post(data)]);expect(responses.map(r=>r.status)).toEqual([201,201]);
  const receipts=await Promise.all(responses.map(r=>r.json()));expect(receipts[0]).toEqual(receipts[1]);expect(Object.keys(receipts[0])).toEqual(['receipt']);expect(Object.keys(receipts[0].receipt).sort()).toEqual(['reference','status']);expect(JSON.stringify(receipts)).not.toMatch(/submittedEmail|emailVerified|tenant_id|workspace_id|contactPermission|externalCommunication|SYNTHETIC Visitor/);
  const r=await row(receipts[0].receipt.reference);expect(r).toMatchObject({owner_id:owner.userId,status:'OPEN',data:{kind:'PUBLIC_QUOTE_INQUIRY',emailVerified:false,submittedEmail:v.email,contactPermission:{marketing:false,purpose:'REQUESTED_PROJECT_FOLLOW_UP'},externalCommunication:'NOT_SENT',quoteFirst:true}});
  expect(r.contact_id).toBeNull();expect((await transaction(owner,tx=>tx.query('select data from app.contacts where id=$1',[existing.id]))).rows[0].data).toEqual(existing.data);expect(Number((await pool().query('select count(*) n from "user"')).rows[0].n)).toBe(before);
  const tasks=await transaction(owner,tx=>tx.query("select status,data from app.work_items where data->>'publicInquiryId'=$1",[r.id]));expect(tasks.rows).toHaveLength(1);expect(tasks.rows[0].status).toBe('OPEN');expect(JSON.stringify(tasks.rows)).not.toContain(v.email);
  expect((await post({...data,notes:v.notes+' changed'})).status).toBe(409);
  expect(responses[0].headers.get('cache-control')).toContain('no-store');
  const metadata=await (await publicInquiryGET()).json();expect(metadata).toEqual({enabled:true,synthetic:true,sitekey:'',action:'quote_inquiry'});
 });
 it('rejects forged scope, absent consent, spam, bad dates, wrong origins and malformed or oversized bodies',async()=>{
  configure();
  for(const change of [{tenantId:otherOwner.tenantId},{ownerId:customer.userId},{module:'sales'},{contactPermission:false},{notes:'short'},{email:'not email'}])expect((await post({...payload(),...change})).status).toBe(400);
  expect((await post({...payload(),website:'spam.test'})).status).toBe(400);
  expect((await post({...payload(),requestedDate:'2030-02-30'})).status).toBe(400);
  expect((await post({...payload(),hardDeadline:true})).status).toBe(400);
  expect((await post(payload(),{Origin:'https://attacker.example.test'})).status).toBe(403);
  expect((await post(payload(),{Origin:'http://localhost:3001'},'http://localhost:3001')).status).toBe(403);
  expect((await post(payload(),{'Content-Type':'text/plain'})).status).toBe(415);
  expect((await post('{broken')).status).toBe(400);
  expect((await post('x'.repeat(16385))).status).toBe(413);
  expect((await post('x'.repeat(16385),{'Content-Length':'1'})).status).toBe(413);
  expect((await post(payload(),{'Content-Length':'17000'})).status).toBe(413);
 });
 it('serializes per-email and whole-workspace caps while allowing already committed retries',async()=>{
  configure();vi.stubEnv('PUBLIC_INQUIRY_EMAIL_HOURLY_LIMIT','2');const v=input();
  const results=await Promise.all(Array.from({length:3},()=>post(payload({...v,key:randomUUID()}))));expect(results.map(r=>r.status).sort()).toEqual([201,201,429]);
  const actor=otherOwner;
  const prior=await transaction(actor,async tx=>Number((await tx.query("select count(*) n from app.follow_ups where data->>'kind'='PUBLIC_QUOTE_INQUIRY' and created_at>now()-interval '1 hour'")).rows[0].n));
  const inputs=[input(),input(),input()];const capped=await Promise.allSettled(inputs.map(v=>transaction(actor,tx=>savePublicInquiry(tx,actor,v,{hourly:prior+2,daily:10000,emailHourly:10,emailDaily:10}))));
  expect(capped.filter(r=>r.status==='fulfilled')).toHaveLength(2);expect((capped.find(r=>r.status==='rejected') as PromiseRejectedResult).reason.message).toBe('INQUIRY_RATE_LIMIT');
  const index=capped.findIndex(r=>r.status==='fulfilled'),retry=await transaction(actor,tx=>savePublicInquiry(tx,actor,inputs[index],{hourly:1,daily:1,emailHourly:1,emailDaily:1}));expect(retry).toEqual((capped[index] as PromiseFulfilledResult<unknown>).value);
 });
 it('uses exact challenge hostname/action/age; rejects failed service responses and token replay without leaking secrets',async()=>{
  configure();const liveOrigin='https://quotes.example.test';
  for(const [k,v] of Object.entries({APP_ORIGIN:liveOrigin,DATABASE_URL:'postgresql://fixture@database.example.test/test',TWELVESPEC_ENV:'production',PUBLIC_INQUIRY_MODE:'live',PUBLIC_INQUIRY_LIVE_APPROVED:'1',SEED_AUTH:'0',TURNSTILE_SITE_KEY:'synthetic-site-key',TURNSTILE_SECRET:'synthetic-secret-never-return'}))vi.stubEnv(k,v);
  vi.stubEnv('TWELVESPEC_PREVIEW','1');expect((await publicInquiryGET()).status).toBe(503);vi.stubEnv('TWELVESPEC_PREVIEW','0');
  const ok={success:true,hostname:'quotes.example.test',action:'quote_inquiry',challenge_ts:new Date().toISOString()};
  for(const result of [{...ok,success:false},{...ok,hostname:'other.example.test'},{...ok,action:'other'},{...ok,challenge_ts:'2020-01-01T00:00:00Z'},{...ok,challenge_ts:'bad'},null]){
   vi.stubGlobal('fetch',vi.fn().mockResolvedValue(Response.json(result)));expect((await post({...payload(),challengeToken:'synthetic-provider-token'},{Origin:liveOrigin},liveOrigin)).status).toBe(403);
  }
  const fetcher=vi.fn().mockResolvedValueOnce(Response.json(ok)).mockResolvedValueOnce(Response.json({success:false,'error-codes':['timeout-or-duplicate']}));vi.stubGlobal('fetch',fetcher);
  const body={...payload(),challengeToken:'synthetic-provider-token'};const accepted=await post(body,{Origin:liveOrigin},liveOrigin);expect(accepted.status).toBe(201);expect((await post(body,{Origin:liveOrigin},liveOrigin)).status).toBe(403);
  expect(fetcher.mock.calls[0][0]).toBe('https://challenges.cloudflare.com/turnstile/v0/siteverify');expect(JSON.stringify(await accepted.json())).not.toContain('synthetic-secret');
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('synthetic network failure')));expect((await post(body,{Origin:liveOrigin},liveOrigin)).status).toBe(403);
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('unavailable',{status:503})));expect((await post(body,{Origin:liveOrigin},liveOrigin)).status).toBe(403);
 });
 it('keeps private requests inside the configured workspace and staff roles',async()=>{
  configure();const submitted=await (await post(payload(),{'x-workspace-id':otherOwner.workspaceId})).json(),r=await row(submitted.receipt.reference);expect(r.workspace_id).toBe(owner.workspaceId);
  expect((await transaction(customer,tx=>tx.query('select * from app.follow_ups where id=$1',[r.id]))).rows).toEqual([]);
  expect((await transaction(otherOwner,tx=>publicInquiryInbox(tx,otherOwner,{status:'ALL'}))).rows.some(x=>x.id===r.id)).toBe(false);
  await expect(transaction(customer,tx=>handleCrm(tx,customer,'public_inquiry_inbox',{}))).rejects.toThrow('PERMISSION_DENIED');
  await expect(transaction(customer,tx=>reviewPublicInquiry(tx,customer,{id:r.id,expectedRevision:1,status:'SPAM',note:'Unauthorized'}))).rejects.toThrow('PERMISSION_DENIED');
 });
 it('rolls back the inbox row, receipt and audit/outbox together on a transaction failure',async()=>{
  const v=input();let reference='';
  await expect(transaction(owner,async tx=>{reference=(await savePublicInquiry(tx,owner,v)).reference;throw new Error('SYNTHETIC transaction failure');})).rejects.toThrow('SYNTHETIC transaction failure');
  await transaction(owner,async tx=>{
   expect((await tx.query('select id from app.follow_ups where id=$1',[reference])).rows).toEqual([]);
   expect((await tx.query("select id from app.work_items where data->>'publicInquiryId'=$1",[reference])).rows).toEqual([]);
   expect((await tx.query("select id from app.command_receipts where title='crm.public_quote_inquiry' and data->>'key'=$1",[v.key])).rows).toEqual([]);
   for(const table of ['audit_events','outbox_events'])expect((await tx.query(`select id from app.${table} where data->>'entityId'=$1`,[reference])).rows).toEqual([]);
  });
 });
 it('paginates actual inbox queries beyond generic list limits and requires a revision and truthful response attestation',async()=>{
  const v=publicInquirySchema.parse(input()),receipt=await transaction(owner,tx=>savePublicInquiry(tx,owner,v));
  await transaction(owner,tx=>tx.query("insert into app.follow_ups(tenant_id,workspace_id,owner_id,title,status,data) select $1,$2,$3,'SYNTHETIC unrelated later follow-ups','OPEN','{}'::jsonb from generate_series(1,1001)",[owner.tenantId,owner.workspaceId,owner.userId]));
  await transaction(owner,tx=>tx.query("insert into app.follow_ups(tenant_id,workspace_id,owner_id,title,status,data) select $1,$2,$3,'SYNTHETIC newer website inquiries','OPEN',jsonb_build_object('kind','PUBLIC_QUOTE_INQUIRY') from generate_series(1,12)",[owner.tenantId,owner.workspaceId,owner.userId]));
  const all=await transaction(owner,tx=>publicInquiryInbox(tx,owner,{status:'ALL'})),second=await transaction(owner,tx=>publicInquiryInbox(tx,owner,{status:'ALL',page:2}));expect(all.totalPages).toBeGreaterThan(1);expect(all.rows).toHaveLength(10);expect(second.rows.some(r=>r.id===receipt.reference)).toBe(true);expect(second.rows.every(r=>!all.rows.some(x=>x.id===r.id))).toBe(true);
  const r=await row(receipt.reference),change={id:r.id,expectedRevision:r.revision,status:'IN_REVIEW',note:'SYNTHETIC review; contact details still need confirmation'};
  await expect(transaction(owner,tx=>reviewPublicInquiry(tx,owner,{...change,expectedRevision:99}))).rejects.toThrow('REVISION_CONFLICT');
  await expect(transaction(owner,tx=>reviewPublicInquiry(tx,owner,{...change,status:'RESPONDED'}))).rejects.toThrow('INQUIRY_CONTACT_CONFIRMATION_REQUIRED');
  const reviewed=await transaction(owner,tx=>reviewPublicInquiry(tx,owner,change));expect(reviewed.status).toBe('IN_REVIEW');expect(reviewed.data.externalCommunication).toBe('NOT_SENT');
  const done=await transaction(owner,tx=>reviewPublicInquiry(tx,owner,{...change,expectedRevision:reviewed.revision,status:'RESPONDED',contacted:true}));expect(done.data.externalCommunication).toBe('STAFF_REPORTED_CONTACT');expect(done.data.emailVerified).toBe(false);
  expect((await transaction(owner,tx=>tx.query("select status from app.work_items where data->>'publicInquiryId'=$1",[r.id]))).rows[0].status).toBe('COMPLETE');
 });
});
