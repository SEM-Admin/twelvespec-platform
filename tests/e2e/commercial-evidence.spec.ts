import {test,expect} from '@playwright/test';
const OS='http://localhost:3001',SHOP='http://localhost:3000';

test('authenticated evidence commands preserve a draft quote and keep source facts out of storefront responses',async({page,browser})=>{
 await page.goto(OS);await page.getByLabel('Email address',{exact:true}).fill('owner@demo.twelvespec.test');await page.getByLabel('Password',{exact:true}).fill('TwelveSpec-Demo-2026!');await page.getByRole('button',{name:'Sign in to workspace',exact:true}).click();
 await expect(page.getByRole('heading',{name:'A clear view of what’s next.',exact:true})).toBeVisible();
 const command=async(module:string,action:string,input:Record<string,unknown>)=>{
  const response=await page.request.post(`${OS}/api/platform`,{headers:{Origin:OS},data:{module,action,input}});
  expect(response.ok(),`${module}.${action}: ${await response.text()}`).toBe(true);return (await response.json()).result;
 };
 const catalog=await (await page.request.get(`${OS}/api/platform?module=catalog`)).json();
 const product=catalog.tables.products.find((p:{data:{methods?:string[]}})=>p.data.methods?.length);
 const variant=catalog.tables.variants.find((v:{product_id:string})=>v.product_id===product.id);
 expect(variant).toBeTruthy();const marker=`PRIVATE-CIA-METADATA-${crypto.randomUUID()}`,expires=new Date(Date.now()+86400000).toISOString();
 const source=await command('supplier','register_evidence_source',{sourceKey:marker,title:'SYNTHETIC browser evidence',publisher:'Synthetic browser fixture',edition:'2026',contentHash:'1'.repeat(64),origin:'SYNTHETIC',rightsReference:marker,allowedUses:['INTERNAL_RESEARCH','QUOTE_COST'],rightsValidFrom:new Date(Date.now()-60000).toISOString(),rightsValidUntil:expires,retentionUntil:new Date(Date.now()+2*86400000).toISOString(),parserVersion:'browser-fixture/1'});
 const observation=await command('supplier','record_price_observation',{sourceId:source.id,observationKey:marker,productId:product.id,variantId:variant.id,expectedProductRevision:product.revision,expectedVariantRevision:variant.revision,priceClass:'DISTRIBUTOR_NET',originalValue:'0.0250',currency:'USD',unitBasis:'EACH',unitsPerPrice:1,minimumQuantity:1,orderMultiple:1,territory:'US',channel:'DIRECT',observedAt:new Date().toISOString(),effectiveFrom:new Date(Date.now()-60000).toISOString(),effectiveUntil:expires,freshnessHours:24,evidenceState:'SYNTHETIC'});
 expect(observation.original_value).toBe('0.0250');expect(observation.unit_amount).toBe('0.02500000');
 const quote=await command('sales','create',{title:'SYNTHETIC CIA draft',lines:[{productId:product.id,variantId:variant.id,quantity:1000,method:product.data.methods[0],location:product.data.locations[0]}]});
 const input={quoteId:quote.id,observationId:observation.id,lineIndex:0,currency:'USD',territory:'US',channel:'DIRECT',idempotencyKey:crypto.randomUUID()};
 const assessment=await command('sales','assess_quote_price',input);
 expect(assessment.result).toMatchObject({eligibleForQuoteCost:false,materialCost:null,customerPrice:null,productionReadiness:'BLOCKED'});expect(assessment.result.reasons).toContain('SYNTHETIC_EVIDENCE');
 expect((await command('sales','assess_quote_price',input)).id).toBe(assessment.id);
 const sales=await (await page.request.get(`${OS}/api/platform?module=sales`)).json();
 const unchanged=sales.tables.quotes.find((q:{id:string})=>q.id===quote.id);expect(unchanged.status).toBe('DRAFT');expect(unchanged.revision).toBe(quote.revision);expect(unchanged.data).toEqual(quote.data);
 const anonymous=await browser.newContext();try{
  const denied=await anonymous.request.post(`${OS}/api/platform`,{headers:{Origin:OS},data:{module:'sales',action:'assess_quote_price',input}});expect(denied.status()).toBe(401);
  const storefront=await (await anonymous.request.get(`${SHOP}/api/shop`)).text();expect(storefront).not.toContain(marker);expect(storefront).not.toContain('price_assessments');
 }finally{await anonymous.close();}
});
