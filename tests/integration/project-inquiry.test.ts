import {randomUUID} from 'node:crypto';
import {beforeAll,afterAll,describe,it,expect} from 'vitest';
import {actors} from '../helpers';
import {transaction,pool,create,get,update,type Actor,type Row,type Input} from '../../packages/kernel/src';
import {handleCommerce} from '../../packages/commerce/src';
import {handleSales,publicRequest} from '../../packages/sales/src';
import {customerSafeObject} from '../../packages/server/src/customer-projection';
let owner:Actor,otherOwner:Actor;
beforeAll(async()=>({owner,otherOwner}=await actors()));afterAll(async()=>{await pool().end();});
async function fixture(){
 const id=randomUUID(),email=`inquiry-${id}@example.test`;await pool().query('insert into "user"(id,name,email) values($1,$2,$3)',[id,'SYNTHETIC project buyer',email]);await pool().query('insert into memberships(user_id,tenant_id,workspace_id,role) values($1,$2,$3,$4)',[id,owner.tenantId,owner.workspaceId,'customer']);
 const customer={...owner,userId:id,role:'customer',email:'forged-actor-field@example.test'} as Actor;
 const input={key:randomUUID(),projectName:'SYNTHETIC product-free project',contactName:'SYNTHETIC Buyer',company:'Test fixtures',phone:'',notes:'We need 48 caps for a synthetic event and need help selecting the product.',deliveryCountry:'US',deliveryPostalCode:'60601',requestedDate:'',hardDeadline:false,contactPermission:true,website:''};
 const submit=(change:Input={})=>transaction(customer,tx=>handleCommerce(tx,customer,'submit_inquiry',{...input,...change})) as Promise<Row>;
 return {customer,email,input,submit};
}
describe('product-free project → requested CRM follow-up → exact product scope → existing quote',()=>{
 it('saves a private authenticated inquiry, no fabricated SKU, quote or marketing consent; retries do not duplicate',async()=>{
  const f=await fixture(),request=await f.submit(),retry=await f.submit();expect(retry.id).toBe(request.id);expect(request.data).toMatchObject({kind:'PROJECT_INQUIRY',lines:[],quoteFirst:true,contactPermission:{purpose:'REQUESTED_PROJECT_FOLLOW_UP',marketing:false}});
  await expect(transaction(owner,tx=>handleSales(tx,owner,'create',{requestId:request.id}))).rejects.toThrow('INQUIRY_NEEDS_PRODUCT_SCOPE');
  expect((await pool().query('select count(*)::int n from app.quotes where request_id=$1',[request.id])).rows[0].n).toBe(0);
 });
 it('validates requested contact, spam/size bounds and real dates, and serializes a five-per-hour cap',async()=>{
  const f=await fixture();
  for(const change of [{contactPermission:false},{notes:'short'},{notes:'x'.repeat(4001)},{email:'injected@example.test'}])await expect(f.submit(change)).rejects.toThrow('INQUIRY_INPUT_INVALID');
  await expect(f.submit({website:'spam.example.test'})).rejects.toThrow('INQUIRY_REJECTED');
  await expect(f.submit({hardDeadline:true})).rejects.toThrow('DEADLINE_DATE_REQUIRED');
  await expect(f.submit({requestedDate:'2026-02-30'})).rejects.toThrow('REQUESTED_DATE_INVALID');
  const results=await Promise.allSettled(Array.from({length:6},()=>f.submit({key:randomUUID()})));expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(5);const rejected=results.find(r=>r.status==='rejected') as PromiseRejectedResult;expect(rejected.reason.message).toBe('INQUIRY_RATE_LIMIT');
 });
 it('links one CRM contact and follow-up using the account email, without sending or exposing internal records',async()=>{
  const f=await fixture(),request=await f.submit(),key=randomUUID();
  const results=await Promise.all([key,randomUUID()].map(k=>transaction(owner,tx=>handleSales(tx,owner,'link_inquiry_to_crm',{requestId:request.id,key:k})))) as {request:Row;followUp:Row}[];
  expect(results[0].followUp.id).toBe(results[1].followUp.id);expect(results[0].followUp.data).toMatchObject({requestId:request.id,externalCommunication:'NOT_SENT'});
  const contact=await transaction(owner,tx=>get(tx,owner,'contacts',results[0].followUp.contact_id));expect(contact.data.email).toBe(f.email);expect((contact.data.consent as Input).marketing).toBe(false);
  const customerView=publicRequest(results[0].request);expect(JSON.stringify(customerView)).not.toMatch(/internalCrmContactId|internalCrmFollowUpId|contactPermission|internalScopeReview|operatorNote/);expect(customerView.data.brief.contactName).toBe('SYNTHETIC Buyer');
  // Older applications use this generic filter: private additions retain its
  // existing internal-field convention, so rolling back does not reveal IDs.
  expect(JSON.stringify(customerSafeObject(results[0].request))).not.toContain(results[0].followUp.id);
  expect(JSON.stringify(customerSafeObject(results[0].request))).not.toContain(contact.id);
  await expect(transaction(f.customer,tx=>handleSales(tx,f.customer,'link_inquiry_to_crm',{requestId:request.id,key:randomUUID()}))).rejects.toThrow('PERMISSION_DENIED');
  await expect(transaction(otherOwner,tx=>handleSales(tx,otherOwner,'link_inquiry_to_crm',{requestId:request.id,key:randomUUID()}))).rejects.toThrow('NOT_FOUND');
 });
 it('reuses an older CRM contact beyond 1000 newer contacts, preserving its consent',async()=>{
  const f=await fixture(),request=await f.submit();
  const contact=await transaction(owner,tx=>create(tx,owner,'contacts',{title:'SYNTHETIC existing inquiry contact',status:'ACTIVE',data:{email:f.email,consent:{marketing:true,source:'SYNTHETIC existing permission'}}}));
  await transaction(owner,tx=>tx.query("insert into app.contacts(tenant_id,workspace_id,owner_id,title,status,data) select $1,$2,$3,'SYNTHETIC newer contacts','ACTIVE',jsonb_build_object('email','newer-'||gen_random_uuid()||'@example.test') from generate_series(1,1001)",[owner.tenantId,owner.workspaceId,owner.userId]));
  const result=await transaction(owner,tx=>handleSales(tx,owner,'link_inquiry_to_crm',{requestId:request.id,key:randomUUID()})) as {followUp:Row};expect(result.followUp.contact_id).toBe(contact.id);expect((await transaction(owner,tx=>get(tx,owner,'contacts',contact.id))).data).toEqual(contact.data);
 });
 it('validates exact published product scope, preserves the original need, then prepares the normal draft quote',async()=>{
  const f=await fixture(),request=await f.submit();const {product,variant}=await transaction(owner,async tx=>{const product=await create(tx,owner,'products',{title:'SYNTHETIC selected cap',status:'PUBLISHED',data:{minimumQuantity:24,methods:['embroidery'],locations:['front'],synthetic:true}});const variant=await create(tx,owner,'variants',{title:'SYNTHETIC Navy',product_id:product.id,status:'ACTIVE',data:{color:'Navy',size:'One size'}});return {product,variant};});
  const input={requestId:request.id,key:randomUUID(),expectedRevision:request.revision,reference:'SYNTHETIC operator proposed scope for customer review',lines:[{productId:product.id,variantId:variant.id,quantity:48,method:'embroidery',location:'front',catalogRevision:1}]};
  await expect(transaction(f.customer,tx=>handleSales(tx,f.customer,'scope_inquiry',input))).rejects.toThrow('PERMISSION_DENIED');
  await expect(transaction(owner,tx=>handleSales(tx,owner,'scope_inquiry',{...input,expectedRevision:99}))).rejects.toThrow('REVISION_CONFLICT');
  const scoped=await transaction(owner,tx=>handleSales(tx,owner,'scope_inquiry',input)) as Row;expect(scoped.data.internalOriginalInquiry).toEqual(request.data.brief);expect(scoped.data.lines).toHaveLength(1);expect(scoped.status).toBe('IN_REVIEW');
  const quote=await transaction(owner,tx=>handleSales(tx,owner,'create',{requestId:request.id})) as Row;expect(quote.status).toBe('DRAFT');expect(quote.data.lines).toEqual(scoped.data.lines);expect(quote.owner_id).toBe(f.customer.userId);
  expect(JSON.stringify(publicRequest(scoped))).not.toMatch(/internalOriginalInquiry|internalScopeReview|reviewedBy/);
  expect(JSON.stringify(customerSafeObject(scoped))).not.toContain(input.reference);
  await expect(transaction(owner,tx=>handleSales(tx,owner,'scope_inquiry',{...input,key:randomUUID(),expectedRevision:scoped.revision+1}))).rejects.toThrow('INQUIRY_ALREADY_QUOTED');
 });
});
