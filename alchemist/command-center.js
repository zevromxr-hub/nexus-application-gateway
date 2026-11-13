// PROXIMUS | ASSET ALCHEMIST — Sovereign Command Center
// Personal dashboard with a visual-only creator/customer layout preference.
// All user permissions still require a protected backend. Never claims that
// changing a browser interface profile provides authorization or access control.
import {$,bytes,wrap} from './core.js';
const PROFILE='proximus-command-layout-v1',PINS='proximus-command-pins-v1',NAME='proximus-command-name-v1';
export const MODES=['creator','customer'];
export function normalizePins(input,known){
 if(!Array.isArray(input))return [];
 const keys=new Set(known),seen=new Set(),out=[];
 for(const id of input)if(keys.has(id)&&!seen.has(id)){out.push(id);seen.add(id);}
 return out.slice(0,16);
}
export function filterStudios(studios,term='',pins=[],onlyPinned=false){
 const t=String(term).trim().toLowerCase();
 return studios.filter(x=>(!onlyPinned||pins.includes(x.id))&&(!t||(x.title+' '+x.detail).toLowerCase().includes(t)))
   .sort((a,b)=>(pins.includes(b.id)?1:0)-(pins.includes(a.id)?1:0));
}
export function initCommandCenter(app){
 const search=$('commandSearch'),grid=$('commandCards'),summary=$('commandStatus'),pinsCount=$('commandPinsCount');
 if(!grid)return;
 const all=app.studios.filter(s=>!['releases','creator'].includes(s.id));
 let pins=[],profile=localStorage.getItem(PROFILE)||'creator',onlyPinned=false;
 try{pins=normalizePins(JSON.parse(localStorage.getItem(PINS)||'[]'),all.map(x=>x.id));}catch(e){pins=[];}
 if(!MODES.includes(profile))profile='creator';
 const savePins=()=>{try{localStorage.setItem(PINS,JSON.stringify(pins));}catch(e){}};
 function useProfile(value){
  profile=MODES.includes(value)?value:'creator';document.body.dataset.proximusProfile=profile;
  localStorage.setItem(PROFILE,profile);
  $('commandMode').value=profile;
  $('commandModeNote').textContent=profile==='creator'?
   'Creator layout: full workspace navigation and publishing controls.':
   'Customer layout: simpler navigation and creation shortcuts. This is a display preference, not a secure login or permissions system.';
  draw();
 }
 const advanced=new Set(['audit','production','motiongraphics','recovery','tokens','utility','projects','automation','motion','model']);
 function draw(){
  grid.replaceChildren();const showing=filterStudios(all,search.value,pins,onlyPinned);
  for(const s of showing){
   const card=document.createElement('article');card.className='command-studio-card';
   card.dataset.proximusThumbnail=s.id;
   const image=document.createElement('div');image.className='dashboard-thumb';
   const info=document.createElement('div');info.className='command-studio-info';
   const title=document.createElement('strong');title.textContent=s.icon+' '+s.title;
   const desc=document.createElement('p');desc.textContent=s.detail;
   const actions=document.createElement('div');actions.className='command-studio-actions';
   const open=document.createElement('button');open.className='primary';open.textContent='Open studio';
   open.addEventListener('click',()=>app.changeView(s.id));
   const pin=document.createElement('button');pin.className='small-btn';pin.textContent=pins.includes(s.id)?'★ Pinned':'☆ Pin';
   pin.setAttribute('aria-label','Pin '+s.title+' to favorites');
   pin.addEventListener('click',()=>{
    pins=pins.includes(s.id)?pins.filter(x=>x!==s.id):[...pins,s.id].slice(0,16);
    savePins();draw();
   });
   actions.append(open,pin);info.append(title,desc,actions);card.append(image,info);grid.append(card);
  }
  if(!showing.length){const msg=document.createElement('p');msg.className='hint';msg.textContent='No workspaces match your filter.';grid.append(msg);}
  pinsCount.textContent=pins.length+' pinned · '+showing.length+' shown';
  document.dispatchEvent(new Event('proximus-media-refresh'));
 }
 function liveStats(){
  const assets=app.listAssets(),total=assets.reduce((sum,x)=>sum+(x.data?.size||0),0);
  $('commandAssets').textContent=String(assets.length);
  $('commandPackSize').textContent=bytes(total);
  const recent=$('commandRecent');recent.replaceChildren();
  for(const a of assets.slice(-6).reverse()){
   const row=document.createElement('div');row.className='command-recent-item';
   const name=document.createElement('span');name.textContent=a.name;
   const info=document.createElement('small');info.textContent=(a.studio||'Studio')+' · '+bytes(a.data.size);
   const button=document.createElement('button');button.className='small-btn';button.textContent='View pack';
   button.addEventListener('click',()=>app.changeView('pack'));
   row.append(name,info,button);recent.append(row);
  }
  if(!assets.length)recent.textContent='Completed studio exports will appear here.';
 }
 $('commandMode').addEventListener('change',e=>useProfile(e.target.value));
 search.addEventListener('input',draw);
 $('commandOnlyPinned').addEventListener('change',e=>{onlyPinned=e.target.checked;draw();});
 $('commandOpenSync').addEventListener('click',()=>app.changeView('sync'));
 $('commandOpenProjects').addEventListener('click',()=>app.changeView('projects'));
 $('commandOpenMedia').addEventListener('click',()=>$('mediaOpen').click());
 $('commandOpenReactor').addEventListener('click',()=>app.changeView('reactor'));
 $('commandOpenRelease').addEventListener('click',()=>app.changeView('releases'));
 $('commandOpenRecovery').addEventListener('click',()=>app.changeView('recovery'));
 $('commandCheckUpdates').addEventListener('click',()=>$('versionCheck').click());
 const label=$('commandDisplayName');
 label.value=localStorage.getItem(NAME)||'';
 label.addEventListener('change',()=>{
  const value=label.value.trim().slice(0,45);
  localStorage.setItem(NAME,value);drawGreeting();
 });
 function drawGreeting(){
  const name=localStorage.getItem(NAME)||'';
  $('commandGreeting').textContent=name?'Welcome back, '+name+'.':'Welcome to your PROXIMUS command center.';
 }
 document.addEventListener('proximus-pack-changed',liveStats);
 document.addEventListener('proximus-workspace-restored',()=>{liveStats();draw();});
 $('commandRefresh').addEventListener('click',()=>{liveStats();draw();summary.textContent='Command dashboard refreshed.';});
 useProfile(profile);liveStats();drawGreeting();
 summary.textContent='Pinned workspaces, latest outputs and your personal interface layout are saved on this device.';
}
