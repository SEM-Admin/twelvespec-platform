import Decimal from 'decimal.js';
import {authorize,create,event,fail,get,hash,text,transaction,update,type Actor,type Input,type Row,type Tx} from '../../kernel/src';
import {normalizeCatalogSource} from '../../catalog/src/sources';
import {boundedCatalogJson,nativeWireRequest,normalizeSinaliteCatalog,normalizeSinaliteOptions,normalizeSinalitePrice,verifySinalitePriceSelection,normalizeSageSearch,normalizeSageResearch,SAGE_SEARCH_MAPPING,storeCode,validatePrintSelection,validateSageMapping,type NativeTransport,type NativeRequest} from '../../providers/src/native-catalogs';
import {normalizeSageDetail} from '../../providers/src/sage-detail';
import {defaultPolicy,evaluateReservation,money,periodInZone,validateApiPolicy,type ApiPolicy,type NativeProvider,type NativeEnvironment,type Operation,type Usage} from './api-budget';
import {durableApiMeter,previewReadBlock} from './api-runtime';
import {replaceNativeCredentials,resolveNativeCredentials} from './api-vault';

export const NATIVE_ACTIONS=new Set(['api_create_connection','api_dashboard','api_save_policy','api_save_credentials','api_save_mapping','api_read','api_stage_result','api_pause']);
type Account={id:string;billing_group_id:string;provider:NativeProvider;environment:NativeEnvironment;policy:ApiPolicy;approval_period:string;revision:number;title:string;[key:string]:unknown};
const isNative=(row:Row)=>['SAGE_CONNECT','SINALITE'].includes(String(row.data.providerType))&&typeof row.data.apiAccountId==='string';
async function accountFor(tx:Tx,a:Actor,connection:Row,lock=false):Promise<Account>{
 if(!isNative(connection))fail('NATIVE_CONNECTION_REQUIRED',400);
 const found=(await tx.query(`select * from app.supplier_api_accounts where tenant_id=$1 and workspace_id=$2 and id=$3 ${lock?'for update':''}`,[a.tenantId,a.workspaceId,connection.data.apiAccountId])).rows[0];
 if(!found)fail('API_ACCOUNT_NOT_FOUND',404);return found;
}
async function usageFor(tx:Tx,a:Actor,account:Account,runId:string,now:Date):Promise<Usage>{
 const {period,day}=periodInZone(now,account.policy.timezone);
 const result=(await tx.query(`select count(*) filter(where period=$4)::int as "monthCalls",
 count(*) filter(where day=$5)::int as "dayCalls", count(*) filter(where created_at>$6::timestamptz-interval '1 minute')::int as "minuteCalls",
 count(*) filter(where run_id=$7)::int as "runCalls",coalesce(sum(units) filter(where period=$4),0)::int as units,
 coalesce(sum(fee_units) filter(where $8::boolean or period=$4),0)::int as "creditUnits",
 coalesce(sum(cost_ceiling) filter(where period=$4),0)::text as cost
 from app.supplier_api_calls where tenant_id=$1 and workspace_id=$2 and account_id=$3 and charged`,
 [a.tenantId,a.workspaceId,account.id,period,day,now.toISOString(),runId,account.policy.creditMode==='ONE_TIME_PUBLIC'])).rows[0];
 return result;
}
function requireSageActor(a:Actor,c:Row){
 if(c.data.providerType==='SAGE_CONNECT'&&c.data.sageUse==='STAFF_RESEARCH'&&c.data.apiUserId!==a.userId)fail('SAGE_NAMED_USER_REQUIRED',403);
}
async function dashboard(tx:Tx,a:Actor,connection:Row){
 const account=await accountFor(tx,a,connection),now=new Date((await tx.query('select now() as now')).rows[0].now);
 const group=(await tx.query('select monthly_spend,approval_period from app.supplier_api_billing_groups where tenant_id=$1 and workspace_id=$2 and id=$3',[a.tenantId,a.workspaceId,account.billing_group_id])).rows[0];
 const {period}=periodInZone(now,account.policy.timezone);
 const groupCost=(await tx.query(`select coalesce(sum(c.cost_ceiling),0)::text cost from app.supplier_api_calls c join app.supplier_api_accounts a on a.id=c.account_id and a.tenant_id=c.tenant_id and a.workspace_id=c.workspace_id where c.tenant_id=$1 and c.workspace_id=$2 and a.billing_group_id=$3 and c.period=$4 and c.charged`,[a.tenantId,a.workspaceId,account.billing_group_id,period])).rows[0].cost;
 const calls=(await tx.query(`select id,operation,charged,units,fee_units,cost_ceiling,status,code,created_at,finished_at from app.supplier_api_calls where tenant_id=$1 and workspace_id=$2 and account_id=$3 order by created_at desc,id limit 30`,[a.tenantId,a.workspaceId,account.id])).rows;
 const cacheHits=(await tx.query(`select count(*)::int count from app.supplier_api_calls where tenant_id=$1 and workspace_id=$2 and account_id=$3 and period=$4 and status='CACHE_HIT'`,[a.tenantId,a.workspaceId,account.id,period])).rows[0].count;
 return {accountId:account.id,revision:account.revision,policy:account.policy,usage:await usageFor(tx,a,account,'',now),period,accountSpendLimit:group.monthly_spend,accountReservedCost:groupCost,cacheHits,calls,durable:durableApiMeter(),credentialConfigured:Boolean(connection.data.credentialVersion),credentialVersion:connection.data.credentialVersion??0,verification:connection.data.verification??'NOT_CONFIGURED',sageUse:connection.data.sageUse??null,sageMapping:connection.data.sageMapping??null,canRun:connection.data.sageUse!=='STAFF_RESEARCH'||connection.data.apiUserId===a.userId,financialApprovalCurrent:account.approval_period===period&&group.approval_period===period};
}

export async function handleNativeSupplier(a:Actor,action:string,input:Input,transport:NativeTransport=boundedCatalogJson):Promise<unknown>{
 authorize(a,'supplier',action);
 if(!NATIVE_ACTIONS.has(action))fail('NATIVE_COMMAND_UNSUPPORTED',400);
 if(action==='api_create_connection')return transaction(a,async tx=>{
  const provider=input.providerType as NativeProvider,environment=(input.environment??'sandbox') as NativeEnvironment;
  if(!['SAGE_CONNECT','SINALITE'].includes(provider)||!['mock','sandbox','live_readonly'].includes(environment))fail('NATIVE_PROVIDER_INVALID',400);
  if(provider==='SAGE_CONNECT'&&environment==='sandbox')fail('SAGE_HAS_NO_REVIEWED_SANDBOX',400);
  let identifier=provider==='SINALITE'&&environment==='sandbox'&&!input.accountIdentifier?'public-sandbox':text(input.accountIdentifier,160);
  if(provider==='SAGE_CONNECT'){if(!/^\d{1,12}$/.test(identifier)||Number(identifier)<1)fail('SAGE_ACCOUNT_ID_INVALID',400);identifier=String(Number(identifier));}
  const loginId=provider==='SAGE_CONNECT'?text(input.loginId,200):'';
  const publicLogin=loginId.toLowerCase()==='system';
  const identity=provider==='SAGE_CONNECT'?`${identifier}/${loginId.toLowerCase()}`:identifier;
  const accountHash=hash(identity),billingHash=hash(identifier);
  await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`${a.tenantId}/${provider}/${environment}/${billingHash}`]);
  await tx.query(`insert into app.supplier_api_billing_groups(tenant_id,workspace_id,provider,environment,billing_hash) values($1,$2,$3,$4,$5) on conflict(tenant_id,provider,environment,billing_hash) do nothing`,[a.tenantId,a.workspaceId,provider,environment,billingHash]);
  const group=(await tx.query('select id from app.supplier_api_billing_groups where tenant_id=$1 and workspace_id=$2 and provider=$3 and environment=$4 and billing_hash=$5',[a.tenantId,a.workspaceId,provider,environment,billingHash])).rows[0];
  if(!group)fail('API_ACCOUNT_OTHER_WORKSPACE',409);
  const policy=defaultPolicy(provider,environment);
  if(provider==='SINALITE'&&environment==='sandbox'&&identifier!=='public-sandbox'){policy.rates={};policy.termsReference='';}
  policy.creditMode=provider==='SAGE_CONNECT'?(publicLogin?'ONE_TIME_PUBLIC':'MONTHLY_USER'):'NONE';
  await tx.query(`insert into app.supplier_api_accounts(tenant_id,workspace_id,provider,environment,account_hash,billing_group_id,title,policy) values($1,$2,$3,$4,$5,$6,$7,$8) on conflict(tenant_id,provider,environment,account_hash) do nothing`,[a.tenantId,a.workspaceId,provider,environment,accountHash,group.id,text(input.displayName,200),policy]);
  const account=(await tx.query('select * from app.supplier_api_accounts where tenant_id=$1 and workspace_id=$2 and provider=$3 and environment=$4 and account_hash=$5',[a.tenantId,a.workspaceId,provider,environment,accountHash])).rows[0] as Account|undefined;
  if(!account)fail('API_ACCOUNT_OTHER_WORKSPACE',409);
  // Reconnecting a login reuses its original allowance and ledger; credentials never create credits.
  const connection=await create(tx,a,'connections',{title:text(input.displayName,200),status:'NOT_CONFIGURED',data:{providerType:provider,environment,apiAccountId:account.id,verification:'NOT_CONFIGURED',writeEnabled:false,endpointHost:provider==='SAGE_CONNECT'?'www.promoplace.com':environment==='sandbox'?'api.sinaliteuppy.com':'liveapi.sinalite.com',...(provider==='SAGE_CONNECT'?{sageUse:publicLogin?'PUBLIC_SITE':'STAFF_RESEARCH',apiUserId:a.userId,sageMapping:SAGE_SEARCH_MAPPING}:{}),help:'Read-only catalog API with persistent, shared-account budgets. Imports require review. No supplier orders or payments.'}});
  await event(tx,a,'supplier.api_connection_created',connection.id,{provider,environment,accountId:account.id,creditMode:policy.creditMode});
  return {id:connection.id,title:connection.title,providerType:provider,environment,accountId:account.id,verification:'NOT_CONFIGURED'};
 });
 if(action==='api_read')return readAndMeter(a,input,transport);
 return transaction(a,async tx=>{
  const connection=await get(tx,a,'connections',input.id,true),account=await accountFor(tx,a,connection);
  if(action==='api_dashboard')return dashboard(tx,a,connection);
  requireSageActor(a,connection);
  if(action==='api_pause'){
   await tx.query('update app.supplier_api_accounts set policy=jsonb_set(policy,\'{enabled}\',\'false\'),revision=revision+1,updated_at=now() where tenant_id=$1 and workspace_id=$2 and id=$3',[a.tenantId,a.workspaceId,account.id]);
   await event(tx,a,'supplier.api_paused',connection.id,{accountId:account.id});return {paused:true};
  }
  if(action==='api_save_credentials'){
   if(connection.status==='DISABLED')fail('API_CONNECTION_DISABLED',403);
   if(account.environment!=='mock'&&!durableApiMeter())fail('API_DURABLE_METER_REQUIRED',503);
   const saved=await replaceNativeCredentials(tx,a,connection,input.credentials);
   await update(tx,a,'connections',connection.id,{status:'CREDENTIALS_SAVED',data:{...connection.data,credentialVersion:saved.version,maskedHint:saved.maskedHint,vaultMode:saved.vaultMode,verification:'NOT_CONFIGURED'}});
   await event(tx,a,'supplier.api_credential_replaced',connection.id,{version:saved.version,vaultMode:saved.vaultMode});return {configured:true,version:saved.version};
  }
  if(action==='api_save_mapping'){
   if(account.provider!=='SAGE_CONNECT')fail('SAGE_CONNECTION_REQUIRED',400);
   const mapping=validateSageMapping(input.mapping);
   await update(tx,a,'connections',connection.id,{data:{...connection.data,sageMapping:mapping}});
   await event(tx,a,'supplier.api_response_mapping_saved',connection.id,{fields:Object.keys(mapping)});return {saved:true};
  }
  if(action==='api_save_policy')return savePolicy(tx,a,connection,account,input);
  if(action==='api_stage_result')return stageReadResult(tx,a,connection,account,input);
  return fail('NATIVE_COMMAND_UNSUPPORTED',400);
 });
}

async function savePolicy(tx:Tx,a:Actor,connection:Row,account:Account,input:Input){
 await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`api-billing/${account.billing_group_id}`]);
 const fresh=await accountFor(tx,a,connection,true);
 if(input.expectedRevision!==fresh.revision)fail('REVISION_CONFLICT');
 const policy=validateApiPolicy(input.policy),old=fresh.policy;
 if(policy.creditMode!==old.creditMode||policy.timezone!==old.timezone)fail('API_CREDIT_MODE_AND_TIMEZONE_FIXED',400);
 if(a.role!=='owner'&&(policy.includedUnits>old.includedUnits||policy.entitlementConfirmed!==old.entitlementConfirmed||policy.profileConfirmed!==old.profileConfirmed||policy.providerHardStopConfirmed!==old.providerHardStopConfirmed||policy.confirmedPeriod!==old.confirmedPeriod||new Decimal(policy.monthlySpend).gt(old.monthlySpend)||JSON.stringify(policy.rates)!==JSON.stringify(old.rates)||policy.dailyCalls>old.dailyCalls||policy.monthlyCalls>old.monthlyCalls||policy.minuteCalls>old.minuteCalls||policy.runCalls>old.runCalls||policy.monthlyUnits>old.monthlyUnits))fail('OWNER_BUDGET_APPROVAL_REQUIRED',403);
 const group=(await tx.query('select * from app.supplier_api_billing_groups where tenant_id=$1 and workspace_id=$2 and id=$3 for update',[a.tenantId,a.workspaceId,fresh.billing_group_id])).rows[0];
 const accountSpend=money(input.accountSpendLimit??group.monthly_spend),now=new Date((await tx.query('select now() as now')).rows[0].now),{period}=periodInZone(now,policy.timezone);
 if(a.role!=='owner'&&new Decimal(accountSpend).gt(group.monthly_spend))fail('OWNER_BUDGET_APPROVAL_REQUIRED',403);
 if(new Decimal(accountSpend).decimalPlaces()>2||new Decimal(policy.monthlySpend).decimalPlaces()>2)fail('API_BUDGET_CENTS_REQUIRED',400);
 const positive=new Decimal(accountSpend).gt(0)||new Decimal(policy.monthlySpend).gt(0);
 let approvalPeriod=fresh.approval_period;
 if(positive&&(new Decimal(accountSpend).gt(group.monthly_spend)||new Decimal(policy.monthlySpend).gt(old.monthlySpend)||fresh.approval_period!==period||group.approval_period!==period)){
  if(a.role!=='owner'||input.financialApproval!==`AUTHORIZE USD ${new Decimal(accountSpend).toFixed(2)} API FEES FOR ${period}`||!input.reason)fail('API_EXPLICIT_FINANCIAL_APPROVAL_REQUIRED',403);
  approvalPeriod=period;
 }
 const reason=text(input.reason??'Supplier API limits reviewed',500);
 if(fresh.provider==='SAGE_CONNECT'&&policy.includedUnits>5000)fail('SAGE_CREDITS_CANNOT_POOL',400);
 if(fresh.provider==='SAGE_CONNECT'&&fresh.environment!=='mock'&&Object.entries(policy.rates).some(([op,rate])=>op!=='research'&&rate?.free))fail('SAGE_FEE_MODULE_CANNOT_BE_FREE',400);
 if(policy.confirmedPeriod&&policy.confirmedPeriod!==period)fail('API_BALANCE_MUST_BE_CURRENT_PERIOD',400);
 if(policy.entitlementConfirmed&&!policy.termsReference)fail('API_TERMS_REFERENCE_REQUIRED',400);
 // Credit allocation never automatically renews: period and provider balance need explicit owner review.
 await tx.query('update app.supplier_api_accounts set policy=$4,approval_period=$5,revision=revision+1,updated_at=now() where tenant_id=$1 and workspace_id=$2 and id=$3',[a.tenantId,a.workspaceId,fresh.id,policy,approvalPeriod]);
 await tx.query('update app.supplier_api_billing_groups set monthly_spend=$4,approval_period=$5 where tenant_id=$1 and workspace_id=$2 and id=$3',[a.tenantId,a.workspaceId,fresh.billing_group_id,accountSpend,positive?approvalPeriod:group.approval_period]);
 await event(tx,a,'supplier.api_budget_updated',connection.id,{accountId:fresh.id,monthlySpend:policy.monthlySpend,accountSpendLimit:accountSpend,reason,period,financialApproval:positive&&approvalPeriod===period});
 return {saved:true,revision:fresh.revision+1};
}

function normalizeParams(provider:NativeProvider,operation:Operation,input:Input):Input {
 if(provider==='SAGE_CONNECT'){if(operation==='research')return {listType:'categories'};if(['detail','full_detail'].includes(operation)){const id=Number(input.productId);if(!Number.isSafeInteger(id)||id<1||id>1e9)fail('SUPPLIER_ID_INVALID',400);return {productId:id};}if(operation!=='search')fail('SAGE_CURRENT_MODULE_DOCS_REQUIRED',400);return {category:text(input.category,200)};}
 if(operation==='catalog')return {};
 if(!['detail','options','price'].includes(operation))fail('NATIVE_OPERATION_UNSUPPORTED',400);
 const productId=Number(input.productId);if(!Number.isSafeInteger(productId)||productId<1||productId>1e9)fail('SUPPLIER_ID_INVALID',400);
 const params:Input={productId};if(operation!=='detail')params.storeCode=storeCode(input.storeCode??9);
 if(operation==='price')params.optionIds=input.optionIds;
 return params;
}
type CallResult={callId:string;result:unknown;cacheHit:boolean;verification:string};
async function readAndMeter(a:Actor,input:Input,transport:NativeTransport){
 const prepared=await transaction(a,async tx=>{
  const connection=await get(tx,a,'connections',input.id),account=await accountFor(tx,a,connection);requireSageActor(a,connection);
  if(connection.status==='DISABLED')fail('API_CONNECTION_DISABLED',403);
  const runtimeBlock=previewReadBlock(account.provider,account.environment,account.account_hash===hash('public-sandbox'));if(runtimeBlock)fail(runtimeBlock,403);
  const operation=input.operation as Operation,params=normalizeParams(account.provider,operation,input);
  if(account.provider==='SAGE_CONNECT'&&!connection.data.sageMapping)fail('SAGE_RESPONSE_MAPPING_REQUIRED',400);
  const secret=await resolveNativeCredentials(tx,a,connection.id);
  if(account.environment==='live_readonly'&&!secret)fail('API_CREDENTIAL_REQUIRED',403);
  const key=text(input.idempotencyKey,160);
  return {connection,account,operation,params,secret,key};
 });
 const {connection,account,operation,params,secret,key}=prepared;
 // Options must already be read for the same product, store and credential version before pricing.
 let priceOptions:ReturnType<typeof normalizeSinaliteOptions>['options']|undefined;
 if(operation==='price'){
  const options=await findOptions(a,connection,params,secret?.version??0);
  params.optionIds=validatePrintSelection(options,params.optionIds);priceOptions=options;
 }
 return meteredCall(a,connection,operation,params,key,key,secret?.version??0,async()=>{
  let bearer:string|undefined;
 if(account.provider==='SINALITE'&&secret&&account.environment!=='mock'){
  const auth=await meteredCall(a,connection,'auth',{},`${key}:auth`,key,secret.version,async()=>{
   const raw=await transport({provider:account.provider,environment:account.environment,operation:'auth',params:{},credentials:secret.credentials});
   if(!raw||typeof raw!=='object'||typeof (raw as Input).access_token!=='string'||String((raw as Input).access_token).length>16384)fail('SINALITE_TOKEN_SCHEMA',502);
   bearer=String((raw as Input).access_token);return null;
  },false,input.forceRefresh===true);
  if(auth.cacheHit)fail('API_AUTH_REPLAY_REQUIRES_NEW_RUN',409);
  }
  let raw:unknown;
  if(account.environment==='mock')raw=mockResponse(account.provider,operation,params);
  else{
   const request:NativeRequest={provider:account.provider,environment:account.environment,operation,params,...(secret?{credentials:secret.credentials}:{}),...(bearer?{bearer}:{})};
   nativeWireRequest(request);raw=await transport(request);
  }
  if(account.provider==='SAGE_CONNECT'&&operation==='research')return normalizeSageResearch(raw);
  if(account.provider==='SAGE_CONNECT'&&['detail','full_detail'].includes(operation))return {items:[normalizeSageDetail(raw,params.productId,operation==='full_detail')],displayUse:connection.data.sageUse==='STAFF_RESEARCH'?'INTERNAL_ONLY':'PUBLIC_REVIEW_REQUIRED'};
  if(account.provider==='SAGE_CONNECT')return {items:normalizeSageSearch(raw,validateSageMapping(connection.data.sageMapping)),displayUse:connection.data.sageUse==='STAFF_RESEARCH'?'INTERNAL_ONLY':'PUBLIC_REVIEW_REQUIRED'};
  if(operation==='catalog'||operation==='detail')return {items:normalizeSinaliteCatalog(raw)};
  if(operation==='options')return {...normalizeSinaliteOptions(raw),productId:params.productId,storeCode:params.storeCode};
  if(operation==='price'){const price=normalizeSinalitePrice(raw,storeCode(params.storeCode),params.optionIds as number[]);verifySinalitePriceSelection(price,priceOptions!,params.optionIds as number[]);return price;}
  return fail('NATIVE_OPERATION_UNSUPPORTED',400);
 },true,input.forceRefresh===true);
}

async function findOptions(a:Actor,c:Row,params:Input,version:number){
 return transaction(a,async tx=>{
  const account=await accountFor(tx,a,c),cacheKey=hash({connectionId:c.id,operation:'options',params:{productId:params.productId,storeCode:params.storeCode},version});
  const cached=(await tx.query('select result from app.supplier_api_cache where tenant_id=$1 and workspace_id=$2 and account_id=$3 and cache_key=$4 and expires_at>now()',[a.tenantId,a.workspaceId,account.id,cacheKey])).rows[0];
  if(!cached?.result?.options)fail('PRINT_CURRENT_OPTIONS_REQUIRED',400);return cached.result.options as ReturnType<typeof normalizeSinaliteOptions>['options'];
 });
}

/** This function owns its transactions. Never nest it inside a business/import transaction. */
export async function meteredCall(a:Actor,c:Row,operation:Operation,params:Input,commandKey:string,runId:string,version:number,dispatch:()=>Promise<unknown>,cacheable=true,forceRefresh=false):Promise<CallResult>{
 const requestHash=hash({connectionId:c.id,operation,params,version}),cacheKey=requestHash;
 const reservation=await transaction(a,async tx=>{
  let current=await get(tx,a,'connections',c.id);const account=await accountFor(tx,a,current);
  await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`api-billing/${account.billing_group_id}`]);
  const fresh=await accountFor(tx,a,current,true);current=await get(tx,a,'connections',c.id);
  if(Number(current.data.credentialVersion??0)!==version)fail('API_CREDENTIAL_ROTATED_RETRY',409);
  const now=new Date((await tx.query('select now() as now')).rows[0].now),{period,day}=periodInZone(now,fresh.policy.timezone);
  const old=(await tx.query('select id,request_hash,status,result from app.supplier_api_calls where tenant_id=$1 and workspace_id=$2 and account_id=$3 and connection_id=$4 and command_key=$5',[a.tenantId,a.workspaceId,fresh.id,c.id,commandKey])).rows[0];
  const cacheBlock=evaluateReservation(fresh.policy,{monthCalls:0,dayCalls:0,minuteCalls:0,runCalls:0,units:0,creditUnits:0,cost:'0'},operation,{provider:fresh.provider,environment:fresh.environment,now,durable:durableApiMeter(),financialApprovalPeriod:'',publicSandbox:fresh.provider==='SINALITE'&&fresh.account_hash===hash('public-sandbox')});
  const strictCacheBlocks=['API_PAUSED','API_DURABLE_METER_REQUIRED','API_ENTITLEMENT_REQUIRED','API_CURRENT_BALANCE_REQUIRED','SAGE_CURRENT_SCHEMA_REQUIRED','API_PROVIDER_HARD_STOP_REQUIRED'];
  if(old){if('blocked' in cacheBlock&&strictCacheBlocks.includes(cacheBlock.blocked))return {blocked:cacheBlock.blocked};if(current.status==='DISABLED')return {blocked:'API_CONNECTION_DISABLED'};if(old.request_hash!==requestHash)fail('IDEMPOTENCY_CONFLICT');if(old.status==='SUCCEEDED'||old.status==='CACHE_HIT')return {cached:true,id:old.id,result:old.result,verification:fresh.environment==='mock'?'MOCKED':fresh.environment==='sandbox'?'SANDBOX_VERIFIED':'LIVE_VERIFIED'};return {blocked:old.status==='RESERVED'?'API_CALL_PENDING':'API_ALREADY_DISPATCHED'};}
  let cached:Input|undefined;
  if(cacheable&&!forceRefresh&&fresh.policy.enabled&&current.status!=='DISABLED')cached=(await tx.query('select result from app.supplier_api_cache where tenant_id=$1 and workspace_id=$2 and account_id=$3 and cache_key=$4 and expires_at>now()',[a.tenantId,a.workspaceId,fresh.id,cacheKey])).rows[0];
  const usage=await usageFor(tx,a,fresh,runId,now);
  const group=(await tx.query('select * from app.supplier_api_billing_groups where tenant_id=$1 and workspace_id=$2 and id=$3 for update',[a.tenantId,a.workspaceId,fresh.billing_group_id])).rows[0];
  const groupCost=(await tx.query(`select coalesce(sum(c.cost_ceiling),0)::text cost from app.supplier_api_calls c join app.supplier_api_accounts a on a.id=c.account_id and a.tenant_id=c.tenant_id and a.workspace_id=c.workspace_id where c.tenant_id=$1 and c.workspace_id=$2 and a.billing_group_id=$3 and c.period=$4 and c.charged`,[a.tenantId,a.workspaceId,fresh.billing_group_id,period])).rows[0].cost;
  let outcome=evaluateReservation(fresh.policy,usage,operation,{provider:fresh.provider,environment:fresh.environment,now,durable:durableApiMeter(),financialApprovalPeriod:fresh.approval_period===period&&group.approval_period===period?period:'',publicSandbox:fresh.provider==='SINALITE'&&fresh.account_hash===hash('public-sandbox')});
  if(!('blocked' in outcome)&&new Decimal(groupCost).plus(outcome.cost).gt(group.monthly_spend))outcome={blocked:'API_ACCOUNT_SPEND_CAP'};
  if(current.status==='DISABLED')outcome={blocked:'API_CONNECTION_DISABLED'};
  // Cached content cannot bypass expired SAGE entitlement or a month requiring balance review.
  const cacheAllowed=cached&&!('blocked'in outcome&&['API_PAUSED','API_DURABLE_METER_REQUIRED','API_ENTITLEMENT_REQUIRED','API_CURRENT_BALANCE_REQUIRED','SAGE_CURRENT_SCHEMA_REQUIRED','API_PROVIDER_HARD_STOP_REQUIRED','API_CONNECTION_DISABLED'].includes(outcome.blocked));
  const blocked='blocked'in outcome?outcome.blocked:null,charged=!cacheAllowed&&!blocked;
  const call=(await tx.query(`insert into app.supplier_api_calls(tenant_id,workspace_id,account_id,connection_id,operation,command_key,request_hash,run_id,period,day,charged,units,fee_units,cost_ceiling,status,code,result,finished_at)
   values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) returning id`,[a.tenantId,a.workspaceId,fresh.id,c.id,operation,commandKey,requestHash,runId,period,day,charged,charged&&'units'in outcome?outcome.units:0,charged&&'feeUnits'in outcome?outcome.feeUnits:0,charged&&'cost'in outcome?outcome.cost:'0',cacheAllowed?'CACHE_HIT':blocked?'BLOCKED':'RESERVED',cacheAllowed?null:blocked,cacheAllowed?cached!.result:null,cacheAllowed||blocked?now:null])).rows[0];
  if(cacheAllowed)return {cached:true,id:call.id,result:cached!.result,verification:fresh.environment==='mock'?'MOCKED':fresh.environment==='sandbox'?'SANDBOX_VERIFIED':'LIVE_VERIFIED'};
  if(blocked){await event(tx,a,'supplier.api_call_blocked',c.id,{operation,code:blocked});return {blocked};}
  return {id:call.id,cacheMinutes:fresh.policy.cacheMinutes,accountId:fresh.id,verification:fresh.environment==='mock'?'MOCKED':fresh.environment==='sandbox'?'SANDBOX_VERIFIED':'LIVE_VERIFIED'};
 });
 if(reservation.blocked)fail(reservation.blocked,409);
 if(reservation.cached)return {callId:reservation.id!,result:reservation.result,cacheHit:true,verification:reservation.verification!};
 // Reservation is durably committed before dispatch. Unknown outcomes never refund or retry.
 let result:unknown;
 try{result=await dispatch();}
 catch(error){
  const allowed=['SUPPLIER_RATE_LIMITED','SUPPLIER_TLS_REJECTED','SUPPLIER_CONNECTION_REFUSED','SUPPLIER_TIMEOUT','SUPPLIER_AUTH_REJECTED','SUPPLIER_HTTP_ERROR','SUPPLIER_REDIRECT_BLOCKED','SUPPLIER_JSON_INVALID','SUPPLIER_RESPONSE_TOO_LARGE','SUPPLIER_SCHEMA_MISMATCH','SINALITE_CATALOG_SCHEMA','SINALITE_OPTIONS_SCHEMA','SINALITE_PRICE_SCHEMA','SINALITE_PRICE_SELECTION_MISMATCH','SAGE_REQUEST_REJECTED','SAGE_RESPONSE_SCHEMA_MISMATCH'];
  const code=error instanceof Error&&allowed.includes(error.message)?error.message:'SUPPLIER_OUTCOME_UNKNOWN';
  await transaction(a,tx=>tx.query("update app.supplier_api_calls set status=$4,code=$5,finished_at=now() where tenant_id=$1 and workspace_id=$2 and id=$3",[a.tenantId,a.workspaceId,reservation.id,['SUPPLIER_OUTCOME_UNKNOWN','SUPPLIER_TIMEOUT'].includes(code)?'UNKNOWN':'FAILED',code]));
  fail(code,502);
 }
 await transaction(a,async tx=>{
  await tx.query("update app.supplier_api_calls set status='SUCCEEDED',result=$4,finished_at=now() where tenant_id=$1 and workspace_id=$2 and id=$3",[a.tenantId,a.workspaceId,reservation.id,cacheable?JSON.stringify(result):null]);
  if(cacheable&&reservation.cacheMinutes!>0)await tx.query(`insert into app.supplier_api_cache(tenant_id,workspace_id,account_id,cache_key,result,expires_at) values($1,$2,$3,$4,$5,now()+$6*interval '1 minute') on conflict(tenant_id,workspace_id,account_id,cache_key) do update set result=excluded.result,expires_at=excluded.expires_at,created_at=now()`,[a.tenantId,a.workspaceId,reservation.accountId,cacheKey,JSON.stringify(result),reservation.cacheMinutes]);
  if(operation!=='auth'){const latest=await get(tx,a,'connections',c.id,true);await update(tx,a,'connections',c.id,{data:{...latest.data,lastSyncAt:new Date().toISOString(),verification:reservation.verification}});}
  await event(tx,a,'supplier.api_read_completed',c.id,{callId:reservation.id,operation,verification:reservation.verification});
 });
 return {callId:reservation.id!,result,cacheHit:false,verification:reservation.verification!};
}

async function stageReadResult(tx:Tx,a:Actor,c:Row,account:Account,input:Input){
 const call=(await tx.query("select id,result,operation from app.supplier_api_calls where tenant_id=$1 and workspace_id=$2 and account_id=$3 and connection_id=$4 and id=$5 and status in ('SUCCEEDED','CACHE_HIT')",[a.tenantId,a.workspaceId,account.id,c.id,text(input.callId,36)])).rows[0];
 if(!call||!['catalog','detail','full_detail','search'].includes(call.operation)||!Array.isArray(call.result?.items))fail('API_CATALOG_RESULT_REQUIRED',400);
 if(!Array.isArray(input.selectedIds)||!input.selectedIds.length||input.selectedIds.length>200||input.selectedIds.some(x=>!['string','number'].includes(typeof x)))fail('API_SELECTION_LIMIT',400);
 const selected=new Set(input.selectedIds.map(String)),rows=(call.result.items as Input[]).filter(row=>selected.has(String(row.id)));
 if(rows.length!==selected.size)fail('API_SELECTION_NOT_FOUND',400);
 if(rows.some(row=>row.enabled===false))fail('SUPPLIER_PRODUCT_DISABLED',400);
 const sources=rows.map(row=>normalizeCatalogSource({supplier:account.provider==='SINALITE'?'SinaLite':'SAGE',externalId:String(row.id),title:row.name,brand:row.brand??'',model:row.sku??'',description:row.description??'',category:account.provider==='SINALITE'?'PRINT':'PROMO',sourceCategory:row.category??'',sourceEnabled:row.enabled,sourceUrl:account.provider==='SINALITE'?`https://${account.environment==='live_readonly'?'liveapi.sinalite.com':'api.sinaliteuppy.com'}/product/${row.id}`:'https://www.sageworld.com/connect/',environment:account.environment==='mock'?'SYNTHETIC':account.environment==='sandbox'?'STAGING':'PUBLIC_CATALOG'}));
 // Integration administrators can stage evidence, but cannot edit or publish the curated catalog.
 let created=0,unchanged=0;
 for(const source of sources){
  const data={...source,rawHash:hash({rawHash:source.rawHash,accountId:account.id}),apiEvidenceCallId:call.id,apiConnectionId:c.id,supplierDetail:account.provider==='SAGE_CONNECT'&&['detail','full_detail'].includes(call.operation)?rows.find(row=>String(row.id)===String(source.externalId)):null,displayUse:account.provider==='SAGE_CONNECT'&&c.data.sageUse==='STAFF_RESEARCH'?'INTERNAL_ONLY':'PUBLIC_REVIEW_REQUIRED'};
  const result=await tx.query(`insert into app.source_records(id,tenant_id,workspace_id,owner_id,title,status,data) values(gen_random_uuid(),$1,$2,$3,$4,'STAGED',$5) on conflict(tenant_id,workspace_id,(data->>'catalogSourceKey'),(data->>'rawHash')) where data->>'catalogSourceKey' is not null do nothing returning id`,[a.tenantId,a.workspaceId,a.userId,source.title,data]);
  if(result.rowCount)created++;else unchanged++;
 }
 await event(tx,a,'supplier.api_catalog_staged',c.id,{callId:call.id,created,unchanged,autoPublished:0});return {created,unchanged,autoPublished:0,verification:account.environment==='mock'?'MOCKED':account.environment==='sandbox'?'SANDBOX_VERIFIED':'LIVE_VERIFIED'};
}

function mockResponse(provider:NativeProvider,operation:Operation,params:Input):unknown {
 if(provider==='SAGE_CONNECT'&&operation==='research')return {ok:true,items:[{id:1,name:'Synthetic promotional products'}]};
 if(provider==='SAGE_CONNECT'&&['detail','full_detail'].includes(operation))return {legalNote:'Synthetic test data',product:{prodEId:params.productId,prName:'Synthetic promotional tumbler',lineName:'Demo supplier',itemNum:'DEMO-001',category:'Drinkware',description:'Synthetic test record',qty:['24','100','0'],prc:['9.00','8.00',''],catPrc:['10','9',''],net:['5','4',''],piecesPerUnit:['1','1','0'],currency:'USD',setupChg:'0',pics:[],options:[]}};
 if(provider==='SAGE_CONNECT')return {ok:true,products:[{prodEId:'DEMO-PROMO-001',name:'Synthetic promotional tumbler',brand:'Demo supplier',description:'Synthetic test record. Not a supplier offer.'}]};
 if(operation==='catalog'||operation==='detail')return [{id:1,sku:'synthetic_business_card',name:'Synthetic print business cards',category:'Business Cards',enabled:1}];
 if(operation==='options')return [[{id:4,group:'size',name:'3.5 x 2'},{id:5,group:'qty',name:'50'},{id:30,group:'Stock',name:'14PT Printed 1 Side (4/0)'}],[],[]];
 if(operation==='price')return {price:'8.82',productOptions:{size:'3.5 x 2',qty:'50',Stock:'14PT Printed 1 Side (4/0)'}};
 return fail('MOCK_OPERATION_UNSUPPORTED',400);
}
