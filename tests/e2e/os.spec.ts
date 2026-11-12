import {randomUUID} from 'node:crypto';
import {test,expect,type Page,type BrowserContext} from '@playwright/test';

const OS='http://localhost:3001';
const SHOP='http://localhost:3000';
type BusinessRow={id:string;title:string;status:string;tenant_id:string;workspace_id:string;batch_id?:string;data:Record<string,unknown>};
type Workspace={id:string;tenantId:string;name:string;role:string};
type Session={actor:{userId:string;tenantId:string;workspaceId:string;role:string};workspaces:Workspace[]};
let ownerCookies:Awaited<ReturnType<BrowserContext['cookies']>>|undefined;

async function loginOwner(page:Page){
 if(ownerCookies)await page.context().addCookies(ownerCookies);
 await page.goto(OS,{waitUntil:'networkidle'});
 if(!ownerCookies){
  await page.getByLabel('Email address',{exact:true}).fill('owner@demo.twelvespec.test');
  await page.getByLabel('Password',{exact:true}).fill('TwelveSpec-Demo-2026!');
  await page.getByRole('button',{name:'Sign in to workspace',exact:true}).click();
 }
 await expect(page.getByRole('heading',{name:'A clear view of what’s next.',exact:true})).toBeVisible();
 await expect(page.getByLabel('Select workspace',{exact:true})).toBeVisible();
 // Workflow journeys share the authenticated owner's session; the first journey checks sign-in.
 ownerCookies=await page.context().cookies(OS);
}
async function moduleData(page:Page,module:string,workspaceId?:string){
 const response=await page.request.get(`${OS}/api/platform?module=${module}`,workspaceId?{headers:{'x-workspace-id':workspaceId}}:{});
 expect(response.ok(),`${module} API should authorize the signed-in owner`).toBeTruthy();
 return await response.json() as {tables:Record<string,BusinessRow[]>;summary:Record<string,string>};
}
function postResponse(page:Page,action:string){
 return page.waitForResponse(response=>response.url()===`${OS}/api/platform`&&response.request().method()==='POST'&&response.request().postDataJSON()?.action===action);
}

test('owner dashboard and canonical catalog use scoped records and protect the public projection',async({page})=>{
 await loginOwner(page);
 const session=await (await page.request.get(`${OS}/api/session`)).json() as Session;
 expect(session.actor.role).toBe('owner');
 await expect(page.locator('.demo-ribbon')).toContainText('Synthetic data');
 const today=await (await page.request.get(`${OS}/api/platform?module=today`)).json();const totals=today.summary.today.metrics;
 await expect(page.locator('.metric-card').filter({hasText:'Orders in motion'}).locator('strong')).toHaveText(String(totals.ordersInMotion));
 await expect(page.locator('.metric-card').filter({hasText:'Recorded gross profit'}).locator('strong')).toHaveText(totals.grossProfit===null?'Unknown':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(totals.grossProfit)));
 await expect(page.locator('.today-topline')).toContainText('Complete workspace totals');
 const catalog=await moduleData(page,'catalog');
 expect(catalog.tables.products.length).toBeGreaterThanOrEqual(40);
 expect(catalog.tables.variants.length).toBeGreaterThanOrEqual(120);
 expect(catalog.tables.products.every(row=>row.workspace_id===session.actor.workspaceId&&row.tenant_id===session.actor.tenantId)).toBeTruthy();
 await page.getByRole('link',{name:'Products',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Products',exact:true})).toBeVisible();
 await expect(page.getByRole('tab',{name:/^Products/})).toContainText(String(catalog.tables.products.length));
 const product=catalog.tables.products.find(row=>row.status==='PUBLISHED')!;
 await page.getByRole('textbox',{name:'Search workspace records'}).fill(product.title);
 await expect(page.locator('.record-title').filter({hasText:product.title}).first()).toBeVisible();
 const supplier=await moduleData(page,'supplier');
 expect(supplier.tables.connections.length).toBeGreaterThanOrEqual(3);
 const publicResponse=await page.request.get(`${SHOP}/api/shop`);
 expect(publicResponse.ok()).toBeTruthy();
 const publicCatalog=await publicResponse.json();
 const publicText=JSON.stringify(publicCatalog);
 expect(publicCatalog.products.length).toBeGreaterThanOrEqual(40);
 expect(publicText).not.toMatch(/"(?:secretReference|credential|supplierName|sourceSku|unitCost|wholesaleUnitCost|landedCost|sourceEvidence|margin)"/);
 for(const connection of supplier.tables.connections)expect(publicText).not.toContain(connection.title);
});

test('CRM contact created through the form survives reload with consent kept explicit',async({page})=>{
 await loginOwner(page);
 await page.getByRole('link',{name:'Customers & CRM',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Customers & CRM',exact:true})).toBeVisible();
 const suffix=randomUUID().slice(0,8),name=`Browser Contact ${suffix}`,email=`browser-${suffix}@example.test`;
 await page.locator('.head-actions').getByRole('button',{name:'Add contact',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await dialog.getByLabel('Full name',{exact:true}).fill(name);
 await dialog.getByLabel('Email address',{exact:true}).fill(email);
 await dialog.getByLabel(/^Notes/).fill('Synthetic contact created by the real Commerce OS browser form.');
 await expect(dialog.getByRole('checkbox',{name:'Marketing consent recorded'})).not.toBeChecked();
 const responsePromise=postResponse(page,'create_contact');
 await dialog.getByRole('button',{name:'Add contact',exact:true}).click();
 const response=await responsePromise;
 expect(response.ok(),await response.text()).toBeTruthy();
 await expect(dialog.getByRole('heading',{name:'Recorded successfully',exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'Done',exact:true}).click();
 await page.getByRole('textbox',{name:'Search workspace records'}).fill(email);
 await expect(page.locator('.record-title').filter({hasText:name})).toBeVisible();
 await page.reload({waitUntil:'networkidle'});
 await page.getByRole('textbox',{name:'Search workspace records'}).fill(email);
 await expect(page.locator('.record-title').filter({hasText:name})).toBeVisible();
 const {tables}=await moduleData(page,'crm');
 const contact=tables.contacts.find(row=>row.title===name);
 expect(contact?.data.email).toBe(email);
 expect((contact?.data.consent as {marketing:boolean}).marketing).toBe(false);
});

test('Integration Center replaces credentials with masked metadata and never returns plaintext',async({page})=>{
 await loginOwner(page);
 await page.getByRole('link',{name:'Integration Center',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Integration Center',exact:true})).toBeVisible();
 const suffix=randomUUID().slice(0,8),name=`Browser Supplier ${suffix}`,initial=`synthetic-initial-${suffix}-1942`,replacement=`synthetic-replacement-${suffix}-7391`;
 const consoleMessages:string[]=[];page.on('console',message=>consoleMessages.push(message.text()));
 await page.getByRole('button',{name:'Add connection',exact:true}).click();
 let dialog=page.getByRole('dialog');
 await expect(dialog.getByRole('heading',{name:'Add a supported connection',exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'Continue',exact:true}).click();
 await dialog.getByLabel('Account name',{exact:true}).fill(name);
 await dialog.getByRole('combobox',{name:/^Environment/}).selectOption('mock');
 await dialog.getByRole('button',{name:'Continue',exact:true}).click();
 await dialog.getByLabel('Supplier account number',{exact:true}).fill(`DEMO-${suffix}`);
 await dialog.getByLabel('API username',{exact:true}).fill(`demo-user-${suffix}`);
 await dialog.getByLabel('API password',{exact:true}).fill(initial);
 const savedPromise=postResponse(page,'save_secret');
 await dialog.getByRole('button',{name:'Continue',exact:true}).click();
 const saved=await savedPromise;expect(saved.ok()).toBeTruthy();
 expect(await saved.text()).not.toContain(initial);
 await expect(dialog.getByRole('heading',{name:'Verify each service independently.',exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'Run read-only verification',exact:true}).click();
 await expect(dialog.getByRole('heading',{name:'Connection setup recorded.',exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'Done',exact:true}).click();
 const card=page.locator('.connection-card').filter({has:page.getByRole('heading',{name,exact:true})});
 await expect(card).toBeVisible();
 await expect(card.locator('.badge')).toContainText(/mocked/i);
 await card.getByRole('button',{name:'Manage',exact:true}).click();
 dialog=page.getByRole('dialog');
 await dialog.getByLabel('New API credential',{exact:true}).fill(replacement);
 const replacementPromise=postResponse(page,'save_secret');
 await dialog.getByRole('button',{name:'Save replacement',exact:true}).click();
 const replaced=await replacementPromise;
 expect(replaced.ok()).toBeTruthy();
 const replacedText=await replaced.text();
 expect(replacedText).toContain('7391');expect(replacedText).not.toContain(replacement);expect(replacedText).not.toContain('secretReference');
 await expect(dialog.getByText('Settings saved and audited.',{exact:true})).toBeVisible();
 await expect(dialog.getByLabel('New API credential',{exact:true})).toHaveValue('');
 const {tables}=await moduleData(page,'supplier');
 const stored=tables.connections.find(row=>row.title===name);
 expect(stored?.data.maskedHint).toContain('7391');
 const apiText=JSON.stringify(tables);expect(apiText).not.toContain(initial);expect(apiText).not.toContain(replacement);expect(apiText).not.toContain('secretReference');
 expect(await page.content()).not.toContain(initial);expect(await page.content()).not.toContain(replacement);
 expect(consoleMessages.join('\n')).not.toContain(initial);expect(consoleMessages.join('\n')).not.toContain(replacement);
});

test('CSV import stages, validates and commits reviewed drafts without publishing, then rolls back',async({page})=>{
 await loginOwner(page);
 const before=await (await page.request.get(`${SHOP}/api/shop`)).json();
 const publicIds=before.products.map((p:{id:string})=>p.id).sort();
 await page.getByRole('link',{name:'Integration Center',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Integration Center',exact:true})).toBeVisible();
 const suffix=randomUUID().slice(0,8),fileName=`browser-feed-${suffix}.csv`,title=`Browser Imported Product ${suffix}`;
 const csv=`sku,name,brand,mpn,color,size,currency,cost,moq,freight\nBROWSER-${suffix},${title},Browser Fixture,MPN-${suffix},Navy,Standard,USD,12.50,12,15.00\n`;
 await page.getByRole('button',{name:'Import CSV / XML',exact:true}).click();
 const dialog=page.getByRole('dialog');
 await dialog.locator('input[type="file"]').setInputFiles({name:fileName,mimeType:'text/csv',buffer:Buffer.from(csv)});
 await dialog.getByRole('button',{name:'Map fields',exact:true}).click();
 await expect(dialog.getByLabel('Map Source SKU / product ID',{exact:true})).toHaveValue('sku');
 await expect(dialog.getByLabel('Map Wholesale unit cost',{exact:true})).toHaveValue('cost');
 const stagedPromise=postResponse(page,'stage_file');
 await dialog.getByRole('button',{name:'Stage private import',exact:true}).click();
 const staged=await stagedPromise;expect(staged.ok()).toBeTruthy();
 const {result:batch}=await staged.json();
 expect(batch.status).toBe('STAGED');expect(batch.data.validRows).toBe(1);expect(batch.data.invalidRows).toBe(0);
 await expect(dialog.locator('.import-row-preview')).toContainText(title);
 const validatedPromise=postResponse(page,'preview_mapping');
 await dialog.getByRole('button',{name:'Validate mapping',exact:true}).click();
 expect((await validatedPromise).ok()).toBeTruthy();
 const committedPromise=postResponse(page,'commit_import');
 await dialog.getByRole('button',{name:'Review & commit drafts',exact:true}).click();
 expect((await committedPromise).ok()).toBeTruthy();
 await expect(dialog.getByRole('heading',{name:'Reviewed changes committed.',exact:true})).toBeVisible();
 await dialog.getByRole('button',{name:'Done',exact:true}).click();
 const catalog=await moduleData(page,'catalog');
 const imported=catalog.tables.products.find(row=>row.title===title);
 expect(imported?.status).toBe('DRAFT');
 expect(imported?.data.licenseApproved).toBe(false);
 const after=await (await page.request.get(`${SHOP}/api/shop`)).json();
 expect(after.products.map((p:{id:string})=>p.id).sort()).toEqual(publicIds);
 const supplier=await moduleData(page,'supplier');
 const storedBatch=supplier.tables.import_batches.find(row=>row.id===batch.id);
 expect(storedBatch?.status).toBe('COMMITTED');
 expect(supplier.tables.import_rows.some(row=>row.batch_id===batch.id)).toBeTruthy();
 const batchCard=page.locator('.batch-review').filter({has:page.getByRole('heading',{name:fileName,exact:true})});
 await expect(batchCard).toBeVisible();
 const rollbackPromise=postResponse(page,'rollback_import');
 await batchCard.getByRole('button',{name:'Roll back import',exact:true}).click();
 expect((await rollbackPromise).ok()).toBeTruthy();
 await expect(batchCard.locator('.badge').first()).toContainText(/rolled back/i);
});

test('Coming Soon has no transaction controls and switching workspace changes the actual data scope',async({page})=>{
 await loginOwner(page);
 const session=await (await page.request.get(`${OS}/api/session`)).json() as Session;
 expect(session.workspaces.length).toBeGreaterThanOrEqual(2);
 const main=session.workspaces.find(w=>w.id===session.actor.workspaceId)!;
 const other=session.workspaces.find(w=>w.id!==main.id)!;
 const original=await moduleData(page,'crm');
 expect(original.tables.contacts.length).toBeGreaterThanOrEqual(10);
 expect(original.tables.contacts.some(row=>row.title==='Isolation sentinel')).toBe(false);
 await page.getByRole('link',{name:'Coming Soon',exact:true}).click();
 await expect(page.getByRole('heading',{name:'What’s next, when it’s ready.',exact:true})).toBeVisible();
 await expect(page.locator('.coming-grid>section')).toHaveCount(20);
 await expect(page.locator('.coming-grid button')).toHaveCount(0);
 const denied=await page.request.post(`${OS}/api/platform`,{headers:{Origin:OS},data:{module:'future',action:'create',input:{title:'Must remain unavailable'}}});
 expect(denied.status()).toBe(403);
 const scopeResponse=page.waitForResponse(response=>response.url()===`${OS}/api/session`&&response.request().headers()['x-workspace-id']===other.id);
 await page.getByLabel('Select workspace',{exact:true}).selectOption(other.id);
 expect((await scopeResponse).ok()).toBeTruthy();
 await expect(page.locator('.workspace-switch')).toContainText(other.name);
 await page.goto(`${OS}/crm`,{waitUntil:'networkidle'});
 await expect(page.locator('.record-title').filter({hasText:'Isolation sentinel'})).toBeVisible();
 const isolated=await moduleData(page,'crm',other.id);
 expect(isolated.tables.contacts.every(row=>row.workspace_id===other.id&&row.tenant_id===other.tenantId)).toBeTruthy();
 const originalIds=new Set(original.tables.contacts.map(row=>row.id));
 expect(isolated.tables.contacts.every(row=>!originalIds.has(row.id))).toBeTruthy();
 await expect(page.getByRole('textbox',{name:'Search workspace records'})).toBeVisible();
 const returnResponse=page.waitForResponse(response=>response.url()===`${OS}/api/session`&&response.request().headers()['x-workspace-id']===main.id);
 await page.getByLabel('Select workspace',{exact:true}).selectOption(main.id);
 expect((await returnResponse).ok()).toBeTruthy();
 await expect(page.locator('.workspace-switch')).toContainText(main.name);
 await expect(page.locator('.record-title').filter({hasText:original.tables.contacts[0].title}).first()).toBeVisible();
 await expect(page.locator('.record-title').filter({hasText:'Isolation sentinel'})).toHaveCount(0);
});
