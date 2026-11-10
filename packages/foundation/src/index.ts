import {authorize,create,get,list,update,event,fail,text,idempotent,type Actor,type Tx,type Input,type Role} from '../../kernel/src/index';
const ROLES:Role[]=['owner','manager','staff','customer','sales','catalog_manager','designer','operations','buyer','finance','marketing','integration_admin','store_admin'];
export function validateRoleChange(current:Role,next:unknown,ownerCount:number,isSelf:boolean):Role {if(!ROLES.includes(next as Role))fail('INVALID_ROLE',400);if(current==='owner'&&next!=='owner'&&ownerCount<=1)fail('LAST_OWNER_CANNOT_BE_REMOVED');if(isSelf&&next!=='owner')fail('SELF_DEMOTION_REQUIRES_ANOTHER_OWNER');return next as Role;}
export async function handleFoundation(tx:Tx,a:Actor,action:string,i:Input):Promise<unknown>{
 authorize(a,'foundation',action);
 if(['create','update','save_legal_entity'].includes(action)){
  const legalName=text(i.legalName??i.name??i.title),address=text(i.address??'SYNTHETIC — not a registered legal address',2000),terms=text(i.terms??'Demo terms. All orders subject to separately issued quote and approval.',10000);
  const data={legalName,address,terms,taxReference:typeof i.taxReference==='string'?text(i.taxReference):null,evidence:'OPERATOR_SUPPLIED',productionLegalApproval:false};const r=i.id?await update(tx,a,'legal_entities',i.id,{title:legalName,data,status:'ACTIVE'}):await create(tx,a,'legal_entities',{title:legalName,status:'ACTIVE',data});await event(tx,a,'foundation.legal_entity_saved',r.id,{bindingHistoryUnchanged:true});return r;
 }
 if(action==='review'||action==='approve'){const r=await get(tx,a,'legal_entities',i.id,true);const result=await update(tx,a,'legal_entities',r.id,{status:action==='approve'?'ACTIVE':'IN_REVIEW',data:{...r.data,reviewedBy:a.userId,reviewedAt:new Date().toISOString(),productionLegalApproval:false}});await event(tx,a,`foundation.legal_entity_${action}`,r.id);return result;}
 if(action==='create_venture'){const seller=await get(tx,a,'legal_entities',i.legalEntityId);const r=await create(tx,a,'ventures',{title:text(i.name??i.title),status:'ACTIVE',data:{legalEntityId:seller.id,brand:typeof i.brand==='string'?text(i.brand):text(i.name??i.title),legalSellerIsDistinctFromBrand:true}});await event(tx,a,'foundation.venture_created',r.id);return r;}
 if(action==='list_members'){return (await tx.query('select user_id as "userId",role from memberships where tenant_id=$1 and workspace_id=$2 order by role,user_id',[a.tenantId,a.workspaceId])).rows;}
 if(action==='set_member_role'){
  const userId=text(i.userId),reason=text(i.reason,2000);return idempotent(tx,a,'foundation.set_member_role',i.idempotencyKey,{userId,role:i.role,reason},async()=>{
   await tx.query('select pg_advisory_xact_lock(hashtextextended($1,0))',[`${a.tenantId}/${a.workspaceId}/membership`]);const all=(await tx.query('select user_id,role from memberships where tenant_id=$1 and workspace_id=$2 for update',[a.tenantId,a.workspaceId])).rows as {user_id:string;role:Role}[];const current=all.find(r=>r.user_id===userId);if(!current)return fail('MEMBER_NOT_FOUND',404);const role=validateRoleChange(current.role,i.role,all.filter(r=>r.role==='owner').length,userId===a.userId);
   await tx.query('update memberships set role=$4 where tenant_id=$1 and workspace_id=$2 and user_id=$3',[a.tenantId,a.workspaceId,userId,role]);await event(tx,a,'foundation.member_role_changed',a.workspaceId,{userId,from:current.role,to:role,reason});return {userId,role};});
 }
 if(action==='audit')return list(tx,a,'audit_events',1000);
 if(action==='grant_resource'){const resourceId=text(i.resourceId),userId=text(i.userId),permission=text(i.permission);if(permission.startsWith('live_')||permission.includes('future'))fail('FEATURE_NOT_ACTIVE',403);const r=await create(tx,a,'resource_grants',{title:`${permission} on ${resourceId}`,status:'REQUESTED',data:{resourceId,userId,permission,enforcement:'PENDING_SECURITY_REVIEW'}});await event(tx,a,'foundation.grant_requested',r.id);return r;}
 if(action==='archive'){const r=await get(tx,a,'ventures',i.id,true);const result=await update(tx,a,'ventures',r.id,{status:'ARCHIVED'});await event(tx,a,'foundation.venture_archived',r.id);return result;}
 if(['enable_future','activate_saas','live_deploy'].includes(action))fail('FEATURE_NOT_ACTIVE',403);
 return fail('UNSUPPORTED_FOUNDATION_COMMAND',400);
}
