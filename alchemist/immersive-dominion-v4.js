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
