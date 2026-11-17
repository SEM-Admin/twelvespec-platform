import {expect,test} from '@playwright/test';
import {loginOwner} from './owner-session';
const SHOP='http://localhost:3000';
test('catalog curator uses all uploaded decoration guidance without publishing families or inventing SKU options',async({page})=>{
 test.setTimeout(120000);await loginOwner(page,'/catalog');
 const before=await (await page.request.get(SHOP+'/api/shop')).json();
 await expect(page.getByRole('region',{name:'Decoration research reference',exact:true})).toBeHidden();await page.getByText('Decoration guidance — view research',{exact:true}).click();
 const guide=page.getByRole('region',{name:'Decoration research reference',exact:true});await expect(guide).toContainText('106 product families · 54 methods and finishes · 24 references');await expect(guide).toContainText('It does not add products or enable decoration choices.');await expect(guide.getByRole('combobox',{name:'Guidance method',exact:true}).locator('option')).toHaveCount(55);
 await guide.getByRole('combobox',{name:'Guidance category',exact:true}).selectOption('Apparel & uniforms');
 const queried=page.waitForResponse(r=>{if(!r.url().endsWith('/api/platform')||r.request().method()!=='POST')return false;const v=r.request().postDataJSON();return v?.module==='catalog'&&v?.action==='decoration_guidance'&&v?.input?.search==='nylon'&&v?.input?.category==='Apparel & uniforms'&&r.status()===200;});
 await guide.getByRole('textbox',{name:'Search decoration guidance',exact:true}).fill('nylon');const data=await (await queried).json();expect(data.result.total).toBeGreaterThan(0);expect(data.result.families.every((r:{skuVerified:boolean;availableForSelection:boolean})=>r.skuVerified===false&&r.availableForSelection===false)).toBe(true);
 await expect(guide.getByText(new RegExp('^'+data.result.total+' matching families'))).toBeVisible();await guide.getByText('Review guidance for Nylon windbreakers / rainwear',{exact:true}).click();await expect(guide).toContainText('Waterproof treatments may block adhesion; holes affect water resistance');await expect(guide).toContainText('This does not establish an in-house capability or approved producer.');
 const after=await (await page.request.get(SHOP+'/api/shop')).json();expect(after.products.map((r:{id:string})=>r.id)).toEqual(before.products.map((r:{id:string})=>r.id));expect(JSON.stringify(after)).not.toMatch(/CATEGORY_GUIDANCE_ONLY|PRIVATE_REFERENCE_ONLY|HAT-PUKKA|EMB_PUFF/);
 await page.screenshot({path:'.local/decoration-guidance.png',fullPage:true});
});
