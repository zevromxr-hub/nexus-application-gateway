/* NEXUS | AZEROTH v4.9 — Website stability & long-scroll static guards */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
const root=path.resolve(import.meta.dirname,'..');
const read=name=>readFile(path.join(root,name),'utf8');
const [html,experience,portal,adaptive,css,browser,workflow]=await Promise.all([
 'index.html','sovereign-experience.js','sovereign-portal.js',
 'adaptive-navigation.js','sovereign-portal.css',
 'tests/stability-audit.browser.mjs','../.github/workflows/azeroth-device-audit.yml'
].map(read));
for(const [name,s] of [['experience',experience],['portal',portal],['adaptive',adaptive]])new vm.Script(s,{filename:name+'.js'});
const inline=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
assert.equal(inline.length,1);
new vm.Script(inline[0]);
assert.match(html,/v4\.9 STABILITY ENGINE/);
assert.ok(inline[0].includes("current!==view"),'Reopening current view must not emit another activation');
assert.ok(inline[0].includes("new CustomEvent('nexus:view-activated'"),'Original view event remains source of truth');
assert.ok(experience.includes("document.addEventListener('nexus:view-activated'"),'Website shell refreshes once per navigation');
assert.ok(portal.includes("document.addEventListener('nexus:view-activated',refreshContext)"),'Breadcrumb follows canonical view event');
assert.ok(adaptive.includes("document.addEventListener('nexus:view-activated',updateActive)"),'Mobile bar follows canonical view event');
assert.ok(!experience.includes('activeObserver.observe(nav'),'No observer over every navigation-button class mutation');
assert.ok(!portal.includes('observer.observe(nav'),'Breadcrumb must not observe dozens of button classes');
assert.ok(adaptive.includes("observer.observe(nav,{childList:true,subtree:false})"),'Menu still handles dynamic tool insertion');
assert.ok(experience.includes("next.every((id,i)=>id===data.recent[i])"),'Duplicate recent navigation must not write local storage or redraw');
assert.ok(!experience.includes("btn.click();recordVisit(id)"),'Navigation shell must not double-save direct homepage actions');
assert.ok(css.includes('@supports (content-visibility:auto)'),'Offscreen painting should be feature gated');
for(const selector of ['#itemAtlas .atlas-entry','#progressCommand .pc-record','#characterDominion .cd-record','#lootHunter .loot-entry','#nexusPlayerGuide .pg-tool','data-section="progress"']){
 assert.ok(css.includes(selector),'Missing long-list paint optimization '+selector);
}
assert.ok(css.includes('contain-intrinsic-size:auto 96px'),'Long-list rows need intrinsic-size fallback to mitigate scrolling jumps');
assert.ok(html.includes('./styles-experience-v4.9.css')&&html.includes('./scripts-experience-v4.9.js'));
assert.equal((html.match(/<link rel="stylesheet" href=/g)||[]).length,2);
assert.equal((html.match(/<script defer src=/g)||[]).length,2);
assert.ok(workflow.includes('stability-audit.browser.mjs'),'CI must run the navigation and long-list browser test');
assert.ok(browser.includes("Storage.prototype.setItem")&&browser.includes("320"),'Browser regression must measure local preference writes and long lists');
assert.ok(browser.includes("webkit")&&browser.includes("chromium"),'Phone WebKit and desktop Chromium must both be covered');
for(const src of [experience,portal,adaptive]){
 for(const forbidden of ['BLIZZARD_CLIENT_SECRET','AZEROTH_SESSION_SECRET','__Host-nx_bnet_session','access_token','/api/me/'])
  assert.ok(!src.includes(forbidden),'Public website shell must not handle account secrets or private API data');
}
console.log('Azeroth v4.9 site stability and long-list static regression passed.');
