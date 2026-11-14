// PROXIMUS | ASSET ALCHEMIST v3.1 — Video Vault
// Actual user-selected video bytes are saved in IndexedDB on THIS browser/device.
// This is not cloud storage, an online downloader or a guaranteed backup service.
import {$,bytes,download,notice,wrap} from './core.js';
import {saveOrShare} from './portable-kit.js';
import {normalizeBookmarks,makeVideoCatalog} from './media-suite-core.js';
import {
 VIDEO_VAULT_DB,VIDEO_VAULT_SCHEMA,VIDEO_VAULT_MAX_ITEMS,videoFileType,
 createVideoMetadata,validateVideoFile,normalizeVideoCollection,
 sortVideoLibrary,videoTime,vaultStorageWarning
} from './video-vault-core.js';

let database=null;
function openVideoDB(){
 if(database)return Promise.resolve(database);
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window))return reject(Error('This browser does not provide IndexedDB local media storage.'));
  const request=indexedDB.open(VIDEO_VAULT_DB,VIDEO_VAULT_SCHEMA);
  request.onupgradeneeded=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains('items'))db.createObjectStore('items',{keyPath:'id'});
   if(!db.objectStoreNames.contains('files'))db.createObjectStore('files',{keyPath:'id'});
  };
  request.onsuccess=()=>{
   database=request.result;
   database.onversionchange=()=>{database.close();database=null;};
   resolve(database);
  };
  request.onerror=()=>reject(request.error||Error('Could not open the local Video Vault.'));
  request.onblocked=()=>reject(Error('Close another PROXIMUS tab and retry Video Vault.'));
 });
}
async function transaction(stores,mode,run){
 const db=await openVideoDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(stores,mode),objs=stores.map(name=>tx.objectStore(name));
  let value;
  try{
   const request=run(...objs);
   if(request)request.onsuccess=()=>{value=request.result;};
  }catch(error){try{tx.abort();}catch(e){}reject(error);return;}
  tx.oncomplete=()=>resolve(value);
  tx.onerror=tx.onabort=()=>reject(tx.error||Error('Video Vault local storage operation failed.'));
 });
}
export async function listStoredVideos(){
 return transaction(['items'],'readonly',store=>store.getAll());
}
export async function saveStoredVideo(meta,blob){
 if(!(blob instanceof Blob)||blob.size!==meta.bytes)throw Error('Video import failed integrity check.');
 // One atomic transaction: no orphan metadata if file storage is full.
 await transaction(['items','files'],'readwrite',(items,files)=>{
  items.put(meta);files.put({id:meta.id,blob});
 });
 document.dispatchEvent(new Event('proximus-video-vault-changed'));
 return meta;
}
export async function loadStoredVideo(id){
 const record=await transaction(['files'],'readonly',store=>store.get(id));
 if(!(record?.blob instanceof Blob))throw Error('This video is not available in this browser’s local storage.');
 return record.blob;
}
export async function updateStoredVideo(meta){
 await transaction(['items'],'readwrite',store=>store.put(meta));
 document.dispatchEvent(new Event('proximus-video-vault-changed'));
}
export async function removeStoredVideo(id){
 await transaction(['items','files'],'readwrite',(items,files)=>{items.delete(id);files.delete(id);});
 document.dispatchEvent(new Event('proximus-video-vault-changed'));
}
function newId(){
 if(crypto.randomUUID)return crypto.randomUUID();
 const data=new Uint8Array(16);crypto.getRandomValues(data);
 return Array.from(data,x=>x.toString(16).padStart(2,'0')).join('');
}
function quotaText(estimate){
 if(!estimate||!Number.isFinite(estimate.quota))return 'Local storage capacity unavailable in this browser';
 return bytes(estimate.usage||0)+' used / approximately '+bytes(estimate.quota)+' available to this website';
}
const mobile=/iPhone|iPad|iPod/i.test(typeof navigator!=='undefined'?navigator.userAgent:'');
export function initVideoVault(app){
 const root=$('videoVaultStudio'),input=$('videoVaultFiles'),video=$('videoVaultPlayer');
 if(!root)return;
 const status=$('videoVaultStatus'),grid=$('videoVaultGrid'),metaLabel=$('videoVaultPlaying'),
  info=$('videoVaultInfo'),storage=$('videoVaultStorage'),listCount=$('videoVaultCount');
 const search=$('videoVaultSearch'),filter=$('videoVaultFilter'),sort=$('videoVaultSort');
 const records=new Map();
 let activeId=null,currentURL=null,lastSave=0,posterWorking=false,persistent=null,captionURL=null;
 const AUTO_NEXT='proximus-video-vault-auto-next-v1';
 const autoNext=$('videoVaultAutoNext');
 try{autoNext.checked=localStorage.getItem(AUTO_NEXT)==='1';}catch(e){}
 autoNext.addEventListener('change',()=>{
  try{localStorage.setItem(AUTO_NEXT,autoNext.checked?'1':'0');}catch(e){}
 });
 const mini=document.createElement('div');mini.className='companion-video-mini';mini.hidden=true;
 mini.setAttribute('aria-label','Compact Video Vault player');
 const miniTitle=document.createElement('strong');
 const miniToggle=document.createElement('button'),miniOpen=document.createElement('button');
 const miniNext=document.createElement('button');
 miniToggle.className=miniOpen.className=miniNext.className='small-btn';
 miniToggle.textContent='❚❚';miniOpen.textContent='Open Vault';miniNext.textContent='⏭';
 miniToggle.setAttribute('aria-label','Pause or resume saved video');
 miniNext.setAttribute('aria-label','Play next saved video');
 mini.append(miniTitle,miniToggle,miniNext,miniOpen);document.body.append(mini);
 function updateMini(){
  const item=active();
  const inVault=document.querySelector('.studio:not([hidden])')?.dataset.panel==='videos';
  mini.hidden=!item||video.paused||inVault;
  miniTitle.textContent=item?.displayTitle||item?.name||'Saved video';
  miniToggle.textContent=video.paused?'▶':'❚❚';
 }
 miniToggle.addEventListener('click',()=>{if(video.paused)video.play().catch(()=>{});else video.pause();});
 miniOpen.addEventListener('click',()=>app.changeView('videos'));
 miniNext.addEventListener('click',()=>nextVideo(1));
 let posterURLs=[];
 const say=(msg,bad=false)=>{status.textContent=msg;status.dataset.error=bad?'true':'false';};
 const formatDate=time=>new Date(time).toLocaleDateString(undefined,{year:'numeric',month:'short',day:'numeric'});
 const active=()=>records.get(activeId)||null;
 function releasePosters(){for(const url of posterURLs)URL.revokeObjectURL(url);posterURLs=[];}
 function clearPlayback(){
  video.pause();video.removeAttribute('src');video.load();
  if(captionURL){URL.revokeObjectURL(captionURL);captionURL=null;}
  video.querySelectorAll('track[data-vault-caption]').forEach(t=>t.remove());
  $('videoVaultCaptions').value='';
  if(currentURL)URL.revokeObjectURL(currentURL);
  currentURL=null;activeId=null;lastSave=0;
  metaLabel.textContent='Select a saved video';
  info.textContent='Original videos stored only on this device.';
  $('videoVaultDownload').disabled=true;
  $('videoVaultPiP').disabled=true;
  $('videoVaultSendTheater').disabled=true;
  $('videoVaultToGif').disabled=true;
  $('videoVaultSnapshot').disabled=true;
  drawBookmarks();updateMini();
 }
 function getVisible(){
  return sortVideoLibrary([...records.values()],{
   query:search.value,filter:filter.value,sort:sort.value
  });
 }
 function render(){
  const list=getVisible();
  listCount.textContent=records.size+' saved · '+list.length+' shown';
  $('videoVaultFavorites').textContent=String([...records.values()].filter(v=>v.favorite).length);
  $('videoVaultSavedBytes').textContent=bytes([...records.values()].reduce((sum,v)=>sum+v.bytes,0));
  releasePosters();grid.replaceChildren();
  for(const item of list.slice(0,180)){
   const card=document.createElement('article');card.className='video-vault-card';
   if(item.id===activeId)card.classList.add('selected');
   const cover=document.createElement('button');cover.className='video-vault-cover';
   cover.title='Play '+item.name;cover.type='button';
   if(item.poster instanceof Blob){
    const thumb=document.createElement('img'),url=URL.createObjectURL(item.poster);
    posterURLs.push(url);thumb.src=url;thumb.alt='';thumb.loading='lazy';cover.append(thumb);
   }else{const glyph=document.createElement('span');glyph.textContent='▶';cover.append(glyph);}
   const badge=document.createElement('span');badge.className='video-vault-duration';badge.textContent=item.duration?videoTime(item.duration):'LOCAL';cover.append(badge);
   cover.addEventListener('click',()=>void watch(item.id,true));
   const body=document.createElement('div');body.className='video-vault-card-body';
   const heading=document.createElement('strong');heading.textContent=item.displayTitle||item.name;heading.title=item.name;
   const details=document.createElement('small');details.textContent=bytes(item.bytes)+' · '+formatDate(item.added)+
    (item.position?' · Resume '+videoTime(item.position):'');
   const row=document.createElement('div');row.className='video-vault-card-actions';
   const watchButton=document.createElement('button');watchButton.className='small-btn';
   watchButton.textContent=item.position?'▶ Resume':'▶ Watch';
   watchButton.addEventListener('click',()=>void watch(item.id,true));
   const fav=document.createElement('button');fav.className='small-btn';fav.textContent=item.favorite?'★':'☆';
   fav.title=item.favorite?'Remove favorite':'Add to favorites';
   fav.setAttribute('aria-label',item.favorite?'Unfavorite '+item.name:'Favorite '+item.name);
   fav.addEventListener('click',wrap(async()=>{
    item.favorite=!item.favorite;item.updated=Date.now();await updateStoredVideo(item);render();
   }));
   const del=document.createElement('button');del.className='small-btn';del.textContent='×';del.title='Delete saved local copy';
   del.setAttribute('aria-label','Remove '+item.name+' from saved Video Vault');
   del.addEventListener('click',wrap(async()=>{
    if(!confirm('Remove "'+item.name+'" from Video Vault on this device? Your original file in Files/Photos will not be deleted.'))return;
    if(item.id===activeId)clearPlayback();
    await removeStoredVideo(item.id);records.delete(item.id);render();
    say('Removed local copy of '+item.name+'.');
   }));
   const folder=document.createElement('input');folder.type='text';folder.className='video-vault-collection';
   folder.maxLength=42;folder.value=item.collection||'Unsorted';folder.setAttribute('aria-label','Collection for '+item.name);
   folder.title='Edit collection — e.g., Favorites, Clips, Shows';
   folder.addEventListener('change',wrap(async()=>{
    item.collection=normalizeVideoCollection(folder.value);item.updated=Date.now();
    await updateStoredVideo(item);render();
   }));
   const rename=document.createElement('button');rename.className='small-btn';rename.textContent='Rename';
   rename.title='Change title without renaming your original video file';
   rename.addEventListener('click',wrap(async()=>{
    const name=prompt('Display name for this video (original filename stays unchanged):',item.displayTitle||item.name);
    if(name===null)return;
    const clean=String(name).replace(/[\u0000-\u001f]/g,' ').trim().slice(0,120);
    if(!clean)throw Error('Title cannot be empty.');
    item.displayTitle=clean;item.updated=Date.now();
    await updateStoredVideo(item);
    if(activeId===item.id)metaLabel.textContent=clean;
    render();
   }));
   row.append(watchButton,fav,del,rename);body.append(heading,details,folder,row);
   card.append(cover,body);grid.append(card);
  }
  if(!list.length){const blank=document.createElement('div');blank.className='video-vault-empty';
   blank.textContent=records.size?'No saved videos match these filters.':'Your Video Vault is empty. Import a video from Files or Photos to keep a local copy in this browser.';
   grid.append(blank);
  }
  if(list.length>180){const note=document.createElement('p');note.className='hint';
   note.textContent='Showing the first 180 matches. Refine your search to find more of your saved videos.';
   grid.append(note);}
 }
 async function refreshStorage(){
  let estimate=null;
  try{if(navigator.storage?.estimate)estimate=await navigator.storage.estimate();}catch(e){}
  try{persistent=await navigator.storage?.persisted?.()??null;}catch(e){persistent=null;}
  storage.textContent=quotaText(estimate)+' · '+(persistent===true?'persistent mode granted':persistent===false?'best-effort mode':'storage mode unknown');
  $('videoVaultStorageHelp').textContent=vaultStorageWarning(persistent);
  $('videoVaultPersist').disabled=persistent===true||!navigator.storage?.persist;
 }
 async function requestPersistence(){
  if(!navigator.storage?.persist)return false;
  try{
   const result=await navigator.storage.persist();
   await refreshStorage();
   say(result?'Persistent browser storage granted. Keep your original files as backups.':
    'Persistent storage was not granted. Videos remain available while browser-managed website data is retained.');
   return result;
  }catch(e){await refreshStorage();return false;}
 }
 async function importFiles(files){
  if(!files.length)return;
  $('videoVaultImportNow').disabled=true;
  let added=0,skipped=0;
  try{
   for(const file of files){
    if(records.size>=VIDEO_VAULT_MAX_ITEMS){say('Video Vault is limited to 500 titles on this device.',true);break;}
    let meta;
    try{
     meta=createVideoMetadata(file,newId(),Date.now(),{mobile});
     if([...records.values()].some(r=>r.fingerprint===meta.fingerprint)){skipped++;continue;}
    }catch(error){say(file.name+': '+error.message,true);skipped++;continue;}
    try{
     say('Saving '+file.name+' · '+bytes(file.size)+' directly on this device…');
     await saveStoredVideo(meta,file);
     records.set(meta.id,meta);added++;render();
    }catch(error){
     say('Could not save '+file.name+': '+(error?.name==='QuotaExceededError'?
      'This browser’s local storage is full. Free space and keep original videos in Files/Photos.':
      error.message),true);
     break;
    }
   }
   if(added||skipped)say('Saved '+added+' video'+(added===1?'':'s')+' on this device.'+
    (skipped?' '+skipped+' duplicate/unsupported files skipped.':'')+
    ' They will reappear when you reopen Video Vault in this same browser, unless website data is cleared.');
   render();await refreshStorage();
  }finally{$('videoVaultImportNow').disabled=false;}
 }
 async function persistPosition(force=false){
  const item=active();if(!item||!Number.isFinite(video.currentTime))return;
  const now=Date.now();if(!force&&now-lastSave<5000)return;
  lastSave=now;
  const remaining=Number.isFinite(video.duration)?video.duration-video.currentTime:60;
  item.position=remaining<5?0:Math.max(0,Math.floor(video.currentTime));
  item.watched=now;
  if(Number.isFinite(video.duration))item.duration=Math.max(0,Math.floor(video.duration));
  try{await updateStoredVideo(item);}catch(e){say('Playback works, but saving the resume position failed: '+e.message,true);}
 }
 async function maybeCreatePoster(){
  const item=active();if(!item||item.poster||posterWorking||video.readyState<2)return;
  posterWorking=true;const id=item.id;
  try{
   const canvas=document.createElement('canvas');canvas.width=320;canvas.height=180;
   const ctx=canvas.getContext('2d');
   ctx.fillStyle='#110d24';ctx.fillRect(0,0,320,180);
   const iw=video.videoWidth,ih=video.videoHeight;
   if(iw<1||ih<1)return;
   const scale=Math.max(320/iw,180/ih),dw=iw*scale,dh=ih*scale;
   ctx.drawImage(video,(320-dw)/2,(180-dh)/2,dw,dh);
   const jpeg=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.7));
   if(jpeg&&jpeg.size<200000&&activeId===id){
    item.poster=jpeg;await updateStoredVideo(item);render();
   }
  }catch(e){}finally{posterWorking=false;}
 }
 async function watch(id,autoplay=false){
  const item=records.get(id);if(!item)return;
  if(activeId!==id){
   await persistPosition(true);
   clearPlayback();
   let blob;
   try{blob=await loadStoredVideo(id);}catch(err){say(err.message,true);return;}
   activeId=id;currentURL=URL.createObjectURL(blob);
   video.src=currentURL;video.playsInline=true;video.preload='metadata';
   video.load();
   metaLabel.textContent=item.displayTitle||item.name;info.textContent=bytes(item.bytes)+' · '+item.collection+
    (item.position?' · saved position '+videoTime(item.position):' · start from beginning');
   $('videoVaultDownload').disabled=false;$('videoVaultPiP').disabled=false;
   $('videoVaultSendTheater').disabled=false;
   $('videoVaultToGif').disabled=false;
   $('videoVaultSnapshot').disabled=false;
   video.playbackRate=Number($('videoVaultSpeed').value)||1;
   drawBookmarks();render();
  }
  if(autoplay){
   try{await video.play();say('Playing '+item.name+'.');}
   catch(e){say('Video ready — tap the ▶ control in the player to start on your iPhone.');}
  }
  $('videoVaultPlayer').scrollIntoView({block:'nearest',behavior:'smooth'});
  updateMini();
 }
 function seekResume(){
  const item=active();if(!item)return;
  if(Number.isFinite(video.duration)&&video.duration>0){
   item.duration=Math.floor(video.duration);
   if(item.position>2&&item.position<video.duration-4){
    try{video.currentTime=item.position;}catch(e){}
   }
   void updateStoredVideo(item);
  }
 }
 function nextVideo(direction){
  const visible=getVisible();if(!visible.length)return;
  let index=visible.findIndex(x=>x.id===activeId);
  if(index<0)index=direction>0?-1:0;
  const id=visible[(index+direction+visible.length)%visible.length]?.id;
  if(id)void watch(id,true);
 }
 const onFiles=wrap(async e=>{
  const files=Array.from(e.target.files||[]);e.target.value='';
  await importFiles(files);
 });
 input.addEventListener('change',onFiles);
 $('videoVaultImportNow').addEventListener('click',()=>input.click());
 $('videoVaultPersist').addEventListener('click',wrap(requestPersistence));
 $('videoVaultRefresh').addEventListener('click',wrap(async()=>{
  records.clear();for(const entry of await listStoredVideos())records.set(entry.id,entry);
  render();await refreshStorage();say('Video Vault refreshed from this browser’s saved media.');
 }));
 for(const el of [search,filter,sort])el.addEventListener('input',render);
 $('videoVaultPrevious').addEventListener('click',()=>nextVideo(-1));
 $('videoVaultNext').addEventListener('click',()=>nextVideo(1));
 function skipSeconds(delta){
  if(!active()||!Number.isFinite(video.duration)||video.duration<=0)return;
  video.currentTime=Math.max(0,Math.min(video.duration-.1,video.currentTime+delta));
  void persistPosition(true);
 }
 $('videoVaultBack10').addEventListener('click',()=>skipSeconds(-10));
 $('videoVaultForward30').addEventListener('click',()=>skipSeconds(30));
 $('videoVaultSendTheater').addEventListener('click',wrap(async()=>{
  const item=active();if(!item)throw Error('Choose a saved video first.');
  const blob=await loadStoredVideo(item.id);
  document.dispatchEvent(new CustomEvent('proximus-video-vault-send-theater',
   {detail:{blob,name:item.name,mime:item.mime}}));
  app.changeView('theater');
  say('Opened '+item.name+' in Media Theater without duplicating the stored file.');
 }));

 function drawBookmarks(){
  const holder=$('videoVaultBookmarks'),item=active();holder.replaceChildren();
  if(!item){holder.textContent='Choose a saved video to bookmark its scenes.';return;}
  const marks=normalizeBookmarks(item.bookmarks);
  for(const mark of marks){
   const row=document.createElement('div');row.className='video-vault-bookmark-row';
   const jump=document.createElement('button');jump.className='small-btn';
   jump.textContent='▶ '+videoTime(mark.time)+' · '+mark.title;
   jump.addEventListener('click',()=>{
    if(!Number.isFinite(video.duration))return;
    video.currentTime=Math.min(video.duration-.05,mark.time);
    void video.play().catch(()=>{});
   });
   const del=document.createElement('button');del.className='small-btn';del.textContent='×';
   del.setAttribute('aria-label','Remove '+mark.title+' scene bookmark');
   del.addEventListener('click',wrap(async()=>{
    item.bookmarks=marks.filter(x=>x.id!==mark.id);
    await updateStoredVideo(item);drawBookmarks();
   }));
   row.append(jump,del);holder.append(row);
  }
  if(!marks.length)holder.textContent='No saved scenes yet. Save the current playback time to create a chapter.';
 }
 $('videoVaultBookmarkSave').addEventListener('click',wrap(async()=>{
  const item=active();if(!item||!Number.isFinite(video.currentTime))throw Error('Choose a saved video and a scene first.');
  const marks=normalizeBookmarks(item.bookmarks);
  if(marks.length>=60)throw Error('Up to 60 bookmarks per saved video.');
  const name=$('videoVaultBookmarkTitle').value.trim().slice(0,70)||'Favorite scene';
  item.bookmarks=normalizeBookmarks([...marks,{id:newId(),title:name,time:video.currentTime}]);
  item.updated=Date.now();
  await updateStoredVideo(item);$('videoVaultBookmarkTitle').value='';drawBookmarks();
  say('Bookmarked scene at '+videoTime(video.currentTime)+'.');
 }));
 $('videoVaultSpeed').addEventListener('change',()=>{
  video.playbackRate=Number($('videoVaultSpeed').value)||1;
 });
 $('videoVaultCaptions').addEventListener('change',wrap(async e=>{
  const f=e.target.files?.[0];if(!f)return;
  if(f.size>1500000||!(/\\.vtt$/i.test(f.name)||f.type==='text/vtt'))throw Error('Use a .vtt subtitle file under 1.5 MB.');
  if(captionURL)URL.revokeObjectURL(captionURL);
  video.querySelectorAll('track[data-vault-caption]').forEach(t=>t.remove());
  captionURL=URL.createObjectURL(f);
  const track=document.createElement('track');
  track.kind='subtitles';track.srclang='en';track.label='Local captions';track.src=captionURL;
  track.default=true;track.dataset.vaultCaption='1';video.append(track);
  say('Loaded local captions for this playback session; the .vtt file is not saved in the Vault.');
 }));
 $('videoVaultToGif').addEventListener('click',wrap(async()=>{
  const item=active();if(!item)throw Error('Choose a saved video first.');
  if(item.bytes>250000000)throw Error('Animation Forge accepts at most 250 MB per imported video.');
  const blob=await loadStoredVideo(item.id);
  document.dispatchEvent(new CustomEvent('proximus-animation-source',
   {detail:{blob,name:item.name,mime:item.mime}}));
  app.changeView('animation');
  say('Saved video passed to Animation Forge without adding a new permanent copy.');
 }));
 $('videoVaultSnapshot').addEventListener('click',wrap(async()=>{
  if(!active()||video.readyState<2||!video.videoWidth)throw Error('Play or seek to a valid video frame first.');
  const canvas=document.createElement('canvas');canvas.width=Math.min(video.videoWidth,1920);
  canvas.height=Math.max(1,Math.round(canvas.width*video.videoHeight/video.videoWidth));
  canvas.getContext('2d').drawImage(video,0,0,canvas.width,canvas.height);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Could not capture frame.')),'image/png'));
  await saveOrShare(blob,'PROXIMUS-VIDEO-FRAME-'+Math.round(video.currentTime)+'s.png');
  say('Exported current video frame as a PNG.');
 }));
 $('videoVaultExportCatalog').addEventListener('click',wrap(async()=>{
  const blob=new Blob([JSON.stringify(makeVideoCatalog([...records.values()]),null,2)],{type:'application/json'});
  await saveOrShare(blob,'PROXIMUS-VIDEO-VAULT-CATALOG.json');
  say('Exported video metadata catalog; original video bytes are not included.');
 }));

 $('videoVaultOpenTheater').addEventListener('click',()=>app.changeView('theater'));
 $('videoVaultCinema').addEventListener('click',wrap(async()=>{
  if(!active())throw Error('Choose a saved video first.');
  if(video.requestFullscreen)await video.requestFullscreen();
  else if(video.webkitEnterFullscreen)video.webkitEnterFullscreen();
  else say('Use the native video controls to enter full-screen playback.');
 }));
 $('videoVaultPiP').addEventListener('click',wrap(async()=>{
  if(!active())throw Error('Choose a video first.');
  if(document.pictureInPictureEnabled&&video.requestPictureInPicture){
   await video.requestPictureInPicture();
  }else if(video.webkitSetPresentationMode){
   video.webkitSetPresentationMode('picture-in-picture');
  }else say('This iPhone/browser does not provide picture-in-picture from the website.');
 }));
 $('videoVaultDownload').addEventListener('click',wrap(async()=>{
  const item=active();if(!item)throw Error('Choose a saved video first.');
  const blob=await loadStoredVideo(item.id);
  const outcome=await saveOrShare(blob,item.name);
  say(outcome==='shared'?'Video sent to your device share sheet.':'Original saved video exported.');
 }));
 video.addEventListener('loadedmetadata',seekResume);
 video.addEventListener('play',()=>{
  updateMini();
  document.dispatchEvent(new CustomEvent('proximus-companion-playing',{detail:{origin:'videos'}}));
 });
 video.addEventListener('pause',updateMini);
 video.addEventListener('timeupdate',()=>{
  void persistPosition();
  if(video.currentTime>1&&!active()?.poster)void maybeCreatePoster();
 });
 video.addEventListener('pause',()=>void persistPosition(true));
 video.addEventListener('ended',()=>{
  if(active()){active().position=0;active().watched=Date.now();void updateStoredVideo(active());}
  render();updateMini();
  if(autoNext.checked){
   const queue=getVisible(),index=queue.findIndex(item=>item.id===activeId);
   if(index>=0&&index<queue.length-1)void watch(queue[index+1].id,true);
  }
 });
 video.addEventListener('error',()=>{
  const item=active();if(item)say('This browser cannot decode '+item.name+'. The original saved file is still in Video Vault. Try MP4/H.264 or a device-native MOV.',true);
 });
 document.addEventListener('proximus-video-vault-watch',e=>{
  const id=e.detail?.id;
  if(typeof id!=='string')return;
  void (async()=>{
   if(!records.has(id)){
    try{for(const entry of await listStoredVideos())records.set(entry.id,entry);}
    catch(error){say(error.message,true);return;}
   }
   await watch(id,true);
  })();
 });
 document.addEventListener('proximus-companion-playing',e=>{
  if(e.detail?.origin==='theater'&&!video.paused)video.pause();
 });
 document.addEventListener('proximus-video-vault-import',e=>{
  const files=Array.from(e.detail?.files||[]);
  if(files.length)void importFiles(files);
 });
 document.addEventListener('proximus-view-changed',e=>{
  if(e.detail?.studio!=='videos'&&!video.paused)void persistPosition(true);
  updateMini();
 });
 window.addEventListener('pagehide',()=>{
  void persistPosition(true);mini.remove();if(currentURL)URL.revokeObjectURL(currentURL);releasePosters();
 });
 void (async()=>{
  try{
   const saved=await listStoredVideos();
   for(const item of saved)if(item?.id&&item.bytes>0)records.set(item.id,item);
   render();await refreshStorage();
   say(records.size+' saved video'+(records.size===1?'':'s')+' restored from this device’s Video Vault.');
  }catch(error){say('Video Vault local storage is unavailable: '+error.message,true);}
 })();
}
