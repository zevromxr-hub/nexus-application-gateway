/* Regression guards for Azeroth v4.0 Sovereign Core. Executed in GitHub Actions. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'../..');
const read=p=>readFile(path.join(root,'azeroth-companion',p),'utf8');
const html=await read('index.html');
for(const asset of ['sovereign-vault.js','sovereign-vault.css','character-handoff.js','character-handoff.css','verified-connection.js','adaptive-navigation.js','command-launcher.js','unified-dashboard.js']){
 assert.ok(html.includes('./'+asset),'Main app missing '+asset);
}
assert.ok(html.includes('./sovereign-vault.js'),'Sovereign v4 component must remain mounted across future app releases');
const vault=await read('sovereign-vault.js');
const handoff=await read('character-handoff.js');
const connection=await read('verified-connection.js');
const nav=await read('adaptive-navigation.js');
const launcher=await read('command-launcher.js');
const dashboard=await read('unified-dashboard.js');
for(const [name,src] of [['vault',vault],['handoff',handoff],['connection',connection],['nav',nav],['launcher',launcher],['dashboard',dashboard]]){
 new vm.Script(src,{filename:name+'.js'});
}
const requiredKeys=['nexus_azeroth_companion_genesis_v1','nexus_azeroth_overdrive_v1','nexus_azeroth_player_utility_v1','nexus_azeroth_connected_v2','nexus_azeroth_armory_bookmarks_v1','nexus_azeroth_loot_hunter_v1','nexus_azeroth_farm_operations_v1','nexus_azeroth_item_atlas_v1','nexus_azeroth_character_targets_v1','nexus_azeroth_talent_forge_v1'];
for(const key of requiredKeys)assert.ok(vault.includes(key),'Vault misses original planning store '+key);
for(const phrase of ['format:FORMAT','localStorage.setItem','preview','candidate','confirm(','before=','MAX_FILE','JSON.parse','rollback'])assert.ok(vault.includes(phrase),'Missing vault safety feature '+phrase);
for(const secret of ['BLIZZARD_CLIENT_SECRET','AZEROTH_SESSION_SECRET','__Host-nx_bnet_session'])assert.ok(!vault.includes(secret),'Vault must never reference '+secret);
assert.ok(handoff.includes('confirm('),'Character import requires consent');
assert.ok(handoff.includes('armory_region')&&handoff.includes('armory_realm')&&handoff.includes('armory_name'),'Portal handoff route missing');
assert.ok(handoff.includes('untrusted'),'Character links must not assert authenticated identity');
assert.ok(connection.includes('nexus:account-status')&&connection.includes("aria-live','off"),'Verified status event/accessibility fix missing');
assert.ok(connection.includes('credentials:\'omit\'')&&connection.includes('validUntil'),'No bearer cookies in public verification');
assert.ok(dashboard.includes('nexus:character-profile-updated'),'Local imported profile should refresh dashboard');
const farm=await read('farming-operations.js');
assert.ok(farm.includes("catch(_){message('Another tab"),'Cross-tab JSON recovery missing');
const worker=await read('backend/worker-v4-reference.js');
new vm.Script(worker.replace('export default','const worker ='),{filename:'worker-v4-reference.js'});
for(const marker of ['/account/verify-companion','/api/companion/verify','check_token','CLIENT_V4','PAGE_V4','wow.profile'])assert.ok(worker.includes(marker),'Worker reference missing '+marker);
assert.ok(!/BLIZZARD_CLIENT_SECRET\s*=\s*["']/.test(worker),'No embedded Blizzard secrets');
console.log('Azeroth v4.0 Sovereign Core guards passed.');
