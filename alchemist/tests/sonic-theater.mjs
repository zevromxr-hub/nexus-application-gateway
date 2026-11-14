// PROXIMUS v3.5.3 | Unified Sonic Theater functional contracts and regression tests.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {SONIC_THEATER_ROUTE,SONIC_THEATER_LEGACY,SONIC_THEATER_ROUTE as target,
 SUPPORTED_MUSIC_EXTENSIONS,sonicMediaKind,isAudioPlaybackSupported} from '../sonic-theater.js';
import {SONIC_ORDER_KEY,normalizeSonicOrder,orderStoredMusic,movePlaylistItem} from '../sonic-playlist-core.js';
import {audioTrackId,MUSIC_DB,MUSIC_STARTUP_KEY,normalizeMusicStartup,startupTrack} from '../music-library-core.js';
const ROOT=path.resolve(import.meta.dirname,'..'),read=x=>fs.readFileSync(path.join(ROOT,x),'utf8');
const html=read('index.html'),app=read('app.js'),theater=read('media-theater.js'),reactor=read('reactor-studio.js'),
music=read('music-library.js'),mount=read('sonic-theater.js'),css=read('sonic-theater.css'),
service=read('sw.js'),sync=read('workspace-sync.js'),recovery=read('recovery-center.js'),
mobile=read('mobile-navigation.js');
assert.equal(SONIC_THEATER_ROUTE,'reactor');
assert.equal(SONIC_THEATER_LEGACY,'theater');
assert.ok(SUPPORTED_MUSIC_EXTENSIONS.includes('.mp3'));
assert.equal(sonicMediaKind({name:'my song.mp3',type:''}),'audio');
assert.equal(sonicMediaKind({name:'test.MP3',type:'application/octet-stream'}),'audio');
assert.equal(sonicMediaKind({name:'filename.aac',type:''}),'audio');
assert.equal(sonicMediaKind({name:'silent.mp4',type:'video/mp4'}),'video');
assert.equal(sonicMediaKind({name:'image.gif',type:'image/gif'}),'image');
assert.equal(sonicMediaKind({name:'bad.docx',type:'application/pdf'}),null);
assert.equal(isAudioPlaybackSupported({name:'a.mp3',type:''},null),true);
assert.equal(isAudioPlaybackSupported({name:'a.mov',type:'video/quicktime'},null),false);
const first=audioTrackId({name:'song.mp3',size:5000,type:'audio/mpeg',lastModified:123});
const second=audioTrackId({name:'song2.mp3',size:6000,type:'audio/mpeg',lastModified:456});
assert.deepEqual(normalizeSonicOrder([first,second,first,7,'',null]),[first,second]);
assert.deepEqual(normalizeSonicOrder('bad'),[]);
const saved=[{id:first,name:'A'},{id:second,name:'B'},{id:'extra',name:'C'}];
assert.deepEqual(orderStoredMusic(saved,[second,first]).map(x=>x.id),[second,first,'extra']);
assert.deepEqual(orderStoredMusic(saved,[second,first],first).map(x=>x.id),[first,second,'extra']);
assert.deepEqual(movePlaylistItem(saved,0,1).map(x=>x.id),[second,first,'extra']);
assert.deepEqual(movePlaylistItem(saved,0,-1).map(x=>x.id),[first,second,'extra']);
assert.equal(MUSIC_DB,'proximus-theater-local-music-v1','No new music DB or file migration');
assert.equal(MUSIC_STARTUP_KEY,'proximus-music-startup-v1','Play on Start preference must be retained');
assert.equal(normalizeMusicStartup().enabled,false,'Autoplay remains opt-in');
assert.equal(startupTrack(saved,{enabled:true,trackId:second}).id,second);
assert.ok(app.includes('mountUnifiedSonicTheater();'),'Merged workspace must mount before existing controllers');
assert.ok(app.indexOf('mountUnifiedSonicTheater();')<app.indexOf('initMediaTheater(app);'),'Move DOM prior to playlist initialization');
assert.ok(app.includes("if(id==='theater')id='reactor'"),'Old links and bookmarks must redirect');
assert.ok(mount.includes("document.createElement('details')"),'Advanced media tools must remain available');
assert.ok(mount.includes('library.append(panels[0])'),'Save library, queue and play-on-start must move together');
assert.ok(mount.includes('advanced.append(summary,panels[1])'),'Video/GIF and media exports must remain available');
assert.ok(mount.includes('visual.append(dock,stage)'),'Reactor stage and controls must be in unified workspace');
assert.ok(css.includes('grid-template-columns:minmax(0,1.22fr)'),'PC side-by-side layout required');
assert.ok(css.includes('@media(max-width:1120px)'),'Mobile stacked layout required');
assert.ok(css.includes('.sonic-theater-integrated .nav[data-view="theater"]'),'No duplicate visible desktop nav');
assert.ok(mobile.includes("s.id!=='theater'"),'No duplicate visible iPhone studio entry');
assert.ok(mobile.includes("id==='theater'?'reactor':id"),'Old iPhone Theater pins must carry over to Sonic Theater');
assert.ok(html.includes('id="theaterFiles" type="file" accept="audio/*,.mp3,'),'File picker must explicitly allow MP3 and AAC');
assert.ok(html.includes('id="reactorFilePlay">▶ Queue & play in Sonic Theater'),'Old Reactor file importer must use shared queue');
assert.ok(html.includes('id="theaterMusicAutostart"'),'Keep user choice of opening music');
assert.ok(html.includes('id="theaterMusicStartupTrack"'),'Keep user choice of opening song');
assert.ok(html.includes('id="theaterMusicSavedList"'),'Keep existing local music browser storage');
assert.ok(theater.includes("document.addEventListener('proximus-sonic-enqueue'"),'Reactor imports must reach shared playlist');
assert.ok(theater.includes("document.dispatchEvent(new CustomEvent('proximus-sonic-spectrum'"),'Web Audio FFT must feed Reactor');
assert.ok(theater.includes('createMediaElementSource(el)'),'Shared audio analyzer must use real browser audio');
assert.ok(theater.includes('ensureTheaterAnalysis()'),'Audio playback must initialize shared analysis');
assert.ok(theater.includes('type.startsWith(\'audio/\')||audioExt.test(name)'),'MP3 MIME fallback must work');
assert.ok(reactor.includes("document.addEventListener('proximus-sonic-spectrum'"),'Reactor must receive shared spectrum');
assert.ok(reactor.includes("current='playlist'"),'Reactor must expose shared playlist source');
assert.ok(reactor.includes('spectralBands(frequency,sharedSampleRate,sharedFFT)'),'Use measured spectral bands not fake animation');
assert.ok(reactor.includes("proximus-sonic-enqueue"),'Reactor local import must hand off to Theater');
assert.ok(reactor.includes("document.dispatchEvent(new Event('proximus-sonic-stop-playlist'))"),'Alternative mic/tab inputs must not double play');
assert.ok(reactor.includes('getUserMedia')&&reactor.includes('getDisplayMedia'),'Existing microphone and desktop share inputs preserved');
assert.ok(reactor.includes('drawSonicDimension(ctx,'),'Existing Sonic Dimension environments preserved');
assert.ok(music.includes('orderStoredMusic('),'Restore playlist in saved order');
assert.ok(theater.includes('movePlaylistItem('),'Queue must be reorderable');
assert.ok(theater.includes('SONIC_ORDER_KEY'),'Ordering must persist');
assert.ok(sync.includes(SONIC_ORDER_KEY)&&recovery.includes(SONIC_ORDER_KEY),'Playlist settings backed up');
assert.ok(sync.includes(MUSIC_STARTUP_KEY)&&recovery.includes(MUSIC_STARTUP_KEY),'Play on Start backed up');
assert.ok(!sync.includes('proximus-theater-local-music-v1'),'Large audio bytes must not be added to settings backup');
for(const id of ['sonicUnifiedWorkspace','theaterMusicAutostart','theaterMusicSavedList','reactorCanvas','theaterFiles','theaterAudio','reactorSourceStatus']){
 if(id==='sonicUnifiedWorkspace'){assert.ok(mount.includes("holder.id='sonicUnifiedWorkspace'"));continue;}
 assert.equal([...html.matchAll(new RegExp('id="'+id+'"','g'))].length,1,'Existing control duplicated or removed: '+id);
}
assert.equal([...html.matchAll(/<section class="studio" data-panel="([^"]+)"/g)].length,20,'Legacy 18 registered spaces and 2 info panels must stay compatible');
assert.equal([...html.matchAll(/class="nav[^"]*" data-view="([^"]+)"/g)].length,20,'Retained routes and old bookmarks must work');
assert.ok(service.includes("'./sonic-theater.js'")&&service.includes("'./sonic-theater.css'")&&service.includes("'./sonic-playlist-core.js'"),'Offline app shell must include new modules');
console.log('PASS: Unified Sonic Theater v3.5.3; explicit MP3 accepts; one playlist shared FFT; preserved auto-start, library and media, backup and navigation.');
