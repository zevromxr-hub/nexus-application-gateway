/* NEXUS Azeroth Companion v14 — real source-shaped local unit tests.
 * No Blizzard requests, no credentials, no fake game-validity claims.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const base=new URL('../',import.meta.url);
const code=await readFile(new URL('talent-build-architect-core-v14.js',base),'utf8');
const sandbox={window:{}};
vm.runInNewContext(code,sandbox,{filename:'talent-build-architect-core-v14.js'});
const core=sandbox.window.NexusBuildArchitectCore;
assert.ok(core&&typeof core.trace==='function');
const sample={
 ready:true,identity:'us/10/64',active:'class',
 catalog:[{id:100,name:'Alpha',category:'class',max:2},
  {id:200,name:'Beta',category:'class',max:1},
  {id:300,name:'Gamma',category:'spec',max:1}],
 linkEdges:[{from:100,to:200,resolved:true},{from:200,to:300,resolved:true},
  {from:999,to:300,resolved:false}],
 allocations:{'100':1,'200':0,'300':0},choiceByNode:{'200':0}
};
const graph=core.trace(sample,300,3);
assert.deepEqual(Array.from(graph.inbound,x=>x.id),[200,100]);
assert.equal(graph.unresolved,1);
assert.equal(core.trace(sample,9999,3).inbound.length,0);
const a={identity:sample.identity,rankByNode:{'100':1,'200':0,'300':0},choiceByNode:{'200':0}};
const b={identity:sample.identity,rankByNode:{'100':2,'200':1,'300':0},choiceByNode:{'200':1}};
const result=core.compare(a,b,sample.catalog);
assert.equal(result.compatible,true);
assert.equal(result.totals.changedNodes,2);
assert.equal(result.totals.added,2);
assert.equal(result.totals.choiceChanges,1);
assert.equal(core.compare({...a,identity:'other'},b,sample.catalog).compatible,false);
const issues=core.integrity(sample,{identity:sample.identity,rankByNode:{'100':5,'400':1}});
assert.ok(issues.some(x=>x.code==='RANK_ABOVE_SOURCE'));
assert.ok(issues.some(x=>x.code==='UNKNOWN_NODE'));
assert.equal(core.integrity(null,a)[0].code,'SOURCE_UNAVAILABLE');
const ui=await readFile(new URL('talent-build-architect-v14.js',base),'utf8');
new vm.Script(ui,{filename:'talent-build-architect-v14.js'});
assert.ok(ui.includes('nexus_build_architect_library_v14'));
assert.ok(!ui.includes("localStorage.setItem('nexus_azeroth_talent_forge_v1'"));
assert.ok(!ui.includes('fetch('));
const html=await readFile(new URL('index.html',base),'utf8');
for(const asset of ['talent-build-architect-core-v14.js','talent-build-architect-v14.js','talent-build-architect-v14.css'])
 assert.ok(html.includes(asset),'v14 asset missing from live companion: '+asset);
const source=await readFile(new URL('talent-forge.js',base),'utf8');
assert.ok(source.includes('NexusTalentSourceBridge'),'Original source bridge must remain unchanged');
console.log('PASS v14 Forge source-path graph, A/B rank and choice differences, source integrity, readonly original builds, and asset linkage.');
