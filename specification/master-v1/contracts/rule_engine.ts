export type Rule = {op:'and'|'or';items:Rule[]} | {op:'not';item:Rule} | {op:'eq'|'ne'|'gte'|'lte'|'in';field:string;value:string|number|boolean|string[]};
export function evaluateRule(rule:Rule, inputs:Record<string,unknown>, allowedFields:Set<string>, depth=0):boolean {
 if(depth>16) throw new Error('RULE_DEPTH_EXCEEDED');
 if(rule.op==='and'||rule.op==='or') {if(rule.items.length>100) throw new Error('RULE_TOO_LARGE'); return rule.op==='and'?rule.items.every(x=>evaluateRule(x,inputs,allowedFields,depth+1)):rule.items.some(x=>evaluateRule(x,inputs,allowedFields,depth+1));}
 if(rule.op==='not') return !evaluateRule(rule.item,inputs,allowedFields,depth+1);
 if(!allowedFields.has(rule.field)) throw new Error('RULE_FIELD_NOT_ALLOWED');
 const actual=inputs[rule.field];const expected=rule.value;
 switch(rule.op) {case 'eq':return actual===expected;case 'ne':return actual!==expected;case 'gte':return typeof actual==='number' && typeof expected==='number' && actual>=expected;case 'lte':return typeof actual==='number' && typeof expected==='number' && actual<=expected;case 'in':return Array.isArray(expected) && expected.includes(String(actual));}
}
