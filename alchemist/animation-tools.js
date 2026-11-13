// PROXIMUS | ASSET ALCHEMIST v2.3 — Animation Forge
// Real local video/GIF frame sampling + GIF89a encoding; browser-dependent decoders clearly guarded.
import {$,safe,stem,bytes,notice,download,makeZip,textFile,blobCanvas,wrap} from './core.js';
import {encodeGif} from './gif-codec.js';
import {parseGifFrames,createGifFrameRenderer} from './gif-reader.js';
import {saveOrShare,mobileFileSupport} from './portable-kit.js';
const MAX_BYTES=250000000,MAX_FRAMES=120,MAX_GIF_FRAMES=400,MAX_GIF_PIXELS=360000,MAX_FRAME_BUDGET=17000000;
const ICON_SIZES=[32,64,128,256];
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const delay=()=>new Promise(resolve=>setTimeout(resolve,0));
function sourceType(file){
 const name=String(file?.name||'').toLowerCase();
 if(file?.type==='image/gif'||name.endsWith('.gif'))return 'gif';
 if(['video/mp4','video/webm','video/quicktime','video/x-m4v'].includes(file?.type)||/\.(?:mp4|webm|mov|m4v)$/.test(name))return 'video';
 throw Error('Use a local GIF, MP4, MOV, M4V or WebM. Other formats require a browser-supported decoder.');
}
// Default GIF mode keeps the original aspect ratio with no exact-size requirement.
export function dimensionsForGif(w,h,{preset='auto',customWidth=0,customHeight=0,keepRatio=true}={}){
 w=Math.round(Number(w));h=Math.round(Number(h));
 if(w<1||h<1)throw Error('Invalid source dimensions.');
 let width,height;
 if(preset==='custom'){
  const cw=Number(customWidth)||0,ch=Number(customHeight)||0;
  if(cw<=0&&ch<=0)throw Error('Enter a custom width, height, or both — or use Auto GIF size.');
  if(keepRatio){
   const scale=cw>0&&ch>0?Math.min(cw/w,ch/h):cw>0?cw/w:ch/h;
   width=Math.max(1,Math.round(w*scale));height=Math.max(1,Math.round(h*scale));
  }else{
   width=Math.max(1,Math.round(cw||w));height=Math.max(1,Math.round(ch||h));
  }
 }else{
  const size=({auto:480,small:240,medium:360,large:600})[preset]||480;
  const scale=Math.min(1,size/Math.max(w,h),Math.sqrt(MAX_GIF_PIXELS/(w*h)));
  width=Math.max(1,Math.round(w*scale));height=Math.max(1,Math.round(h*scale));
 }
 if(width>720||height>720||width*height>MAX_GIF_PIXELS)throw Error('This GIF size exceeds browser memory limits (maximum 720 px per side and 360,000 total pixels). Choose a smaller size.');
 return {width,height};
}
// ImageData exposes width/height/data through prototype getters, which are NOT
// copied by object spread. Always extract them explicitly before GIF encoding.
// This fixes regular video→GIF, GIF resize, and derived animated icon output.
// GIF89a stores frame delays in 1/100 second units. Distributing
// rounding over the sequence prevents drift: e.g. 15 FPS alternates
// 60/70 ms and 24 FPS alternates 40/50 ms instead of running too fast.
export function gifDelayMs(fps,frameIndex){
 const rate=Number(fps),index=Number(frameIndex);
 if(!Number.isFinite(rate)||rate<1||rate>50||!Number.isInteger(index)||index<0)throw Error('Invalid GIF frame timing.');
 const t0=Math.round(index*100/rate),t1=Math.round((index+1)*100/rate);
 return Math.max(20,(t1-t0)*10);
}
export function frameForGif(image,delayMs=100){
 const width=Number(image?.width),height=Number(image?.height),data=image?.data;
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
    !(data instanceof Uint8ClampedArray)||data.length!==width*height*4)
  throw Error('A decoded frame is invalid. Try another video codec or image.');
 return {width,height,data,delayMs:Math.max(20,Math.round(Number(delayMs)||100))};
}
function drawFrame(ctx,source,width,height,mode,bg,transparent){
 const c=ctx.canvas;
 ctx.clearRect(0,0,c.width,c.height);
 if(!transparent){ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);}
 const srcW=Number(source.displayWidth||source.videoWidth||source.naturalWidth||source.width||width);
 const srcH=Number(source.displayHeight||source.videoHeight||source.naturalHeight||source.height||height);
 if(!srcW||!srcH)throw Error('The source frame has no decoded dimensions.');
 const factor=mode==='cover'?Math.max(c.width/srcW,c.height/srcH):Math.min(c.width/srcW,c.height/srcH);
 const dw=srcW*factor,dh=srcH*factor;
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 ctx.drawImage(source,(c.width-dw)/2,(c.height-dh)/2,dw,dh);
 return ctx.getImageData(0,0,c.width,c.height);
}
async function videoSource(file){
 const video=document.createElement('video'),url=URL.createObjectURL(file);
 video.preload='auto';video.muted=true;video.playsInline=true;video.src=url;
 try{
  await new Promise((resolve,reject)=>{
   const timeout=setTimeout(()=>{cleanup();reject(Error('Video metadata timed out. This browser may not decode that codec.'))},15000);
   const cleanup=()=>{clearTimeout(timeout);video.removeEventListener('loadedmetadata',ok);video.removeEventListener('error',fail)};
   const ok=()=>{cleanup();resolve()},fail=()=>{cleanup();reject(Error('This browser cannot open the selected video codec. Try MP4/H.264 or WebM/VP8/VP9.'))};
   video.addEventListener('loadedmetadata',ok,{once:true});video.addEventListener('error',fail,{once:true});video.load();
   if(video.readyState>=1)ok();
  });
  if(!Number.isFinite(video.duration)||!video.duration||video.videoWidth<1)throw Error('Video has invalid duration or dimensions.');
  return {kind:'video',video,width:video.videoWidth,height:video.videoHeight,duration:video.duration,close(){video.pause();video.removeAttribute('src');video.load();URL.revokeObjectURL(url)}};
 }catch(err){URL.revokeObjectURL(url);throw err;}
}
async function gifSource(file){
 // Native decoder where available, plus a fully local GIF89a/GIF87a fallback for Safari.
 if(typeof ImageDecoder!=='undefined'&&await ImageDecoder.isTypeSupported('image/gif')){
  const decoder=new ImageDecoder({data:new Uint8Array(await file.arrayBuffer()),type:'image/gif',preferAnimation:true});
  try{
   await decoder.tracks.ready;const track=decoder.tracks.selectedTrack;
   if(!track||track.frameCount<1||track.frameCount>MAX_GIF_FRAMES)throw Error('GIF must contain 1–400 frames for safe local conversion.');
   const first=(await decoder.decode({frameIndex:0})).image;
   const width=first.displayWidth,height=first.displayHeight;first.close();
   return {kind:'gif',decoder,count:track.frameCount,width,height,close(){decoder.close()}};
  }catch(err){decoder.close();throw err;}
 }
 const parsed=parseGifFrames(await file.arrayBuffer());
 const renderer=createGifFrameRenderer(parsed);
 return {kind:'gifraw',renderer,count:parsed.frames.length,width:parsed.width,height:parsed.height,close(){}};
}
async function openSource(file){
 if(!file)throw Error('Select a local MP4, WebM or GIF.');
 if(file.size<1||file.size>MAX_BYTES)throw Error('Source must be between 1 byte and 250 MB.');
 const type=sourceType(file);
 return type==='gif'?gifSource(file):videoSource(file);
}
async function seek(video,time){
 time=clamp(time,0,Math.max(0,video.duration-.035));
 // Seeking to time=0 after loadedmetadata may not dispatch "seeked".
 // Wait for a genuinely decoded frame instead of relying on an unchanged currentTime.
 if(Math.abs(video.currentTime-time)<.005){
  if(video.readyState>=2)return;
  await new Promise((resolve,reject)=>{
   const timer=setTimeout(()=>{cleanup();reject(Error('Timed out waiting for first video frame.'))},7500);
   const cleanup=()=>{clearTimeout(timer);video.removeEventListener('loadeddata',ok);video.removeEventListener('canplay',ok);video.removeEventListener('error',fail)};
   const ok=()=>{cleanup();resolve()},fail=()=>{cleanup();reject(Error('Video frame could not be decoded.'))};
   video.addEventListener('loadeddata',ok,{once:true});video.addEventListener('canplay',ok,{once:true});video.addEventListener('error',fail,{once:true});
   if(video.readyState>=2)ok();
  });
  return;
 }
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{cleanup();reject(Error('Video seeking timed out. The source codec may not support frame extraction.'))},7500);
  const cleanup=()=>{clearTimeout(timer);video.removeEventListener('seeked',onSeek);video.removeEventListener('error',onError)};
  const onSeek=()=>{cleanup();resolve()},onError=()=>{cleanup();reject(Error('Could not extract the selected video frame'))};
  video.addEventListener('seeked',onSeek,{once:true});video.addEventListener('error',onError,{once:true});
  try{video.currentTime=time;}catch(err){cleanup();reject(err)}
 });
 // The 'seeked' event can precede compositor presentation, especially on
 // iPhone. Give the decoder an opportunity to present the target frame
 // before reading its pixels into our GIF Canvas.
 if(typeof video.requestVideoFrameCallback==='function'){
  await new Promise(resolve=>{
   let done=false;let requestId=null;
   const finish=()=>{if(done)return;done=true;clearTimeout(timer);
    if(requestId!==null&&typeof video.cancelVideoFrameCallback==='function')
     try{video.cancelVideoFrameCallback(requestId);}catch(e){}
    resolve();};
   const timer=setTimeout(finish,65);
   try{requestId=video.requestVideoFrameCallback((now,metadata)=>{
    if(Math.abs((metadata?.mediaTime??time)-time)>.2){finish();return;}
    finish();
   });}catch(e){finish();}
  });
 }else if(typeof requestAnimationFrame==='function'){
  await new Promise(resolve=>requestAnimationFrame(()=>resolve()));
 }
}
async function sampleFrames(source,{start,end,fps,width,height,mode='contain',bg='#111020',transparent=false,
 speed=1,reverse=false,caption='',captionColor='#ffffff',progress=()=>{},isCancelled=()=>false}){
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||start<0)throw Error('End time must be greater than start time.');
 if(end-start>8.01)throw Error('Maximum GIF clip length is 8 seconds.');
 fps=Math.floor(fps);
 if(![6,8,12,15,20,24].includes(fps))throw Error('FPS must be 6, 8, 12, 15, 20 or 24.');
 speed=Number(speed);
 if(![.5,1,1.5,2].includes(speed))throw Error('Choose a supported GIF playback speed.');
 const count=Math.ceil((end-start)*fps/speed);
 if(count>MAX_FRAMES)throw Error('GIF export supports up to 120 frames. At 24 FPS choose 5 seconds or less; at 20 FPS choose 6 seconds or less, or select lower FPS.');
 if(count*width*height>MAX_FRAME_BUDGET)throw Error('The GIF would use too much browser memory. Choose a smaller size, shorter clip, or lower FPS.');
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true}),frames=[];
 const stamp=frame=>{
  if(!caption.trim())return frame;
  const cc=document.createElement('canvas');cc.width=width;cc.height=height;
  const c=cc.getContext('2d',{willReadFrequently:true});c.putImageData(frame,0,0);
  const text=caption.trim().slice(0,70),font=Math.max(12,Math.min(34,Math.round(width*.06)));
  c.font='800 '+font+'px system-ui';c.textAlign='center';c.lineWidth=Math.max(3,font*.16);c.strokeStyle='#000c';
  c.strokeText(text,width/2,height-Math.max(8,font*.5),width*.92);
  c.fillStyle=captionColor;c.fillText(text,width/2,height-Math.max(8,font*.5),width*.92);
  return c.getImageData(0,0,width,height);
 };
 if(source.kind==='video'){
  source.video.pause();
  if(start>=source.duration)throw Error('Start time exceeds the video duration.');
  const realEnd=Math.min(end,source.duration);
  for(let k=0;k<count;k++){
   if(isCancelled())throw Error('Conversion cancelled.');
   const time=start+k*speed/fps;if(time>=realEnd-.0001)break;
   await seek(source.video,time);
   frames.push(frameForGif(stamp(drawFrame(ctx,source.video,width,height,mode,bg,transparent)),gifDelayMs(fps,k)));
   if(k%2===0){progress('Extracting video frame '+(k+1)+' of '+count);await delay();}
  }
 }else{
  // Sample by animation timestamp, automatically repeating shorter source GIFs.
  let index=0,next=0,current=null,loops=0;
  try{
   for(let k=0;k<count;k++){
    if(isCancelled())throw Error('Conversion cancelled.');
    const time=start+k*speed/fps;
    while(!current||time>=next-1e-6){
     current?.close?.();
     const i=index%source.count;
     const result=source.kind==='gifraw'?source.renderer.frame(i):(await source.decoder.decode({frameIndex:i})).image;
     current=source.kind==='gifraw'?result.canvas:result;
     next+=clamp(Number(result.duration||100000)/1000000,.02,10);
     index++;loops++;
     if(loops>3000)throw Error('Invalid GIF timing metadata.');
    }
    frames.push(frameForGif(stamp(drawFrame(ctx,current,width,height,mode,bg,transparent)),gifDelayMs(fps,k)));
    if(k%2===0){progress('Sampling animated GIF '+(k+1)+' of '+count);await delay();}
   }
  }finally{current?.close?.();}
 }
 if(!frames.length)throw Error('No frames decoded. Adjust the trim range or try another file.');
 if(reverse)frames.reverse();
 return frames;
}
async function exportAnimatedIcons(frames,sourceW,sourceH,sizes,{bg,transparent,dither,fps,progress=()=>{}}){
 const entries=[];
 const stage=document.createElement('canvas'),sc=stage.getContext('2d',{willReadFrequently:true});
 stage.width=sourceW;stage.height=sourceH;
 for(const size of sizes){
  if(!ICON_SIZES.includes(size))throw Error('Animated icon sizes must be 32, 64, 128 or 256.');
  const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const resized=[];
  for(let i=0;i<frames.length;i++){
   if(sourceW===size&&sourceH===size)resized.push(frames[i]);
   else{
    sc.putImageData(frames[i],0,0);
    const image=drawFrame(ctx,stage,sourceW,sourceH,'cover',bg,transparent);
    resized.push(frameForGif(image,frames[i].delayMs));
   }
  }
  progress('Encoding '+size+'×'+size+' animated GIF icon…');
  const gif=encodeGif({width:size,height:size,frames:resized,transparent,dither});
  entries.push({name:'icon-animated-'+size+'x'+size+'.gif',data:gif});
  // A genuine first-frame static PNG is useful where animated GIF icons are unsupported.
  ctx.clearRect(0,0,size,size);
  ctx.putImageData(resized[0],0,0);
  entries.push({name:'icon-still-'+size+'x'+size+'.png',data:await blobCanvas(canvas)});
  await delay();
 }
 entries.push({name:'README.txt',data:'PROXIMUS Asset Alchemist animated icon pack\n'+
  'GIF files contain actual animated frames, and PNGs are their static fallback.\n'+
  'GIF icons are not Windows .ico files. Windows taskbar/executable ICO does not animate.\n'+
  'Discord and other platforms may limit animated icon uploads, size and usage.\n'+
  'FPS: '+fps+'; Frame count: '+frames.length+'\n'});
 return await makeZip(entries);
}
export async function makeAnimatedIconPack(file,{sizes=ICON_SIZES,seconds=4,fps=8,progress=()=>{}}={}){
 const src=await openSource(file);
 try{
  const duration=clamp(Number(seconds)||4,.5,6);
  const width=256,height=256;
  const frames=await sampleFrames(src,{start:0,end:duration,fps,width,height,mode:'cover',bg:'#0d091b',transparent:false,progress});
  progress('Building '+sizes.length+' real animated GIF icons and static fallbacks…');
  return await exportAnimatedIcons(frames,width,height,sizes,{bg:'#0d091b',transparent:false,dither:true,fps,progress});
 }finally{src.close();}
}
export function initAnimationForge(app){
 const fileEl=$('animFile');if(!fileEl)return;
 const video=$('animVideo'),gif=$('animGif'),preview=$('animResult');
 const status=$('animStatus'),progress=$('animProgress');
 let file=null,url=null,resultURL=null,busy=false,cancel=false,lastGif=null,lastGifName='';
 const say=t=>{progress.textContent=t};
 const quality=()=>({
  fps:Number($('animFPS').value),
  start:Number($('animStart').value),
  end:Number($('animEnd').value),
  transparent:$('animTransparent').checked,
  dither:$('animDither').checked,
  mode:$('animFit').value,
  bg:$('animBg').value,
  speed:Number($('animSpeed').value),reverse:$('animReverse').checked,
  caption:$('animCaption').value,captionColor:$('animCaptionColor').value
 });
 function cleanup(){video.pause();video.removeAttribute('src');video.load();gif.removeAttribute('src');if(url)URL.revokeObjectURL(url);url=null}
 fileEl.addEventListener('change',wrap(async e=>{
  const f=e.target.files[0];if(!f)return;
  if(busy)throw Error('Finish or cancel the current export first');
  const type=sourceType(f);if(f.size>MAX_BYTES)throw Error('Media exceeds 250 MB.');
  cleanup();file=f;lastGif=null;lastGifName='';$('animUseBg').hidden=true;$('animUseThumb').hidden=true;$('animSaveShare').hidden=true;$('animOpenGif').hidden=true;preview.hidden=true;if(resultURL){URL.revokeObjectURL(resultURL);resultURL=null;}url=URL.createObjectURL(file);
  video.hidden=type!=='video';gif.hidden=type!=='gif';
  if(type==='video'){
   video.onloadedmetadata=()=>{
    if(file!==f)return;
    $('animStart').value=0;
    $('animEnd').value=Math.min(6,video.duration).toFixed(1);
    status.textContent='Video · '+video.videoWidth+'×'+video.videoHeight+' · '+video.duration.toFixed(1)+' sec';
   };
   video.onerror=()=>status.textContent='Video codec unsupported in this browser. Try H.264 MP4 or WebM.';
   video.src=url;video.load();
  }else{
   gif.src=url;$('animStart').value=0;$('animEnd').value=4;
   status.textContent='Animated GIF loaded · click Convert to resize, trim or create GIF icons';
  }
  say(safe(f.name)+' · '+bytes(f.size)+' · local only');
 }));
 $('animCancel').addEventListener('click',()=>{cancel=true;say('Cancellation requested. Finishing the current frame…')});
 async function run(kind){
  if(!file)throw Error('Choose MP4, WebM or GIF first.');
  if(busy)throw Error('An animation export is already in progress.');
  busy=true;cancel=false;
  const controls=['animConvert','animToPack','animIcons','animFrame','animExtract'];for(const id of controls)$(id).disabled=true;
  let src=null;
  try{
   src=await openSource(file);
   const opts=quality();
   let width,height;
   if(kind==='icons'||kind==='iconPack'){width=256;height=256;}else{
    ({width,height}=dimensionsForGif(src.width,src.height,{
     preset:$('animSizePreset').value,
     customWidth:Number($('animCustomWidth').value),
     customHeight:Number($('animCustomHeight').value),
     keepRatio:$('animKeepRatio').checked
    }));
   }
   if(kind==='frame'){
    opts.end=opts.start+opts.speed/opts.fps;
   }
   const frames=await sampleFrames(src,{...opts,width,height,progress:say,isCancelled:()=>cancel,
    mode:kind==='icons'?'cover':opts.mode});
   if(cancel)throw Error('Conversion cancelled.');
   const base=stem(file.name);
   if(kind==='icons'||kind==='iconPack'){
    const sizes=[...document.querySelectorAll('.animIconSize:checked')].map(el=>Number(el.value));
    if(!sizes.length)throw Error('Select at least one animated icon size.');
    const blob=await exportAnimatedIcons(frames,256,256,sizes,{...opts,progress:say});
    const name=base+'-ANIMATED-ICON-PACK.zip';
    if(kind==='iconPack')app.addAsset(name,blob,'Animation Forge');
    else download(blob,name);
    status.textContent='GIF icon ZIP completed · '+frames.length+' frames · '+bytes(blob.size);
    notice('Animated GIF icon pack '+(kind==='iconPack'?'added to Pack':'downloaded'));
   }else if(kind==='frames'){
    const c=document.createElement('canvas');c.width=width;c.height=height;
    const cx=c.getContext('2d'),entries=[];
    for(let i=0;i<frames.length;i++){
     if(cancel)throw Error('Conversion cancelled.');
     cx.putImageData(frames[i],0,0);
     entries.push({name:base+'-frame-'+String(i+1).padStart(3,'0')+'.png',data:await blobCanvas(c)});
     if(i%5===0){say('Extracting PNG '+(i+1)+' / '+frames.length);await delay();}
    }
    entries.push({name:'FRAMES.txt',data:'PROXIMUS GIF / VIDEO FRAME EXTRACTION\n'+width+'x'+height+' · '+frames.length+' PNG frames\n'});
    const zipped=await makeZip(entries);
    download(zipped,base+'-EXTRACTED-FRAMES.zip');
    status.textContent='PNG frames extracted · '+frames.length+' files · '+bytes(zipped.size);
   }else if(kind==='frame'){
    const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
    canvas.getContext('2d').putImageData(frames[0],0,0);
    const blob=await blobCanvas(canvas);
    download(blob,base+'-frame.png');status.textContent='PNG keyframe exported';
   }else{
    say('Encoding real '+width+'×'+height+' GIF89a ('+frames.length+' frames)…');
    const blob=encodeGif({width,height,frames,transparent:opts.transparent,dither:opts.dither});
    if(resultURL)URL.revokeObjectURL(resultURL);
    resultURL=URL.createObjectURL(blob);
    preview.src=resultURL;preview.hidden=false;
    const name=base+'-'+width+'x'+height+'-'+opts.fps+'fps.gif';
    if(kind==='pack')app.addAsset(name,blob,'Animation Forge');
    else download(blob,name);
    lastGif=blob;lastGifName=name;
    $('animUseBg').hidden=false;$('animUseThumb').hidden=false;
    $('animSaveShare').hidden=false;$('animOpenGif').hidden=false;
    status.textContent='GIF complete · '+frames.length+' frames · '+width+'×'+height+' · '+bytes(blob.size);
    say('Completed with true animated GIF89a encoding. Preview below.');
   }
  }finally{
   src?.close();busy=false;
   for(const id of controls)$(id).disabled=false;
  }
 }
 const mode=$('animMode'),sizePreset=$('animSizePreset');
 function updateMode(){
  const icons=mode.value==='icons';
  $('animIconOptions').hidden=!icons;
  $('animStandardOptions').hidden=icons;
  $('animConvert').textContent=icons?'↓ Create animated GIF icons':'↓ Create regular GIF';
  $('animToPack').textContent=icons?'＋ Icon ZIP to Pack':'＋ GIF to Pack';
 }
 function updateSize(){ $('animCustomFields').hidden=sizePreset.value!=='custom'; }
 mode.addEventListener('change',updateMode);sizePreset.addEventListener('change',updateSize);
 updateMode();updateSize();
 $('animConvert').addEventListener('click',wrap(()=>run(mode.value==='icons'?'icons':'gif')));
 $('animToPack').addEventListener('click',wrap(()=>run(mode.value==='icons'?'iconPack':'pack')));
 $('animIcons').addEventListener('click',wrap(()=>run('icons')));
 for(const [id,target] of [['animUseBg','background'],['animUseThumb','hero']]){
  $(id).addEventListener('click',()=>{
   if(!lastGif){notice('Create a regular GIF first.',true);return;}
   document.dispatchEvent(new CustomEvent('proximus-media-export',{detail:{blob:lastGif,name:lastGifName,target}}));
  });
 }
 $('animFrame').addEventListener('click',wrap(()=>run('frame')));
 $('animExtract').addEventListener('click',wrap(()=>run('frames')));
 $('animSaveShare').addEventListener('click',wrap(async()=>{
  if(!lastGif)throw Error('Create a GIF first.');
  const result=await saveOrShare(lastGif,lastGifName);
  say(result==='shared'?'GIF sent to your device share/save sheet':result==='downloaded'?'GIF downloaded': 'GIF sharing cancelled');
 }));
 $('animOpenGif').addEventListener('click',wrap(()=>{
  if(!resultURL||!lastGif)throw Error('Create a GIF first.');
  // A separate tap preserves browser gesture for a real GIF preview, useful
  // for iPhone users saving via the browser image/file actions.
  const a=document.createElement('a');a.href=resultURL;a.target='_blank';a.rel='noopener';a.click();
 }));
 $('animDevice').textContent=mobileFileSupport().share?'Share / Save available on this device · GIF keeps its original .gif format':'Download and extracted PNG frames available · GIF keeps its original .gif format';
 window.addEventListener('pagehide',()=>{cleanup();if(resultURL)URL.revokeObjectURL(resultURL)},{once:true});
}
