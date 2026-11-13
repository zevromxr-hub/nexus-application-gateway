import {$,bytes,safe,stem,notice,download,makeZip,sha256,textFile,nowName,wrap} from './core.js';
import {initImage,initBatch,initIcons,initSprites,initTextures,initPalette} from './image-tools.js';
import {initAudio,initMotion,initModel} from './media-tools.js';
const names=[
 {id:'image',icon:'◈',title:'Image Studio',detail:'Image resize crop filters chroma key overlays'},
 {id:'batch',icon:'▦',title:'Batch Forge',detail:'Bulk image conversion and WebP optimization'},
 {id:'icons',icon:'▣',title:'Icon Foundry',detail:'Generate application icon PNG size collections'},
 {id:'sprites',icon:'▥',title:'Sprite Atlas',detail:'Combine 2D sprites into PNG atlas and JSON'},
 {id:'textures',icon:'⌗',title:'Texture Lab',detail:'Height maps normal maps masks'},
 {id:'palette',icon:'◉',title:'Color Lab',detail:'Dominant colors palettes gradients contrast'},
 {id:'audio',icon:'♫',title:'Audio Forge',detail:'WAV trim normalize fade reverse sound'},
 {id:'motion',icon:'▷',title:'Motion Lab',detail:'Video GIF clips snapshot recording WebM'},
 {id:'model',icon:'⬡',title:'3D Inspector',detail:'GLB glTF model mesh material skin animations'},
 {id:'pack',icon:'▤',title:'Asset Packager',detail:'Collect outputs and download ZIP manifest'}
];
const pack=[];const app={
 addAsset(name,data,studio){
  if(!(data instanceof Blob))data=new Blob([data]);
  if(data.size>200000000)throw Error('This asset is over 200 MB and cannot be held in the session pack.');
  if(pack.length>=200)throw Error('The Asset Packager limit is 200 items.');
  let filename=safe(name);const used=new Set(pack.map(x=>x.name));let n=2;
  while(used.has(filename)){const dot=filename.lastIndexOf('.');filename=(dot===-1?stem(filename):filename.slice(0,dot))+'-'+n+++(dot===-1?'':filename.slice(dot))}
  pack.push({name:filename,data,studio,when:new Date().toISOString()});
  drawPack();notice(filename+' added to your Asset Packager');
 }
};
function changeView(id){
 if(!names.some(n=>n.id===id))return;
 document.querySelectorAll('[data-panel]').forEach(n=>n.hidden=n.dataset.panel!==id);
 document.querySelectorAll('[data-view]').forEach(n=>n.classList.toggle('active',n.dataset.view===id));
 localStorage.setItem('nexus-alchemist-last-view',id);
 const heading=document.querySelector('[data-panel="'+id+'"] .section-heading h2');
 if(heading)document.title='NEXUS | '+names.find(x=>x.id===id).title+' — Asset Alchemist';
 window.scrollTo({top:0,behavior:'auto'});
}
function drawPack(){
 $('packCount').textContent=String(pack.length);
 const list=$('packList');list.replaceChildren();
 $('packTotal').textContent=pack.reduce((s,f)=>s+f.data.size,0)?'('+bytes(pack.reduce((s,f)=>s+f.data.size,0))+')':'';
 if(!pack.length){list.classList.add('empty');list.textContent='Your pack is empty. Add outputs from another studio.';return}
 list.classList.remove('empty');
 pack.forEach((f,i)=>{
  const row=document.createElement('div');row.className='file-row';
  const title=document.createElement('span');title.className='name';title.title=f.name;title.textContent=f.name;
  const size=document.createElement('small');size.textContent=bytes(f.data.size);
  const btn=document.createElement('button');btn.textContent='×';btn.title='Remove file';
  btn.addEventListener('click',()=>{pack.splice(i,1);drawPack();notice('Removed '+f.name)});
  const dl=document.createElement('button');dl.textContent='↓';dl.title='Download this file';dl.addEventListener('click',()=>download(f.data,f.name));
  row.append(title,size,dl,btn);list.append(row);
 });
}
$('packExport').addEventListener('click',wrap(async()=>{
 if(!pack.length)throw Error('Your pack is empty. Add outputs from the studios first.');
 const title=safe($('packTitle').value||'NEXUS Asset Collection'),target=$('packTarget').value;
 const inventory=[];let size=0;const entries=[];
 notice('Building package and computing SHA-256 checksums…');
 for(const f of pack){size+=f.data.size;inventory.push({file:f.name,studio:f.studio,bytes:f.data.size,sha256:await sha256(f.data),created_at:f.when});entries.push({name:f.name,data:f.data})}
 const manifest={schema:'nexus.assetpack/1',generator:'NEXUS | ASSET ALCHEMIST',generated_at:new Date().toISOString(),title,target,file_count:pack.length,total_bytes:size,items:inventory,notice:'Files were generated locally. Check all rights and licensing before redistributing third-party inputs.'};
 entries.push({name:'manifest.json',data:textFile(manifest)});
 download(await makeZip(entries),'NEXUS-'+stem(title).replace(/\s+/g,'-')+'-'+nowName()+'.zip');
 notice('Asset pack exported: '+pack.length+' assets · '+bytes(size));
}));
$('packClear').addEventListener('click',()=>{if(pack.length&&!confirm('Clear all session-collected assets? This cannot be undone.'))return;pack.length=0;drawPack();notice('Asset pack cleared')});
$('packTitle').value=localStorage.getItem('nexus-alchemist-pack-title')||'NEXUS Asset Collection';
$('packTarget').value=localStorage.getItem('nexus-alchemist-pack-target')||'general';
$('packTitle').addEventListener('change',()=>localStorage.setItem('nexus-alchemist-pack-title',$('packTitle').value.slice(0,80)));
$('packTarget').addEventListener('change',()=>localStorage.setItem('nexus-alchemist-pack-target',$('packTarget').value));
document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>changeView(btn.dataset.view)));
$('packJump').addEventListener('click',()=>changeView('pack'));
const dialog=$('cmdDialog'),search=$('cmdSearch'),results=$('cmdResults');
function drawCommands(){
 const term=search.value.trim().toLowerCase();results.replaceChildren();
 const relevant=names.filter(n=>(n.title+' '+n.detail).toLowerCase().includes(term));
 for(const n of relevant){
  const btn=document.createElement('button');btn.className='cmd-item';
  const icon=document.createElement('span');icon.textContent=n.icon;
  const title=document.createElement('b');title.textContent=n.title;
  const detail=document.createElement('small');detail.textContent=n.detail;
  btn.append(icon,title,detail);btn.addEventListener('click',()=>{dialog.close();changeView(n.id)});results.append(btn);
 }
 if(!relevant.length){const p=document.createElement('p');p.textContent='No matching studio';results.append(p)}
}
function openCommand(){search.value='';drawCommands();dialog.showModal();search.focus()}
$('cmdOpen').addEventListener('click',openCommand);$('cmdClose').addEventListener('click',()=>dialog.close());
search.addEventListener('input',drawCommands);search.addEventListener('keydown',e=>{if(e.key==='Enter'){const first=results.querySelector('button');if(first){e.preventDefault();first.click()}}});
document.addEventListener('keydown',e=>{
 if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();dialog.open?dialog.close():openCommand()}
 if(e.key==='Escape'&&dialog.open)dialog.close();
});
function setupDrop(){
 const overlay=$('dropOverlay');let entering=0;
 document.addEventListener('dragenter',e=>{if(!e.dataTransfer?.types?.includes('Files'))return;entering++;overlay.hidden=false});
 document.addEventListener('dragover',e=>{if(!e.dataTransfer?.types?.includes('Files'))return;e.preventDefault();e.dataTransfer.dropEffect='copy'});
 document.addEventListener('dragleave',e=>{if(!e.dataTransfer?.types?.includes('Files'))return;entering--;if(entering<=0){entering=0;overlay.hidden=true}});
 document.addEventListener('drop',e=>{
  if(!e.dataTransfer?.files?.length)return;e.preventDefault();overlay.hidden=true;entering=0;
  const id=document.querySelector('.studio:not([hidden])')?.dataset.panel;
  const dest={image:'imgFile',batch:'batchFiles',icons:'iconFile',sprites:'spriteFiles',textures:'textureFile',palette:'colorFile',audio:'audioFile',motion:'motionFile',model:'modelFile'}[id];
  if(!dest){notice('Switch to an import studio first.');return}
  const input=$(dest);const dt=new DataTransfer();
  const multiple=input.multiple;
  for(const f of Array.from(e.dataTransfer.files).slice(0,multiple?120:1))dt.items.add(f);
  input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));
 });
}
function launch(){
 initImage(app);initBatch(app);initIcons(app);initSprites(app);initTextures(app);initPalette(app);
 initAudio(app);initMotion(app);initModel(app);
 drawPack();drawCommands();setupDrop();
 const last=localStorage.getItem('nexus-alchemist-last-view')||'image';changeView(last);
 notice('NEXUS Asset Alchemist loaded. Your files are processed locally in this browser.');
 if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
}
try{launch()}catch(e){
 console.error(e);notice('Startup error: '+(e.message||e),true);
 const fatal=document.createElement('pre');fatal.style.color='#ff9aab';fatal.style.padding='20px';fatal.textContent='NEXUS could not initialize: '+(e.message||e);document.querySelector('main')?.prepend(fatal);
}
