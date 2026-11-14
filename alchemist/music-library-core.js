// PROXIMUS v3.5.2 | Local Music Library — opt-in IndexedDB audio only, no uploads.
export const MUSIC_DB='proximus-theater-local-music-v1',MUSIC_STORE='tracks';
export const MAX_TRACKS=150,MAX_TRACK_BYTES=250000000;
export const MUSIC_STARTUP_KEY='proximus-music-startup-v1';
export function normalizeMusicStartup(raw={}){
 const s=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 return {enabled:s.enabled===true,trackId:typeof s.trackId==='string'&&s.trackId.length<=500?s.trackId:''};
}
export function startupTrack(rows=[],settings={}){
 const s=normalizeMusicStartup(settings);
 if(!Array.isArray(rows)||!rows.length)return null;
 return rows.find(r=>r.id===s.trackId)||rows[0];
}

const audioExt=/\.(mp3|wav|ogg|m4a|aac|flac|opus|aiff|aif)$/i;
export function isLocalAudio(file){
 const mime=String(file?.type||'');
 const name=String(file?.name||'');
 return mime.startsWith('audio/')||audioExt.test(name);
}
export function audioTrackId(file){
 if(!isLocalAudio(file)||!Number.isSafeInteger(file.size)||file.size<=0||file.size>MAX_TRACK_BYTES)throw Error('Select an audio file under 250 MB.');
 const name=String(file.name||'').slice(0,255);
 const modified=Number.isSafeInteger(file.lastModified)?file.lastModified:0;
 return JSON.stringify([name,file.size,modified]);
}
export function sanitizeSavedTrack(record){
 if(!record||typeof record!=='object'||typeof record.id!=='string'||typeof record.name!=='string'||
  !Number.isSafeInteger(record.bytes)||record.bytes<=0||record.bytes>MAX_TRACK_BYTES||
  !record.blob||typeof record.blob.size!=='number'||record.blob.size!==record.bytes)throw Error('A stored music track is damaged.');
 return {id:record.id,name:record.name.slice(0,255),bytes:record.bytes,mime:String(record.mime||'audio/mpeg').slice(0,90),addedAt:record.addedAt||0};
}
export function openMusicDB(){
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined'){reject(Error('This browser does not support saved local music.'));return;}
  const req=indexedDB.open(MUSIC_DB,1);
  req.onupgradeneeded=()=>{
   if(!req.result.objectStoreNames.contains(MUSIC_STORE))req.result.createObjectStore(MUSIC_STORE,{keyPath:'id'});
  };
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(Error('Could not open the local music library.'));
  req.onblocked=()=>reject(Error('Music library is busy in another browser tab. Close other tabs and retry.'));
 });
}
async function inStore(mode,transaction){
 const db=await openMusicDB();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(MUSIC_STORE,mode),store=tx.objectStore(MUSIC_STORE);
  let data;
  try{data=transaction(store);}catch(e){tx.abort();reject(e);return;}
  tx.oncomplete=()=>resolve(data);
  tx.onerror=tx.onabort=()=>reject(Error('Unable to save music. Check available device storage and browser permissions.'));
 });}finally{db.close();}
}
export async function listMusic(){
 const db=await openMusicDB();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(MUSIC_STORE,'readonly'),request=tx.objectStore(MUSIC_STORE).openCursor(),results=[];
  request.onsuccess=()=>{
   const cursor=request.result;
   if(cursor){try{results.push(sanitizeSavedTrack(cursor.value));}catch{}cursor.continue();}
   else resolve(results);
  };
  request.onerror=()=>reject(Error('Could not load saved music.'));
 });}finally{db.close();}
}
export async function loadMusic(id){
 const db=await openMusicDB();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(MUSIC_STORE,'readonly'),request=tx.objectStore(MUSIC_STORE).get(id);
  request.onsuccess=()=>resolve(request.result||null);
  request.onerror=()=>reject(Error('Could not load this saved track.'));
 });}finally{db.close();}
}
export async function saveMusic(file){
 const id=audioTrackId(file);
 const rows=await listMusic();
 if(rows.some(x=>x.id===id))return {id,duplicate:true};
 if(rows.length>=MAX_TRACKS)throw Error('Saved music library has reached 150 tracks.');
 const track={id,name:String(file.name).slice(0,255),mime:String(file.type||'audio/mpeg').slice(0,90),
  bytes:file.size,modified:Number.isSafeInteger(file.lastModified)?file.lastModified:0,
  addedAt:Date.now(),blob:file};
 await inStore('readwrite',s=>{s.put(track);});
 return {id,duplicate:false};
}
export async function deleteMusic(id){
 if(typeof id!=='string'||id.length>500)throw Error('Invalid saved track.');
 await inStore('readwrite',store=>{store.delete(id);});
}
export async function storedMusicFile(record){
 const safe=sanitizeSavedTrack(record);
 return new File([record.blob],safe.name,{type:safe.mime,lastModified:Number.isSafeInteger(record.modified)?record.modified:0});
}
