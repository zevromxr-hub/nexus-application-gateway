/* NEXUS | AZEROTH v5.9 — local media studio.
 * Browser-only IndexedDB blobs. Nothing is submitted to GitHub, Blizzard or Cloudflare.
 * Muted GIF/video backdrop and independent user-initiated audio, no visualizer.
 */
(()=>{
'use strict';
const parent=document.getElementById('talentForge');if(!parent||document.getElementById('nxMediaStudio'))return;
const esc=x=>String(x??'').replace(/[&<>"']/g,k=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[k]));
const el=id=>document.getElementById(id),storeName='nexus_azeroth_private_media_v59',prefKey='nexus_azeroth_media_preferences_v59';
let db=null,backgroundURL='',musicURL='',musicTracks=[],playingId=null,shuffle=false,repeat='off',mediaPrefs={visibility:80,shade:35,blur:0,fit:'cover',volume:65,backdropOn:true},restoreOn=false;
try{const pref=JSON.parse(localStorage.getItem(prefKey)||'{}');if(pref&&typeof pref==='object'){
 for(const k of ['visibility','shade','blur','volume'])if(Number.isFinite(pref[k]))mediaPrefs[k]=Math.max(0,Math.min(k==='blur'?8:100,Math.round(pref[k])));
 if(['cover','contain'].includes(pref.fit))mediaPrefs.fit=pref.fit;
 if(typeof pref.backdropOn==='boolean')mediaPrefs.backdropOn=pref.backdropOn;
}}catch(_){}
const savePrefs=()=>{try{localStorage.setItem(prefKey,JSON.stringify(mediaPrefs))}catch(_){}};
const stage=document.createElement('div');stage.id='nxMediaBackdrop';stage.setAttribute('aria-hidden','true');document.body.prepend(stage);
stage.innerHTML='<div class="nx-media-canvas"></div><div class="nx-media-scrim"></div>';
const canvas=stage.querySelector('.nx-media-canvas');stage.hidden=true;
const section=parent.querySelector('[data-section="talents"]');
const panel=document.createElement('section');panel.id='nxMediaStudio';panel.className='panel nx-media-studio';
panel.innerHTML='<header class="nx-media-head"><div><span class="wow-kicker">NEXUS / PRIVATE MEDIA STUDIO v5.9</span><h3>Atmosphere & Music</h3><p>Customize the companion background using your own GIF, MP4, or WebM. Adjust its visibility without altering the interface. Keep a private playlist of local audio files in this browser.</p></div><span>LOCAL DEVICE ONLY</span></header>'+
'<div class="nx-media-grid"><div class="nx-media-panel"><h4>Animated background</h4><label class="nx-upload">SELECT GIF OR VIDEO<input id="nxMediaFile" type="file" accept=".gif,.mp4,.webm,image/gif,video/mp4,video/webm"></label><p id="nxBackgroundStatus" role="status" aria-live="polite">No background selected.</p><div class="nx-media-controls"><label>Visibility <output id="nxMediaVisOut">80%</output><input id="nxMediaVisibility" type="range" min="0" max="100" value="80"></label><label>Readability shade <output id="nxMediaShadeOut">35%</output><input id="nxMediaShade" type="range" min="0" max="90" value="35"></label><label>Soft blur <output id="nxMediaBlurOut">0px</output><input id="nxMediaBlur" type="range" min="0" max="8" value="0"></label><label>Image/video fit<select id="nxMediaFit"><option value="cover">Fill screen</option><option value="contain">Show full frame</option></select></label></div><div class="nx-media-buttons"><button id="nxMediaToggle" type="button">HIDE BACKGROUND</button><button id="nxMediaRemove" type="button">REMOVE BACKGROUND</button></div><p class="hint">Uploaded media stays on this device using browser storage when available. MP4/WebM always play muted and loop. Storage quotas and iPhone browser restrictions may limit large files or prevent automatic playback; no uploads leave this browser.</p></div>'+
'<div class="nx-media-panel"><h4>Personal music library</h4><label class="nx-upload">ADD LOCAL AUDIO FILES<input id="nxMusicFiles" type="file" accept=".mp3,.m4a,.aac,.wav,.ogg,.oga,.flac,audio/*" multiple></label><p id="nxMusicStatus" role="status" aria-live="polite">Music plays only after a user presses Play.</p><div class="nx-media-buttons"><button id="nxMusicOpen" type="button">SHOW MUSIC PLAYER</button><button id="nxMusicClear" type="button">CLEAR MUSIC LIBRARY</button></div><p class="hint">No audio visualization, external music downloads, or streaming-account connection. Playback depends on your browser's supported codecs. Your tracks stay private and do not transfer between devices automatically.</p></div></div>';
section?.insertBefore(panel,section.querySelector('.panel')||null);
const dock=document.createElement('aside');dock.id='nxMusicDock';dock.className='nx-music-dock';dock.hidden=true;
dock.innerHTML='<div class="nx-music-title"><strong>♫ NEXUS | MUSIC PLAYER</strong><button type="button" id="nxMusicClose" aria-label="Close music player">×</button></div><div class="nx-track-now" id="nxMusicNow">Select a local track to begin.</div><audio id="nxMusicAudio" preload="metadata"></audio><div class="nx-audio-controls"><button type="button" id="nxMusicPrev" aria-label="Previous track">⏮</button><button type="button" id="nxMusicPlay" aria-label="Play or pause">PLAY</button><button type="button" id="nxMusicNext" aria-label="Next track">⏭</button><button type="button" id="nxMusicShuffle">SHUFFLE OFF</button><button type="button" id="nxMusicRepeat">REPEAT OFF</button></div><div class="nx-audio-sliders"><label><span id="nxMusicTime">0:00 / 0:00</span><input id="nxMusicSeek" type="range" min="0" max="1000" value="0" aria-label="Seek through song"></label><label>Volume <output id="nxMusicVolOut">65%</output><input id="nxMusicVolume" type="range" min="0" max="100" value="65"></label></div><div class="nx-music-playlist" id="nxMusicPlaylist" role="list" aria-label="Private local music playlist"></div>';
document.body.append(dock);
const audio=el('nxMusicAudio');
function announce(id,msg){el(id).textContent=msg}
function openDB(){if(!('indexedDB'in window))return Promise.reject(Error('IndexedDB is unavailable'));return new Promise((res,rej)=>{
 const req=indexedDB.open(storeName,1);
 req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains('media'))d.createObjectStore('media',{keyPath:'id'});if(!d.objectStoreNames.contains('tracks'))d.createObjectStore('tracks',{keyPath:'id'})};
 req.onsuccess=()=>res(req.result);req.onerror=()=>rej(req.error||Error('Private storage unavailable'));req.onblocked=()=>rej(Error('Media storage is blocked by another open tab'));
})}
function dbAction(name,mode,method,value){if(!db)return Promise.reject(Error('Private storage is not available'));return new Promise((res,rej)=>{
 const tx=db.transaction(name,mode);let output;const request=tx.objectStore(name)[method](...(value===undefined?[]:[value]));request.onsuccess=()=>{output=request.result};tx.oncomplete=()=>res(output);tx.onerror=()=>rej(tx.error||Error('Browser storage error'));tx.onabort=()=>rej(tx.error||Error('Storage capacity exceeded'));
})}
function free(url){if(url)URL.revokeObjectURL(url)}
function updateBackground(){
 stage.hidden=!mediaPrefs.backdropOn||!canvas.firstElementChild;
 stage.style.setProperty('--nx-media-visibility',String(mediaPrefs.backdropOn?mediaPrefs.visibility/100:0));
 stage.style.setProperty('--nx-media-shade',String(mediaPrefs.shade/100));
 stage.style.setProperty('--nx-media-blur',mediaPrefs.blur+'px');
 stage.style.setProperty('--nx-media-fit',mediaPrefs.fit);
 for(const [id,v,unit]of [['nxMediaVisibility',mediaPrefs.visibility,'%'],['nxMediaShade',mediaPrefs.shade,'%'],['nxMediaBlur',mediaPrefs.blur,'px']]){el(id).value=String(v);el(id.replace(/^(nxMedia)/,'nxMedia').replace('Visibility','VisOut').replace('Shade','ShadeOut').replace('Blur','BlurOut')).textContent=v+unit}
 el('nxMediaFit').value=mediaPrefs.fit;el('nxMediaToggle').textContent=mediaPrefs.backdropOn?'HIDE BACKGROUND':'SHOW BACKGROUND';
}
function renderBackground(record){
 canvas.replaceChildren();free(backgroundURL);backgroundURL='';
 if(!record?.blob){stage.hidden=true;announce('nxBackgroundStatus','No background installed. Choose a local GIF or video to customize the site.');return}
 stage.hidden=false;backgroundURL=URL.createObjectURL(record.blob);
 const element=document.createElement(record.kind==='gif'?'img':'video');
 element.src=backgroundURL;
 if(element.tagName==='VIDEO'){element.muted=true;element.loop=true;element.autoplay=true;element.playsInline=true;element.preload='metadata';element.defaultMuted=true;element.setAttribute('playsinline','');element.addEventListener('loadeddata',()=>{if(mediaPrefs.backdropOn)element.play().catch(()=>announce('nxBackgroundStatus','Background is saved, but autoplay is blocked. Use SHOW BACKGROUND to retry.'))})}
 else{element.alt='';element.decoding='async'}
 canvas.append(element);announce('nxBackgroundStatus','Saved locally: '+record.name+' · '+Math.round(record.blob.size/1048576)+' MB');
 updateBackground();
}
async function uploadBackground(file){
 if(!file)return;
 const extension=String(file.name).toLowerCase().split('.').pop();const kind=extension==='gif'?'gif':['mp4','webm'].includes(extension)?'video':null;
 if(!kind||!(kind==='gif'?['image/gif',''].includes(file.type):['video/mp4','video/webm',''].includes(file.type)))throw Error('Use a GIF, MP4 or WebM file');
 if(file.size<=0||file.size>500*1048576)throw Error('Background must be 500 MB or smaller. Available device storage may be less');
 if(navigator.storage?.estimate){const q=await navigator.storage.estimate();if(Number.isFinite(q.quota)&&Number.isFinite(q.usage)&&q.quota-q.usage<file.size*1.05)throw Error('Insufficient browser storage. Try a smaller video or free site data')}
 const record={id:'background',blob:file,name:String(file.name).slice(0,140),kind};
 await dbAction('media','readwrite','put',record);renderBackground(record);
}
function clock(n){if(!Number.isFinite(n))return '0:00';return Math.floor(n/60)+':'+String(Math.floor(n%60)).padStart(2,'0')}
function playState(){el('nxMusicPlay').textContent=audio.paused?'PLAY':'PAUSE';announce('nxMusicTime',clock(audio.currentTime)+' / '+clock(audio.duration))}
function playlist(){
 const parent=el('nxMusicPlaylist');parent.replaceChildren();
 for(const item of musicTracks){const row=document.createElement('div');row.className='nx-music-entry';row.dataset.id=item.id;
 const name=document.createElement('button');name.type='button';name.textContent=(item.id===playingId?'♫ ':'')+item.name;name.title=item.name;name.addEventListener('click',()=>loadTrack(item.id,true));
 const remove=document.createElement('button');remove.type='button';remove.textContent='REMOVE';remove.setAttribute('aria-label','Remove '+item.name);remove.addEventListener('click',()=>removeTrack(item.id));
 row.append(name,remove);parent.append(row)}
 if(!musicTracks.length)parent.textContent='No tracks saved. Add audio files using the Music Library controls.';
}
async function loadTrack(id,autoplay=false){
 const item=musicTracks.find(x=>x.id===id);if(!item)return;
 const record=await dbAction('tracks','readonly','get',id);if(!record?.blob)return;
 audio.pause();audio.removeAttribute('src');audio.load();free(musicURL);musicURL=URL.createObjectURL(record.blob);audio.src=musicURL;playingId=id;audio.volume=mediaPrefs.volume/100;
 announce('nxMusicNow',item.name);playlist();
 if(autoplay){try{await audio.play()}catch(_){announce('nxMusicStatus','Press PLAY to start playback; automatic audio playback may be restricted.')}}
 playState();
}
async function removeTrack(id){if(!confirm('Remove this local track from your browser library?'))return;
 const was=id===playingId;if(was){audio.pause();audio.removeAttribute('src');free(musicURL);musicURL='';playingId=null;announce('nxMusicNow','Select a track to begin')}
 await dbAction('tracks','readwrite','delete',id);musicTracks=musicTracks.filter(x=>x.id!==id);playlist();playState();
}
async function next(direction=1){
 if(!musicTracks.length)return;
 let index=musicTracks.findIndex(x=>x.id===playingId);
 if(shuffle&&musicTracks.length>1){let value=Math.floor(Math.random()*musicTracks.length);if(value===index)value=(value+1)%musicTracks.length;index=value}
 else index=(index+direction+musicTracks.length)%musicTracks.length;
 await loadTrack(musicTracks[index].id,true);
}
async function addAudio(files){
 if(!db)throw Error('Browser storage is unavailable');
 const batch=[...files].slice(0,20),newItems=[];
 for(const file of batch){
  const ext=String(file.name).toLowerCase().split('.').pop();
  if(!['mp3','wav','m4a','aac','ogg','oga','flac'].includes(ext)||file.size<1||file.size>100*1048576)continue;
  if(musicTracks.length+newItems.length>=60)break;
  const id='track-'+Date.now()+'-'+Math.random().toString(36).slice(2,10);
  const row={id,name:String(file.name).slice(0,160),blob:file,added:Date.now()};
  await dbAction('tracks','readwrite','put',row);
  newItems.push({id,name:row.name,added:row.added});
 }
 musicTracks.push(...newItems);playlist();
 announce('nxMusicStatus',newItems.length+' local track(s) stored. Unsupported, empty, or oversized files were skipped. Up to 60 tracks, 100 MB per track.');
}
el('nxMediaFile').addEventListener('change',async e=>{const file=e.target.files?.[0];if(file){try{await uploadBackground(file)}catch(err){announce('nxBackgroundStatus','Background not saved: '+err.message)}}e.target.value=''});
for(const [id,key]of [['nxMediaVisibility','visibility'],['nxMediaShade','shade'],['nxMediaBlur','blur']]){
 el(id).addEventListener('input',e=>{mediaPrefs[key]=Number(e.target.value);updateBackground();savePrefs()});
}
el('nxMediaFit').addEventListener('change',e=>{mediaPrefs.fit=e.target.value==='contain'?'contain':'cover';updateBackground();savePrefs()});
el('nxMediaToggle').addEventListener('click',()=>{mediaPrefs.backdropOn=!mediaPrefs.backdropOn;updateBackground();savePrefs();const video=canvas.querySelector('video');if(video){if(mediaPrefs.backdropOn)video.play().catch(()=>announce('nxBackgroundStatus','Tap SHOW BACKGROUND again if video playback is blocked.'));else video.pause()}});
el('nxMediaRemove').addEventListener('click',async()=>{if(!confirm('Remove your locally saved companion background?'))return;try{await dbAction('media','readwrite','delete','background');renderBackground(null)}catch(e){announce('nxBackgroundStatus',e.message)}});
el('nxMusicFiles').addEventListener('change',async e=>{try{await addAudio(e.target.files||[])}catch(err){announce('nxMusicStatus','Music storage error: '+err.message)}e.target.value=''});
el('nxMusicOpen').addEventListener('click',()=>{dock.hidden=false;playlist()});
el('nxMusicClose').addEventListener('click',()=>{dock.hidden=true});
el('nxMusicPlay').addEventListener('click',async()=>{if(!audio.src){if(musicTracks[0])await loadTrack(musicTracks[0].id,false);else return}if(audio.paused){try{await audio.play()}catch(_){announce('nxMusicStatus','This format may be unsupported. Try MP3 or M4A.')}}else audio.pause();playState()});
el('nxMusicPrev').addEventListener('click',()=>next(-1));el('nxMusicNext').addEventListener('click',()=>next(1));
el('nxMusicShuffle').addEventListener('click',()=>{shuffle=!shuffle;el('nxMusicShuffle').textContent='SHUFFLE '+(shuffle?'ON':'OFF')});
el('nxMusicRepeat').addEventListener('click',()=>{repeat=repeat==='off'?'one':repeat==='one'?'all':'off';el('nxMusicRepeat').textContent='REPEAT '+repeat.toUpperCase()});
el('nxMusicVolume').value=String(mediaPrefs.volume);el('nxMusicVolOut').textContent=mediaPrefs.volume+'%';
el('nxMusicVolume').addEventListener('input',e=>{mediaPrefs.volume=Number(e.target.value);audio.volume=mediaPrefs.volume/100;el('nxMusicVolOut').textContent=mediaPrefs.volume+'%';savePrefs()});
el('nxMusicSeek').addEventListener('input',e=>{if(Number.isFinite(audio.duration)&&audio.duration>0)audio.currentTime=Number(e.target.value)/1000*audio.duration});
audio.addEventListener('timeupdate',()=>{el('nxMusicSeek').value=Number.isFinite(audio.duration)&&audio.duration>0?String(Math.round(audio.currentTime/audio.duration*1000)):'0';playState()});
audio.addEventListener('play',playState);audio.addEventListener('pause',playState);audio.addEventListener('loadedmetadata',playState);
audio.addEventListener('ended',()=>{if(repeat==='one'){audio.currentTime=0;audio.play().catch(()=>{})}else if(repeat==='all'||musicTracks.findIndex(x=>x.id===playingId)<musicTracks.length-1)next(1);else playState()});
el('nxMusicClear').addEventListener('click',async()=>{if(!confirm('Permanently clear your locally stored music library?'))return;audio.pause();audio.removeAttribute('src');free(musicURL);musicURL='';playingId=null;try{await dbAction('tracks','readwrite','clear');musicTracks=[];playlist();announce('nxMusicStatus','Music library cleared on this device.')}catch(e){announce('nxMusicStatus',e.message)}});
updateBackground();
openDB().then(async database=>{db=database;
 try{const bg=await dbAction('media','readonly','get','background');renderBackground(bg);const tracks=await dbAction('tracks','readonly','getAll');musicTracks=tracks.map(t=>({id:t.id,name:t.name,added:t.added})).sort((a,b)=>a.added-b.added);playlist();announce('nxMusicStatus',musicTracks.length+' stored track(s) on this browser. Open the player and press Play.')}
 catch(e){announce('nxBackgroundStatus','Unable to restore local media: '+e.message)}
}).catch(e=>{announce('nxBackgroundStatus','Persistent media storage unavailable: '+e.message+'. Please use a normal browser tab.');announce('nxMusicStatus','Music storage is unavailable here.')});
window.addEventListener('pagehide',()=>{audio.pause();free(musicURL);free(backgroundURL)});
})();
