/* PROXIMUS v3.7 — Local Animated Video Vault Covers.
 * Additive layer over existing Video Vault. No schema migration, video copies,
 * video downloads or cross-origin access. Source media stays in OPFS/IndexedDB.
 * Custom GIF/video/image cover Blobs share the item's existing metadata row. */
import {$} from './core.js';
import {listStoredVideos,updateStoredVideo} from './video-vault.js';
import {sortVideoLibrary} from './video-vault-core.js';
const mobile=/iPhone|iPad|iPod/i.test(typeof navigator==='undefined'?'':navigator.userAgent);
const TYPES={gif:'image/gif',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',mp4:'video/mp4',webm:'video/webm'};
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
 const objectUrls=new Set(),candidates=new Map();
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
   const movie=entry.target.querySelector('.video-vault-art-video');
   if(movie)candidates.set(movie,entry.isIntersecting);
  }
  reconcile();
 },{rootMargin:'80px 0px',threshold:.08});
 function clean(){
  observer?.disconnect();
  for(const node of candidates.keys())stop(node);candidates.clear();
  for(const url of objectUrls)URL.revokeObjectURL(url);objectUrls.clear();
 }
 const urlFor=blob=>{const url=URL.createObjectURL(blob);objectUrls.add(url);return url};
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
  // WebKit IndexedDB is more reliable with a plain Blob than a file-picker File.
  item.coverBlob=new Blob([file],{type});item.coverMime=type;
  if(still)item.coverPoster=still;else delete item.coverPoster;
  item.updated=Date.now();
  await updateStoredVideo(item);
  show('Saved a '+(type.startsWith('video/')?'muted animated video':type==='image/gif'?'GIF':'still image')+' cover for '+item.name+'. Your original video was not changed.');
  $('videoVaultRefresh')?.click();
 }
 async function resetCover(id){
  const items=await listStoredVideos(),item=items.find(x=>x.id===id);
  if(!item)return;
  delete item.coverBlob;delete item.coverMime;delete item.coverPoster;
  item.updated=Date.now();await updateStoredVideo(item);
  show('Custom cover reset. Original video and existing snapshot preserved.');
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
   const videos=await listStoredVideos();
   if(id!==generation)return;
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
    if(item.coverBlob instanceof Blob){
     const reset=btn('↺ Cover');reset.title='Remove custom cover (keeps the video)';
     reset.addEventListener('click',()=>void resetCover(item.id).catch(e=>{
      status.dataset.error='true';status.textContent='Could not reset cover: '+e.message;
     }));actions.append(reset);
     const type=item.coverMime||item.coverBlob.type||'';
     const imagePoster=item.coverPoster instanceof Blob?item.coverPoster:null;
     if(imagePoster){
      const image=document.createElement('img');image.className='video-vault-art-still';
      image.src=urlFor(imagePoster);image.alt='';image.loading='lazy';cover.append(image);
     }
     if(type.startsWith('image/')){
      if(window.ProximusVisualPopV37?.previewMode?.()!=='still'||type!=='image/gif'){
       const image=document.createElement('img');image.className='video-vault-art-image';
       image.src=urlFor(item.coverBlob);image.alt='';image.loading='lazy';cover.append(image);
      }
     }else if(type.startsWith('video/')){
      const movie=document.createElement('video');movie.className='video-vault-art-video';
      movie.preload='none';movie.muted=true;movie.loop=true;movie.playsInline=true;
      movie.setAttribute('muted','');movie.setAttribute('playsinline','');
      movie.setAttribute('aria-hidden','true');movie.hidden=true;
      movie.dataset.url=urlFor(item.coverBlob);movie.dataset.mime=type;
      cover.append(movie);candidates.set(movie,false);observer?.observe(cover);
     }
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
 document.addEventListener('proximus-view-changed',reconcile);
 document.addEventListener('visibilitychange',reconcile);
 window.addEventListener('pagehide',()=>{mutation.disconnect();clean()},{once:true});
 schedule();
}
