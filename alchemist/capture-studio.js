// PROXIMUS | ASSET ALCHEMIST — Capture & Creator Presets
// Native file-camera pickers, optional browser camera, editing and platform exports.
import {$,stem,bytes,download,blobCanvas,wrap} from './core.js';
import {saveOrShare} from './portable-kit.js';
export const CAPTURE_PRESETS={
 original:{name:'Original photo',width:0,height:0},
 discord:{name:'Discord icon',width:512,height:512},
 banner:{name:'Discord banner',width:960,height:540},
 youtube:{name:'Video thumbnail',width:1280,height:720},
 social:{name:'Social square',width:1080,height:1080},
 phone:{name:'Phone wallpaper',width:1170,height:2532},
 desktop:{name:'Desktop wallpaper',width:1920,height:1080}
};
export function captureSize(w,h,preset){
 const r=CAPTURE_PRESETS[preset]||CAPTURE_PRESETS.original;
 if(r.width)return {width:r.width,height:r.height};
 const scale=Math.min(1,4096/Math.max(w,h),Math.sqrt(8000000/(w*h)));
 return {width:Math.max(1,Math.round(w*scale)),height:Math.max(1,Math.round(h*scale))};
}
export function initCaptureStudio(app){
 const camera=$('captureCamera'),preview=$('captureImage'),canvas=$('captureCanvas');
 const status=$('captureStatus'),file=$('captureFile');
 const ctx=canvas.getContext('2d');
 let stream=null,image=null,currentName='capture',sourceURL=null;
 function cleanURL(){if(sourceURL){URL.revokeObjectURL(sourceURL);sourceURL=null;}}
 function stop(){
  if(stream){for(const track of stream.getTracks())track.stop();stream=null;}
  camera.pause();camera.srcObject=null;camera.hidden=true;
 }
 async function openFile(f){
  if(!f||!f.type.startsWith('image/'))throw Error('Select a photo or image.');
  if(f.size>45000000)throw Error('Image is too large for browser capture editing.');
  stop();cleanURL();
  const img=new Image();sourceURL=URL.createObjectURL(f);
  await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Could not load the selected photo'));img.src=sourceURL;});
  image=img;currentName=stem(f.name);preview.src=sourceURL;preview.hidden=false;
  draw();status.textContent='Loaded '+f.name+' · '+img.naturalWidth+'×'+img.naturalHeight;
 }
 file.addEventListener('change',wrap(async e=>{const f=e.target.files?.[0];if(f)await openFile(f);}));
 $('captureOpenCamera').addEventListener('click',wrap(async()=>{
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Use the Take Photo file picker for a camera photo on this device.');
  stop();cleanURL();stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:$('captureFacing').value,width:{ideal:1280}},audio:false});
  camera.srcObject=stream;camera.hidden=false;preview.hidden=true;
  await camera.play();status.textContent='Camera active · capture a frame to edit.';
 }));
 $('captureCloseCamera').addEventListener('click',()=>{stop();status.textContent='Camera closed.';});
 $('captureSnap').addEventListener('click',wrap(async()=>{
  if(!stream||camera.readyState<2)throw Error('Open the camera first or use Choose Photo.');
  const canvas=document.createElement('canvas');canvas.width=camera.videoWidth;canvas.height=camera.videoHeight;
  canvas.getContext('2d').drawImage(camera,0,0);
  const blob=await blobCanvas(canvas);
  await openFile(new File([blob],'camera-photo.png',{type:'image/png'}));
  stop();
 }));
 function draw(){
  if(!image)return;
  const w=image.naturalWidth||image.width,h=image.naturalHeight||image.height;
  const preset=$('capturePreset').value,rot=Number($('captureRotation').value)||0;
  const size=captureSize(w,h,preset);canvas.width=size.width;canvas.height=size.height;
  const cw=canvas.width,ch=canvas.height;
  ctx.fillStyle=$('captureFill').value;ctx.fillRect(0,0,cw,ch);
  const turned=Math.abs(rot%180)===90;
  const iw=turned?h:w,ih=turned?w:h;
  const scale=$('captureFit').value==='contain'?Math.min(cw/iw,ch/ih):Math.max(cw/iw,ch/ih);
  ctx.save();ctx.translate(cw/2,ch/2);ctx.rotate(rot*Math.PI/180);
  ctx.filter='brightness('+(Number($('captureBrightness').value)/100)+') contrast('+(Number($('captureContrast').value)/100)+') saturate('+(Number($('captureSaturation').value)/100)+')';
  ctx.drawImage(image,-w*scale/2,-h*scale/2,w*scale,h*scale);
  ctx.restore();
  const watermark=$('captureWatermark').value.trim();
  if(watermark){
   const font=Math.max(14,Math.min(50,Math.round(cw*.037)));
   ctx.font='bold '+font+'px system-ui';ctx.textAlign='right';ctx.lineWidth=3;ctx.strokeStyle='#000b';
   ctx.strokeText(watermark.slice(0,70),cw-20,ch-20);ctx.fillStyle='#fff';ctx.fillText(watermark.slice(0,70),cw-20,ch-20);
  }
  $('captureResolution').textContent=cw+' × '+ch+' pixels';
 }
 for(const id of ['capturePreset','captureFit','captureRotation','captureFill','captureBrightness','captureContrast','captureSaturation','captureWatermark']){
  $(id).addEventListener('input',draw);
 }
 async function exportFile(kind){
  if(!image)throw Error('Capture or import a photo first.');
  draw();
  const format=$('captureFormat').value;let blob=await blobCanvas(canvas,format,.9);
  // Some Safari versions encode WebP as PNG; prefer actual MIME if requested format is unavailable.
  if(blob.type!==format&&format==='image/webp')blob=await blobCanvas(canvas,'image/png');
  const ext=blob.type==='image/jpeg'?'jpg':blob.type==='image/webp'?'webp':'png';
  const name=currentName+'-'+$('capturePreset').value+'.'+ext;
  if(kind==='pack')app.addAsset(name,blob,'Capture Studio');
  else if(kind==='share')await saveOrShare(blob,name);
  else download(blob,name);
  status.textContent='Exported '+name+' · '+bytes(blob.size);
 }
 $('captureSave').addEventListener('click',wrap(()=>exportFile('download')));
 $('captureShare').addEventListener('click',wrap(()=>exportFile('share')));
 $('captureToPack').addEventListener('click',wrap(()=>exportFile('pack')));
 window.addEventListener('pagehide',()=>{stop();cleanURL();},{once:true});
}
