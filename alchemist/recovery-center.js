// PROXIMUS | ASSET ALCHEMIST — Performance & Recovery Center
import {$,bytes,download,textFile,wrap} from './core.js';
import {mobileFileSupport} from './portable-kit.js';
const keys=[
 'nexus-alchemist-last-view','nexus-alchemist-pack-title','nexus-alchemist-pack-target',
 'proximus-sovereign-shortcuts-v1','proximus-automations-v1','proximus-alchemist-workflow-v1','proximus-alchemist-arcade-scores-v1',
 'proximus-command-layout-v1','proximus-command-pins-v1','proximus-command-name-v1','proximus-reactor-settings-v1','proximus-visual-identity-v1','proximus-mobile-navigation-pins-v1','proximus-mobile-navigation-recent-v1','proximus-companion-links-v1','proximus-companion-pocket-notes-v1','proximus-video-vault-auto-next-v1','proximus-life-command-v1'
];
export function backupSettings(storage){
 const prefs={};
 for(const key of keys){const value=storage.getItem(key);if(value!==null)prefs[key]=value;}
 return {schema:'proximus.settings/1',exported:new Date().toISOString(),preferences:prefs};
}
export function restoreSettings(storage,document){
 if(document?.schema!=='proximus.settings/1'||!document.preferences||typeof document.preferences!=='object')throw Error('Invalid PROXIMUS settings backup.');
 let count=0;
 for(const key of keys)if(typeof document.preferences[key]==='string'&&document.preferences[key].length<150000){
  storage.setItem(key,document.preferences[key]);count++;
 }
 return count;
}
export function initRecoveryCenter(app){
 const status=$('recoveryStatus'),rows=$('recoveryDiagnostics');
 async function inspect(){
  rows.replaceChildren();
  const add=(name,value)=>{
   const row=document.createElement('div');row.className='recovery-stat';
   const left=document.createElement('span');left.textContent=name;
   const right=document.createElement('strong');right.textContent=value;row.append(left,right);rows.append(row);
  };
  add('Application version',$('versionInfo').textContent);
  const cap=mobileFileSupport();add('Browser device',cap.platform);
  add('Share files',cap.share?'Available':'Use browser downloads');
  add('Asset Packager',app.listAssets().length+' items');
  add('IndexedDB',typeof indexedDB!=='undefined'?'Available':'Not available');
  add('Service Worker',navigator.serviceWorker?.controller?'Active':'Not controlling this page');
  if(navigator.storage?.estimate){
   const est=await navigator.storage.estimate();
   add('Local storage used',bytes(est.usage||0));add('Estimated storage quota',bytes(est.quota||0));
   $('recoveryStorage').value=est.quota?Math.min(100,Math.round((est.usage||0)/est.quota*100)):0;
  }
  if(typeof caches!=='undefined'){
   const names=(await caches.keys()).filter(x=>x.includes('alchemist'));
   add('Application caches',names.length+' versions');
  }
  status.textContent='Recovery overview refreshed.';
 }
 $('recoveryRefresh').addEventListener('click',wrap(inspect));
 $('recoveryPersist').addEventListener('click',wrap(async()=>{
  if(!navigator.storage?.persist)throw Error('Persistent browser storage is not supported here.');
  const approved=await navigator.storage.persist();
  status.textContent=approved?'Browser storage persistence enabled.':'Your browser continues managing storage automatically.';
 }));
 $('recoveryExportSettings').addEventListener('click',()=>{
  download(textFile(backupSettings(localStorage)),'PROXIMUS-SETTINGS-BACKUP.json');
  status.textContent='Settings backup exported.';
 });
 $('recoveryImportSettings').addEventListener('change',wrap(async e=>{
  const file=e.target.files?.[0];if(!file)return;if(file.size>1000000)throw Error('Settings backup is too large.');
  const data=JSON.parse(await file.text());
  const count=restoreSettings(localStorage,data);
  status.textContent=count+' settings restored. Reopen affected studios to see changes.';
  e.target.value='';
 }));
 $('recoveryClearCache').addEventListener('click',wrap(async()=>{
  if(!confirm('Clear only PROXIMUS Asset Alchemist offline application caches? Your personal projects and browser data will stay saved.'))return;
  const names=await caches.keys(),targets=names.filter(x=>x.startsWith('proximus-alchemist-')||x.startsWith('nexus-alchemist-'));
  for(const name of targets)await caches.delete(name);
  status.textContent='Cleared '+targets.length+' old app cache entries. Use Check Updates and reload when ready.';
 }));
 $('recoveryCheckUpdates').addEventListener('click',()=>$('versionCheck').click());
 $('recoveryExportPack').addEventListener('click',()=>$('packExport').click());
 document.addEventListener('proximus-pack-changed',()=>{$('recoveryPackCount').textContent=String(app.listAssets().length);});
 $('recoveryPackCount').textContent=String(app.listAssets().length);
 void inspect();
}
