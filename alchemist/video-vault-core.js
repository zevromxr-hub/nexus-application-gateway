// PROXIMUS | Asset Alchemist — local Video Vault model v3.1
// Only file metadata is listed. Original video Blobs live in a separate IndexedDB store.
export const VIDEO_VAULT_DB='proximus-video-vault-v1';
export const VIDEO_VAULT_SCHEMA=2; // additive migration: retains all original 'items' and 'files' stores
export const VIDEO_VAULT_MAX_ITEMS=500;
// These are generous guardrails, not guaranteed quotas: the browser/device decides actual capacity.
export const VIDEO_VAULT_MAX_BYTES=16*1024*1024*1024;
export const VIDEO_VAULT_IPHONE_MAX_BYTES=8*1024*1024*1024;
export const VIDEO_VAULT_CHUNK_BYTES=16*1024*1024;
export const VIDEO_VAULT_OPFS_DIRECTORY='proximus-vault-media-v2';
// Accept more user-owned video containers without pretending every browser can decode them.
const VIDEO_EXT=/\.(mp4|m4v|mov|webm|ogv|ogg|mkv|avi|wmv|flv|f4v|mts|m2ts|ts|3gp|3g2|mpg|mpeg|hevc|h264|h265|mxf)$/i;
const MIME_FOR_EXT={
 mp4:'video/mp4',m4v:'video/mp4',mov:'video/quicktime',webm:'video/webm',
 ogv:'video/ogg',ogg:'video/ogg',mkv:'video/x-matroska',avi:'video/x-msvideo',
 wmv:'video/x-ms-wmv',flv:'video/x-flv',f4v:'video/mp4',mts:'video/mp2t',
 m2ts:'video/mp2t',ts:'video/mp2t','3gp':'video/3gpp','3g2':'video/3gpp2',
 mpg:'video/mpeg',mpeg:'video/mpeg',hevc:'video/hevc',h264:'video/mp4',
 h265:'video/hevc',mxf:'application/mxf'
};
const VIDEO_TYPES=new Set([
 'video/mp4','video/webm','video/quicktime','video/x-m4v','video/ogg',
 'video/x-matroska','video/x-msvideo','video/x-ms-wmv','video/x-flv',
 'video/mp2t','video/3gpp','video/3gpp2','video/mpeg','video/hevc',
 'video/av1','video/h264','video/h265','application/mxf'
]);
export function videoFileType(file){
 const name=String(file?.name||''),mime=String(file?.type||'').toLowerCase().split(';')[0].trim();
 const ext=name.split('.').pop().toLowerCase(),byExtension=VIDEO_EXT.test(name)?MIME_FOR_EXT[ext]:'';
 if(!byExtension&&!VIDEO_TYPES.has(mime)&&!/^video\/[a-z0-9][a-z0-9.+-]*$/.test(mime))return '';
 // Prefer reliable filename inference for iPhone Files imports that report application/octet-stream.
 if(!mime||mime==='application/octet-stream')return byExtension||'';
 if(VIDEO_TYPES.has(mime)||mime.startsWith('video/'))return mime;
 return byExtension||'';
}
export function validateVideoFile(file,{mobile=false}={}){
 const mime=videoFileType(file);
 if(!mime)throw Error('Choose a local video file. MP4, MOV, M4V, WebM, MKV, AVI, MPEG, TS, 3GP and more can be stored.');
 const size=Number(file?.size),max=mobile?VIDEO_VAULT_IPHONE_MAX_BYTES:VIDEO_VAULT_MAX_BYTES;
 if(!Number.isSafeInteger(size)||size<1)throw Error('This video file is empty or its size could not be read.');
 if(size>max)throw Error('Video exceeds the '+(mobile?'8 GB iPhone/iPad':'16 GB desktop')+' safety guardrail. Browser storage quotas may be lower.');
 return mime;
}
export function videoStorageSlices(size,chunkBytes=VIDEO_VAULT_CHUNK_BYTES){
 if(!Number.isSafeInteger(size)||size<1)throw Error('Invalid video size.');
 if(!Number.isSafeInteger(chunkBytes)||chunkBytes<1)throw Error('Invalid local storage chunk size.');
 return Math.ceil(size/chunkBytes);
}
export function videoPlaybackHint(mime,canPlay=''){
 if(canPlay==='probably'||canPlay==='maybe')return 'Browser-compatible container indicated; its codec must still be supported.';
 if(mime==='video/mp4'||mime==='video/quicktime'||mime==='video/x-m4v')
  return 'Stored original. MP4/MOV playback depends on the actual H.264/HEVC/AV1 codec and browser.';
 return 'Stored original. This container may need conversion for playback in Safari; its bytes remain safe to export.';
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
