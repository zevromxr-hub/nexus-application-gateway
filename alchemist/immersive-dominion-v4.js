/* PROXIMUS v4.0 immersive UI entrypoint */
import {IMMERSION_KEY,IMMERSION_SCENES,normalizeImmersion} from './immersion-core-v4.js';
const $=id=>document.getElementById(id);
export function initImmersiveDominion(app){
 const dialog=$('px40Dialog');if(!dialog)return;
 let config=normalizeImmersion();
 try{config=normalizeImmersion(JSON.parse(localStorage.getItem(IMMERSION_KEY)||'{}'))}catch{}
 const html=document.documentElement,reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const mobile=/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)||matchMedia('(pointer:coarse)').matches;
 function render(){
  const c=IMMERSION_SCENES[config.scene];
  for(const [k,v] of Object.entries({'--px40-main':c.main,'--px40-alt':c.alt,'--px40-glow':c.glow,'--px40-dark':c.dark,'--px40-intensity':config.intensity/100,'--px40-glass':config.glass/100,'--px40-veil':config.clarity==='bright'?'.10':'.36'}))html.style.setProperty(k,v);
  html.dataset.px40Scene=config.scene;html.dataset.px40Clarity=config.clarity;
  html.dataset.px40Motion=reduced.matches||config.motion==='off'||config.motion==='auto'&&mobile?'off':'on';
  $('px40CurrentRealm').textContent=c.name;
  $('px40PowerStatus').textContent=html.dataset.px40Motion==='off'?'Battery-conscious visuals':'Subtle atmospheric motion';
  $('px40Intensity').value=config.intensity;$('px40IntensityValue').textContent=config.intensity+'%';
  $('px40Glass').value=config.glass;$('px40GlassValue').textContent=config.glass+'%';
  $('px40Motion').value=config.motion;$('px40Clarity').value=config.clarity;
