import { describe,it,expect } from 'vitest';
import { publicProduct,publishIssues,resolveProductIdentity } from '../../packages/catalog/src/index';
import type {Row,Input} from '../../packages/kernel/src/index';
const row=(title:string,data:Input={},extra:Input={}):Row=>({id:'product-1',tenant_id:'t',workspace_id:'w',owner_id:'u',title,status:'PUBLISHED',revision:1,created_at:'2026-11-05',updated_at:'2026-11-05',data,...extra});
const product=()=>row('Synthetic polo',{sku:'TS-001',brand:'Example Brand',category:'APPAREL',description:'Synthetic public description',minimumQuantity:12,methods:['screen_print','embroidery'],locations:['front'],image:'/products/polo.png',licenseApproved:true,unitCost:'PRIVATE_COST',supplierName:'PRIVATE_SUPPLIER',sourcePartId:'PRIVATE_PART',secretReference:'PRIVATE_SECRET',connectionId:'PRIVATE_CONNECTION',costLineage:{vendor:'PRIVATE_VENDOR'}});
const variant=()=>row('Navy M',{color:'Navy',hex:'#123456',size:'M',image:'/products/polo-navy.png',partId:'PRIVATE_VARIANT_ID',cost:'PRIVATE_VARIANT_COST'},{id:'variant-1',product_id:'product-1'});
describe('A09 / public canonical product projection',()=>{
 it('exports only allowlisted consumer fields including exact variant image/swatch',()=>{
  const publicRow=publicProduct(product(),[variant()]);const serialized=JSON.stringify(publicRow);
  expect(serialized).not.toContain('PRIVATE');expect(serialized).not.toMatch(/secretReference|connectionId|unitCost|costLineage|partId/);
  expect(publicRow.variants).toEqual([{id:'variant-1',color:'Navy',hex:'#123456',size:'M',image:'/products/polo-navy.png',availability:'REQUEST_QUOTE'}]);expect(publicRow.readiness).toBe('REQUEST_QUOTE_ONLY');expect(publicRow.price).toBeNull();
 });
 it('rejects supplier-hosted images and suspicious derivative paths from public output',()=>{
  const p=product(),v=variant();p.data.image='https://private-supplier.example/vendor-id.png';v.data.image='//private-supplier.example/source.png';expect(publicProduct(p,[v]).image).toBeNull();expect((publicProduct(p,[v]).variants as Input[])[0].image).toBeNull();
 });
 it('reloads the allowlisted public snapshot format used by deterministic seed data',()=>{
  const p=product(),v=variant(),snapshot=publicProduct(p,[v]);p.data.publicSnapshot=snapshot;
  expect(publicProduct(p,[v])).toEqual(snapshot);expect((publicProduct(p,[v]).variants as Input[])[0].color).toBe('Navy');
 });
 it('A38: uses last safe published snapshot when current draft/sync data changes',()=>{
  const p=product(),v=variant();p.data.publicSnapshot={title:'Approved public title',product:{...p.data,description:'Approved copy'},variants:[v]};p.title='New supplier title awaiting review';p.data.description='Unreviewed supplier update';
  const output=publicProduct(p,[v]);expect(output.title).toBe('Approved public title');expect(output.description).toBe('Approved copy');
 });
});
describe('A10 / catalog publish eligibility and matching',()=>{
 it('requires license assertion, correct variants and approved local image',()=>{
  expect(publishIssues(product(),[variant()])).toEqual([]);const p=product();p.data.licenseApproved=false;p.data.image='https://vendor.example/product.png';expect(publishIssues(p,[])).toEqual(expect.arrayContaining(['ASSET_LICENSE_APPROVAL_REQUIRED','APPROVED_LOCAL_IMAGE_REQUIRED','VARIANTS_REQUIRED']));
 });
 it('does not auto-merge by title',()=>{
  const candidate=row('Same name',{brand:'Brand',mpn:'MODEL-1'});
  expect(resolveProductIdentity({name:'Same name'},[candidate])).toBeNull();expect(resolveProductIdentity({brand:'Brand',mpn:'MODEL-1'},[candidate])?.id).toBe(candidate.id);
 });
 it('verified GTIN and brand outrank title similarity while ambiguous identities fail',()=>{
  const candidate=row('Different title',{brand:'Brand',gtin:'012345678905',gtinVerified:true});
  expect(resolveProductIdentity({brand:'Brand',gtin:'012345678905',gtinVerified:false},[candidate])).toBeNull();expect(resolveProductIdentity({brand:'Brand',gtin:'012345678905',gtinVerified:true},[candidate])?.id).toBe(candidate.id);
  expect(()=>resolveProductIdentity({brand:'Brand',gtin:'012345678905',gtinVerified:true},[candidate,{...candidate,id:'different'}])).toThrow('AMBIGUOUS_PRODUCT_IDENTITY');
 });
});
