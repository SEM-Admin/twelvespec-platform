/** Validate planning coverage without treating file presence as implementation acceptance. */
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync,statSync} from 'node:fs';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>JSON.parse(readFileSync(resolve(root,path),'utf8'));
const plan=read('docs/planning/gap-backlog.json');
const trace=read('docs/planning/requirements-to-work.json');
const sources=read('docs/planning/research-sources.json');
const registry=read('specification/master-v1/contracts/module_registry.json');
const inventory=read('docs/module-inventory.json');
const failContext=(values,label)=>{const set=new Set(values);assert.equal(set.size,values.length,'Duplicate '+label);return set;};
const workIds=failContext(plan.workItems.map(i=>i.id),'work item');
const sourceIds=failContext(sources.map(i=>i.id),'research source');
const gateIds=failContext(plan.activationGates.map(i=>i.id),'activation gate');
const moduleIds=failContext(registry.map(i=>i.code),'registered module');
const moduleEqual=values=>assert.deepEqual(new Set(values),moduleIds,'Module coverage differs from controlling registry');
const currentPath=(path,label)=>{assert.equal(typeof path,'string',label);const full=resolve(root,path);assert.ok(full.startsWith(root+'/'),label+' escapes repository');assert.ok(existsSync(full),label+': missing '+path);};
moduleEqual(plan.modules.map(i=>i.code));
const runtimeRegistry=read('packages/contracts/src/modules.json');
moduleEqual(runtimeRegistry.map(i=>i.code));
assert.equal(runtimeRegistry.find(i=>i.code==='future')?.status,'COMING_SOON','Runtime future registry must remain disabled');
assert.equal(plan.modules.filter(m=>m.availability==='ACTIVE_V1_SPEC').length,19);
assert.equal(plan.modules.filter(m=>m.availability==='COMING_SOON').length,1);
assert.equal(plan.workItems.length,40);
assert.equal(plan.workItems[0].status,'COMPLETE_PLANNING_ONLY');
for(const item of plan.workItems){
 assert.ok(item.implementation.length&&item.completionChecks.length,item.id+' needs implementation and exit criteria');
 for(const id of item.modules)assert.ok(moduleIds.has(id),item.id+' unknown module '+id);
 for(const id of item.dependsOn)assert.ok(workIds.has(id),item.id+' unknown dependency '+id);
 for(const id of item.research)assert.ok(sourceIds.has(id),item.id+' unknown research source '+id);
 for(const id of item.activationGates)assert.ok(gateIds.has(id),item.id+' unknown activation gate '+id);
 for(const path of item.code)currentPath(path,item.id+' code');
 for(const path of item.plannedTests)assert.match(path,/^tests\/.+\.(test\.ts|spec\.ts)$/,item.id+' verification target must be explicitly a planned test');
}
const byId=new Map(plan.workItems.map(i=>[i.id,i]));
const visited=new Set(),active=new Set();
function visit(id){assert.ok(!active.has(id),'Cyclic dependency at '+id);if(visited.has(id))return;active.add(id);for(const other of byId.get(id).dependsOn)visit(other);active.delete(id);visited.add(id);}
for(const id of workIds)visit(id);
const expectedRequirements=[];
for(const module of registry){
 const path='specification/master-v1/modules/'+module.code+'.md';
 const contract=readFileSync(resolve(root,path),'utf8');
 expectedRequirements.push(module.code+'.module');
 for(const match of contract.matchAll(/^- \*\*([^*]+):\*\*/gm))expectedRequirements.push(module.code+'.screen.'+match[1]);
 const commands=contract.split('## Commands\n')[1].split('\n## ')[0];
 for(const match of commands.matchAll(/^- `([^`]+)`/gm))expectedRequirements.push(module.code+'.command.'+match[1]);
}
assert.deepEqual(failContext(trace.requirements.map(r=>r.id),'requirement'),new Set(expectedRequirements));
assert.equal(trace.requirements.length,205);
for(const requirement of trace.requirements){
 assert.ok(moduleIds.has(requirement.module),requirement.id+' unknown module');
 assert.ok(requirement.workItems.length,requirement.id+' is unassigned');
 for(const id of requirement.workItems)assert.ok(workIds.has(id),requirement.id+' unknown work item');
 currentPath(requirement.source,requirement.id+' contract');
 for(const path of requirement.currentCode)currentPath(path,requirement.id+' code');
 for(const path of requirement.currentTests)currentPath(path,requirement.id+' test');
 if(requirement.module==='future')assert.ok(['REQUIRED_DENIAL_FOR_FUTURE','COMING_SOON_ONLY'].includes(requirement.assessment),requirement.id+' cannot be activated');
 else assert.equal(requirement.assessment,'PARTIAL_SOURCE_REVIEW_NOT_ACCEPTED');
}
for(const entry of inventory){
 if(entry.screens){currentPath(entry.service,entry.code+' service');currentPath(entry.ui,entry.code+' UI');}
 else currentPath(entry.code,entry.id+' implementation reference');
 currentPath(entry.test,(entry.id??entry.code)+' test reference');
}
const files=[];
function walk(path){for(const name of readdirSync(path)){const full=resolve(path,name);if(statSync(full).isDirectory())walk(full);else if(name.endsWith('.md'))files.push(full);}}
walk(resolve(root,'specification/master-v1'));
const expectedScenarios=[];
for(const file of files)for(const match of readFileSync(file,'utf8').matchAll(/^\|\s*([ATE]\d{2})\s*\|\s*([^|]+)\|\s*(.*?)\s*\|\s*$/gm))expectedScenarios.push(relative(root,file)+'#'+match[1]);
assert.deepEqual(failContext(trace.acceptance.map(a=>a.source+'#'+a.id),'acceptance row'),new Set(expectedScenarios));
assert.equal(trace.acceptance.length,95);
for(const [letter,count]of [['A',40],['T',30],['E',25]])assert.equal(trace.acceptance.filter(s=>s.id.startsWith(letter)).length,count);
for(const scenario of trace.acceptance){
 assert.ok(scenario.requiredAssertion&&scenario.workItems.length&&scenario.plannedVerification.length,scenario.id+' missing scope/work/verification');
 assert.equal(scenario.status,'OPEN_FULL_ASSERTION_NOT_ACCEPTED');
 for(const id of scenario.workItems)assert.ok(workIds.has(id),scenario.id+' unknown work item');
 for(const path of scenario.currentTests)currentPath(path,scenario.id+' existing test');
 currentPath(scenario.source,scenario.id+' source');
}
for(const source of sources){const url=new URL(source.url);assert.equal(url.protocol,'https:');assert.ok(!url.username&&!url.password);assert.ok(source.finding&&source.engineeringDecision&&source.reviewedOn);}
assert.equal(sources.length,30);
assert.equal(plan.scope.inventoryEntries,205);assert.equal(plan.scope.acceptanceScenarios,95);
console.log('Plan integrity: 20 modules (19 active + Coming Soon), 205 inventory entries, 95 A/T/E scenarios, 40 acyclic work packages and 30 dated primary sources.');
console.log('Existing paths resolve. Future commands remain required denials. Planned tests and source presence do not imply implementation acceptance.');
