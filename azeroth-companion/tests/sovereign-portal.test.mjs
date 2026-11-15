/* NEXUS | AZEROTH v4.5 Sovereign Portal regressions
 * This release is a website-shell enhancement only.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=f=>readFile(path.join(root,f),'utf8');
const [html,js,css,foundation,foundationCSS,launcher]=await Promise.all([
 'index.html','sovereign-portal.js','sovereign-portal.css','sovereign-experience.js',
 'sovereign-experience.css','command-launcher.js'].map(read));
new vm.Script(js,{filename:'sovereign-portal.js'});
new vm.Script(foundation,{filename:'sovereign-experience.js'});
assert.ok(html.includes('./sovereign-portal.js'),'The v4.5 Sovereign Portal must remain mounted in subsequent website updates');
for(const asset of ['sovereign-portal.js','sovereign-portal.css','sovereign-experience.js','sovereign-experience.css',
 'character-dominion.js','player-guide.js','player-field-lab.js','verified-connection.js','sovereign-vault.js','command-launcher.js']){
 assert.ok(html.includes('./'+asset),'Site must retain '+asset);
}
assert.ok(html.indexOf('sovereign-experience.js')<html.indexOf('sovereign-portal.js'),'Portal should mount only after the v4.4 shell');
assert.ok(js.includes('nexus_azeroth_portal_v45'),'v4.5 preferences must be separate from v4.4 and all studios');
assert.ok(js.includes("const MAX=6")||js.includes("MAX=6"),'Limit homepage shortcuts to six');
assert.ok(js.includes('new Set(x.favorites.filter(validId))'),'Saved preferences must reject unknown or malformed shortcut identifiers');
assert.ok(js.includes('state.favorites.length>=MAX'),'Shortcut limit must be checked before saving');
assert.ok(js.includes("function renderDeck(")&&js.includes('spQuickDeck')&&js.includes('spDeckChoices'),'Quick Deck must render and be customizable');
assert.ok(js.includes('state.favorites.filter')&&js.includes('names().has'),'Shortcut reset should use actual installed studio links');
assert.ok(js.includes("const button=navButtons().find"),'Navigation must reuse existing working studio buttons');
assert.ok(js.includes("button.click()"),'Quick actions must call the actual existing navigation');
assert.ok(js.includes('spCurrentView')&&js.includes('spContextHome')&&js.includes('refreshContext()'),'Website breadcrumb and return-home navigation missing');
assert.ok(js.includes("nav.querySelector('button[data-view].active')"),'Selected page source of truth must be existing studio navigation');
assert.ok(js.includes("navigator.onLine!==false")&&js.includes("'offline',connection"),'Offline note must use device connectivity signals without pretending API health');
assert.ok(js.includes('sp-tour-overlay')&&js.includes('role="dialog"')&&js.includes('aria-modal="true"'),'Website onboarding tour must have dialog semantics');
assert.ok(js.includes("e.key==='Escape'")&&js.includes("e.key!=='Tab'"),'Website tour must allow Escape and keyboard navigation');
assert.ok(js.includes('state.tourSeen=true')&&js.includes('data-sp-tour'),'Tour must be an opt-in and dismissible interface feature');
assert.ok(js.includes('Connected')||js.includes('Blizzard'),'Explain account boundaries in orientation');
assert.ok(js.includes('Sovereign Data Vault')&&js.includes('My Quick Deck'),'Tour and homepage should explain backup and personalized quick access');
assert.ok(css.includes('@media(max-width:500px)')&&css.includes('env(safe-area-inset-bottom'),'Phone layout should protect safe areas');
assert.ok(css.includes('prefers-reduced-motion')&&css.includes('data-sx-motion=reduce'),'Motion choices from v4.4 must be respected');
assert.ok(css.includes('sp-tour-actions button[hidden]'),'Hidden controls must not remain focusable or visible');
assert.ok(!js.includes('fetch(')&&!js.includes('XMLHttpRequest'),'Shell enhancement should not send telemetry or account data');
for(const secret of ['BLIZZARD_CLIENT_SECRET','AZEROTH_SESSION_SECRET','access_token','__Host-nx_bnet_session','/api/me/'])assert.ok(!js.includes(secret),'Never access Blizzard secrets from public shell');
for(const key of ['nexus_azeroth_companion_genesis_v1','nexus_azeroth_character_targets_v1','nexus_azeroth_farm_operations_v1','nexus_azeroth_item_atlas_v1'])assert.ok(!js.includes(key),'No studio-local progress access or mutations');
assert.ok(foundation.includes('nexus_azeroth_site_shell_v44'),'Preserve v4.4 preferences');
assert.ok(launcher.includes('nexus_azeroth_quick_launch_v36'),'Preserve Command Launcher preferences');
console.log('Sovereign Portal v4.5 website isolation and navigation checks passed.');
