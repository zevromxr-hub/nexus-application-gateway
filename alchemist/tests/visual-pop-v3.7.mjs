/* PROXIMUS Asset Alchemist v3.7 — visual/media upgrade with original data safety */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {normalizeVisualPop,VISUAL_POP_KEY} from '../visual-pop-v3.7.js';
import {coverType} from '../video-vault-visual-v3.7.js';
import {normalizeIconCrop,computeCrop} from '../home-icon-studio-v3.7.js';
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),publisher=read('media-publisher.js'),vault=read('video-vault.js'),
 covers=read('video-vault-visual-v3.7.js'),app=read('app.js'),css=read('visual-pop-v3.7.css'),
 sw=read('sw.js'),manifest=JSON.parse(read('version.json'));
assert.equal(manifest.version,'3.7.1');
const icon=normalizeIconCrop({zoom:500,x:-10,y:55,background:'#bad',frame:'none'});
assert.deepEqual(icon,{zoom:300,x:0,y:55,background:'#111225',frame:'none'});
const crop=computeCrop(800,600,180);
assert.equal(crop.sx,100);assert.equal(crop.sy,0);
assert.equal(crop.sw,600);assert.equal(crop.sh,600);
assert.equal(computeCrop(800,600,180,{zoom:200}).sw,300);
assert.throws(()=>computeCrop(0,600,180),/dimensions/);
assert.equal(manifest.studio_count,18);
assert.equal(VISUAL_POP_KEY,'proximus-visual-pop-v370');
assert.equal(normalizeVisualPop().preview,'balanced');
assert.equal(normalizeVisualPop({preview:'cinema',saturation:1000,brightness:1,panels:0,contrast:999}).preview,'cinema');
assert.equal(normalizeVisualPop({saturation:1000}).saturation,165);
assert.equal(normalizeVisualPop({brightness:1}).brightness,95);
assert.equal(normalizeVisualPop({panels:0}).panels,55);
assert.equal(normalizeVisualPop({contrast:999}).contrast,135);
assert.equal(coverType({name:'my.gif',size:1200000}),'image/gif');
assert.equal(coverType({name:'motion.MP4',size:2000000}),'video/mp4');
assert.equal(coverType({name:'motion.webm',size:2000000}),'video/webm');
assert.throws(()=>coverType({name:'bad.txt',size:2000}),/local GIF/);
assert.throws(()=>coverType({name:'too-large.gif',size:13*1024*1024}),/12 MB/);
assert.throws(()=>coverType({name:'too-large.mp4',size:19*1024*1024}),/18 MB/);
for(const id of ['mediaVisualProfile','mediaThumbVibrancy','mediaThumbContrast','mediaBackdropBoost',
 'mediaPanelVisibility','mediaCinematicPreset','mediaVisualReset','mediaVisualPopStatus','videoVaultUpdatePoster','homeIconFile','homeIconUseMaster','homeIconPreview','homeIconZoom','homeIconX','homeIconY','homeIconBackground','homeIconFrame','homeIconExport180','homeIconExport512','homeIconShare','homeIconCopyUrl','homeIconReset','homeIconStatus']){
 assert.ok(html.includes('id="'+id+'"'),id+' control missing from existing studio');
}
assert.ok(app.includes('initVisualPop();initMediaPublisher();initHomeIconStudio();initVideoVault(app);initWebCinemaGateway();initVaultVisualCovers()'));
assert.ok(html.includes('./visual-pop-v3.7.css')&&html.includes('./home-icon-studio-v3.7.css'));
assert.ok(read('home-icon-studio-v3.7.js').includes('canvas.toBlob'));
assert.ok(read('home-icon-studio-v3.7.js').includes('Shortcuts')&&read('home-icon-studio-v3.7.js').includes('180'));
assert.ok(publisher.includes('proximus-home-icon-master-result'),'Saved master media must be reusable by Icon Studio');
assert.ok(css.includes('--pv-panel-alpha')&&css.includes('--pv-saturation'));
assert.ok(publisher.includes('cv.width=960')&&publisher.includes('cv.height=540'));
assert.ok(publisher.includes('clearPoster(')&&publisher.includes('onScreen('));
assert.ok(publisher.includes('animationLimit()'));
assert.ok(vault.includes('canvas.width=960')&&vault.includes('maybeCreatePoster(true)'));
assert.ok(covers.includes("return type.startsWith('video/')?18*1024*1024:12*1024*1024")===false);
assert.ok(covers.includes("observer.observe(cover)")&&covers.includes("lazyCards.set(cover,state)"),'IntersectionObserver must watch visible cards, not hidden video');
assert.ok(covers.includes('video-vault-art-video')&&covers.includes('video-vault-art-image'));
assert.ok(covers.includes('listCoverKeys()')&&covers.includes('getCoverArt(state.id)'),
 'Artwork panel must read key inventory and fetch selected visible covers, not clone every binary record');
assert.ok(!covers.includes('listCoverArt()'),'Old eager all-blob cover listing must remain retired');
assert.ok(covers.includes('memoryBudget=mobile?32*1024*1024')&&covers.includes('trimHidden()'),
 'iPhone cover memory must be bounded while the original data stays stored');
assert.ok(vault.includes('proximus-video-vault-removed'),'Movie deletion should trigger cover cleanup only after success');
assert.ok(covers.includes("document.addEventListener('proximus-video-vault-removed'")&&covers.includes('deleteCoverArt(id)'),
 'Standalone artwork must be cleaned on movie delete');
assert.ok(covers.includes('videoVaultCleanCovers')&&html.includes('id="videoVaultCoverIntegrity"'),
 'Safe cleanup and artwork health controls must be present');
assert.ok(publisher.includes('const rows=await Promise.all(list.map(diskRecord))')&&
 publisher.includes("const tr=db.transaction(STORE,'readwrite')")&&
 publisher.includes('if(replace)store.clear()')&&
 publisher.includes('for(const row of rows)store.put(row)'),
 'Restoring thumbnails must be one atomic IndexedDB transaction with no partial clear');
assert.ok(publisher.indexOf("await tx('readwrite',store=>store.delete(slot))")<publisher.indexOf("mediaRecords.delete(slot)"),
 'Media removal must commit first, then change visible background state');
assert.ok(read('sovereign-polish-v3.7.1.css').includes('@media (prefers-reduced-motion:reduce)'));
assert.ok(read('sovereign-polish-v3.7.1.css').includes('width:calc(100vw - 246px)')&&read('sovereign-polish-v3.7.1.css').includes('overflow-x:clip'));

assert.ok(html.includes('./sovereign-polish-v3.7.1.css'));
assert.ok(covers.includes("COVER_DB='proximus-video-vault-covers-v370'")&&covers.includes('saveCoverArt(id,file,type,still)')&&covers.includes('deleteCoverArt(id)'),'Cover save/reset must use independent browser-local storage');
assert.ok(!covers.includes('removeStoredVideo(')&&!covers.includes('updateStoredVideo('),'Visual update must not rewrite or delete original movie metadata');
assert.ok(read('video-vault-core.js').includes("VIDEO_VAULT_DB='proximus-video-vault-v1'"),'Original video storage key must remain unchanged');
for(const file of ['visual-pop-v3.7.js','visual-pop-v3.7.css','video-vault-visual-v3.7.js','home-icon-studio-v3.7.js','home-icon-studio-v3.7.css','releases/v3.7.1.json']){
 assert.ok(sw.includes("'./"+file+"'"),'Offline cache missing '+file);
 assert.ok(fs.existsSync(path.join(root,file)),file+' missing');
}
assert.ok(sw.includes("const CACHE='proximus-alchemist-v3.7.1'"));
assert.equal(JSON.parse(read('releases/index.json')).releases[0].version,'3.7.1');
assert.equal(JSON.parse(read('releases/v3.7.1.json')).version,'3.7.1');
for(const name of ['visual-pop-v3.7.js','home-icon-studio-v3.7.js','video-vault-visual-v3.7.js','media-publisher.js','video-vault.js','app.js','tests/visual-pop-v3.7.browser.mjs']){
 const p=spawnSync(process.execPath,['--check',path.join(root,name)],{encoding:'utf8'});
 assert.equal(p.status,0,name+': '+p.stderr);
}
console.log('PASS v3.7: vivid local GIF/MP4/WebM covers, iPhone preview limits, 960p stills, original media data isolation and cached release');
