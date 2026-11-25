/* PROXIMUS v4.1 — deterministic private cinema metadata, filters and regression checks. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {CINEMA_FILTERS,CINEMA_SORTS,normalizeCinemaTags,normalizeCinemaMetadata,
 filterCinemaCatalog,cinemaLibraryStats,cinemaCatalogSnapshot} from '../cinema-intelligence-core-v4.1.js';
const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const movies=[
 {id:'a',name:'First clip.mp4',bytes:10_000,added:100,collection:'Fantasy',favorite:true,watchLater:false,
  duration:100,watched:0,position:0,tags:['Wizards','Snow'],synopsis:'Hero of ice',releaseYear:2024},
 {id:'b',name:'Second.mp4',bytes:20_000,added:300,collection:'Clips',favorite:false,watchLater:true,
  duration:600,watched:900,position:120,tags:['Science fiction'],synopsis:'Future worlds',displayTitle:'Another Journey'},
 {id:'c',name:'Third.mp4',bytes:30_000,added:200,collection:'Movies',favorite:false,watchLater:false,
  duration:7200,watched:600,position:0,tags:[],synopsis:'',displayTitle:'Moonlit'},
 {id:'d',name:'Fourth.mp4',bytes:40_000,added:50,collection:'Other',favorite:false,watchLater:false,
  duration:0,watched:0,position:0,tags:[],synopsis:''}
];
const before=JSON.stringify(movies);
assert.deepEqual(normalizeCinemaTags(' Snow,  snow ; WIZARDS,  ,  Ice'),['Snow','WIZARDS','Ice']);
assert.deepEqual(normalizeCinemaTags(['  Tag','TAG','Go  Home']),['Tag','Go Home']);
assert.equal(normalizeCinemaTags('1,2,3,4,5,6,7,8,9,10').length,8);
assert.equal(normalizeCinemaTags('abcdefghijklmnopqrstuvwxyz').join(''),'abcdefghijklmnopqrstuvwxy');
assert.deepEqual(normalizeCinemaMetadata({releaseYear:0}).releaseYear,null);
const edit=normalizeCinemaMetadata({displayTitle:'   New Title  ',releaseYear:'2025',
 tags:'Night, fantasy, NIGHT',synopsis:'My private note'});
assert.equal(edit.displayTitle,'New Title');assert.equal(edit.releaseYear,2025);
assert.deepEqual(edit.tags,['Night','fantasy']);assert.equal(edit.synopsis,'My private note');
assert.equal(normalizeCinemaMetadata({releaseYear:1870}).releaseYear,null);
assert.equal(normalizeCinemaMetadata({displayTitle:'a'.repeat(140)}).displayTitle.length,105);
assert.equal(normalizeCinemaMetadata({synopsis:'z'.repeat(600)}).synopsis.length,450);
assert.deepEqual(CINEMA_FILTERS,['all','unwatched','resume','favorites','watchlist','annotated','short']);
assert.ok(CINEMA_SORTS.includes('last-played'));
const names=a=>a.map(x=>x.id);
assert.deepEqual(names(filterCinemaCatalog(movies,{sort:'name'})),['b','a','d','c']);
assert.deepEqual(names(filterCinemaCatalog(movies,{sort:'recent'})),['b','c','a','d']);
assert.deepEqual(names(filterCinemaCatalog(movies,{filter:'unwatched',sort:'recent'})),['a','d']);
assert.deepEqual(names(filterCinemaCatalog(movies,{filter:'resume'})),['b']);
assert.deepEqual(names(filterCinemaCatalog(movies,{filter:'favorites'})),['a']);
assert.deepEqual(names(filterCinemaCatalog(movies,{filter:'watchlist'})),['b']);
assert.deepEqual(names(filterCinemaCatalog(movies,{filter:'annotated',sort:'recent'})),['b','a']);
assert.deepEqual(names(filterCinemaCatalog(movies,{filter:'short',sort:'recent'})),['b','a']);
assert.deepEqual(names(filterCinemaCatalog(movies,{query:'wizard'})),['a']);
assert.deepEqual(names(filterCinemaCatalog(movies,{query:'journey'})),['b']);
assert.deepEqual(names(filterCinemaCatalog(movies,{query:'2024'})),['a']);
assert.deepEqual(names(filterCinemaCatalog(movies,{query:'future worlds'})),['b']);
assert.deepEqual(names(filterCinemaCatalog(movies,{query:'clip'})),['b','a']);
assert.deepEqual(names(filterCinemaCatalog(movies,{sort:'largest'})),['d','c','b','a']);
assert.equal(JSON.stringify(movies),before,'Filtering cannot change the original library array');
const stats=cinemaLibraryStats(movies);
assert.equal(stats.titles,4);assert.equal(stats.favorites,1);assert.equal(stats.watchlist,1);
assert.equal(stats.continueWatching,1);assert.equal(stats.unwatched,2);assert.equal(stats.annotated,2);
assert.equal(stats.bytes,100000);
const snapshot=cinemaCatalogSnapshot([...movies,{id:'ignored',bytes:0,name:'Missing video'}]);
assert.equal(snapshot.schema,'proximus.cinema.catalog/1');
assert.equal(snapshot.movies.length,4);
assert.equal(snapshot.movies[0].title,'First clip.mp4');
assert.equal(snapshot.movies[1].title,'Another Journey');
assert.ok(snapshot.movies[0].tags.includes('Snow'));
const serialized=JSON.stringify(snapshot);
for(const forbidden of ['posterData','coverBlob','videoBlob','sourceBlob','password','accessToken'])
 assert.ok(!serialized.includes('"'+forbidden+'"'),'Export must not include media bytes or secrets');
assert.equal(serialized.includes('blob:'),false);
const html=read('index.html'),app=read('app.js'),worker=read('sw.js'),version=JSON.parse(read('version.json'));
assert.equal(version.version,'4.1.0');assert.equal(version.studio_count,18);
assert.ok(app.includes("LOCAL='4.1.0'"));
for(const id of ['px41CinemaJournal','px41StatFilms','px41StatFavorites','px41StatWatchlist','px41StatResume',
 'px41FeaturedArt','px41FeaturedTitle','px41FeaturedSummary','px41FeaturedButton',
 'px41Filter','px41Sort','px41ClearFilters','px41ExportCatalog',
 'px41Title','px41Synopsis','px41Tags','px41Year','px41Speed','px41Repeat'])
 assert.equal(html.split('id="'+id+'"').length,2,id+' appears exactly once');
assert.ok(read('living-cinema-v3.9.js').includes('normalizeCinemaMetadata'));
assert.ok(read('living-cinema-v3.9.js').includes('await updateStoredVideo(item)'));
assert.ok(!read('cinema-intelligence-core-v4.1.js').includes('removeStoredVideo('));
for(const asset of ['cinema-intelligence-core-v4.1.js','cinema-intelligence-v4.1.css','releases/v4.1.0.json'])
 assert.ok(worker.includes("'./"+asset+"'"),asset+' must be cached offline');
assert.ok(worker.includes("const CACHE='proximus-alchemist-v4.1.0'"));
assert.equal(JSON.parse(read('releases/index.json')).releases[0].version,'4.1.0');
for(const file of ['cinema-intelligence-core-v4.1.js','living-cinema-v3.9.js','app.js']){
 const result=spawnSync(process.execPath,['--check',path.join(root,file)],{encoding:'utf8'});
 assert.equal(result.status,0,file+' syntax: '+result.stderr);
}
console.log('PASS v4.1 cinema journal, metadata search, filters, safe catalog and preserved Video Vault');
