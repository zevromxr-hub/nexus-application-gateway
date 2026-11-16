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
