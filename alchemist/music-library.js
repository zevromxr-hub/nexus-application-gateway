// PROXIMUS v3.5.2 | Personal Music Library
// User-imported music is persisted solely in this browser's IndexedDB, never uploaded.
import {$,bytes} from './core.js';
import {listMusic,loadMusic,saveMusic,deleteMusic,storedMusicFile,isLocalAudio,MAX_TRACKS,MUSIC_STARTUP_KEY,normalizeMusicStartup,startupTrack} from './music-library-core.js';

export function initLocalMusicLibrary({getCurrent,getQueued,addToQueue,prepareStartup,attemptStartup}){
 const list=$('theaterMusicSavedList'),status=$('theaterMusicStatus'),
  count=$('theaterMusicCount'),storage=$('theaterMusicSize');
 if(!list||!status||!count||!storage)return;
 let busy=false,rows=[],startup=normalizeMusicStartup(),pending=false;
 try{startup=normalizeMusicStartup(JSON.parse(localStorage.getItem(MUSIC_STARTUP_KEY)||'{}'));}catch{}
 const toggle=$('theaterMusicAutostart'),pick=$('theaterMusicStartupTrack'),
  launch=$('theaterMusicPlayNow'),launchStatus=$('theaterMusicStartupStatus');
 const prompt=document.createElement('div');prompt.className='theater-startup-prompt';
 prompt.id='theaterStartupPrompt';prompt.hidden=true;prompt.setAttribute('role','region');
 prompt.setAttribute('aria-label','Start your saved PROXIMUS music');
 const caption=document.createElement('span');caption.textContent='Your browser needs a tap to play your saved music.';
 const trigger=document.createElement('button');trigger.type='button';trigger.className='primary';trigger.textContent='▶ Play my music';
 const dismiss=document.createElement('button');dismiss.type='button';dismiss.className='small-btn';dismiss.textContent='Not now';dismiss.setAttribute('aria-label','Dismiss music playback prompt');
 prompt.append(caption,trigger,dismiss);document.body.append(prompt);
 const setPrompt=visible=>{pending=visible;prompt.hidden=!visible;};
 const saveStartup=()=>{
  try{localStorage.setItem(MUSIC_STARTUP_KEY,JSON.stringify(startup));return true;}
  catch{launchStatus.textContent='Autoplay preference applied only for this session; browser storage is unavailable.';return false;}
 };
 function renderStartupChoices(){
  pick.replaceChildren();
  const automatic=document.createElement('option');automatic.value='';automatic.textContent='Most recently saved song';
  pick.append(automatic);
  for(const item of rows){
   const option=document.createElement('option');
   option.value=item.id;option.textContent=item.name;pick.append(option);
  }
  if(startup.trackId&&!rows.some(r=>r.id===startup.trackId)){
   startup={...startup,trackId:''};saveStartup();
  }
  pick.value=startup.trackId;
  toggle.checked=startup.enabled;
  pick.disabled=!rows.length;
  launch.disabled=!rows.length;
  launchStatus.textContent=startup.enabled?
   'Enabled · PC attempts playback at opening; iPhone may require one tap.':
   'Off · no automatic music playback when the site opens.';
 }
 async function prepareChosen(){
  const chosen=startupTrack(rows,startup);
  if(!chosen)throw Error('Save a local song first, then choose a startup track.');
  let item=getQueued().find(q=>q.libraryId===chosen.id);
  if(!item){
   const record=await loadMusic(chosen.id);
   if(!record)throw Error('Chosen saved song cannot be found.');
   await addToQueue(await storedMusicFile(record),chosen.id);
  }
  await prepareStartup(chosen.id);
  return chosen;
 }
 async function playSaved(){
  const result=await attemptStartup();
  if(result.played){setPrompt(false);say('Playing your saved music. You can pause it from Media Theater.');return true;}
  if(result.blocked){
   setPrompt(true);
   say('Playback was blocked by this browser. Use the Play my music button when you are ready.');
  }else{
   setPrompt(false);say(result.reason||'Playback unavailable for this track.',true);
  }
  return false;
 }
 // The prepared audio element can start from a single explicit user tap.
 trigger.addEventListener('click',()=>{void playSaved();});
 dismiss.addEventListener('click',()=>setPrompt(false));
 toggle.addEventListener('change',()=>{
  startup={...startup,enabled:toggle.checked};saveStartup();
  if(!startup.enabled)setPrompt(false);
  renderStartupChoices();
  say(startup.enabled?'Opening music enabled for the next visit. Some browsers require a Play tap.':
   'Opening music disabled. Current playback is not interrupted.');
 });
 pick.addEventListener('change',async()=>{
  startup={...startup,trackId:pick.value};saveStartup();setPrompt(false);
  // Preselect before the later Play tap, avoiding an asynchronous activation gap.
  try{await prepareChosen();say('Startup song prepared. Tap Play now or return on your next visit.');}
  catch(error){say(error.message,true);}
 });
 launch.addEventListener('click',()=>{void playSaved();});
 const say=(message,error=false)=>{
  status.textContent=message;status.dataset.error=error?'true':'false';
 };
 const setBusy=value=>{
  busy=value;
  for(const id of ['theaterMusicSaveCurrent','theaterMusicSaveQueue','theaterMusicRefresh'])
   $(id).disabled=value;
 };
 async function refresh(){
  rows=(await listMusic()).sort((a,b)=>(b.addedAt||0)-(a.addedAt||0));
  count.textContent=rows.length+' / '+MAX_TRACKS+' saved';
  storage.textContent=bytes(rows.reduce((sum,r)=>sum+r.bytes,0))+' stored locally';
  list.replaceChildren();
  renderStartupChoices();
  if(!rows.length){
   const empty=document.createElement('p');empty.className='hint';
   empty.textContent='No saved music yet. Add audio files to the queue, then choose Save queue music.';
   list.append(empty);return;
  }
  for(const item of rows){
   const wrap=document.createElement('div');wrap.className='theater-saved-track';
   const text=document.createElement('div');text.className='theater-saved-track-info';
   const title=document.createElement('strong');title.textContent=item.name;
   const details=document.createElement('small');details.textContent=bytes(item.bytes);
   text.append(title,details);
   const play=document.createElement('button');play.type='button';play.className='small-btn';
   play.textContent='＋ Queue';play.title='Add this saved music file to the current playlist';
   play.addEventListener('click',wrapAsync(async()=>{
    if(busy)return;
    const record=await loadMusic(item.id);
    if(!record)throw Error('Track no longer exists. Refresh the saved library.');
    const file=await storedMusicFile(record);
    const result=await addToQueue(file,item.id);
    say(result?'Added '+item.name+' to the playback queue. Tap Play when ready.':'This song is already in the current queue.');
   }));
   const remove=document.createElement('button');remove.type='button';remove.className='small-btn';
   remove.textContent='Remove';remove.title='Permanently delete local saved music copy';
   remove.addEventListener('click',wrapAsync(async()=>{
    if(busy||!confirm('Remove "'+item.name+'" from saved music on this device? The current session queue and your original file are not deleted.'))return;
    setBusy(true);
    try{await deleteMusic(item.id);await refresh();say('Saved copy removed. The current listening session remains unchanged.');}
    finally{setBusy(false);}
   }));
   wrap.append(text,play,remove);list.append(wrap);
  }
 }
 function wrapAsync(fn){
  return async()=>{
   try{await fn();}catch(e){say(e?.message||'Unable to manage saved music.',true);}
  };
 }
 async function saveTracks(files){
  if(busy)return;
  const audio=files.filter(file=>isLocalAudio(file));
  if(!audio.length){say('Add a local audio file to Media Theater first. Videos remain in Video Vault.');return;}
  setBusy(true);
  let added=0,duplicates=0,failed=0;
  try{
   for(const file of audio){
    try{
     const result=await saveMusic(file);
     result.duplicate?duplicates++:added++;
    }catch(error){failed++;say('Could not save "'+file.name+'": '+error.message,true);break;}
   }
   await refresh();
   if(!failed)say(added+' song'+(added===1?'':'s')+' saved · '+duplicates+' already stored. Library restores when you reopen this browser.');
  }finally{setBusy(false);}
 }
 $('theaterMusicSaveCurrent').addEventListener('click',wrapAsync(async()=>{
  const item=getCurrent();await saveTracks(item?[item.file]:[]);
 }));
 $('theaterMusicSaveQueue').addEventListener('click',wrapAsync(async()=>{
  await saveTracks(getQueued().map(item=>item.file));
 }));
 $('theaterMusicRefresh').addEventListener('click',wrapAsync(async()=>{
  if(busy)return;
  await refresh();say('Saved local music refreshed. Select ＋ Queue to add another track.');
 }));
 async function autoRestore(){
  try{
   setBusy(true);await refresh();
   let loaded=0;
   // Restore queue on each browser visit, but do not autoplay or bypass gesture policies.
   for(const item of rows.slice().reverse()){
    if(getQueued().length>=80)break;
    try{
     const record=await loadMusic(item.id);
     if(!record)continue;
     const file=await storedMusicFile(record);
     if(await addToQueue(file,item.id))loaded++;
    }catch(e){}
   }
   if(rows.length&&startup.enabled){
    try{
     const chosen=await prepareChosen();
     // Attempt once when opening, then respect browser autoplay permission.
     await playSaved();
     if(pending)launchStatus.textContent='Tap Play my music to start '+chosen.name+'.';
     else if(!getCurrent()?.file?.name)launchStatus.textContent='Startup playback could not begin.';
    }catch(error){setPrompt(false);say('Startup music unavailable: '+error.message,true);}
   }else say(rows.length?loaded+' saved song'+(loaded===1?'':'s')+' restored to your queue. Tap Play when ready.':'Your personal saved music library is ready.');
  }catch(error){say('Local music storage is unavailable: '+error.message+'. You can still import session music.',true);}
  finally{setBusy(false);}
 }
 document.getElementById('theaterAudio')?.addEventListener('play',()=>setPrompt(false));
 void autoRestore();
}
