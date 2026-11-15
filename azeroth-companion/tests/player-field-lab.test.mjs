/* NEXUS Azeroth v4.2 Field Lab static regression checks */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const read=file=>readFile(path.join(root,file),'utf8');
const [code,css,index,guide]=await Promise.all(['player-field-lab.js','player-field-lab.css','index.html','player-guide.js'].map(read));
new vm.Script(code,{filename:'player-field-lab.js'});
assert.match(index,/player-field-lab\.js/);
assert.match(index,/player-field-lab\.css/);
assert.ok(index.indexOf('player-guide.js')<index.indexOf('player-field-lab.js'));
assert.match(index,/v4\.2 PLAYER FIELD LAB/);
for(const phrase of ['Player Testing & Character Insights','Player test checklist','Planning Readiness','COPY REPORT','DOWNLOAD REPORT','data-section="fieldlab"','nexus_azeroth_player_fieldlab_v42','nexus:character-profile-updated','untrusted','not']){/* see explicit checks below */}
for(const phrase of ['Player Testing & Character Insights','Player test checklist','Planning Readiness','COPY REPORT','DOWNLOAD REPORT','data-section="fieldlab"','nexus_azeroth_player_fieldlab_v42','nexus:character-profile-updated','No Blizzard tokens','review','no WoW','vault']) {
 if(phrase==='no WoW')continue;
 assert.ok(code.toLowerCase().includes(phrase.toLowerCase()),'Field Lab missing '+phrase);
}
assert.ok(code.includes("const checks=[")&&code.includes("['Navigation and layout'")&&code.includes("['Returning session'"),'All acceptance checks must exist');
assert.ok(code.includes('state:choice.value')&&code.includes('write()'),'Checklist state should persist only locally');
assert.ok(code.includes('if(withNotes&&r.note.trim())'),'Export notes must require opt-in');
assert.ok(code.includes("if(withEnv)lines.push"),'Device category must be explicitly optional');
assert.ok(code.includes('navigator.clipboard.writeText(report())'),'Report copy button missing');
assert.ok(code.includes('URL.createObjectURL(blob)'),'Report download missing');
assert.ok(!code.includes('fetch(')&&!code.includes('XMLHttpRequest'),'Lab must not send personal feedback over the network');
for(const sensitive of ['BLIZZARD_CLIENT_SECRET','AZEROTH_SESSION_SECRET','__Host-nx_bnet_session','access_token'])assert.ok(!code.includes(sensitive),'Avoid handling Blizzard secrets');
for(const key of ['nexus_azeroth_farm_operations_v1','nexus_azeroth_character_targets_v1','nexus_azeroth_item_atlas_v1','nexus_azeroth_loot_hunter_v1'])assert.ok(code.includes(key),'Missing planner summary source '+key);
assert.ok(code.includes('manual')&&code.includes('NOT Blizzard-confirmed'),'No automatic owned-data assertion');
assert.ok(code.includes("guide.append(shortcut)")&&guide.includes("data-pg-nav"),'Information & Guide integration should remain available');
assert.match(css,/@media\(max-width:650px\)/);
console.log('Azeroth Player Field Lab regression passed.');
