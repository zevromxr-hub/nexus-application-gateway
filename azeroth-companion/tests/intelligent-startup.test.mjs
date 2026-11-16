/* NEXUS | AZEROTH v4.8 — Intelligent Startup static regression tests */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const dir=path.resolve(import.meta.dirname,'..');
const read=n=>readFile(path.join(dir,n),'utf8');
const html=await read('index.html');
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert.ok(inline.length>=1,'Startup script must remain present');
new vm.Script(inline[0],{filename:'azeroth-index-inline.js'});
assert.ok(html.includes('NexusStartup')||html.includes('nexus:view-activated'),'v4.8 scheduler should remain installed after newer releases');
assert.ok(inline[0].includes("Object.defineProperty(window,'NexusStartup'"),'Startup coordinator should initialize before bundled scripts');
assert.ok(inline[0].includes("new CustomEvent('nexus:view-activated'"),'Site router should notify view-aware startup tasks');
assert.ok(inline[0].includes("const once=options?.once!==false"),'Deferred callbacks need one-shot and revisit modes');
assert.ok(inline[0].includes("if(once)document.removeEventListener(EVENT,handler)"),'One-shot startup listeners must detach after first view');
assert.ok(inline[0].includes('queueMicrotask('),'Already-active views should initialize reliably');
assert.ok(html.includes('./scripts-core-v4.8.js')&&html.includes('./scripts-experience-v5.2.js'));
assert.equal((html.match(/<script defer src=/g)||[]).length,4);
assert.equal((html.match(/<link rel="stylesheet" href=/g)||[]).length,4);
const checks=[
 ['warcraft-overdrive.js',["whenView('releases'","['warcraft','dungeons','professions','equipment','releases']","{once:false}"]],
 ['loot-hunter.js',["whenView('loot'","function loadReferenceCatalog()","loot-sources.json"]],
 ['talent-forge.js',["whenView('talents'","indexFetch($('tfRegion').value)"]],
 ['player-guide.js',["whenView('guide'","fetchVersion()"]],
 ['item-atlas.js',["whenView('atlas'","{once:false}"]],
 ['progress-command.js',["whenView('command'","refreshVisible()"]],
 ['unified-dashboard.js',["whenView('dashboard'","refreshVisible()"]],
 ['character-dominion.js',["whenView('dominion'","refreshVisible()"]],
 ['player-field-lab.js',["whenView('fieldlab'","labInitialized","refreshReport()"]]
];
for(const [filename,markers] of checks){
 const source=await read(filename);
 new vm.Script(source,{filename});
 for(const marker of markers)assert.ok(source.includes(marker),'Deferred startup marker missing in '+filename+': '+marker);
}
const browser=await read('tests/startup-audit.browser.mjs');
for(const marker of ['chromium','webkit','loot-sources','version','cdMetrics','udMetrics','pcMetrics','pflChecklist','talents','guide','releases'])
 assert.ok(browser.includes(marker),'Browser startup scenario missing '+marker);
const actions=await read('../.github/workflows/azeroth-device-audit.yml');
assert.ok(actions.includes('startup-audit.browser.mjs'),'Startup browser test must be executed in GitHub Actions');
for(const sensitive of ['BLIZZARD_CLIENT_SECRET','AZEROTH_SESSION_SECRET','__Host-nx_bnet_session']){
 assert.ok(!inline[0].includes(sensitive),'Startup coordinator must not handle account secrets');
}
console.log('Azeroth v4.8 Intelligent Startup static regressions passed.');
