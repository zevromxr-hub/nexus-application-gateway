/* NEXUS | AZEROTH v16.5 — Adventure Intelligence source/regression checks.
 * No browser credentials, Blizzard network, or game-ownership claims.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),read=n=>readFile(new URL(n,root),'utf8');
const sandbox={window:{}};
vm.runInNewContext(await read('living-world-engine-core-v16.js'),sandbox);
vm.runInNewContext(await read('adventure-intelligence-core-v16.5.js'),sandbox);
const w=sandbox.window.NexusWorldEngineCoreV16,e=sandbox.window.NexusAdventureIntelligenceV165;
assert.ok(w&&e);
assert.equal(Object.keys(e.templates).length,7);
assert.ok(e.templates['Raid prep'].length>=4);
const id='manual-expedition-001',goal={
 id,zoneId:'hallowfall',title:'Prepare for exploration',category:'Explore',
 status:'active',charId:'manual-character',buildKey:'us/123/456::2026-11-17::My Draft',
 itemId:19019,notes:'For testing',createdAt:'2026-11-17T00:00:00Z'};
const plan=e.ensureRecord({},goal);
assert.equal(plan.priority,'normal');assert.ok(plan.steps.length>=4&&plan.steps.length<=20);
assert.ok(plan.steps.every(s=>s.done===false));
const altered={...plan,priority:'high',pinned:true,notes:'Test note',
 steps:plan.steps.map((s,i)=>({...s,done:i<2})),cookie:'secret do not include'};
const state=e.normalizeState({records:{[id]:altered,INVALID_ID:{notes:'not valid'}},
 bookmarks:['hallowfall','hallowfall','stormwind-city','invented-zone'],untrustedToken:'never'});
assert.deepEqual([...state.bookmarks],['hallowfall','stormwind-city']);
assert.equal(Object.keys(state.records).length,1);
assert.equal(state.untrustedToken,undefined);assert.equal(state.records[id].cookie,undefined);
assert.equal(state.records[id].priority,'high');
const details={characters:[{id:'manual-character',name:'Arcanist'}],
 drafts:[{name:'My Draft',identity:'us/123/456',savedAt:'2026-11-17'}],
 items:[{id:19019,name:'Test Manual Item'}]};
const inspection=e.inspect(goal,state.records[id],details);
assert.equal(inspection.total,plan.steps.length);
assert.equal(inspection.done,2);
assert.equal(inspection.percent,Math.round(2*100/plan.steps.length));
assert.equal(inspection.linked.character,true);
assert.equal(inspection.linked.draft,true);
assert.equal(inspection.linked.item,true);
assert.ok(inspection.disclaimer.includes('Planning checklist'));
const missing=e.inspect(goal,state.records[id],{});
assert.equal(missing.notices.length,3);
assert.equal(missing.linked.character,false);
const sorted=e.rankGoals([
 {...goal,id:'manual-low',status:'planned'},
 {...goal,id, status:'active'},
 {...goal,id:'manual-finished',status:'completed'}
],state);
assert.equal(sorted[0].goal.id,id,'Pinned priority mission must take precedence');
assert.equal(sorted.at(-1).goal.id,'manual-finished');
const exported=e.brief(goal,state.records[id],details);
assert.equal(exported.format,'nexus.expedition-brief/1');
assert.equal(exported.planning.completed,2);
assert.equal(exported.links.draft,'My Draft');
assert.equal('cookie' in exported,false,'Export must whitelist manually entered fields');
const plaintext=e.checklistText(goal,state.records[id],details);
assert.match(plaintext,/PERSONAL MANUAL PLAN/);
assert.match(plaintext,/\[x\]/);
assert.match(plaintext,/does not measure actual gear readiness/);
assert.equal(e.normalizeStep({id:'bad',title:'nope'}),null);
assert.equal(e.normalizeRecord({steps:[{id:'step-0001',title:'Valid',done:true}]},'bad'),null);
for(const js of ['adventure-intelligence-core-v16.5.js','expedition-console-v16.5.js',
 'world-atlas-overdrive-v16.5.js','living-war-room-overdrive-v16.5.js'])
 new vm.Script(await read(js),{filename:js});
for(const name of ['expedition-console-v16.5.css','world-atlas-overdrive-v16.5.css','living-war-room-overdrive-v16.5.css']){
 const css=await read(name);
 assert.equal(css.split('{').length,css.split('}').length,name+' unbalanced');
 assert.match(css,/prefers-reduced-motion/,'Motion reduction is necessary in '+name);
}
const expedition=await read('expedition-console.html'),command=await read('command-center.html'),atlas=await read('world-atlas.html'),
 character=await read('player-experience.html'),index=await read('index.html'),backup=await read('save-protection.html');
assert.match(expedition,/expedition-console-v16\.5\.js/);
assert.match(expedition,/adventure-intelligence-core-v16\.5\.js/);
assert.match(atlas,/world-atlas-overdrive-v16\.5\.js/);
assert.match(command,/living-war-room-overdrive-v16\.5\.js/);
assert.match(character,/expedition-console\.html/);
assert.match(index,/EXPEDITION INTELLIGENCE/);
assert.match(backup,/nexus_adventure_intelligence_v165/);
const ui=await read('expedition-console-v16.5.js');
assert.ok(!ui.includes('fetch(')&&!ui.includes('localStorage.clear('));
assert.match(ui,/localStorage\.setItem\(K\.plans/);
assert.ok(!ui.includes('localStorage.setItem(K.goals')&&!ui.includes('localStorage.setItem(K.profiles'));
const wayfinder=await read('world-atlas-overdrive-v16.5.js');
assert.match(wayfinder,/localStorage\.setItem\(KEY/);
assert.ok(!wayfinder.includes('localStorage.setItem(GOALS'));
assert.ok(!wayfinder.includes('fetch('));
const war=await read('living-war-room-overdrive-v16.5.js');
assert.ok(!war.includes('localStorage.setItem(')&&!war.includes('fetch('));
console.log('PASS v16.5 expedition templates, bounded local state, manual readiness, source links, export whitelisting, atlas/War Room integration, CSS/JS syntax and Save Protection.');
