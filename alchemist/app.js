import {$,bytes,safe,stem,notice,download,makeZip,sha256,textFile,nowName,wrap} from './core.js';
import {initImage,initBatch,initIcons,initSprites,initTextures,initPalette} from './image-tools.js';
import {initAudio,initMotion,initModel} from './media-tools.js';
import {initProduction,initAudit} from './pro-tools.js';
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
 {id:'pack',icon:'▤',title:'Asset Packager',detail:'Collect outputs and download ZIP manifest'},
 {id:'production',icon:'✧',title:'Production Lab',detail:'Professional banners thumbnails branding artwork and presets'},
 {id:'audit',icon:'⌕',title:'Asset Audit',detail:'Inspect file types SHA-256 duplicate detection metadata reports'}
];
const pack=[];
const VAULT_NAME='proximus-alchemist-vault',VAULT_STORE='assets';
let vaultDatabase=null;
const vaultStatus=m=>{const el=$('vaultStatus');if(el)el.textContent=m};
function openVault(){
 if(vaultDatabase)return Promise.resolve(vaultDatabase);
 return new Promise((resolve,reject)=>{
  if(!('indexedDB' in window))return reject(Error('IndexedDB is not supported in this browser'));
  const request=indexedDB.open(VAULT_NAME,1);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains(VAULT_STORE))db.createObjectStore(VAULT_STORE,{keyPath:'name'});};
  request.onsuccess=()=>{vaultDatabase=request.result;vaultDatabase.onversionchange=()=>{vaultDatabase.close();vaultDatabase=null};resolve(vaultDatabase);};
  request.onerror=()=>reject(request.error||Error('Could not open browser storage'));
 });
}
async function vaultTx(mode,run){
 const db=await openVault();
 return await new Promise((resolve,reject)=>{
  const tx=db.transaction(VAULT_STORE,mode),store=tx.objectStore(VAULT_STORE);
  let result=null;
  try{const req=run(store);if(req){req.onsuccess=()=>{result=req.result;};}}catch(err){try{tx.abort()}catch(_){}return reject(err);}
  tx.oncomplete=()=>resolve(result);
  tx.onerror=()=>reject(tx.error||Error('Browser vault storage failed'));
  tx.onabort=()=>reject(tx.error||Error('Browser vault storage aborted'));
 });
}
async function vaultPut(asset){
 try{
  vaultStatus('Saving assets to local browser vault…');
  await vaultTx('readwrite',store=>store.put({name:asset.name,data:asset.data,studio:asset.studio,when:asset.when}));
  vaultStatus('Saved to browser vault · '+pack.length+' assets. Export a ZIP to keep a permanent backup.');
 }catch(err){vaultStatus('Local save unavailable: '+(err?.message||err)+'. Export your pack before closing.');}
}
async function vaultRemove(name){
 try{await vaultTx('readwrite',store=>store.delete(name));vaultStatus('Browser vault updated · '+pack.length+' assets')}catch(err){vaultStatus('Vault deletion failed: '+(err?.message||err));}
}
async function vaultClear(){
 try{await vaultTx('readwrite',store=>store.clear());vaultStatus('Browser vault cleared.')}catch(err){vaultStatus('Could not clear saved vault: '+(err?.message||err));}
}
async function vaultRestore(){
 try{
  const rows=await vaultTx('readonly',store=>store.getAll());
  const known=new Set(pack.map(x=>x.name));
  for(const row of rows){if(!known.has(row.name)&&row.data instanceof Blob){pack.push(row);known.add(row.name)}}
  drawPack();
  vaultStatus('Browser vault ready · '+pack.length+' saved assets. Download a ZIP backup when finished.');
 }catch(err){vaultStatus('Vault storage unavailable: '+(err?.message||err)+'. You can still work and export ZIPs.');}
}
const app={
 addAsset(name,data,studio){
  if(!(data instanceof Blob))data=new Blob([data]);
  if(data.size>200000000)throw Error('This asset is over 200 MB and cannot be held in the session pack.');
  if(pack.length>=200)throw Error('The Asset Packager limit is 200 items.');
  let filename=safe(name);const used=new Set(pack.map(x=>x.name));let n=2;
  while(used.has(filename)){const dot=filename.lastIndexOf('.');filename=(dot===-1?stem(filename):filename.slice(0,dot))+'-'+n+++(dot===-1?'':filename.slice(dot))}
  pack.push({name:filename,data,studio,when:new Date().toISOString()});
  drawPack();void vaultPut(pack[pack.length-1]);notice(filename+' added to your Asset Packager');
 }
};
function changeView(id){
 if(!names.some(n=>n.id===id))return;
 document.querySelectorAll('[data-panel]').forEach(n=>n.hidden=n.dataset.panel!==id);
 document.querySelectorAll('[data-view]').forEach(n=>n.classList.toggle('active',n.dataset.view===id));
 localStorage.setItem('nexus-alchemist-last-view',id);
 const heading=document.querySelector('[data-panel="'+id+'"] .section-heading h2');
 if(heading)document.title='PROXIMUS | '+names.find(x=>x.id===id).title+' — Asset Alchemist';
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
  btn.addEventListener('click',()=>{pack.splice(i,1);drawPack();void vaultRemove(f.name);notice('Removed '+f.name)});
  const dl=document.createElement('button');dl.textContent='↓';dl.title='Download this file';dl.addEventListener('click',()=>download(f.data,f.name));
  row.append(title,size,dl,btn);list.append(row);
 });
}
$('packExport').addEventListener('click',wrap(async()=>{
 if(!pack.length)throw Error('Your pack is empty. Add outputs from the studios first.');
 const title=safe($('packTitle').value||'PROXIMUS Asset Collection'),target=$('packTarget').value;
 const inventory=[];let size=0;const entries=[];
 notice('Building package and computing SHA-256 checksums…');
 for(const f of pack){size+=f.data.size;inventory.push({file:f.name,studio:f.studio,bytes:f.data.size,sha256:await sha256(f.data),created_at:f.when});entries.push({name:f.name,data:f.data})}
 const manifest={schema:'proximus.assetpack/2',generator:'PROXIMUS | ASSET ALCHEMIST v2.0.0',generated_at:new Date().toISOString(),title,target,file_count:pack.length,total_bytes:size,items:inventory,notice:'Files were generated locally. Check all rights and licensing before redistributing third-party inputs.'};
 entries.push({name:'manifest.json',data:textFile(manifest)});
 download(await makeZip(entries),'PROXIMUS-'+stem(title).replace(/\s+/g,'-')+'-'+nowName()+'.zip');
 notice('Asset pack exported: '+pack.length+' assets · '+bytes(size));
}));
$('packClear').addEventListener('click',()=>{if(pack.length&&!confirm('Clear all session-collected assets? This cannot be undone.'))return;pack.length=0;drawPack();void vaultClear();notice('Asset pack cleared')});
$('vaultReload').addEventListener('click',()=>{void vaultRestore()});
$('vaultInfo').addEventListener('click',wrap(async()=>{if(!navigator.storage?.estimate)throw Error('Browser storage estimates are unavailable');const q=await navigator.storage.estimate();vaultStatus('Browser vault storage: '+bytes(q.usage||0)+' used / '+bytes(q.quota||0)+' estimated allowance. Browser may evict data.');}));
$('packTitle').value=localStorage.getItem('nexus-alchemist-pack-title')||'PROXIMUS Asset Collection';
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

function setupVersion(){
 const label=$('versionInfo'),btn=$('versionCheck'),LOCAL='2.0.0';
 async function check(){
  label.textContent='Checking Proximus release channel…';
  try{
   const response=await fetch('./version.json?t='+Date.now(),{cache:'no-store'});
   if(!response.ok)throw Error('Release manifest returned '+response.status);
   const info=await response.json();
   if(!/^\d+\.\d+\.\d+$/.test(info.version))throw Error('Invalid release manifest version');
   const installed=LOCAL.split('.').map(Number),published=info.version.split('.').map(Number);
   const newer=published.some((n,i)=>n>installed[i]&&published.slice(0,i).every((m,j)=>m===installed[j]));
   label.textContent=newer?'Version '+info.version+' is available · refresh to update':'PROXIMUS v'+LOCAL+' · '+(info.channel||'stable')+' · up to date';
   if(newer){btn.textContent='Reload to update';btn.onclick=()=>location.reload();}
   else{btn.textContent='Check updates';btn.onclick=check;}
  }catch(err){label.textContent='PROXIMUS v'+LOCAL+' · offline / update check unavailable';btn.textContent='Retry check';btn.onclick=check;}
 }
 btn.addEventListener('click',check);
 void check();
}

function launch(){
 initImage(app);initBatch(app);initIcons(app);initSprites(app);initTextures(app);initPalette(app);
 initAudio(app);initMotion(app);initModel(app);initProduction(app);initAudit(app);
 drawPack();drawCommands();setupDrop();void vaultRestore();setupVersion();
 const last=localStorage.getItem('nexus-alchemist-last-view')||'image';changeView(last);
 notice('PROXIMUS Asset Alchemist v2.0 loaded. All transformations remain local to your browser.');
 if('serviceWorker' in navigator && location.protocol==='https:')navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{});
}
try{launch()}catch(e){
 console.error(e);notice('Startup error: '+(e.message||e),true);
 const fatal=document.createElement('pre');fatal.style.color='#ff9aab';fatal.style.padding='20px';fatal.textContent='PROXIMUS could not initialize: '+(e.message||e);document.querySelector('main')?.prepend(fatal);
}
