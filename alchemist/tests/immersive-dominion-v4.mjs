/* PROXIMUS v4.0 — deterministic Immersion, Watchlist and Safety suite. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {IMMERSION_KEY,IMMERSION_SCENES,normalizeImmersion,formatStorageBytes,storageRisk} from '../immersion-core-v4.js';
import {buildLivingShelves,chooseCinemaPick} from '../living-cinema-v3.9.js';
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const html=read('index.html'),app=read('app.js'),worker=read('sw.js');
const version=JSON.parse(read('version.json'));
assert.equal(version.version,'4.1.0');assert.equal(version.studio_count,18);assert.equal(version.previous_version,'3.9.0');
assert.equal(IMMERSION_KEY,'proximus-immersion-v400');
assert.deepEqual(Object.keys(IMMERSION_SCENES),['sovereign','frost','obsidian','ember','eclipse']);
const def=normalizeImmersion();assert.equal(def.scene,'sovereign');
assert.equal(def.motion,'auto');assert.equal(def.clarity,'balanced');
assert.deepEqual(normalizeImmersion({scene:'unsafe',intensity:999,glass:-10,motion:'invalid',clarity:'unsafe'}),
 {...def,intensity:100,glass:55});
assert.equal(normalizeImmersion({scene:'frost',motion:'off',clarity:'bright'}).scene,'frost');
assert.equal(formatStorageBytes(0),'0 B');assert.equal(formatStorageBytes(1048576),'1.0 MB');
assert.equal(storageRisk(10,0).state,'unknown');
assert.equal(storageRisk(70,100).state,'good');
assert.equal(storageRisk(80,100).state,'moderate');
assert.equal(storageRisk(98,100).state,'high');
const movies=[
 {id:'one',name:'First',bytes:100000,added:1,watchLater:true,watched:0},
 {id:'two',name:'Second',bytes:200000,added:2,watchLater:false,watched:500},
 {id:'three',name:'Third',bytes:500000,added:3,watchLater:true,watched:0}
];
const original=JSON.stringify(movies);
const shelves=buildLivingShelves(movies);
assert.equal(shelves[0].id,'watchlist');
assert.deepEqual(shelves[0].items.map(x=>x.id),['three','one']);
const filtered=buildLivingShelves(movies,'',{watchlistOnly:true});
assert.equal(filtered[0].items.length,2);
assert.deepEqual(buildLivingShelves(movies,'',{watchlistOnly:true})[0].items.map(x=>x.id),['three','one']);
assert.deepEqual(buildLivingShelves([], '',{watchlistOnly:true}),[]);
assert.equal(chooseCinemaPick(movies,0).id,'one');
assert.equal(chooseCinemaPick(movies,1).id,'three');
assert.equal(chooseCinemaPick([],12),null);
assert.equal(JSON.stringify(movies),original,'Discovery must never mutate saved movie metadata');
for(const id of ['px40Open','px40RealmBanner','px40RealmCustomize','px40StorageOpen',
 'px40Dialog','px40Close','px40CurrentRealm','px40Intensity','px40Glass','px40Motion','px40Clarity',
 'px40Reset','px40Status','px40PersonalArt','px40Cinema','px40Recovery','px40StorageCheck',
 'px40Persistence','px40StorageResults','px40WatchlistFilter','px40Surprise','px40WatchLater']){
 assert.equal(html.split('id="'+id+'"').length,2,id+' must exist once');
}
assert.ok(app.includes('initImmersiveDominion(app)'),'Appearance system must initialize');
assert.ok(read('immersive-dominion-v4.js').includes('initImmersionStorage()'),'Local diagnostics must initialize');
assert.ok(read('immersion-storage-v4.js').includes('listStoredVideos()'),'Library Health must read real local metadata');
assert.ok(read('living-cinema-v3.9.js').includes('item.watchLater=!item.watchLater'),'Watchlist must persist via existing metadata');
assert.ok(!read('immersive-dominion-v4.js').includes('removeStoredVideo('),'Theme system must never delete original videos');
assert.ok(read('immersive-dominion-v4.css').includes('@media(prefers-reduced-motion:reduce)'),'Reduced-motion support required');
for(const asset of ['immersion-core-v4.js','immersion-storage-v4.js','immersive-dominion-v4.js','immersive-dominion-v4.css','releases/v4.0.0.json'])
 assert.ok(worker.includes("'./"+asset+"'"),'v4 offline cache missing '+asset);
assert.ok(worker.includes("const CACHE='proximus-alchemist-v4.1.0'"));
assert.equal(JSON.parse(read('releases/index.json')).releases[0].version,'4.1.0');
for(const file of ['immersion-core-v4.js','immersion-storage-v4.js','immersive-dominion-v4.js','living-cinema-v3.9.js']){
 const check=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
 assert.equal(check.status,0,file+': '+check.stderr);
}
console.log('PASS v4.0 custom realms, local watchlists, smart picks and browser media safety');
