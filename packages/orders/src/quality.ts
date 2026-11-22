import {fail,get,hash,text,type Actor,type Input,type Row,type Tx} from '../../kernel/src';

export const QC_CHECKS=['quantity','color','placement','damage'] as const;
export const QC_SCHEMA='EXPLICIT_QC_V1';
export function explicitInspection(input:Input){
 if(typeof input.passed!=='boolean')fail('QC_RESULT_REQUIRED',400,'Choose an overall inspection result.');
 const checks=input.checks;
 if(!checks||typeof checks!=='object'||Array.isArray(checks)||Object.keys(checks).length!==QC_CHECKS.length||QC_CHECKS.some(key=>typeof (checks as Input)[key]!=='boolean'))fail('QC_EXPLICIT_CHECKS_REQUIRED',400,'Record a pass or fail for quantity, color, placement and damage.');
 const normalized=Object.fromEntries(QC_CHECKS.map(key=>[key,(checks as Input)[key]])) as Record<typeof QC_CHECKS[number],boolean>;
 if(input.passed&&QC_CHECKS.some(key=>!normalized[key]))fail('QC_PASS_REQUIRES_ALL_CHECKS',400,'Every inspection check must pass before you record an overall pass.');
 const notes=input.notes?text(input.notes,2000):'';
 if(!input.passed&&!notes)fail('QC_FAILURE_REASON_REQUIRED',400,'Describe the defect or rework needed for this failed inspection.');
 return {passed:input.passed,checks:normalized,notes};
}

export function inspectionContextSnapshot(job:Row){
 return {jobId:job.id,orderId:job.order_id,orderLineId:job.data.orderLineId??null,routeRevision:job.data.routeRevision??null,quantity:job.data.quantity??null,productId:job.data.productId??null,method:job.data.method??null,designVersionId:job.data.designVersionId??null};
}
/** Binds the inspection to the current routed job rather than a mutable pass flag. */
export function inspectionContext(job:Row){return hash(inspectionContextSnapshot(job));}
export async function requirePassedInspection(tx:Tx,a:Actor,job:Row){
 if(job.data.qcPassed!==true||!job.data.lastQcId)fail('QC_PASS_REQUIRED',409,'Record a passing quality inspection before completing or shipping this job.');
 const qc=await get(tx,a,'qc_checks',job.data.lastQcId);
 if(qc.job_id!==job.id||qc.order_id!==job.order_id||qc.status!=='PASSED'||qc.data.passed!==true||qc.data.inspectionSchema!==QC_SCHEMA)fail('QC_EXPLICIT_EVIDENCE_REQUIRED',409,'This job needs a new quality inspection with each check recorded.');
 if(qc.data.inspectionContextHash!==inspectionContext(job))fail('QC_JOB_CHANGED_REINSPECTION_REQUIRED',409,'The job changed after inspection. Review its current details and record a new inspection.');
 explicitInspection(qc.data);
 return qc;
}
