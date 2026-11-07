import {fail,text,type Input} from '../../kernel/src';

const optional=(v:unknown,max:number)=>v===undefined||v===null||v===''?'':text(v,max);
export function normalizeQuoteBrief(value:unknown,fallbackName:string):Input {
 if(value!==undefined&&(!value||typeof value!=='object'||Array.isArray(value)))fail('PROJECT_BRIEF_INVALID',400);
 const v=(value??{}) as Input,projectName=v.projectName?text(v.projectName,200):fallbackName;
 const requestedDate=optional(v.requestedDate,10);
 if(requestedDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)||!Number.isFinite(Date.parse(requestedDate))||new Date(requestedDate).toISOString().slice(0,10)!==requestedDate||requestedDate<new Date().toISOString().slice(0,10)))fail('REQUESTED_DATE_INVALID',400);
 if(v.hardDeadline!==undefined&&typeof v.hardDeadline!=='boolean')fail('DEADLINE_ASSERTION_INVALID',400);
 if(v.hardDeadline===true&&!requestedDate)fail('DEADLINE_DATE_REQUIRED',400);
 const deliveryCountry=optional(v.deliveryCountry,2).toUpperCase(),deliveryPostalCode=optional(v.deliveryPostalCode,20);
 if(deliveryCountry&&!/^[A-Z]{2}$/.test(deliveryCountry))fail('DELIVERY_COUNTRY_INVALID',400);
 if(deliveryPostalCode&&!/^[A-Za-z0-9 -]{1,20}$/.test(deliveryPostalCode))fail('DELIVERY_POSTAL_CODE_INVALID',400);
 const artworkStatus=v.artworkStatus??'UNKNOWN';if(!['READY','NEED_HELP','LATER','NOT_REQUIRED','UNKNOWN'].includes(String(artworkStatus)))fail('ARTWORK_STATUS_INVALID',400);
 return {projectName,company:optional(v.company,200),contactName:optional(v.contactName,150),phone:optional(v.phone,50),deliveryCountry,deliveryPostalCode,requestedDate:requestedDate||null,hardDeadline:v.hardDeadline===true,artworkStatus,notes:optional(v.notes,4000)};
}
export function briefMissingFields(brief:Input):string[]{return ['deliveryCountry','deliveryPostalCode','artworkStatus'].filter(key=>!brief[key]||brief[key]==='UNKNOWN');}
