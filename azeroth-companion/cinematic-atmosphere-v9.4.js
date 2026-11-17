/* NEXUS | AZEROTH v9.4 — contextual, performance-aware hero atmosphere.
 * Decorative DOM only. Reads existing visual preference; does not change it.
 * No intervals, observers, storage writes, APIs, analytics or external assets.
 */
(()=>{'use strict';
const body=document.body;if(!body)return;
const scene=body.getAttribute('data-nx-art-page');
if(!['sovereign','character','progression','oracle','addon'].includes(scene))return;
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let stored='';try{stored=localStorage.getItem('nexus_visual_mode_v9')||''}catch(_){}
const lowPower=!!(navigator.connection&&navigator.connection.saveData)||
              !!(navigator.deviceMemory&&navigator.deviceMemory<=2);
if(reduced||stored==='performance'||lowPower){body.classList.add('nx94-performance');return}
const host=scene==='sovereign'?document.querySelector('main .intro'):
  document.querySelector('main .nx-art-banner')||document.querySelector('main .hero');
if(!host||host.querySelector('.nx94-atmosphere'))return;
const layer=document.createElement('div');layer.className='nx94-atmosphere';
layer.setAttribute('aria-hidden','true');
const count=window.matchMedia('(max-width:760px)').matches?8:(stored==='balanced'?12:18);
const hash=n=>{const v=Math.sin((n+1)*78.233)*43758.5453;return v-Math.floor(v)};
const frag=document.createDocumentFragment();
for(let i=0;i<count;i++){
 const p=document.createElement('i');
 p.style.setProperty('--nx94-x',(hash(i*7+3)*99).toFixed(2)+'%');
 p.style.setProperty('--nx94-size',(1.4+hash(i*5+9)*2.8).toFixed(2)+'px');
 p.style.setProperty('--nx94-opacity',(0.22+hash(i*3+17)*0.44).toFixed(2));
 p.style.setProperty('--nx94-duration',(10+hash(i*11+2)*13).toFixed(2)+'s');
 p.style.setProperty('--nx94-delay',(-hash(i*13+1)*23).toFixed(2)+'s');
 p.style.setProperty('--nx94-drift',((hash(i*5+21)-.5)*75).toFixed(1)+'px');
 frag.append(p);
}
layer.append(frag);host.append(layer);
const visibility=()=>body.classList.toggle('nx94-paused',document.hidden);
document.addEventListener('visibilitychange',visibility,{passive:true});visibility();
})();
