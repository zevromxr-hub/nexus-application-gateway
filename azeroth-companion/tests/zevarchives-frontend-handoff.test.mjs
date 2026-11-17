/* NEXUS / ZevArchives safe frontend-only handoff test. */
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const dir=path.dirname(fileURLToPath(import.meta.url));
const read=name=>readFileSync(path.join(dir,'..',name),'utf8');
const source=read('verified-connection.js');
const handoff=read('character-handoff.js');
const bundle=read('scripts-experience-v5.2.js');
const oldDomain='https://zevromxr-hub.github.io';
const custom='https://zevarchives.com';
assert.ok(source.includes("location.origin==='https://zevarchives.com'"));
assert.ok(source.includes("?site=zevarchives"));
assert.ok(source.includes(oldDomain)===false,'Frontend should not rewrite site origin globally');
assert.ok(source.includes("const CHECK=WORKER+'/account/verify-companion'"),'Verify route must remain first-party Worker route');
assert.ok(source.includes("account.href=WORKER+'/account'"),'Account portal route must be unchanged');
for(const text of [handoff,bundle]){
  assert.ok(text.includes("if(location.origin==='https://zevarchives.com')"),'Only branded origin should receive new return URLs');
  assert.ok(text.includes("accountLink.href+='?site=zevarchives'"));
  assert.ok(text.includes("proofLink.href+='?site=zevarchives'"));
  assert.ok(text.includes('https://nexus-azeroth-api.zevromxr.workers.dev/account/verify-companion'),'Preserve original Worker endpoint');
}
assert.ok(bundle.includes("const CHECK=WORKER+'/account/verify-companion'+(location.origin==='https://zevarchives.com'?'?site=zevarchives':'')"));
assert.ok(bundle.includes("account.href=WORKER+'/account'+(location.origin==='https://zevarchives.com'?'?site=zevarchives':'')"));
assert.ok(!handoff.includes('http://zevarchives.com'),'Never construct HTTP login redirect');
console.log('PASS ZevArchives safe frontend handoff — both exact domains, unchanged Worker endpoints, preserved legacy behavior');
