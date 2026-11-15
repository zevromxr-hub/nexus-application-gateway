/* Player Information Center v4.1 static regression checks. */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const read=n=>readFile(path.join(root,n),'utf8');
const js=await read('player-guide.js');
const css=await read('player-guide.css');
const html=await read('index.html');
new vm.Script(js,{filename:'player-guide.js'});
assert.match(html,/\.\/player-guide\.js/);
assert.match(html,/\.\/player-guide\.css/);
assert.ok(html.indexOf('character-handoff.js')<html.indexOf('player-guide.js'),'Guide should mount after existing tools');
for(const required of ['data-section="guide"','Information & Player Guide','Your first 10 minutes','Tools, practical uses and benefits','How it helps during a WoW session','Which versions does Azeroth support?','Frequently asked questions','Future development','Classic / Anniversary','PTR / Beta','12.1.5','PATCH_REVIEW_DATE','release manifest','wow.profile','Sovereign Data Vault','Connected Character Center']){
 assert.ok(js.includes(required),'Player guide missing '+required);
}
assert.ok(js.includes("fetch('./version.json'")&&js.includes("fetch('./releases/index.json'"),'Version card must use published release metadata');
assert.ok(js.includes('index.releases[0]?.version!==v.version'),'Release manifest integrity check is required');
assert.ok(js.includes('window.scrollTo')&&js.includes('data-pg-nav'),'Tool shortcuts should open real studio views');
assert.ok(js.includes('role="status"')&&css.includes('@media(max-width:740px)'),'Accessible and mobile guide presentation missing');
assert.ok(js.includes("view:'loot',tag:'Manual tracking'"),'Farming Operations is embedded within Loot Hunter');
assert.ok(!/access_token|BLIZZARD_CLIENT_SECRET|AZEROTH_SESSION_SECRET|__Host-nx_bnet_session/.test(js),'Public information guide must not reference auth secrets');
assert.ok(js.includes('NOT VERIFIED FOR CONNECTED DATA')&&js.includes('NOT CERTIFIED'),'No untested Classic or PTR compatibility promises');
assert.ok(js.includes('development priorities, not released features'),'Roadmap must be explicitly noncommittal');
console.log('Player Information Center regression checks passed.');
