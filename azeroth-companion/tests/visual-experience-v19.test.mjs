/* NEXUS v19 — shared adaptive visual engine source + no-regression guard */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const root=new URL('../../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const css=await read('shared/nexus-experience-v19.css'),js=await read('shared/nexus-experience-v19.js');
new vm.Script(js,{filename:'nexus-experience-v19.js'});
assert.equal(css.split('{').length,css.split('}').length,'Adaptive CSS braces must balance');
assert.ok(js.length<9000,'One controller should stay small');
assert.ok(css.length<14000,'One shared visual layer should stay compact');
assert.match(js,/nexus_visual_presentation_v19/);
assert.match(js,/prefers-reduced-motion/);
assert.match(js,/connection\?\.saveData/);
assert.match(js,/new Set\(\['auto','cinematic','balanced','quiet'\]\)/);
assert.match(js,/aria-label="Open visual performance settings"/);
assert.match(js,/CustomEvent\('nexus:visual-mode'/);
assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|navigator\.geolocation/.test(js),'Visual engine must have zero remote/network access');
assert.ok(!/location\.assign\(|location\.href\s*=|window\.open\(/.test(js),'Visual engine may not redirect / intercept native navigation');
const writes=[...js.matchAll(/localStorage\.setItem\(([^,]+),/g)].map(m=>m[1].trim());
assert.deepEqual(writes,['KEY'],'The only possible storage write must use the isolated visual preference key');
assert.ok(!/localStorage\.clear\(|localStorage\.removeItem\(/.test(js));
assert.ok(!/token|cookie|auth[_-]|logout|refresh[_-]token/i.test(js),'Do not access authentication state');
assert.match(css,/data-nx19-surface="gateway"/);
assert.match(css,/data-nx19-surface="atlas"/);
assert.match(css,/data-nx19-surface="creator"/);
assert.match(css,/data-nx19-resolved="quiet"/);
assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
const perf=await read('azeroth-companion/performance-overdrive-v7.5.js');
const art=await read('azeroth-companion/studio-art-direction-v9.2.css');
assert.ok(perf.endsWith(js),'Main Azeroth bundles the EXACT same shared visual JS to avoid extra startup requests');
assert.ok(art.endsWith(css),'Main Azeroth bundles the EXACT same shared visual CSS to avoid extra startup requests');
for(const filename of ['hub/index.html','alchemist/index.html',
  'azeroth-companion/command-center.html','azeroth-companion/player-experience.html',
  'azeroth-companion/world-atlas.html','azeroth-companion/expedition-console.html',
  'azeroth-companion/adventure-operations.html','azeroth-companion/living-azeroth.html']){
 const source=await read(filename);
 assert.match(source,/shared\/nexus-experience-v19\.css\?v=1900/,'Missing shared CSS on '+filename);
 assert.match(source,/shared\/nexus-experience-v19\.js\?v=1900/,'Missing controller on '+filename);
 assert.ok(source.indexOf('shared/nexus-experience-v19.css')<source.indexOf('</head>'),'Styles must load before head finishes');
}
const main=await read('azeroth-companion/index.html');
assert.match(main,/performance-overdrive-v7\.5\.js\?v=1900/);
assert.match(main,/studio-art-direction-v9\.2\.css\?v=1900/);
assert.ok(!main.includes('shared/nexus-experience-v19.'),'Main companion should NOT add request count');
for(const original of ['./scripts-core-v4.8.js','./scripts-experience-v5.2.js','./talent-build-architect-v14.js','./character-nexus-forge-handoff-v15.js'])
 assert.ok(main.includes(original),'Original app dependency remains: '+original);
const gateway=await read('hub/index.html');
assert.match(gateway,/dataset\.nx19Resolved==='quiet'/,'Gateway particles should avoid redraw in quiet mode');
assert.match(gateway,/nexus_sov_gateway_v1/,'Gateway favorites and recent links must remain');
const vault=await read('azeroth-companion/save-protection.html');
for(const key of ['nexus_world_atlas_goals_v16','nexus_adventure_operations_v17','nexus_atlas_routes_v181'])assert.ok(vault.includes(key));
const launcher=await read('sonic-reactor-ii/index.html'),foundry=await read('character-foundry/index.html');
assert.ok(!launcher.includes('nexus-experience-v19'),'Installed-app launcher CSP must remain untouched');
assert.ok(!foundry.includes('nexus-experience-v19'),'Desktop protocol handoff must remain untouched');
console.log('PASS v19: exact shared visual engine, original main app resource count, semantic interactive presets, reduced motion, isolated preference, unchanged media and auth launchers.');
