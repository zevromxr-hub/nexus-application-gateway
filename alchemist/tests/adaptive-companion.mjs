// PROXIMUS v3.4 — safe studio retirement, adaptive PC/iPhone UI and shared exports.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {detectInterfaceMode,safeLayoutChoice,LAYOUT_KEY} from '../layout-adapter-core.js';
import {RETIRED_STUDIOS,ACTIVE_STUDIOS,COMPANION_GROUPS} from '../companion-core.js';
const ROOT=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const html=read('index.html'),app=read('app.js'),css=read('style.css');
const project=read('project-hub.js'),mobile=read('mobile-navigation.js');
const retired={image:'Image Studio',pack:'Asset Packager',production:'Production Lab',
 audit:'Asset Audit',layers:'Layer Forge',motiongraphics:'Motion Graphics'};
assert.equal(ACTIVE_STUDIOS,18);
assert.equal(Object.keys(RETIRED_STUDIOS).length,14);
const activePanels=[...html.matchAll(/<section class="studio" data-panel="([^"]+)"/g)].map(m=>m[1]);
const activeNav=[...html.matchAll(/class="nav[^"]*" data-view="([^"]+)"/g)].map(m=>m[1]);
assert.equal(activePanels.length,20,'18 active spaces + 2 info pages');
assert.equal(activeNav.length,20);
assert.deepEqual([...activePanels].sort(),[...activeNav].sort());
for(const [id,title] of Object.entries(retired)){
 assert.equal(RETIRED_STUDIOS[id],title);
 assert.ok(!activePanels.includes(id),'Retired studio panel must be gone: '+id);
 assert.ok(!activeNav.includes(id),'Retired studio navigation must be gone: '+id);
 assert.ok(!app.includes("{id:'"+id+"',icon:"),'Retired studio registry entry must be gone: '+id);
}
for(const symbol of ['initImage(app)','initProduction(app)','initAudit(app)',
 'initLayerForge(app)','initMotionGraphics(app)']){
 assert.equal(app.includes(symbol),false,'Retired module must never mount: '+symbol);
}
for(const legacy of ['image-tools.js','pro-tools.js','creator-tools.js']){
 assert.equal(fs.existsSync(path.join(ROOT,legacy)),false,'Retired GitHub source must be absent from active tree: '+legacy);
 assert.equal(read('sw.js').includes("'./"+legacy+"'"),false,'SW must not cache retired JS: '+legacy);
}
for(const id of ['packExport','packClear','packList','packSearch','packTitle','packTarget','packCount','vaultReload','vaultInfo','projectCollectedExports']){
 assert.ok(html.includes('id="'+id+'"'),'Shared exporter must be present inside Project Hub: '+id);
}
const pStart=html.indexOf('data-panel="projects"'),pEnd=html.indexOf('data-panel="automation"',pStart);
const region=html.slice(pStart,pEnd);
assert.ok(region.includes('id="packExport"'),'Shared ZIP export must live inside Project Hub');
assert.ok(region.includes('id="packList"'),'Old collected project files must remain reachable');
assert.ok(app.includes("changeView('projects')"),'Pack launcher must open Project Hub');
assert.ok(app.includes("archived.open=true"),'Pack launcher must expand Collected Exports');
assert.ok(project.includes("app.changeView('projects')"),'Old project restores must stay in Project Hub');
assert.ok(!project.includes("['image','Image Studio']"),'Project handoff must exclude retired destinations');
assert.ok(!read('companion-core.js').includes("items:['image'"),'Retired images must not appear in categories');
assert.equal(Object.values(COMPANION_GROUPS).flatMap(c=>c.items).length,ACTIVE_STUDIOS+2);
assert.ok(fs.existsSync(path.join(ROOT,'releases/v3.3.0.json')),'Prior v3.3 rollback manifest must remain');
assert.equal(safeLayoutChoice('desktop'),'desktop');
assert.equal(safeLayoutChoice('mobile'),'mobile');
assert.equal(safeLayoutChoice('nonsense'),'auto');
assert.equal(LAYOUT_KEY,'proximus-adaptive-layout-v1');
const cases=[
 [{width:393,coarse:true,hover:false,ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Safari'},'mobile'],
 [{width:852,coarse:true,hover:false,ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Safari'},'mobile'],
 [{width:1440,coarse:false,hover:true,ua:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'},'desktop'],
 [{width:620,coarse:false,hover:true,ua:'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'},'desktop'],
 [{width:820,coarse:true,hover:false,ua:'Android Tablet'},'mobile'],
 [{width:1100,coarse:true,hover:false,ua:'Android Tablet'},'desktop'],
 [{width:1500,coarse:false,hover:true,ua:'Windows',override:'mobile'},'mobile'],
 [{width:393,coarse:true,hover:false,ua:'iPhone',override:'desktop'},'desktop']
];
for(const [input,mode] of cases)assert.equal(detectInterfaceMode(input).mode,mode,JSON.stringify(input));
assert.equal(detectInterfaceMode({width:620,hover:true,coarse:false}).compact,true);
assert.ok(css.includes('body[data-device-layout="desktop"] .mobile-dock'),'PC must never show mobile dock');
assert.ok(css.includes('body[data-device-layout="mobile"] .mobile-dock'),'Mobile must show bottom dock');
assert.ok(css.includes('overflow-wrap:anywhere'),'Long titles must not cause clipped mobile panels');
for(const id of ['layoutToggle','layoutDialog','layoutChoice','layoutCurrent','layoutStatus','layoutReset','layoutDone']){
 assert.ok(html.includes('id="'+id+'"'),'Missing device layout control '+id);
}
assert.ok(app.includes('initAdaptiveLayout()'),'App startup must initialize device detection');
assert.ok(mobile.includes("document.body.dataset.deviceLayout==='mobile'"),'Mobile shortcut must respect actual layout');
assert.ok(mobile.includes("document.body.dataset.deviceLayout!=='mobile'"),'Touch swipe must be disabled for desktop view');
console.log('PASS v3.4: 6 retired studios absent and inactive source removed; 18 useful spaces; shared ZIP exporter retained in Project Hub; adaptive PC/phone/tablet decisions, manual override and CSS responsive guards.');
