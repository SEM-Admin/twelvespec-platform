import Decimal from 'decimal.js';
import {fail, type Input} from '../../kernel/src';

export type NativeProvider = 'SAGE_CONNECT'|'SINALITE';
export type NativeEnvironment = 'mock'|'sandbox'|'live_readonly';
export type Operation = 'catalog'|'detail'|'options'|'price'|'auth'|'search'|'research'|'full_detail';
export type Rate = {units:number; unitCost:string|null; free:boolean};
export type ApiPolicy = {
 enabled:boolean; timezone:string; dailyCalls:number; monthlyCalls:number; minuteCalls:number;
 runCalls:number; monthlyUnits:number; monthlySpend:string; includedUnits:number;
 creditMode:'NONE'|'MONTHLY_USER'|'ONE_TIME_PUBLIC'; confirmedPeriod:string; termsReference:string; entitlementConfirmed:boolean;
 providerHardStopConfirmed:boolean; profileConfirmed:boolean; cacheMinutes:number;
 rates:Partial<Record<Operation,Rate>>;
};
export type Usage = {monthCalls:number;dayCalls:number;minuteCalls:number;runCalls:number;units:number;creditUnits:number;cost:string};
const operations:Operation[]=['catalog','detail','options','price','auth','search','research','full_detail'];
function integer(v:unknown,min:number,max:number){if(typeof v!=='number'||!Number.isSafeInteger(v)||v<min||v>max)fail('API_LIMIT_INVALID',400);return v;}
export function money(value:unknown):string {
 if(typeof value!=='string'||!/^\d{1,9}(\.\d{1,6})?$/.test(value))fail('API_MONEY_INVALID',400);
 return new Decimal(value).toFixed(6);
}
export function periodInZone(date:Date,timezone:string){
 const parts=new Intl.DateTimeFormat('en-US',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
 const part=(name:string)=>parts.find(x=>x.type===name)!.value;
 return {period:`${part('year')}-${part('month')}`,day:`${part('year')}-${part('month')}-${part('day')}`};
}
export function defaultPolicy(provider:NativeProvider,environment:NativeEnvironment):ApiPolicy {
 const publicSandbox=provider==='SINALITE'&&environment==='sandbox';
 const rates:ApiPolicy['rates']=environment==='mock'?Object.fromEntries(['catalog','detail','options','price','auth','search','research','full_detail'].map(op=>[op,{units:1,unitCost:'0.000000',free:true}])):publicSandbox?Object.fromEntries(['catalog','detail','options','price'].map(op=>[op,{units:1,unitCost:'0.000000',free:true}])):provider==='SAGE_CONNECT'?{search:{units:1,unitCost:null,free:false},detail:{units:1,unitCost:null,free:false},full_detail:{units:1,unitCost:null,free:false},research:{units:1,unitCost:'0.000000',free:true}}:{};
 return {enabled:false,timezone:'America/Chicago',dailyCalls:100,monthlyCalls:1000,minuteCalls:20,runCalls:5,monthlyUnits:1000,monthlySpend:'0.000000',includedUnits:0,creditMode:'NONE',confirmedPeriod:'',termsReference:publicSandbox?'PUBLIC_UNAUTHENTICATED_SANDBOX':'',entitlementConfirmed:false,providerHardStopConfirmed:false,profileConfirmed:false,cacheMinutes:60,rates};
}
export function validateApiPolicy(value:unknown):ApiPolicy {
 if(!value||typeof value!=='object'||Array.isArray(value))fail('API_POLICY_INVALID',400);
 const p=value as Input;
 const timezone=typeof p.timezone==='string'?p.timezone:'';
 try{new Intl.DateTimeFormat('en-US',{timeZone:timezone}).format();}catch{fail('API_TIMEZONE_INVALID',400);}
 if(!timezone||timezone.length>80)fail('API_TIMEZONE_INVALID',400);
 if(typeof p.enabled!=='boolean')fail('API_POLICY_INVALID',400);
 const rates:ApiPolicy['rates']={};
 if(!p.rates||typeof p.rates!=='object'||Array.isArray(p.rates))fail('API_RATES_INVALID',400);
 for(const [operation,raw] of Object.entries(p.rates)){
  if(!operations.includes(operation as Operation)||!raw||typeof raw!=='object'||Array.isArray(raw))fail('API_RATES_INVALID',400);
  const r=raw as Input;
  if(typeof r.free!=='boolean')fail('API_RATES_INVALID',400);
  const unitCost=r.unitCost===null?null:money(r.unitCost);
  if(r.free&&unitCost!=='0.000000')fail('API_RATES_INVALID',400);
  rates[operation as Operation]={units:integer(r.units,1,1000000),unitCost,free:r.free};
 }
 const confirmedPeriod=typeof p.confirmedPeriod==='string'?p.confirmedPeriod:'';
 if(confirmedPeriod&&!/^\d{4}-(0[1-9]|1[0-2])$/.test(confirmedPeriod))fail('API_PERIOD_INVALID',400);
 if(!['NONE','MONTHLY_USER','ONE_TIME_PUBLIC'].includes(String(p.creditMode)))fail('API_CREDIT_MODE_INVALID',400);
 const termsReference=typeof p.termsReference==='string'?p.termsReference.trim():'';
 if(termsReference.length>1000)fail('API_TERMS_INVALID',400);
 return {enabled:p.enabled,timezone,dailyCalls:integer(p.dailyCalls,0,1000000),monthlyCalls:integer(p.monthlyCalls,0,10000000),minuteCalls:integer(p.minuteCalls,0,1000),runCalls:integer(p.runCalls,1,50),monthlyUnits:integer(p.monthlyUnits,0,100000000),monthlySpend:money(p.monthlySpend),includedUnits:integer(p.includedUnits,0,100000000),creditMode:p.creditMode as ApiPolicy['creditMode'],confirmedPeriod,termsReference,entitlementConfirmed:p.entitlementConfirmed===true,providerHardStopConfirmed:p.providerHardStopConfirmed===true,profileConfirmed:p.profileConfirmed===true,cacheMinutes:integer(p.cacheMinutes,0,10080),rates};
}
/** Conservative reservation ceiling, not a supplier invoice or a promise of account-wide spend. */
export function evaluateReservation(policy:ApiPolicy,usage:Usage,operation:Operation,context:{provider:NativeProvider;environment:NativeEnvironment;now:Date;durable:boolean;financialApprovalPeriod:string;publicSandbox?:boolean}):{units:number;feeUnits:number;cost:string}|{blocked:string} {
 const block=(blocked:string)=>({blocked});
 if(!policy.enabled)return block('API_PAUSED');
 const {period}=periodInZone(context.now,policy.timezone);
 const publicSandbox=context.provider==='SINALITE'&&context.environment==='sandbox'&&context.publicSandbox===true;
 if(context.environment!=='mock'&&!publicSandbox){
  if(!context.durable)return block('API_DURABLE_METER_REQUIRED');
  if(!policy.entitlementConfirmed||!policy.termsReference)return block('API_ENTITLEMENT_REQUIRED');
  if(policy.confirmedPeriod!==period&&operation!=='research')return block('API_CURRENT_BALANCE_REQUIRED');
  if(context.provider==='SAGE_CONNECT'&&operation!=='research'&&!policy.providerHardStopConfirmed)return block('API_PROVIDER_HARD_STOP_REQUIRED');
  if(context.provider==='SAGE_CONNECT'&&!policy.profileConfirmed)return block('SAGE_CURRENT_SCHEMA_REQUIRED');
 }
 if(usage.monthCalls>=policy.monthlyCalls)return block('API_MONTHLY_CALL_CAP');
 if(usage.dayCalls>=policy.dailyCalls)return block('API_DAILY_CALL_CAP');
 if(usage.minuteCalls>=policy.minuteCalls)return block('API_MINUTE_CALL_CAP');
 if(usage.runCalls>=policy.runCalls)return block('API_RUN_CALL_CAP');
 const rate=policy.rates[operation];
 if(!rate)return block('API_TARIFF_UNKNOWN');
 if(usage.units+rate.units>policy.monthlyUnits)return block('API_MONTHLY_UNIT_CAP');
 const included=Math.max(0,policy.includedUnits-usage.creditUnits);
 const paidUnits=rate.free?0:Math.max(0,rate.units-included);
 if(paidUnits&&rate.unitCost===null)return block('API_TARIFF_UNKNOWN');
 const cost=new Decimal(rate.unitCost??'0').times(paidUnits);
 if(cost.gt(0)&&context.financialApprovalPeriod!==period)return block('API_FINANCIAL_APPROVAL_REQUIRED');
 if(new Decimal(usage.cost).plus(cost).gt(policy.monthlySpend))return block('API_SPEND_CAP');
 return {units:rate.units,feeUnits:rate.free?0:rate.units,cost:cost.toFixed(6)};
}
