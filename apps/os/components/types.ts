export type Data = Record<string, unknown>;
export type Row={id:string;title:string;status:string;data:Data;revision:number;created_at:string;[key:string]:unknown};
export type ModuleData={module:string;tables:Record<string,Row[]>;summary?:Data};
export type WorkspaceOption={id:string;tenantId:string;name:string;role:string};
export type Actor={userId:string;role:string;tenantId:string;workspaceId:string;email?:string};
export async function request<T>(path:string,options?:RequestInit):Promise<T>{
 const headers=new Headers(options?.headers);headers.set('Content-Type','application/json');
 let selected='';if(typeof window!=='undefined'&&path.startsWith('/api/')&&!path.startsWith('/api/auth/')){try{selected=window.localStorage.getItem('ts.workspace')??'';}catch{}if(selected)headers.set('x-workspace-id',selected);}
 let response=await fetch(path,{...options,headers,credentials:'same-origin',cache:'no-store'});
 if(path==='/api/session'&&response.status===403&&selected){window.localStorage.removeItem('ts.workspace');headers.delete('x-workspace-id');response=await fetch(path,{...options,headers,credentials:'same-origin',cache:'no-store'});}
 const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(String(data.error??data.message??data.code??`Request failed (${response.status})`));return data as T;
}
export async function command(module:string,action:string,input:Data={}){return request<{result:unknown}>('/api/platform',{method:'POST',body:JSON.stringify({module,action,input})})}
export const asString=(v:unknown,fallback='')=>typeof v==='string'?v:typeof v==='number'?String(v):fallback;
export const asNumber=(v:unknown,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
export const money=(v:unknown)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(asNumber(v));
export const pretty=(v:string)=>v.replaceAll('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
export const key=()=>crypto.randomUUID();
