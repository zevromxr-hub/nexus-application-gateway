// PROXIMUS 3.6.4 — large local media importer (iPhone/PC) and OPFS regression suite.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
 VIDEO_VAULT_DB,VIDEO_VAULT_SCHEMA,VIDEO_VAULT_MAX_BYTES,VIDEO_VAULT_IPHONE_MAX_BYTES,
 VIDEO_VAULT_CHUNK_BYTES,VIDEO_VAULT_OPFS_DIRECTORY,videoFileType,validateVideoFile,
 videoStorageSlices,videoPlaybackHint,createVideoMetadata
} from '../video-vault-core.js';
import {
 opfsVideoFilename,saveVideoOpfs,readVideoOpfs,deleteVideoOpfs,isVideoOpfsSupported
} from '../video-vault-opfs.js';

const root=path.resolve(import.meta.dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const app=read('app.js'),vault=read('video-vault.js'),html=read('index.html'),css=read('video-vault-ultra.css'),
 sw=read('sw.js');
assert.equal(VIDEO_VAULT_DB,'proximus-video-vault-v1','Keep the exact old database without reset');
assert.equal(VIDEO_VAULT_SCHEMA,2,'Add chunks store non-destructively in IndexedDB v2');
assert.equal(VIDEO_VAULT_IPHONE_MAX_BYTES,8*1024*1024*1024);
assert.equal(VIDEO_VAULT_MAX_BYTES,16*1024*1024*1024);
assert.equal(VIDEO_VAULT_CHUNK_BYTES,16*1024*1024);
assert.equal(videoStorageSlices(100,16),7);
assert.equal(videoStorageSlices(6*1024*1024*1024,16*1024*1024),384);
assert.throws(()=>videoStorageSlices(0),/Invalid video size/);
const accepted=[
 ['clip.mp4','video/mp4'],['clip.MOV','video/quicktime'],['clip.MKV','video/x-matroska'],
 ['clip.AVI','video/x-msvideo'],['clip.ts','video/mp2t'],['clip.m2ts','video/mp2t'],
 ['clip.mts','video/mp2t'],['clip.3gp','video/3gpp'],['clip.3g2','video/3gpp2'],
 ['clip.ogg','video/ogg'],['clip.webm','video/webm'],['clip.flv','video/x-flv'],
 ['clip.wmv','video/x-ms-wmv'],['clip.mpeg','video/mpeg'],['clip.hevc','video/hevc'],
 ['clip.mxf','application/mxf']
];
for(const [name,mime] of accepted){
 assert.equal(videoFileType({name,type:''}),mime,'Must allow locally saving '+name);
 assert.equal(validateVideoFile({name,type:'',size:2*1024*1024*1024},{mobile:true}),mime);
}
assert.equal(videoFileType({name:'unknown.video',type:'video/x-prores'}),'video/x-prores','Recognize unusual video MIME without promising native decoding');
assert.equal(videoFileType({name:'private.txt',type:'text/plain'}),'');
assert.equal(videoFileType({name:'clip.mkv',type:'application/octet-stream'}),'video/x-matroska');
assert.throws(()=>validateVideoFile({name:'clip.mp4',size:0}),/empty/);
assert.throws(()=>validateVideoFile({name:'clip.mp4',size:VIDEO_VAULT_IPHONE_MAX_BYTES+1},{mobile:true}),/8 GB/);
assert.equal(videoPlaybackHint('video/x-matroska','').includes('may need conversion'),true);
const meta=createVideoMetadata({name:'Season.MOV',type:'video/quicktime',size:900000000,
 lastModified:27},'abcdefgh-0001',12345,{mobile:true});
assert.equal(meta.bytes,900000000);
assert.equal(opfsVideoFilename(meta),'abcdefgh-0001.mov');
assert.equal(isVideoOpfsSupported({getDirectory(){}}),true);
assert.equal(isVideoOpfsSupported({}),false);

// A fake OPFS storage adapter lets us verify binary integrity, streaming progress,
// explicit abort rollback, deletion and support fallbacks without real iOS hardware.
function fakeStorage({writable=true}={}){
 const entries=new Map();
 const dir={
  async getFileHandle(name,{create=false}={}){
   if(!entries.has(name)){
    if(!create)throw Object.assign(Error('Not found'),{name:'NotFoundError'});
    entries.set(name,{blobs:[],committed:false});
   }
   const ref=entries.get(name);
   const handle={
    async getFile(){return new Blob(ref.blobs,{type:'video/mp4'});}
   };
   if(writable)handle.createWritable=async()=>({
    async write(blob){assert.ok(blob instanceof Blob);ref.blobs.push(blob);},
    async close(){ref.committed=true;},
    async abort(){ref.blobs=[];ref.committed=false;}
   });
   return handle;
  },
  async removeEntry(name){entries.delete(name);}
 };
 return {storage:{getDirectory:async()=>({getDirectoryHandle:async name=>{
   assert.equal(name,VIDEO_VAULT_OPFS_DIRECTORY);return dir;
  }})},entries};
}
const store=fakeStorage();
const data=new Blob([new Uint8Array(8*1024*1024),new Uint8Array(8*1024*1024),new Uint8Array(3)],{type:'video/mp4'});
const testMeta={...meta,bytes:data.size};
let progress=[];
const out=await saveVideoOpfs(testMeta,data,{storage:store.storage,onProgress:(done,total,mode)=>progress.push({done,total,mode})});
assert.equal(out.supported,true);
assert.equal(out.fileName,'abcdefgh-0001.mov');
assert.equal(progress.length,3,'17MB data must be split into 8MB writes');
assert.equal(progress.at(-1).done,data.size);
assert.equal(progress.at(-1).mode,'OPFS');
const copy=await readVideoOpfs({...testMeta,opfsName:out.fileName},{storage:store.storage});
assert.equal(copy.size,data.size);
assert.equal(copy.type,'video/mp4');
await deleteVideoOpfs({...testMeta,opfsName:out.fileName},{storage:store.storage});
assert.equal(store.entries.size,0,'Deletion must free local media bytes');
const legacy=fakeStorage({writable:false});
assert.equal((await saveVideoOpfs(testMeta,data,{storage:legacy.storage})).supported,false);
assert.equal(legacy.entries.size,0,'Older Safari should fall back without leaving orphan OPFS media');
const canceled=fakeStorage(),control=new AbortController();
await assert.rejects(saveVideoOpfs(testMeta,data,{storage:canceled.storage,signal:control.signal,
 onProgress(){control.abort();}}),{name:'AbortError'});
assert.equal(canceled.entries.size,0,'Cancel must remove partially streamed file');

for(const id of ['videoVaultPlayFromFiles','videoVaultDirectFiles','videoVaultKeepSession',
 'videoVaultCancelImport','videoVaultImportMeter','videoVaultImportProgress','videoVaultImportDetail']){
 assert.equal((html.match(new RegExp('id="'+id+'"','g'))||[]).length,1,'Expected one local media control: '+id);
}
assert.ok(html.includes('video/*,.mp4,.m4v,.mov,.webm'),'Broad iOS Photos/Files file-type selection');
assert.ok(html.includes('8 GB per file on iPhone/iPad'),'Show honest new upper guardrails');
assert.ok(html.includes('Play from Files · no copy'),'Give users a way to watch without duplicating a huge video');
assert.ok(vault.includes("db.createObjectStore('chunks'"),'Schema v2 must add a chunk store');
assert.ok(vault.includes("if(meta.storage==='opfs')return readVideoOpfs(meta)"),'Restore OPFS-backed media');
assert.ok(vault.includes("if(meta.storage==='chunks')return readVideoChunked(meta)"),'Restore chunked media');
assert.ok(vault.includes("transaction(['files'],'readonly',store=>store.get(id))"),'Legacy v1 stored videos still load');
assert.ok(vault.includes("const start=i*VIDEO_VAULT_CHUNK_BYTES"),'Fallback imports use 16 MB slices');
assert.ok(vault.includes("new Blob(parts,{type:meta.mime"),'Assemble previously saved slices for native playback');
assert.ok(vault.includes('importController.abort()'),'Import cancellation uses AbortController');
assert.ok(vault.includes('reportImportProgress('),'Progress should display from local file bytes');
assert.ok(vault.includes('sessionFile=file;currentURL=URL.createObjectURL(file)'),'No-copy session playback must not enter IDB');
assert.ok(vault.includes("if(sessionFile)video.pause()"),'Do not play invisible sessions in other studios');
assert.ok(css.includes('@media(max-width:520px)'),'Fit large-import controls on narrow iPhone screen');
assert.ok(sw.includes("'./video-vault-opfs.js'")&&sw.includes("'./video-vault-ultra.css'"),'New modules must load offline');
assert.equal([...html.matchAll(/<section class="studio" data-panel="([^"]+)"/g)].length,20,'Preserve all studio routes');
console.log('PASS v3.6.4: up to 8GB iPhone/16GB desktop, OPFS streamed integrity/cancel, older Safari chunk fallback, codec guidance, zero-copy previews, existing libraries.');
