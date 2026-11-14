// PROXIMUS v3.6.0 | Orbit Interface — safe site-wide navigation and responsive redesign.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
 ORBIT_PIN_KEY,ORBIT_RECENT_KEY,ORBIT_GROUPS,ORBIT_DEFAULT_PINNED,
 orbitCanonicalId,orbitGroupFor,normalizeOrbitIds,orbitFilter
} from '../orbit-core.js';
import {initOrbitInterface,readOrbitPins,readOrbitRecent,toggleOrbitPin} from '../orbit-interface.js';
const ROOT=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const app=read('app.js'),html=read('index.html'),styles=read('orbit-interface.css');
const nav=read('mobile-navigation.js'),command=read('command-center.js'),orbit=read('orbit-interface.js'),sw=read('sw.js');
const known=ORBIT_GROUPS.flatMap(g=>g.members);
assert.equal(ORBIT_PIN_KEY,'proximus-orbit-pins-v1');
assert.equal(ORBIT_RECENT_KEY,'proximus-orbit-recent-v1');
assert.equal(known.length,19,'Keep the same studios; no duplicate Media Theater entry');
assert.equal(new Set(known).size,19,'Every visible studio should appear exactly once in sidebar categories');
for(const id of ['command','reactor','videos','arcade','life','animation','tokens','projects','sync','recovery','releases','creator'])assert.ok(known.includes(id),'Missing preserved studio '+id);
assert.equal(known.includes('theater'),false,'Old Media Theater must remain a legacy alias, not a visible duplicate');
assert.equal(orbitCanonicalId('theater'),'reactor');
assert.equal(orbitCanonicalId('life'),'life');
assert.equal(orbitGroupFor('reactor'),'entertainment');
assert.equal(orbitGroupFor('theater'),'entertainment');
assert.equal(orbitGroupFor('documents'),'creative');
assert.equal(orbitGroupFor('tokens'),'settings');
assert.equal(orbitGroupFor('life'),'everyday');
assert.equal(orbitGroupFor('sync'),'workspace');
assert.deepEqual(normalizeOrbitIds(['theater','reactor','videos','unknown','life','life'],known),['reactor','videos','life']);
assert.deepEqual(normalizeOrbitIds({},known),[]);
assert.deepEqual(normalizeOrbitIds(['reactor','videos','life'],known,2),['reactor','videos']);
assert.ok(ORBIT_DEFAULT_PINNED.includes('reactor'));
const studios=[
 {id:'command',title:'Command Center',detail:'personal dashboard'},
 {id:'reactor',title:'Sonic Theater',detail:'saved MP3 playlist reactive music'},
 {id:'theater',title:'Media Theater',detail:'retained old compatibility'},
 {id:'videos',title:'Video Vault',detail:'watch private videos'},
 {id:'life',title:'Life Command',detail:'planner habits calendar'},
 {id:'documents',title:'Document Forge',detail:'PDF scan documents'},
 {id:'tokens',title:'Token Foundry',detail:'encrypted local codes'}
];
assert.deepEqual(orbitFilter(studios,{group:'entertainment'}).map(x=>x.id),['reactor','videos']);
assert.deepEqual(orbitFilter(studios,{term:'mp3'}).map(x=>x.id),['reactor']);
assert.deepEqual(orbitFilter(studios,{group:'favorites',pins:['life','videos']}).map(x=>x.id),['videos','life']);
assert.deepEqual(orbitFilter(studios,{group:'recent',recent:['tokens','reactor','life']}).map(x=>x.id),['tokens','reactor','life']);
assert.deepEqual(orbitFilter(studios,{pinnedOnly:true,pins:['theater','tokens']}).map(x=>x.id),['reactor','tokens']);
assert.equal(typeof initOrbitInterface,'function');
assert.equal(typeof readOrbitPins,'function');
assert.equal(typeof readOrbitRecent,'function');
assert.equal(typeof toggleOrbitPin,'function');
const sourceIds=['orbitAccessBar','orbitFind','orbitHome','orbitPinCurrent','orbitCurrent','orbitCurrentCategory',
 'orbitPinned','orbitRecent','orbitCmdCategory','orbitCmdPinned',
 'cmdDialog','cmdSearch','cmdOpen','layoutToggle','layoutCurrent','mobileDock',
 'mobileStudioDialog','mobileStudioList','videoVaultPlayer','videoVaultFiles','theaterMusicSavedList',
 'theaterMusicAutostart','sonicPowerMode','reactorCanvas','tokenInventory','identityPresetGallery'];
for(const id of sourceIds){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Required control missing or duplicated: '+id);
}
assert.equal([...html.matchAll(/<section class="studio" data-panel="([^"]+)"/g)].length,20,'Preserve 18 active spaces + 2 info pages');
assert.equal([...html.matchAll(/class="nav[^"]*" data-view="([^"]+)"/g)].length,20,'Keep exact original legacy sidebar nav nodes');
assert.ok(html.includes('data-mobile-target="reactor"'),'Dedicated iPhone Sonic shortcut');
assert.ok(html.includes('id="mobileHistoryBack"')&&html.includes('id="mobileHistoryNext"'),'History controls retained in DOM');
assert.ok(html.includes('<link rel="stylesheet" href="./orbit-interface.css">'),'Facelift must load after previous protection CSS');
assert.ok(app.includes('initOrbitInterface(app);'),'New visual access layer must initialize');
assert.ok(app.indexOf('initOrbitInterface(app);')<app.indexOf('initCommandCenter(app);'),'Group and disclosure UI must exist before controllers initialize');
assert.ok(app.includes("if(id==='theater')id='reactor'"),'Old Media Theater routes must still function');
assert.ok(app.includes("LOCAL='3.6.0'"),'Release version should match new interface');
assert.ok(app.includes("toggleOrbitPin(n.id)"),'Keyboard search should allow favorites');
assert.ok(app.includes("orbitFilter(names,"),'Search should use one purpose-based tool taxonomy');
assert.ok(orbit.includes("const historic=oldPinKeys.flatMap"),'Existing favorites should be imported non-destructively');
assert.ok(orbit.includes("legacy.hidden=true"),'Legacy Theater nav must not appear twice');
assert.ok(orbit.includes("menu.append(button)"),'Existing topbar actions should be moved, not cloned');
assert.ok(orbit.includes("wrapAdvancedArea(document.querySelector('#command .command-catalog')"),'Long tool catalog must be accessible via disclosure');
assert.ok(orbit.includes("wrapAdvancedArea(document.querySelector('#overdriveHub .overdrive-scene-panel')"),'Large advanced scene controls must be collapsible');
assert.ok(orbit.includes("document.body.dataset.orbitView=view"),'Active studio should trigger a compact header without removing original content');
assert.ok(nav.includes("readOrbitPins().filter"),'Phone picker should use unified favorites');
assert.ok(nav.includes("writeOrbitPins(pins)"),'Phone favorite changes should update desktop');
assert.ok(command.includes("writeOrbitPins(pins)"),'Dashboard favorites should update global access');
assert.ok(styles.includes('body[data-orbit-view]:not([data-orbit-view="command"]) .welcome'),'Hide redundant giant welcome banner only on individual studios');
assert.ok(styles.includes('.orbit-nav-group>summary'),'Desktop sidebar should be categorized and collapsible');
assert.ok(styles.includes('.orbit-access-chips'),'Universal favorite/recent access bar should be visible on every studio');
assert.ok(styles.includes('body[data-device-layout="mobile"]'),'Manual iPhone override must have a real mobile layout');
assert.ok(styles.includes('body[data-device-layout="mobile"] #mobileDock'),'Retained touch-optimized dock');
assert.ok(styles.includes('.orbit-more-items'),'Old topbar actions must remain in More menu');
assert.ok(styles.includes('.orbit-interface .video-vault-stage{background:#000}'),'Video Vault must retain opaque matte');
assert.ok(!styles.includes('#videoVaultPlayer{opacity'),'Do not introduce video transparency regression');
assert.ok(styles.includes('@media(prefers-reduced-motion:reduce)'),'Respect reduced-motion accessibility');
assert.ok(sw.includes("'./orbit-core.js'")&&sw.includes("'./orbit-interface.js'")&&sw.includes("'./orbit-interface.css'"),'Offline app must cache all access components');
console.log('PASS: v3.6.0 ORBIT — grouped PC/iPhone navigation, one search/pin system, local favorites and recent history, visual-only design, original 20 registered route IDs.');
