// PROXIMUS Asset Alchemist v2.9 — thumbnail, workspace sync, Reactor III and recovery regression.
import assert from 'node:assert/strict';
import {chooseThumbnail,mediaFitOptions,MASTER_MODES,MASTER_MOTION} from '../media-publisher.js';
import {normalizePins,filterStudios,MODES} from '../command-center.js';
import {SYNC_DATABASES,SYNC_SETTINGS,SYNC_SCHEMA,validateSyncManifest,openSyncArchive} from '../workspace-sync.js';
import {nextReactorScene,normalizeReactorPreset,REACTOR_SCENES} from '../reactor-dsp.js';
import {releaseCheck,RELEASE_ASSETS} from '../release-guard.js';
import {makeZip} from '../core.js';

const master={slot:'master',name:'background.gif'},studio={slot:'studio-reactor',name:'reactor.webp'};
assert.equal(chooseThumbnail(master,studio,'force'),master,'Master should replace all individual thumbs by default');
assert.equal(chooseThumbnail(master,studio,'fallback'),studio,'Per-studio override can take priority');
assert.equal(chooseThumbnail(master,null,'fallback'),master,'Master fills slots with no override');
assert.equal(chooseThumbnail(null,studio),studio);
assert.equal(chooseThumbnail(null,null),null);
assert.deepEqual(MASTER_MODES,['force','fallback']);
assert.ok(MASTER_MOTION.includes('adaptive'));
assert.deepEqual(mediaFitOptions({fit:'contain',opacity:3}),{fit:'contain',opacity:1});
const studios=[
 {id:'image',title:'Image Studio',detail:'Resize artwork'},
 {id:'reactor',title:'Sovereign Reactor',detail:'Music visualizer'},
 {id:'command',title:'Command Center',detail:'Dashboard'}
];
assert.deepEqual(normalizePins(['reactor','reactor','unknown','image'],studios.map(x=>x.id)),['reactor','image']);
assert.equal(filterStudios(studios,'music').length,1);
assert.equal(filterStudios(studios,'',['reactor'],true)[0].id,'reactor');
assert.deepEqual(MODES,['creator','customer']);
assert.equal(SYNC_DATABASES.some(x=>x.name.includes('token')),false,'Token Foundry must be absent from general workspace backups');
assert.equal(SYNC_SETTINGS.some(x=>x.toLowerCase().includes('token')),false,'Token credentials must never be in workspace prefs');
const bin=Uint8Array.from([71,73,70,56,57,97]);
const manifest={
 schema:SYNC_SCHEMA,version:'2.9.0',created:'2026-11-13',
 included:{projects:true,media:true,pack:false,settings:true},
 records:[
  {database:'proximus-sovereign-projects',store:'projects',key:'p1',
   item:{id:'p1',title:'Test Project',notes:'Saved between devices',items:[]}},
  {database:'proximus-alchemist-personal-media',store:'media',key:'master',
   item:{slot:'master',name:'all.gif',mime:'image/gif',mode:'force',fit:'contain',
    blob:{$blob:'blobs/0001.bin',mime:'image/gif',size:bin.byteLength}}}
 ],
 settings:{'proximus-command-layout-v1':'creator'}
};
assert.equal(validateSyncManifest(manifest).records.length,2);
const archive=await makeZip([
 {name:'workspace.json',data:new Blob([JSON.stringify(manifest)],{type:'application/json'})},
 {name:'blobs/0001.bin',data:new Blob([bin],{type:'image/gif'})}
]);
const opened=openSyncArchive(await archive.arrayBuffer());
assert.equal(opened.manifest.records.length,2);
assert.equal(opened.bytes,6);
assert.equal(opened.manifest.records[1].item.blob.$blob,'blobs/0001.bin');
assert.throws(()=>validateSyncManifest({...manifest,records:[{database:'proximus-token-foundry-private-v1',store:'vault',key:'owner',item:{}}]}),/unsupported data store/);
assert.throws(()=>validateSyncManifest({...manifest,settings:{'discord-bot-token':'SECRET'}}),/unexpected settings key/);
assert.throws(()=>validateSyncManifest({...manifest,records:[{database:'proximus-alchemist-personal-media',store:'media',key:'master',item:{blob:{$blob:'../secret.bin',mime:'image/gif',size:10}}}]}),/invalid media path/);
const corrupted=await makeZip([{name:'workspace.json',data:new Blob([JSON.stringify(manifest)])}]);
const corruptedBytes=new Uint8Array(await corrupted.arrayBuffer());
assert.throws(()=>openSyncArchive(corruptedBytes),/missing a media file/);
assert.equal(nextReactorScene('sovereign'),'spectrum');
assert.equal(nextReactorScene('starlight'),'sovereign');
assert.equal(REACTOR_SCENES.length,6);
const preset=normalizeReactorPreset({cycle:true,cycleSeconds:99,autoPerformance:false,overlayBlend:'multiply',overlayOpacity:2});
assert.equal(preset.cycle,true);
assert.equal(preset.cycleSeconds,60);
assert.equal(preset.autoPerformance,false);
assert.equal(preset.overlayOpacity,1);
assert.equal(preset.overlayBlend,'multiply');
const version={version:'2.9.0',studio_count:29},index={releases:[{version:'2.9.0'},{version:'2.8.0'}]};
const check=releaseCheck(version,index,'2.9.0');
assert.equal(check.upToDate,true);
assert.equal(check.studios,29);
assert.equal(releaseCheck(version,index,'2.8.0').newer,true);
assert.throws(()=>releaseCheck(version,{releases:[]},'2.9.0'),/does not contain/);
assert.ok(RELEASE_ASSETS.includes('./media-publisher.js'));
console.log('PASS v2.9: one-upload master thumbnails, priorities, layout preferences, cross-device ZIP with original media, Token Foundry isolation, Reactor III scenes and Release Guard.');
