/* NEXUS | AZEROTH v5.0 — Sovereign Command website-shell guards */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=n=>readFile(path.join(root,n),'utf8');
const [html,js,css,portal,launcher,engine]=await Promise.all([
 'index.html','sovereign-command-v5.js','sovereign-command-v5.css',
 'sovereign-portal.js','command-launcher.js','scripts/lean-launch.mjs'].map(read));
new vm.Script(js,{filename:'sovereign-command-v5.js'});
assert.ok(html.includes('./sovereign-command-v5.js'),'Sovereign Command should remain active after Talent Forge upgrade');
for(const p of ['styles-core-v5.2.css','styles-experience-v5.0.css','scripts-core-v4.8.js','scripts-experience-v5.2.js'])
 assert.ok(html.includes('./'+p),'Versioned bundled asset missing '+p);
for(const p of ['sovereign-command-v5.js','sovereign-command-v5.css','sovereign-portal.js','sovereign-experience.js','character-dominion.js'])
 assert.ok(html.includes('./'+p),'Sovereign source manifest missing '+p);
assert.ok(html.indexOf('sovereign-portal.js')<html.indexOf('sovereign-command-v5.js'),'The website shell must mount only after prior navigation and preferences');
assert.equal((html.match(/<script defer src=/g)||[]).length,25);
assert.equal((html.match(/<link rel="stylesheet" href=/g)||[]).length,25);
for(const marker of ['nexus_azeroth_sovereign_v5','nxCommandV5','data-nx-journey','new','returning','group','renderJourney()',
 'nxJourneySteps','function openTool(id)','btn.click()','azl-trigger','Skip to main content','nxPageAnnouncer',
 'aria-current','nexus:view-activated','data-nx-setting','sxResetSettings','nxToTop','scrollY>640']){
 assert.ok(js.includes(marker),'Website milestone capability missing '+marker);
}
assert.ok(js.includes("Object.hasOwn(allowed,key)")&&js.includes("allowed.journey.includes("),'Only allow predefined site preferences');
assert.ok(js.includes("names.has(id)")&&js.includes("nav.querySelectorAll('button[data-view]')"),'Journey links must refer to installed studios');
assert.ok(js.includes("document.body.dataset.nxText")&&js.includes("document.body.dataset.nxHome"),'Appearance controls must affect website shell immediately');
assert.ok(js.includes("main.setAttribute('tabindex','-1')"),'Skip link must move focus to the actual main landmark');
assert.ok(js.includes("document.title=view==='overview'?baseTitle"),'Page title should follow the current selected tool');
assert.ok(css.includes('nx-skip-link:focus')&&css.includes('nx-screen-reader-only'),'Accessibility styles must be included');
assert.ok(css.includes('[aria-pressed=true]')&&css.includes('[data-nx-text=large]'),'Controls must show active state and readable text');
assert.ok(css.includes('@media(max-width:600px)')&&css.includes('safe-area-inset-bottom'),'Mobile safe area and responsive paths required');
assert.ok(css.includes('prefers-reduced-motion:reduce')&&css.includes('data-sx-motion=reduce'),'Existing motion preferences must be respected');
assert.ok(engine.includes("styles-experience-v5.0.css")&&engine.includes("scripts-experience-v5.2.js"),'Bundle integrity compiler must reference v5 filenames');
assert.ok(engine.includes("sovereign-command-v5.js")&&engine.includes("sovereign-command-v5.css"),'Compiler must include v5 website shell source files');
assert.ok(portal.includes('nexus_azeroth_portal_v45')&&launcher.includes('nexus_azeroth_quick_launch_v36'),'Existing local website preferences must stay intact');
assert.ok(!js.includes('fetch(')&&!js.includes('XMLHttpRequest'),'Presentation upgrade must not add network requests or telemetry');
for(const secret of ['BLIZZARD_CLIENT_SECRET','AZEROTH_SESSION_SECRET','access_token','__Host-nx_bnet_session','/api/me/'])
 assert.ok(!js.includes(secret),'Public presentation layer must not handle account secrets or privileged API endpoints');
for(const store of ['nexus_azeroth_character_targets_v1','nexus_azeroth_farm_operations_v1','nexus_azeroth_item_atlas_v1','nexus_azeroth_loot_hunter_v1'])
 assert.ok(!js.includes(store),'Site shell must not mutate studio data keys');
console.log('Azeroth v5.0 Sovereign Command website-shell checks passed.');
