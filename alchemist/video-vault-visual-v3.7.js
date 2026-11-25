/* PROXIMUS v3.7 — Local Animated Video Vault Covers.
 * Additive layer over existing Video Vault. No schema migration, video copies,
 * video downloads or cross-origin access. Source media stays in OPFS/IndexedDB.
 * Custom covers live in an independent browser-local IndexedDB store;
 * original movie and metadata rows remain unchanged. */
import {$} from './core.js';
import {listStoredVideos} from './video-vault.js';
import {sortVideoLibrary} from './video-vault-core.js';
const mobile=/iPhone|iPad|iPod/i.test(typeof navigator==='undefined'?'':navigator.userAgent);
const TYPES={gif:'image/gif',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',mp4:'video/mp4',webm:'video/webm'};
const COVER_DB='proximus-video-vault-covers-v370',COVER_STORE='covers';
let coverDatabase=null;
async function coverDB(){
 if(coverDatabase)return coverDatabase;
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(COVER_DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(COVER_STORE))
   req.result.createObjectStore(COVER_STORE,{keyPath:'id'});};
  req.onsuccess=()=>{coverDatabase=req.result;coverDatabase.onversionchange=()=>{coverDatabase.close();coverDatabase=null};resolve(coverDatabase)};
  req.onerror=()=>reject(req.error||Error('Cannot open local cover database'));
 });
}
async function coverTx(mode,action){
 const db=await coverDB();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(COVER_STORE,mode),store=tx.objectStore(COVER_STORE);
  let result,problem;
  try{const req=action(store);
   req.onsuccess=()=>{result=req.result};req.onerror=()=>{problem=req.error};
  }catch(e){try{tx.abort()}catch{}reject(e);return}
  tx.oncomplete=()=>resolve(result);
  tx.onabort=tx.onerror=()=>reject(problem||tx.error||Error('Could not save personal cover on this device'));
 });
}
// Listing keys avoids cloning every large GIF/video into iPhone memory.
const listCoverKeys=()=>coverTx('readonly',store=>store.getAllKeys());
const getCoverArt=id=>coverTx('readonly',store=>store.get(id));
const deleteCoverArt=id=>coverTx('readwrite',store=>store.delete(id));
async function saveCoverArt(id,file,mime,poster){
 const data=await file.arrayBuffer(),image=poster?await poster.arrayBuffer():null;
 return coverTx('readwrite',store=>store.put({id,mime,data,image,savedAt:Date.now()}));
}

/* A single small still for the Premiere hero; never loads an animated cover
 * into a playing video, never copies the original movie, and handles IDB errors. */
export async function getVaultCoverPoster(id){
 if(typeof id!=='string'||!id)return null;
 try{
  const row=await getCoverArt(id);
  return row?.image instanceof ArrayBuffer&&row.image.byteLength?
   new Blob([row.image],{type:'image/jpeg'}):null;
 }catch{return null}
}

export function coverType(file){
 const ext=String(file?.name||'').split('.').pop()?.toLowerCase(),type=TYPES[ext]||'';
 if(!type)throw Error('Choose a local GIF, PNG, JPG, WebP, MP4 or WebM for the cover.');
 const max=type.startsWith('video/')?18*1024*1024:12*1024*1024;
 if(!Number.isSafeInteger(file?.size)||file.size<1||file.size>max)
  throw Error('Cover must be under '+(type.startsWith('video/')?'18 MB for video':'12 MB for image')+' (iPhone browser storage safety limit).');
 return type;
}
export function initVaultVisualCovers(){
 const grid=$('videoVaultGrid'),status=$('videoVaultStatus');
 if(!grid||!status)return;
 grid.dataset.previewMode=window.ProximusVisualPopV37?.previewMode?.()||'balanced';
 const objectUrls=new Set(),candidates=new Map(),lazyCards=new Map();
 let loadedBytes=0;
 const memoryBudget=mobile?32*1024*1024:100*1024*1024;
 let observer=null,generation=0,queued=false,enhancing=false,pendingRender=false;
 const show=s=>{status.textContent=s;status.dataset.error='false'};
 const limit=()=>{
  const p=window.ProximusVisualPopV37?.previewMode?.()||'balanced';
  return p==='still'?0:p==='cinema'?(mobile?2:5):(mobile?1:2);
 };
 const stop=node=>{
  node.pause();node.hidden=true;
  if(node.hasAttribute('src')){node.removeAttribute('src');node.load()}
 };
 const active=()=>!document.hidden&&document.querySelector('.studio:not([hidden])')?.dataset.panel==='videos';
 function reconcile(){
  let slots=active()?limit():0;
  for(const [node,visible] of candidates){
   if(visible&&slots>0&&node.isConnected&&node.canPlayType(node.dataset.mime)!==''){
    slots--;
    if(!node.hasAttribute('src')){
     node.src=node.dataset.url;node.load();
     node.play().then(()=>{if(node.isConnected&&node.hasAttribute('src'))node.hidden=false}).catch(()=>stop(node));
    }else if(node.paused)node.play().catch(()=>stop(node));
   }else stop(node);
  }
 }
 if('IntersectionObserver' in window)observer=new IntersectionObserver(entries=>{
  for(const entry of entries){
   const state=lazyCards.get(entry.target);
   if(state){
    state.visible=entry.isIntersecting;
    if(state.visible){state.lastSeen=Date.now();void loadCover(state);}
   }
   const movie=entry.target.querySelector('.video-vault-art-video');
   if(movie)candidates.set(movie,entry.isIntersecting);
  }
  reconcile();trimHidden();
 },{rootMargin:'220px 0px',threshold:.05});
 function clean(){
  observer?.disconnect();
  for(const node of candidates.keys())stop(node);candidates.clear();
  lazyCards.clear();loadedBytes=0;
  for(const url of objectUrls)URL.revokeObjectURL(url);objectUrls.clear();
 }
 const urlFor=(blob,state)=>{
  const url=URL.createObjectURL(blob);objectUrls.add(url);
  if(state)state.urls.push(url);
  return url;
 };
 function unloadCover(state){
  if(!state.loaded)return;
  for(const el of state.cover.querySelectorAll('.video-vault-art-still,.video-vault-art-image,.video-vault-art-video')){
   if(el.tagName==='VIDEO'){stop(el);candidates.delete(el);}
   el.remove();
  }
  for(const url of state.urls){URL.revokeObjectURL(url);objectUrls.delete(url)}
  state.urls=[];loadedBytes=Math.max(0,loadedBytes-state.bytes);
  state.bytes=0;state.loaded=false;
 }
 function trimHidden(){
  if(loadedBytes<=memoryBudget)return;
  const hidden=[...lazyCards.values()].filter(x=>x.loaded&&!x.visible)
   .sort((a,b)=>a.lastSeen-b.lastSeen);
  for(const state of hidden){
   unloadCover(state);
   if(loadedBytes<=memoryBudget)break;
  }
 }
 async function loadCover(state){
  if(state.loading||state.loaded||!state.card.isConnected)return;
  state.loading=true;
  try{
   // Fetch this one item only when its card enters the scroll viewport.
   const record=await getCoverArt(state.id);
   if(!record||!state.card.isConnected||state.generation!==generation)return;
   if(!(record.data instanceof ArrayBuffer))return;
   const personalCover=new Blob([record.data],{type:record.mime||'image/png'});
   const type=record.mime||personalCover.type;
   const still=record.image instanceof ArrayBuffer?
    new Blob([record.image],{type:'image/jpeg'}):null;
   if(still){
    const image=document.createElement('img');image.className='video-vault-art-still';
    image.src=urlFor(still,state);image.alt='';image.loading='lazy';state.cover.append(image);
   }
   if(type.startsWith('image/')){
    if(window.ProximusVisualPopV37?.previewMode?.()!=='still'||type!=='image/gif'){
     const image=document.createElement('img');image.className='video-vault-art-image';
     image.src=urlFor(personalCover,state);image.alt='';image.loading='lazy';state.cover.append(image);
    }
   }else if(type.startsWith('video/')){
    const movie=document.createElement('video');movie.className='video-vault-art-video';
    movie.preload='none';movie.muted=true;movie.loop=true;movie.playsInline=true;
    movie.setAttribute('muted','');movie.setAttribute('playsinline','');
    movie.setAttribute('aria-hidden','true');movie.hidden=true;
    movie.dataset.url=urlFor(personalCover,state);movie.dataset.mime=type;
    state.cover.append(movie);candidates.set(movie,state.visible);
   }
   state.loaded=true;state.lastSeen=Date.now();
   state.bytes=record.data.byteLength+(record.image?.byteLength||0);
   loadedBytes+=state.bytes;
   reconcile();trimHidden();
  }catch(e){
   if(state.generation===generation){
    status.dataset.error='true';
    status.textContent='One local cover could not be opened: '+e.message+'. Original video preserved.';
   }
  }finally{state.loading=false}
 }
 async function stillFromMedia(file,type){
  let node,url;
  try{
   url=URL.createObjectURL(file);
   if(type.startsWith('video/')){
    node=document.createElement('video');node.muted=true;node.playsInline=true;
    await new Promise((resolve,reject)=>{
     const timer=setTimeout(()=>{done();reject(Error('Preview timed out'))},9000);
     const done=()=>{clearTimeout(timer);node.removeEventListener('loadeddata',loaded);node.removeEventListener('error',failed)};
     const loaded=()=>{done();resolve()},failed=()=>{done();reject(Error('Unsupported cover codec'))};
     node.addEventListener('loadeddata',loaded);node.addEventListener('error',failed);
     node.src=url;node.preload='auto';node.load();
    });
   }else{
    node=new Image();
    await new Promise((resolve,reject)=>{node.onload=resolve;node.onerror=reject;node.src=url});
   }
   const w=node.videoWidth||node.naturalWidth,h=node.videoHeight||node.naturalHeight;if(!w||!h)return null;
   const canvas=document.createElement('canvas');canvas.width=960;canvas.height=540;
   const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)return null;
   ctx.fillStyle='#131426';ctx.fillRect(0,0,960,540);
   const scale=Math.max(960/w,540/h),dw=w*scale,dh=h*scale;
   ctx.drawImage(node,(960-dw)/2,(540-dh)/2,dw,dh);
   return await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.88));
  }catch{return null}
  finally{if(node?.tagName==='VIDEO'){node.pause();node.removeAttribute('src');node.load()}
   if(url)URL.revokeObjectURL(url)}
 }
 async function updateCover(id,file){
  const type=coverType(file);
  show('Preparing personal cover locally…');
  const still=await stillFromMedia(file,type);
  const items=await listStoredVideos(),item=items.find(x=>x.id===id);
  if(!item)throw Error('This saved video was removed before the cover finished.');
  await saveCoverArt(id,file,type,still);
  show('Saved a '+(type.startsWith('video/')?'muted animated video':type==='image/gif'?'GIF':'still image')+' cover for '+item.name+'. Your original video was not changed.');
  $('videoVaultRefresh')?.click();
 }
 async function resetCover(id){
  await deleteCoverArt(id);
  show('Custom cover reset. Original video, existing snapshot and collections preserved.');
  $('videoVaultRefresh')?.click();
 }
 function btn(text){
  const b=document.createElement('button');b.type='button';b.className='small-btn';
  b.textContent=text;b.style.minHeight='36px';return b;
 }
 async function decorate(){
  if(enhancing){pendingRender=true;return}
  const id=++generation;enhancing=true;
  try{
   const [videos,coverKeys]=await Promise.all([listStoredVideos(),listCoverKeys()]);
   const coverIds=new Set(coverKeys);
   if(id!==generation)return;
   const integrity=$('videoVaultCoverIntegrity');
   if(integrity){
    const validIds=new Set(videos.map(v=>v.id));
    const orphanCount=coverKeys.filter(id=>!validIds.has(id)).length;
    integrity.textContent=coverIds.size+' personal cover'+(coverIds.size===1?'':'s')+
     ' · '+orphanCount+' unused · viewport-optimized previews';
   }
   const list=sortVideoLibrary(videos,{query:$('videoVaultSearch')?.value||'',
    filter:$('videoVaultFilter')?.value||'all',sort:$('videoVaultSort')?.value||'recent'}).slice(0,180);
   const cards=[...grid.querySelectorAll('.video-vault-card')];
   if(cards.length!==list.length)return;
   clean();
   for(const [i,card] of cards.entries()){
    const item=list[i];if(!item||card.dataset.coverEnhanced===item.id)continue;
    card.dataset.coverEnhanced=item.id;
    const cover=card.querySelector('.video-vault-cover'),actions=card.querySelector('.video-vault-card-actions');
    if(!cover||!actions)continue;
    const file=document.createElement('input');file.type='file';file.hidden=true;
    file.accept='.gif,.mp4,.webm,.png,.jpg,.jpeg,.webp,image/gif,video/mp4,video/webm,image/png,image/jpeg,image/webp';
    file.setAttribute('aria-label','Choose personal cover for '+item.name);
    const choose=btn('✧ GIF/Video Cover');choose.title='Choose a personal local animated thumbnail for '+item.name;
    choose.addEventListener('click',()=>file.click());
    file.addEventListener('change',()=>{
     const selected=file.files?.[0];file.value='';
     if(selected)void updateCover(item.id,selected).catch(e=>{
      status.dataset.error='true';status.textContent='Could not save custom cover: '+e.message;
     });
    });
    actions.append(choose,file);
    if(coverIds.has(item.id)){
     const reset=btn('↺ Cover');reset.title='Remove only the custom cover, keeping the original saved movie';
     reset.addEventListener('click',()=>void resetCover(item.id).catch(e=>{
      status.dataset.error='true';status.textContent='Could not reset cover: '+e.message;
     }));actions.append(reset);
     const state={id:item.id,card,cover,generation,loaded:false,loading:false,
      visible:false,urls:[],bytes:0,lastSeen:0};
     lazyCards.set(cover,state);
     if(observer)observer.observe(cover);
     else if(i<12)void loadCover(state);
    }
   }
   reconcile();
  }catch(e){status.textContent='Personal artwork unavailable: '+e.message;status.dataset.error='true'}
  finally{enhancing=false;if(pendingRender){pendingRender=false;schedule()}}
 }
 function schedule(){
  if(queued)return;queued=true;
  queueMicrotask(()=>{queued=false;void decorate()});
 }
 const mutation=new MutationObserver(events=>{
  if(events.some(e=>[...e.addedNodes].some(n=>n.nodeType===1&&n.classList?.contains('video-vault-card'))||
   [...e.removedNodes].some(n=>n.nodeType===1&&n.classList?.contains('video-vault-card'))))schedule();
 });
 mutation.observe(grid,{childList:true});
 document.addEventListener('proximus-vault-visual-refresh',()=>{
  // Settings sliders update existing art via CSS. Motion-profile changes trigger
  // the Vault's own non-destructive card render; no duplicated cover controls.
  const mode=window.ProximusVisualPopV37?.previewMode?.();
  if(grid.dataset.previewMode!==mode){grid.dataset.previewMode=mode;
   $('videoVaultRefresh')?.click();}
  else reconcile();
 });
 // This event is emitted only after the original movie deletion has committed.
 document.addEventListener('proximus-video-vault-removed',event=>{
  const id=event.detail?.id;
  if(typeof id!=='string'||!id)return;
  void deleteCoverArt(id).then(()=>schedule()).catch(e=>{
   status.dataset.error='true';status.textContent='Movie removed, but its extra cover could not be cleaned: '+e.message;
  });
 });
 const cleanupButton=$('videoVaultCleanCovers');
 cleanupButton?.addEventListener('click',async()=>{
  cleanupButton.disabled=true;
  try{
   const [keys,videos]=await Promise.all([listCoverKeys(),listStoredVideos()]);
   const valid=new Set(videos.map(v=>v.id));
   const unused=keys.filter(id=>!valid.has(id));
   if(!unused.length){show('Artwork library is tidy. No unused custom covers found.');return}
   if(!confirm('Delete '+unused.length+' unused custom artwork cover(s)? This never deletes a video or its original snapshot.'))return;
   for(const id of unused)await deleteCoverArt(id);
   show('Freed '+unused.length+' unused cover(s). All saved videos remain untouched.');
   schedule();
  }catch(e){
   status.dataset.error='true';status.textContent='Cannot inspect unused artwork safely: '+e.message;
  }finally{cleanupButton.disabled=false}
 });
 document.addEventListener('proximus-view-changed',reconcile);
 document.addEventListener('visibilitychange',reconcile);
 window.addEventListener('pagehide',()=>{mutation.disconnect();clean()},{once:true});
 schedule();
}
