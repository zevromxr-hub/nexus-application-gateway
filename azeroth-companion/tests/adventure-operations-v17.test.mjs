/* NEXUS | AZEROTH v17 — Sovereign Adventure Operations source checks.
 * Source helpers are deterministic, bounded and must not access auth or networks.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../',import.meta.url),read=p=>readFile(new URL(p,root),'utf8');
const box={window:{}};
for(const name of ['living-world-engine-core-v16.js','adventure-intelligence-core-v16.5.js','adventure-operations-v17-core.js']){
 const source=await read(name);new vm.Script(source,{filename:name}).runInNewContext(box);
 assert.ok(!source.includes('fetch(')&&!source.includes('localStorage.')&&!source.includes('/api/me/'));
}
const w=box.window.NexusWorldEngineCoreV16,c=box.window.NexusAdventureOperationsV17,
e=box.window.NexusAdventureIntelligenceV165;
assert.ok(w&&c&&e);
const a={id:'manual-v17-goal-001',title:'Review Hallowfall',zoneId:'hallowfall',category:'Build prep',
 status:'active',charId:'nx17-local-hero',buildKey:'us/123/456::2026-11-17::My Mage Draft',itemId:19019};
const b={...a,id:'manual-v17-goal-002',title:'Investigate Stormwind',zoneId:'stormwind-city',status:'planned'};
const first=c.normalizeState({format:c.FORMAT,title:'  Adventure Night ',date:'2026-11-17',notes:'  Personal notes  ',characterId:'nx17-local-hero',
 entries:[{id:a.id,minutes:60,note:'Research first'}, {id:a.id,minutes:9999,note:'duplicate'}, {id:b.id,minutes:30,note:'Check destination'}, {id:'DROP',minutes:5}],cookie:'SENSITIVE'});
assert.equal(first.title,'Adventure Night');assert.equal(first.date,'2026-11-17');
assert.equal(first.entries.length,2);assert.equal(first.entries[0].minutes,60);
assert.equal(first.cookie,undefined);
assert.equal(c.normalizeState({date:'2026-02-30',entries:[{id:a.id,minutes:-30,note:'x'.repeat(600)}]}).date,'');
assert.equal(c.normalizeState({entries:[{id:a.id,minutes:1000}]}).entries[0].minutes,0);
assert.equal(c.normalizeState({entries:[{id:a.id,note:'x'.repeat(600)}]}).entries[0].note.length,400);
const clean=c.empty();assert.equal(clean.entries.length,0);
assert.equal(c.add(clean,'bad').entries.length,0);
const withA=c.add(clean,a.id);assert.equal(withA.entries.length,1);
const withBoth=c.add(withA,b.id);assert.equal(withBoth.entries.length,2);
assert.equal(c.add(withBoth,a.id).entries.length,2);
assert.equal(c.move(withBoth,b.id,-1).entries[0].id,b.id);
assert.equal(c.move(withBoth,a.id,-1).entries[0].id,a.id);
assert.equal(c.update(withBoth,a.id,{minutes:90,note:'manually verified later',access_token:'never'}).entries[0].minutes,90);
assert.equal(c.remove(withBoth,a.id).entries.length,1);
const many=c.normalizeState({entries:Array.from({length:100},(_,i)=>({id:'manual-v17-'+String(i).padStart(3,'0'),minutes:15}))});
assert.equal(many.entries.length,18);
const goalList=w.cleanGoals([a,b]),plan=e.ensureRecord({},goalList[0]);
const planSaved={...plan,steps:plan.steps.map((s,i)=>({...s,done:i<2}))};
const source={records:{[a.id]:planSaved}};
const characters=[{id:'nx17-local-hero',name:'Test Mage'}],drafts=[{name:'My Mage Draft',identity:'us/123/456',savedAt:'2026-11-17'}],
 items=[{id:19019,name:'Manual Staff'}];
const view=c.overview(withBoth,goalList,source.records,{characters,drafts,items});
assert.equal(view.planned,2);
assert.equal(view.checked,2);
assert.ok(view.total>=4);
assert.equal(view.budget,0);
assert.equal(view.connections,6);
const brief=c.brief(first,goalList,source.records,{characters,drafts,items});
assert.equal(brief.format,'nexus.adventure-session-brief/1');
assert.equal(brief.session.plannedMinutes,90);
assert.equal(brief.objectives[0].destination,'Hallowfall');
assert.equal(brief.objectives[0].links.draft,'My Mage Draft');
assert.equal('cookie'in brief,false);
const text=c.briefingText(brief);
assert.match(text,/MANUAL SESSION/);
assert.match(text,/personal estimate/);
assert.match(text,/not travel times/i);
const missing=c.overview(first,[],source.records,{characters,drafts,items});
assert.equal(missing.missing,2);
assert.equal(missing.rows[0].missing,true);
const absentBrief=c.brief(first,[],source.records);
assert.equal(absentBrief.objectives[0].title,'Original Atlas mission unavailable');
const html=await read('adventure-operations.html'),css=await read('adventure-operations-v17.css'),
 ui=await read('adventure-operations-v17.js'),backup=await read('save-protection.html'),
 expedition=await read('expedition-console.html'),command=await read('command-center.html');
new vm.Script(ui);
assert.equal(css.split('{').length,css.split('}').length,'v17 CSS should be balanced');
assert.match(css,/prefers-reduced-motion/);
for(const id of ['nx17Root','nx17Library','nx17Agenda','nx17SessionForm','nx17ImportFile','nx17Export','nx17Copy','nx17Clear'])
 assert.ok(html.includes('id="'+id+'"'),'Missing v17 UI control '+id);
for(const page of [expedition,command])assert.match(page,/adventure-operations\.html/);
assert.match(backup,/nexus_adventure_operations_v17/);
assert.match(ui,/localStorage\.setItem\(ops\.KEY/);
assert.ok(!ui.includes('localStorage.setItem(K.goals')&&!ui.includes('localStorage.setItem(K.plans')&&!ui.includes('localStorage.setItem(K.profiles'));
assert.ok(!ui.includes('fetch(')&&!ui.includes('localStorage.clear('));
console.log('PASS v17 bounded session state, ordering, local source provenance, missing goal warnings, export privacy, responsive UI and read-only legacy saves.');