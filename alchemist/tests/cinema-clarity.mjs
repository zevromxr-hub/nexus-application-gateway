// PROXIMUS v3.5.2 — Cinema Clarity, local music and Arcade Daily regression.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {CINEMA_VIEWS_KEY,normalizeCinemaViews,quickClipWindow} from '../cinema-clarity.js';
import {MUSIC_DB,MUSIC_STORE,MAX_TRACKS,MAX_TRACK_BYTES,isLocalAudio,audioTrackId,sanitizeSavedTrack} from '../music-library-core.js';
import {ARCADE_DAILY_KEY,localDayKey,dailyMission,normalizeDailyProgress,applyDailyAttempt} from '../arcade-daily.js';
const ROOT=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const html=read('index.html'),css=read('cinema-clarity.css'),theater=read('media-theater.js');
const library=read('music-library.js'),arcade=read('arcade-chamber.js'),app=read('app.js');
const sw=read('sw.js'),sync=read('workspace-sync.js'),recovery=read('recovery-center.js');
assert.equal(CINEMA_VIEWS_KEY,'proximus-cinema-views-v1');
assert.deepEqual(normalizeCinemaViews(),{vaultFit:'contain',vaultFocus:false,theaterFit:'contain',theaterWide:false});
assert.deepEqual(normalizeCinemaViews({vaultFit:'cover',vaultFocus:true,theaterFit:'cover',theaterWide:true}),
 {vaultFit:'cover',vaultFocus:true,theaterFit:'cover',theaterWide:true});
assert.equal(normalizeCinemaViews({vaultFit:'javascript',vaultFocus:'yes'}).vaultFit,'contain');
assert.equal(normalizeCinemaViews({vaultFit:'javascript',vaultFocus:'yes'}).vaultFocus,false);
assert.deepEqual(quickClipWindow({playhead:4.4,duration:17,seconds:3}),{start:4.4,end:7.4});
assert.deepEqual(quickClipWindow({playhead:15,duration:17,seconds:8}),{start:9,end:17});
assert.equal(quickClipWindow({playhead:3,duration:0,seconds:5}),null);
assert.equal(MUSIC_DB,'proximus-theater-local-music-v1');
assert.equal(MUSIC_STORE,'tracks');assert.equal(MAX_TRACKS,150);assert.equal(MAX_TRACK_BYTES,250000000);
const song={name:'My Song.mp3',size:456789,type:'audio/mpeg',lastModified:12345};
assert.equal(isLocalAudio(song),true);assert.equal(isLocalAudio({name:'Track.FLAC',size:12}),true);
assert.equal(isLocalAudio({name:'movie.mp4',type:'video/mp4'}),false);
assert.equal(isLocalAudio({name:'random.exe',type:'application/octet-stream'}),false);
assert.equal(audioTrackId(song),'My Song.mp3\u0000456789\u000012345');
assert.throws(()=>audioTrackId({...song,size:250000001}),/250 MB/);
assert.throws(()=>audioTrackId({...song,size:0}),/250 MB/);
const record={id:audioTrackId(song),name:song.name,bytes:song.size,mime:song.type,blob:{size:song.size},addedAt:10};
assert.equal(sanitizeSavedTrack(record).name,'My Song.mp3');
assert.throws(()=>sanitizeSavedTrack({...record,blob:{size:4}}),/damaged/);
const now=new Date(2026,10,13,12);
assert.equal(localDayKey(now),'2026-11-13');
const today=dailyMission(now);
assert.ok(['comet','pulse','memory'].includes(today.game));
const beginning=applyDailyAttempt({},today,today.game,today.target-2);
assert.equal(beginning.completed,false);
const achievement=applyDailyAttempt(beginning,today,today.game,today.target+30);
assert.equal(achievement.completed,true);
assert.equal(achievement.totalCompleted,1);
assert.equal(applyDailyAttempt(achievement,today,today.game,today.target+60).totalCompleted,1,'Challenge can only complete once per local day');
assert.equal(applyDailyAttempt(achievement,today,'other',9999).completed,true);
const tomorrow=dailyMission(new Date(2026,10,14,12));
const nextDay=applyDailyAttempt(achievement,tomorrow,tomorrow.game,tomorrow.target);
assert.equal(nextDay.streak,2);
assert.equal(nextDay.totalCompleted,2);
assert.equal(normalizeDailyProgress({totalCompleted:-5,streak:'broken'}).totalCompleted,0);
assert.equal(ARCADE_DAILY_KEY,'proximus-arcade-daily-v1');
for(const id of ['videoVaultPictureFit','videoVaultFocus','videoVaultClarityReset','videoVaultClarityStatus',
 'theaterVideoFit','theaterWide','theaterViewStatus','theaterMusicCount','theaterMusicSize',
 'theaterMusicSaveCurrent','theaterMusicSaveQueue','theaterMusicRefresh','theaterMusicStatus','theaterMusicSavedList',
 'arcadeDailyTitle','arcadeDailyGoal','arcadeDailyProgress','arcadeDailyScore','arcadeDailyStreak','arcadeDailyPlay','arcadeDailyExport']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Missing or duplicated UI control '+id);
}
for(const seconds of [3,5,8])assert.ok(html.includes('data-animation-clip="'+seconds+'"'),'Quick animation clip preset missing: '+seconds);
assert.ok(css.includes('#videoVaultStudio #videoVaultPlayer'),'Opaque fix must target only saved Vault player');
assert.ok(css.includes('background:#000!important'),'Video matte must be solid black');
assert.ok(css.includes('mix-blend-mode:normal!important'),'Video must not inherit blend mode');
assert.ok(css.includes('backdrop-filter:none!important'),'Disable glass effect directly on player');
assert.ok(css.includes('.video-vault-stage::before'),'Independent opaque backing layer required');
assert.ok(css.includes('.theater-music-library')&&css.includes('.arcade-daily-panel'));
assert.ok(theater.includes('initLocalMusicLibrary({'));
assert.ok(theater.includes("playlist.push({file,kind:'audio',libraryId:id})"));
assert.ok(library.includes('void autoRestore()'),'Saved music must return on visit');
assert.ok(library.includes('setBusy(true)'));
assert.ok(arcade.includes('attemptDaily(game,value)'));
assert.ok(arcade.includes('renderDaily()'));
assert.ok(sw.includes("'./cinema-clarity.js'")&&sw.includes("'./cinema-clarity.css'"));
assert.ok(sw.includes("'./music-library-core.js'")&&sw.includes("'./music-library.js'")&&sw.includes("'./arcade-daily.js'"));
assert.ok(sync.includes(CINEMA_VIEWS_KEY)&&sync.includes(ARCADE_DAILY_KEY));
assert.ok(recovery.includes(CINEMA_VIEWS_KEY)&&recovery.includes(ARCADE_DAILY_KEY));
assert.ok(app.includes("LOCAL='3.5.2'"));
assert.equal([...html.matchAll(/<section class="studio" data-panel="([^"]+)"/g)].length,20,'Do not add another studio');
assert.equal([...html.matchAll(/class="nav[^"]*" data-view="([^"]+)"/g)].length,20,'Do not clutter navigation');
console.log('PASS v3.5.2: opaque Video Vault, focus controls, Media Theater framing, GIF Quick Clips, local IndexedDB music, and Arcade Daily compatibility.');
