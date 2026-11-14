// PROXIMUS | Asset Alchemist v3.2 Companion Edition regressions
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
 RETIRED_STUDIOS,ACTIVE_STUDIOS,COMPANION_GROUPS,COMPANION_LINKS,
 activeStudioList,companionCategory,validateCompanionUrl,cleanCompanionLinks,
 companionWatchlist,companionSavedOverview
} from '../companion-core.js';
const root=path.resolve(import.meta.dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const command=fs.readFileSync(path.join(root,'command-center.js'),'utf8');
const theater=fs.readFileSync(path.join(root,'media-theater.js'),'utf8');
const video=fs.readFileSync(path.join(root,'video-vault.js'),'utf8');
assert.equal(Object.keys(RETIRED_STUDIOS).length,14);
for(const [id,title] of Object.entries(RETIRED_STUDIOS)){
 assert.equal(html.includes('data-panel="'+id+'"'),false,'Retired '+title+' must not render');
 assert.equal(html.includes('data-view="'+id+'"'),false,'Retired '+title+' must not appear in navigation');
 assert.equal(app.includes("{id:'"+id+"',icon:"),false,'Retired '+title+' must not appear in studio registry');
}
for(const oldInit of ['initBatch(app)','initIcons(app)','initSprites(app)','initTextures(app)',
 'initPalette(app)','initAudio(app)','initMotion(app)','initModel(app)']){
 assert.equal(app.includes(oldInit),false,oldInit+' must not mount a retired studio');
}
for(const file of ['media-tools.js','releases/v3.1.0.json','releases/v3.3.0.json']){
 assert.ok(fs.existsSync(path.join(root,file)),'Do not delete archived studio source or prior release '+file);
}
assert.ok(app.includes("if(!names.some(n=>n.id===id))id='command';"),
 'Saved last-view preference must fall back to Companion Center');
const groupIds=Object.values(COMPANION_GROUPS).flatMap(x=>x.items);
assert.equal(new Set(groupIds).size,groupIds.length,'Companion categories cannot duplicate studio entries');
assert.equal(groupIds.length,ACTIVE_STUDIOS+2,'All active studios + info/about must be categorized');
assert.equal(companionCategory('videos'),'entertainment');
assert.equal(companionCategory('workflow'),'everyday');
assert.equal(companionCategory('identity'),'creative');
const active=activeStudioList([
 {id:'audio'},{id:'motion'},{id:'videos'},{id:'workflow'},{id:'tokens'},{id:'icons'}
]);
assert.deepEqual(active.map(x=>x.id),['videos','workflow','tokens']);
assert.equal(validateCompanionUrl('https://example.com/watch?v=1'),'https://example.com/watch?v=1');
for(const url of ['javascript:alert(1)','data:text/html,x','http://example.com',
 'https://user:pass@example.com','not an https url']){
 assert.throws(()=>validateCompanionUrl(url),'Reject unsafe companion link '+url);
}
assert.equal(COMPANION_LINKS,'proximus-companion-links-v1');
const clean=cleanCompanionLinks([
 {id:'abcdefgh-1234',name:'  My Site ',url:'https://example.com'},
 {id:'abcdefgh-1234',name:'duplicate',url:'https://another.com'},
 {id:'bad',name:'Untrusted',url:'javascript:alert(1)'},
 {id:'abcdefgh-5678',name:'Quick notes',url:'https://notes.example.org'}
]);
assert.equal(clean.length,2);
assert.equal(clean[0].name,'My Site');
const list=[
 {id:'a',name:'Favorite movie',bytes:500,added:1,watched:30,position:170,favorite:true},
 {id:'b',name:'Unwatched clip',bytes:100,added:5,watched:0,position:0,favorite:false},
 {id:'c',name:'Another show',bytes:200,added:7,watched:40,position:250,favorite:true}
];
assert.deepEqual(companionWatchlist(list).map(x=>x.id),['c','a']);
assert.deepEqual(companionSavedOverview(list),{saved:3,favorites:2,inProgress:2,totalBytes:800});
for(const id of ['commandVideoCount','commandVideoContinueCount','commandVideoFavoriteCount',
 'commandContinue','commandPocketNotes','commandNotesExport','commandNotesClear','commandLinkName','commandLinkUrl','commandLinkAdd','commandLinks',
 'commandCategory','commandSurprise','commandWatchFavorites','commandWatchLibrary',
 'videoVaultBack10','videoVaultForward30','videoVaultAutoNext','videoVaultSendTheater']){
 assert.ok(html.includes('id="'+id+'"'),'Companion control must exist: '+id);
}
assert.ok(command.includes('proximus-video-vault-watch'));
assert.ok(command.includes('cleanCompanionLinks'));
assert.ok(command.includes('proximus-companion-pocket-notes-v1'));
assert.ok(command.includes('saveOrShare'));
assert.ok(theater.includes('proximus-video-vault-send-theater'));
assert.ok(theater.includes("origin:'theater'"));
assert.ok(video.includes("origin:'videos'"));
assert.ok(video.includes('proximus-companion-playing'));
assert.ok(video.includes('companion-video-mini'));
assert.ok(video.includes('autoNext.checked'));
assert.ok(video.includes('videoVaultBack10'));
assert.ok(fs.readFileSync(path.join(root,'workspace-sync.js'),'utf8').includes('proximus-companion-links-v1'));
assert.ok(!fs.readFileSync(path.join(root,'workspace-sync.js'),'utf8').includes('proximus-video-vault-v1'),
 'Large local video files must never leak into general Sync Bridge');
console.log('PASS Companion: fourteen retired studios protected by Git history, 18 focused spaces, safe legacy routes, video watchlist and personal links.');
