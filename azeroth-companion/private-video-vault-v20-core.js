/* NEXUS | AZEROTH v20.0 — SOVEREIGN PRIVATE VIDEO VAULT
 * Locally encrypted media; NOTHING uploaded to GitHub, Cloudflare, or any server.
 * AES-256-GCM with fresh random 96-bit IV per chunk; password-derived PBKDF2
 * SHA-256 key (600,000 iterations, random 128-bit salt). No stored plaintext
 * filenames, passwords, decryption keys, thumbnails or decrypted media.
 * Videos can be played only after password verification and decryption.
 * Browser storage can be erased by user/OS: encrypted archives are essential.
 */
(()=>{'use strict';
const NAME='nexus_azeroth_secure_video_v20',FORMAT='nexus-vault/1',ARCHIVE='nexus-vault-backup/1';
const CHUNK=2*1024*1024,ITERATIONS=600000,MAX_CLIPS=120;
const MAX_VIDEO_TOUCH=200*1024*1024,MAX_VIDEO_DESKTOP=512*1024*1024;
const textEncoder=new TextEncoder(),textDecoder=new TextDecoder();
let database=null;
function ensure(){if(!globalThis.crypto?.subtle||!globalThis.indexedDB)throw Error('Secure encrypted storage requires HTTPS and IndexedDB in this browser.');}
function bytes(buffer){return buffer instanceof Uint8Array?buffer:new Uint8Array(buffer)}
function b64(input){const b=bytes(input);if(b.length>10000)throw Error('Invalid metadata length');let s='';for(const n of b)s+=String.fromCharCode(n);return btoa(s)}
function un64(str,max=10000){if(typeof str!=='string'||str.length>max*2||!/^[A-Za-z0-9+/]*={0,2}$/.test(str))throw Error('Invalid encoded metadata');const raw=atob(str);if(raw.length>max)throw Error('Oversized metadata');return Uint8Array.from(raw,c=>c.charCodeAt(0))}
const random=n=>crypto.getRandomValues(new Uint8Array(n));
const ident=()=>Array.from(random(16),x=>x.toString(16).padStart(2,'0')).join('');
const clean=(value,max=220)=>typeof value==='string'?value.trim().slice(0,max):'';
const fileLimit=()=>matchMedia('(pointer: coarse)').matches?MAX_VIDEO_TOUCH:MAX_VIDEO_DESKTOP;
function open(){
 ensure();
 if(database)return Promise.resolve(database);
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(NAME,1);
  req.onupgradeneeded=()=>{
   const db=req.result;
   if(!db.objectStoreNames.contains('config'))db.createObjectStore('config',{keyPath:'id'});
   if(!db.objectStoreNames.contains('clips'))db.createObjectStore('clips',{keyPath:'id'});
   if(!db.objectStoreNames.contains('parts')){
    const store=db.createObjectStore('parts',{keyPath:['id','index']});
    store.createIndex('by_clip','id',{unique:false});
   }
  };
  req.onsuccess=()=>{database=req.result;database.onversionchange=()=>{database.close();database=null};resolve(database)};
  req.onerror=()=>reject(req.error||Error('Cannot open local encrypted vault'));
  req.onblocked=()=>reject(Error('Close any other old NEXUS Vault tabs and retry'));
 });
}
async function get(store,key){
 const db=await open();
 return new Promise((resolve,reject)=>{
  const req=db.transaction(store,'readonly').objectStore(store).get(key);
  req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
 });
}
async function all(store){
 const db=await open();
 return new Promise((resolve,reject)=>{
  const req=db.transaction(store,'readonly').objectStore(store).getAll();
  req.onsuccess=()=>resolve(req.result||[]);req.onerror=()=>reject(req.error);
 });
}
async function put(store,value){
 const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(store,'readwrite');
  tx.objectStore(store).put(value);
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Browser storage rejected this write'));
  tx.onabort=()=>reject(tx.error||Error('Browser storage transaction aborted'));
 });
}
async function removeClip(id){
 const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['parts','clips'],'readwrite');
  const index=tx.objectStore('parts').index('by_clip');
  const cursor=index.openKeyCursor(IDBKeyRange.only(id));
  cursor.onsuccess=()=>{const c=cursor.result;if(c){tx.objectStore('parts').delete(c.primaryKey);c.continue()}};
  tx.objectStore('clips').delete(id);
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 });
}
async function clearOrphans(){
 if(await get('config','vault'))throw Error('A vault is already present; do not overwrite existing private videos');
 const db=await open();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(['clips','parts'],'readwrite');
  tx.objectStore('clips').clear();tx.objectStore('parts').clear();
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error||Error('Cannot clear incomplete import'));
 });
}
async function derive(password,salt,iterations=ITERATIONS){
 if(typeof password!=='string'||password.length<12||password.length>512)throw Error('Password must be between 12 and 512 characters');
 if(iterations!==ITERATIONS)throw Error('Unsupported vault encryption settings');
 const material=await crypto.subtle.importKey('raw',textEncoder.encode(password),{name:'PBKDF2'},false,['deriveKey']);
 return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations,hash:'SHA-256'},material,
  {name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function seal(key,input){
 const iv=random(12),ct=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,bytes(input));
 return {iv,ct};
}
async function unseal(key,obj){
 if(!obj||bytes(obj.iv).byteLength!==12)throw Error('Damaged encrypted video');
 return crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(obj.iv)},key,bytes(obj.ct));
}
const VERIFY='NEXUS:AES256-GCM:VAULT:v20:verified';
async function create(password){
 if(await get('config','vault'))throw Error('This browser already contains an encrypted vault');
 const salt=random(16),key=await derive(password,salt);
 const encrypted=await seal(key,textEncoder.encode(VERIFY));
 await put('config',{id:'vault',format:FORMAT,salt,iterations:ITERATIONS,iv:encrypted.iv,ct:encrypted.ct});
 return key;
}
async function unlock(password){
 const config=await get('config','vault');
 if(!config||config.format!==FORMAT)throw Error('No compatible encrypted vault exists');
 const key=await derive(password,bytes(config.salt),config.iterations);
 try{
  const check=await unseal(key,config);
  if(textDecoder.decode(check)!==VERIFY)throw Error('Vault verifier was damaged');
 }catch(_){throw Error('Incorrect vault password or damaged encrypted storage')}
 return key;
}
async function encryptInfo(key,info){
 return seal(key,textEncoder.encode(JSON.stringify({
  name:clean(info.name)||'Untitled video',mime:clean(info.mime,80)||'video/mp4',
  size:Math.max(0,Number(info.size)||0),createdAt:clean(info.createdAt,35),
  note:clean(info.note,450),favorite:info.favorite===true
 })));
}
async function decryptInfo(key,row){
 const plain=JSON.parse(textDecoder.decode(await unseal(key,row)));
 if(!plain||typeof plain.name!=='string')throw Error('Encrypted clip details damaged');
 return {id:row.id,count:row.count,...plain};
}
async function list(key){
 const rows=await all('clips'),output=[];
 for(const row of rows){
  try{output.push(await decryptInfo(key,row))}
  catch(_){output.push({id:row.id,count:row.count,name:'Unreadable encrypted clip',mime:'',size:0,damaged:true,note:'',favorite:false})}
 }
 return output.sort((a,b)=>Number(b.favorite)-Number(a.favorite)||String(b.createdAt).localeCompare(String(a.createdAt)));
}
function supported(file){
 const ext=(file.name.split('.').pop()||'').toLowerCase();
 return /\.(mp4|m4v|mov|webm|ogv|ogg)$/i.test(file.name)&&(
  file.type.startsWith('video/')||file.type===''||file.type==='application/octet-stream');
}
async function importVideo(key,file,onProgress,stillActive=()=>true){
 if(!(file instanceof Blob)||file.size===0||file.size>fileLimit())throw Error('Video is empty or above this device’s safe per-file limit');
 if(!supported(file))throw Error('Choose a local MP4, MOV, M4V, WebM, OGV or OGG video');
 if((await all('clips')).length>=MAX_CLIPS)throw Error('Vault holds up to 120 videos');
 const id=ident(),count=Math.ceil(file.size/CHUNK);
 try{
  for(let i=0;i<count;i++){
   if(!stillActive())throw Error('Vault locked: import cancelled');
   const source=await file.slice(i*CHUNK,Math.min(file.size,(i+1)*CHUNK)).arrayBuffer();
   if(!stillActive())throw Error('Vault locked: import cancelled');
   const encrypted=await seal(key,source);
   if(!stillActive())throw Error('Vault locked: import cancelled');
   await put('parts',{id,index:i,iv:encrypted.iv,ct:encrypted.ct});
   onProgress?.(i+1,count);
  }
  if(!stillActive())throw Error('Vault locked: import cancelled');
  const info=await encryptInfo(key,{name:file.name,mime:file.type||'video/mp4',size:file.size,createdAt:new Date().toISOString()});
  await put('clips',{id,count,...info});
  return id;
 }catch(error){
  await removeClip(id).catch(()=>{});
  throw error;
 }
}
async function updateInfo(key,id,patch){
 const row=await get('clips',id);if(!row)throw Error('Video no longer exists');
 const old=await decryptInfo(key,row);
 const encrypted=await encryptInfo(key,{...old,...patch});
 await put('clips',{id,count:row.count,...encrypted});
}
async function playback(key,id,onProgress,stillActive=()=>true){
 const row=await get('clips',id);if(!row)throw Error('Video no longer exists');
 const info=await decryptInfo(key,row);
 if(!Number.isSafeInteger(row.count)||row.count<1||row.count>512)throw Error('Damaged video chunk index');
 const chunks=[];
 for(let i=0;i<row.count;i++){
  if(!stillActive())throw Error('Vault locked: playback cancelled');
  const part=await get('parts',[id,i]);
  if(!part)throw Error('An encrypted video part is missing; restore from your vault backup');
  const plain=await unseal(key,part);
  if(!stillActive())throw Error('Vault locked: playback cancelled');
  chunks.push(plain);
  onProgress?.(i+1,row.count);
 }
 return new Blob(chunks,{type:info.mime||'video/mp4'});
}
const vec=value=>Array.from(bytes(value));
function validateConfig(v){
 if(!v||v.format!==FORMAT||v.iterations!==ITERATIONS||bytes(v.salt).length!==16||bytes(v.iv).length!==12||
  bytes(v.ct).length<16)throw Error('Unsupported or damaged encrypted vault configuration');
 return v;
}
async function exportEncrypted(onProgress){
 const config=validateConfig(await get('config','vault'));
 const clips=await all('clips'),payload=[],binary=[];
 if(clips.length>MAX_CLIPS)throw Error('Vault clip count exceeds the safety limit');
 let chunks=0;
 for(const row of clips){
  if(!Number.isInteger(row.count)||row.count<1||row.count>512)throw Error('Invalid encrypted chunk count');
  const header={id:row.id,count:row.count,iv:b64(row.iv),ct:b64(row.ct),parts:[]};
  for(let i=0;i<row.count;i++){
   const part=await get('parts',[row.id,i]);
   if(!part)throw Error('Cannot back up incomplete or damaged video');
   const encrypted=bytes(part.ct);
   header.parts.push({iv:b64(part.iv),size:encrypted.byteLength});
   binary.push(encrypted);chunks++;onProgress?.(chunks);
  }
  payload.push(header);
 }
 const header={format:ARCHIVE,config:{salt:b64(config.salt),iv:b64(config.iv),ct:b64(config.ct),iterations:ITERATIONS},
  clips:payload};
 const encoded=textEncoder.encode(JSON.stringify(header));
 if(encoded.length>4*1024*1024)throw Error('Archive index is too large');
 const prefix=new Uint8Array(8),view=new DataView(prefix.buffer);
 prefix.set([78,88,86,49],0);view.setUint32(4,encoded.byteLength,false);
 return new Blob([prefix,encoded,...binary],{type:'application/octet-stream'});
}
function parseHeader(file){
 return (async()=>{
  if(!(file instanceof Blob)||file.size<20||file.size>4*1024*1024*1024)throw Error('Choose a valid encrypted .nxvault backup');
  const prefix=new Uint8Array(await file.slice(0,8).arrayBuffer());
  if(prefix.length!==8||prefix[0]!==78||prefix[1]!==88||prefix[2]!==86||prefix[3]!==49)throw Error('Invalid encrypted vault archive');
  const size=new DataView(prefix.buffer).getUint32(4,false);
  if(size<30||size>4*1024*1024||8+size>file.size)throw Error('Damaged archive index');
  const header=JSON.parse(textDecoder.decode(await file.slice(8,8+size).arrayBuffer()));
  if(header.format!==ARCHIVE||!Array.isArray(header.clips)||header.clips.length>MAX_CLIPS)throw Error('Unsupported encrypted vault archive');
  const cfg={format:FORMAT,iterations:header.config?.iterations,salt:un64(header.config?.salt),iv:un64(header.config?.iv),ct:un64(header.config?.ct)};
  validateConfig(cfg);
  let total=8+size,chunkCount=0;
  const seen=new Set();
  for(const c of header.clips){
   if(!c||typeof c.id!=='string'||!/^[a-f0-9]{32}$/.test(c.id)||seen.has(c.id)||
     !Number.isInteger(c.count)||c.count<1||c.count>512||
     !Array.isArray(c.parts)||c.parts.length!==c.count)throw Error('Invalid encrypted video archive index');
   seen.add(c.id);un64(c.iv,20);un64(c.ct,3000);
   for(const p of c.parts){
    if(un64(p.iv,20).length!==12||!Number.isInteger(p.size)||p.size<17||p.size>CHUNK+16)
     throw Error('Invalid encrypted video archive chunk');
    total+=p.size;chunkCount++;
   }
  }
  if(total!==file.size)throw Error('Encrypted archive is incomplete or includes unexpected data');
  return {header,config:cfg,offset:8+size,chunkCount};
 })();
}
async function restoreEncrypted(file,onProgress){
 if(await get('config','vault'))throw Error('This browser already has a vault. Export it first; restore into an empty browser profile instead of overwriting.');
 const archive=await parseHeader(file);
 await clearOrphans();
 let offset=archive.offset,done=0;
 try{
  for(const row of archive.header.clips){
   for(let i=0;i<row.parts.length;i++){
    const part=row.parts[i];
    const ct=await file.slice(offset,offset+part.size).arrayBuffer();
    offset+=part.size;
    await put('parts',{id:row.id,index:i,iv:un64(part.iv,20),ct});
    done++;onProgress?.(done,archive.chunkCount);
   }
   await put('clips',{id:row.id,count:row.count,iv:un64(row.iv,20),ct:un64(row.ct,3000).buffer});
  }
  await put('config',{id:'vault',...archive.config});
 }catch(error){await clearOrphans().catch(()=>{});throw error}
 return {clips:archive.header.clips.length};
}
async function estimate(){
 const info=await navigator.storage?.estimate?.().catch(()=>null);
 return info?{usage:info.usage||0,quota:info.quota||0}:null;
}
window.NexusSecureVideoVaultV20=Object.freeze({NAME,FORMAT,ARCHIVE,CHUNK,ITERATIONS,MAX_CLIPS,fileLimit,clean,
 open,get,all,create,unlock,list,importVideo,updateInfo,playback,removeClip,
 exportEncrypted,parseHeader,restoreEncrypted,estimate});
})();