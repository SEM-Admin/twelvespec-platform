import type {Input} from '../../kernel/src';

/** Defense in depth for customer command/account payloads. Issued quotes use an explicit allowlist. */
export function customerSafeObject(value:unknown):unknown {
 if(value instanceof Date)return value.toISOString();
 if(Array.isArray(value))return value.map(customerSafeObject);
 if(value&&typeof value==='object'){
  const result:Input={};
  for(const [key,child] of Object.entries(value)){
   if(/secret|password|token|credential|objectKey|originalPath|privatePath|supplier|sourceEvidence|cost|margin|wholesale|connectionId|connection_id|operatorNote|internal/i.test(key))continue;
   if(['decoration_run_cost','setup','prepress','outsourced_labor','packaging','allocated_freight','other_direct_cost'].includes(key))continue;
   result[key]=customerSafeObject(child);
  }
  return result;
 }
 return value;
}
