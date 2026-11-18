/** Synthetic, network-isolated production-container acceptance. Never takes supplier keys. */
import {randomBytes,randomInt,randomUUID} from 'node:crypto';
import {createRequire} from 'node:module';
import {mkdirSync,writeFileSync} from 'node:fs';
import {dirname,resolve} from 'node:path';

const shopOrigin='https://twelvespec-preview-shop.samantha-4ec.workers.dev';
const osOrigin='https://twelvespec-preview-os.samantha-4ec.workers.dev';
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(condition,message)=>{if(!condition)throw new Error(message);};

function fixture(path){
 check(Boolean(path),'FIXTURE_PATH_REQUIRED');
 const vars={TWELVESPEC_ENV:'local',TWELVESPEC_PREVIEW:'1',DATABASE_URL:'postgresql://twelvespec@127.0.0.1:55432/twelvespec_local',BETTER_AUTH_SECRET:randomBytes(48).toString('base64url'),ASSET_SIGNING_KEY:randomBytes(32).toString('hex'),WEBHOOK_SIGNING_KEY:randomBytes(32).toString('hex'),TWELVESPEC_DEMO_PASSWORD:randomBytes(32).toString('base64url'),SHOP_ORIGIN:shopOrigin,OS_ORIGIN:osOrigin,TWELVESPEC_PREVIEW_CATALOG_READS:'0',TWELVESPEC_PREVIEW_ACCOUNT_READS:'0',TWELVESPEC_API_METER_STORAGE:'ephemeral',TWELVESPEC_CONTAINER_TEST:'1'};
 const target=resolve(path);mkdirSync(dirname(target),{recursive:true,mode:0o700});writeFileSync(target,Object.entries(vars).map(([k,v])=>k+'='+v).join('\n')+'\n',{mode:0o600});
 console.log('Prepared private synthetic container fixture; no credentials printed.');
}

async function verify(){
 check(process.env.TWELVESPEC_CONTAINER_TEST==='1'&&process.env.TWELVESPEC_PREVIEW==='1','EXPLICIT_CONTAINER_TEST_REQUIRED');
 check(['localhost','127.0.0.1'].includes(new URL(process.env.DATABASE_URL??'').hostname),'ISOLATED_DATABASE_REQUIRED');
 check(process.env.TWELVESPEC_PREVIEW_ACCOUNT_READS==='0'&&process.env.TWELVESPEC_PREVIEW_CATALOG_READS==='0','EXTERNAL_READS_MUST_BE_DISABLED');
 check(typeof process.getuid==='function'&&process.getuid()!==0,'NONROOT_RUNTIME_REQUIRED');
 const require=createRequire(import.meta.url);
 for(const name of ['tsx','embedded-postgres'])check(Boolean(require.resolve(name)),'MISSING_RUNTIME_DEPENDENCY');
 for(const name of ['vitest','@playwright/test']){let found=false;try{require.resolve(name);found=true;}catch{}check(!found,'DEVELOPMENT_TOOL_IN_RUNTIME_'+name);}
 const password=process.env.TWELVESPEC_DEMO_PASSWORD;check(Boolean(password)&&password.length>=24,'SYNTHETIC_PASSWORD_REQUIRED');
 const roots={shop:'http://127.0.0.1:3000',os:'http://127.0.0.1:3001'};
 let cookie='',workspace='';
 const headers=(app,extra={})=>({Host:new URL(app==='shop'?shopOrigin:osOrigin).hostname,'X-Forwarded-Proto':'https',...(app==='os'&&cookie?{Cookie:cookie}:{}),...(app==='os'&&workspace?{'x-workspace-id':workspace}:{}),...extra});
 const request=(app,path,options={})=>fetch(roots[app]+path,{...options,headers:headers(app,options.headers),redirect:'manual',signal:AbortSignal.timeout(10000)});
 const deadline=Date.now()+180000;
 let ready=false;
 while(Date.now()<deadline){try{const responses=await Promise.all(['shop','os'].map(app=>request(app,'/api/health')));ready=responses.every(r=>r.status===200);if(ready)break;}catch{}await pause(1000);}
 check(ready,'CONTAINER_HEALTH_TIMEOUT');
 for(const app of ['shop','os']){const r=await request(app,'/');check(r.status===200,'APPLICATION_HTML_FAILED');check((await r.text()).includes('/_next/'),'APPLICATION_BUNDLE_REFERENCE_MISSING');}
 const publicBeforeResponse=await request('shop','/api/shop');check(publicBeforeResponse.status===200,'PUBLIC_CATALOG_FAILED');const publicBefore=await publicBeforeResponse.json();check(publicBefore.products?.length===40,'SYNTHETIC_CATALOG_SEED_MISSING');
 const signIn=await request('os','/api/auth/sign-in/email',{method:'POST',headers:{Origin:osOrigin,'Content-Type':'application/json'},body:JSON.stringify({email:'owner@demo.twelvespec.test',password})});
 check(signIn.status===200,'OWNER_SIGN_IN_FAILED');cookie=signIn.headers.getSetCookie().map(v=>v.split(';')[0]).join('; ');check(cookie.length>0,'OWNER_COOKIE_MISSING');
 const session=await request('os','/api/session');check(session.status===200,'OWNER_SESSION_FAILED');const identity=await session.json();check(identity.actor?.role==='owner','OWNER_ROLE_MISSING');workspace=identity.actor.workspaceId;
 const fakeKey='synthetic-container-only-'+randomUUID();
 const assertPrivate=value=>{const text=JSON.stringify(value);check(!text.includes(fakeKey)&&!text.includes(password),'CREDENTIAL_EXPOSED_IN_RESPONSE');};
 const command=async(action,input,expected=200)=>{
  const r=await request('os','/api/platform',{method:'POST',headers:{Origin:osOrigin,'Content-Type':'application/json'},body:JSON.stringify({module:'supplier',action,input})});
  check(r.status===expected,'COMMAND_'+action.toUpperCase()+'_HTTP_'+r.status);const value=await r.json();assertPrivate(value);return value;
 };
 const account=String(randomInt(10000000,90000000));
 const created=await command('api_create_connection',{providerType:'SAGE_CONNECT',environment:'mock',accountIdentifier:account,loginId:'System',displayName:'SYNTHETIC isolated container SAGE'});const id=created.result?.id;check(Boolean(id),'CONNECTION_NOT_CREATED');
 await command('api_save_credentials',{id,credentials:{accountId:account,loginId:'System',authKey:fakeKey}});
 const initial=(await command('api_dashboard',{id})).result;check(initial.credentialConfigured===true,'ENCRYPTED_CREDENTIAL_NOT_CONFIGURED');
 await command('api_save_policy',{id,expectedRevision:initial.revision,reason:'Synthetic production-container test only; network disabled and paid budget zero.',policy:{...initial.policy,enabled:true,dailyCalls:1,monthlyCalls:1,minuteCalls:1,monthlyUnits:1,monthlySpend:'0'}});
 const read=()=>command('api_read',{id,operation:'search',category:'SYNTHETIC',idempotencyKey:randomUUID()});
 const first=(await read()).result;check(first.verification==='MOCKED'&&first.cacheHit===false,'MOCK_READ_NOT_VERIFIED');
 const second=(await read()).result;check(second.cacheHit===true,'CACHE_REUSE_FAILED');
 const blocked=await command('api_read',{id,operation:'search',category:'SYNTHETIC different',forceRefresh:true,idempotencyKey:randomUUID()},409);check(blocked.code==='API_MONTHLY_CALL_CAP','HARD_CAP_NOT_ENFORCED');
 const item=first.result?.items?.[0];check(Boolean(item?.id),'MOCK_PRODUCT_MISSING');
 const staged=(await command('api_stage_result',{id,callId:first.callId,selectedIds:[item.id]})).result;check(staged.created===1&&staged.autoPublished===0,'PRIVATE_STAGING_FAILED');
 const final=(await command('api_dashboard',{id})).result;check(final.usage.monthCalls===1&&final.cacheHits===1&&Number(final.usage.cost)===0&&Number(final.accountReservedCost)===0,'METER_TOTALS_INCORRECT');
 const publicAfterResponse=await request('shop','/api/shop');check(publicAfterResponse.status===200,'PUBLIC_CATALOG_RECHECK_FAILED');const publicAfter=await publicAfterResponse.json();assertPrivate(publicAfter);check(JSON.stringify(publicAfter.products.map(p=>p.id).sort())===JSON.stringify(publicBefore.products.map(p=>p.id).sort()),'STAGING_CHANGED_PUBLIC_CATALOG');
 console.log(JSON.stringify({verifiedAt:new Date().toISOString(),verification:'ISOLATED_PRODUCTION_CONTAINER_PASSED',nonroot:true,productionRuntimeDependencies:true,developmentTestToolsAbsent:true,shopHttp:200,osHttp:200,syntheticProducts:40,ownerSession:true,encryptedCredentialConfigured:true,credentialReturned:false,sageVerification:'MOCKED',simulatedReadsReserved:1,cacheHits:1,hardCap:'API_MONTHLY_CALL_CAP',privateSourcesStaged:1,productsPublished:0,paidFees:'0.000000',externalSupplierReadsEnabled:false,hostedPreviewVerified:false},null,2));
}

try{if(process.argv[2]==='fixture')fixture(process.argv[3]);else if(process.argv[2]==='check')await verify();else throw new Error('USE_FIXTURE_OR_CHECK');}
catch(error){console.error(error instanceof Error?error.message:'CONTAINER_VERIFICATION_FAILED');process.exitCode=1;}
