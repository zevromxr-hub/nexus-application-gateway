// PROXIMUS Asset Alchemist v2.6 — offline, dependency-free release checks.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
const ROOT=path.resolve(import.meta.dirname,'..'),read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const version=JSON.parse(read('version.json')),release=JSON.parse(read('releases/v'+version.version+'.json'));
const html=read('index.html'),app=read('app.js'),service=read('sw.js');
const modules=['app.js','core.js','image-tools.js','media-tools.js','pro-tools.js','creator-tools.js','gif-codec.js','gif-reader.js','animation-tools.js','media-publisher.js','media-theater.js','arcade-chamber.js','release-center.js','workflow-desk.js','utility-forge.js','portable-kit.js','project-hub.js','automation-lab.js','capture-studio.js','document-forge.js','qr-studio.js','recovery-center.js','sw.js'];
for(const f of modules){
 const r=spawnSync(process.execPath,['--check',path.join(ROOT,f)],{encoding:'utf8'});
 assert.equal(r.status,0,f+': '+r.stderr);
}
assert.match(version.version,/^\d+\.\d+\.\d+$/);
assert.equal(version.product,'PROXIMUS | ASSET ALCHEMIST');
assert.equal(release.version,version.version);
assert.equal(version.studio_count,25);
assert.ok(html.includes('v'+version.version),'Page version must match manifest');
assert.ok(app.includes("LOCAL='"+version.version+"'"),'Client version must match manifest');
assert.ok(service.includes('proximus-alchemist-v'+version.version),'Service worker cache must match manifest');
assert.ok(html.includes('PROXIMUS'),'Branded user interface required');
for(const label of ['production','audit','layers','motiongraphics','animation','theater','arcade','workflow','utility','projects','automation','capture','documents','qr','recovery','releases','creator','pack','model','image','batch','icons','sprites','textures','palette','audio','motion']){
 assert.ok(html.includes('data-panel="'+label+'"'),'Missing studio: '+label);
 assert.ok(html.includes('data-view="'+label+'"'),'Missing navigation: '+label);
}
for(const id of ['prodCanvas','prodExport','prodAdd','prodRecipe','auditFiles','auditRun','auditJSON','auditCSV','vaultStatus','vaultReload','vaultInfo','versionInfo','versionCheck','layerCanvas','layerFiles','layerSave','layerLoad','layerExport','layerAdd','graphicsCanvas','graphicsPreview','graphicsRecord','graphicsAdd','animFile','animVideo','animGif','animResult','animConvert','animToPack','animIcons','animFPS','animMode','animSizePreset','animCustomWidth','animCustomHeight','animKeepRatio','animUseBg','animUseThumb','mediaOpen','mediaDialog','mediaFile','mediaTarget','mediaSave','mediaClear','heroOrb','ambientMedia','iconGifExport','iconGifStatus','theaterFiles','theaterVideo','theaterAudio','theaterImage','theaterPlaylist','theaterPlay','theaterCanvas','theaterEnableAudio','theaterVizPack','theaterMakeBg','cometCanvas','cometStart','pulseTrack','pulseHit','memoryCards','memoryReset','arcadeBest','releaseCards','releaseSearch','releaseCenterStatus','releaseLiveVersion','releaseRefresh','releaseUpdateShortcut','deskNoteList','deskAddNote','deskTitle','deskBody','deskTaskAdd','deskTasks','deskTimer','deskTimerButton','deskBackup','deskImport','utilTextIn','utilAction','utilTextOut','utilRun','utilPassGenerate','utilFiles','utilFilePreview','utilZip','projectSave','projectExport','projectImport','projectList','projectShortcuts','projectAssetList','automationFiles','automationRun','automationPack','automationSaved','captureFile','captureCamera','captureCanvas','captureShare','documentFiles','documentList','documentExport','documentToPack','qrCanvas','qrGenerate','qrCard','recoveryDiagnostics','recoveryRefresh','recoveryClearCache','animExtract','animSaveShare','animOpenGif','animSpeed','animReverse','animCaption','theaterFavorite','theaterExportFavorites','arcadeAchievements','packSearch']){
 assert.ok(html.includes('id="'+id+'"'),'Missing functional control: '+id);
}
const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
assert.equal(new Set(ids).size,ids.length,'Duplicate UI IDs found');
for(const file of ['./index.html','./style.css','./app.js','./core.js','./image-tools.js','./media-tools.js','./pro-tools.js','./creator-tools.js','./animation-tools.js','./gif-codec.js','./gif-reader.js','./media-publisher.js','./media-theater.js','./arcade-chamber.js','./release-center.js','./workflow-desk.js','./utility-forge.js','./portable-kit.js','./project-hub.js','./automation-lab.js','./capture-studio.js','./document-forge.js','./qr-studio.js','./recovery-center.js','./version.json','./icon.svg','./manifest.webmanifest']){
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
assert.ok(read('animation-tools.js').includes('dimensionsForGif'));
assert.ok(read('animation-tools.js').includes("mode.value==='icons'"),'Normal GIF and icon workflows must be independent');
assert.ok(read('animation-tools.js').includes('parseGifFrames'),'GIF fallback must be wired');
assert.ok(read('media-publisher.js').includes('indexedDB'),'Media Publisher must save locally');
assert.ok(read('media-publisher.js').includes("'proximus-media-export'"),'Asset pipeline must connect to media publisher');
assert.ok(app.includes('initMediaPublisher()'),'Media Publisher must be initialized');
assert.ok(read('media-theater.js').includes('export function initMediaTheater'));
assert.ok(read('arcade-chamber.js').includes('export function initArcadeChamber'));
assert.ok(app.includes('initMediaTheater(app)')&&app.includes('initArcadeChamber(app)'));
assert.ok(read('media-theater.js').includes('createAnalyser'),'Real audio-reactive visualizer is required');
assert.ok(read('release-center.js').includes('export async function initReleaseCenter'));
assert.ok(read('workflow-desk.js').includes('export function initWorkflowDesk'));
assert.ok(read('utility-forge.js').includes('export function initUtilityForge'));
assert.ok(app.includes('initWorkflowDesk(app)')&&app.includes('initUtilityForge(app)'));
assert.ok(app.includes('initReleaseCenter()'));
for(const name of ['initProjectHub(app)','initAutomationLab(app)','initCaptureStudio(app)','initDocumentForge(app)','initQRStudio(app)','initRecoveryCenter(app)']){
 assert.ok(app.includes(name),'Missing v2.6 initialization: '+name);
}
assert.ok(read('animation-tools.js').includes("run('frames')"),'Frame ZIP extraction must be present');
assert.ok(read('animation-tools.js').includes('saveOrShare(lastGif'),'Mobile GIF share action must retain user click');
assert.ok(read('portable-kit.js').includes('navigator.share'),'Device file sharing must be available when browser supports it');
assert.ok(app.includes('sendAsset(asset,dest)'),'Asset Packager must support studio routing');
assert.ok(fs.existsSync(path.join(ROOT,'releases/index.json')));
const index=JSON.parse(read('releases/index.json'));
assert.equal(index.releases[0].version,version.version);
for(const record of index.releases)assert.ok(fs.existsSync(path.join(ROOT,'releases/v'+record.version+'.json')),'Missing release history record: '+record.version);
const gifTest=spawnSync(process.execPath,[path.join(ROOT,'tests/gif-roundtrip.mjs')],{encoding:'utf8'});
assert.equal(gifTest.status,0,'GIF89a source round-trip: '+gifTest.stderr+' '+gifTest.stdout);
const fallbackTest=spawnSync(process.execPath,[path.join(ROOT,'tests/gif-fallback.mjs')],{encoding:'utf8'});
assert.equal(fallbackTest.status,0,'GIF Safari fallback: '+fallbackTest.stderr+' '+fallbackTest.stdout);
const sizingTest=spawnSync(process.execPath,[path.join(ROOT,'tests/gif-sizing.mjs')],{encoding:'utf8'});
assert.equal(sizingTest.status,0,'GIF auto/manual size selection: '+sizingTest.stderr+' '+sizingTest.stdout);
const entertainmentTest=spawnSync(process.execPath,[path.join(ROOT,'tests/entertainment.mjs')],{encoding:'utf8'});
assert.equal(entertainmentTest.status,0,'Media Theater and Arcade Chamber: '+entertainmentTest.stderr+' '+entertainmentTest.stdout);
const toolkitTest=spawnSync(process.execPath,[path.join(ROOT,'tests/productivity-releases.mjs')],{encoding:'utf8'});
assert.equal(toolkitTest.status,0,'Release Center and productivity: '+toolkitTest.stderr+' '+toolkitTest.stdout);
const sovereignTest=spawnSync(process.execPath,[path.join(ROOT,'tests/sovereign-engine.mjs')],{encoding:'utf8'});
assert.equal(sovereignTest.status,0,'Sovereign portable/project/PDF/QR engines: '+sovereignTest.stderr+' '+sovereignTest.stdout);
assert.ok(app.includes('initProduction(app)')&&app.includes('initAudit(app)'));
assert.ok(app.includes('indexedDB'),'Persistent pack vault must be wired');
assert.ok(app.includes('setupVersion()'),'Release check must be wired');
assert.ok(fs.existsSync(path.join(ROOT,'CHANGELOG.md')));
console.log('PASS: Proximus Alchemist '+version.version+' — 25 studios + Sovereign Utility Engine + portable GIF export, imports, versions, PWA assets, vault, audit and production controls');
