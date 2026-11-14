// PROXIMUS | Asset Alchemist — local Video Vault model v3.1
// Only file metadata is listed. Original video Blobs live in a separate IndexedDB store.
export const VIDEO_VAULT_DB='proximus-video-vault-v1';
export const VIDEO_VAULT_SCHEMA=1;
export const VIDEO_VAULT_MAX_ITEMS=500;
export const VIDEO_VAULT_MAX_BYTES=750*1024*1024;
export const VIDEO_VAULT_IPHONE_MAX_BYTES=450*1024*1024;
const VIDEO_EXT=/\.(mp4|m4v|mov|webm|ogv|ogg)$/i;
const VIDEO_TYPES=new Set(['video/mp4','video/webm','video/quicktime','video/x-m4v','video/ogg']);
export function videoFileType(file){
 const name=String(file?.name||''),mime=String(file?.type||'').toLowerCase();
 if(!VIDEO_EXT.test(name)&&!VIDEO_TYPES.has(mime))return '';
 if(VIDEO_TYPES.has(mime))return mime;
 const ext=name.split('.').pop().toLowerCase();
 return ({mp4:'video/mp4',m4v:'video/mp4',mov:'video/quicktime',webm:'video/webm',ogv:'video/ogg',ogg:'video/ogg'})[ext]||'';
}
export function validateVideoFile(file,{mobile=false}={}){
 const mime=videoFileType(file);
 if(!mime)throw Error('Use a local MP4, M4V, MOV, WebM or OGV video.');
 const size=Number(file?.size),max=mobile?VIDEO_VAULT_IPHONE_MAX_BYTES:VIDEO_VAULT_MAX_BYTES;
 if(!Number.isFinite(size)||size<1)throw Error('This video file is empty.');
 if(size>max)throw Error('This video is larger than the '+(mobile?'450 MB mobile':'750 MB desktop')+' per-video limit. Keep a smaller original on your device.');
 return mime;
}
export function safeVideoName(name){
 return String(name||'Untitled video').replace(/[\\/:*?"<>|\x00-\x1f]/g,'_').trim().slice(0,180)||'Untitled video';
}
export function videoFingerprint(file){
 return safeVideoName(file?.name).toLowerCase()+':'+Number(file?.size||0)+':'+Number(file?.lastModified||0);
}
export function createVideoMetadata(file,id,now=Date.now(),{mobile=false}={}){
 const mime=validateVideoFile(file,{mobile});
 if(typeof id!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(id))throw Error('Invalid video library identifier.');
 return {id,name:safeVideoName(file.name),mime,bytes:file.size,
  fingerprint:videoFingerprint(file),added:now,updated:now,
  favorite:false,collection:'Unsorted',position:0,duration:0,watched:0,poster:null};
}
export function normalizeVideoCollection(value){
 return String(value||'Unsorted').trim().slice(0,42).replace(/[<>\\\x00-\x1f]/g,'')||'Unsorted';
}
export function videoTime(value){
 const sec=Math.max(0,Math.floor(Number(value)||0));
 const hours=Math.floor(sec/3600),mins=Math.floor(sec/60)%60,seconds=sec%60;
 return (hours?hours+':':'')+(hours?String(mins).padStart(2,'0'):String(mins))+':'+String(seconds).padStart(2,'0');
}
export function sortVideoLibrary(list,{query='',filter='all',sort='recent'}={}){
 const q=String(query).trim().toLowerCase();
 const allowed=['all','favorites','unwatched','in-progress'];if(!allowed.includes(filter))filter='all';
 const filtered=list.filter(x=>{
  if(filter==='favorites'&&!x.favorite)return false;
  if(filter==='unwatched'&&x.watched>0)return false;
  if(filter==='in-progress'&&!(x.position>0))return false;
  return !q||((x.displayTitle||'')+' '+x.name+' '+(x.collection||'')).toLowerCase().includes(q);
 });
 return filtered.sort((a,b)=>{
  if(sort==='name')return (a.displayTitle||a.name).localeCompare(b.displayTitle||b.name);
  if(sort==='favorites')return Number(b.favorite)-Number(a.favorite)||b.added-a.added;
  if(sort==='oldest')return a.added-b.added;
  if(sort==='size')return b.bytes-a.bytes;
  return (b.watched||b.added)-(a.watched||a.added);
 });
}
export function vaultStorageWarning(persisted){
 return persisted?'Persistent storage granted on this browser. Deleting website data or this app still removes locally stored videos.':
 'Browser-managed local storage can be cleared by iOS/your browser if storage runs low, website data is removed, or private browsing ends. Keep originals in Files/Photos.';
}
