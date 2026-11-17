/* NEXUS | AZEROTH v16 — Living World Engine source & safety tests
 * Real curated destination identifiers, manual records, zero game/credential claims.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const base=new URL('../',import.meta.url);
const read=name=>readFile(new URL(name,base),'utf8');
const sandbox={window:{}};
const source=await read('living-world-engine-core-v16.js');
vm.runInNewContext(source,sandbox,{filename:'living-world-engine-core-v16.js'});
const c=sandbox.window.NexusWorldEngineCoreV16;
assert.ok(c&&c.regions.length===8,'Eight curated regions must be available');
assert.ok(c.zones.length>=20,'Curated destinations must include actionable world areas');
assert.equal(c.zoneById('stormwind-city').regionId,'eastern-kingdoms');
assert.equal(c.zoneById('azj-kahet').regionId,'khaz-algar');
assert.equal(c.zoneById('nonsense'),null);
const first=c.normalizeGoal({id:'manual-123456',zoneId:'stormwind-city',title:'My mission',category:'Raid prep',
 status:'active',charId:'hero-a',buildKey:'us/123/456::today::build',itemId:19019,notes:'Testing only',cookie:'private'});
assert.ok(first&&first.zoneId==='stormwind-city');
assert.equal(first.cookie,undefined,'Unknown fields must not be persisted');
assert.equal(c.normalizeGoal({id:'manual-123456',zoneId:'invented-zone',title:'Mission'}),null);
assert.equal(c.normalizeGoal({id:'123',zoneId:'stormwind-city',title:'Mission'}),null);
assert.equal(c.normalizeGoal({id:'manual-5678',zoneId:'stormwind-city',title:''}),null);
const goals=c.cleanGoals([first,{...first,title:'Duplicate ID'},{id:'manual-aaaabb',zoneId:'azj-kahet',
 title:'Research dungeon',status:'planned',charId:'hero-b',category:'Dungeon prep'}, {id:'manual-invalid',zoneId:'unknown',title:'Invented'}]);
assert.equal(goals.length,2,'Unknown and duplicate missions should be rejected');
assert.equal(c.sortedGoals(goals,{charId:'hero-a'}).length,1);
assert.equal(c.sortedGoals(goals,{zoneId:'azj-kahet'}).length,1);
assert.equal(c.sortedGoals(goals,{status:'planned'}).length,1);
assert.equal(c.sortedGoals(goals,{query:'dungeon'}).length,1);
const state=c.summary({characters:[{id:'hero-a',name:'Arcanist',className:'Mage'}],selectedId:'hero-a',
 builds:[{name:'Draft'}],itemTargets:[{id:19019}],goals});
assert.equal(state.characters,1);assert.equal(state.openGoals,1);
const queries=c.search({query:'Stormwind',characters:[{id:'hero-a',name:'Arcanist'}],
 drafts:[{name:'Frost Build'}],goals,atlas:[]});
assert.ok(queries.some(x=>x.type==='Research zone'&&x.href==='./world-atlas.html?zone=stormwind-city'));
assert.ok(c.search({query:'frost',drafts:[{name:'Frost Build',specName:'Frost'}]}).some(x=>x.type==='Manual draft'));
assert.ok(c.search({query:'arcanist',characters:[{name:'Arcanist',className:'Mage'}]}).some(x=>x.type==='Local character'));
assert.equal(c.search({query:'a'}).length,0);
for(const file of ['living-war-room-v16.js','world-atlas-v16.js','living-world-character-v16.js'])
 new vm.Script(await read(file),{filename:file});
for(const file of ['living-world-v16.css','world-atlas-v16.css','living-world-bridge-v16.css']){
 const css=await read(file);assert.equal(css.split('{').length,css.split('}').length,file+' must have balanced CSS rules');
}
const command=await read('command-center.html'),atlas=await read('world-atlas.html'),player=await read('player-experience.html'),original=await read('index.html');
assert.match(command,/living-war-room-v16\.js\?v=1600/);
assert.match(command,/living-world-engine-core-v16\.js\?v=1600/);
assert.match(atlas,/world-atlas-v16\.js\?v=1600/);
assert.match(player,/living-world-character-v16\.js\?v=1600/);
assert.match(original,/world-atlas\.html/);
assert.ok(!source.includes('fetch('),'Curated source cannot call Blizzard or track location');
const war=await read('living-war-room-v16.js'),atlasJs=await read('world-atlas-v16.js');
assert.ok(!war.includes('fetch('),'War Room search must be entirely browser-local');
assert.ok(!atlasJs.includes('fetch('),'World Atlas mission planner must not require a new server');
assert.ok(!atlasJs.includes('localStorage.clear(')&&!war.includes('localStorage.clear('));
assert.match(atlasJs,/localStorage\.setItem\(K\.goals/,'Atlas writes its own isolated mission key');
assert.ok(!atlasJs.includes('localStorage.setItem(K.profiles')&&!atlasJs.includes('localStorage.setItem(K.drafts'));
const backup=await read('save-protection.html');
assert.match(backup,/nexus_world_atlas_goals_v16/,'Save Protection must include mission log');
console.log('PASS v16 curated region intelligence, bounded missions, local search, studio links, JS/CSS parsing and backup integration.');
