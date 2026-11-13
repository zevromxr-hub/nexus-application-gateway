import {$,safe,stem,bytes,number,clamp,notice,download,blobCanvas,createCanvas,fitDraw,makeZip,textFile,wrap} from './core.js';
export function initAudio(app){
 let audio=null,ctx=null,playing=null,sourceFile=null;
 const wave=$('audioCanvas');const waveCtx=wave.getContext('2d');
 function waveform(){
  const w=wave.width,h=wave.height;waveCtx.fillStyle='#090b1c';waveCtx.fillRect(0,0,w,h);
  waveCtx.strokeStyle='#342849';waveCtx.beginPath();waveCtx.moveTo(0,h/2);waveCtx.lineTo(w,h/2);waveCtx.stroke();
  if(!audio)return;
  const data=audio.getChannelData(0),step=Math.max(1,Math.floor(data.length/w));
  waveCtx.strokeStyle='#c9a5ff';waveCtx.lineWidth=1.7;waveCtx.beginPath();
  for(let x=0;x<w;x++){
   let low=1,high=-1;const start=x*step,end=Math.min(data.length,start+step);
   for(let j=start;j<end;j+=Math.max(1,Math.floor(step/100))){const v=data[j];low=Math.min(low,v);high=Math.max(high,v)}
   waveCtx.moveTo(x,(1-high)*h/2);waveCtx.lineTo(x,(1-low)*h/2);
  }waveCtx.stroke();
  const duration=audio.duration,start=clamp(Number($('audioStart').value)/duration),end=clamp(Number($('audioEnd').value)/duration);
  waveCtx.fillStyle='#ffbc7980';waveCtx.fillRect(0,0,start*w,h);waveCtx.fillRect(end*w,0,(1-end)*w,h);
 }
 $('audioFile').addEventListener('change',wrap(async e=>{
  const file=e.target.files[0];if(!file)throw Error('Choose an audio file.');
  if(file.size>150000000)throw Error('Audio file exceeds 150 MB safe import limit.');
  stop();
  ctx=ctx||new (window.AudioContext||window.webkitAudioContext)();
  audio=await ctx.decodeAudioData(await file.arrayBuffer());sourceFile=file;
  $('audioStart').value='0';$('audioEnd').value=audio.duration.toFixed(1);
  $('audioStatus').textContent=safe(file.name)+' · '+audio.duration.toFixed(1)+' sec · '+audio.sampleRate+' Hz · '+audio.numberOfChannels+' channels';
  waveform();notice('Audio decoded and ready for editing');
 }));
 $('audioStart').addEventListener('input',waveform);$('audioEnd').addEventListener('input',waveform);
 function stop(){if(playing){try{playing.stop()}catch(e){}playing.disconnect();playing=null}}
 function trim(){
  if(!audio)throw Error('Load an audio file first.');
  const sr=audio.sampleRate,from=number('audioStart',0,0,audio.duration),to=number('audioEnd',audio.duration,0,audio.duration);
  if(to<=from)throw Error('End time must be later than start time.');
  if(to-from>300)throw Error('Select a clip of 5 minutes or less to limit browser memory.');
  const a=Math.floor(from*sr),b=Math.min(audio.length,Math.floor(to*sr)),len=Math.max(1,b-a);
  const reverse=$('audioReverse').checked,normalize=$('audioNormalize').checked;
  const gain=number('audioGain',100,0,200)/100,fade=Math.min(len/2,number('audioFade',.5,0,30)*sr);
  const channels=Math.min(audio.numberOfChannels,2),out=[];
  let peak=0;
  for(let ch=0;ch<channels;ch++){
   const input=audio.getChannelData(ch),arr=new Float32Array(len);
   for(let i=0;i<len;i++){const idx=reverse?b-1-i:a+i;let sample=(input[idx]||0)*gain;
    if(fade>0)sample*=Math.min(1,i/fade,(len-1-i)/fade);
    arr[i]=sample;peak=Math.max(peak,Math.abs(sample));
   }out.push(arr);
  }
  if(normalize&&peak>0.00001)for(const arr of out)for(let i=0;i<arr.length;i++)arr[i]=clamp(arr[i]/peak*.98,-1,1);
  return{channels:out,sampleRate:sr,length:len};
 }
 function encodeWav(clip){
  const count=clip.channels.length,frames=clip.length,byteCount=frames*count*2;
  const result=new ArrayBuffer(44+byteCount),view=new DataView(result),enc=new TextEncoder();
  const ascii=(off,t)=>new Uint8Array(result,off,t.length).set(enc.encode(t));
  ascii(0,'RIFF');view.setUint32(4,36+byteCount,true);ascii(8,'WAVE');ascii(12,'fmt ');view.setUint32(16,16,true);
  view.setUint16(20,1,true);view.setUint16(22,count,true);view.setUint32(24,clip.sampleRate,true);
  view.setUint32(28,clip.sampleRate*count*2,true);view.setUint16(32,count*2,true);view.setUint16(34,16,true);
  ascii(36,'data');view.setUint32(40,byteCount,true);
  let offset=44;
  for(let i=0;i<frames;i++)for(const ch of clip.channels){const s=clamp(ch[i],-1,1);view.setInt16(offset,Math.round(s<0?s*32768:s*32767),true);offset+=2}
  return new Blob([result],{type:'audio/wav'});
 }
 $('audioPlay').addEventListener('click',wrap(async()=>{
  const clip=trim();stop();await ctx.resume();
  const buf=ctx.createBuffer(clip.channels.length,clip.length,clip.sampleRate);
  clip.channels.forEach((c,i)=>buf.copyToChannel(c,i));
  playing=ctx.createBufferSource();playing.buffer=buf;playing.connect(ctx.destination);playing.onended=()=>{playing=null};playing.start();notice('Playing trimmed audio selection');
 }));
 $('audioStop').addEventListener('click',()=>{stop();notice('Playback stopped')});
 async function output(){const clip=trim();return{name:stem(sourceFile.name)+'-alchemist.wav',data:encodeWav(clip)}}
 $('audioExport').addEventListener('click',wrap(async()=>{const a=await output();download(a.data,a.name);notice('WAV exported '+bytes(a.data.size))}));
 $('audioAdd').addEventListener('click',wrap(async()=>{const a=await output();app.addAsset(a.name,a.data,'Audio Forge')}));
 waveform();
}
export function initMotion(app){
 let file=null,mediaType=null,mediaURL=null,rendering=false,recorder=null;
 const vid=$('motionVideo'),gif=$('motionGif'),canvas=$('motionCanvas'),ctx=canvas.getContext('2d');
 function source(){return mediaType==='video'?vid:mediaType==='gif'?gif:null}
 function draw(){
  if(!source())return;
  const w=number('motionWidth',960,64,3840),h=Math.round(w*9/16);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  ctx.fillStyle='#080811';ctx.fillRect(0,0,canvas.width,canvas.height);
  const s=source();if((s.videoWidth||s.naturalWidth)>0)try{fitDraw(ctx,s,canvas.width,canvas.height,'contain')}catch(e){}
 }
 function raf(){if(!rendering)return;draw();requestAnimationFrame(raf)}
 function startRaf(){if(rendering)return;rendering=true;requestAnimationFrame(raf)}
 function metadata(){if(mediaType!=='video')return;const d=vid.duration||0;if(Number.isFinite(d)&&d>0){$('motionStart').value='0';$('motionEnd').value=Math.min(20,d).toFixed(1);$('motionStatus').textContent='Video ready · '+d.toFixed(1)+' seconds · '+vid.videoWidth+'×'+vid.videoHeight;}}
 $('motionFile').addEventListener('change',wrap(async e=>{
  file=e.target.files[0];if(!file)throw Error('Choose a video or GIF file');
  if(file.size>200000000)throw Error('Media exceeds the 200 MB browser limit.');
  vid.pause();if(mediaURL)URL.revokeObjectURL(mediaURL);
  mediaURL=URL.createObjectURL(file);mediaType=file.type==='image/gif'?'gif':file.type.startsWith('video/')?'video':null;
  if(!mediaType)throw Error('Motion Lab accepts MP4/WebM video or GIF files.');
  vid.hidden=mediaType!=='video';gif.hidden=mediaType!=='gif';
  if(mediaType==='video'){vid.src=mediaURL;vid.muted=true;vid.loop=false;vid.load();}
  else{gif.src=mediaURL;$('motionStart').value='0';$('motionEnd').value='5';$('motionStatus').textContent='GIF ready · looping animation; duration controlled by recording timer';}
  startRaf();notice(safe(file.name)+' imported into Motion Lab');
 }));
 vid.addEventListener('loadedmetadata',metadata);
 vid.addEventListener('timeupdate',()=>{if(!recorder && vid.currentTime>=number('motionEnd',5,.5,100000))vid.pause()});
 $('motionPlay').addEventListener('click',wrap(async()=>{
  if(!source())throw Error('Import a video or GIF first.');
  if(mediaType==='video'){vid.currentTime=number('motionStart',0,0,vid.duration||0);await vid.play();notice('Previewing selected clip')}
  else notice('Animated GIF is looping in preview');
  startRaf();
 }));
 $('motionSnap').addEventListener('click',wrap(async()=>{
  if(!source())throw Error('Load media first.');draw();
  download(await blobCanvas(canvas),'NEXUS-MOTION-SNAPSHOT.png');notice('Snapshot exported');
 }));
 function seek(video,time){
  return new Promise((resolve,reject)=>{
   if(Math.abs(video.currentTime-time)<.035)return resolve();
   const onSeek=()=>{cleanup();resolve()},onError=()=>{cleanup();reject(Error('Could not seek to requested start time'))};
   const cleanup=()=>{video.removeEventListener('seeked',onSeek);video.removeEventListener('error',onError)};
   video.addEventListener('seeked',onSeek,{once:true});video.addEventListener('error',onError,{once:true});
   video.currentTime=time;setTimeout(()=>{cleanup();resolve()},4000);
  });
 }
 $('motionExport').addEventListener('click',wrap(async()=>{
  if(!source())throw Error('Import a video or GIF first.');
  if(!window.MediaRecorder||!canvas.captureStream)throw Error('Your browser does not support canvas WebM recording.');
  if(recorder)throw Error('A recording is already in progress.');
  const start=number('motionStart',0,0,100000),end=number('motionEnd',5,.1,100000);
  const duration=Math.min(20,end-start);if(duration<=0)throw Error('End must be later than start.');
  if(mediaType==='video'){if(end>vid.duration+.1)throw Error('End time exceeds source video duration.');vid.pause();await seek(vid,start)}
  draw();
  const fps=number('motionFps',24,15,30),stream=canvas.captureStream(fps),mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(x=>MediaRecorder.isTypeSupported(x));
  if(!mime)throw Error('This browser cannot create WebM video.');
  const chunks=[];recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:number('motionQuality',6000000,3000000,10000000)});
  const done=new Promise((resolve,reject)=>{recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onerror=e=>reject(Error('MediaRecorder failed'));recorder.onstop=()=>{resolve(new Blob(chunks,{type:'video/webm'}))}});
  let stopped=false;
  const stop=()=>{if(stopped)return;stopped=true;if(recorder?.state!=='inactive')recorder.stop();if(mediaType==='video')vid.pause();};
  recorder.start(250);if(mediaType==='video')await vid.play();
  $('motionStatus').textContent='Recording '+duration.toFixed(1)+'s · visual-only WebM';notice('Recording started; keep this tab active.');
  const timeout=setTimeout(stop,(duration+0.05)*1000);
  const onEnded=()=>stop();vid.addEventListener('ended',onEnded,{once:true});
  try{
   const blob=await done;clearTimeout(timeout);vid.removeEventListener('ended',onEnded);
   stream.getTracks().forEach(t=>t.stop());recorder=null;
   if(blob.size<1000)throw Error('Recording output empty; browser may have throttled the tab.');
   download(blob,stem(file.name)+'-motion.webm');notice('Visual WebM exported · '+bytes(blob.size));$('motionStatus').textContent='Finished · '+bytes(blob.size);
  }catch(e){clearTimeout(timeout);stream.getTracks().forEach(t=>t.stop());recorder=null;throw e}
 }));
}
export function initModel(app){
 let report=null,fileName='';
 function analyze(gltf,file){
  const meshes=gltf.meshes||[],nodes=gltf.nodes||[],skins=gltf.skins||[],animations=gltf.animations||[],materials=gltf.materials||[];
  const targets=meshes.reduce((n,m)=>n+(m.primitives||[]).reduce((a,p)=>a+(p.targets?.length||0),0),0);
  const triangles=meshes.reduce((n,m)=>n+(m.primitives||[]).reduce((a,p)=>a+(p.mode===4||p.mode==null?1:0),0),0);
  const images=gltf.images||[],externalBuffers=(gltf.buffers||[]).filter(b=>b.uri&&!b.uri.startsWith('data:')).length;
  return{
   generator:'NEXUS Asset Alchemist / 3D Inspector',source:file.name,size_bytes:file.size,format:file.name.toLowerCase().endsWith('.glb')?'GLB':'glTF JSON',
   asset:gltf.asset||{},counts:{scenes:gltf.scenes?.length||0,nodes:nodes.length,meshes:meshes.length,primitives:meshes.reduce((n,m)=>n+(m.primitives?.length||0),0),materials:materials.length,images:images.length,textures:gltf.textures?.length||0,skins:skins.length,animations:animations.length,accessors:gltf.accessors?.length||0,morph_targets:targets},extensions_used:gltf.extensionsUsed||[],
   warnings:[...(externalBuffers?['Model references '+externalBuffers+' external buffers; import them separately to use this glTF.']:[]),...(skins.length===0?['No skeletal skinning definitions found.']:[]),...(targets===0?['No morph targets declared.']:[])],
   scenes:(gltf.scenes||[]).map(s=>({name:s.name||'',nodes:s.nodes||[]})),
   mesh_summary:meshes.map(m=>({name:m.name||'(unnamed)',primitives:(m.primitives||[]).map(p=>({mode:p.mode??4,material:p.material??null,attributes:Object.keys(p.attributes||{}),morph_targets:p.targets?.length||0}))})),
   materials:materials.map((m,i)=>({index:i,name:m.name||'(unnamed)',alphaMode:m.alphaMode||'OPAQUE',doubleSided:!!m.doubleSided,baseColor:m.pbrMetallicRoughness?.baseColorFactor||[1,1,1,1]})),
   skin_summary:skins.map(s=>({name:s.name||'',joints:s.joints?.length||0})),
   animation_clips:animations.map(a=>({name:a.name||'(unnamed)',channels:a.channels?.length||0,samplers:a.samplers?.length||0}))
  };
 }
 $('modelFile').addEventListener('change',wrap(async e=>{
  const f=e.target.files[0];if(!f)throw Error('Choose a GLB or glTF JSON.');
  if(f.size>200000000)throw Error('Model exceeds 200 MB safe import limit.');
  let json;const ext=f.name.split('.').pop().toLowerCase();
  if(ext==='glb'){
   const raw=await f.arrayBuffer(),v=new DataView(raw);if(v.byteLength<20||v.getUint32(0,true)!==0x46546c67||v.getUint32(4,true)!==2)throw Error('Invalid or unsupported GLB header (GLB 2.0 required).');
   if(v.getUint32(8,true)!==raw.byteLength)throw Error('GLB declared length differs from actual file.');
   let ptr=12,jsonRaw=null;
   while(ptr+8<=raw.byteLength){const len=v.getUint32(ptr,true),type=v.getUint32(ptr+4,true);ptr+=8;if(len>raw.byteLength-ptr)throw Error('GLB chunk length exceeds file bounds.');
    if(type===0x4e4f534a && !jsonRaw)jsonRaw=new Uint8Array(raw,ptr,len);
    ptr+=len;
   }
   if(!jsonRaw)throw Error('GLB has no JSON chunk');
   json=JSON.parse(new TextDecoder().decode(jsonRaw).replace(/\0+$/,''));
  }else if(ext==='gltf'){json=JSON.parse(await f.text())}
  else throw Error('Only .glb and .gltf files are supported');
  if(typeof json!=='object'||!json.asset?.version?.startsWith?.('2'))throw Error('A glTF 2.0 model is required.');
  report=analyze(json,f);fileName=stem(f.name);
  const count=report.counts,stats=$('modelStats');stats.replaceChildren();
  for(const [k,v] of Object.entries(count)){const d=document.createElement('div'),strong=document.createElement('strong'),label=document.createElement('span');strong.textContent=String(v);label.textContent=k.replaceAll('_',' ').toUpperCase();d.append(strong,label);stats.append(d);}
  $('modelDetails').textContent=JSON.stringify({asset:report.asset,extensions_used:report.extensions_used,warnings:report.warnings,mesh_summary:report.mesh_summary,materials:report.materials,skin_summary:report.skin_summary,animation_clips:report.animation_clips},null,2);
  notice('3D structure inspected: '+count.meshes+' meshes, '+count.animations+' clips, '+count.morph_targets+' morph targets');
 }));
 function output(){if(!report)throw Error('Inspect a model first.');return{name:fileName+'-model-report.json',data:textFile(report)}}
 $('modelReport').addEventListener('click',wrap(async()=>{const r=output();download(r.data,r.name);notice('Model report downloaded')}));
 $('modelAdd').addEventListener('click',wrap(async()=>{const r=output();app.addAsset(r.name,r.data,'3D Inspector')}));
}
