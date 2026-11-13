// PROXIMUS | ASSET ALCHEMIST — Release Guard v2.9
// Client-side diagnostics; server authority continues to come from GitHub
// repository permissions and branch protections, not these browser checks.
import {$,bytes,download,textFile,wrap} from './core.js';
export const RELEASE_ASSETS=[
 './index.html','./style.css','./app.js','./media-publisher.js','./command-center.js',
 './workspace-sync.js','./reactor-studio.js','./reactor-dsp.js',
 './recovery-center.js','./version.json','./releases/index.json'
];
export function releaseCheck(manifest,index,installed){
 if(!manifest||typeof manifest.version!=='string'||!/^\d+\.\d+\.\d+$/.test(manifest.version))throw Error('Invalid release version manifest.');
 if(!index||!Array.isArray(index.releases)||!index.releases.some(x=>x.version===manifest.version))throw Error('Release history does not contain the published version.');
 const a=installed.split('.').map(Number),b=manifest.version.split('.').map(Number);
 if(a.length!==3||a.some(x=>!Number.isFinite(x)))throw Error('Invalid installed application version.');
 const cmp=()=>{for(let i=0;i<3;i++){if(b[i]>a[i])return 1;if(b[i]<a[i])return -1;}return 0;};
 return {installed,published:manifest.version,upToDate:cmp()===0,newer:cmp()>0,studios:manifest.studio_count,
  releaseRecords:index.releases.length,code:'OK'};
}
export async function inspectRelease({fetchFn=fetch,cacheApi=typeof caches!=='undefined'?caches:null,installed='3.0.1'}={}){
 const entries=[],at=new Date().toISOString();let manifest=null,index=null;
 const add=(part,ok,detail)=>entries.push({part,status:ok?'PASS':'NOTICE',detail:String(detail)});
 const get=async path=>{
  const url=new URL(path,location.href).href;
  const response=await fetchFn(url,{cache:'no-store'});
  if(!response.ok)throw Error('HTTP '+response.status+' for '+path);
  return response;
 };
 try{manifest=await (await get('./version.json')).json();add('Release manifest',true,manifest.version);}
 catch(e){add('Release manifest',false,e.message);}
 try{index=await (await get('./releases/index.json')).json();add('Release history',true,index.releases?.length+' records');}
 catch(e){add('Release history',false,e.message);}
 try{
  const report=releaseCheck(manifest,index,installed);
  add('Version consistency',report.upToDate,report.upToDate?'Installed matches published '+installed:'Installed '+installed+' · Published '+report.published);
 }catch(e){add('Version consistency',false,e.message);}
 const fileChecks=await Promise.all(RELEASE_ASSETS.map(async path=>{
  try{
   const response=await get(path);
   return {part:'Source '+path,status:'PASS',detail:response.headers.get('content-type')||'Available'};
  }catch(e){return {part:'Source '+path,status:'NOTICE',detail:e.message};}
 }));
 entries.push(...fileChecks);
 let cacheNames=[];
 if(cacheApi){
  try{cacheNames=(await cacheApi.keys()).filter(x=>x.startsWith('proximus-alchemist-v'));
   add('Offline cache',cacheNames.length>0,cacheNames.join(', ')||'No offline cache installed');
  }catch(e){add('Offline cache',false,e.message);}
 }
 const sw=typeof navigator!=='undefined'&&!!navigator.serviceWorker?.controller;
 add('Service Worker',sw,sw?'Application service worker is active':'No active controller for this page');
 const result={schema:'proximus.release-guard/1',at,installed,published:manifest?.version||'',entries,
  summary:{passing:entries.filter(x=>x.status==='PASS').length,notices:entries.filter(x=>x.status!=='PASS').length},
  cachedVersions:cacheNames};
 return result;
}
export function initReleaseGuard(app){
 const holder=$('releaseGuardResults'),status=$('releaseGuardStatus');if(!holder)return;
 let last=null;
 const draw=report=>{
  holder.replaceChildren();
  const heading=document.createElement('p');heading.className='hint';
  heading.textContent=report.summary.passing+' passed · '+report.summary.notices+' notices · '+report.at;
  holder.append(heading);
  for(const entry of report.entries){
   const row=document.createElement('div');row.className='recovery-stat';
   const title=document.createElement('span');title.textContent=(entry.status==='PASS'?'✓ ':'◌ ')+entry.part;
   const value=document.createElement('strong');value.textContent=entry.detail;
   row.append(title,value);holder.append(row);
  }
 };
 async function talkToWorker(type,name){
  if(!navigator.serviceWorker)throw Error('This browser does not support a service worker.');
  const reg=await navigator.serviceWorker.ready,worker=navigator.serviceWorker.controller||reg.active;
  if(!worker)throw Error('No active PROXIMUS offline worker is available.');
  return await new Promise((resolve,reject)=>{
   const channel=new MessageChannel();
   const timer=setTimeout(()=>{channel.port1.close();reject(Error('Offline worker did not respond.'));},7000);
   channel.port1.onmessage=e=>{
    clearTimeout(timer);channel.port1.close();
    if(e.data?.ok)resolve(e.data);else reject(Error(e.data?.error||'Offline cache control failed.'));
   };
   worker.postMessage({type,name},[channel.port2]);
  });
 }
 async function refreshPrevious(){
  const select=$('releaseGuardRollbackSelect');select.replaceChildren();
  try{
   const info=await talkToWorker('PROXIMUS_LIST_CACHES');
   const archived=info.names.filter(x=>x!==info.latest);
   for(const name of archived){
    const opt=document.createElement('option');opt.value=name;opt.textContent=name.replace('proximus-alchemist-','');
    select.append(opt);
   }
   if(!archived.length){
    const option=document.createElement('option');option.value='';option.textContent='No earlier cached release';
    select.append(option);
   }
   $('releaseGuardRollback').disabled=!archived.length;
   $('releaseGuardLatest').disabled=info.active===info.latest;
   const active=document.createElement('option');active.value='';active.disabled=true;
   $('releaseGuardStatus').textContent=info.active===info.latest?'Running latest cached build.':'Fallback active: '+info.active+'. Use Return to latest build to resume updates.';
  }catch(e){
   const option=document.createElement('option');option.value='';option.textContent='Offline fallback unavailable';
   select.append(option);$('releaseGuardRollback').disabled=true;
   $('releaseGuardStatus').textContent='Fallback status: '+e.message;
  }
 }
 $('releaseGuardRollback').addEventListener('click',wrap(async()=>{
  const name=$('releaseGuardRollbackSelect').value;
  if(!name)throw Error('Select a cached earlier release.');
  if(!confirm('Switch this browser to the saved '+name+' application files? Your personal projects remain stored locally.'))return;
  await talkToWorker('PROXIMUS_RESTORE_CACHE',name);
  location.reload();
 }));
 $('releaseGuardLatest').addEventListener('click',wrap(async()=>{
  await talkToWorker('PROXIMUS_USE_LATEST');location.reload();
 }));
 $('releaseGuardScan').addEventListener('click',wrap(async()=>{
  $('releaseGuardScan').disabled=true;
  try{
   status.textContent='Checking release metadata, online assets and offline caches…';
   last=await inspectRelease();
   draw(last);await refreshPrevious();
   status.textContent='Release guard completed · '+last.summary.passing+' checks passed, '+last.summary.notices+' notices.';
  }finally{$('releaseGuardScan').disabled=false;}
 }));
 $('releaseGuardExport').addEventListener('click',wrap(()=>{
  if(!last)throw Error('Run Release Guard first.');
  download(textFile(last),'PROXIMUS-RELEASE-GUARD-'+new Date().toISOString().slice(0,10)+'.json');
  status.textContent='Release diagnostic report exported.';
 }));
 $('releaseGuardOpenSync').addEventListener('click',()=>app.changeView('sync'));
 $('releaseGuardUpdate').addEventListener('click',()=>$('versionCheck').click());
 status.textContent='Ready to inspect release files, service worker and cached versions.';
 void refreshPrevious();
}
