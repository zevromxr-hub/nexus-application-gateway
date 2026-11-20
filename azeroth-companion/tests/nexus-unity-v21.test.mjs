/* NEXUS | AZEROTH v21 — sitewide sovereign unity source and isolation audit */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const base=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,base),'utf8');
const coreJS=await read('nexus-unity-v21-core.js');
const uiJS=await read('nexus-unity-v21.js');
const css=await read('nexus-unity-v21.css');
const scope={window:{}};new vm.Script(coreJS,{filename:'nexus-unity-v21-core.js'}).runInNewContext(scope);
new vm.Script(uiJS,{filename:'nexus-unity-v21.js'});
const core=scope.window.NexusUnityCoreV21;
assert.equal(core.VERSION,'21.0.0');
assert.equal(core.KEY,'nexus_azeroth_unity_v21');
assert.equal(core.DIR.length,20);
assert.equal(new Set(core.DIR.map(x=>x.id)).size,core.DIR.length);
assert.equal(core.JOURNEYS.length,4);
assert.equal(css.split('{').length,css.split('}').length,'Scoped premium CSS braces must balance');
assert.ok(css.length<25000,'Shared CSS should be lightweight');
assert.ok(coreJS.length+uiJS.length<40000,'Shared JS should stay under 40 KB without a runtime library');
for(const script of [coreJS,uiJS]){
 assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|navigator\.geolocation|serviceWorker\.register|new Worker\(/.test(script),'Unity Engine must perform no network, geolocation or background work');
 assert.ok(!/localStorage\.clear\(|localStorage\.removeItem\(|indexedDB\.deleteDatabase\(/.test(script),'Unity must never clear or delete any user data');
 assert.ok(!/eval\(|new Function\(/.test(script));
}
assert.ok(!/localStorage\.setItem\(/.test(coreJS),'Core is pure and read-only');
const writes=[...uiJS.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(x=>x[1].trim());
assert.deepEqual(writes,['core.KEY'],'Unity may save only an isolated list of public studio IDs');
assert.ok(!/nexus_azeroth_secure_video_v20|crypto\.subtle|localStorage\.setItem\('nexus_world_atlas/.test(uiJS),'No Vault crypto or original Atlas save mutation');
assert.match(uiJS,/const inVault=page==='private-video-vault\.html'/);
assert.match(uiJS,/if\(inVault\)return null/,'Private Vault must be isolated from personal planning record reads');
assert.match(uiJS,/doc\.createElement/);
assert.match(uiJS,/\.textContent=String\(label\)/,'Search text must use textContent rather than injected HTML');
assert.match(uiJS,/requestAnimationFrame/);
assert.match(uiJS,/showModal/);
assert.match(uiJS,/event\.key==='Escape'/);
assert.match(uiJS,/event\.metaKey/);
assert.match(uiJS,/nexus:visual-mode/);
assert.match(css,/prefers-reduced-motion:reduce/);
assert.match(css,/safe-area-inset-bottom/);
assert.match(css,/nx21-bridge-cards/);
assert.match(css,/nx21-journeys/);
const prefs=core.normalizePreferences({pinned:['forge','atlas','forge','INVALID','vault','command','character','backup','oracle'],recent:['atlas','atlas','forge','INVALID']});
assert.equal(JSON.stringify(Array.from(prefs.pinned)),JSON.stringify(['forge','atlas','vault','command','character','backup']));
assert.equal(JSON.stringify(Array.from(prefs.recent)),JSON.stringify(['atlas','forge']));
const tog=core.togglePinned(prefs,'forge');
assert.equal(tog.pinned.includes('forge'),false);
assert.equal(core.togglePinned(tog,'forge').pinned[0],'forge');
assert.equal(core.visit(prefs,'vault').recent[0],'vault');
assert.equal(core.visit(prefs,'bogus').recent[0],'atlas');
assert.equal(core.safeZone('../evil'),false);assert.equal(core.safeZone('stormwind-city'),true);
const s=core.snapshot({
 atlas:[{title:'Research Stormwind Equipment',zoneId:'stormwind-city',status:'active'},
  {title:'Visit Hallowfall',zoneId:'hallowfall',status:'planned'}],
 routes:{routes:[{title:'My Capital Tour',stops:[{zoneId:'stormwind-city'},{zoneId:'hallowfall'}]}]},
 operations:{entries:[{id:'manual-goal-001',minutes:30}]},
 forge:[{name:'Arcane Prototype',rankByNode:{a:2}}],
 core:{characters:[{id:'demo',name:'Synthetic Hero'}],builds:[{title:'Dungeon Set'}],collections:[{name:'Synthetic mount'}]}
});
assert.equal(s.activeCount,1);assert.equal(s.plannedCount,1);
assert.equal(s.routeCount,1);assert.equal(s.routeStops,2);assert.equal(s.sessionCount,1);
assert.equal(s.characterCount,1);assert.equal(s.draftCount,2);
assert.equal(s.nextGoal.zoneId,'stormwind-city');assert.equal(s.nextGoal.title,'Research Stormwind Equipment');
assert.ok(core.search('Stormwind',s).some(x=>x.kind==='manual'&&x.href==='./world-atlas.html?zone=stormwind-city'));
assert.ok(core.search('Vault',s).some(x=>x.id==='vault'));
assert.ok(core.search('Talents',s).some(x=>x.id==='forge'));
assert.ok(core.search('../',s).every(x=>!x.href.startsWith('http')),'No user-provided remote URL in search');
for(const d of core.DIR){
 assert.ok(d.href.startsWith('./')||d.href.startsWith('../'),'No external studio host: '+d.id);
 assert.ok(!/javascript:|data:|https?:/.test(d.href));
}
const pages=['command-center.html','world-atlas.html','player-experience.html','adventure-operations.html','expedition-console.html',
 'living-azeroth.html','private-video-vault.html','getting-started.html','save-protection.html','citadel-entry.html','azeroth-assistant.html',
 'release-notes.html','player-handbook.html','player-test-checklist.html','developer.html','sovereign-ascension.html',
 'character-intelligence.html','progression-intelligence.html','addon-nexus.html','privacy.html'];
for(const name of pages){
 const html=await read(name);
 for(const file of ['nexus-unity-v21.css','nexus-unity-v21-core.js','nexus-unity-v21.js'])
  assert.ok(html.includes(file+'?v='+(file==='nexus-unity-v21-core.js'?'2200':'2100')),'Missing shared Unity UI on '+name+': '+file);
}
const main=await read('index.html'),perf=await read('performance-overdrive-v7.5.js'),
 art=await read('studio-art-direction-v9.2.css');
assert.ok(main.includes('performance-overdrive-v7.5.js?v=2200')&&main.includes('studio-art-direction-v9.2.css?v=2100'));
assert.ok(!main.includes('nexus-unity-v21.js'),'Native main page must retain original JS request count');
assert.ok(perf.includes(coreJS)&&perf.includes(uiJS),'Main should reuse identical v21 core and UI sources');
assert.ok(art.includes(css),'Main should reuse identical v21 scoped CSS');
const visualJS=await read('../shared/nexus-experience-v19.js');
const visualCSS=await read('../shared/nexus-experience-v19.css');
assert.ok(perf.endsWith(visualJS),'Preserve v19 bundled visual JS source unchanged at end of main asset');
assert.ok(art.endsWith(visualCSS),'Preserve v19 bundled visual CSS source unchanged at end of main asset');
assert.ok(main.includes('./talent-build-architect-v14.js'),'Retain original Talent Forge and player systems');
const vault=await read('private-video-vault.html');
assert.match(vault,/default-src 'none'/);
assert.match(vault,/connect-src 'none'/);
assert.match(vault,/private-video-vault-v20-core\.js\?v=2010/,'Unmodified Vault encryption source');
assert.match(vault,/private-video-vault-v20\.js\?v=2010/,'Unmodified local encrypted Vault UI');
const manifest=JSON.parse(await read('site.webmanifest'));
assert.equal(manifest.start_url,'./');
assert.equal(manifest.display,'standalone');
assert.equal(manifest.shortcuts.length,4);
assert.ok(manifest.shortcuts.some(x=>x.url==='./private-video-vault.html'));
const save=await read('save-protection.html');
assert.ok(!save.includes('nexus_azeroth_secure_video_v20'),'Standard JSON planning backup must not import private Vault secrets');
const gw=await read('../hub/index.html');assert.ok(gw.includes("v21.0 • Sovereign Unity"));
console.log('PASS v21 Unity: 21 Azeroth pages, 20 valid destinations, saved manual research, strict isolated favorites, private Vault CSP, original builds/auth and exact bundled startup request counts.');
