// PROXIMUS | ASSET ALCHEMIST v2.3 — optional local Media Publisher
// Persistent, browser-local GIF/MP4/WebM backgrounds and per-studio animated thumbnails.
// No remote URLs, server uploads or updates to the gateway / Discord link.
import {$,bytes,notice,safe,wrap} from './core.js';
const DB='proximus-alchemist-personal-media',STORE='media';
const MAX_VIDEO=80000000,MAX_IMAGE=35000000;
const ALLOWED=new Set(['image/gif','image/png','image/jpeg','image/webp','video/mp4','video/webm']);
const validSlot=s=>s==='background'||s==='hero'||/^studio-[a-z]+$/.test(s);
const mediaURLs=new Map(),mediaRecords=new Map();
let database=null;
function typeOf(file){
 const mime=file.type||({'gif':'image/gif','png':'image/png','jpg':'image/jpeg','jpeg':'image/jpeg','webp':'image/webp','mp4':'video/mp4','webm':'video/webm'}[file.name?.split('.').pop()?.toLowerCase()]);
 if(!ALLOWED.has(mime))throw Error('Use GIF, PNG, JPEG, WebP, MP4 or WebM.');
 if(file.size>(mime.startsWith('video/')?MAX_VIDEO:MAX_IMAGE))throw Error('Media is too large for browser-local personalization. Use a file under '+(mime.startsWith('video/')?'80 MB':'35 MB')+'.');
 return mime;
}
function openDb(){
 if(database)return Promise.resolve(database);
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window))return reject(Error('IndexedDB is unavailable; media will work only for this session.'));
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{const d=req.result;if(!d.objectStoreNames.contains(STORE))d.createObjectStore(STORE,{keyPath:'slot'});};
  req.onsuccess=()=>{database=req.result;database.onversionchange=()=>{database.close();database=null;};resolve(database);};
  req.onerror=()=>reject(req.error||Error('Could not open local media storage.'));
 });
}
async function transact(mode,callback){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
  let output=null;
  const request=callback(store);
  if(request)request.onsuccess=()=>{output=request.result;};
  tx.oncomplete=()=>resolve(output);
  tx.onabort=tx.onerror=()=>reject(tx.error||Error('Browser media storage failed.'));
 });
}
function revoke(slot){
 const url=mediaURLs.get(slot);
 if(url){URL.revokeObjectURL(url);mediaURLs.delete(slot);}
}
function makeDisplay(record,slot){
 const url=URL.createObjectURL(record.blob);mediaURLs.set(slot,url);
 const isVideo=record.mime.startsWith('video/');
 const el=document.createElement(isVideo?'video':'img');
 el.className='personal-media';
 el.setAttribute('aria-hidden','true');
 if(isVideo){
  el.muted=true;el.loop=true;el.autoplay=true;el.playsInline=true;el.preload='metadata';
  el.setAttribute('playsinline','');el.setAttribute('muted','');
  el.addEventListener('loadedmetadata',()=>{el.play().catch(()=>{});},{once:true});
  el.src=url;el.play().catch(()=>{document.getElementById('mediaResume')?.removeAttribute('hidden');});
 }else{el.alt='';el.src=url;}
 el.style.objectFit=record.fit||'cover';
 return el;
}
function apply(record){
 const slot=record.slot;if(!validSlot(slot))return;
 const current=mediaRecords.get(slot);
 if(current===record)return;
 mediaRecords.set(slot,record);
 revoke(slot);
 let holder=null;
 if(slot==='background'){
  holder=$('ambientMedia');
  if(holder){holder.replaceChildren(makeDisplay(record,slot));holder.hidden=false;holder.style.opacity=String(record.opacity??.42);document.body.classList.add('has-ambient');}
 }else if(slot==='hero'){
  holder=$('heroOrb');
  if(holder){holder.replaceChildren(makeDisplay(record,slot));holder.classList.add('has-personal-media');}
 }else if(slot.startsWith('studio-')){
  const id=slot.slice(7),section=document.querySelector('[data-panel="'+id+'"]');
  const heading=section?.querySelector('.section-heading');
  if(heading){
   holder=heading.querySelector('.studio-personal-thumb');
   if(!holder){holder=document.createElement('div');holder.className='studio-personal-thumb';heading.append(holder);}
   holder.replaceChildren(makeDisplay(record,slot));
  }
 }
}
function remove(slot){
 mediaRecords.delete(slot);revoke(slot);
 if(slot==='background'){$('ambientMedia')?.replaceChildren();if($('ambientMedia'))$('ambientMedia').hidden=true;document.body.classList.remove('has-ambient');}
 if(slot==='hero'){
  const hero=$('heroOrb');if(hero){hero.replaceChildren(document.createTextNode('✧'));hero.classList.remove('has-personal-media');}
 }
 if(slot.startsWith('studio-'))document.querySelector('[data-panel="'+slot.slice(7)+'"] .studio-personal-thumb')?.remove();
}
export function initMediaPublisher(){
 const dialog=$('mediaDialog');if(!dialog)return;
 const status=$('mediaStatus'),fileInput=$('mediaFile');
 const target=$('mediaTarget'),studio=$('mediaStudio'),studioLabel=$('mediaStudioRow');
 const opacity=$('mediaOpacity'),fit=$('mediaFit');
 for(const b of document.querySelectorAll('[data-view]')){
  const opt=document.createElement('option');opt.value=b.dataset.view;opt.textContent=b.textContent.trim().replace(/\s+\d+$/,'');
  studio.append(opt);
 }
 const slot=()=>target.value==='studio'?'studio-'+studio.value:target.value;
 const refresh=()=>{
  studioLabel.hidden=target.value!=='studio';
  const record=mediaRecords.get(slot());
  opacity.value=String(record?.opacity??.42);fit.value=record?.fit||'cover';
  status.textContent=record?'Saved: '+record.name+' · '+bytes(record.blob.size)+' · browser-local':'No custom media saved for this location.';
  $('mediaClear').disabled=!record;
 };
 $('mediaOpen').addEventListener('click',()=>{
  const active=document.querySelector('.studio:not([hidden])')?.dataset.panel;
  if(active)studio.value=active;
  refresh();dialog.showModal();
 });
 $('mediaClose').addEventListener('click',()=>dialog.close());
 target.addEventListener('change',refresh);studio.addEventListener('change',refresh);
 opacity.addEventListener('input',()=>{const record=mediaRecords.get(slot());if(record&&slot()==='background')$('ambientMedia').style.opacity=opacity.value;});
 async function save(blob,name,at=slot()){
  if(!(blob instanceof Blob)||!validSlot(at))throw Error('Invalid local media item or destination.');
  const mime=typeOf({name,type:blob.type,size:blob.size});
  const record={slot:at,name:safe(name),blob,mime,fit:fit.value,opacity:Number(opacity.value),savedAt:new Date().toISOString()};
  apply(record);
  try{
   await transact('readwrite',store=>store.put(record));
   status.textContent='Saved '+record.name+' to local browser storage · '+bytes(blob.size);
  }catch(error){
   status.textContent='Media applied for this session, but local storage failed: '+(error.message||error)+'. Export a backup if needed.';
  }
 }
 $('mediaSave').addEventListener('click',wrap(async()=>{
  const file=fileInput.files?.[0];
  if(file)await save(file,file.name);
  else{const existing=mediaRecords.get(slot());if(!existing)throw Error('Choose a local GIF, MP4, WebM or image file.');await save(existing.blob,existing.name);}
  fileInput.value='';
  notice('Custom media applied · '+slot());
  refresh();
 }));
 $('mediaClear').addEventListener('click',wrap(async()=>{
  const at=slot();remove(at);
  try{await transact('readwrite',store=>store.delete(at));}catch(e){status.textContent='Removed for this session; storage update failed: '+e.message;}
  notice('Custom media cleared: '+at);refresh();
 }));
 $('mediaResume').addEventListener('click',()=>{
  for(const node of document.querySelectorAll('.personal-media'))if(node.tagName==='VIDEO')node.play().catch(()=>{});
  $('mediaResume').hidden=true;
 });
 // Live linkage from Animation Forge and the persistent Asset Packager.
 document.addEventListener('proximus-media-export',async e=>{
  try{
   const detail=e.detail||{},at=detail.target||'background';
   await save(detail.blob,detail.name||'PROXIMUS-animation.gif',at);
   notice('Animation applied as '+(at==='background'?'background':'thumbnail')+' · saved locally');
  }catch(err){notice('Could not set custom media: '+err.message,true);}
 });
 // Restore prior user-uploaded assets on reload. They remain local to this device/browser.
 void (async()=>{try{
  const all=await transact('readonly',store=>store.getAll());
  for(const entry of all)if(entry?.blob instanceof Blob&&validSlot(entry.slot))apply(entry);
  refresh();
 }catch(err){status.textContent='Local media storage unavailable: '+err.message;}})();
 window.addEventListener('pagehide',()=>{for(const value of mediaURLs.values())URL.revokeObjectURL(value);mediaURLs.clear();},{once:true});
}
