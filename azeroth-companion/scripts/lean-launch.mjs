/* NEXUS | AZEROTH v4.7 — deterministic lean-launch assets.
 * Usage (GitHub Actions Node 22): node azeroth-companion/scripts/lean-launch.mjs --check
 * For maintenance: node azeroth-companion/scripts/lean-launch.mjs --write
 * No bundler dependency, no studio source transformation or injected runtime.
 */
import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import vm from 'node:vm';
const ROOT=path.resolve(import.meta.dirname,'..');
const plans=[
 {out:'styles-core-v5.2.css',kind:'css',header:'/* NEXUS | AZEROTH v5.2 — compiled core stylesheet with Talent Intelligence. DO NOT EDIT: generated from existing module CSS. */\n',files:["warcraft-overdrive.css","player-utility.css","connected-armory.css","item-discovery.css","item-atlas.css","character-targets.css","progress-command.css","loot-hunter.css","armory-loot-bridge.css","farming-operations.css","personal-azeroth.css","talent-forge.css","adaptive-navigation.css","talent-canvas-v5.3.css"]},
 {out:'styles-experience-v5.0.css',kind:'css',header:'/* NEXUS | AZEROTH v5.0 — compiled visual stylesheet with Sovereign Command website shell. DO NOT EDIT: generated from existing module CSS. */\n',files:["assassin-dominion.css","command-launcher.css","unified-dashboard.css","verified-connection.css","connected-player.css","sovereign-vault.css","character-handoff.css","player-guide.css","player-field-lab.css","character-dominion.css","sovereign-experience.css","sovereign-portal.css","sovereign-command-v5.css"]},
 {out:'scripts-core-v4.8.js',kind:'js',header:'/* NEXUS | AZEROTH v4.8 — compiled core script with view-aware startup. DO NOT EDIT: generated from original studio scripts in order. */\n',files:["warcraft-overdrive.js","player-utility.js","connected-armory.js","item-discovery.js","item-atlas.js","character-targets.js","progress-command.js","loot-hunter.js","armory-bridge-core.js","armory-loot-bridge.js","farming-operations.js","personal-azeroth.js","talent-layout.js"]},
 {out:'scripts-experience-v5.2.js',kind:'js',header:'/* NEXUS | AZEROTH v5.2 — compiled experience script including Talent Source Intelligence. DO NOT EDIT: generated from original studio and shell scripts in order. */\n',files:["talent-paths.js","talent-planner-core.js","talent-forge.js","adaptive-navigation.js","command-launcher.js","unified-dashboard.js","verified-connection.js","sovereign-vault.js","character-handoff.js","player-guide.js","player-field-lab.js","character-dominion.js","sovereign-experience.js","sovereign-portal.js","sovereign-command-v5.js","talent-canvas-v5.3.js"]}
];
const mode=process.argv[2]||'--check';
assert.ok(['--check','--write'].includes(mode),'Use --check or --write');
const html=await readFile(path.join(ROOT,'index.html'),'utf8');
let cssCount=0,jsCount=0,bytes=0;
for(const plan of plans){
 const contents=await Promise.all(plan.files.map(async f=>readFile(path.join(ROOT,f),'utf8')));
 if(plan.kind==='css')for(let i=0;i<contents.length;i++)assert.ok(!/@import\b|@charset\b/i.test(contents[i]),'CSS directives must not be moved into bundled middle: '+plan.files[i]);
 const serialized=plan.header+plan.files.map((name,i)=>plan.kind==='js'?'\n;/* BUNDLE SOURCE: '+name+' */\n'+contents[i]+'\n':'\n/* BUNDLE SOURCE: '+name+' */\n'+contents[i]+'\n').join('');
 if(plan.kind==='js')new vm.Script(serialized,{filename:plan.out});
 const meta=plan.files.map(name=>'./'+name).join(' ');
 const bundleRef='./'+plan.out;
 assert.ok(html.includes('src="'+bundleRef+'" data-sources="'+meta+'"')||html.includes('href="'+bundleRef+'" data-sources="'+meta+'"'),'Missing or outdated HTML source manifest for '+plan.out);
 if(mode==='--write')await writeFile(path.join(ROOT,plan.out),serialized);
 else {
  const compiled=await readFile(path.join(ROOT,plan.out),'utf8');
  assert.equal(compiled,serialized,'Stale compiled bundle '+plan.out+'; run node azeroth-companion/scripts/lean-launch.mjs --write and commit the result');
 }
 bytes+=serialized.length;
 if(plan.kind==='js')jsCount+=plan.files.length;else cssCount+=plan.files.length;
}
assert.equal(cssCount,27);
assert.equal(jsCount,29);
const stylesheetCount=(html.match(/<link rel="stylesheet" href=/g)||[]).length;
const deferredCount=(html.match(/<script defer src=/g)||[]).length;
assert.equal(stylesheetCount,2,'Exactly two active bundled stylesheets expected');
assert.equal(deferredCount,2,'Exactly two active defer script bundles expected');
console.log('Azeroth v4.7 lean launch '+mode+' passed; '+cssCount+' CSS sources + '+jsCount+' JS sources in 4 checked bundles ('+bytes+' source bytes).');
