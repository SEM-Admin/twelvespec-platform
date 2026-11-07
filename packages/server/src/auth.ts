import {betterAuth} from 'better-auth';
import {pool,fail,type Actor} from '../../kernel/src';
import {loadEnv} from '../../../scripts/env';
loadEnv();
let instance:ReturnType<typeof createAuth>|undefined;
function createAuth(){
 const secret=process.env.BETTER_AUTH_SECRET;if(!secret||secret.length<32)fail('AUTH_CONFIGURATION_REQUIRED',503);
 return betterAuth({database:pool(),secret,baseURL:process.env.APP_ORIGIN??'http://localhost:3001',trustedOrigins:[...(process.env.APP_ORIGIN?[new URL(process.env.APP_ORIGIN).origin]:[]),'http://localhost:3000','http://localhost:3001','http://127.0.0.1:3000','http://127.0.0.1:3001'],emailAndPassword:{enabled:true,disableSignUp:process.env.SEED_AUTH!=='1',minPasswordLength:12},advanced:{cookiePrefix:'twelvespec-'+(process.env.TWELVESPEC_APP??(process.env.APP_ORIGIN?.endsWith(':3000')?'shop':'os')),database:{generateId:()=>crypto.randomUUID()}},session:{expiresIn:60*60*8,updateAge:60*60},rateLimit:{enabled:true,storage:'database',window:60,max:60}});
}
export function getAuth(){return instance??=createAuth()}
export async function currentActor(headers:Headers):Promise<{actor:Actor;user:{id:string;name:string;email:string}}>{
 const s=await getAuth().api.getSession({headers});if(!s)fail('AUTHENTICATION_REQUIRED',401);
 const workspace=headers.get('x-workspace-id');
 const result=await pool().query('select * from memberships where user_id=$1 and ($2::uuid is null or workspace_id=$2) order by workspace_id limit 1',[s.user.id,workspace]);
 const m=result.rows[0];if(!m)fail('MEMBERSHIP_REQUIRED',403);
 return {actor:{userId:s.user.id,tenantId:m.tenant_id,workspaceId:m.workspace_id,role:m.role,email:s.user.email},user:{id:s.user.id,name:s.user.name,email:s.user.email}};
}
