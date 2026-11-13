// PROXIMUS | ASSET ALCHEMIST v2.6 — user-controlled batch workflow engine.
// Real canvas transforms, same-input multi-output pipeline, presets and reusable recipes.
import {$,safe,stem,bytes,download,blobCanvas,makeZip,wrap,textFile} from './core.js';
const KEY='proximus-automations-v1';
export const CREATOR_PRESETS={
 discord:{name:'Discord branding',width:512,height:512,fit:'cover',format:'image/png',icons:true},
 youtube:{name:'Video thumbnail',width:1280,height:720,fit:'cover',format:'image/jpeg',icons:false},
 phone:{name:'Phone wallpaper',width:1170,height:2532,fit:'cover',format:'image/jpeg',icons:false},
 desktop:{name:'Desktop wallpaper',width:1920,height:1080,fit:'cover',format:'image/jpeg',icons:false},
 square:{name:'Social square',width:1080,height:1080,fit:'cover',format:'image/png',icons:false},
 icon:{name:'App icons',width:512,height:512,fit:'cover',format:'image/png',icons:true}
};
export function normalizeRecipe(recipe){
 const width=Math.floor(Number(recipe?.width)),height=Math.floor(Number(recipe?.height));
 if(width<16||height<16||width>4096||height>4096||width*height>8000000)throw Error('Workflow dimensions must be within 16–4096px and 8 megapixels.');
 const format=['image/png','image/jpeg','image/webp'].includes(recipe?.format)?recipe.format:'image/png';
 return {name:String(recipe?.name||'Custom workflow').slice(0,60),
  width,height,fit:recipe?.fit==='contain'?'contain':'cover',format,
  grayscale:!!recipe?.grayscale,watermark:String(recipe?.watermark||'').slice(0,70),
  icons:!!recipe?.icons};
}
function fit(ctx,image,w,h,mode){
 const iw=image.naturalWidth||image.videoWidth||image.width,ih=image.naturalHeight||image.videoHeight||image.height;
 const scale=mode==='cover'?Math.max(w/iw,h/ih):Math.min(w/iw,h/ih);
 const dx=(w-iw*scale)/2,dy=(h-ih*scale)/2;
 ctx.drawImage(image,dx,dy,iw*scale,ih*scale);
}
export async function renderRecipe(image,recipe){
 const r=normalizeRecipe(recipe),canvas=document.createElement('canvas');
 canvas.width=r.width;canvas.height=r.height;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#111020';ctx.fillRect(0,0,r.width,r.height);
 ctx.filter=r.grayscale?'grayscale(1)':'none';fit(ctx,image,r.width,r.height,r.fit);ctx.filter='none';
 if(r.watermark){
  const size=Math.max(12,Math.min(48,Math.round(r.width*.038)));
  ctx.font='bold '+size+'px system-ui';ctx.textAlign='right';
  const margin=Math.round(r.width*.025),x=r.width-margin,y=r.height-margin;
  ctx.lineWidth=Math.max(2,size*.16);ctx.strokeStyle='#000b';ctx.strokeText(r.watermark,x,y);
  ctx.fillStyle='#fff';ctx.fillText(r.watermark,x,y);
 }
 return {canvas,...r,blob:await blobCanvas(canvas,r.format,r.format==='image/jpeg'?.88:.92)};
}
export function initAutomationLab(app){
 const status=$('automationStatus'),file=$('automationFiles'),preset=$('automationPreset');
 let files=[],cancelled=false,busy=false;
 const readRecipe=()=>normalizeRecipe({
  name:$('automationName').value,width:$('automationWidth').value,height:$('automationHeight').value,
  fit:$('automationFit').value,format:$('automationFormat').value,grayscale:$('automationGray').checked,
  icons:$('automationIcons').checked,watermark:$('automationWatermark').value
 });
 function setRecipe(r){
  $('automationName').value=r.name||'Custom workflow';
  $('automationWidth').value=r.width;$('automationHeight').value=r.height;
  $('automationFit').value=r.fit||'cover';$('automationFormat').value=r.format||'image/png';
  $('automationGray').checked=!!r.grayscale;$('automationIcons').checked=!!r.icons;
  $('automationWatermark').value=r.watermark||'';
 }
 function fillSaved(){
  const list=$('automationSaved');list.replaceChildren();
  let saved=[];try{saved=JSON.parse(localStorage.getItem(KEY)||'[]');if(!Array.isArray(saved))saved=[];}catch(e){}
  for(const recipe of saved.slice(0,15)){
   const row=document.createElement('div');row.className='sovereign-project-row';
   const load=document.createElement('button');load.className='small-btn';load.textContent=recipe.name+' · '+recipe.width+'×'+recipe.height;
   load.addEventListener('click',()=>setRecipe(recipe));
   const remove=document.createElement('button');remove.className='small-btn';remove.textContent='×';
   remove.title='Remove saved workflow';
   remove.addEventListener('click',()=>{saved=saved.filter(x=>x.name!==recipe.name);localStorage.setItem(KEY,JSON.stringify(saved));fillSaved();});
   row.append(load,remove);list.append(row);
  }
  if(!saved.length)list.textContent='Save a reusable workflow recipe to see it here.';
 }
 function previewList(){
  $('automationSelection').textContent=files.length+' selected image'+(files.length===1?'':'s');
  const list=$('automationFileList');list.replaceChildren();
  for(const f of files.slice(0,16)){const row=document.createElement('p');row.className='hint';row.textContent=safe(f.name)+' · '+bytes(f.size);list.append(row);}
 }
 file.addEventListener('change',e=>{
  files=Array.from(e.target.files||[]).filter(f=>f.type.startsWith('image/')&&!/gif/i.test(f.type||f.name)).slice(0,30);
  previewList();
 });
 preset.addEventListener('change',()=>{
  const r=CREATOR_PRESETS[preset.value];if(r)setRecipe({...r,name:r.name});
 });
 $('automationSave').addEventListener('click',wrap(()=>{
  const recipe=readRecipe(),current=JSON.parse(localStorage.getItem(KEY)||'[]');
  const saved=(Array.isArray(current)?current:[]).filter(x=>x.name!==recipe.name);
  saved.unshift(recipe);localStorage.setItem(KEY,JSON.stringify(saved.slice(0,15)));fillSaved();
  status.textContent='Saved reusable workflow '+recipe.name;
 }));
 $('automationStop').addEventListener('click',()=>{cancelled=true;status.textContent='Cancellation requested…';});
 async function run(kind){
  if(busy)throw Error('An automation is already running.');
  if(!files.length)throw Error('Choose one or more photos before running the workflow.');
  const recipe=readRecipe();
  busy=true;cancelled=false;
  $('automationRun').disabled=true;$('automationPack').disabled=true;
  const entries=[],total=files.length;let done=0;
  try{
   for(const source of files){
    if(cancelled)break;
    if(source.size>30000000)throw Error('Choose images under 30 MB each for local conversion.');
    const url=URL.createObjectURL(source),image=new Image();
    try{
     await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Could not open '+safe(source.name)));image.src=url;});
     const made=await renderRecipe(image,recipe);
     const ext=recipe.format==='image/jpeg'?'jpg':recipe.format==='image/webp'?'webp':'png';
     const name=stem(source.name)+'-'+recipe.width+'x'+recipe.height+'.'+ext;
     entries.push({name,data:made.blob});
     if(recipe.icons){
      for(const size of [64,128,256]){
       const small=document.createElement('canvas');small.width=small.height=size;
       small.getContext('2d').drawImage(made.canvas,0,0,size,size);
       entries.push({name:stem(source.name)+'-icon-'+size+'.png',data:await blobCanvas(small)});
      }
     }
    }finally{URL.revokeObjectURL(url);}
    done++;status.textContent='Processed '+done+' / '+total+' images · '+entries.length+' outputs';
    await new Promise(resolve=>setTimeout(resolve,0));
   }
   if(!entries.length)throw Error('Workflow created no outputs.');
   if(kind==='pack'){
    for(const entry of entries)app.addAsset(entry.name,entry.data,'Automation Lab');
    status.textContent=entries.length+' outputs sent to Asset Packager';
   }else{
    entries.push({name:'workflow.json',data:textFile(recipe)});
    download(await makeZip(entries),'PROXIMUS-AUTOMATION-'+stem(recipe.name)+'.zip');
    status.textContent=entries.length-1+' media outputs exported to ZIP';
   }
  }finally{busy=false;$('automationRun').disabled=false;$('automationPack').disabled=false;}
 }
 $('automationRun').addEventListener('click',wrap(()=>run('zip')));
 $('automationPack').addEventListener('click',wrap(()=>run('pack')));
 setRecipe({...CREATOR_PRESETS.discord,name:'Discord branding'});
 fillSaved();previewList();
}
