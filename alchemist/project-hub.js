// PROXIMUS | ASSET ALCHEMIST — Universal Project Hub
// Portable ZIP projects with actual file bytes; browser-local vault and cross-studio send.
import {$,safe,stem,bytes,makeZip,download,textFile,wrap} from './core.js';
import {parseStoreZip,saveOrShare} from './portable-kit.js';
const DB='proximus-sovereign-projects',STORE='projects',PREF='proximus-sovereign-shortcuts-v1';
let db=null;
export function projectManifest(name,assets,notes=''){
 const title=safe(name||'Untitled project');
 return {schema:'proximus.project/1',title,created:new Date().toISOString(),
  notes:String(notes||'').slice(0,6000),items:assets.map((a,i)=>({
   name:safe(a.name),entry:'file-'+String(i).padStart(4,'0')+'-'+safe(a.name),studio:a.studio||'Imported',
   size:a.data.size,mime:a.data.type||'application/octet-stream'}))};
}
async function openDb(){
 if(db)return db;
 return new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE,{keyPath:'id'});};
  request.onsuccess=()=>{db=request.result;resolve(db);};
  request.onerror=()=>reject(request.error||Error('Project vault unavailable.'));
 });
}
async function tx(mode,operation){
 const database=await openDb();
 return new Promise((resolve,reject)=>{
  const tr=database.transaction(STORE,mode),store=tr.objectStore(STORE);
  const req=operation(store);
  let result;
  if(req)req.onsuccess=()=>{result=req.result;};
  tr.oncomplete=()=>resolve(result);
  tr.onerror=tr.onabort=()=>reject(tr.error||Error('Project vault transaction failed.'));
 });
}
async function zipProject(name,assets,notes=''){
 const manifest=projectManifest(name,assets,notes);
 const entries=[{name:'project.json',data:textFile(manifest)}];
 for(let i=0;i<assets.length;i++)entries.push({name:manifest.items[i].entry,data:assets[i].data});
 return await makeZip(entries);
}
export function unpackProjectZip(bytes){
 const entries=parseStoreZip(bytes,{maxFiles:210,maxBytes:180000000});
 const parts=new Map(entries.map(x=>[x.name,x.data]));
 const manifestBytes=parts.get('project.json');
 if(!manifestBytes)throw Error('This ZIP does not contain a PROXIMUS project.');
 const manifest=JSON.parse(new TextDecoder().decode(manifestBytes));
 if(manifest.schema!=='proximus.project/1'||!Array.isArray(manifest.items))throw Error('Invalid PROXIMUS project file.');
 if(manifest.items.length>200)throw Error('Project contains too many assets.');
 const assets=manifest.items.map(item=>{
  if(typeof item.entry!=='string'||!/^file-\d{4}-[^/\\]+$/.test(item.entry))throw Error('Unexpected project asset path.');
  const data=parts.get(item.entry);if(!data)throw Error('Project is missing '+safe(item.name));
  if(data.byteLength!==item.size)throw Error('Project asset size mismatch.');
  return {name:safe(item.name),studio:String(item.studio||'Project Import').slice(0,90),
   data:new Blob([data],{type:item.mime||'application/octet-stream'})};
 });
 return {title:safe(manifest.title||'Project'),notes:String(manifest.notes||''),assets};
}
export function initProjectHub(app){
 const list=$('projectList'),status=$('projectStatus'),assetList=$('projectAssetList');
 const title=$('projectTitle'),notes=$('projectNotes');
 let favorites=[];try{favorites=JSON.parse(localStorage.getItem(PREF)||'[]');if(!Array.isArray(favorites))favorites=[];}catch(e){}
 function savedFavorites(){try{localStorage.setItem(PREF,JSON.stringify(favorites));}catch(e){}}
 async function refreshProjects(){
  try{
   const projects=await tx('readonly',s=>s.getAll());
   projects.sort((a,b)=>String(b.saved).localeCompare(String(a.saved)));
   list.replaceChildren();
   for(const project of projects){
    const row=document.createElement('div');row.className='sovereign-project-row';
    const details=document.createElement('span');details.textContent=project.title+' · '+project.items.length+' assets · '+bytes(project.bytes);
    const exportBtn=document.createElement('button');exportBtn.className='small-btn';exportBtn.textContent='↓ ZIP';
    exportBtn.addEventListener('click',wrap(async()=>{
     const zip=await zipProject(project.title,project.items,project.notes);
     await saveOrShare(zip,stem(project.title)+'-PROXIMUS-PROJECT.zip',{preferShare:false});
    }));
    const restore=document.createElement('button');restore.className='small-btn';restore.textContent='↗ Restore';
    restore.addEventListener('click',wrap(async()=>{
     for(const item of project.items)app.addAsset(item.name,item.data,'Project Hub');
     title.value=project.title;notes.value=project.notes;status.textContent='Restored '+project.items.length+' project assets into Packager.';
     app.changeView('pack');
    }));
    const del=document.createElement('button');del.className='small-btn';del.textContent='×';
    del.title='Delete saved project';del.addEventListener('click',wrap(async()=>{if(!confirm('Delete locally saved project '+project.title+'?'))return;await tx('readwrite',s=>s.delete(project.id));refreshProjects();}));
    row.append(details,restore,exportBtn,del);list.append(row);
   }
   if(!projects.length)list.textContent='No saved projects yet. Save an Asset Packager snapshot or import a portable project ZIP.';
   $('projectCount').textContent=projects.length+' saved projects';
  }catch(err){status.textContent='Project storage: '+err.message;}
 }
 function renderAssets(){
  const assets=app.listAssets();assetList.replaceChildren();
  $('projectAssetCount').textContent=assets.length+' current assets';
  for(const item of assets.slice(-75).reverse()){
   const row=document.createElement('div');row.className='sovereign-project-row';
   const label=document.createElement('span');label.textContent=item.name+' · '+bytes(item.data.size);
   const send=document.createElement('select');send.setAttribute('aria-label','Send '+item.name+' to studio');
   for(const [value,label] of [['','Send to…'],['image','Image Studio'],['icons','Icon Foundry'],['animation','Animation Forge'],['layers','Layer Forge'],['production','Production Lab'],['motion','Motion Lab'],['theater','Media Theater'],['capture','Capture Studio'],['automation','Automation Lab']]){
    const option=document.createElement('option');option.value=value;option.textContent=label;send.append(option);
   }
   send.addEventListener('change',wrap(async()=>{
    const destination=send.value;send.value='';if(!destination)return;
    app.sendAsset(item,destination);
   }));
   row.append(label,send);assetList.append(row);
  }
  if(!assets.length)assetList.textContent='Complete something in any studio and use Add to Pack to make it available here.';
 }
 function dashboard(){
  const shortcuts=$('projectShortcuts');shortcuts.replaceChildren();
  for(const studio of app.studios.filter(x=>!['releases','creator','projects'].includes(x.id))){
   const row=document.createElement('button');row.className='project-shortcut'+(favorites.includes(studio.id)?' pinned':'');
   row.textContent=(favorites.includes(studio.id)?'★ ':'☆ ')+studio.title;
   row.addEventListener('click',e=>{
    if(e.shiftKey||e.altKey){
     favorites=favorites.includes(studio.id)?favorites.filter(v=>v!==studio.id):[...favorites,studio.id].slice(0,10);
     savedFavorites();dashboard();return;
    }
    app.changeView(studio.id);
   });
   const pin=document.createElement('button');pin.textContent=favorites.includes(studio.id)?'Unpin':'Pin';
   pin.className='small-btn';pin.setAttribute('aria-label','Toggle favorite '+studio.title);
   pin.addEventListener('click',()=>{favorites=favorites.includes(studio.id)?favorites.filter(v=>v!==studio.id):[...favorites,studio.id].slice(0,10);savedFavorites();dashboard();});
   const group=document.createElement('div');group.className='project-shortcut-group';group.append(row,pin);shortcuts.append(group);
  }
  $('projectFavoriteCount').textContent=favorites.length+' favorites';
 }
 async function snapshot(){
  const assets=app.listAssets();
  if(!assets.length)throw Error('Add files to Asset Packager before saving a project.');
  const total=assets.reduce((s,a)=>s+a.data.size,0);
  if(total>120000000)throw Error('Project snapshots are limited to 120 MB; export a smaller pack.');
  const project={
   id:crypto.randomUUID?.()||Date.now()+'-'+Math.random(),title:safe(title.value||'My Project'),notes:notes.value.slice(0,6000),
   items:assets.map(x=>({name:x.name,studio:x.studio,data:x.data})),
   saved:new Date().toISOString(),bytes:total
  };
  await tx('readwrite',s=>s.put(project));
  status.textContent='Saved '+project.items.length+' assets locally · '+bytes(total);
  await refreshProjects();
 }
 $('projectSave').addEventListener('click',wrap(snapshot));
 $('projectExport').addEventListener('click',wrap(async()=>{
  const assets=app.listAssets();if(!assets.length)throw Error('Add assets to Packager first.');
  const zip=await zipProject(title.value||'My Project',assets,notes.value);
  download(zip,stem(title.value||'My Project')+'-PROXIMUS-PROJECT.zip');
  status.textContent='Portable project ZIP created · '+assets.length+' assets';
 }));
 $('projectImport').addEventListener('change',wrap(async e=>{
  const file=e.target.files?.[0];if(!file)return;
  const project=unpackProjectZip(await file.arrayBuffer());
  title.value=project.title;notes.value=project.notes;
  for(const asset of project.assets)app.addAsset(asset.name,asset.data,'Project Import');
  e.target.value='';status.textContent='Imported '+project.assets.length+' assets from '+project.title;
  renderAssets();
 }));
 $('projectRestoreVault').addEventListener('click',wrap(async()=>{await refreshProjects();renderAssets();dashboard();}));
 document.addEventListener('proximus-pack-changed',renderAssets);
 dashboard();renderAssets();void refreshProjects();
}
