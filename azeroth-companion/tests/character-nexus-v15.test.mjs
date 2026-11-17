/* NEXUS | AZEROTH v15 — Sovereign Character Nexus regression tests.
 * Source-shaped, privacy-safe and requires no browser credentials or live API.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const folder=new URL('../',import.meta.url);
const file=async name=>readFile(new URL(name,folder),'utf8');
const sandbox={window:{}};vm.runInNewContext(await file('character-nexus-core-v15.js'),sandbox);
const core=sandbox.window.NexusCharacterNexusCore;
assert.ok(core&&typeof core.sanitizePackage==='function');
assert.deepEqual({...core.normalizeSelector({region:'US',realm:'Area-52',name:'Hero'})},{region:'us',realm:'area-52',name:'hero'});
assert.equal(core.normalizeSelector({region:'us',realm:'INVALID REALM!',name:'Hero'}),null);
assert.equal(core.normalizeSelector({region:'xx',realm:'area-52',name:'hero'}),null);
const selector={region:'us',realm:'area-52',name:'hero'};
const profile=core.summarizeProfile({name:'Hero',level:80,character_class:{name:'Mage'},active_spec:{name:'Frost'},average_item_level:630},selector);
assert.equal(profile.className,'Mage');assert.equal(profile.specialization,'Frost');assert.equal(profile.averageItemLevel,630);
const equipped=core.unpackEquipment({equipped_items:[
 {slot:{type:'HEAD',name:'Head'},item:{id:19019},name:'Helm A',level:{value:620}},
 {slot:{type:'CHEST',name:'Chest'},item:{id:19020},name:'Armor B',level:{value:625}}
]});
assert.equal(equipped.length,2);assert.equal(equipped[0].id,19019);assert.equal(equipped[0].slotKey,'HEAD');
const atlas=core.gearMatches(equipped,[{id:19019,region:'us',name:'Helm A',status:'wishlist'},{id:19021,region:'us',name:'Target B',status:'farming'},{id:19019,region:'eu',name:'Wrong region',status:'owned'}],'us');
assert.equal(atlas.length,2);assert.equal(atlas[0].reportedEquipped,true);assert.equal(atlas[1].reportedEquipped,false);
const exampleDraft={name:'Frost Manual Plan',identity:'us/123/456',region:'us',specName:'Frost',rankByNode:{'100':1,'101':2},choiceByNode:{'101':1},savedAt:'2026-11-17T04:00:00.000Z',planner:{notes:'Private local'}};
const key=core.draftKey(exampleDraft);
assert.equal(core.linkedDrafts([exampleDraft],{[key]:'char-1'},'char-1').length,1);
assert.equal(core.linkedDrafts([exampleDraft],{[key]:'char-2'},'char-1').length,0);
const goals=core.goalsFor([{title:'Quest',charId:'char-1',done:false}],[], 'char-1');
assert.equal(goals.open,1);
const packageData=core.packageFrom({
 character:{name:'Hero',className:'Mage',spec:'Frost',realm:'Area-52'},
 drafts:[exampleDraft],notes:[{identity:'us/123/456',name:'Frost Manual Plan',notes:'Shareable note',favorite:true}],
 goals:[{title:'Run a dungeon',kind:'Mythic+',done:false}],
 targets:[{id:19021,name:'Target B',status:'farming'}]});
assert.equal(packageData.format,'nexus.character-nexus-package/1');
assert.equal(packageData.drafts[0].format,'nexus-azeroth-talent-draft-v1');
assert.equal(packageData.drafts[0].rankByNode['101'],2);
assert.equal('planner' in packageData.drafts[0],false,'Unbounded private planner fields should not leak');
assert.equal('access_token' in packageData,false);
const incoming=core.sanitizePackage(JSON.parse(JSON.stringify(packageData)));
assert.equal(incoming.ok,true);assert.equal(incoming.package.drafts.length,1);
assert.equal(core.sanitizePackage({...packageData,drafts:[{name:'bad',identity:'wrong',rankByNode:{}}]}).ok,false);
assert.equal(core.sanitizePackage({...packageData,format:'evil'}).ok,false);
assert.equal(core.validateDraft({...exampleDraft,rankByNode:{'invalid':2,'102':4}}).rankByNode['102'],4);
for(const name of ['character-nexus-v15.js','character-nexus-forge-handoff-v15.js'])new vm.Script(await file(name),{filename:name});
const ui=await file('character-nexus-v15.js');
const html=(await file('player-experience.html')),index=await file('index.html');
assert.ok(html.includes('character-nexus-core-v15.js')&&html.includes('character-nexus-v15.js'));
assert.ok(index.includes('character-nexus-forge-handoff-v15.js'));
assert.ok(index.includes('character-nexus-v15.css'));
assert.ok(ui.includes("credentials:'omit'")&&ui.includes("'/api/character'")&&ui.includes("'/api/equipment'"),'Existing public Blizzard routes must be used safely');
assert.ok(!ui.includes('localStorage.clear('));
assert.ok(!ui.includes("localStorage.setItem(KEY.drafts")&&!ui.includes("localStorage.setItem(KEY.profiles"));
const backup=await file('save-protection.html');
for(const key of ['nexus_build_architect_library_v14','nexus_character_research_links_v15','nexus_character_nexus_imports_v15'])
 assert.ok(backup.includes(key),'Backups must explicitly whitelist '+key);
console.log('PASS v15 public source parsing, source-vs-manual gear matching, character links, portable package validation, guest import isolation, wiring and backup whitelist.');
