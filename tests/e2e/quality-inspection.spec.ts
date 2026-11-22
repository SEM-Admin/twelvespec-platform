import {test,expect,type Page} from '@playwright/test';
import {Client} from 'pg';
import {randomUUID} from 'node:crypto';
import {loadEnv} from '../../scripts/env';
import {loginOwner} from './owner-session';

const OS='http://localhost:3001';
function response(page:Page,action:string){return page.waitForResponse(result=>result.url()===`${OS}/api/platform`&&result.request().postDataJSON()?.action===action);}
test('operator explicitly records failed/pass checks and reinspects an unshipped job without rewriting QC history',async({page})=>{
 test.setTimeout(120000);
 await loginOwner(page);
 const {actor}=await (await page.request.get(`${OS}/api/session`)).json();
 const catalog=await (await page.request.get(`${OS}/api/shop`)).json(),product=catalog.products.find((p:{title:string})=>p.title==='Everyday Cotton Tee'),variant=product.variants[0];
 loadEnv();const url=new URL(process.env.DATABASE_URL!);expect(['localhost','127.0.0.1']).toContain(url.hostname);
 const database=new Client({connectionString:url.toString()}),orderId=randomUUID(),lineId=randomUUID(),marker=`SYNTHETIC QC ${randomUUID()}`;
 const line={productId:product.id,variantId:variant.id,quantity:10,method:'none',location:'front'};
 // Isolated blank-order fixture. This test establishes inspection behavior,
 // not a supplier-verified manufacturing route or real financial commitment.
 try{
  await database.connect();
  const ownerId=(await database.query("select user_id from memberships where tenant_id=$1 and workspace_id=$2 and role='customer' limit 1",[actor.tenantId,actor.workspaceId])).rows[0].user_id;
  await database.query("insert into app.orders(id,tenant_id,workspace_id,owner_id,title,status,data) values($1,$2,$3,$4,$5,'CONFIRMED',$6)",[orderId,actor.tenantId,actor.workspaceId,ownerId,marker,{terms:'INVOICE',lines:[line],synthetic:true}]);
  await database.query('insert into app.order_lines(id,tenant_id,workspace_id,owner_id,title,order_id,product_id,variant_id,data) values($1,$2,$3,$4,$5,$6,$7,$8,$9)',[lineId,actor.tenantId,actor.workspaceId,ownerId,marker,orderId,product.id,variant.id,line]);
 }finally{await database.end();}
 const allocated=await page.request.post(`${OS}/api/platform`,{headers:{Origin:OS},data:{module:'orders',action:'allocate_jobs',input:{id:orderId,key:randomUUID()}}});expect(allocated.ok()).toBe(true);
 const allocation=await allocated.json(),jobId=allocation.result.jobs[0].id;
 await page.goto(`${OS}/orders`,{waitUntil:'networkidle'});
 await page.getByRole('tab',{name:/^Jobs/}).click();
 const row=page.getByRole('row').filter({hasText:marker});await expect(row).toBeVisible();
 await row.getByRole('button',{name:'Start production',exact:true}).click();
 let dialog=page.getByRole('dialog');let saved=response(page,'start_job');await dialog.getByRole('button',{name:'Start production',exact:true}).click();expect((await saved).ok()).toBe(true);await expect(dialog.getByRole('heading',{name:'Recorded successfully',exact:true})).toBeVisible();await dialog.getByRole('button',{name:'Close action',exact:true}).click();
 const labels=['Overall inspection result','Quantity inspection','Color inspection','Placement inspection','Damage inspection'];
 async function record(passed:boolean){
  await row.getByRole('button',{name:'Record quality check',exact:true}).click();dialog=page.getByRole('dialog');
  for(const label of labels){await expect(dialog.getByRole('combobox',{name:label,exact:true})).toHaveValue('');await dialog.getByRole('combobox',{name:label,exact:true}).selectOption(!passed&&(label==='Overall inspection result'||label==='Damage inspection')?'FAIL':'PASS');}
  await dialog.getByLabel(/^Inspection notes/).fill(passed?'Synthetic rework checked explicitly':'Synthetic damaged seam; rework required');
  saved=response(page,'record_qc');await dialog.getByRole('button',{name:'Record quality check',exact:true}).click();const receipt=await (await saved).json();expect(receipt.result.status).toBe(passed?'PASSED':'FAILED');expect(receipt.result.data.checks.damage).toBe(passed);expect(receipt.result.data.assessment).toBe('OPERATOR_RECORDED');
  await expect(dialog.getByRole('heading',{name:'Recorded successfully',exact:true})).toBeVisible();await dialog.getByRole('button',{name:'Close action',exact:true}).click();
 }
 await record(false);await expect(row).toContainText(/REWORK/i);await expect(row.getByRole('button',{name:'Complete job',exact:true})).toHaveCount(0);
 await row.getByRole('button',{name:'Start production',exact:true}).click();dialog=page.getByRole('dialog');saved=response(page,'start_job');await dialog.getByRole('button',{name:'Start production',exact:true}).click();await saved;await expect(dialog.getByRole('heading',{name:'Recorded successfully',exact:true})).toBeVisible();await dialog.getByRole('button',{name:'Close action',exact:true}).click();
 await record(true);
 await row.getByRole('button',{name:'Complete job',exact:true}).click();dialog=page.getByRole('dialog');saved=response(page,'close_job');await dialog.getByRole('button',{name:'Complete job',exact:true}).click();expect((await saved).ok()).toBe(true);await expect(dialog.getByRole('heading',{name:'Recorded successfully',exact:true})).toBeVisible();await dialog.getByRole('button',{name:'Close action',exact:true}).click();
 await row.getByRole('button',{name:'Reinspect unshipped job',exact:true}).click();dialog=page.getByRole('dialog');await dialog.getByLabel('Reason for reinspection',{exact:true}).fill('Synthetic final packaging review');saved=response(page,'reopen_qc');await dialog.getByRole('button',{name:'Reinspect unshipped job',exact:true}).click();expect((await saved).ok()).toBe(true);await expect(dialog.getByRole('heading',{name:'Recorded successfully',exact:true})).toBeVisible();await dialog.getByRole('button',{name:'Close action',exact:true}).click();
 await expect(row.getByRole('button',{name:'Complete job',exact:true})).toHaveCount(0);await expect(row.getByRole('button',{name:'Record quality check',exact:true})).toBeVisible();
 const {tables}=await (await page.request.get(`${OS}/api/platform?module=orders`)).json(),history=tables.qc_checks.filter((qc:{job_id:string})=>qc.job_id===jobId);
 expect(history).toHaveLength(2);expect(new Set(history.map((qc:{status:string})=>qc.status))).toEqual(new Set(['FAILED','PASSED']));expect(history.every((qc:{data:{inspectionSchema:string}})=>qc.data.inspectionSchema==='EXPLICIT_QC_V1')).toBe(true);
 const shipment=await page.request.post(`${OS}/api/platform`,{headers:{Origin:OS},data:{module:'fulfillment',action:'create_shipment',input:{orderId,lines:[{orderLineId:lineId,quantity:10}],key:randomUUID()}}});expect(shipment.status()).toBe(409);expect((await shipment.json()).code).toBe('QC_COMPLETE_REQUIRED');
});
