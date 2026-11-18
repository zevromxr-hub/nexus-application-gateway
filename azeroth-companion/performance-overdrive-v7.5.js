/* NEXUS | AZEROTH v7.5 — Performance Overdrive
 * Presentation-only choice; cannot write talent allocations, media libraries,
 * account credentials, inventory, or other game/planning records.
 */
(()=>{'use strict';
const forge=document.getElementById('talentForge'),tree=document.getElementById('tfTree');
if(!forge||!tree||document.getElementById('nxPerformanceOverdrive'))return;
const KEY='nexus_azeroth_perf_profile_v75',allowed=new Set(['auto','full','lite']);
let setting='auto';try{const x=localStorage.getItem(KEY);if(allowed.has(x))setting=x}catch(_){}
const panel=document.createElement('div');panel.id='nxPerformanceOverdrive';panel.className='nx-performance-overdrive';
panel.innerHTML='<div><strong>⚡ PERFORMANCE OVERDRIVE</strong><small>Optional display mode · never changes talents, data or music</small></div>'+
'<label for="nxPerformanceProfile">Visual performance<select id="nxPerformanceProfile"><option value="auto">AUTO · Adaptive</option><option value="full">FULL · Original effects</option><option value="lite">LITE · Faster visual effects</option></select></label>'+
'<span id="nxPerformanceState" role="status"></span>';
const anchor=document.getElementById('tfCanvasTools')||tree;
anchor.before(panel);
const selector=document.getElementById('nxPerformanceProfile'),status=document.getElementById('nxPerformanceState');
selector.value=setting;
const viewport=matchMedia('(max-width: 760px)'),motion=matchMedia('(prefers-reduced-motion: reduce)');
function apply(){
 const lite=setting==='lite'||setting==='auto'&&(viewport.matches||motion.matches);
 document.documentElement.classList.toggle('nx-performance-lite',lite);
 status.textContent=lite?'Lightweight tree effects active':'Original tree effects active';
 selector.setAttribute('aria-label','Talent Forge visual performance: '+setting);
}
selector.addEventListener('change',()=>{
 if(!allowed.has(selector.value))return;
 setting=selector.value;
 try{localStorage.setItem(KEY,setting)}catch(_){}
 apply();
});
viewport.addEventListener?.('change',apply);
motion.addEventListener?.('change',apply);
apply();
})();


/* v19 main companion bundled display controller: matches shared/nexus-experience-v19.js */
/* NEXUS | ADAPTIVE EXPERIENCE ENGINE v19.0.0
 * Visual presentation only. Does NOT read or mutate account, talents, missions,
 * media, files, saved builds or authentication. One isolated optional preference.
 * Zero remote dependencies, navigation interception, timers or analytics.
 */
(()=>{'use strict';
if(window.NexusVisualEngineV19)return;
const KEY='nexus_visual_presentation_v19',VALID=new Set(['auto','cinematic','balanced','quiet']);
const root=document.documentElement;
const narrow=matchMedia('(max-width: 700px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const touch=matchMedia('(pointer: coarse)');
const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection||null;
const path=location.pathname.toLowerCase();
function surface(){
 if(path.includes('/hub/'))return 'gateway';
 if(path.includes('/alchemist/'))return 'creator';
 if(path.includes('/world-atlas.html'))return 'atlas';
 if(path.includes('/command-center.html'))return 'command';
 if(path.includes('/player-experience.html'))return 'character';
 if(path.includes('/expedition-console.html')||path.includes('/adventure-operations.html'))return 'expedition';
 if(path.includes('/living-azeroth.html'))return 'living';
 return 'azeroth';
}
root.dataset.nx19Surface=surface();
let selected='auto';
try{const saved=localStorage.getItem(KEY);if(VALID.has(saved))selected=saved}catch(_){}
let selector=null,status=null;
function resolve(){
 if(selected!=='auto')return selected;
 // Respect explicit OS motion/data preferences and narrow touch viewports.
 if(reduced.matches||connection?.saveData||narrow.matches&&touch.matches)return 'quiet';
 return 'balanced';
}
function apply(){
 const resolved=resolve(),phone=narrow.matches;
 root.dataset.nx19Preset=selected;root.dataset.nx19Resolved=resolved;
 root.dataset.nx19Viewport=phone?'compact':'wide';
 root.classList.toggle('nx19-quiet',resolved==='quiet');
 root.classList.toggle('nx19-cinematic',resolved==='cinematic');
 if(selector)selector.value=selected;
 if(status){
  const detail=resolved==='quiet'?'Low-motion, lower-cost decorative effects':
    resolved==='cinematic'?'Extra decorative depth where motion is allowed':'Balanced presentation with responsive detail';
  status.textContent=(selected==='auto'?'AUTO → ':'')+resolved.toUpperCase()+' · '+detail;
 }
 // Listeners may pause purely decorative visuals; no content/data changes.
 window.dispatchEvent(new CustomEvent('nexus:visual-mode',{detail:{preset:selected,resolved,compact:phone}}));
}
function host(){
 const choices={
  gateway:'.topTools',creator:'.topbar',atlas:'.nx16-atlas-header',
  command:'.nx10-header-actions',character:'.px11-nav',
  expedition:'.nx165-header',living:'.lv9-topnav',azeroth:'.main .top'
 };
 return document.querySelector(choices[root.dataset.nx19Surface])||
  document.querySelector('header')||document.querySelector('main');
}
function install(){
 if(document.getElementById('nx19VisualMode'))return;
 document.querySelector('.hero,.nx10-hero,.nx16-atlas-hero,.nx165-hero,.nx17-hero')?.classList.add('nx19-aura');
 const parent=host();if(!parent)return;
 const menu=document.createElement('details');menu.id='nx19VisualMode';
 menu.className='nx19-visual-mode';
 menu.innerHTML='<summary aria-label="Open visual performance settings">✧ <span>VISUAL MODE</span></summary>'+
  '<div class="nx19-mode-panel"><div class="nx19-mode-title"><strong>VISUAL EXPERIENCE</strong>'+
  '<small>Presentation only · never changes account or saved work</small></div>'+
  '<label for="nx19Preset">DISPLAY PRESET</label>'+
  '<select id="nx19Preset"><option value="auto">AUTO · Adaptive device</option>'+
  '<option value="cinematic">CINEMATIC · Full atmosphere</option>'+
  '<option value="balanced">BALANCED · Refined visuals</option>'+
  '<option value="quiet">QUIET · Low-motion effects</option></select>'+
  '<p id="nx19ModeStatus" role="status"></p>'+
  '<p class="nx19-mode-note">System reduced-motion preferences remain respected even in Cinematic mode. Local preference applies to compatible NEXUS pages on this device only.</p>'+
  '<button type="button" id="nx19ModeClose">CLOSE SETTINGS</button></div>';
 parent.append(menu);
 selector=menu.querySelector('select');status=menu.querySelector('#nx19ModeStatus');
 selector.addEventListener('change',()=>{
  if(!VALID.has(selector.value))return;
  selected=selector.value;
  try{localStorage.setItem(KEY,selected)}catch(_){}
  apply();
 });
 menu.querySelector('#nx19ModeClose').addEventListener('click',()=>{menu.open=false;menu.querySelector('summary').focus()});
 menu.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus()}});
 document.addEventListener('pointerdown',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false},{passive:true});
 apply();
}
function onMedia(m){if(m.addEventListener)m.addEventListener('change',apply);else m.addListener?.(apply)}
onMedia(narrow);onMedia(reduced);onMedia(touch);
connection?.addEventListener?.('change',apply);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
window.addEventListener('pageshow',event=>{if(event.persisted)apply()});
const api=Object.freeze({key:KEY,getPreset:()=>selected,getResolved:resolve,surface:()=>root.dataset.nx19Surface});
Object.defineProperty(window,'NexusVisualEngineV19',{value:api,configurable:false,writable:false});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
apply();
})();