// PROXIMUS | Asset Alchemist v3.1 — iPhone studio navigation
// No route reloads: moves within the existing 31 studios and preserves their state.
import {$} from './core.js';
export const MOBILE_PINS='proximus-mobile-navigation-pins-v1';
export const MOBILE_RECENT='proximus-mobile-navigation-recent-v1';
export function mobileNavigationList(studios,{term='',favorites=[],recent=[],mode='all'}={}){
 const text=String(term||'').trim().toLowerCase();
 const base=studios.filter(s=>(s.title+' '+s.detail).toLowerCase().includes(text));
 if(mode==='favorites')return base.filter(s=>favorites.includes(s.id));
 if(mode==='recent')return [...base].sort((a,b)=>recent.indexOf(a.id)-recent.indexOf(b.id))
  .filter(s=>recent.includes(s.id));
 return base;
}
export function historyMove(history,index,direction){
 if(!history.length)return {index:-1,id:null};
 const next=Math.max(0,Math.min(history.length-1,index+direction));
 return {index:next,id:history[next]};
}
export function initMobileNavigation(app){
 const dock=$('mobileDock'),modal=$('mobileStudioDialog'),grid=$('mobileStudioList');
 if(!dock||!modal||!grid)return;
 let history=[],index=-1,travel=false,mode='all',pins=[],recent=[];
 try{pins=JSON.parse(localStorage.getItem(MOBILE_PINS)||'[]');if(!Array.isArray(pins))pins=[];}catch(e){pins=[];}
 try{recent=JSON.parse(localStorage.getItem(MOBILE_RECENT)||'[]');if(!Array.isArray(recent))recent=[];}catch(e){recent=[];}
 const known=new Set(app.studios.map(s=>s.id));
 pins=[...new Set(pins)].filter(s=>known.has(s)).slice(0,18);
 recent=[...new Set(recent)].filter(s=>known.has(s)).slice(0,30);
 function save(){
  try{
   localStorage.setItem(MOBILE_PINS,JSON.stringify(pins));
   localStorage.setItem(MOBILE_RECENT,JSON.stringify(recent));
  }catch(e){}
 }
 function updateDock(id){
  for(const button of dock.querySelectorAll('[data-mobile-target]')){
   const active=button.dataset.mobileTarget===id;
   button.classList.toggle('active',active);
   if(active)button.setAttribute('aria-current','page');
   else button.removeAttribute('aria-current');
  }
  $('mobileHistoryBack').disabled=index<=0;
  $('mobileHistoryNext').disabled=index<0||index>=history.length-1;
  $('mobileStudioBack').disabled=index<=0;
  $('mobileStudioNext').disabled=index<0||index>=history.length-1;
 }
 function go(id){
  if(!known.has(id))return;
  if(modal.open)modal.close();
  app.changeView(id);
 }
 function travelHistory(direction){
  const target=historyMove(history,index,direction);
  if(target.index===index||!target.id)return;
  index=target.index;travel=true;go(target.id);travel=false;
 }
 function render(){
  grid.replaceChildren();
  const choices=mobileNavigationList(app.studios,{term:$('mobileStudioSearch').value,favorites:pins,recent,mode});
  for(const s of choices){
   const row=document.createElement('div');row.className='mobile-studio-row';
   const open=document.createElement('button');open.type='button';open.className='mobile-studio-open';
   const glyph=document.createElement('b');glyph.textContent=s.icon;
   const content=document.createElement('span');const title=document.createElement('strong');title.textContent=s.title;
   const detail=document.createElement('small');detail.textContent=s.detail;
   content.append(title,detail);open.append(glyph,content);
   open.addEventListener('click',()=>go(s.id));
   const favorite=document.createElement('button');favorite.className='mobile-studio-star';
   favorite.setAttribute('aria-label',(pins.includes(s.id)?'Unpin ':'Pin ')+s.title);
   favorite.textContent=pins.includes(s.id)?'★':'☆';
   favorite.addEventListener('click',()=>{
    pins=pins.includes(s.id)?pins.filter(x=>x!==s.id):[...pins,s.id].slice(0,18);
    save();render();
   });
   row.append(open,favorite);grid.append(row);
  }
  if(!choices.length){
   const blank=document.createElement('p');blank.className='hint';
   blank.textContent='No studios match. Try All or another search.';grid.append(blank);
  }
  $('mobileStudioCount').textContent=choices.length+' studios shown · '+pins.length+' pinned';
 }
 function openPicker(){
  $('mobileStudioSearch').value='';
  mode='all';$('mobileStudioMode').value='all';
  render();modal.showModal();
  $('mobileStudioSearch').focus();
 }
 dock.querySelectorAll('[data-mobile-target]').forEach(button=>{
  button.addEventListener('click',()=>{
   const dest=button.dataset.mobileTarget;
   if(dest==='studios')openPicker();else go(dest);
  });
 });
 $('mobileHistoryBack').addEventListener('click',()=>travelHistory(-1));
 $('mobileHistoryNext').addEventListener('click',()=>travelHistory(1));
 $('mobileStudioBack').addEventListener('click',()=>travelHistory(-1));
 $('mobileStudioNext').addEventListener('click',()=>travelHistory(1));
 $('mobileStudioClose').addEventListener('click',()=>modal.close());
 $('mobileStudioSearch').addEventListener('input',render);
 $('mobileStudioMode').addEventListener('change',e=>{mode=e.target.value;render();});
 $('mobileStudioTop').addEventListener('click',()=>{modal.close();window.scrollTo({top:0,behavior:'smooth'});});
 modal.addEventListener('click',e=>{if(e.target===modal)modal.close();});
 document.addEventListener('proximus-view-changed',e=>{
  const id=e.detail?.studio;
  if(!known.has(id))return;
  if(!travel){
   if(history[index]!==id){
    history=history.slice(0,index+1);history.push(id);
    if(history.length>30)history.shift();
    index=history.length-1;
   }
  }
  recent=[id,...recent.filter(x=>x!==id)].slice(0,30);
  save();updateDock(id);
  if(modal.open)modal.close();
 });
 document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='m'&&document.body.dataset.deviceLayout==='mobile'){
   e.preventDefault();modal.open?modal.close():openPicker();
  }
 });
 // Pointer-based left-edge backward gesture: disabled for playable media,
 // buttons, inputs, carousels and browser selection. Never steal vertical scrolling.
 let start=null;
 document.addEventListener('touchstart',e=>{
  if(document.body.dataset.deviceLayout!=='mobile'||modal.open||e.touches.length!==1)return;
  const t=e.touches[0];if(t.clientX>24)return;
  if(e.target.closest('input,textarea,select,button,a,video,audio,canvas,[contenteditable],dialog,.theater-stage'))return;
  start={x:t.clientX,y:t.clientY};
 },{passive:true});
 document.addEventListener('touchend',e=>{
  if(!start||e.changedTouches.length!==1)return;
  const t=e.changedTouches[0],dx=t.clientX-start.x,dy=t.clientY-start.y;start=null;
  if(dx>85&&Math.abs(dy)<45)travelHistory(-1);
 },{passive:true});
 document.body.classList.add('mobile-navigation-ready');
 updateDock(document.querySelector('.studio:not([hidden])')?.dataset.panel||'');
}
