/* NEXUS | AZEROTH v4.9 — Website Stability static regression suite */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const read=name=>readFile(path.join(root,name),'utf8');
const [html,experience,portal,css,adaptive,original]=await Promise.all([
'index.html','sovereign-experience.js','sovereign-portal.js','sovereign-experience.css','adaptive-navigation.js','scripts/lean-launch.mjs'].map(read));
new vm.Script(experience,{filename:'sovereign-experience.js'});
new vm.Script(portal,{filename:'sovereign-portal.js'});
assert.ok(html.includes('./sovereign-experience.js'),'v4.9 site shell must remain included across v5 releases');
assert.ok(html.includes('./styles-experience-v5.0.css')&&html.includes('./scripts-experience-v5.2.js'),'Both v4.9 assets must be cache-busted');
assert.ok(html.includes('./styles-core-v5.2.css')&&html.includes('./scripts-core-v4.8.js'),'Unchanged core assets should stay intact');
assert.equal((html.match(/<link rel="stylesheet" href=/g)||[]).length,21);
assert.equal((html.match(/<script defer src=/g)||[]).length,21);
for(const required of ['function scheduleSelectedView()','if(selectedFrame)return','function scheduleMobileSearch()','if(searchFrame)return','if(group.hidden!==hidden)group.hidden=hidden','lastSelectedView','recentSignature','scheduleSelectedView();']){
 assert.ok(experience.includes(required),'Site navigation coalescing missing '+required);
}
assert.ok(experience.includes("document.addEventListener('nexus:view-activated',scheduleSelectedView)"),'View event should update shell without unnecessary observer passes');
assert.ok(experience.includes("const needsExpansion=Boolean"),'Repeated navigation must still reopen a collapsed active group');
assert.ok(experience.includes("if(signature===recentSignature)return"),'Unchanged recent tools must keep their existing button nodes');
assert.ok(experience.includes("btn.click();\n window.scrollTo("),'Navigation must use existing working tool buttons, without a duplicate recordVisit call');
for(const required of ['dataset.spKeys','if(choicesWrap.dataset.spKeys!==knownKeys)','for(const check of choicesWrap.querySelectorAll','focus({preventScroll:true})','function scheduleContext()','if(contextFrame)return','lastContextView']){
 assert.ok(portal.includes(required),'Quick Deck and breadcrumb stabilization missing '+required);
}
assert.ok(portal.includes('persist();renderDeck(id)'),'Existing favorite persistence and focus path must remain');
assert.ok(portal.includes("document.addEventListener('nexus:view-activated',scheduleContext)"),'Breadcrumb must follow existing site navigation');
assert.ok(css.includes('@supports (content-visibility: auto)'),'Long lists should progressively render where the browser supports it');
assert.ok(css.includes('contain-intrinsic-size: auto 90px'),'Offscreen list items need stable intrinsic size estimates');
assert.ok(css.includes('.section.active .list > .entry'),'List paint optimization must be scoped to visible studio lists');
assert.ok(!css.includes('.section{content-visibility'),'Never hide entire sections and break the router');
assert.ok(original.includes("styles-experience-v5.0.css")&&original.includes("scripts-experience-v5.2.js"),'Compiled bundle generator must enforce v4.9 assets');
assert.ok(adaptive.includes('function refreshSearch()'),'Adaptive mobile navigation source remains intact');
for(const banned of ['BLIZZARD_CLIENT_SECRET','AZEROTH_SESSION_SECRET','__Host-nx_bnet_session','access_token']){
 assert.ok(!experience.includes(banned)&&!portal.includes(banned),'Site-only changes must not handle account secrets');
}
console.log('Azeroth v4.9 Website Stability static regression guards passed.');
