/* NEXUS | AZEROTH v18 — Cartography Overdrive source and safety checks
 * Artistic pin positions never represent real in-game coordinates.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const path=new URL('../',import.meta.url),read=f=>readFile(new URL(f,path),'utf8');
const scope={window:{}};
for(const file of ['living-world-engine-core-v16.js','world-atlas-cartography-v18-core.js']){
 const source=await read(file);
 new vm.Script(source,{filename:file}).runInNewContext(scope);
 assert.ok(!source.includes('fetch('));
 assert.ok(!source.includes('localStorage.'));
}
const world=scope.window.NexusWorldEngineCoreV16,brain=scope.window.NexusAtlasCartographyV18;
assert.ok(world&&brain);
assert.equal(world.regions.length,8);
assert.equal(world.zones.length,25);
assert.equal(Object.keys(brain.positions).length,25);
for(const zone of world.zones){
 const p=brain.position(zone);assert.ok(p,'No v18 position for '+zone.id);
 assert.equal(p.region,zone.regionId);
 assert.ok(p.x>=15&&p.x<=85&&p.y>=16&&p.y<=90,'Point outside safe chart '+zone.id);
 assert.ok(['crown','compass','mountain'].includes(brain.snapshot(zone,[]).icon));
}
const goals=world.cleanGoals([
 {id:'manual-v18-0001',title:'City research',zoneId:'stormwind-city',status:'active',category:'Collection',charId:'char-00001'},
 {id:'manual-v18-0002',title:'Gather equipment',zoneId:'stormwind-city',status:'planned',category:'Equipment research',itemId:19019},
 {id:'manual-v18-0003',title:'Explore a cavern',zoneId:'hallowfall',status:'completed',category:'Explore'},
 {id:'manual-v18-0004',title:'Prepare Stormwind',zoneId:'stormwind-city',status:'completed',category:'Explore'}
]);
const stormwind=world.zoneById('stormwind-city'),hallowfall=world.zoneById('hallowfall');
const s=brain.snapshot(stormwind,goals,['stormwind-city'],['manual-v18-0001']);
assert.equal(s.total,3);assert.equal(s.active,1);assert.equal(s.planned,1);assert.equal(s.completed,1);
assert.equal(s.bookmarked,true);assert.equal(s.inSession,true);assert.equal(s.icon,'crown');
assert.equal(brain.snapshot(hallowfall,goals,[],[]).completed,1);
assert.ok(brain.visible(stormwind,{filter:'bookmarks',bookmarks:['stormwind-city']}));
assert.ok(brain.visible(stormwind,{filter:'goals',goals}));
assert.ok(brain.visible(stormwind,{filter:'active',goals}));
assert.ok(brain.visible(stormwind,{filter:'planned',goals}));
assert.ok(brain.visible(stormwind,{filter:'completed',goals}));
assert.ok(brain.visible(stormwind,{filter:'session',goals,sessionIds:['manual-v18-0001']}));
assert.ok(!brain.visible(hallowfall,{filter:'active',goals}));
assert.ok(brain.visible(stormwind,{filter:'capital'}));
assert.ok(!brain.visible(hallowfall,{filter:'capital'}));
assert.ok(brain.visible(hallowfall,{filter:'zone'}));
assert.equal(brain.filterValue('bogus'),'all');
const eastern=brain.regionSummary('eastern-kingdoms',world.zones,goals);
assert.equal(eastern.destinations,4);assert.equal(eastern.missions,3);
assert.equal(eastern.active,1);
assert.match(brain.privacy(),/not in-game map coordinates/);
const svg=await read('assets/nexus-atlas-cartography-v18.svg');
assert.match(svg,/<svg\b/);assert.match(svg,/viewBox="0 0 900 510"/);
assert.match(svg,/KALIMDOR/);assert.match(svg,/EASTERN KINGDOMS/);assert.match(svg,/DRAGON ISLES/);assert.match(svg,/OUTLAND/);
assert.ok(!/<script\b/i.test(svg)&&!/<image[^>]*https?:/i.test(svg),'Bundled map must be local and standalone');
assert.ok(!/https?:\/\/[^"]+\.(png|jpg|jpeg|webp)/i.test(svg),'No remote image tiles');
const page=await read('world-atlas.html'),ui=await read('world-atlas-cartography-v18.js'),
 css=await read('world-atlas-cartography-v18.css'),legacy=await read('world-atlas-v16.js'),
 legacyOverlay=await read('world-atlas-overdrive-v16.5.js'),backup=await read('save-protection.html');
new vm.Script(ui);
assert.equal(css.split('{').length,css.split('}').length,'v18 stylesheet braces must be balanced');
assert.match(css,/prefers-reduced-motion/);assert.match(css,/max-width:650px/);
for(const asset of ['world-atlas-v16.js','world-atlas-overdrive-v16.5.js','world-atlas-cartography-v18-core.js','world-atlas-cartography-v18.js','world-atlas-cartography-v18.css'])
 assert.ok(page.includes('./'+asset),'Atlas must retain '+asset);
for(const id of ['nx18Controls','nx18WorldImage','nx18Chart','nx18Filter','nx18Performance','nx18MapFile','nx18ResetArt','nx18ZoneCard'])
 assert.ok(ui.includes(id),'New atlas interface is missing '+id);
assert.match(backup,/nexus_world_atlas_goals_v16/);
assert.match(backup,/nexus_adventure_intelligence_v165/);
assert.match(backup,/nexus_adventure_operations_v17/);
assert.match(legacy,/localStorage\.setItem\(K\.goals/);
assert.match(legacyOverlay,/localStorage\.setItem\(KEY/);
assert.ok(!ui.includes('localStorage.setItem('),'v18 map must not write any original storage directly');
assert.ok(!ui.includes('fetch(')&&!ui.includes('localStorage.clear('));
assert.ok(!ui.includes('navigator.geolocation'));
assert.ok(!ui.includes('/api/me/')&&!ui.includes('access_token'));
assert.match(ui,/URL\.revokeObjectURL/);
assert.match(ui,/image\/webp/);
console.log('PASS v18 source-backed pins, mission-state overlays, region filters, manual-data boundaries, art safety, responsive UI and original saves.');
