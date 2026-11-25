/* PROXIMUS v4: on-demand origin-storage health. Never reads actual movie contents. */
import {listStoredVideos} from './video-vault.js';
import {formatStorageBytes,storageRisk} from './immersion-core-v4.js';
const $=id=>document.getElementById(id);
export function initImmersionStorage(){
 async function scan(){
  const container=$('px40StorageResults');container.replaceChildren();
  const report=[];
  try{
   const items=await listStoredVideos();
   const bytes=items.reduce((sum,x)=>sum+(Number.isFinite(Number(x.bytes))?Number(x.bytes):0),0);
   report.push(items.length+' saved videos · '+formatStorageBytes(bytes)+' in original local movie files.');
  }catch(err){report.push('Video library metadata unavailable: '+err.message)}
  if(navigator.storage?.estimate){
   try{
    const {usage,quota}=await navigator.storage.estimate(),risk=storageRisk(Number(usage),Number(quota));
    report.push(risk.percent===null?'Storage quota is not available.':
     'Estimated browser-origin storage: '+formatStorageBytes(usage)+' / '+formatStorageBytes(quota)+' ('+risk.percent+'%, '+risk.label.toLowerCase()+').');
   }catch{report.push('Storage estimate is unavailable in this browser.')}
  }else report.push('This browser does not expose its storage quota.');
  try{
   if(navigator.storage?.persisted){
    report.push(await navigator.storage.persisted()?'Persistent-storage permission granted (not a backup).':
     'Persistent-storage permission not granted.');
   }
  }catch{report.push('Persistent-storage status could not be checked.')}
  report.push('Keep original movies in Files or Photos. Clearing site data or uninstalling a standalone web app can erase locally saved videos.');
  for(const line of report){const p=document.createElement('p');p.textContent=line;container.append(p)}
 }
 $('px40StorageCheck').addEventListener('click',()=>void scan());
 $('px40StorageOpen').addEventListener('click',()=>{if(!$('px40Dialog').open)$('px40Dialog').showModal();void scan()});
 $('px40Persistence').addEventListener('click',async()=>{
  const out=$('px40PersistenceStatus');
  if(!navigator.storage?.persist){out.textContent='Your browser does not support requesting persistence; keep original video backups.';return}
  try{out.textContent=await navigator.storage.persist()?'Storage permission granted. Keep backups too.':'Storage persistence not granted; keep your original movies in Files/Photos.'}
  catch(err){out.textContent='Cannot request persistence: '+err.message}
  void scan();
 });
}
