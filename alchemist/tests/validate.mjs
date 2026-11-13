// PROXIMUS Asset Alchemist v2.2 — offline, dependency-free release checks.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const ROOT=path.resolve(import.meta.dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const version=JSON.parse(read('version.json')),release=JSON.parse(read('releases/v'+version.version+'.json'));
const html=read('index.html'),app=read('app.js'),service=read('sw.js');
const modules=['app.js','core.js','image-tools.js','media-tools.js','pro-tools.js','creator-tools.js','gif-codec.js','animation-tools.js','sw.js'];
for(const f of modules){
 const r=spawnSync(process.execPath,['--check',path.join(ROOT,f)],{encoding:'utf8'});
 assert.equal(r.status,0,f+': '+r.stderr);
}
assert.match(version.version,/^\d+\.\d+\.\d+$/);
assert.equal(version.product,'PROXIMUS | ASSET ALCHEMIST');
assert.equal(release.version,version.version);
assert.equal(version.studio_count,15);
assert.ok(html.includes('v'+version.version),'Page version must match manifest');
assert.ok(app.includes("LOCAL='"+version.version+"'"),'Client version must match manifest');
assert.ok(service.includes('proximus-alchemist-v'+version.version),'Service worker cache must match manifest');
assert.ok(html.includes('PROXIMUS'),'Branded user interface required');
for(const label of ['production','audit','layers','motiongraphics','animation','pack','model','image','batch','icons','sprites','textures','palette','audio','motion']){
 assert.ok(html.includes('data-panel="'+label+'"'),'Missing studio: '+label);
 assert.ok(html.includes('data-view="'+label+'"'),'Missing navigation: '+label);
}
for(const id of ['prodCanvas','prodExport','prodAdd','prodRecipe','auditFiles','auditRun','auditJSON','auditCSV','vaultStatus','vaultReload','vaultInfo','versionInfo','versionCheck','layerCanvas','layerFiles','layerSave','layerLoad','layerExport','layerAdd','graphicsCanvas','graphicsPreview','graphicsRecord','graphicsAdd','animFile','animVideo','animGif','animResult','animConvert','animToPack','animIcons','animFPS','iconGifExport','iconGifStatus']){
 assert.ok(html.includes('id="'+id+'"'),'Missing functional control: '+id);
}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate UI IDs found');
for(const file of ['./index.html','./style.css','./app.js','./core.js','./image-tools.js','./media-tools.js','./pro-tools.js','./creator-tools.js','./animation-tools.js','./gif-codec.js','./version.json','./icon.svg','./manifest.webmanifest']){
 assert.ok(service.includes(file),'Cache missing '+file);
 assert.ok(fs.existsSync(path.join(ROOT,file)),'Source missing '+file);
}
assert.ok(read('pro-tools.js').includes('export function initProduction'));
assert.ok(read('pro-tools.js').includes('export function initAudit'));
assert.ok(read('creator-tools.js').includes('export function initLayerForge'));
assert.ok(read('creator-tools.js').includes('export function initMotionGraphics'));
assert.ok(app.includes('initLayerForge(app)')&&app.includes('initMotionGraphics(app)'));
assert.ok(app.includes('initProduction(app)')&&app.includes('initAudit(app)'));
assert.ok(read('creator-tools.js').includes('MediaRecorder'),'Real in-browser WebM encoder required');
assert.ok(read('animation-tools.js').includes('export function initAnimationForge'));
assert.ok(read('animation-tools.js').includes('export async function makeAnimatedIconPack'));
assert.ok(app.includes('initAnimationForge(app)'));
assert.ok(read('gif-codec.js').includes('GIF89a'));
assert.ok(read('image-tools.js').includes('makeAnimatedIconPack(iconMaster'));
const gifTest=spawnSync(process.execPath,[path.join(ROOT,'tests/gif-roundtrip.mjs')],{encoding:'utf8'});
assert.equal(gifTest.status,0,'GIF89a source round-trip: '+gifTest.stderr+' '+gifTest.stdout);
assert.ok(app.includes('initProduction(app)')&&app.includes('initAudit(app)'));
assert.ok(app.includes('indexedDB'),'Persistent pack vault must be wired');
assert.ok(app.includes('setupVersion()'),'Release check must be wired');
assert.ok(fs.existsSync(path.join(ROOT,'CHANGELOG.md')));
console.log('PASS: Proximus Alchemist '+version.version+' — 15 studios, imports, versions, PWA assets, vault, audit and production controls');
