/* PROXIMUS v3.7 — Visual Pop settings.
 * Only CSS and animation preferences. No uploads, network access or edits to media DB.
 * Existing local media remains inside its original IndexedDB/OPFS storage. */
import {$} from './core.js';
export const VISUAL_POP_KEY='proximus-visual-pop-v370';
export function normalizeVisualPop(raw={}){
 const clamp=(x,min,max,def)=>Number.isFinite(Number(x))?Math.max(min,Math.min(max,Number(x))):def;
 return {
  preview:['balanced','cinema','still'].includes(raw?.preview)?raw.preview:'balanced',
  saturation:clamp(raw?.saturation,100,165,118),
  brightness:clamp(raw?.brightness,95,145,112),
  panels:clamp(raw?.panels,55,96,78),
  contrast:clamp(raw?.contrast,100,135,110)
 };
}
function read(){try{return normalizeVisualPop(JSON.parse(localStorage.getItem(VISUAL_POP_KEY)||'{}'))}catch{return normalizeVisualPop()}}
let state=read();
const apply=()=>{
 const html=document.documentElement;
 html.style.setProperty('--pv-saturation',state.saturation+'%');
 html.style.setProperty('--pv-brightness',state.brightness+'%');
 html.style.setProperty('--pv-contrast',state.contrast+'%');
 html.style.setProperty('--pv-panel-alpha',String(state.panels/100));
 html.dataset.pvPreview=state.preview;
 document.dispatchEvent(new Event('proximus-media-refresh'));
 document.dispatchEvent(new Event('proximus-vault-visual-refresh'));
};
export function currentVisualPop(){return {...state};}
export function initVisualPop(){
 const inputs={
  preview:$('mediaVisualProfile'),saturation:$('mediaThumbVibrancy'),
  brightness:$('mediaBackdropBoost'),panels:$('mediaPanelVisibility'),
  contrast:$('mediaThumbContrast')
 };
 const status=$('mediaVisualPopStatus'),preset=$('mediaCinematicPreset');
 if(!status||Object.values(inputs).some(x=>!x))return;
 const sync=()=>{
  for(const [key,node] of Object.entries(inputs))node.value=String(state[key]);
  status.textContent='Background boost '+state.brightness+'% · thumbnail color '+state.saturation+
   '% · contrast '+state.contrast+'% · panel readability '+state.panels+
   '% · '+(state.preview==='cinema'?'Cinema Live':state.preview==='still'?'Static Preview':'Balanced Live')+
   '. Originals are untouched; video previews are muted and decoder-limited.';
 };
 const save=()=>{
  try{localStorage.setItem(VISUAL_POP_KEY,JSON.stringify(state));}
  catch{status.textContent='Changes apply now but cannot be saved by this browser.'}
  apply();
 };
 for(const [key,node] of Object.entries(inputs))node.addEventListener(key==='preview'?'change':'input',()=>{
  state=normalizeVisualPop({...state,[key]:node.value});save();sync();
 });
 preset?.addEventListener('click',()=>{
  state=normalizeVisualPop({preview:'cinema',saturation:138,contrast:116,brightness:125,panels:66});
  sync();save();
  document.dispatchEvent(new CustomEvent('proximus-cinema-background-preset',{detail:{opacity:.85}}));
  status.textContent='Cinematic Pop enabled. Background visibility raised to 85% when a personal backdrop exists. The original file was not changed.';
 });
 $('mediaVisualReset')?.addEventListener('click',()=>{
  state=normalizeVisualPop();sync();save();
  status.textContent='Balanced presentation restored; your original media and saved backgrounds were not deleted.';
 });
 window.ProximusVisualPopV37=Object.freeze({current:currentVisualPop,previewMode:()=>state.preview});
 apply();sync();
}
