import type { Data } from './types';
export async function api<T>(url:string,options?:RequestInit):Promise<T>{
 const response=await fetch(url,{credentials:'same-origin',...options,headers:{...(options?.body?{'Content-Type':'application/json'}:{}),...options?.headers}});
 let body:unknown;try{body=await response.json();}catch{throw new Error(`The server could not complete this request (${response.status}).`);}
 if(!response.ok){const data=body as Data;const code=String(data.error??data.code??'Request failed');throw new Error(code.replace(/_/g,' ').toLowerCase());}
 return body as T;
}
export async function platform(module:string,action:string,input:Data){const response=await api<{result:unknown}>('/api/platform',{method:'POST',body:JSON.stringify({module,action,input})});return response.result;}
