// PROXIMUS | ASSET ALCHEMIST — Media Publisher v2.9: Master Thumbnail Engine
// One original local GIF/MP4/WebM blob is reused across the site. Video thumbnails
// are lazy and limited to active surfaces for iPhone battery/decoder efficiency.
// Per-device configuration is intentionally separate from public GitHub source.
import {$,bytes,notice,safe,wrap} from './core.js';
const DB='proximus-alchemist-personal-media',STORE='media';
const MAX_VIDEO=80000000,MAX_IMAGE=35000000;
const ALLOWED=new Set(['image/gif','image/png','image/jpeg','image/webp','video/mp4','video/webm']);
const validSlot=s=>s==='background'||s==='hero'||s==='master'||/^studio-[a-z]+$/.test(s);
export const MASTER_MODES=['force','fallback'];
export const MASTER_MOTION=['adaptive','live','poster'];
export function chooseThumbnail(master,override,mode='force'){
 return master&&(mode==='force'||!override)?master:override||master||null;
}
export function mediaFitOptions(record){
 return {fit:record?.fit==='contain'?'contain':'cover',
  opacity:Number.isFinite(Number(record?.opacity))?Math.min(1,Math.max(.1,Number(record.opacity))):.78};
}
const mediaRecords=new Map(),urls=new Map();
let database=null;const posters=new Map(),posterPending=new Set(),posterFailures=new Set();
function mimeType(file){
 const ext=file?.name?.split('.').pop()?.toLowerCase();
 const mime=ALLOWED.has(file?.type)?file.type:({gif:'image/gif',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',mp4:'video/mp4',webm:'video/webm'}[ext]);
 if(!ALLOWED.has(mime))throw Error('Choose GIF, MP4, WebM, PNG, JPG or WebP media.');
 if(file.size>(mime.startsWith('video/')?MAX_VIDEO:MAX_IMAGE))throw Error('Media exceeds the '+(mime.startsWith('video/')?'80 MB video':'35 MB image')+' limit.');
 return mime;
}
function isVideo(record){return record?.mime?.startsWith('video/');}
function openDb(){
 if(database)return Promise.resolve(database);
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window))return reject(Error('IndexedDB is unavailable.'));
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'slot'});};
  req.onsuccess=()=>{database=req.result;database.onversionchange=()=>{database.close();database=null;};resolve(database);};
  req.onerror=()=>reject(req.error||Error('Could not open personal media library.'));
 });
}
async function tx(mode,callback){
 const db=await openDb();
 return new Promise((resolve,reject)=>{
  const tr=db.transaction(STORE,mode),store=tr.objectStore(STORE),req=callback(store);
  let value=null;if(req)req.onsuccess=()=>value=req.result;
  tr.oncomplete=()=>resolve(value);
  tr.onerror=tr.onabort=()=>reject(tr.error||Error('Media storage failed.'));
 });
}
function releaseUrl(slot){
 const url=urls.get(slot);if(url)URL.revokeObjectURL(url);
 urls.delete(slot);
}
function urlFor(rec){
 if(!rec)return null;
 const existing=urls.get(rec.slot);if(existing)return existing;
 const url=URL.createObjectURL(rec.blob);urls.set(rec.slot,url);return url;
}
// Sharp 960x540 decoded posters for any local studio/master video.
const posterKey=record=>record.slot+'|'+record.savedAt;
function clearPoster(slot){for(const [key,url] of posters)if(key.startsWith(slot+'|')){URL.revokeObjectURL(url);posters.delete(key)}
 for(const key of posterFailures)if(key.startsWith(slot+'|'))posterFailures.delete(key)}
async function generatePoster(record){
 if(!isVideo(record))return;
 const key=posterKey(record);if(posters.has(key)||posterPending.has(key)||posterFailures.has(key))return;
 posterPending.add(key);const node=document.createElement('video');node.muted=true;node.playsInline=true;
 try{
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{cleanup();reject(Error('Poster timed out'))},12000);
   const cleanup=()=>{clearTimeout(timer);node.removeEventListener('loadeddata',loaded);node.removeEventListener('error',failed)};
   const loaded=()=>{cleanup();resolve()},failed=()=>{cleanup();reject(Error('Cannot decode poster'))};
   node.addEventListener('loadeddata',loaded);node.addEventListener('error',failed);
   node.src=urlFor(record);node.preload='auto';node.load();
  });
  if(mediaRecords.get(record.slot)!==record||!node.videoWidth||!node.videoHeight)return;
  const cv=document.createElement('canvas');cv.width=960;cv.height=540;
  const ctx=cv.getContext('2d',{alpha:false});if(!ctx)return;
  ctx.fillStyle='#0b1222';ctx.fillRect(0,0,960,540);
  const scale=Math.max(960/node.videoWidth,540/node.videoHeight);
  const w=node.videoWidth*scale,h=node.videoHeight*scale;
  ctx.drawImage(node,(960-w)/2,(540-h)/2,w,h);
  const jpeg=await new Promise(resolve=>cv.toBlob(resolve,'image/jpeg',.9));
  if(jpeg&&mediaRecords.get(record.slot)===record){clearPoster(record.slot);posters.set(key,URL.createObjectURL(jpeg));refresh()}
 }catch(_){posterFailures.add(key);/* Unsupported codec: original file is preserved. */}
 finally{posterPending.delete(key);node.pause();node.removeAttribute('src');node.load()}
}
function safeRecord(x){
 if(!x||!validSlot(x.slot)||!(x.blob instanceof Blob))throw Error('Invalid saved media record.');
 const mime=mimeType({name:x.name,type:x.mime||x.blob.type,size:x.blob.size});
 const opt=mediaFitOptions(x);
 return {slot:x.slot,blob:x.blob,name:safe(x.name||'Personal Media'),mime,...opt,
  savedAt:x.savedAt||new Date().toISOString(),
  mode:MASTER_MODES.includes(x.mode)?x.mode:'force',
  motion:MASTER_MOTION.includes(x.motion)?x.motion:'adaptive'};
}
function nodeDisplay(record,{animated=true,slot=''}={}){
 const url=urlFor(record),video=isVideo(record);
 if(video&&!animated){
  const poster=posters.get(posterKey(record));
  if(poster){const image=document.createElement('img');image.src=poster;image.alt='';image.className='personal-media';
   image.setAttribute('aria-hidden','true');image.style.objectFit=record.fit;return image;}
  const placeholder=document.createElement('div');placeholder.className='personal-media media-video-poster';
  placeholder.textContent='▶';placeholder.setAttribute('aria-hidden','true');void generatePoster(record);return placeholder;
 }
 const el=document.createElement(video?'video':'img');el.className='personal-media';el.setAttribute('aria-hidden','true');
 if(video){
  el.muted=true;el.loop=true;el.autoplay=true;el.playsInline=true;el.preload='metadata';
  el.setAttribute('playsinline','');el.setAttribute('muted','');
  el.src=url;
  el.addEventListener('loadeddata',()=>el.play().catch(()=>{$('mediaResume').hidden=false;}),{once:true});
  el.play().catch(()=>{$('mediaResume').hidden=false;});
 }else{el.alt='';if(slot.startsWith('card-'))el.loading='lazy';el.src=url;}
 el.style.objectFit=record.fit;el.dataset.mediaSlot=slot||record.slot;return el;
}
function setDisplay(holder,record,{animated=true,signature='',hero=false}={}){
 if(!holder)return;
 const key=record?record.slot+'|'+record.savedAt+'|'+record.mode+'|'+record.motion+'|'+animated+'|'+signature+'|'+(isVideo(record)&&!animated?String(posters.has(posterKey(record))):''):'none';
 if(holder.dataset.mediaSignature===key){if(animated&&!document.hidden)holder.querySelectorAll('video').forEach(v=>{if(v.paused)v.play().catch(()=>{})});return;}
 holder.dataset.mediaSignature=key;
 holder.querySelectorAll('video').forEach(v=>v.pause());
 if(!record){
  if(hero){holder.replaceChildren(document.createTextNode('✧'));holder.classList.remove('has-personal-media');}
  else holder.replaceChildren();
  return;
 }
 holder.replaceChildren(nodeDisplay(record,{animated,slot:signature}));
 if(hero)holder.classList.add('has-personal-media');
}
function activeStudio(){return document.querySelector('.studio:not([hidden])')?.dataset.panel||'';}
const iphone=/iPhone|iPad|iPod/i.test(navigator.userAgent);
function animationLimit(){const mode=window.ProximusVisualPopV37?.previewMode?.()||'balanced';
 return mode==='still'?0:mode==='cinema'?(iphone?3:8):(iphone?1:3);}
function shouldAnimate(record,visible,index=0){
 if(!record||!isVideo(record))return true;
 return visible&&!document.hidden&&record.motion!=='poster'&&index<animationLimit();
}
function onScreen(node){const r=node.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>-150&&r.top<innerHeight+210}
function refresh(){
 const master=document.body.dataset.identityMasterMedia==='off'?null:mediaRecords.get('master'),
  mode=master?.mode||'force',active=activeStudio();
 const ownHero=mediaRecords.get('hero');
 const heroRec=chooseThumbnail(master,ownHero,mode);
 setDisplay($('heroOrb'),heroRec,{animated:heroRec?shouldAnimate(heroRec,true,0):false,signature:'hero',hero:true});
 const bg=mediaRecords.get('background'),ambient=$('ambientMedia');
 if(ambient){
  const wrapper=ambient.querySelector('.personal-media-container')||document.createElement('div');
  wrapper.className='personal-media-container';
  if(bg){
   if(ambient.firstChild!==wrapper)ambient.replaceChildren(wrapper);
   setDisplay(wrapper,bg,{animated:true,signature:'ambient'});
   ambient.hidden=false;ambient.style.opacity=String(bg.opacity);document.body.classList.add('has-ambient');
  }else{
   ambient.replaceChildren();ambient.hidden=true;document.body.classList.remove('has-ambient');
  }
 }
 for(const section of document.querySelectorAll('.studio[data-panel]')){
  const studio=section.dataset.panel,rec=chooseThumbnail(master,mediaRecords.get('studio-'+studio),mode);
  const heading=section.querySelector('.section-heading');if(!heading)continue;
  let holder=heading.querySelector('.studio-personal-thumb');
  if(!rec){holder?.remove();continue;}
  if(!holder){holder=document.createElement('div');holder.className='studio-personal-thumb';heading.append(holder);}
  // Hide native media for inactive studios; only one live thumbnail on mobile.
  if(studio!==active){if(holder.firstChild){holder.querySelectorAll('video').forEach(v=>v.pause());holder.replaceChildren();holder.dataset.mediaSignature='';}continue;}
  setDisplay(holder,rec,{animated:shouldAnimate(rec,true,0),signature:'studio-'+studio});
 }
 const cardNodes=[...document.querySelectorAll('[data-proximus-thumbnail]')];
 let cardCount=0,liveCount=0;
 for(const card of cardNodes){
  const studio=card.dataset.proximusThumbnail;
  const record=chooseThumbnail(master,mediaRecords.get('studio-'+studio),mode);
  const holder=card.querySelector('.dashboard-thumb');if(!holder)continue;
  const visible=!card.hidden&&!card.closest('[hidden]')&&document.querySelector('[data-panel="command"]')?.hidden===false;
  const animate=Boolean(visible&&onScreen(card)&&record&&shouldAnimate(record,true,liveCount));
  if(animate&&isVideo(record))liveCount++;
  setDisplay(holder,record,{animated:animate,signature:'card-'+studio});
  cardCount++;
 }
 const masterLabel=$('mediaMasterStatus');
 if(masterLabel)masterLabel.textContent=master?'MASTER ACTIVE · '+master.name+' · '+cardCount+' dashboard slots · '+document.querySelectorAll('.studio[data-panel]').length+' studio thumbnails':'No master thumbnail selected.';
 if(master&&isVideo(master)&&document.querySelector('[data-panel="command"]')?.hidden===false)void generatePoster(master);
}
let debounce=null;
function queueRefresh(){if(debounce)clearTimeout(debounce);debounce=setTimeout(refresh,0);}
async function writeMedia(record){
 const saved=safeRecord(record);
 const old=mediaRecords.get(saved.slot);
 mediaRecords.set(saved.slot,saved);releaseUrl(saved.slot);
 if(old?.savedAt!==saved.savedAt)clearPoster(saved.slot);
 refresh();
 await tx('readwrite',store=>store.put(saved));
 document.dispatchEvent(new CustomEvent('proximus-media-changed',{detail:{slot:saved.slot,name:saved.name}}));
 return saved;
}
async function removeMedia(slot){
 mediaRecords.delete(slot);releaseUrl(slot);
 clearPoster(slot);
 await tx('readwrite',store=>store.delete(slot));refresh();
 document.dispatchEvent(new CustomEvent('proximus-media-changed',{detail:{slot,removed:true}}));
}
export async function exportMediaRecords(){
 const all=await tx('readonly',store=>store.getAll());
 return all.filter(x=>x?.blob instanceof Blob&&validSlot(x.slot)).map(safeRecord);
}
export async function importMediaRecords(records,{replace=false}={}){
 if(!Array.isArray(records)||records.length>90)throw Error('Media backup exceeds 90 locations.');
 const list=records.map(safeRecord);
 if(replace)await tx('readwrite',store=>store.clear());
 for(const item of list)await tx('readwrite',store=>store.put(item));
 if(replace){for(const key of [...mediaRecords.keys()]){mediaRecords.delete(key);releaseUrl(key);}}
 for(const item of list){releaseUrl(item.slot);mediaRecords.set(item.slot,item);}
 for(const url of posters.values())URL.revokeObjectURL(url);posters.clear();
 refresh();document.dispatchEvent(new Event('proximus-media-imported'));return list.length;
}
export function initMediaPublisher(){
 const dialog=$('mediaDialog');if(!dialog)return;
 const status=$('mediaStatus'),fileInput=$('mediaFile'),target=$('mediaTarget');
 const studio=$('mediaStudio'),studioLabel=$('mediaStudioRow'),opacity=$('mediaOpacity'),fit=$('mediaFit');
 const masterRow=$('mediaMasterRow'),masterMode=$('mediaMasterMode'),masterMotion=$('mediaMasterMotion');
 for(const b of document.querySelectorAll('[data-view]')){
  const opt=document.createElement('option');opt.value=b.dataset.view;opt.textContent=b.textContent.trim().replace(/\s+\d+$/,'');studio.append(opt);
 }
 const slot=()=>target.value==='studio'?'studio-'+studio.value:target.value;
 function ui(){
  const at=slot(),rec=mediaRecords.get(at),isMaster=at==='master';
  studioLabel.hidden=target.value!=='studio';masterRow.hidden=!isMaster;
  opacity.value=String(rec?.opacity??.78);fit.value=rec?.fit||'cover';
  masterMode.value=rec?.mode||'force';masterMotion.value=rec?.motion||'adaptive';
  status.textContent=rec?'Saved: '+rec.name+' · '+bytes(rec.blob.size)+' · on this device':'No custom media saved for this location.';
  $('mediaClear').disabled=!rec;
 }
 $('mediaOpen').addEventListener('click',()=>{const id=activeStudio();if(id)studio.value=id;ui();dialog.showModal();});
 $('mediaClose').addEventListener('click',()=>dialog.close());
 target.addEventListener('change',ui);studio.addEventListener('change',ui);
 opacity.addEventListener('input',()=>{const rec=mediaRecords.get(slot());if(rec&&slot()==='background'){$('ambientMedia').style.opacity=opacity.value;}});
 async function save(blob,name,at=slot()){
  if(!(blob instanceof Blob)||!validSlot(at))throw Error('Invalid media location.');
  const mime=mimeType({name,type:blob.type,size:blob.size});
  const rec=await writeMedia({slot:at,blob,name,mime,fit:fit.value,opacity:Number(opacity.value),
   savedAt:new Date().toISOString(),mode:masterMode.value,motion:masterMotion.value});
  status.textContent='Saved '+rec.name+' · '+bytes(blob.size)+' in browser-local media storage.';
  return rec;
 }
 $('mediaSave').addEventListener('click',wrap(async()=>{
  const f=fileInput.files?.[0],current=mediaRecords.get(slot());
  if(!f&&!current)throw Error('Choose your GIF, MP4, WebM or image.');
  if(f)await save(f,f.name);
  else await save(current.blob,current.name);
  fileInput.value='';ui();notice('Personal media applied to '+slot());
 }));
 $('mediaClear').addEventListener('click',wrap(async()=>{
  const at=slot();await removeMedia(at);ui();notice('Personal media cleared from '+at);
 }));
 $('mediaMasterApply').addEventListener('click',wrap(async()=>{
  const file=fileInput.files?.[0],existing=mediaRecords.get('master');
  if(!file&&!existing)throw Error('Choose a GIF/video to apply as the master thumbnail.');
  if(file&&!(file.type==='image/gif'||file.type.startsWith('video/')||/\.(gif|mp4|webm)$/i.test(file.name)))throw Error('For a master animated thumbnail, choose GIF, MP4 or WebM.');
  await save(file||existing.blob,file?.name||existing.name,'master');
  fileInput.value='';target.value='master';ui();
  notice('Master thumbnail applied to all studio thumbnails and home displays.');
 }));
 $('mediaResume').addEventListener('click',()=>{
  for(const node of document.querySelectorAll('.personal-media'))if(node.tagName==='VIDEO'&&!node.closest('[hidden]'))node.play().catch(()=>{});
  $('mediaResume').hidden=true;
 });
 document.addEventListener('proximus-media-export',async e=>{
  try{
   const detail=e.detail||{},at=detail.target||'background';
   await save(detail.blob,detail.name||'PROXIMUS-animation.gif',at);
   notice('Media applied as '+at+' · saved locally');
  }catch(err){notice('Cannot apply media: '+(err.message||err),true);}
 });
 document.addEventListener('proximus-view-changed',queueRefresh);
 document.addEventListener('proximus-identity-changed',queueRefresh);
 document.addEventListener('proximus-media-refresh',queueRefresh);
 document.addEventListener('visibilitychange',queueRefresh);
 document.addEventListener('scroll',queueRefresh,{passive:true,capture:true});
 window.addEventListener('resize',queueRefresh,{passive:true});
 document.addEventListener('proximus-cinema-background-preset',e=>{
  const old=mediaRecords.get('background');
  if(!old){status.textContent='Choose a local background video, GIF or image first.';return;}
  void writeMedia({...old,opacity:Math.max(.1,Math.min(1,Number(e.detail?.opacity)||.85)),fit:'cover'})
    .then(()=>{if(target.value==='background')ui();status.textContent='Cinematic background saved with 85% visibility.'})
    .catch(err=>{status.textContent='Background not saved: '+err.message});
 });
 void (async()=>{try{
  const entries=await tx('readonly',store=>store.getAll());
  for(const item of entries)if(item?.blob instanceof Blob&&validSlot(item.slot))mediaRecords.set(item.slot,safeRecord(item));
  refresh();ui();
 }catch(error){status.textContent='Local media storage unavailable: '+error.message;refresh();}})();
 window.addEventListener('pagehide',()=>{
  for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();
  for(const url of posters.values())URL.revokeObjectURL(url);posters.clear();
 },{once:true});
}
