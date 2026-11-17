/* NEXUS Azeroth v18.1 — strict source/safety checks for route itinerary core */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const read=f=>readFile(new URL('../'+f,import.meta.url),'utf8');
const vmContext={window:{},crypto:{randomUUID:()=>'12345678-1234-4234-a234-abcdef012345'}};
for(const file of ['living-world-engine-core-v16.js','world-atlas-cartography-v18-core.js','world-atlas-routes-v18.1-core.js']){
 const source=await read(file);new vm.Script(source,{filename:file}).runInNewContext(vmContext);
 assert.ok(!source.includes('localStorage.')&&!source.includes('fetch('),'Pure route/data helpers must not mutate account or network');
}
const c=vmContext.window.NexusAtlasRoutesV181,w=vmContext.window.NexusWorldEngineCoreV16;
assert.ok(c&&w&&c.KEY==='nexus_atlas_routes_v181');
assert.equal(c.normalize({}).routes.length,0);
let state=c.addRoute(c.blank(),'Research Capitals');
assert.equal(state.routes.length,1);assert.equal(state.routes[0].title,'Research Capitals');
const id=state.selected;
state=c.push(state,id,'stormwind-city');
state=c.push(state,id,'orgrimmar');
state=c.push(state,id,'valdrakken');
assert.equal(state.routes[0].stops.length,3);
assert.equal(c.push(state,id,'stormwind-city').routes[0].stops.length,3,'Duplicate zone not allowed');
assert.equal(c.push(state,id,'fake-zone').routes[0].stops.length,3,'Unknown game zone rejected');
assert.equal(c.summary(state.routes[0],[]).regions,3);
assert.equal(c.summary(state.routes[0],[]).transitions,2);
state=c.modifyStop(state,id,'orgrimmar',{note:'Manual city research',done:true,inject:'not allowed'});
assert.equal(state.routes[0].stops[1].done,true);
assert.equal(state.routes[0].stops[1].note,'Manual city research');
assert.equal(state.routes[0].stops[1].inject,undefined);
state=c.move(state,id,'valdrakken',-1);
assert.deepEqual(Array.from(state.routes[0].stops,x=>x.zoneId),['stormwind-city','valdrakken','orgrimmar']);
state=c.groupByRegion(state,id);
assert.deepEqual(Array.from(state.routes[0].stops,x=>x.zoneId),['orgrimmar','stormwind-city','valdrakken']);
const linked=c.summary(state.routes[0],[{zoneId:'stormwind-city'},{zoneId:'orgrimmar'}]);
assert.equal(linked.linked,2);
const backup=c.exportPayload(state);
assert.equal(backup.format,'nexus.atlas-routes-backup/1');
assert.ok(!('auth'in backup.data));
assert.match(backup.source,/not verified gameplay/);
const corrupted=c.normalize({routes:[{id:'route-valid-100',title:'Unsafe',password:'secret',
 stops:[{zoneId:'stormwind-city',note:'Hello',done:true,bad:'secret'},{zoneId:'stormwind-city'}, {zoneId:'invented',note:'bad'}]}]});
assert.equal(corrupted.routes.length,1);assert.equal(corrupted.routes[0].stops.length,1);
assert.equal(corrupted.routes[0].stops[0].bad,undefined);
assert.equal(corrupted.routes[0].password,undefined);
const many=Array.from({length:20},(_,i)=>({id:'route-safe-'+(i+100),title:'Route '+i,
 stops:w.zones.slice(0,25).map(x=>({zoneId:x.id,note:'x'.repeat(450),done:true}))}));
const bounded=c.normalize({selected:'route-safe-103',routes:many});
assert.equal(bounded.routes.length,6);
assert.equal(bounded.routes[0].stops.length,12);
assert.equal(bounded.routes[0].stops[0].note.length,200);
assert.equal(bounded.selected,'route-safe-103');
const app=await read('world-atlas-routes-v18.1.js'),style=await read('world-atlas-routes-v18.1.css'),
 html=await read('world-atlas.html'),saved=await read('save-protection.html');
new vm.Script(app,{filename:'world-atlas-routes-v18.1.js'});
assert.equal(style.split('{').length,style.split('}').length,'v18.1 CSS braces');
assert.match(style,/prefers-reduced-motion/);assert.match(style,/max-width:730px/);
assert.ok(!app.includes('fetch(')&&!app.includes('localStorage.clear('));
assert.ok(!app.includes('localStorage.setItem(GOALS')&&!app.includes('localStorage.setItem(OPERATIONS'));
assert.match(app,/localStorage\.setItem\(core\.KEY/);
assert.match(app,/routeOverlay/);assert.match(app,/confirm\(/);assert.match(app,/URL\.revokeObjectURL/);
assert.match(html,/world-atlas-routes-v18\.1-core\.js\?v=1810/);
assert.match(html,/world-atlas-routes-v18\.1\.js\?v=1810/);
assert.match(html,/world-atlas-routes-v18\.1\.css\?v=1810/);
assert.match(saved,/nexus_atlas_routes_v181/);
assert.match(saved,/nexus_adventure_operations_v17/);
assert.match(saved,/nexus_world_atlas_goals_v16/);
console.log('PASS v18.1: six bounded routes, max twelve stops, no duplicate/map spoofing, manual grouping/order, export, safe local isolation and browser integration.');
