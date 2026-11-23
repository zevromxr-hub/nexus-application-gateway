/* PROXIMUS Asset Alchemist v3.7 | Personal Home Screen Icon Studio
 * Offline, user-supplied artwork -> 180px / 512px PNG. Stores only a small preview.
 * Apple's installed PWA icon comes from the *site-hosted* apple-touch-icon.
 * A personal photo icon can instead be used with iPhone Shortcuts; it launches
 * a shortcut and is NOT the same as reinstalling Safari's standalone web app.
 */
import {$} from './core.js';
const STORAGE='proximus-personal-home-icon-v370';
const MAX_FILE=15*1024*1024;
export function normalizeIconCrop(raw={}){
 const clamp=(v,min,max,fallback)=>Number.isFinite(Number(v))?Math.min(max,Math.max(min,Number(v))):fallback;
 return {zoom:clamp(raw.zoom,100,300,100),
  x:clamp(raw.x,0,100,50),y:clamp(raw.y,0,100,50),
  background:['#111225','#0e2334','#f5e9d4'].includes(raw.background)?raw.background:'#111225',
  frame:raw.frame==='none'?'none':'soft'};
}
export function computeCrop(w,h,size,raw={}){
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)throw Error('Image dimensions unavailable');
 const s=normalizeIconCrop(raw),scale=(size/Math.min(w,h))*s.zoom/100;
 const sw=size/scale,sh=size/scale;
 const sx=(w-sw)*s.x/100,sy=(h-sh)*s.y/100;
 return {sx:Math.max(0,Math.min(w-sw,sx)),sy:Math.max(0,Math.min(h-sh,sy)),sw,sh};
}
const imageToBlob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('PNG export unavailable')),'image/png'));
export function initHomeIconStudio(){
 const source=$('homeIconFile'),preview=$('homeIconPreview'),status=$('homeIconStatus'),zoom=$('homeIconZoom'),
 x=$('homeIconX'),y=$('homeIconY'),background=$('homeIconBackground'),frame=$('homeIconFrame');
 const download180=$('homeIconExport180'),download512=$('homeIconExport512'),share=$('homeIconShare');
 const reset=$('homeIconReset'),copy=$('homeIconCopyUrl'),guide=$('homeIconHelp');
 if(!source||!preview||!status||!zoom||!x||!y||!background||!frame)return;
 const ctx=preview.getContext('2d',{alpha:false});
 let photo=null,objectUrl=null,scheduled=false,sourcePreview=null;
 let crop=normalizeIconCrop();
 const say=text=>{status.textContent=text};
 const current=()=>{crop=normalizeIconCrop({
  zoom:zoom.value,x:x.value,y:y.value,background:background.value,frame:frame.value
 });return crop};
 const controls=()=>{zoom.value=crop.zoom;x.value=crop.x;y.value=crop.y;background.value=crop.background;frame.value=crop.frame};
 function canvasImage(size){
  const cv=document.createElement('canvas');cv.width=cv.height=size;
  const g=cv.getContext('2d',{alpha:false});
  if(!g)throw Error('Icon rendering unavailable');
  const s=current();
  g.fillStyle=s.background;g.fillRect(0,0,size,size);
  if(photo){
   const bounds=computeCrop(photo.naturalWidth,photo.naturalHeight,size,s);
   g.drawImage(photo,bounds.sx,bounds.sy,bounds.sw,bounds.sh,0,0,size,size);
  }else{
   // Original icon fallback is a decorative monogram, not a downloaded asset.
   g.fillStyle='#e9d4fd';g.textAlign='center';g.textBaseline='middle';
   g.font='900 '+Math.floor(size*.57)+'px system-ui';
   g.fillText('P',size/2,size/2+size*.015);
  }
  if(s.frame==='soft'){
   g.strokeStyle='#e8cdffa8';g.lineWidth=size*.026;
   g.strokeRect(size*.055,size*.055,size*.89,size*.89);
  }
  return cv;
 }
 function makeSourcePreview(image){
  const scale=Math.min(1,768/Math.max(image.naturalWidth,image.naturalHeight));
  const c=document.createElement('canvas');
  c.width=Math.max(1,Math.round(image.naturalWidth*scale));c.height=Math.max(1,Math.round(image.naturalHeight*scale));
  c.getContext('2d').drawImage(image,0,0,c.width,c.height);
  return c.toDataURL('image/jpeg',.85);
 }
 function paint(){
  try{ctx.clearRect(0,0,180,180);ctx.drawImage(canvasImage(180),0,0,180,180);
   try{localStorage.setItem(STORAGE,JSON.stringify({...current(),source:sourcePreview}))}
   catch(_){say('Icon preview works, but browser storage is unavailable. Export your PNG before closing.')}
  }catch(e){say('Icon preview failed: '+e.message)}
 }
 function queuePaint(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;paint()})}
 const revoke=()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null};
 async function choose(file){
  if(!file)return;
  if(file.size<1||file.size>MAX_FILE){say('Choose an image up to 15 MB. Nothing was uploaded.');return}
  if(!/^(image\/(png|jpeg|webp|gif))$/.test(file.type||'')){
   say('Use PNG, JPG, WebP or GIF artwork. Animated GIFs become a static app icon.');return}
  const url=URL.createObjectURL(file);
  try{
   const img=new Image();img.decoding='async';
   await new Promise((res,rej)=>{img.onload=()=>res();img.onerror=()=>rej(Error('Cannot decode this picture'));img.src=url});
   if(!img.naturalWidth||!img.naturalHeight)throw Error('No visible image in file');
   revoke();objectUrl=url;photo=img;sourcePreview=makeSourcePreview(img);queuePaint();
   say('Artwork loaded locally. Adjust crop and zoom, then export the 180 or 512 PNG. GIF icons are static.');
  }catch(e){URL.revokeObjectURL(url);say('Artwork was not changed: '+e.message)}
 }
 source.addEventListener('change',()=>{const file=source.files?.[0];if(file)void choose(file);source.value=''});
 // Reuse existing local Media Publisher Master art without any second manual upload.
 const useMaster=$('homeIconUseMaster');
 useMaster?.addEventListener('click',()=>document.dispatchEvent(new Event('proximus-home-icon-request-master')));
 document.addEventListener('proximus-home-icon-master-result',e=>{
  const data=e.detail||{};
  if(data.error){say(data.error);return}
  if(!(data.blob instanceof Blob)){say('Saved Master artwork was unavailable in this browser.');return}
  if(data.mime?.startsWith('video/')){
   void (async()=>{
    const url=URL.createObjectURL(data.blob),video=document.createElement('video');
    video.muted=true;video.playsInline=true;video.preload='auto';
    try{
     await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{finish();reject(Error('Could not decode this video on your iPhone'))},10000);
      const finish=()=>{clearTimeout(timer);video.removeEventListener('loadeddata',loaded);video.removeEventListener('error',fail)};
      const loaded=()=>{finish();resolve()},fail=()=>{finish();reject(Error('Video artwork format unsupported'))};
      video.addEventListener('loadeddata',loaded);video.addEventListener('error',fail);
      video.src=url;video.load();
     });
     if(!video.videoWidth||!video.videoHeight)throw Error('Video has no decodable frame');
     const cv=document.createElement('canvas');
     const scale=Math.min(1,768/Math.max(video.videoWidth,video.videoHeight));
     cv.width=Math.max(1,Math.round(video.videoWidth*scale));cv.height=Math.max(1,Math.round(video.videoHeight*scale));
     cv.getContext('2d').drawImage(video,0,0,cv.width,cv.height);
     const frame=await imageToBlob(cv);
     await choose(new File([frame],'master-video-frame.png',{type:'image/png'}));
     say('Using the first decoded frame of your saved Master video. Crop, then download your personal icon.');
    }catch(err){say('Master video preview unavailable: '+err.message)}
    finally{video.pause();video.removeAttribute('src');video.load();URL.revokeObjectURL(url)}
   })();
  }else{
   const type=data.mime||data.blob.type||'image/png';
   void choose(new File([data.blob],data.name||'master-art.png',{type})).then(()=>{
    say('Using your existing Master artwork. Crop it and export the icon—no second upload required.');
   });
  }
 });
 for(const input of [zoom,x,y,background,frame])input.addEventListener(input.tagName==='SELECT'?'change':'input',queuePaint);
 async function exportPNG(size,shareSheet=false){
  const canvas=canvasImage(size),blob=await imageToBlob(canvas);
  const name='PROXIMUS-personal-icon-'+size+'.png';
  const file=new File([blob],name,{type:'image/png'});
  if(shareSheet&&navigator.canShare?.({files:[file]})&&navigator.share){
   try{await navigator.share({files:[file],title:'PROXIMUS Home Screen Icon'});say('Icon shared. Save it to Photos/Files and select it in Shortcuts.');return}catch(err){
    if(err?.name==='AbortError')return;
   }
  }
  const url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=name;document.body.append(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),12000);
  say('Exported '+size+'×'+size+' PNG. On iPhone, save it to Photos/Files and use Apple Shortcuts to choose a personal Home Screen icon.');
 }
 download180?.addEventListener('click',()=>void exportPNG(180).catch(e=>say(e.message)));
 download512?.addEventListener('click',()=>void exportPNG(512).catch(e=>say(e.message)));
 share?.addEventListener('click',()=>void exportPNG(512,true).catch(e=>say(e.message)));
 copy?.addEventListener('click',async()=>{
  const url=new URL('./',location.href).href;
  try{await navigator.clipboard.writeText(url);say('Copied PROXIMUS app URL for your iPhone Shortcut: '+url)}
  catch(_){say('Copy this address into Shortcuts → Open URLs: '+url)}
 });
 reset?.addEventListener('click',()=>{
  revoke();photo=null;sourcePreview=null;crop=normalizeIconCrop();controls();paint();
  say('Reset the icon preview; original files and existing installed icons are unchanged.');
 });
 // The preview is intentionally local-only. Safari will not read this as its
 // apple-touch-icon; user-specific icons are installed via Shortcuts.
 try{
  const previous=JSON.parse(localStorage.getItem(STORAGE)||'null');
  if(previous){crop=normalizeIconCrop(previous);controls();
   if(typeof previous.source==='string'&&previous.source.startsWith('data:image/jpeg;base64,')){
    const img=new Image();img.onload=()=>{photo=img;sourcePreview=previous.source;paint()};img.src=previous.source;
   }else paint();
  }else paint();
 }catch(_){paint()}
 guide?.addEventListener('toggle',()=>{});
 window.addEventListener('pagehide',revoke,{once:true});
}
