import { describe,it,expect } from 'vitest';
import { validateDesign,sniffAsset,preflightDesign,publicAsset,MAX_ASSET_BYTES } from '../../packages/creative/src/index';
import type { Row } from '../../packages/kernel/src/index';

const base={layers:[{id:'logo',type:'image',x:0,y:0,width:1000,height:1000,assetId:'asset-id'}],placement:{xMm:0,yMm:0,widthMm:254,heightMm:254,location:'front',bleedMm:3},physicalWidthMm:254,physicalHeightMm:254,method:'digital_print'};
describe('A14/A16/A17 Creative Studio contracts',()=>{
 it('validates bounded immutable design documents without HTML execution',()=>{
  const design=validateDesign(base);expect(design.layers[0].assetId).toBe('asset-id');
  expect(()=>validateDesign({...base,layers:[{id:'x',type:'script',source:'alert(1)'}]})).toThrow('INVALID_LAYER');
  expect(()=>validateDesign({...base,layers:[{...base.layers[0],x:900,width:500}]})).toThrow('LAYER_OUTSIDE_CANVAS');
  expect(()=>validateDesign({...base,placement:{...base.placement,xMm:254}})).toThrow('PLACEMENT_OUTSIDE_PRINT_AREA');
 });
 it('rejects duplicate layer identity and invalid colors',()=>{
  expect(()=>validateDesign({...base,layers:[base.layers[0],base.layers[0]]})).toThrow('DUPLICATE_LAYER_ID');
  expect(()=>validateDesign({...base,layers:[{id:'x',type:'shape',x:0,y:0,width:100,height:100,fill:'url(javascript:alert(1))'}]})).toThrow('INVALID_LAYER_COLOR');
 });
 it('sniffs image magic, rejects claim mismatches, SVG/script payloads and oversize',()=>{
  const png=Buffer.from([137,80,78,71,13,10,26,10,0,0,0]);
  expect(sniffAsset(png,'image/png').mimeType).toBe('image/png');
  expect(()=>sniffAsset(png,'image/jpeg')).toThrow('UNSUPPORTED_OR_MISMATCHED_ASSET_TYPE');
  expect(()=>sniffAsset(Buffer.from('<svg><script>alert(1)</script></svg>'),'image/svg+xml')).toThrow();
  expect(()=>sniffAsset(Buffer.alloc(MAX_ASSET_BYTES+1),'image/png')).toThrow('ASSET_SIZE_LIMIT');
 });
 it('uses actual image dimensions and physical placement for effective DPI',()=>{
  const design=validateDesign(base),assets=[{id:'asset-id',widthPx:1000,heightPx:1000,rightsConfirmed:true,scanStatus:'NOT_CONFIGURED'}];
  const result=preflightDesign(design,assets);
  expect(result.effectiveDpi).toBeCloseTo(100);
  expect(result.errors).toContain('EFFECTIVE_DPI');expect(result.ready).toBe(false);expect(result.productionReadiness).toBe('BLOCKED');
 });
 it('high resolution never substitutes for licensing/color/production validation',()=>{
  const result=preflightDesign(validateDesign(base),[{id:'asset-id',widthPx:6000,heightPx:6000,rightsConfirmed:true,scanStatus:'CLEAN'}]);
  expect(result.errors).not.toContain('EFFECTIVE_DPI');expect(result.errors).not.toContain('MALWARE_SCAN');
  expect(result.errors).toContain('COLOR_PROFILE_VERIFIED');expect(result.errors).toContain('LICENSE_REVIEW');expect(result.errors).toContain('PRODUCTION_EXPERT_VALIDATION');expect(result.ready).toBe(false);
 });
 it('text, embroidery and inadequate bleed have separate method-specific blockers',()=>{
  const textDoc=validateDesign({...base,layers:[{id:'text',type:'text',x:0,y:0,width:500,height:200,text:'TwelveSpec',fill:'#ffffff'}],method:'embroidery'});
  const result=preflightDesign(textDoc,[]);expect(result.errors).toContain('FONT_EMBEDDING');expect(result.errors).toContain('DIGITIZATION');
  const print=preflightDesign(validateDesign({...base,placement:{...base.placement,bleedMm:0}}),[]);expect(print.errors).toContain('BLEED');expect(print.errors).toContain('ASSET_MISSING');
 });
 it('public metadata projection excludes local private object paths',()=>{
  const row={id:'x',title:'Logo.png',status:'QUARANTINED',data:{objectKey:'private/original',previewObjectKey:'private/preview',mimeType:'image/png',widthPx:100,heightPx:100,contentHash:'hash',scanStatus:'NOT_CONFIGURED',rightsConfirmed:true}} as unknown as Row;
  const json=JSON.stringify(publicAsset(row));expect(json).not.toContain('objectKey');expect(json).not.toContain('private/original');expect(json).toContain('NOT_CONFIGURED');
 });
});
