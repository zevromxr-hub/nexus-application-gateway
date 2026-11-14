// PROXIMUS v3.5.2 | Personal Music Library
// User-imported music is persisted solely in this browser's IndexedDB, never uploaded.
import {$,bytes,wrap} from './core.js';
import {listMusic,loadMusic,saveMusic,deleteMusic,storedMusicFile,isLocalAudio,MAX_TRACKS} from './music-library-core.js';

export function initLocalMusicLibrary({getCurrent,getQueued,addToQueue}){
 const list=$('theaterMusicSavedList'),status=$('theaterMusicStatus'),
  count=$('theaterMusicCount'),storage=$('theaterMusicSize');
 if(!list||!status||!count||!storage)return;
 let busy=false,rows=[];
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
   say(rows.length?loaded+' saved music track'+(loaded===1?'':'s')+' restored to the listening queue. Tap Play to start.':'Your personal saved music library is ready.');
  }catch(error){say('Local music storage is unavailable: '+error.message+'. You can still import session music.',true);}
  finally{setBusy(false);}
 }
 void autoRestore();
}
