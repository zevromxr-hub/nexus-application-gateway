/* PROXIMUS Asset Alchemist v3.7 — visual/media upgrade with original data safety */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {normalizeVisualPop,VISUAL_POP_KEY} from '../visual-pop-v3.7.js';
import {coverType} from '../video-vault-visual-v3.7.js';
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),publisher=read('media-publisher.js'),vault=read('video-vault.js'),
 covers=read('video-vault-visual-v3.7.js'),app=read('app.js'),css=read('visual-pop-v3.7.css'),
 sw=read('sw.js'),manifest=JSON.parse(read('version.json'));
assert.equal(manifest.version,'3.7.0');
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
 'mediaPanelVisibility','mediaCinematicPreset','mediaVisualReset','mediaVisualPopStatus','videoVaultUpdatePoster']){
 assert.ok(html.includes('id="'+id+'"'),id+' control missing from existing studio');
}
assert.ok(app.includes('initVisualPop();initMediaPublisher();initVideoVault(app);initVaultVisualCovers()'));
assert.ok(html.includes('./visual-pop-v3.7.css'));
assert.ok(css.includes('--pv-panel-alpha')&&css.includes('--pv-saturation'));
assert.ok(publisher.includes('canvas.width=960')&&publisher.includes('canvas.height=540'));
assert.ok(publisher.includes('clearPoster(')&&publisher.includes('onScreen('));
assert.ok(publisher.includes('animationLimit()'));
assert.ok(vault.includes('canvas.width=960')&&vault.includes('maybeCreatePoster(true)'));
assert.ok(covers.includes("return type.startsWith('video/')?18*1024*1024:12*1024*1024")===false);
assert.ok(covers.includes("observer?.observe(cover)"),'IntersectionObserver must watch visible cards, not hidden video');
assert.ok(covers.includes('video-vault-art-video')&&covers.includes('video-vault-art-image'));
assert.ok(covers.includes("updateStoredVideo(item)")&&covers.includes("delete item.coverBlob"),'Cover save/reset must be independent of original movie');
assert.ok(!covers.includes('removeStoredVideo('),'Visual update must not delete originals');
assert.ok(read('video-vault-core.js').includes("VIDEO_VAULT_DB='proximus-video-vault-v1'"),'Original video storage key must remain unchanged');
for(const file of ['visual-pop-v3.7.js','visual-pop-v3.7.css','video-vault-visual-v3.7.js','releases/v3.7.0.json']){
 assert.ok(sw.includes("'./"+file+"'"),'Offline cache missing '+file);
 assert.ok(fs.existsSync(path.join(root,file)),file+' missing');
}
assert.ok(sw.includes("const CACHE='proximus-alchemist-v3.7.0'"));
assert.equal(JSON.parse(read('releases/index.json')).releases[0].version,'3.7.0');
assert.equal(JSON.parse(read('releases/v3.7.0.json')).version,'3.7.0');
for(const name of ['visual-pop-v3.7.js','video-vault-visual-v3.7.js','media-publisher.js','video-vault.js','app.js']){
 const p=spawnSync(process.execPath,['--check',path.join(root,name)],{encoding:'utf8'});
 assert.equal(p.status,0,name+': '+p.stderr);
}
console.log('PASS v3.7: vivid local GIF/MP4/WebM covers, iPhone preview limits, 960p stills, original media data isolation and cached release');
