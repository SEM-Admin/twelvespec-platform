import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {expect,type Page,type BrowserContext} from '@playwright/test';
const OS='http://localhost:3001';
type Cookies=Awaited<ReturnType<BrowserContext['cookies']>>;
// Each suite has its own disposable DB/secret. Reuse a genuine UI sign-in so
// a fast runner does not turn repeated fixture setup into a login-rate attack.
const fingerprint=createHash('sha256').update(process.env.DATABASE_URL??'local').digest('hex');
const folder=resolve(process.env.TWELVESPEC_ROOT??process.cwd(),'.local');
const cache=resolve(folder,'browser-owner-'+fingerprint+'.json');
export async function loginOwner(page:Page,path='/'){
 const destination=new URL(path,OS);if(destination.origin!==OS)throw new Error('Owner fixture is local only.');
 let cookies:Cookies=[];try{cookies=JSON.parse(readFileSync(cache,'utf8'));}catch{}
 if(cookies.length)await page.context().addCookies(cookies);
 const session=await page.request.get(OS+'/api/session');
 const authenticated=session.ok()&&(await session.json()).actor?.role==='owner';
 await page.goto(destination.toString(),{waitUntil:'networkidle'});
 if(!authenticated){
  await page.getByLabel('Email address',{exact:true}).fill('owner@demo.twelvespec.test');await page.getByLabel('Password',{exact:true}).fill('TwelveSpec-Demo-2026!');
  const receipt=page.waitForResponse(r=>r.url().endsWith('/api/auth/sign-in/email')&&r.request().method()==='POST');await page.getByRole('button',{name:'Sign in to workspace',exact:true}).click();const response=await receipt;expect(response.status(),'Owner sign-in should succeed').toBe(200);
 }
 await expect(page.getByLabel('Select workspace',{exact:true})).toBeVisible();
 mkdirSync(folder,{recursive:true});writeFileSync(cache,JSON.stringify((await page.context().cookies(OS)).filter(c=>c.name.includes('twelvespec-os'))),{mode:0o600});
}
