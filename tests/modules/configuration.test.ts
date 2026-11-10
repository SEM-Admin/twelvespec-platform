import { describe,it,expect } from 'vitest';
import { validateRule,evaluateRule,analyzeRule,validateConfiguration,type Rule } from '../../packages/configuration/src/index';

describe('A12/A13 typed configuration rules',()=>{
 it('evaluates allowed deterministic logical, membership and numerical inputs',()=>{
  const rule:Rule={op:'and',items:[{op:'gte',field:'quantity',value:24},{op:'in',field:'method',value:['screen_print','embroidery']},{op:'not',item:{op:'eq',field:'material',value:'glass'}}]};
  expect(evaluateRule(rule,{quantity:24,method:'screen_print',material:'cotton'})).toBe(true);
  expect(evaluateRule(rule,{quantity:23,method:'screen_print',material:'cotton'})).toBe(false);
 });
 it('does not coerce quantity strings or evaluate executable source',()=>{
  expect(evaluateRule({op:'gte',field:'quantity',value:24},{quantity:'24'})).toBe(false);
  expect(()=>validateRule({op:'eval',source:'process.exit()'})).toThrow();
  expect(()=>validateRule({op:'eq',field:'constructor',value:'x'})).toThrow();
 });
 it('rejects cycles, excessive nesting, oversized trees and nonfinite numbers',()=>{
  const cyclic:Record<string,unknown>={op:'not'};cyclic.item=cyclic;
  expect(()=>validateRule(cyclic)).toThrow('RULE_CYCLE');
  let nested:unknown={op:'eq',field:'method',value:'screen_print'};
  for(let i=0;i<18;i++)nested={op:'not',item:nested};
  expect(()=>validateRule(nested)).toThrow('RULE_LIMIT_EXCEEDED');
  expect(()=>validateRule({op:'or',items:Array(101).fill({op:'eq',field:'method',value:'x'})})).toThrow();
  expect(()=>validateRule({op:'gte',field:'quantity',value:Infinity})).toThrow();
 });
 it('detects contradictory equality, range and empty membership before publication',()=>{
  expect(analyzeRule({op:'and',items:[{op:'eq',field:'method',value:'screen_print'},{op:'eq',field:'method',value:'embroidery'}]}).valid).toBe(false);
  expect(analyzeRule({op:'and',items:[{op:'gte',field:'quantity',value:30},{op:'lte',field:'quantity',value:10}]}).issues).toContain('CONTRADICTORY_RANGE:quantity');
  expect(analyzeRule({op:'and',items:[{op:'in',field:'method',value:['print']},{op:'in',field:'method',value:['embroidery']}]}).valid).toBe(false);
 });
 it('does not report alternatives as contradictory conjunctions',()=>{
  const r={op:'or',items:[{op:'eq',field:'method',value:'screen_print'},{op:'eq',field:'method',value:'embroidery'}]};
  expect(analyzeRule(r).valid).toBe(true);expect(evaluateRule(r,{method:'embroidery'})).toBe(true);
 });
 const product={moq:24,methods:['screen_print','embroidery'],locations:['front','back'],compatibility:{embroidery:['front']}};
 const variant={color:'Navy',size:'M',available:true};
 it('validates exact available variant, MOQ, integer quantity and dependent method/location',()=>{
  expect(validateConfiguration(product,variant,{quantity:24,method:'screen_print',location:'back'}).valid).toBe(true);
  expect(validateConfiguration(product,variant,{quantity:23,method:'screen_print',location:'front'}).errors).toContain('MOQ_NOT_MET');
  expect(validateConfiguration(product,variant,{quantity:24.5,method:'screen_print',location:'front'}).errors).toContain('QUANTITY_MUST_BE_INTEGER');
  expect(validateConfiguration(product,variant,{quantity:24,method:'embroidery',location:'back'}).errors).toContain('INCOMPATIBLE_METHOD_LOCATION');
  expect(validateConfiguration(product,variant,{quantity:24,method:'laser',location:'front'}).errors).toContain('INCOMPATIBLE_METHOD');
  expect(validateConfiguration(product,variant,{quantity:24,method:'screen_print',location:'front',color:'Red'}).errors).toContain('VARIANT_COLOR_MISMATCH');
 });
 it('missing supported method evidence cannot become safe checkout',()=>{
  const result=validateConfiguration({moq:1},{},{quantity:1,method:'print',location:'front'});
  expect(result.valid).toBe(false);expect(result.readiness).toBe('REQUEST_QUOTE_ONLY');
 });
 it('pins deterministic configuration hash and applies template rule on server',()=>{
  const input={quantity:24,method:'screen_print',location:'front'};
  const template={version:2,rule:{op:'gte',field:'quantity',value:48}};
  expect(validateConfiguration(product,variant,input,template).errors).toContain('RULE_CONSTRAINT_FAILED');
  const r=validateConfiguration(product,variant,input);expect(r.configurationHash).toHaveLength(64);
  expect(validateConfiguration(product,variant,input).configurationHash).toBe(r.configurationHash);
  expect(validateConfiguration(product,variant,{...input,quantity:48}).configurationHash).not.toBe(r.configurationHash);
 });
});
