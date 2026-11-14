// PROXIMUS v3.6.0 | ORBIT — visual access layer, no changes to studio logic/data.
import {ORBIT_PIN_KEY,ORBIT_RECENT_KEY,ORBIT_DEFAULT_PINNED,ORBIT_GROUPS,normalizeOrbitIds,orbitGroupFor,orbitCanonicalId,orbitFilter} from './orbit-core.js';
const oldPinKeys=['proximus-command-pins-v1','proximus-mobile-navigation-pins-v1'];
const oldRecentKey='proximus-mobile-navigation-recent-v1';
const decode=(key)=>{try{return JSON.parse(localStorage.getItem(key)||'null');}catch{return null;}};
const activeIds=ORBIT_GROUPS.flatMap(group=>group.members);
export function readOrbitPins(){
 const own=decode(ORBIT_PIN_KEY);
 if(Array.isArray(own))return normalizeOrbitIds(own,activeIds);
 const historic=oldPinKeys.flatMap(key=>Array.isArray(decode(key))?decode(key):[]);
 return normalizeOrbitIds([...historic,...ORBIT_DEFAULT_PINNED],activeIds);
}
export function readOrbitRecent(){
 const own=decode(ORBIT_RECENT_KEY);
 const historic=decode(oldRecentKey);
 return normalizeOrbitIds(Array.isArray(own)?own:Array.isArray(historic)?historic:[],activeIds,30);
}
export function writeOrbitPins(raw){
 const pins=normalizeOrbitIds(raw,activeIds);
 try{localStorage.setItem(ORBIT_PIN_KEY,JSON.stringify(pins));}catch{}
 document.dispatchEvent(new CustomEvent('proximus-orbit-pins-changed',{detail:{pins}}));
 return pins;
}
export function toggleOrbitPin(id){
 const key=orbitCanonicalId(id),pins=readOrbitPins();
 return writeOrbitPins(pins.includes(key)?pins.filter(x=>x!==key):[key,...pins]);
}
function makeButton(label,className,handler,attributes={}){
 const el=document.createElement('button');el.type='button';el.textContent=label;el.className=className;
 for(const [key,val] of Object.entries(attributes))el.setAttribute(key,String(val));
 el.addEventListener('click',handler);return el;
}
function wrapAdvancedArea(element,label,id){
 if(!element||element.closest('.orbit-collapse'))return;
 const details=document.createElement('details');details.className='orbit-collapse';details.id=id;
 const summary=document.createElement('summary');summary.textContent=label;
 element.before(details);details.append(summary,element);
}
function groupRail(){
 const nav=document.getElementById('nav');if(!nav||nav.querySelector('.orbit-nav-group'))return new Map();
 const buttons=[...nav.querySelectorAll(':scope > .nav[data-view]')],map=new Map();
 const byId=new Map(buttons.map(btn=>[btn.dataset.view,btn]));
 for(const group of ORBIT_GROUPS){
  const detail=document.createElement('details');detail.className='orbit-nav-group';
  detail.dataset.orbitGroup=group.id;
  const summary=document.createElement('summary');
  const label=document.createElement('strong');label.textContent=group.label;
  const count=document.createElement('span');count.textContent=String(group.members.length);
  summary.append(label,count);
  const items=document.createElement('div');items.className='orbit-nav-items';
  for(const id of group.members){
   const button=byId.get(id);if(button)items.append(button);
  }
  detail.append(summary,items);nav.append(detail);map.set(group.id,detail);
 }
 // Legacy Theater remains a valid DOM route but does not get a duplicate visible link.
 const legacy=byId.get('theater');if(legacy)legacy.hidden=true;
 return map;
}
function makeMoreMenu(){
 const bar=document.querySelector('.top-actions');if(!bar||bar.querySelector('#orbitMoreMenu'))return;
 const details=document.createElement('details');details.id='orbitMoreMenu';details.className='orbit-more';
 const summary=document.createElement('summary');summary.textContent='More';
 summary.setAttribute('aria-label','More website actions and settings');
 const menu=document.createElement('div');menu.className='orbit-more-items';
 for(const id of ['vaultJump','lifeJump','mediaOpen','packJump']){
  const button=document.getElementById(id);if(button)menu.append(button);
 }
 details.append(summary,menu);bar.append(details);
 document.addEventListener('pointerdown',event=>{
  if(details.open&&!details.contains(event.target))details.open=false;
 },{passive:true});
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&details.open)details.open=false;});
 menu.addEventListener('click',event=>{if(event.target.closest('button'))details.open=false;});
}
function makeChip(name,entry,app){
 const button=makeButton(entry.icon+' '+entry.title,'orbit-chip',()=>app.changeView(entry.id),{
  'title':'Open '+entry.title,
  'aria-label':'Open '+entry.title
 });
 button.dataset.orbitChip=entry.id;
 return button;
}
export function initOrbitInterface(app){
 const bar=document.getElementById('orbitAccessBar');
 if(!bar||bar.dataset.orbitReady)return;
 bar.dataset.orbitReady='true';
 const byId=new Map(app.studios.filter(s=>s.id!=='theater').map(s=>[s.id,s]));
 const groups=groupRail();
 makeMoreMenu();
 const navPinned=document.getElementById('orbitPinned');
 const navRecent=document.getElementById('orbitRecent');
 const current=document.getElementById('orbitCurrent');
 const category=document.getElementById('orbitCurrentCategory');
 const star=document.getElementById('orbitPinCurrent');
 let view='command';
 const labels=new Map(ORBIT_GROUPS.map(x=>[x.id,x.label]));
 function drawAccess(){
  navPinned.replaceChildren();navRecent.replaceChildren();
  for(const id of readOrbitPins().slice(0,4)){
   const record=byId.get(id);if(record)navPinned.append(makeChip('pinned',record,app));
  }
  for(const id of readOrbitRecent().filter(id=>id!==view).slice(0,3)){
   const record=byId.get(id);if(record)navRecent.append(makeChip('recent',record,app));
  }
  if(!navPinned.children.length){
   const line=document.createElement('span');line.className='orbit-empty';line.textContent='Pin a space for quick access';navPinned.append(line);
  }
  if(!navRecent.children.length){
   const line=document.createElement('span');line.className='orbit-empty';line.textContent='Recently visited spaces appear here';navRecent.append(line);
  }
  const pinned=readOrbitPins().includes(view);
  star.textContent=pinned?'★ Pinned':'☆ Pin this space';
  star.setAttribute('aria-pressed',String(pinned));
 }
 function setView(id){
  view=orbitCanonicalId(id);const record=byId.get(view);
  document.body.dataset.orbitView=view;
  current.textContent=record?.title||'Companion Center';
  const group=orbitGroupFor(view);
  category.textContent=labels.get(group)||'Workspace';
  for(const [gid,details] of groups){
   details.classList.toggle('orbit-group-active',gid===group);
   if(gid===group)details.open=true;
  }
  drawAccess();
 }
 const launch=()=>document.getElementById('cmdOpen')?.click();
 document.getElementById('orbitFind').addEventListener('click',launch);
 document.getElementById('orbitHome').addEventListener('click',()=>app.changeView('command'));
 star.addEventListener('click',()=>{toggleOrbitPin(view);drawAccess();});
 document.addEventListener('proximus-orbit-pins-changed',drawAccess);
 document.addEventListener('proximus-view-changed',event=>{
  const id=orbitCanonicalId(event.detail?.studio||'command');
  let recent=readOrbitRecent().filter(x=>x!==id);
  recent.unshift(id);
  try{localStorage.setItem(ORBIT_RECENT_KEY,JSON.stringify(recent.slice(0,30)));}catch{}
  setView(id);
 });
 // Keep existing mobile picker, navigation history and adaptive layout untouched.
 // Collapse only secondary dashboard sections; all original elements/IDs remain accessible.
 wrapAdvancedArea(document.querySelector('#command .command-catalog'),
  'Explore the complete studio directory','orbitCompleteCatalog');
 const lower=[...document.querySelectorAll('#command > .workspace.split')]
  .find(node=>!node.classList.contains('companion-home-grid'));
 wrapAdvancedArea(lower,'More dashboard tools · personalization, shortcuts and recent exports','orbitDashboardTools');
 wrapAdvancedArea(document.querySelector('#overdriveHub .overdrive-scene-panel'),
  'Customize entertainment scenes and advanced presets','orbitSceneSettings');
 document.documentElement.classList.add('orbit-interface');
 setView(document.querySelector('.studio:not([hidden])')?.dataset.panel||
  localStorage.getItem('nexus-alchemist-last-view')||'command');
}
