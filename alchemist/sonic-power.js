// PROXIMUS v3.5.4 | Mobile Power Guard — power workload budgets, never device-temperature claims.
export const POWER_KEY='proximus-sonic-power-v1';
export const POWER_MODES=Object.freeze(['auto','cool','audio','smooth']);
export function normalizePower(raw={}){
 const o=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 return {mode:POWER_MODES.includes(o.mode)?o.mode:'auto'};
}
export function isAppleMobileAgent(agent=''){
 return /\b(iPhone|iPod|iPad)\b/i.test(String(agent));
}
export function powerPlan(raw={},{
 mobile=false,quality='balanced',recording=false,reducedMotion=false,autoSlow=false
}={}){
 const {mode}=normalizePower(raw);
 // Desktop stays at the user's chosen Reactor quality unless they explicitly request a power profile.
 if(!mobile&&mode==='auto')return {mode,fps:quality==='eco'?30:quality==='cinema'?60:45,
  width:null,height:null,quality,backgroundPause:false,siteAmbientPause:false,draw:true,limited:false};
 // Capturing exports should never silently become blank or lower quality: the app's
 // original rendering path is temporarily restored when explicitly recording.
 if(recording)return {mode,fps:quality==='eco'?30:quality==='cinema'?60:45,
  width:null,height:null,quality,backgroundPause:false,siteAmbientPause:false,draw:true,limited:false};
 if(mode==='audio')return {mode,fps:0,width:480,height:270,quality:'eco',
  backgroundPause:true,siteAmbientPause:true,draw:false,limited:true};
 if(mode==='cool'||mobile&&reducedMotion||mobile&&mode==='auto'&&autoSlow)
  return {mode,fps:15,width:480,height:270,quality:'eco',
   backgroundPause:true,siteAmbientPause:true,draw:true,limited:true};
 if(mode==='smooth')return {mode,fps:30,width:640,height:360,quality:'eco',
  backgroundPause:false,siteAmbientPause:false,draw:true,limited:true};
 // Safari/iPhone default: a substantial workload reduction without disabling Sonic worlds.
 return {mode,fps:24,width:640,height:360,quality:'eco',
  backgroundPause:false,siteAmbientPause:true,draw:true,limited:true};
}
export function frameDue(now,previous,fps){
 if(!(fps>0)||!Number.isFinite(now))return false;
 return !Number.isFinite(previous)||previous<=0||now-previous>=1000/fps-1;
}
