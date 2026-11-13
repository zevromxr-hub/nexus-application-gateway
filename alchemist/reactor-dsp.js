// PROXIMUS | ASSET ALCHEMIST — Reactor DSP
// Pure spectral band / peak tracker. An animation is never claimed to be audio-reactive
// unless a real audio stream has been connected and the analyser returns energy.
const clamp=(n,lo=0,hi=1)=>Math.min(hi,Math.max(lo,Number.isFinite(n)?n:lo));
export const REACTOR_THEMES={
 void:{name:'Void Sovereign',primary:'#a983ff',secondary:'#432188',glow:'#e8bdff',dark:'#070613'},
 celestial:{name:'Celestial Ascension',primary:'#f8c57e',secondary:'#8f5bea',glow:'#fff3c4',dark:'#110b24'},
 frost:{name:'Frost Sentinel',primary:'#80f2ff',secondary:'#205de0',glow:'#e0ffff',dark:'#040f28'},
 inferno:{name:'Ember Dominion',primary:'#ff8d84',secondary:'#eb3059',glow:'#ffdf93',dark:'#230616'},
 emerald:{name:'Emerald Reactor',primary:'#73e9ad',secondary:'#1c9e89',glow:'#d9ffe8',dark:'#041b1a'}
};
export function spectralBands(bins,sampleRate=48000,fftSize=2048){
 if(!bins||!bins.length||!Number.isFinite(sampleRate)||sampleRate<=0)return {sub:0,bass:0,mid:0,treble:0,energy:0};
 const hzPerBin=sampleRate/fftSize;
 function avg(lo,hi){
  const from=Math.min(bins.length-1,Math.max(0,Math.floor(lo/hzPerBin))),to=Math.min(bins.length,Math.max(from+1,Math.ceil(hi/hzPerBin)));
  let sum=0,count=0;
  for(let i=from;i<to;i++){const v=clamp(bins[i]/255);sum+=v*v;count++;}
  return count?Math.sqrt(sum/count):0;
 }
 const sub=avg(24,65),bass=avg(56,180),mid=avg(190,1800),treble=avg(1800,8000);
 return {sub,bass,mid,treble,energy:clamp(sub*.22+bass*.43+mid*.25+treble*.10)};
}
export function initialBeatState(){return {baseline:.09,peak:0,lastHit:-10000,kicks:0};}
export function detectBeat(bands,now,state=initialBeatState(),sensitivity=1.25){
 const raw=clamp((bands?.bass||0)*.72+(bands?.sub||0)*.28);
 const baseline=Math.max(.025,Number(state.baseline)||.09);
 const threshold=Math.max(.115,baseline*(1.72/Math.max(.5,Number(sensitivity)||1)));
 const ready=now-(Number(state.lastHit)||0)>235;
 const hit=raw>threshold&&raw>baseline+.065&&ready;
 const nextBaseline=baseline*.92+raw*.08;
 const peak=Math.max(raw,Number(state.peak||0)*.86);
 return {baseline:nextBaseline,peak,lastHit:hit?now:state.lastHit,kicks:(state.kicks||0)+(hit?1:0),hit,amplitude:raw,threshold};
}
export const REACTOR_SCENES=['sovereign','spectrum','rings','wave','portal','starlight'];
export function nextReactorScene(current){
 const i=REACTOR_SCENES.indexOf(current);return REACTOR_SCENES[(i<0?0:i+1)%REACTOR_SCENES.length];
}
export function normalizeReactorPreset(item){
 const themes=Object.keys(REACTOR_THEMES),modes=REACTOR_SCENES;
 const quality=['eco','balanced','cinema'];
 const n=(v,min,max,def)=>Number.isFinite(Number(v))?clamp(Number(v),min,max):def;
 return {
  theme:themes.includes(item?.theme)?item.theme:'void',
  mode:modes.includes(item?.mode)?item.mode:'sovereign',
  quality:quality.includes(item?.quality)?item.quality:'balanced',
  sensitivity:n(item?.sensitivity,.5,2.5,1.25),
  impact:n(item?.impact,.5,2.8,1.65),
  layers:n(item?.layers,.1,1,0.7),
  backgroundOpacity:n(item?.backgroundOpacity,.1,1,.7),
  backgroundFit:item?.backgroundFit==='contain'?'contain':'cover',
  autoShift:!!item?.autoShift, snow:!!item?.snow,
  signature:String(item?.signature||'PROXIMUS').slice(0,36),
  showSignature:item?.showSignature!==false,
  cycle:!!item?.cycle,cycleSeconds:n(item?.cycleSeconds,5,60,15),
  autoPerformance:item?.autoPerformance!==false,
  overlayOpacity:n(item?.overlayOpacity,.05,1,.45),
  overlayBlend:['screen','lighter','source-over','multiply'].includes(item?.overlayBlend)?item.overlayBlend:'screen'
 };
}
export function reactorDimensions(quality){
 return quality==='cinema'?{width:1280,height:720,fps:45}:quality==='eco'?{width:640,height:360,fps:24}:{width:960,height:540,fps:36};
}
