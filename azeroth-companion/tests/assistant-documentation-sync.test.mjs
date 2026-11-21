/* Release documentation contract: new user-facing versions must refresh the
 * current help, assistant, release records and tester guide together.
 * This is a deterministic source check, not an automated gameplay sign-off. */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
const root=new URL('../',import.meta.url);
const read=async name=>readFile(new URL(name,root),'utf8');
const [versionText,indexText,knowledgeText,assistant,handbook,guide,journey,tester,releases,changelog,bubble]=await Promise.all(
 ['version.json','releases/index.json','azeroth-assistant-knowledge.json',
  'azeroth-assistant.html','player-handbook.html','player-guide.js','assistant-journey-v7.9.9.js',
  'player-test-checklist.html','release-notes.html','CHANGELOG.md','assistant-bubble-v7.9.8.js'].map(read));
const version=JSON.parse(versionText),index=JSON.parse(indexText),knowledge=JSON.parse(knowledgeText);
const tag=version.version;
assert.match(tag,/^\d+\.\d+\.\d+$/);
assert.equal(index.releases[0].version,tag,'Release index must lead with the current version');
const release=JSON.parse(await read('releases/v'+tag+'.json'));
assert.equal(release.version,tag,'The detailed release manifest must exist');
assert.ok(changelog.startsWith('## v'+tag+' —'),'Changelog must start with the current release');
assert.equal(knowledge.schema,'nexus.azeroth.assistant-knowledge/1');
assert.equal(knowledge.last_reviewed_release,tag,'Assistant data pack must be reviewed for this release');
assert.equal(knowledge.edition,tag);
assert.ok(knowledge.articles.length>=32);
const ids=knowledge.articles.map(x=>x.id);
assert.equal(new Set(ids).size,ids.length,'Assistant article IDs must be unique');
for(const id of ['start','status','atlas-now','atlas-items','atlas-farming','atlas-fullscreen','atlas-sources','atlas-saved','site-simplification','assistant-updates']){
 assert.ok(ids.includes(id),'Missing current assistant topic '+id);
}
for(const article of knowledge.articles){
 assert.ok(article.answer.length>40,article.id+' lacks guidance');
 assert.ok(article.question.length>10,article.id+' lacks a meaningful question');
 assert.ok(Array.isArray(article.keywords)&&article.keywords.length>=3);
 assert.ok(typeof article.link==='string'&&article.link.length>0);
}
assert.ok(assistant.includes("const FILE='./azeroth-assistant-knowledge.json?v=2401'"));
assert.ok(assistant.includes("fetch('./version.json',{cache:'no-store'})"),'Assistant status must use live public release metadata');
assert.ok(!assistant.includes("const FILE='./azeroth-assistant-knowledge-v7.9.7.json"));
assert.ok(bubble.includes("u.searchParams.set('v','2401')"),'Mini assistant must load updated full-page knowledge');
assert.ok(journey.includes('World Atlas')&&journey.includes('native modal'));
assert.ok(guide.includes("const DOCS_RELEASE_VERSION='"+tag+"'"),'In-app player guide review must match release');
for(const [file,value] of [['Player Handbook',handbook],['Assistant HTML',assistant],['Tester report',tester]]){
 assert.ok(value.includes('data-nx-docs-reviewed-version="'+tag+'"'),file+' review stamp is stale');
}
for(const term of ['World Atlas &amp; Atlas Intelligence','Save to Item Atlas','Add Farm Goal','Exit Map','Copy Game Pin']){
 assert.ok(handbook.includes(term),'Current handbook missing '+term);
}
for(const term of ['data-test-group="World Atlas v24 Intelligence and iPhone"','native fullscreen','Thunderfury','The Stonevault']){
 assert.ok(tester.includes(term),'Tester instructions missing '+term);
}
assert.ok(releases.includes("fetch('./releases/index.json'"),'Release history must use the current public index');
assert.ok(!releases.includes('Owner-approved release: v16.5.0'),'Stale featured release should not appear as current');
for(const [name,source] of [['Embedded Player Guide',guide],['Assistant Journey',journey],['Mini Assistant',bubble]]){
 new vm.Script(source,{filename:name});
}
const scripts=[...assistant.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)];
for(const [i,m] of scripts.entries())if(m[1].trim())new vm.Script(m[1],{filename:'assistant-inline-'+i});
assert.ok(!/BLIZZARD_CLIENT_SECRET|AZEROTH_SESSION_SECRET/.test(knowledgeText));
console.log('PASS release docs: '+tag+' manifest, handbook, assistant, mini, guide, journeys, tests, history');
