// PROXIMUS | ASSET ALCHEMIST v3.0 — Sovereign Reactor IV effect engine
// Deterministic, real-audio-driven visual mapping. Never synthesizes audio data.
import {REACTOR_SCENES} from './reactor-dsp.js';
const clamp=(n,lo,hi,otherwise)=>Number.isFinite(Number(n))?Math.min(hi,Math.max(lo,Number(n))):otherwise;
export const REACTOR_IV_PRESETS={
 dominion:{label:'Dominion Impact',sub:1.9,bass:2.3,mid:1.05,treble:.85,shock:1.8,particles:.65,mask:'wings',transition:'flash'},
 celestial:{label:'Celestial Radiance',sub:.8,bass:1.25,mid:1.55,treble:1.8,shock:1.15,particles:1.35,mask:'halo',transition:'fade'},
 hyperspace:{label:'Hyperspace Reactor',sub:1.3,bass:1.6,mid:1.3,treble:1.7,shock:1.4,particles:1.4,mask:'bars',transition:'sweep'},
 frost:{label:'Frost Precision',sub:.75,bass:1,mid:1.5,treble:1.9,shock:.8,particles:1.2,mask:'eclipse',transition:'fade'},
 abyss:{label:'Abyssal Singularity',sub:2,bass:1.6,mid:.9,treble:.65,shock:1.25,particles:.65,mask:'halo',transition:'sweep'}
};
export const REACTOR_MASKS=['none','halo','wings','bars','eclipse'];
export const REACTOR_TRANSITIONS=['flash','fade','sweep'];
export function normalizeEffectSettings(raw={}){
 const v=raw&&typeof raw==='object'?raw:{};
 const base=REACTOR_IV_PRESETS[v.preset]||REACTOR_IV_PRESETS.dominion;
 return {
  preset:REACTOR_IV_PRESETS[v.preset]?v.preset:'dominion',
  sub:clamp(v.sub,.1,3,base.sub),
  bass:clamp(v.bass,.1,3,base.bass),
  mid:clamp(v.mid,.1,3,base.mid),
  treble:clamp(v.treble,.1,3,base.treble),
  shock:clamp(v.shock,0,2,base.shock),
  particles:clamp(v.particles,0,2,base.particles),
  mask:REACTOR_MASKS.includes(v.mask)?v.mask:base.mask,
  transition:REACTOR_TRANSITIONS.includes(v.transition)?v.transition:base.transition,
  reactiveOverlay:v.reactiveOverlay!==false,
  showMarkers:v.showMarkers!==false,
  beatSceneChange:v.beatSceneChange===true,
  sceneOrder:normalizeSceneOrder(v.sceneOrder)
 };
}
export function normalizeSceneOrder(list){
 const names=Array.isArray(list)?list:['sovereign','portal','rings','wave'];
 const cleaned=names.filter(name=>REACTOR_SCENES.includes(name)).slice(0,6);
 return cleaned.length?cleaned:['sovereign','portal','rings','wave'];
}
export function nextSceneInOrder(current,list){
 const order=normalizeSceneOrder(list),index=order.indexOf(current);
 return order[(index+1)%order.length];
}
export function effectLevels(bands={},mapping={},beat=false){
 const p=normalizeEffectSettings(mapping);
 const power=(key)=>clamp(bands[key],0,1,0)*p[key];
 return {
  aura:Math.min(2,power('sub')*.7+power('bass')*.48),
  impact:Math.min(2,power('bass')*p.shock*(beat?1.35:.4)),
  emissive:Math.min(2,power('mid')*.77+power('bass')*.28),
  shimmer:Math.min(2,power('treble')*p.particles),
  overlay:Math.min(1,.15+power('bass')*.22+power('mid')*.24),
  mask:p.mask,transition:p.transition
 };
}
export function transitionProgress(now,changedAt,duration=650){
 return Math.max(0,Math.min(1,(now-changedAt)/duration));
}
export function pulseDecay(now,lastBeat,timeConstant=270){
 if(!Number.isFinite(lastBeat)||lastBeat<0||now<lastBeat)return 0;
 return Math.max(0,Math.min(1,Math.exp(-(now-lastBeat)/timeConstant)));
}
