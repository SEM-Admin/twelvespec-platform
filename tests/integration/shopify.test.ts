import {beforeAll,describe,it,expect} from 'vitest';
import {randomUUID} from 'node:crypto';
import {actors} from '../helpers';
import {transaction,type Actor,type Input,type Row} from '../../packages/kernel/src';
import {handleSupplier} from '../../packages/supplier/src';
import {catalogSourceLibrary} from '../../packages/catalog/src/sources';

let owner:Actor,customer:Actor,otherOwner:Actor;
beforeAll(async()=>{({owner,customer,otherOwner}=await actors());});
const command=(action:string,input:Input)=>transaction(owner,tx=>handleSupplier(tx,owner,action,input));
async function channel(){const domain=`test-${randomUUID().slice(0,8)}.myshopify.com`;const connection=await command('create_connection',{providerType:'SHOPIFY',displayName:'Synthetic Shopify channel',shopDomain:domain,environment:'mock'}) as Row;return {connection,domain};}

describe('Shopify scoped development channel',()=>{
 it('stages repeat-safe private synthetic evidence with no invented costs, variants or publication',async()=>{
  const {connection,domain}=await channel(),key=randomUUID();
  const result=await command('shopify_demo_import',{id:connection.id,idempotencyKey:key}) as Input;expect(result).toMatchObject({created:2,autoPublished:0,verification:'MOCKED',externalRequests:0});
  expect(await command('shopify_demo_import',{id:connection.id,idempotencyKey:key})).toEqual(result);
  expect(await command('shopify_demo_import',{id:connection.id,idempotencyKey:randomUUID()})).toMatchObject({created:0,unchanged:2});
  const sources=await transaction(owner,tx=>catalogSourceLibrary(tx,owner,{supplier:`Shopify ${domain}`}));expect(sources.total).toBe(2);expect(sources.items.every((s:Row)=>s.data.environment==='SYNTHETIC'&&s.data.pricingCoverage==='UNVERIFIED'&&s.data.rightsStatus==='UNREVIEWED')).toBe(true);
  expect(sources.items.every(s=>!s.draft_id)).toBe(true);
 });
 it('keeps each merchant connection scoped and denies customer access',async()=>{
  const {connection}=await channel();await expect(transaction(otherOwner,tx=>handleSupplier(tx,otherOwner,'shopify_demo_import',{id:connection.id,idempotencyKey:randomUUID()}))).rejects.toThrow('NOT_FOUND');await expect(transaction(customer,tx=>handleSupplier(tx,customer,'create_connection',{providerType:'SHOPIFY',displayName:'Forbidden',shopDomain:'example.myshopify.com'}))).rejects.toThrow('PERMISSION_DENIED');
 });
 it('blocks real activation, outbound publishing/orders, retail cost mapping and disabled imports',async()=>{
  await expect(command('create_connection',{providerType:'SHOPIFY',displayName:'Real store',shopDomain:'example.myshopify.com',environment:'sandbox'})).rejects.toThrow('SHOPIFY_INSTALLATION_REQUIRED');
  const {connection}=await channel();for(const action of ['shopify_activate','shopify_publish','shopify_orders','schedule_sync'])await expect(command(action,{id:connection.id})).rejects.toThrow('SHOPIFY_INSTALLATION_REQUIRED');
  await expect(command('configure_pricing',{id:connection.id,pricePolicy:{}})).rejects.toThrow('SHOPIFY_RETAIL_PRICE_NOT_SUPPLIER_COST');await expect(command('sync_now',{id:connection.id})).rejects.toThrow('SHOPIFY_USE_EXPLICIT_DEMO_IMPORT');
  const capability=await command('test_connection',{id:connection.id}) as Input;expect((capability.capabilities as Input[]).every(c=>c.verification==='MOCKED')).toBe(true);
  await command('disable',{id:connection.id});await expect(command('shopify_demo_import',{id:connection.id,idempotencyKey:randomUUID()})).rejects.toThrow('SHOPIFY_CONNECTION_NOT_AVAILABLE');
 });
});
