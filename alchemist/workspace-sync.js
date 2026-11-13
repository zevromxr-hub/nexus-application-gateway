// PROXIMUS | ASSET ALCHEMIST — Cross-device Sync Bridge
// Portable opt-in backup of non-sensitive local work. Intentionally never reads
// the Token Foundry database, cookies, browser credentials or external app data.
// No server upload, no claim of automatic cloud sync.
import {$,bytes,makeZip,textFile,wrap} from './core.js';
import {parseStoreZip,saveOrShare} from './portable-kit.js';
import {importMediaRecords} from './media-publisher.js';

export const SYNC_SCHEMA='proximus.workspace-sync/1';
export const SYNC_DATABASES=[
 {name:'proximus-sovereign-projects',store:'projects',keyPath:'id',group:'projects'},
 {name:'proximus-alchemist-personal-media',store:'media',keyPath:'slot',group:'media'},
 {name:'proximus-alchemist-vault',store:'assets',keyPath:'name',group:'pack'},
 {name:'proximus-reactor-media-v1',store:'media',keyPath:null,group:'media'}
];
export const SYNC_SETTINGS=[
 'nexus-alchemist-last-view','nexus-alchemist-pack-title','nexus-alchemist-pack-target',
 'proximus-sovereign-shortcuts-v1','proximus-automations-v1','proximus-alchemist-workflow-v1',
 'proximus-alchemist-arcade-scores-v1','proximus-alchemist-arcade-profile-v2',
 'proximus-theater-favorites-v2','proximus-reactor-settings-v1','proximus-command-layout-v1',
 'proximus-command-pins-v1','proximus-command-name-v1','proximus-recovery-checkpoints-v1','proximus-visual-identity-v1'
];
const MAX_RECORDS=180,MAX_BYTES=110000000,MAX_FILE=150000000;
const inSpecs=(name,store)=>SYNC_DATABASES.find(x=>x.name===name&&x.store===store);
const isObj=v=>v&&typeof v==='object'&&!Array.isArray(v);
function walkEncoded(value,visit,depth=0){
 if(depth>12)throw Error('Workspace contains excessively nested data.');
 if(Array.isArray(value)){
  if(value.length>10000)throw Error('Workspace contains an oversized array.');
  for(const item of value)walkEncoded(item,visit,depth+1);return;
 }
 if(!isObj(value))return;
 if(Object.hasOwn(value,'$blob')){visit(value);return;}
 const fields=Object.entries(value);
 if(fields.length>200)throw Error('Workspace item contains too many fields.');
 for(const [key,item] of fields){
  if(['__proto__','prototype','constructor'].includes(key))throw Error('Workspace item contains an unsafe property.');
  walkEncoded(item,visit,depth+1);
 }
}
export function validateSyncManifest(m){
 if(m?.schema!==SYNC_SCHEMA||!Array.isArray(m.records)||!isObj(m.settings))throw Error('This is not a PROXIMUS Workspace Sync package.');
 if(m.records.length>MAX_RECORDS)throw Error('Workspace package contains too many records.');
 for(const entry of m.records){
  if(!inSpecs(entry.database,entry.store)||!isObj(entry.item))throw Error('Workspace backup includes an unsupported data store.');
  if(!['string','number'].includes(typeof entry.key))throw Error('Workspace backup has invalid record keys.');
  walkEncoded(entry.item,field=>{
   if(typeof field.$blob!=='string'||!/^blobs_[0-9]{4}\.bin$/.test(field.$blob))throw Error('Workspace package contains an invalid media path.');
   if(!/^[\w/+.-]{0,110}$/.test(field.mime||''))throw Error('Workspace media MIME type is invalid.');
   if(!Number.isInteger(field.size)||field.size<0||field.size>MAX_BYTES)throw Error('Workspace media size is invalid.');
  });
 }
 if(Object.keys(m.settings).some(k=>!SYNC_SETTINGS.includes(k)))throw Error('Workspace backup includes an unexpected settings key.');
 for(const value of Object.values(m.settings))if(typeof value!=='string'||value.length>200000)throw Error('Workspace backup has invalid preferences.');
 return m;
}
function dbOpen(spec){
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined')return reject(Error('IndexedDB unavailable.'));
  const request=indexedDB.open(spec.name);
  request.onupgradeneeded=()=>{
   if(!request.result.objectStoreNames.contains(spec.store))
    request.result.createObjectStore(spec.store,spec.keyPath?{keyPath:spec.keyPath}:undefined);
  };
  request.onsuccess=()=>{
   if(!request.result.objectStoreNames.contains(spec.store)){request.result.close();reject(Error('Expected workspace store missing: '+spec.name));return;}
   resolve(request.result);
  };
  request.onerror=()=>reject(request.error||Error('Workspace local database unavailable'));
 });
}
async function readStore(spec){
 const db=await dbOpen(spec);
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(spec.store,'readonly'),store=tx.objectStore(spec.store);
  const val=store.getAll(),keys=store.getAllKeys();
  let objects,identifiers;
  val.onsuccess=()=>objects=val.result;keys.onsuccess=()=>identifiers=keys.result;
  tx.oncomplete=()=>resolve((objects||[]).map((item,i)=>({key:identifiers[i],item})));
  tx.onerror=tx.onabort=()=>reject(tx.error||Error('Cannot read '+spec.name));
 });}finally{db.close();}
}
async function writeStore(spec,rows,{replace=false}={}){
 const db=await dbOpen(spec);
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction(spec.store,'readwrite'),store=tx.objectStore(spec.store);
  if(replace)store.clear();
  for(const row of rows){
   const key=spec.keyPath?undefined:row.key;
   if(key===undefined)store.put(row.item);else store.put(row.item,key);
  }
  tx.oncomplete=resolve;tx.onerror=tx.onabort=()=>reject(tx.error||Error('Cannot restore '+spec.name));
 });}finally{db.close();}
}
function cloneItem(item){
 if(!isObj(item))throw Error('Unsupported workspace record type.');
 return Object.fromEntries(Object.entries(item).map(([k,v])=>[k,v]));
}
export async function buildSyncArchive({projects=true,media=true,pack=true,settings=true}={},report=()=>{}){
 const enabled={projects,media,pack};
 const manifest={schema:SYNC_SCHEMA,version:'2.9.0',created:new Date().toISOString(),
  records:[],settings:{},included:{projects,media,pack,settings}};
 const entries=[];
 let blobs=0,total=0;
 function packValue(value,depth=0){
  if(depth>12)throw Error('Workspace contains excessively nested data.');
  if(value instanceof Blob){
   const file='blobs_'+String(++blobs).padStart(4,'0')+'.bin';
   entries.push({name:file,data:value});total+=value.size;
   if(total>MAX_BYTES||blobs>185)throw Error('Export exceeds browser-safe 110 MB / 185 media files. Uncheck a category and export separate packages.');
   return {$blob:file,mime:value.type||'application/octet-stream',size:value.size,name:typeof value.name==='string'?value.name:''};
  }
  if(Array.isArray(value)){
   if(value.length>10000)throw Error('Workspace contains an oversized array.');
   return value.map(item=>packValue(item,depth+1));
  }
  if(isObj(value)){
   const out={};
   if(Object.keys(value).length>200)throw Error('Workspace record contains too many fields.');
   for(const [key,item] of Object.entries(value)){
    if(['__proto__','prototype','constructor'].includes(key))throw Error('Workspace record contains an unsafe property.');
    out[key]=packValue(item,depth+1);
   }
   return out;
  }
  if(value===undefined)return null;
  if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number')return value;
  throw Error('Workspace record contains an unsupported data type.');
 }
 for(const spec of SYNC_DATABASES){
  if(!enabled[spec.group])continue;
  const items=await readStore(spec);
  for(const {key,item} of items){
   if(manifest.records.length>=MAX_RECORDS)throw Error('Export limit: 180 workspace records. Archive smaller groups separately.');
   const row={database:spec.name,store:spec.store,key,item:packValue(cloneItem(item))};
   manifest.records.push(row);
  }
  report('Collected '+manifest.records.length+' project/media records · '+bytes(total));
 }
 if(settings)for(const key of SYNC_SETTINGS){
  try{const v=localStorage.getItem(key);if(v!==null&&v.length<=200000)manifest.settings[key]=v;}catch(e){}
 }
 validateSyncManifest(manifest);
 entries.unshift({name:'workspace.json',data:textFile(manifest)});
 if(entries.length>230)throw Error('Package contains too many files.');
 const archive=await makeZip(entries);
 if(archive.size>MAX_FILE)throw Error('Workspace package exceeds 150 MB.');
 return {archive,manifest};
}
export function openSyncArchive(bytes){
 const files=parseStoreZip(bytes,{maxFiles:231,maxBytes:MAX_FILE}),map=new Map(files.map(x=>[x.name,x.data]));
 const json=map.get('workspace.json');
 if(!json||json.byteLength>2000000)throw Error('Workspace package has no valid manifest.');
 const manifest=validateSyncManifest(JSON.parse(new TextDecoder().decode(json)));
 let total=0;
 const seen=new Set();
 for(const r of manifest.records)walkEncoded(r.item,value=>{
  const file=map.get(value.$blob);
  if(!file||file.byteLength!==value.size)throw Error('Workspace package is missing a media file or its size changed.');
  if(seen.has(value.$blob))throw Error('Workspace package has a duplicate binary reference.');
  seen.add(value.$blob);
  total+=file.byteLength;
  if(total>MAX_BYTES)throw Error('Workspace media exceeds the safe import limit.');
 });
 return {manifest,files:map,bytes:total};
}
function rehydrate(row,files){
 const unpack=(value,depth=0)=>{
  if(depth>12)throw Error('Invalid nested workspace record.');
  if(Array.isArray(value))return value.map(item=>unpack(item,depth+1));
  if(isObj(value)){
   if(Object.hasOwn(value,'$blob')){
    const data=files.get(value.$blob);
    if(!data||data.byteLength!==value.size)throw Error('Workspace binary data is incomplete.');
    return new Blob([data],{type:value.mime||'application/octet-stream'});
   }
   const result={};
   for(const [key,item] of Object.entries(value)){
    if(['__proto__','prototype','constructor'].includes(key))throw Error('Unsafe workspace property.');
    result[key]=unpack(item,depth+1);
   }
   return result;
  }
  return value;
 };
 return {key:row.key,item:unpack(row.item)};
}
export async function restoreSyncPackage(packageData,{replace=false,confirmOverwrite=false}={}){
 if(!confirmOverwrite)throw Error('Review your import preview before restoring local workspace data.');
 const {manifest,files}=packageData;validateSyncManifest(manifest);
 const rowsBySpec=new Map();
 for(const row of manifest.records){
  const spec=inSpecs(row.database,row.store),group=spec.group;
  if(!rowsBySpec.has(spec.name))rowsBySpec.set(spec.name,[]);
  rowsBySpec.get(spec.name).push(rehydrate(row,files));
 }
 // The media module owns live thumbnails and must update its in-memory state.
 const mediaSpec=SYNC_DATABASES.find(x=>x.name==='proximus-alchemist-personal-media');
 const mediaRows=rowsBySpec.get(mediaSpec.name)||[];
 const validMedia=mediaRows.map(x=>x.item);
 for(const spec of SYNC_DATABASES){
  if(!manifest.included?.[spec.group])continue;
  if(spec.name===mediaSpec.name)continue;
  await writeStore(spec,rowsBySpec.get(spec.name)||[],{replace});
 }
 if(manifest.included?.media)await importMediaRecords(validMedia,{replace});
 for(const [key,value] of Object.entries(manifest.settings||{}))if(SYNC_SETTINGS.includes(key)){
  localStorage.setItem(key,value);
 }
 document.dispatchEvent(new Event('proximus-workspace-restored'));
 return {records:manifest.records.length,settings:Object.keys(manifest.settings).length,media:validMedia.length};
}
export function initSyncBridge(app){
 const status=$('syncStatus'),summary=$('syncSummary');
 let prepared=null,opened=null;
 const say=s=>{status.textContent=s;};
 function chosen(){return {projects:$('syncProjects').checked,media:$('syncMedia').checked,
  pack:$('syncPack').checked,settings:$('syncSettings').checked};}
 async function make(){
  const groups=chosen();
  if(!Object.values(groups).some(Boolean))throw Error('Select at least one workspace category to export.');
  $('syncPrepare').disabled=true;
  try{
   const result=await buildSyncArchive(groups,say);
   prepared=result.archive;
   $('syncShare').disabled=false;$('syncDownload').disabled=false;
   summary.textContent=result.manifest.records.length+' workspace records · '+bytes(prepared.size)+
     ' · '+Object.keys(result.manifest.settings).length+' preferences · encrypted Token Foundry vault excluded';
   say('Portable cross-device workspace package prepared. Export it or save it on your device.');
  }finally{$('syncPrepare').disabled=false;}
 }
 $('syncPrepare').addEventListener('click',wrap(make));
 $('syncShare').addEventListener('click',wrap(async()=>{
  if(!prepared)throw Error('Prepare a workspace archive first.');
  const result=await saveOrShare(prepared,'PROXIMUS-WORKSPACE-SYNC-'+new Date().toISOString().slice(0,10)+'.zip');
  say(result==='shared'?'Workspace package sent to your device share sheet':'Workspace ZIP saved to your device.');
 }));
 $('syncDownload').addEventListener('click',wrap(async()=>{
  if(!prepared)throw Error('Prepare a workspace archive first.');
  await saveOrShare(prepared,'PROXIMUS-WORKSPACE-SYNC-'+new Date().toISOString().slice(0,10)+'.zip',{preferShare:false});
  say('Workspace ZIP downloaded.');
 }));
 $('syncImport').addEventListener('change',wrap(async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>MAX_FILE)throw Error('Workspace archive exceeds the 150 MB import limit.');
  opened=openSyncArchive(await file.arrayBuffer());
  $('syncRestore').disabled=false;
  $('syncImportPreview').textContent='Selected '+file.name+' · '+opened.manifest.records.length+' workspace records · '+
   bytes(opened.bytes)+' media/project files · '+Object.keys(opened.manifest.settings||{}).length+
   ' preferences. This does not contain Token Foundry secrets.';
  say('Backup preview verified. Review the restore option before importing.');
 }));
 $('syncRestore').addEventListener('click',wrap(async()=>{
  if(!opened)throw Error('Choose a workspace ZIP first.');
  const replace=$('syncReplace').checked;
  if(!confirm((replace?'Replace':'Merge')+' local projects, media and preferences from this backup? This may overwrite matching local records.'))return;
  $('syncRestore').disabled=true;
  try{
   const result=await restoreSyncPackage(opened,{replace,confirmOverwrite:true});
   say('Workspace restored: '+result.records+' records, '+result.settings+' settings. Reload to refresh all studios.');
   $('syncReload').hidden=false;
   opened=null;$('syncImport').value='';
  }finally{$('syncRestore').disabled=false;}
 }));
 $('syncReload').addEventListener('click',()=>location.reload());
 $('syncOpenProjects').addEventListener('click',()=>app.changeView('projects'));
 $('syncOpenMedia').addEventListener('click',()=>$('mediaOpen').click());
 summary.textContent='Choose the data you want to carry between devices; the encrypted Token Foundry vault is never included.';
}
