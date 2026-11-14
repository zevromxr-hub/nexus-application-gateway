// PROXIMUS | Entertainment Overdrive v3.5.0 — portable, dependency-free scene schema.
export const OVERDRIVE_KEY='proximus-overdrive-settings-v1';
export const OVERDRIVE_SCHEMA='proximus.overdrive.scenes/1';
export const BUILTIN_SCENES=Object.freeze([
 {id:'nebula',name:'Nebula Violet',color:'#8c6aff',palette:'violet'},
 {id:'cyber',name:'Cyber Cyan',color:'#35bcf2',palette:'cyan'},
 {id:'solar',name:'Solar Gold',color:'#e5ab59',palette:'gold'},
 {id:'ember',name:'Ember Rift',color:'#db617c',palette:'ember'},
 {id:'emerald',name:'Emerald Horizon',color:'#44c7a5',palette:'emerald'}
]);
const hex=/^#[0-9a-fA-F]{6}$/;
const palettes=new Set(BUILTIN_SCENES.map(s=>s.palette));
const qualitySet=new Set(['auto','efficiency','overdrive']);
const limited=(n,a,b,fallback)=>Number.isFinite(Number(n))?Math.max(a,Math.min(b,Number(n))):fallback;
export function normalizeScene(scene){
 if(!scene||typeof scene!=='object')return null;
 const name=String(scene.name||'').trim().slice(0,48);
 const color=String(scene.color||'').trim();
 const palette=String(scene.palette||'violet');
 const id=String(scene.id||'').slice(0,72);
 if(!name||!hex.test(color)||!palettes.has(palette)||!/^custom-[a-z0-9-]+$/.test(id))return null;
 return {id,name,color:color.toLowerCase(),palette};
}
export function normalizeOverdriveSettings(raw={}){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))raw={};
 const customs=[];const ids=new Set();
 if(Array.isArray(raw.customScenes))for(const item of raw.customScenes.slice(0,40)){
  const scene=normalizeScene(item);
  if(scene&&!ids.has(scene.id)&&customs.length<20){customs.push(scene);ids.add(scene.id);}
 }
 const valid=new Set([...BUILTIN_SCENES.map(s=>s.id),...customs.map(s=>s.id)]);
 const sceneId=String(raw.sceneId||'nebula');
 return {
  sceneId:valid.has(sceneId)?sceneId:'nebula',
  ambient:raw.ambient!==false,
  glow:Math.round(limited(raw.glow,0,100,62)),
  quality:qualitySet.has(raw.quality)?raw.quality:'auto',
  customScenes:customs
 };
}
export function currentScene(settings){
 const s=normalizeOverdriveSettings(settings);
 return [...BUILTIN_SCENES,...s.customScenes].find(item=>item.id===s.sceneId)||BUILTIN_SCENES[0];
}
export function exportOverdrivePack(settings){
 return {schema:OVERDRIVE_SCHEMA,product:'PROXIMUS | ENTERTAINMENT OVERDRIVE',exportedAt:new Date().toISOString(),settings:normalizeOverdriveSettings(settings)};
}
export function importOverdrivePack(pack){
 if(!pack||pack.schema!==OVERDRIVE_SCHEMA||!pack.settings||typeof pack.settings!=='object')throw Error('This is not a compatible PROXIMUS Overdrive scene backup.');
 if(Array.isArray(pack.settings.customScenes)&&pack.settings.customScenes.length>20)throw Error('Scene backup contains too many custom presets.');
 return normalizeOverdriveSettings(pack.settings);
}
export function displayProfile(quality,{width=1024,reducedMotion=false,coarse=false}={}){
 if(reducedMotion)return {mode:'efficiency',sampleMs:2400,glowScale:0.35};
 const mode=quality==='auto'?((width<=720&&coarse)?'efficiency':'balanced'):quality;
 if(mode==='efficiency')return {mode,sampleMs:2000,glowScale:0.55};
 if(mode==='overdrive')return {mode,sampleMs:650,glowScale:1.25};
 return {mode:'balanced',sampleMs:1100,glowScale:1};
}
export function averageFrameColor(data,fallback=[140,106,255]){
 if(!data||!data.length)return fallback.slice();
 let r=0,g=0,b=0,count=0;
 for(let i=0;i+3<data.length;i+=4){
  if(data[i+3]<160)continue;
  const light=(data[i]+data[i+1]+data[i+2])/3;
  if(light<14)continue;
  r+=data[i];g+=data[i+1];b+=data[i+2];count++;
 }
 if(!count)return fallback.slice();
 return [Math.round(r/count),Math.round(g/count),Math.round(b/count)];
}
export function hexToRGB(input){
 const value=hex.test(input)?input:'#8c6aff';
 return [1,3,5].map(offset=>parseInt(value.slice(offset,offset+2),16));
}
export function mixRGB(base,sample,weight=0.55){
 const w=limited(weight,0,1,0.55);
 return base.map((n,i)=>Math.round(limited(n*(1-w)+sample[i]*w,0,255,n)));
}
