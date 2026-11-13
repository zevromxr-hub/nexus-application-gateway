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
export async function inspectRelease({fetchFn=fetch,cacheApi=typeof caches!=='undefined'?caches:null,installed='2.9.0'}={}){
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
 $('releaseGuardScan').addEventListener('click',wrap(async()=>{
  $('releaseGuardScan').disabled=true;
  try{
   status.textContent='Checking release metadata, online assets and offline caches…';
   last=await inspectRelease();
   draw(last);
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
}
