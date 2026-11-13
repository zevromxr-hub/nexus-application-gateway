// Release history, productivity and utility feature smoke tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {webcrypto} from 'node:crypto';
if(!globalThis.crypto)globalThis.crypto=webcrypto;
import {normalizeWorkflow,workflowStats} from '../workflow-desk.js';
import {transformText,textStats,randomPassword,renamePlan} from '../utility-forge.js';
const root=path.resolve(import.meta.dirname,'..');
const index=JSON.parse(fs.readFileSync(path.join(root,'releases/index.json'),'utf8'));
const version=JSON.parse(fs.readFileSync(path.join(root,'version.json'),'utf8'));
assert.equal(index.releases[0].version,version.version);
assert.equal(index.releases.length,new Set(index.releases.map(x=>x.version)).size);
for(const entry of index.releases){
 const record=JSON.parse(fs.readFileSync(path.join(root,'releases/v'+entry.version+'.json'),'utf8'));
 assert.equal(record.version,entry.version,'Release manifest version must match index');
}
const workflow=normalizeWorkflow({notes:[{id:'one',title:'Idea',body:'Prototype'}],tasks:[
 {id:'a',text:'Design',done:true},{id:'b',text:'Build',done:false}],focus:25});
assert.equal(workflow.notes[0].body,'Prototype');
assert.deepEqual(workflowStats(workflow),{total:2,complete:1,remaining:1,percent:50});
const backup=normalizeWorkflow(JSON.parse(JSON.stringify(workflow)));
assert.deepEqual(backup,workflow);
assert.equal(transformText(' a \n\n b ','trim'),'a\nb');
assert.equal(transformText('cat\ncat\ndog','unique'),'cat\ndog');
assert.equal(transformText('b2\na1\nb1','sort'),'a1\nb1\nb2');
assert.equal(transformText('{"a":1}','json-pretty'),'{\n  "a": 1\n}');
assert.equal(transformText('{"a": 1}','json-min'),'{"a":1}');
const japanese='💜 PROXIMUS 日本語';
assert.equal(transformText(transformText(japanese,'b64-enc'),'b64-dec'),japanese);
assert.equal(transformText(transformText('https://example.com/path?q=💕','url-enc'),'url-dec'),'https://example.com/path?q=💕');
assert.deepEqual(textStats('one\n two'),{characters:8,words:2,lines:2,bytes:8});
const pass=randomPassword(48,{lower:true,upper:true,digits:true,symbols:true});
assert.equal(pass.length,48);assert.match(pass,/^[A-Za-z0-9!@#$%&*_\-+=?]+$/);
assert.notEqual(pass,randomPassword(48));
assert.throws(()=>randomPassword(24,{lower:false,upper:false,digits:false,symbols:false}),/Select at least one/);
assert.deepEqual(renamePlan(['a.png','a.png','b.mp4'],{prefix:'N-',suffix:'-R',numbered:true,start:7}),['N-a-R-007.png','N-a-R-008.png','N-b-R-009.mp4']);
console.log('PASS release index, creator productivity exports, Unicode text transforms, random keys and file rename plans');
