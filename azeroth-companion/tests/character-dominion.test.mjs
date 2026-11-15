/* NEXUS | AZEROTH v4.3 Character Dominion regression guards */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=n=>readFile(path.join(root,n),'utf8');
const [html,core,css,handoff,armory,targets,farm,atlas,guide,fieldlab]=await Promise.all([
 'index.html','character-dominion.js','character-dominion.css','character-handoff.js','connected-armory.js',
 'character-targets.js','farming-operations.js','item-atlas.js','player-guide.js','player-field-lab.js'].map(read));
for(const [name,source] of [['dominion',core],['handoff',handoff],['armory',armory],['targets',targets],['farm',farm],['atlas',atlas],['guide',guide],['fieldlab',fieldlab]])new vm.Script(source,{filename:name+'.js'});
assert.ok(html.includes('./character-dominion.js'),'Character Dominion must survive subsequent website releases');
assert.match(html,/\.\/character-dominion\.js/);
assert.match(html,/\.\/character-dominion\.css/);
assert.ok(html.indexOf('player-field-lab.js')<html.indexOf('character-dominion.js'));
for(const marker of ['data-section="dominion"','Character Dominion','Next recommended objective','Assign an Item Atlas goal','Recent farming activity','CHARACTER DOMINION','nexus_azeroth_character_targets_v1','nexus_azeroth_farm_operations_v1','nexus_azeroth_item_atlas_v1','nexus_azeroth_loot_hunter_v1']){
 assert.ok(core.includes(marker),'Missing Character Dominion component '+marker);
}
for(const marker of ['current===','manual','Blizzard','Public Armory','idOf(','priority','nexus:public-profile-loaded','nexus:character-targets-changed','nexus:farm-operations-changed','nexus:item-atlas-changed','nexus:loot-updated','localStorage.setItem','nexus:character-targets-updated','requestSubmit()']){
 assert.ok(core.includes(marker),'Character Dominion missing behavior '+marker);
}
assert.ok(core.includes("const key=p=>p.region+'/'+p.realm+'/'+p.name"),'Region-scoped character identity is required');
assert.ok(core.includes('if(p.targets.length>=1500)'),'Honor existing Character Targets record limit');
assert.ok(core.includes("current='all'"),'All-character planning overview should remain available');
assert.ok(core.includes("profile&&char&&profile.identity===key(char)"),'Public profile data must only attach to matching selected character');
assert.ok(!/AZEROTH_SESSION_SECRET|BLIZZARD_CLIENT_SECRET|__Host-nx_bnet_session|access_token/.test(core),'Public page must not handle auth secrets');
assert.ok(!core.includes('/api/me/'),'Authenticated personal APIs must stay on the Worker origin');
assert.ok(!core.includes('fetch('),'Dominion should not silently fetch account data');
assert.ok(handoff.includes("form.append(control)"),'Import action must appear in public Armory');
assert.ok(handoff.includes("requestAnimationFrame(()=>document.querySelector('.nav [data-view=\"armory\"]')?.click())"),'Portal handoff must open Armory');
assert.ok(handoff.includes('history.replaceState'),'Remove imported character identifier from public address bar');
assert.ok(handoff.includes('untrusted')&&handoff.includes('confirm('),'URL must not prove account ownership and import requires confirmation');
assert.ok(handoff.includes("window.dispatchEvent(new Event('nexus:character-profile-updated'))"),'Saved profile must notify the dashboard');
assert.ok(targets.includes("window.addEventListener('nexus:character-targets-updated'"),'Character Targets must reload on same-tab writes');
assert.ok(farm.includes("window.addEventListener('nexus:farm-operations-updated'"),'Farming Operations must reload on same-tab imports');
assert.ok(atlas.includes("window.dispatchEvent(new Event('nexus:item-atlas-changed'))"),'Item Atlas changes must update Dominion');
assert.ok(armory.includes("new CustomEvent('nexus:public-profile-loaded'"),'Public Blizzard profile summaries should be transient');
assert.ok(guide.includes("view:'dominion'"),'Information guide must navigate to Dominion');
assert.ok(fieldlab.includes('Companion UI version: '),'Player Field Lab report must not claim an outdated fixed app version');
assert.match(css,/@media\(max-width:650px\)/);
console.log('Character Dominion v4.3 checks passed.');
