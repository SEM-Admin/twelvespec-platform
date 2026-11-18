import {afterAll,beforeAll,expect,it,vi} from 'vitest';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {performance} from 'node:perf_hooks';
import {actors} from '../helpers';
import {pool,transaction,type Actor,type Input,type Row} from '../../packages/kernel/src';
import {handleNativeSupplier} from '../../packages/supplier/src/native';
import {type ApiPolicy,type Usage} from '../../packages/supplier/src/api-budget';
import {handleCatalog} from '../../packages/catalog/src';
import {supplierReceiptPrivacy} from '../../infra/supabase/development-privacy';

type Dashboard={policy:ApiPolicy;revision:number;usage:Usage;cacheHits:number;accountReservedCost:string;calls:Input[]};
type Read={callId:string;verification:string;cacheHit:boolean;result:Input};
let owner:Actor,customer:Actor,otherOwner:Actor;
beforeAll(async()=>{({owner,customer,otherOwner}=await actors());await pool().query(supplierReceiptPrivacy());});
afterAll(async()=>{vi.unstubAllEnvs();await pool().end();});
const dashboard=async(id:string)=>await handleNativeSupplier(owner,'api_dashboard',{id}) as Dashboard;
const published=async()=>transaction(owner,async tx=>(await tx.query("select id,revision from app.products where tenant_id=$1 and workspace_id=$2 and status='PUBLISHED' order by id",[owner.tenantId,owner.workspaceId])).rows);

it('rehearses bounded SAGE curation and repeated cached reads without overage or public catalog changes',async()=>{
 const external=vi.fn(async()=>{throw new Error('Pilot must never contact a supplier.');});
 const c=await handleNativeSupplier(owner,'api_create_connection',{providerType:'SAGE_CONNECT',environment:'mock',accountIdentifier:String(10000000+Math.floor(Math.random()*80000000)),loginId:'System',displayName:'SYNTHETIC SAGE efficiency rehearsal'}) as {id:string};
 const initial=await dashboard(c.id);
 await handleNativeSupplier(owner,'api_save_policy',{id:c.id,expectedRevision:initial.revision,reason:'Synthetic pilot only; four reads, three test credits, zero paid allowance.',policy:{...initial.policy,enabled:true,dailyCalls:4,monthlyCalls:4,minuteCalls:4,runCalls:4,monthlyUnits:4,monthlySpend:'0',includedUnits:3,cacheMinutes:60,rates:{research:{units:1,unitCost:'0',free:true},search:{units:1,unitCost:null,free:false},detail:{units:1,unitCost:null,free:false},full_detail:{units:1,unitCost:null,free:false}}}});
 const read=async(input:Input)=>await handleNativeSupplier(owner,'api_read',{id:c.id,...input,idempotencyKey:crypto.randomUUID()},external) as Read;
 const plan:Input[]=[{operation:'research'},{operation:'search',category:'SYNTHETIC Drinkware'},{operation:'detail',productId:123456},{operation:'full_detail',productId:987654}];
 const fresh:Read[]=[];for(const request of plan)fresh.push(await read(request));
 for(const result of fresh){expect(result.cacheHit).toBe(false);expect(result.verification).toBe('MOCKED');}
 const timings:number[]=[];
 for(let n=0;n<40;n++){const start=performance.now();const result=await read(plan[n%plan.length]);timings.push(performance.now()-start);expect(result.cacheHit).toBe(true);}
 const usage=await dashboard(c.id);expect(usage.usage).toMatchObject({monthCalls:4,dayCalls:4,units:4,creditUnits:3});expect(Number(usage.usage.cost)).toBe(0);expect(Number(usage.accountReservedCost)).toBe(0);expect(usage.cacheHits).toBe(40);expect(external).not.toHaveBeenCalled();
 await expect(read({operation:'search',category:'SYNTHETIC another category',forceRefresh:true})).rejects.toThrow('API_MONTHLY_CALL_CAP');
 const publicBefore=await published();const selected=fresh[3];
 expect(await handleNativeSupplier(owner,'api_stage_result',{id:c.id,callId:selected.callId,selectedIds:['987654']})).toMatchObject({created:1,autoPublished:0,verification:'MOCKED'});
 const source=await transaction(owner,async tx=>(await tx.query("select * from app.source_records where tenant_id=$1 and workspace_id=$2 and data->>'apiConnectionId'=$3 and data->>'apiEvidenceCallId'=$4",[owner.tenantId,owner.workspaceId,c.id,selected.callId])).rows[0] as Row);
 expect(source.data.displayUse).toBe('PUBLIC_REVIEW_REQUIRED');
 const draft=await transaction(owner,tx=>handleCatalog(tx,owner,'create_from_source',{id:source.id})) as Row;
 expect(draft.status).toBe('DRAFT');expect(draft.data.methods).toEqual([]);expect(await published()).toEqual(publicBefore);
 await handleNativeSupplier(owner,'api_pause',{id:c.id});await expect(read(plan[0])).rejects.toThrow('API_PAUSED');
 const sorted=timings.sort((a,b)=>a-b),ms=(value:number)=>Math.round(value*100)/100;
 const report={checkedAt:new Date().toISOString(),verification:'MOCKED',database:'DISPOSABLE_LOCAL_POSTGRESQL',actualExternalRequests:0,realSageConnectionVerified:false,simulatedReadsReserved:4,simulatedCreditUnits:3,cacheHits:40,cacheReadShare:40/44,reservedPaidFees:'0.000000',sharedAccountReservedFees:'0.000000',extraUncachedReadBlocked:'API_MONTHLY_CALL_CAP',pausedReadBlocked:'API_PAUSED',selectedSourcesStaged:1,privateDraftsCreated:1,productsPublished:0,localCachedReadMs:{median:ms(sorted[Math.floor(sorted.length/2)]),p95:ms(sorted[Math.ceil(sorted.length*.95)-1])},limits:'Synthetic query weights and local timing do not establish SAGE billing or hosted capacity.'};
 mkdirSync(resolve(process.env.TWELVESPEC_ROOT!,'.local'),{recursive:true,mode:0o700});writeFileSync(resolve(process.env.TWELVESPEC_ROOT!,'.local/sage-pilot-report.json'),JSON.stringify(report,null,2)+'\n',{mode:0o600});
});

it('keeps unconfigured real SAGE reads, ephemeral secrets and unauthorized access blocked before transport',async()=>{
 vi.stubEnv('TWELVESPEC_API_METER_STORAGE','');
 const external=vi.fn(async()=>({ok:true,items:[]}));
 const accountIdentifier=String(10000000+Math.floor(Math.random()*80000000));
 const c=await handleNativeSupplier(owner,'api_create_connection',{providerType:'SAGE_CONNECT',environment:'live_readonly',accountIdentifier,loginId:'System',displayName:'SYNTHETIC blocked real-account readiness check'}) as {id:string};
 await expect(handleNativeSupplier(owner,'api_save_credentials',{id:c.id,credentials:{accountId:accountIdentifier,loginId:'System',authKey:'synthetic-only-never-a-supplier-key'}})).rejects.toThrow('API_DURABLE_METER_REQUIRED');
 await expect(handleNativeSupplier(owner,'api_read',{id:c.id,operation:'research',idempotencyKey:crypto.randomUUID()},external)).rejects.toThrow('API_CREDENTIAL_REQUIRED');
 await expect(handleNativeSupplier(customer,'api_dashboard',{id:c.id})).rejects.toThrow('PERMISSION_DENIED');
 await expect(handleNativeSupplier(otherOwner,'api_dashboard',{id:c.id})).rejects.toThrow('NOT_FOUND');
 expect(external).not.toHaveBeenCalled();expect((await dashboard(c.id)).usage.monthCalls).toBe(0);vi.unstubAllEnvs();
});

it('pins the receipt trigger search path and removes public execution while retaining immutable charges',async()=>{
 const metadata=(await pool().query("select p.proconfig,exists(select 1 from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a where a.grantee=0 and a.privilege_type='EXECUTE') public_execute from pg_proc p where p.oid='app.protect_supplier_api_call()'::regprocedure")).rows[0];
 expect(metadata.proconfig).toHaveLength(1);expect(metadata.proconfig[0]).toMatch(/^search_path=pg_catalog,\s*app$/);expect(metadata.public_execute).toBe(false);
 const c=await handleNativeSupplier(owner,'api_create_connection',{providerType:'SAGE_CONNECT',environment:'mock',accountIdentifier:String(10000000+Math.floor(Math.random()*80000000)),loginId:'System',displayName:'SYNTHETIC hardened receipt verification'}) as {id:string};
 const d=await dashboard(c.id);await handleNativeSupplier(owner,'api_save_policy',{id:c.id,expectedRevision:d.revision,reason:'Synthetic trigger verification only',policy:{...d.policy,enabled:true}});
 const result=await handleNativeSupplier(owner,'api_read',{id:c.id,operation:'research',idempotencyKey:crypto.randomUUID()}) as Read;
 await expect(transaction(owner,tx=>tx.query('update app.supplier_api_calls set cost_ceiling=cost_ceiling+1 where tenant_id=$1 and workspace_id=$2 and id=$3',[owner.tenantId,owner.workspaceId,result.callId]))).rejects.toThrow('Supplier API charge fields are immutable');
 expect((await dashboard(c.id)).usage.monthCalls).toBe(1);
});
