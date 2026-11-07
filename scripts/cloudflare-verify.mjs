/** Private verification of only the two new preview origins. Secrets are stdin-only. */
import {chromium,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
if(process.stdin.isTTY)process.stdin.setRawMode(true);
process.stdin.resume();console.log('Ready for private HTTPS preview verification (input is hidden).');
let raw='';for await(const c of process.stdin){raw+=c.toString();if(raw.includes('\n'))break;}
process.stdin.pause();if(process.stdin.isTTY)process.stdin.setRawMode(false);
const control=JSON.parse(raw.trim());raw='';
const origins={shop:'https://twelvespec-preview-shop.samantha-4ec.workers.dev',os:'https://twelvespec-preview-os.samantha-4ec.workers.dev'};
const allowed=new Set(Object.values(origins));
const accessHeaders={'CF-Access-Client-Id':control.clientId,'CF-Access-Client-Secret':control.clientSecret};
let browser;
try{
 for(const [app,origin] of Object.entries(origins)){
  const publicResponse=await fetch(origin,{redirect:'manual',signal:AbortSignal.timeout(30000)});
  if(publicResponse.status!==302||!publicResponse.headers.get('location')?.includes('.cloudflareaccess.com/'))throw new Error(app+' is not protected by Access');
  await publicResponse.body?.cancel();
  let response;
  for(let attempt=0;attempt<3;attempt++){
   response=await fetch(origin+'/api/health',{headers:accessHeaders,signal:AbortSignal.timeout(180000)});
   if(response.ok||response.status<500)break;
   await response.body?.cancel();await new Promise(resolve=>setTimeout(resolve,1000));
  }
  if(!response?.ok)throw new Error(app+' HTTPS health failed: '+response?.status);
  await response.body?.cancel();console.log(app+' HTTPS health and Access protection: PASS');
 }
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox'],...(process.env.HTTPS_PROXY||process.env.HTTP_PROXY?{proxy:{server:process.env.HTTPS_PROXY??process.env.HTTP_PROXY}}:{})});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 await context.route('**/*',route=>{const origin=new URL(route.request().url()).origin;return allowed.has(origin)?route.continue({headers:{...route.request().headers(),...accessHeaders}}):route.abort();});
 const page=await context.newPage();page.setDefaultTimeout(30000);
 await page.goto(origins.shop,{waitUntil:'networkidle',timeout:180000});
 await expect(page.getByRole('heading',{name:/Your brand/})).toBeVisible();
 await page.getByRole('button',{name:'Sign in',exact:true}).click();
 const login=page.getByRole('dialog');
 await login.getByLabel('Email',{exact:true}).fill('customer@demo.twelvespec.test');
 await login.getByLabel('Password',{exact:true}).fill(control.password);
 await login.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(login).toBeHidden();
 const shopData=await page.evaluate(async()=>{const r=await fetch('/api/shop');if(!r.ok)throw new Error('Catalog failed');return r.json();});
 if(shopData.products.length!==40)throw new Error('Expected a fresh synthetic catalog');
 const product=shopData.products.find(p=>p.title==='Everyday Cotton Tee')??shopData.products[0];
 await page.goto(origins.shop+'/products/'+product.id,{waitUntil:'networkidle'});
 const variant=product.variants.find(v=>v.color==='Clay')??product.variants[0];
 await page.getByRole('button',{name:'Select '+variant.color,exact:true}).click();
 await page.getByRole('button',{name:/Add to quote cart/}).click();
 await expect(page.getByRole('status').filter({hasText:/added to your saved quote cart/})).toBeVisible();
 await page.goto(origins.shop+'/cart',{waitUntil:'networkidle'});
 await expect(page.locator('.cart-items')).toContainText(product.title);
 await page.reload({waitUntil:'networkidle'});
 await expect(page.locator('.cart-items')).toContainText(product.title);
 await page.getByRole('button',{name:/Submit quote request/}).click();
 await expect(page).toHaveURL(origins.shop+'/account');
 const verifiedRfq=await page.evaluate(async({productId,variantId})=>{const r=await fetch('/api/shop/account');if(!r.ok)throw new Error('Account read failed');const {tables}=await r.json();return tables.requests.find(row=>row.data.lines?.some(line=>line.productId===productId&&line.variantId===variantId))?.id;},{productId:product.id,variantId:variant.id});
 if(!verifiedRfq)throw new Error('Quote request was not persisted');
 console.log('Storefront browser sign-in, exact variant, persisted cart and quote request: PASS');
 mkdirSync('.local/cloudflare',{recursive:true,mode:0o700});
 await page.screenshot({path:'.local/cloudflare/storefront-https.png',fullPage:true});
 await page.goto(origins.os,{waitUntil:'networkidle',timeout:120000});
 await page.getByLabel('Email address',{exact:true}).fill('owner@demo.twelvespec.test');
 await page.getByLabel('Password',{exact:true}).fill(control.password);
 await page.getByRole('button',{name:'Sign in to workspace',exact:true}).click();
 await expect(page.getByRole('heading',{name:'A clear view of what’s next.',exact:true})).toBeVisible();
 await page.getByRole('link',{name:'Customers & CRM',exact:true}).click();
 await page.locator('.head-actions').getByRole('button',{name:'Add contact',exact:true}).click();
 const dialog=page.getByRole('dialog');const suffix=crypto.randomUUID().slice(0,8),name='Preview Check '+suffix,email='preview-'+suffix+'@example.test';
 await dialog.getByLabel('Full name',{exact:true}).fill(name);
 await dialog.getByLabel('Email address',{exact:true}).fill(email);
 await dialog.getByRole('button',{name:'Add contact',exact:true}).click();
 await expect(dialog.getByRole('heading',{name:'Recorded successfully',exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'Done',exact:true}).click();
 await page.getByRole('textbox',{name:'Search workspace records'}).fill(email);
 await expect(page.locator('.record-title').filter({hasText:name})).toBeVisible();
 await page.reload({waitUntil:'networkidle'});
 await page.getByRole('textbox',{name:'Search workspace records'}).fill(email);
 await expect(page.locator('.record-title').filter({hasText:name})).toBeVisible();
 await page.screenshot({path:'.local/cloudflare/commerce-os-https.png',fullPage:true});
 const verifiedContact=await page.evaluate(async name=>{const r=await fetch('/api/platform?module=crm');if(!r.ok)throw new Error('CRM read failed');const {tables}=await r.json();return tables.contacts.find(row=>row.title===name)?.id;},name);
 if(!verifiedContact)throw new Error('CRM contact was not persisted');
 console.log('Commerce OS browser sign-in and persisted CRM record: PASS');
 const result={verifiedAt:new Date().toISOString(),origins,accessProtection:'PASS',shop:'PASS',os:'PASS',syntheticProducts:shopData.products.length,persistedCart:true,persistedRfq:true,persistedAdminRecord:true,rfqId:verifiedRfq,contactId:verifiedContact};
 writeFileSync('.local/cloudflare/https-verification.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}catch(e){console.error('Preview verification failed: '+e.message);process.exitCode=1;}finally{await browser?.close();}
