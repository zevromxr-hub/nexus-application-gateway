/* PROXIMUS v3.9.0 — Living Cinema deterministic safety/regression checks. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {buildLivingShelves,normalizePosterCrop,posterSourceRect} from '../living-cinema-v3.9.js';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const items=[
 {id:'a',name:'Dawn',bytes:20000000,position:120,duration:600,favorite:false,added:100,watched:700,collection:'Cinema'},
 {id:'b',name:'Blizzard',bytes:30000000,position:0,duration:800,favorite:true,added:500,watched:0,collection:'Fantasy'},
 {id:'c',name:'Frost',bytes:15000000,position:0,duration:720,favorite:false,added:900,collection:'Fantasy'},
 {id:'d',name:'Ending',bytes:15000000,position:99,duration:100,favorite:true,added:20,collection:'Cinema'}
];
const original=JSON.stringify(items);
const shelves=buildLivingShelves(items);
assert.equal(shelves[0].id,'continue');
assert.deepEqual(shelves[0].items.map(x=>x.id),['a']);
assert.equal(shelves[1].id,'favorites');
assert.deepEqual(shelves[1].items.map(x=>x.id),['b','d']);
assert.equal(shelves[2].id,'recent');
assert.deepEqual(shelves[2].items.map(x=>x.id),['c','b','a','d']);
assert.ok(shelves.some(x=>x.label==='FANTASY'&&x.items.length===2));
assert.deepEqual(buildLivingShelves(items,'blizzard')[0].items.map(x=>x.id),['b']);
assert.equal(buildLivingShelves(items,'does-not-exist').length,0);
assert.equal(JSON.stringify(items),original,'Cinema shelves must not mutate original movie metadata');
const normalized=normalizePosterCrop({zoom:9999,x:-10,y:140,caption:1,color:'red'});
assert.deepEqual(normalized,{zoom:260,x:0,y:100,caption:true,color:'#ffffff'});
assert.deepEqual(posterSourceRect(800,600),{sx:0,sy:75,sw:800,sh:450});
const zoom=posterSourceRect(800,600,{zoom:200,x:100,y:100});
assert.deepEqual(zoom,{sx:400,sy:375,sw:400,sh:225});
assert.throws(()=>posterSourceRect(0,100),/No image/);
const html=read('index.html'),app=read('app.js'),module=read('living-cinema-v3.9.js');
const sw=read('sw.js'),version=JSON.parse(read('version.json'));
assert.equal(version.version,'4.0.0');
assert.equal(version.studio_count,18);
assert.ok(app.includes('initLivingCinema(app)'),'New entertainment module must initialize');
for(const id of ['px39Discovery','px39Search','px39Shelves','px39OpenDiscovery','px39PlayerToolbar','px39Play','px39Back','px39Forward','px39Seek','px39Focus','px39Fullscreen','px39Picture','px39DetailsDialog','px39DetailsArtwork','px39DetailsPlay','px39DetailsFavorite','px39DetailsCollection','px39DetailsPoster','px39PosterDialog','px39PosterCanvas','px39PosterFrame','px39PosterChoice','px39PosterFile','px39PosterZoom','px39PosterX','px39PosterY','px39PosterCaption','px39PosterCaptionEnabled','px39PosterSave','px39PosterExport','px39PosterStatus']){
 assert.ok(html.includes('id="'+id+'"'),id+' is missing from the rendered page');
}
for(const asset of ['living-cinema-v3.9.js','living-cinema-v3.9.css','releases/v3.9.0.json']){
 assert.ok(sw.includes("'./"+asset+"'"),'New release is missing from offline pre-cache: '+asset);
}
assert.ok(html.includes('living-cinema-v3.9.css'),'New visual layer must load');
assert.ok(module.includes('await latestItem(id)')&&module.includes('item.poster=blob')&&module.includes('await updateStoredVideo(item)'),'Poster save writes only the selected metadata poster');
assert.ok(module.includes('proximus-video-vault-watch'),'Video playing must use existing Vault route');
assert.ok(!module.includes('saveStoredVideo(')&&!module.includes('removeStoredVideo('),'New experience must never write or delete original movie bytes');
assert.ok(read('video-vault.js').includes('proximus-video-vault-selected'),'Frame capture must identify exact loaded saved movie');
assert.ok(read('video-vault-core.js').includes("VIDEO_VAULT_DB='proximus-video-vault-v1'"),'Original media DB key must remain unchanged');
assert.ok(sw.includes("const CACHE='proximus-alchemist-v4.0.0'"));
assert.equal(JSON.parse(read('releases/index.json')).releases[0].version,'4.0.0');
for(const file of ['living-cinema-v3.9.js','app.js','video-vault.js']){
 const result=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
 assert.equal(result.status,0,file+': '+result.stderr);
}
console.log('PASS v3.9: living shelves, local poster composition and exact video handoff without media-file writes');
