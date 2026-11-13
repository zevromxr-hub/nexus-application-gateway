// PROXIMUS | ASSET ALCHEMIST v2.1.0 — Dominion Workflow creative studios
// Browser-only canvas artwork composition and silent motion graphics. No network, no external dependencies.
import {$,safe,stem,notice,download,blobCanvas,imageOf,textFile,wrap,bytes,clamp} from './core.js';

function canvasExport(canvas,name,add,app,studio,type='image/png'){
 return blobCanvas(canvas,type,.92).then(blob=>{
  if(add)app.addAsset(name,blob,studio);
  else download(blob,name);
  notice((add?'Added to Pack: ':'Exported: ')+name+' · '+bytes(blob.size));
 });
}
function picture(file){
 return imageOf(file);
}
function readDataURL(file){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onload=()=>resolve(String(reader.result));
  reader.onerror=()=>reject(Error('Could not read local image'));
  reader.readAsDataURL(file);
 });
}
function decodeDataURL(src){
 if(!/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(src)||src.length>18000000)throw Error('Project contains an unsupported or oversized image layer');
 return new Promise((resolve,reject)=>{
  const image=new Image();image.onload=()=>resolve(image);
  image.onerror=()=>reject(Error('Could not decode a project layer'));image.src=src;
 });
}
function drawCover(ctx,img,w,h){
 const f=Math.max(w/img.width,h/img.height);
 ctx.drawImage(img,(w-img.width*f)/2,(h-img.height*f)/2,img.width*f,img.height*f);
}
const SIZES={discord:[960,540],wide:[1920,480],video:[1280,720],square:[1080,1080],poster:[1080,1920],wall:[1920,1080],fourk:[3840,2160]};

export function initLayerForge(app){
 const c=$('layerCanvas');if(!c)return;
 const ctx=c.getContext('2d'),layers=[];let current=null,sequence=0,drag=null,scheduled=false;
 function selected(){return layers.find(v=>v.id===current)||null}
 function size(){
  const dimensions=SIZES[$('layerSize').value]||SIZES.video;
  c.width=dimensions[0];c.height=dimensions[1];
 }
 function repaint(){
  const w=c.width,h=c.height;
  ctx.save();ctx.clearRect(0,0,w,h);
  if(!$('layerTransparent').checked){ctx.fillStyle=$('layerBg').value;ctx.fillRect(0,0,w,h)}
  for(const layer of layers){
   ctx.save();ctx.translate(layer.x,layer.y);ctx.rotate(layer.angle*Math.PI/180);
   ctx.globalAlpha=layer.alpha;ctx.globalCompositeOperation=layer.blend;
   if(layer.kind==='image'&&layer.image){
    const dw=layer.image.width*layer.scale,dh=layer.image.height*layer.scale;
    ctx.drawImage(layer.image,-dw/2,-dh/2,dw,dh);
   }else if(layer.kind==='text'){
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='900 '+Math.round(layer.fontSize*layer.scale)+'px Segoe UI, Arial, sans-serif';
    ctx.fillStyle=layer.color;ctx.shadowColor='#02030b';ctx.shadowBlur=14;
    ctx.fillText(layer.text,0,0,c.width*1.6);
   }
   ctx.restore();
  }
  ctx.restore();
  $('layerStatus').textContent=layers.length+' layer(s) · '+w+' × '+h+' · '+(selected()?.name||'No selection');
 }
 function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;repaint()})}
 function options(){
  const layer=selected(),list=$('layerList');list.replaceChildren();
  for(let i=layers.length-1;i>=0;i--){
   const v=layers[i],button=document.createElement('button');
   button.type='button';button.className='layer-list-item'+(current===v.id?' selected':'');
   button.textContent=(v.kind==='text'?'T  ':'▧  ')+v.name;
   button.title='Select layer';button.addEventListener('click',()=>{current=v.id;options();schedule()});list.append(button);
  }
  $('layerSelected').hidden=!layer;
  for(const id of ['layerUp','layerDown','layerDelete'])$(id).disabled=!layer;
  if(!layer)return;
  $('layerX').value=Math.round(layer.x);$('layerY').value=Math.round(layer.y);
  $('layerScale').value=layer.scale;$('layerRotate').value=layer.angle;
  $('layerOpacity').value=layer.alpha;$('layerBlend').value=layer.blend;
  $('layerTextEdit').value=layer.kind==='text'?layer.text:'';
  $('layerTextEdit').disabled=layer.kind!=='text';
  $('layerFontSize').value=layer.kind==='text'?layer.fontSize:72;
  $('layerFontSize').disabled=layer.kind!=='text';
  $('layerColor').value=layer.kind==='text'?layer.color:'#ffffff';
  $('layerColor').disabled=layer.kind!=='text';
 }
 function add(layer){layers.push({...layer,id:++sequence});current=sequence;options();schedule()}
 function fromUI(){
  const layer=selected();if(!layer)return;
  layer.x=Number($('layerX').value)||0;layer.y=Number($('layerY').value)||0;
  layer.scale=clamp(Number($('layerScale').value)||1,.05,6);
  layer.angle=clamp(Number($('layerRotate').value)||0,-180,180);
  layer.alpha=clamp(Number($('layerOpacity').value),0,1);
  const blend=$('layerBlend').value;layer.blend=['source-over','multiply','screen','overlay','lighter'].includes(blend)?blend:'source-over';
  if(layer.kind==='text'){layer.text=$('layerTextEdit').value.slice(0,100);layer.fontSize=clamp(Number($('layerFontSize').value)||72,18,240);layer.color=$('layerColor').value;}
  schedule();
 }
 for(const id of ['layerX','layerY','layerScale','layerRotate','layerOpacity','layerBlend','layerTextEdit','layerFontSize','layerColor'])$(id).addEventListener('input',fromUI);
 $('layerSize').addEventListener('change',()=>{size();options();schedule()});
 for(const id of ['layerBg','layerTransparent'])$(id).addEventListener('input',schedule);
 $('layerFiles').addEventListener('change',wrap(async e=>{
  const files=Array.from(e.target.files||[]).slice(0,12);
  if(layers.length+files.length>18)throw Error('Maximum 18 layers per project');
  for(const file of files){
   if(!/^image\/(png|jpeg|webp|gif)$/.test(file.type)||file.size>12000000)throw Error('PNG/JPEG/WebP/GIF under 12 MB required: '+safe(file.name));
   const img=await picture(file),src=await readDataURL(file);
   const scale=Math.min(c.width/img.width*.7,c.height/img.height*.7,2);
   add({kind:'image',name:safe(file.name),src,image:img,x:c.width/2,y:c.height/2,scale,angle:0,alpha:1,blend:'source-over'});
  }
  e.target.value='';notice('Imported '+files.length+' image layer(s) locally');
 }));
 $('layerAddText').addEventListener('click',()=>{
  if(layers.length>=18){notice('Maximum 18 layers',true);return}
  const txt=$('layerNewText').value.trim().slice(0,100);if(!txt){notice('Enter text before adding a text layer',true);return}
  add({kind:'text',name:txt.slice(0,25),text:txt,color:'#ffffff',fontSize:72,x:c.width/2,y:c.height/2,scale:1,angle:0,alpha:1,blend:'source-over'});
 });
 $('layerUp').addEventListener('click',()=>{const i=layers.findIndex(v=>v.id===current);if(i<0||i===layers.length-1)return;[layers[i],layers[i+1]]=[layers[i+1],layers[i]];options();schedule()});
 $('layerDown').addEventListener('click',()=>{const i=layers.findIndex(v=>v.id===current);if(i<1)return;[layers[i],layers[i-1]]=[layers[i-1],layers[i]];options();schedule()});
 $('layerDelete').addEventListener('click',()=>{const i=layers.findIndex(v=>v.id===current);if(i<0)return;layers.splice(i,1);current=layers.at(-1)?.id||null;options();schedule()});
 $('layerClear').addEventListener('click',()=>{if(layers.length&&!confirm('Clear all composition layers?'))return;layers.length=0;current=null;options();schedule()});
 function coordinate(e){const r=c.getBoundingClientRect();return{x:(e.clientX-r.left)*c.width/r.width,y:(e.clientY-r.top)*c.height/r.height}}
 c.addEventListener('pointerdown',e=>{const v=selected();if(!v)return;const p=coordinate(e);drag={dx:p.x-v.x,dy:p.y-v.y,id:v.id};c.setPointerCapture(e.pointerId)});
 c.addEventListener('pointermove',e=>{if(!drag)return;const v=selected();if(!v||v.id!==drag.id)return;const p=coordinate(e);v.x=p.x-drag.dx;v.y=p.y-drag.dy;$('layerX').value=Math.round(v.x);$('layerY').value=Math.round(v.y);schedule()});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])c.addEventListener(event,()=>drag=null);
 async function output(addToPack){
  repaint();const mime=$('layerFormat').value==='image/webp'?'image/webp':'image/png';
  const file='PROXIMUS-Layer-Composition-'+Date.now()+(mime==='image/webp'?'.webp':'.png');
  await canvasExport(c,file,addToPack,app,'Layer Forge',mime);
 }
 $('layerExport').addEventListener('click',wrap(()=>output(false)));
 $('layerAdd').addEventListener('click',wrap(()=>output(true)));
 $('layerSave').addEventListener('click',wrap(async()=>{
  const project={schema:'proximus.layer.project/1',size:$('layerSize').value,bg:$('layerBg').value,transparent:$('layerTransparent').checked,
   layers:layers.map(({image,id,...rest})=>rest)};
  const json=JSON.stringify(project);
  if(json.length>48000000)throw Error('Portable project exceeds 48 MB; reduce image sizes');
  download(textFile(json),'PROXIMUS-Layer-Project-'+Date.now()+'.json');
  notice('Portable layered project saved with image pixels embedded');
 }));
 $('layerLoad').addEventListener('change',wrap(async e=>{
  const file=e.target.files[0];if(!file)return;
  if(file.size>48000000)throw Error('Project JSON exceeds 48 MB');
  const project=JSON.parse(await file.text());
  if(project.schema!=='proximus.layer.project/1'||!Array.isArray(project.layers)||project.layers.length>18||!SIZES[project.size])throw Error('Invalid Layer Forge project');
  const restored=[];
  for(const raw of project.layers){
   if(raw.kind!=='image'&&raw.kind!=='text')throw Error('Invalid project layer type');
   const layer={kind:raw.kind,name:safe(raw.name),x:clamp(Number(raw.x)||0,-10000,10000),y:clamp(Number(raw.y)||0,-10000,10000),
    scale:clamp(Number(raw.scale)||1,.05,6),angle:clamp(Number(raw.angle)||0,-180,180),alpha:clamp(Number(raw.alpha),0,1),
    blend:['source-over','multiply','screen','overlay','lighter'].includes(raw.blend)?raw.blend:'source-over'};
   if(layer.kind==='image'){layer.src=String(raw.src||'');layer.image=await decodeDataURL(layer.src);}
   else{layer.text=String(raw.text||'').slice(0,100);layer.name=layer.text.slice(0,25);layer.fontSize=clamp(Number(raw.fontSize)||72,18,240);layer.color=/^#[0-9a-f]{6}$/i.test(raw.color)?raw.color:'#ffffff';}
   restored.push(layer);
  }
  layers.length=0;sequence=0;for(const layer of restored)layers.push({...layer,id:++sequence});
  $('layerSize').value=project.size;$('layerBg').value=/^#[0-9a-f]{6}$/i.test(project.bg)?project.bg:'#0c091b';
  $('layerTransparent').checked=!!project.transparent;
  size();current=layers.at(-1)?.id||null;options();schedule();e.target.value='';notice('Restored '+layers.length+' layered project items');
 }));
 size();options();schedule();
}

function deterministic(n){const x=Math.sin(n*127.1+78.233)*43758.5453;return x-Math.floor(x)}
export function initMotionGraphics(app){
 const c=$('graphicsCanvas');if(!c)return;const ctx=c.getContext('2d');
 let backdrop=null,playing=false,recording=false,raf=0,start=0,recorder=null,recordStream=null;
 const active=()=>!document.querySelector('[data-panel="motiongraphics"]')?.hidden;
 function palette(){
  return ({violet:['#14092c','#6c39d2','#c39bff'],cyan:['#061b31','#137c9b','#7cefff'],gold:['#1c100a','#95622d','#ffcc79'],crimson:['#210617','#b52a5b','#ff91c8'],emerald:['#081e1d','#177a66','#8cf9ce']})[$('graphicsTheme').value]||['#14092c','#6c39d2','#c39bff'];
 }
 function draw(seconds=0){
  const w=c.width,h=c.height,colors=palette(),intensity=clamp(Number($('graphicsEnergy').value)||60,5,100)/100;
  const pulse=(Math.sin(seconds*5)+1)/2,ctx2=ctx;
  const g=ctx2.createRadialGradient(w*.5,h*.48,10,w*.5,h*.5,w*.9);
  g.addColorStop(0,colors[1]);g.addColorStop(.42,colors[0]);g.addColorStop(1,'#03040c');
  ctx2.fillStyle=g;ctx2.fillRect(0,0,w,h);
  if(backdrop){ctx2.save();ctx2.globalAlpha=.43;drawCover(ctx2,backdrop,w,h);ctx2.restore();}
  ctx2.save();ctx2.globalCompositeOperation='screen';
  const travel=Number($('graphicsSpeed').value)||1;
  for(let i=0;i<145;i++){
   const a=deterministic(i+11)*Math.PI*2,base=.08+deterministic(i+401)*.75;
   const radius=(base+seconds*(.015+.035*travel)*(.4+deterministic(i+404)) )%1;
   const x=w/2+Math.cos(a)*radius*w*.73,y=h/2+Math.sin(a)*radius*h*.8;
   const r=1+deterministic(i+808)*4*intensity;
   ctx2.beginPath();ctx2.arc(x,y,r,0,Math.PI*2);
   ctx2.fillStyle=i%4===0?colors[2]:colors[1];ctx2.globalAlpha=.22+.6*deterministic(i+802);ctx2.fill();
  }
  ctx2.globalAlpha=.42+intensity*.2;ctx2.translate(w/2,h*.5);ctx2.rotate(seconds*.08*travel);
  for(let ring=0;ring<4;ring++){
   ctx2.beginPath();ctx2.arc(0,0,100+ring*38+pulse*intensity*32,ring*.3+seconds*.07,Math.PI*1.55+ring*.18+seconds*.07);
   ctx2.strokeStyle=colors[ring%3];ctx2.lineWidth=3+intensity*3;ctx2.shadowColor=colors[2];ctx2.shadowBlur=28;ctx2.stroke();
  }
  ctx2.restore();
  const title=$('graphicsTitle').value.trim().slice(0,60)||'PROXIMUS';
  const subtitle=$('graphicsSubtitle').value.trim().slice(0,110);
  ctx2.save();ctx2.textAlign='center';ctx2.textBaseline='middle';
  ctx2.shadowColor=colors[1];ctx2.shadowBlur=25+22*pulse*intensity;
  ctx2.fillStyle='#ffffff';ctx2.font='900 80px Segoe UI, Arial, sans-serif';ctx2.fillText(title,w/2,h*.48,w*.88);
  ctx2.shadowBlur=0;ctx2.fillStyle=colors[2];ctx2.font='700 20px Segoe UI, Arial, sans-serif';ctx2.fillText(subtitle,w/2,h*.61,w*.86);
  ctx2.textAlign='right';ctx2.fillStyle='#d8cbe4';ctx2.font='600 15px Segoe UI, Arial, sans-serif';ctx2.fillText('POWERED BY ZEVRO | PROXIMUS',w-25,h-28);ctx2.restore();
 }
 function frame(now){
  if(!playing&&!recording){raf=0;return}
  const seconds=(now-start)/1000;
  if(active()||recording)draw(seconds);
  raf=requestAnimationFrame(frame);
 }
 function startPreview(){
  if(playing)return;playing=true;start=performance.now();raf=requestAnimationFrame(frame);
  $('graphicsPreview').textContent='Pause preview';$('graphicsStatus').textContent='Live preview running · rendered locally';
 }
 function stopPreview(){
  playing=false;if(!recording&&raf){cancelAnimationFrame(raf);raf=0}
  $('graphicsPreview').textContent='Play preview';
  if(!recording){draw(0);$('graphicsStatus').textContent='Ready for WebM export'}
 }
 $('graphicsPreview').addEventListener('click',()=>{if(playing)stopPreview();else startPreview()});
 for(const id of ['graphicsTitle','graphicsSubtitle','graphicsTheme','graphicsEnergy','graphicsSpeed'])$(id).addEventListener('input',()=>{if(!playing&&!recording)draw(0)});
 $('graphicsBackdrop').addEventListener('change',wrap(async e=>{
  const f=e.target.files[0];if(!f)return;backdrop=await imageOf(f);draw(0);notice('Motion backdrop loaded locally');
 }));
 $('graphicsClearBackdrop').addEventListener('click',()=>{backdrop=null;$('graphicsBackdrop').value='';draw(0)});
 $('graphicsStill').addEventListener('click',wrap(()=>canvasExport(c,'PROXIMUS-Motion-Keyframe-'+Date.now()+'.png',false,app,'Motion Graphics')));
 async function record(addToPack){
  if(recording)throw Error('A recording is already in progress');
  if(!c.captureStream||!window.MediaRecorder)throw Error('Your browser does not support canvas WebM recording. Use a Chromium browser.');
  const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm'].find(t=>MediaRecorder.isTypeSupported(t));
  if(!mime)throw Error('WebM recording is not supported by this browser');
  stopPreview();recording=true;const duration=clamp(Number($('graphicsDuration').value)||5,2,8);
  const chunks=[];let done;
  const completed=new Promise((resolve,reject)=>done={resolve,reject});
  try{
   draw(0);recordStream=c.captureStream(24);
   recorder=new MediaRecorder(recordStream,{mimeType:mime,videoBitsPerSecond:5000000});
   recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
   recorder.onerror=e=>done.reject(e.error||Error('WebM encoder failed'));
   recorder.onstop=()=>done.resolve(new Blob(chunks,{type:'video/webm'}));
   recorder.start(250);
   start=performance.now();raf=requestAnimationFrame(frame);
   $('graphicsStatus').textContent='Recording '+duration+' seconds of silent WebM at 1280×720…';
   await new Promise(resolve=>setTimeout(resolve,duration*1000));
   recorder.stop();
   const blob=await completed;
   if(!blob.size)throw Error('The browser returned an empty WebM recording');
   const filename='PROXIMUS-Motion-Graphics-'+Date.now()+'.webm';
   if(addToPack)app.addAsset(filename,blob,'Motion Graphics');
   else download(blob,filename);
   $('graphicsStatus').textContent='WebM complete · '+bytes(blob.size)+' · '+duration+' sec';
   notice('Silent animation '+(addToPack?'added to Pack':'downloaded')+' successfully');
  }finally{
   recording=false;if(raf){cancelAnimationFrame(raf);raf=0}
   recordStream?.getTracks().forEach(track=>track.stop());recordStream=null;recorder=null;
   draw(0);
  }
 }
 $('graphicsRecord').addEventListener('click',wrap(()=>record(false)));
 $('graphicsAdd').addEventListener('click',wrap(()=>record(true)));
 c.width=1280;c.height=720;draw(0);
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing)stopPreview()});
}
