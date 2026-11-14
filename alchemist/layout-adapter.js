// PROXIMUS v3.4 — Adaptive Companion Display Controller.
// UI only: never changes files, studio state, storage databases or authentication.
import {$} from './core.js';
import {detectInterfaceMode,safeLayoutChoice,LAYOUT_KEY} from './layout-adapter-core.js';
export function initAdaptiveLayout(){
 const body=document.body,dialog=$('layoutDialog'),select=$('layoutChoice'),status=$('layoutStatus');
 if(!body||!dialog||!select||!status)return;
 let preference='auto';
 try{preference=safeLayoutChoice(localStorage.getItem(LAYOUT_KEY));}catch(e){}
 let current=null;
 const mq=window.matchMedia?.('(pointer:coarse)'),hover=window.matchMedia?.('(hover:hover)');
 function compute(){
  const width=document.documentElement.clientWidth||window.innerWidth||1024;
  const state=detectInterfaceMode({
   width,coarse:!!mq?.matches,hover:!!hover?.matches,ua:navigator.userAgent||'',override:preference
  });
  const changed=state.mode!==current?.mode;
  current=state;
  body.dataset.deviceLayout=state.mode;
  body.dataset.deviceCompact=state.compact?'true':'false';
  body.dataset.deviceInput=mq?.matches?'touch':'pointer';
  const word=state.mode==='mobile'?'Phone / touch navigation':'Desktop / PC workspace';
  select.value=preference;
  $('layoutCurrent').textContent=preference==='auto'?'Auto':state.mode==='mobile'?'Phone':'PC';
  status.textContent=(state.source==='auto'?'Automatically detected ':'Manually selected ')+word+
   ' · '+state.width+'px viewport · '+state.kind+
   (state.compact?' · responsive single-column content':' · full workspace');
  if(changed){
   // Picker cannot remain above the desktop site when resizing/orientation changes.
   const picker=$('mobileStudioDialog');
   if(state.mode!=='mobile'&&picker?.open)picker.close();
   document.dispatchEvent(new CustomEvent('proximus-layout-changed',{detail:{
    mode:state.mode,compact:state.compact,kind:state.kind
   }}));
  }
 }
 function choose(value){
  preference=safeLayoutChoice(value);
  try{localStorage.setItem(LAYOUT_KEY,preference);}catch(e){}
  compute();
 }
 $('layoutToggle').addEventListener('click',()=>{compute();dialog.showModal();});
 $('layoutClose').addEventListener('click',()=>dialog.close());
 $('layoutDone').addEventListener('click',()=>dialog.close());
 $('layoutReset').addEventListener('click',()=>choose('auto'));
 select.addEventListener('change',()=>choose(select.value));
 dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});
 let frame=0;
 const update=()=>{
  cancelAnimationFrame(frame);frame=requestAnimationFrame(compute);
 };
 window.addEventListener('resize',update,{passive:true});
 window.addEventListener('orientationchange',update,{passive:true});
 if(mq?.addEventListener)mq.addEventListener('change',update);
 if(hover?.addEventListener)hover.addEventListener('change',update);
 compute();
}
