// PROXIMUS Video Vault v3.6.4 — streamed Origin Private File System (OPFS) adapter.
// Uses browser-managed origin storage, NOT the user's Photos/Files original and NOT a server.
// Older Safari implementations lacking createWritable fall back to chunked IndexedDB.
import {VIDEO_VAULT_OPFS_DIRECTORY} from './video-vault-core.js';

const OPFS_WRITE_BYTES=8*1024*1024;
const safeExt=name=>{
 const ext=String(name||'').match(/\.([a-z0-9]{1,8})$/i)?.[1]?.toLowerCase()||'bin';
 return ext;
};
export function opfsVideoFilename(meta){
 const id=String(meta?.id||'');
 if(!/^[a-zA-Z0-9-]{8,80}$/.test(id))throw Error('Invalid OPFS media identifier.');
 return id+'.'+safeExt(meta.name);
}
export async function openVideoOpfs(storage=globalThis.navigator?.storage,{create=false}={}){
 if(!storage||typeof storage.getDirectory!=='function')return null;
 const root=await storage.getDirectory();
 return root.getDirectoryHandle(VIDEO_VAULT_OPFS_DIRECTORY,{create});
}
function canceled(signal){
 if(signal?.aborted)throw Object.assign(Error('Video import canceled.'),{name:'AbortError'});
}
export async function saveVideoOpfs(meta,file,{storage=globalThis.navigator?.storage,signal,onProgress}={}){
 let dir;
 try{
  dir=await openVideoOpfs(storage,{create:true});
 }catch(error){
  if(['SecurityError','NotSupportedError','NotFoundError'].includes(error?.name))return {supported:false};
  throw error;
 }
 if(!dir)return {supported:false};
 const name=opfsVideoFilename(meta);
 let handle;
 try{handle=await dir.getFileHandle(name,{create:true});}
 catch(error){
  if(['SecurityError','NotSupportedError'].includes(error?.name))return {supported:false};
  throw error;
 }
 if(typeof handle.createWritable!=='function'){
  try{await dir.removeEntry(name);}catch{}
  return {supported:false};
 }
 let writer;
 try{
  writer=await handle.createWritable();
  canceled(signal);
  for(let at=0;at<file.size;at+=OPFS_WRITE_BYTES){
   canceled(signal);
   const end=Math.min(file.size,at+OPFS_WRITE_BYTES);
   // Blob.slice is file-backed; do not arrayBuffer() the entire video.
   await writer.write(file.slice(at,end));
   onProgress?.(end,file.size,'OPFS');
  }
  canceled(signal);
  await writer.close();writer=null;
  const verify=await handle.getFile();
  if(verify.size!==meta.bytes)throw Error('Imported video size does not match original; local copy was discarded.');
  return {supported:true,fileName:name};
 }catch(error){
  try{if(writer)await writer.abort();}catch{}
  try{await dir.removeEntry(name);}catch{}
  throw error;
 }
}
export async function readVideoOpfs(meta,{storage=globalThis.navigator?.storage}={}){
 const dir=await openVideoOpfs(storage,{create:false});
 if(!dir)throw Error('This browser does not support the stored large-video file system.');
 const handle=await dir.getFileHandle(meta.opfsName||opfsVideoFilename(meta));
 const file=await handle.getFile();
 if(file.size!==meta.bytes)throw Error('The saved large video is incomplete or no longer available.');
 // Returning a file-backed Blob avoids loading the complete video into JavaScript RAM.
 return file.type===meta.mime?file:file.slice(0,file.size,meta.mime);
}
export async function deleteVideoOpfs(meta,{storage=globalThis.navigator?.storage}={}){
 try{
  const dir=await openVideoOpfs(storage,{create:false});
  if(!dir)return;
  await dir.removeEntry(meta.opfsName||opfsVideoFilename(meta));
 }catch(error){if(error?.name!=='NotFoundError'&&error?.name!=='SecurityError')throw error;}
}
export function isVideoOpfsSupported(storage=globalThis.navigator?.storage){
 return !!storage&&typeof storage.getDirectory==='function';
}
