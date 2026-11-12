import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {Client} from 'pg';
import {it,expect} from 'vitest';
import {hash,type Actor,type Tx} from '../../packages/kernel/src';
import {recordPriceObservation,registerEvidenceSource} from '../../packages/intelligence/src';

it('upgrades an M1 database without rewriting original source, price, fingerprint or quote, and accepts the original retry',async()=>{
 const url=new URL(process.env.DATABASE_URL!);if(!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('Migration verification requires local isolated PostgreSQL.');
 const admin=new Client({connectionString:url.toString()}),database='twelvespec_upgrade_'+randomUUID().replaceAll('-','');await admin.connect();let db:Client|undefined;
 try{
  await admin.query(`create database ${database}`);url.pathname='/'+database;db=new Client({connectionString:url.toString()});await db.connect();
  const migrations=resolve(process.env.TWELVESPEC_ROOT!,'database/migrations');
  for(const file of readdirSync(migrations).filter(f=>f.endsWith('.sql')&&f<'013_').sort())await db.query(readFileSync(resolve(migrations,file),'utf8'));
  const tenant=randomUUID(),workspace=randomUUID(),user='SYNTHETIC-upgrade-'+randomUUID(),product=randomUUID(),variant=randomUUID(),quote=randomUUID();
  await db.query('insert into tenants(id,name) values($1,$2)',[tenant,'SYNTHETIC upgrade']);await db.query('insert into workspaces(id,tenant_id,name) values($1,$2,$3)',[workspace,tenant,'SYNTHETIC upgrade']);await db.query('insert into "user"(id,name,email) values($1,$2,$3)',[user,'SYNTHETIC upgrade',user+'@example.test']);await db.query("insert into memberships(user_id,tenant_id,workspace_id,role)values($1,$2,$3,'owner')",[user,tenant,workspace]);
  await db.query("insert into app.products(id,tenant_id,workspace_id,owner_id,title)values($1,$2,$3,$4,'SYNTHETIC upgrade cap')",[product,tenant,workspace,user]);await db.query("insert into app.variants(id,tenant_id,workspace_id,owner_id,title,product_id)values($1,$2,$3,$4,'SYNTHETIC Navy', $5)",[variant,tenant,workspace,user,product]);await db.query("insert into app.quotes(id,tenant_id,workspace_id,owner_id,title,data) values($1,$2,$3,$4,'SYNTHETIC existing quote',$5)",[quote,tenant,workspace,user,{currency:'USD',lines:[{productId:product,variantId:variant,quantity:48,method:'none',location:'front'}]}]);
  const actor:Actor={tenantId:tenant,workspaceId:workspace,userId:user,role:'owner'};
  async function runtime<T>(fn:(tx:Tx)=>Promise<T>){await db!.query('begin');try{await db!.query('set local role ts_runtime');await db!.query("select set_config('ts.tenant',$1,true),set_config('ts.workspace',$2,true),set_config('ts.user',$3,true),set_config('ts.role','owner',true)",[tenant,workspace,user]);const result=await fn(db as unknown as Tx);await db!.query('commit');return result;}catch(error){await db!.query('rollback');throw error;}}
  const now=new Date().toISOString(),past=new Date(Date.now()-3600000).toISOString(),future=new Date(Date.now()+86400000).toISOString();
  const source=await runtime(tx=>registerEvidenceSource(tx,actor,{sourceKey:'SYNTHETIC M1 upgrade',title:'SYNTHETIC original M1 source',publisher:'Test fixture',edition:'2026',contentHash:hash('SYNTHETIC'),origin:'SYNTHETIC',rightsReference:'SYNTHETIC fixture only',allowedUses:['INTERNAL_RESEARCH','QUOTE_COST'],rightsValidFrom:past,rightsValidUntil:future,retentionUntil:new Date(Date.now()+172800000).toISOString(),parserVersion:'fixture/1'}));
  const original={sourceId:source.id,observationKey:'SYNTHETIC original material',productId:product,variantId:variant,expectedProductRevision:1,expectedVariantRevision:1,priceClass:'DISTRIBUTOR_NET',originalValue:'0.0250',currency:'USD',unitBasis:'EACH',unitsPerPrice:1,minimumQuantity:24,maximumQuantity:1000,orderMultiple:1,territory:'US',channel:'DIRECT',observedAt:now,effectiveFrom:past,effectiveUntil:future,freshnessHours:24,evidenceState:'SYNTHETIC'};
  const fingerprint=hash({...original,accountId:null,maximumQuantity:1000,reviewReference:null});
  const price=(await db.query(`insert into app.price_observations(tenant_id,workspace_id,created_by,source_id,observation_key,product_id,variant_id,product_revision,variant_revision,price_class,original_value,unit_amount,source_scale,currency,unit_basis,units_per_price,minimum_quantity,maximum_quantity,order_multiple,territory,channel,observed_at,effective_from,effective_until,freshness_hours,evidence_state,fingerprint)
   values($1,$2,$3,$4,$5,$6,$7,1,1,'DISTRIBUTOR_NET','0.0250','0.02500000',4,'USD','EACH',1,24,1000,1,'US','DIRECT',$8,$9,$10,24,'SYNTHETIC',$11)returning *`,[tenant,workspace,user,source.id,original.observationKey,product,variant,now,past,future,fingerprint])).rows[0];
  const before={source:(await db.query('select * from app.intelligence_sources')).rows,quote:(await db.query('select * from app.quotes')).rows};
  await db.query(readFileSync(resolve(migrations,'013_process_profiles_and_qualification.sql'),'utf8'));
  expect((await db.query('select * from app.intelligence_sources')).rows).toEqual(before.source);expect((await db.query('select * from app.quotes')).rows).toEqual(before.quote);
  const upgraded=(await db.query('select * from app.price_observations')).rows[0],{component_code,charge_basis,process_profile_id,method,location,...unchanged}=upgraded;expect(unchanged).toEqual(price);expect({component_code,charge_basis,process_profile_id,method,location}).toEqual({component_code:'material_cost',charge_basis:'PER_ITEM',process_profile_id:null,method:null,location:null});
  const retry=await runtime(tx=>recordPriceObservation(tx,actor,original));expect(retry.id).toBe(price.id);expect(retry.fingerprint).toBe(fingerprint);
 }finally{await db?.end();await admin.query(`drop database if exists ${database} with(force)`);await admin.end();}
},30000);
