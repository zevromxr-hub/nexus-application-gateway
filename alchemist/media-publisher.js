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
  opacity:Number.isFinite(Number(record?.opacity))?Math.min(1,Math.max(.1,Number(record.opacity))):.42};
}
const mediaRecords=new Map(),urls=new Map();
let database=null,posterUrl=null,posterFor='',posterLoadingFor='';
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
function setPoster(newUrl,key){
 if(posterUrl)URL.revokeObjectURL(posterUrl);
 posterUrl=newUrl;posterFor=key;
 refresh();
}
async function generatePoster(record){
 if(!isVideo(record))return;
 const token=record.savedAt||record.name;
 if(posterFor===token||posterLoadingFor===token)return;
 posterLoadingFor=token;
 const node=document.createElement('video');node.muted=true;node.playsInline=true;node.preload='auto';
 const url=urlFor(record),guard=()=>mediaRecords.get('master')===record;
 try{
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>reject(Error('Video thumbnail poster timed out.')),12000);
   const done=()=>{clearTimeout(timer);resolve();},fail=()=>{clearTimeout(timer);reject(Error('Video poster unavailable.'));};
   node.addEventListener('loadeddata',done,{once:true});node.addEventListener('error',fail,{once:true});
   node.src=url;node.load();
  });
  if(!guard())return;
  const c=document.createElement('canvas');c.width=512;c.height=288;
  const x=c.getContext('2d');x.fillStyle='#100b22';x.fillRect(0,0,512,288);
  const w=node.videoWidth||512,h=node.videoHeight||288,scale=Math.max(512/w,288/h);
  x.drawImage(node,(512-w*scale)/2,(288-h*scale)/2,w*scale,h*scale);
  const blob=await new Promise(resolve=>c.toBlob(resolve,'image/jpeg',.78));
  if(blob&&guard())setPoster(URL.createObjectURL(blob),token);
 }catch(e){}finally{if(posterLoadingFor===token)posterLoadingFor='';node.pause();node.removeAttribute('src');node.load();}
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
  if(posterUrl&&posterFor===(record.savedAt||record.name)){
   const image=document.createElement('img');image.src=posterUrl;image.alt='';image.className='personal-media';
   image.setAttribute('aria-hidden','true');image.style.objectFit=record.fit;return image;
  }
  const placeholder=document.createElement('div');placeholder.className='personal-media media-video-poster';
  placeholder.textContent='✧';placeholder.setAttribute('aria-hidden','true');return placeholder;
 }
 const el=document.createElement(video?'video':'img');el.className='personal-media';el.setAttribute('aria-hidden','true');
 if(video){
  el.muted=true;el.loop=true;el.autoplay=true;el.playsInline=true;el.preload='metadata';
  el.setAttribute('playsinline','');el.setAttribute('muted','');
  el.src=url;
  el.addEventListener('loadeddata',()=>el.play().catch(()=>{$('mediaResume').hidden=false;}),{once:true});
  el.play().catch(()=>{$('mediaResume').hidden=false;});
 }else{el.alt='';el.src=url;}
 el.style.objectFit=record.fit;el.dataset.mediaSlot=slot||record.slot;return el;
}
function setDisplay(holder,record,{animated=true,signature='',hero=false}={}){
 if(!holder)return;
 const key=record?record.slot+'|'+record.savedAt+'|'+record.mode+'|'+record.motion+'|'+animated+'|'+signature+'|'+(isVideo(record)&&!animated?posterFor:''):'none';
 if(holder.dataset.mediaSignature===key)return;
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
function shouldAnimate(master,studioVisible,cardIndex=0){
 if(!isVideo(master))return true;
 if(master.motion==='poster')return false;
 if(master.motion==='live')return studioVisible&&cardIndex<6;
 // Adaptive: only two simultaneous video thumbnails to respect mobile power.
 const iphone=/iPhone|iPad|iPod/i.test(navigator.userAgent);
 return studioVisible&&cardIndex<(iphone?2:4);
}
function refresh(){
 const master=mediaRecords.get('master'),mode=master?.mode||'force',active=activeStudio();
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
 let cardCount=0;
 for(const card of cardNodes){
  const studio=card.dataset.proximusThumbnail;
  const record=chooseThumbnail(master,mediaRecords.get('studio-'+studio),mode);
  const holder=card.querySelector('.dashboard-thumb');
  if(!holder)continue;
  const visible=!card.hidden&&!card.closest('[hidden]')&&document.querySelector('[data-panel="command"]')?.hidden===false;
  // For video, use a common decoded poster across all dashboard cards.
  const iphone=/iPhone|iPad|iPod/i.test(navigator.userAgent);
  const videoLive=visible&&isVideo(record)&&record.motion==='live'&&cardCount<(iphone?1:4);
  const animate=visible&&(record&&!isVideo(record)||videoLive);
  setDisplay(holder,record,{animated:!!animate,signature:'card-'+studio});
  cardCount++;
 }
 const masterLabel=$('mediaMasterStatus');
 if(masterLabel)masterLabel.textContent=master?'MASTER ACTIVE · '+master.name+' · '+cardCount+' dashboard slots · '+document.querySelectorAll('.studio[data-panel]').length+' studio thumbnails':'No master thumbnail selected.';
 if(master&&isVideo(master))void generatePoster(master);
}
let debounce=null;
function queueRefresh(){if(debounce)clearTimeout(debounce);debounce=setTimeout(refresh,0);}
async function writeMedia(record){
 const saved=safeRecord(record);
 const old=mediaRecords.get(saved.slot);
 mediaRecords.set(saved.slot,saved);releaseUrl(saved.slot);
 if(saved.slot==='master'&&old?.savedAt!==saved.savedAt){if(posterUrl)URL.revokeObjectURL(posterUrl);posterUrl=null;posterFor='';}
 refresh();
 await tx('readwrite',store=>store.put(saved));
 document.dispatchEvent(new CustomEvent('proximus-media-changed',{detail:{slot:saved.slot,name:saved.name}}));
 return saved;
}
async function removeMedia(slot){
 mediaRecords.delete(slot);releaseUrl(slot);
 if(slot==='master'){if(posterUrl)URL.revokeObjectURL(posterUrl);posterUrl=null;posterFor='';}
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
 if(posterUrl)URL.revokeObjectURL(posterUrl);posterUrl=null;posterFor='';
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
  opacity.value=String(rec?.opacity??.42);fit.value=rec?.fit||'cover';
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
 document.addEventListener('proximus-media-refresh',queueRefresh);
 void (async()=>{try{
  const entries=await tx('readonly',store=>store.getAll());
  for(const item of entries)if(item?.blob instanceof Blob&&validSlot(item.slot))mediaRecords.set(item.slot,safeRecord(item));
  refresh();ui();
 }catch(error){status.textContent='Local media storage unavailable: '+error.message;refresh();}})();
 window.addEventListener('pagehide',()=>{
  for(const url of urls.values())URL.revokeObjectURL(url);urls.clear();
  if(posterUrl)URL.revokeObjectURL(posterUrl);
 },{once:true});
}
