// PROXIMUS | ASSET ALCHEMIST v2.2 — Animation Forge
// Real local video/GIF frame sampling + GIF89a encoding; browser-dependent decoders clearly guarded.
import {$,safe,stem,bytes,notice,download,makeZip,textFile,blobCanvas,wrap} from './core.js';
import {encodeGif} from './gif-codec.js';
const MAX_BYTES=250000000,MAX_FRAMES=96,MAX_GIF_FRAMES=1200;
const ICON_SIZES=[32,64,128,256];
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const delay=()=>new Promise(resolve=>setTimeout(resolve,0));
function sourceType(file){
 const name=String(file?.name||'').toLowerCase();
 if(file?.type==='image/gif'||name.endsWith('.gif'))return 'gif';
 if(['video/mp4','video/webm'].includes(file?.type)||/\.(?:mp4|webm)$/.test(name))return 'video';
 throw Error('Use a local GIF, MP4 or WebM. Other formats require a browser-supported decoder.');
}
function dims(w,h,size,asIcon=false){
 let aspect=h/w;
 if(!Number.isFinite(aspect)||aspect<=0)throw Error('Invalid media dimensions.');
 const maxSide=asIcon?256:512,maxPixels=asIcon?65536:200000;
 const outW=Math.max(1,Math.floor(Math.min(size,maxSide,maxSide/aspect,Math.sqrt(maxPixels/aspect))));
 const outH=Math.max(1,Math.round(outW*aspect));
 return {width:outW,height:outH};
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
 if(typeof ImageDecoder==='undefined')throw Error('Animated GIF frame decoding needs Chromium ImageDecoder. Try current Chrome, Edge, or Opera.');
 if(!await ImageDecoder.isTypeSupported('image/gif'))throw Error('This browser does not support animated GIF frame extraction.');
 const decoder=new ImageDecoder({data:new Uint8Array(await file.arrayBuffer()),type:'image/gif',preferAnimation:true});
 try{
  await decoder.tracks.ready;
  const track=decoder.tracks.selectedTrack;
  if(!track||track.frameCount<1||track.frameCount>MAX_GIF_FRAMES)throw Error('GIF must contain 1–1200 frames for local conversion.');
  const width=decoder.tracks.selectedTrack?.frameWidth||0,height=decoder.tracks.selectedTrack?.frameHeight||0;
  // Intrinsic dimensions are reported by first decoded VideoFrame when track metadata omits them.
  const first=(await decoder.decode({frameIndex:0})).image;
  const w=width||first.displayWidth,h=height||first.displayHeight;first.close();
  return {kind:'gif',decoder,count:track.frameCount,width:w,height:h,close(){decoder.close()}};
 }catch(err){decoder.close();throw err;}
}
async function openSource(file){
 if(!file)throw Error('Select a local MP4, WebM or GIF.');
 if(file.size<1||file.size>MAX_BYTES)throw Error('Source must be between 1 byte and 250 MB.');
 const type=sourceType(file);
 return type==='gif'?gifSource(file):videoSource(file);
}
async function seek(video,time){
 time=clamp(time,0,Math.max(0,video.duration-.035));
 if(Math.abs(video.currentTime-time)<.005&&video.readyState>=2)return;
 await new Promise((resolve,reject)=>{
  const timer=setTimeout(()=>{done();reject(Error('Video seeking timed out. The source codec may not support frame extraction.'))},7500);
  const done=()=>{clearTimeout(timer);video.removeEventListener('seeked',onSeek);video.removeEventListener('error',onError)};
  const onSeek=()=>{done();resolve()},onError=()=>{done();reject(Error('Could not extract the selected video frame'))};
  video.addEventListener('seeked',onSeek,{once:true});video.addEventListener('error',onError,{once:true});
  try{video.currentTime=time;}catch(err){done();reject(err)}
 });
}
async function sampleFrames(source,{start,end,fps,width,height,mode='contain',bg='#111020',transparent=false,progress=()=>{},isCancelled=()=>false}){
 if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||start<0)throw Error('End time must be greater than start time.');
 if(end-start>8.01)throw Error('Maximum GIF clip length is 8 seconds.');
 fps=Math.floor(fps);
 if(![6,8,12].includes(fps))throw Error('FPS must be 6, 8 or 12.');
 const count=Math.ceil((end-start)*fps);
 if(count>MAX_FRAMES)throw Error('GIF export limit is 96 frames. Reduce duration or FPS.');
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true}),frames=[];
 const durationMs=Math.round(1000/fps);
 if(source.kind==='video'){
  source.video.pause();
  if(start>=source.duration)throw Error('Start time exceeds the video duration.');
  const realEnd=Math.min(end,source.duration);
  for(let k=0;k<count;k++){
   if(isCancelled())throw Error('Conversion cancelled.');
   const time=start+k/fps;if(time>=realEnd-.0001)break;
   await seek(source.video,time);
   frames.push({...drawFrame(ctx,source.video,width,height,mode,bg,transparent),delayMs:durationMs});
   if(k%2===0){progress('Extracting video frame '+(k+1)+' of '+count);await delay();}
  }
 }else{
  const decoder=source.decoder;
  let index=0,at=0,next=0,current=null;
  try{
   for(let k=0;k<count;k++){
    if(isCancelled())throw Error('Conversion cancelled.');
    const time=start+k/fps;
    while((!current||time>=next-1e-6)&&index<source.count){
     if(current)current.close();
     const result=await decoder.decode({frameIndex:index++});
     current=result.image;
     at=next;
     next=at+clamp((Number(current.duration)||100000)/1000000,.02,10);
    }
    if(!current||time>=next)break;
    frames.push({...drawFrame(ctx,current,width,height,mode,bg,transparent),delayMs:durationMs});
    if(k%2===0){progress('Sampling GIF frame '+(k+1)+' of '+count);await delay();}
   }
  }finally{current?.close();}
 }
 if(!frames.length)throw Error('No frames decoded. Adjust the trim range or try another file.');
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
    resized.push({...image,delayMs:frames[i].delayMs});
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
 let file=null,url=null,resultURL=null,busy=false,cancel=false;
 const say=t=>{progress.textContent=t};
 const quality=()=>({
  fps:Number($('animFPS').value),
  start:Number($('animStart').value),
  end:Number($('animEnd').value),
  transparent:$('animTransparent').checked,
  dither:$('animDither').checked,
  mode:$('animFit').value,
  bg:$('animBg').value
 });
 function cleanup(){video.pause();video.removeAttribute('src');video.load();gif.removeAttribute('src');if(url)URL.revokeObjectURL(url);url=null}
 fileEl.addEventListener('change',wrap(async e=>{
  const f=e.target.files[0];if(!f)return;
  if(busy)throw Error('Finish or cancel the current export first');
  const type=sourceType(f);if(f.size>MAX_BYTES)throw Error('Media exceeds 250 MB.');
  cleanup();file=f;url=URL.createObjectURL(file);
  video.hidden=type!=='video';gif.hidden=type!=='gif';
  if(type==='video'){
   video.src=url;video.load();
   video.onloadedmetadata=()=>{
    if(file!==f)return;
    $('animStart').value=0;
    $('animEnd').value=Math.min(6,video.duration).toFixed(1);
    status.textContent='Video · '+video.videoWidth+'×'+video.videoHeight+' · '+video.duration.toFixed(1)+' sec';
   };
   video.onerror=()=>status.textContent='Video codec unsupported in this browser. Try H.264 MP4 or WebM.';
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
  const controls=['animConvert','animToPack','animIcons','animFrame'];for(const id of controls)$(id).disabled=true;
  let src=null;
  try{
   src=await openSource(file);
   const opts=quality();
   let width,height;
   if(kind==='icons'){width=256;height=256;}else{
    ({width,height}=dims(src.width,src.height,Number($('animWidth').value)));
   }
   if(kind==='frame'){
    opts.end=opts.start+1/opts.fps;
   }
   const frames=await sampleFrames(src,{...opts,width,height,progress:say,isCancelled:()=>cancel,
    mode:kind==='icons'?'cover':opts.mode});
   if(cancel)throw Error('Conversion cancelled.');
   const base=stem(file.name);
   if(kind==='icons'){
    const sizes=[...document.querySelectorAll('.animIconSize:checked')].map(el=>Number(el.value));
    if(!sizes.length)throw Error('Select at least one animated icon size.');
    const blob=await exportAnimatedIcons(frames,256,256,sizes,{...opts,progress:say});
    download(blob,base+'-ANIMATED-ICON-PACK.zip');
    status.textContent='GIF icon ZIP completed · '+frames.length+' frames · '+bytes(blob.size);
    notice('Animated GIF icon pack downloaded');
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
    status.textContent='GIF complete · '+frames.length+' frames · '+width+'×'+height+' · '+bytes(blob.size);
    say('Completed with true animated GIF89a encoding. Preview below.');
   }
  }finally{
   src?.close();busy=false;
   for(const id of controls)$(id).disabled=false;
  }
 }
 $('animConvert').addEventListener('click',wrap(()=>run('gif')));
 $('animToPack').addEventListener('click',wrap(()=>run('pack')));
 $('animIcons').addEventListener('click',wrap(()=>run('icons')));
 $('animFrame').addEventListener('click',wrap(()=>run('frame')));
 window.addEventListener('pagehide',()=>{cleanup();if(resultURL)URL.revokeObjectURL(resultURL)},{once:true});
}
