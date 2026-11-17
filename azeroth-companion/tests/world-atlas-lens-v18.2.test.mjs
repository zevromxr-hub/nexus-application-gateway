/* NEXUS v18.2 Cartographer's Lens — read-only source, identity and art integrity */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const read=f=>readFile(new URL('../'+f,import.meta.url),'utf8');
const scope={window:{}};
for(const file of ['living-world-engine-core-v16.js','world-atlas-lens-v18.2-core.js']){
 const source=await read(file);new vm.Script(source,{filename:file}).runInNewContext(scope);
 assert.ok(!source.includes('fetch(')&&!source.includes('localStorage.'),'Pure intelligence helpers have no network/storage effects');
}
const world=scope.window.NexusWorldEngineCoreV16,core=scope.window.NexusAtlasLensV182;
assert.ok(core&&world);
assert.equal(Object.keys(core.regions).length,8);
assert.equal(Object.keys(core.notes).length,25);
for(const r of world.regions){
 assert.ok(core.region(r.id),'No region dossier: '+r.id);
 assert.equal(core.region(r.id).focus.length,3);
}
for(const z of world.zones){
 assert.equal(core.zoneNote(z.id).length,3);
}
const goal1={id:'manual-test-0001',title:'Find city equipment',zoneId:'stormwind-city',status:'active',category:'Equipment research'},
 goal2={id:'manual-test-0002',title:'Research the city',zoneId:'stormwind-city',status:'planned',category:'Explore'},
 goal3={id:'manual-test-0003',title:'Review the caverns',zoneId:'hallowfall',status:'completed',category:'Dungeon prep'};
const data=core.index([goal1,goal2,goal3],['stormwind-city'],{
 routes:[{id:'route-test-01',title:'Capital research',stops:[{zoneId:'hallowfall'}, {zoneId:'stormwind-city'}]}]
},{entries:[{id:'manual-test-0001'}]});
const s=core.spotlight(world.zoneById('stormwind-city'),data,[goal1,goal2,goal3]);
assert.equal(s.goals,2);assert.equal(s.active,1);assert.equal(s.planned,1);
assert.equal(s.routes.length,1);assert.equal(s.routes[0].position,2);
assert.equal(s.inSession,true);assert.equal(s.saved,true);assert.equal(s.next.title,goal1.title);
const ek=core.regionSummary(world.regionById('eastern-kingdoms'),world.zones,data);
assert.equal(ek.total,4);assert.equal(ek.goals,2);assert.equal(ek.bookmarks,1);
const ordered=core.sortZones(world.zones,data,'missions');
assert.equal(ordered[0].id,'stormwind-city');
assert.equal(core.performanceCounts(world.zones,data).curated,25);
assert.equal(core.performanceCounts(world.zones,data).manualMissions,3);
assert.equal(core.safeRoutes({routes:Array.from({length:12},(_,i)=>({id:'route-'+i,title:'Route '+i,stops:Array.from({length:16},()=>({zoneId:'stormwind-city'}))}))}).length,6);
assert.ok(!('token'in core.spotlight(world.zoneById('stormwind-city'),data,[])));
const source=await read('world-atlas-lens-v18.2.js'),style=await read('world-atlas-lens-v18.2.css');
new vm.Script(source,{filename:'world-atlas-lens-v18.2.js'});
assert.ok(!source.includes('localStorage.setItem('),'Cartographer Lens never writes saved records');
assert.ok(!source.includes('localStorage.clear(')&&!source.includes('fetch('),'Cartographer Lens does not call remote APIs or clear user storage');
assert.ok(!source.includes('navigator.geolocation'));
assert.match(source,/requestAnimationFrame/);
assert.match(source,/state.cacheRaw/);
assert.match(source,/MutationObserver/);
assert.match(source,/warcraft\.wiki\.gg\/wiki\/Maps/);
assert.match(source,/wowhead\.com\/maps/);
assert.equal(style.split('{').length,style.split('}').length,'balanced CSS rules');
assert.match(style,/prefers-reduced-motion/);
assert.match(style,/content-visibility:auto/);
assert.match(style,/nx182-quiet-map/);
for(const r of world.regions){
 const svg=await read('assets/nexus-region-'+r.id+'-v182.svg');
 assert.match(svg,/viewBox="0 0 1440 630"/);
 assert.ok(!/<script\b/i.test(svg)&&!/<image\b/i.test(svg),'Region art should contain no remote scripts or image imports: '+r.id);
 assert.ok(svg.length<15000,'Compact original region art budget exceeded: '+r.id);
}
const page=await read('world-atlas.html');
for(const file of ['world-atlas-lens-v18.2-core.js','world-atlas-lens-v18.2.js','world-atlas-lens-v18.2.css'])assert.ok(page.includes(file+'?v=1820'));
assert.ok(page.includes('world-atlas-routes-v18.1.js?v=1810'),'Original saved route tool must remain intact');
assert.ok(page.includes('world-atlas-cartography-v18.js?v=1800'),'Original cartography must remain available');
const backup=await read('save-protection.html');
for(const k of ['nexus_world_atlas_goals_v16','nexus_adventure_intelligence_v165','nexus_adventure_operations_v17','nexus_atlas_routes_v181'])
 assert.ok(backup.includes(k),'Save Protection must retain '+k);
console.log('PASS v18.2 original region art, eight dossiers, twenty-five source labels, indexed user goal/route summaries, RAF rendering, data isolation and mobile performance CSS.');
