// PROXIMUS | ASSET ALCHEMIST — Visual Identity System v3.0
// Validated, device-local design presets. No code injection or remote theme CSS.
export const IDENTITY_STORAGE='proximus-visual-identity-v1';
export const IDENTITY_SCHEMA='proximus.visual-identity/1';
export const IDENTITY_PALETTES={
 sovereign:{name:'Sovereign Violet',accent:'#b38aff',secondary:'#e9bc7e',glow:'#b895ff',base:'#090913',panel:'#151027',border:'#514071'},
 solar:{name:'Solar Dominion',accent:'#f4bd69',secondary:'#a891ff',glow:'#ffe2a0',base:'#120c16',panel:'#221528',border:'#896342'},
 abyss:{name:'Abyssal Cyan',accent:'#68dbf9',secondary:'#ab86f3',glow:'#adf9ff',base:'#06101c',panel:'#0f2030',border:'#315f7e'},
 ember:{name:'Crimson Ember',accent:'#f78e87',secondary:'#f3bc78',glow:'#ffb2a6',base:'#180b15',panel:'#2b1323',border:'#873f5b'},
 emerald:{name:'Emerald Ascendant',accent:'#75e0aa',secondary:'#bed58d',glow:'#b4ffdc',base:'#071913',panel:'#10271d',border:'#3b785c'},
 frost:{name:'Frost Sentinel',accent:'#9ddcff',secondary:'#c0bcff',glow:'#e0f6ff',base:'#0b1220',panel:'#172236',border:'#466789'}
};
const HEX=/^#[0-9a-fA-F]{6}$/;
const allowedSet=new Set(Object.keys(IDENTITY_PALETTES));
const clamp=(n,a,b,d)=>Number.isFinite(Number(n))?Math.min(b,Math.max(a,Number(n))):d;
export const DEFAULT_IDENTITY={
 schema:IDENTITY_SCHEMA,palette:'sovereign',customColors:null,glow:.65,borderStyle:'soft',
 motion:'ambient',fontScale:1,applyReactor:false,applyMasterMedia:true,
 enabled:true,exempt:['tokens'],schedule:{enabled:false,day:'solar',night:'sovereign',start:8,end:20},
 favorites:[],saved:[]
};
export function safeHex(value,fallback='#b38aff'){
 return typeof value==='string'&&HEX.test(value)?value.toLowerCase():fallback;
}
export function normalizeIdentity(input={}){
 const x=input&&typeof input==='object'&&!Array.isArray(input)?input:{};
 const palette=allowedSet.has(x.palette)?x.palette:'sovereign';
 const base=IDENTITY_PALETTES[palette];
 const c=x.customColors&&typeof x.customColors==='object'?x.customColors:null;
 const customColors=c?{
  accent:safeHex(c.accent,base.accent),secondary:safeHex(c.secondary,base.secondary),
  glow:safeHex(c.glow,base.glow),base:safeHex(c.base,base.base),
  panel:safeHex(c.panel,base.panel),border:safeHex(c.border,base.border)
 }:null;
 const schedule=x.schedule&&typeof x.schedule==='object'?x.schedule:{};
 return {
  schema:IDENTITY_SCHEMA,palette,customColors,
  glow:clamp(x.glow,0,1,.65),
  borderStyle:['soft','sharp','glass'].includes(x.borderStyle)?x.borderStyle:'soft',
  motion:['still','ambient','dynamic'].includes(x.motion)?x.motion:'ambient',
  fontScale:clamp(x.fontScale,.9,1.2,1),
  applyReactor:x.applyReactor===true,applyMasterMedia:x.applyMasterMedia!==false,enabled:x.enabled!==false,
  exempt:Array.isArray(x.exempt)?[...new Set(x.exempt.filter(y=>typeof y==='string'&&/^[a-z]+$/.test(y)))].slice(0,45):['tokens'],
  schedule:{
   enabled:schedule.enabled===true,
   day:allowedSet.has(schedule.day)?schedule.day:'solar',
   night:allowedSet.has(schedule.night)?schedule.night:'sovereign',
   start:Math.floor(clamp(schedule.start,0,23,8)),
   end:Math.floor(clamp(schedule.end,0,23,20))
  },
  favorites:Array.isArray(x.favorites)?x.favorites.filter(v=>allowedSet.has(v)).slice(0,6):[],
  saved:Array.isArray(x.saved)?x.saved.slice(0,12).filter(v=>v&&typeof v.name==='string').map(v=>({
   name:v.name.slice(0,42),value:{palette:allowedSet.has(v.value?.palette)?v.value.palette:palette,
    colors:v.value?.colors&&typeof v.value.colors==='object'?{
     accent:safeHex(v.value.colors.accent,base.accent),secondary:safeHex(v.value.colors.secondary,base.secondary),
     glow:safeHex(v.value.colors.glow,base.glow),base:safeHex(v.value.colors.base,base.base),
     panel:safeHex(v.value.colors.panel,base.panel),border:safeHex(v.value.colors.border,base.border)
    }:null}
  })):[]
 };
}
export function identityForHour(state,hour){
 const x=normalizeIdentity(state),s=x.schedule;
 if(!s.enabled)return x.palette;
 const inDay=s.start===s.end?true:s.start<s.end?hour>=s.start&&hour<s.end:hour>=s.start||hour<s.end;
 return inDay?s.day:s.night;
}
export function colorsForIdentity(state,hour=new Date().getHours()){
 const v=normalizeIdentity(state),key=identityForHour(v,hour);
 return {palette:key,colors:(key===v.palette&&v.customColors)?v.customColors:IDENTITY_PALETTES[key]};
}
export function identityAsCSS(vars,glow=.65){
 const colors=vars.colors||vars;
 const glowNum=clamp(glow,0,1,.65);
 return {
  '--identity-accent':safeHex(colors.accent),
  '--identity-secondary':safeHex(colors.secondary,'#ecbc7c'),
  '--identity-glow':safeHex(colors.glow,'#b895ff'),
  '--identity-base':safeHex(colors.base,'#090913'),
  '--identity-panel':safeHex(colors.panel,'#151027'),
  '--identity-border':safeHex(colors.border,'#514071'),
  '--identity-glow-strength':String(glowNum)
 };
}
export function identityBackup(state){
 return {schema:IDENTITY_SCHEMA,exported:new Date().toISOString(),identity:normalizeIdentity(state)};
}
export function readIdentityBackup(json){
 if(!json||json.schema!==IDENTITY_SCHEMA||!json.identity||typeof json.identity!=='object')throw Error('Unsupported PROXIMUS identity backup');
 return normalizeIdentity(json.identity);
}
