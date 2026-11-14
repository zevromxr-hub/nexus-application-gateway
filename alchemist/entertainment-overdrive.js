// PROXIMUS v3.5.0 | Entertainment Overdrive — additive Companion Center + cinema controls.
import {$} from './core.js';
import {saveOrShare} from './portable-kit.js';
import {OVERDRIVE_KEY,BUILTIN_SCENES,normalizeOverdriveSettings,currentScene,exportOverdrivePack,importOverdrivePack,displayProfile,hexToRGB,averageFrameColor,mixRGB} from './overdrive-core.js';

export function initEntertainmentOverdrive(app){
 const hub=$('overdriveHub'),select=$('overdriveScene'),name=$('overdriveSceneName');
 const ambient=$('overdriveAtmosphere'),glow=$('overdriveGlow'),quality=$('overdriveQuality');
 const status=$('overdriveStatus'),cinemaStatus=$('overdriveCinemaStatus');
 if(!hub||!select||!ambient||!glow||!quality)return;
 const vaultVideo=$('videoVaultPlayer'),theaterVideo=$('theaterVideo');
 const stages=[[vaultVideo,vaultVideo?.closest('.video-vault-stage')],[theaterVideo,$('theaterStage')]];
 let settings;
 try{settings=normalizeOverdriveSettings(JSON.parse(localStorage.getItem(OVERDRIVE_KEY)||'{}'));}
 catch{settings=normalizeOverdriveSettings();}
 const sampler=document.createElement('canvas');sampler.width=12;sampler.height=8;
 const context=sampler.getContext('2d',{willReadFrequently:true});
 const lastSample=new WeakMap();
 const say=(message,error=false)=>{
  if(status){status.textContent=message;status.dataset.error=error?'true':'false';}
  if(cinemaStatus){cinemaStatus.textContent=message;cinemaStatus.dataset.error=error?'true':'false';}
 };
 function persist(){
  try{localStorage.setItem(OVERDRIVE_KEY,JSON.stringify(settings));}
  catch{say('Scene changed, but this browser cannot save preferences. Export a scene backup.',true);}
 }
 function chosen(){return currentScene(settings);}
 function setStages(){
  const scene=chosen(),base=hexToRGB(scene.color),profile=displayProfile(settings.quality,{
   width:window.innerWidth,
   reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true,
   coarse:window.matchMedia?.('(pointer: coarse)')?.matches===true
  });
  const strength=Math.round(settings.glow*profile.glowScale);
  for(const [video,stage] of stages){
   if(!stage)return;
   stage.classList.toggle('overdrive-ambient',settings.ambient);
   stage.dataset.overdriveQuality=profile.mode;
   stage.style.setProperty('--overdrive-rgb',base.join(','));
   stage.style.setProperty('--overdrive-strength',String(Math.min(100,strength)/100));
  }
  const label=scene.name+' · '+profile.mode;
  $('overdriveCurrentScene').textContent=label;
  $('overdriveGlowValue').textContent=String(settings.glow)+'%';
  $('overdriveCinemaScene').textContent=label;
  // A scene is a shared reusable preset, but does not overwrite unrelated Reactor settings.
  return profile;
 }
 function updateSelect(){
  const all=[...BUILTIN_SCENES,...settings.customScenes];
  select.replaceChildren();
  for(const scene of all){
   const option=document.createElement('option');option.value=scene.id;option.textContent=scene.name;
   select.append(option);
  }
  select.value=settings.sceneId;
  $('overdriveDelete').disabled=!settings.customScenes.some(x=>x.id===settings.sceneId);
 }
 function refreshUI(){
  updateSelect();ambient.checked=settings.ambient;glow.value=String(settings.glow);quality.value=settings.quality;setStages();
 }
 function applyAndSave(message){
  settings=normalizeOverdriveSettings(settings);refreshUI();persist();if(message)say(message);
 }
 function selectTheme(){
  const select=$('theaterTheme'),palette=chosen().palette;
  if(select&&Array.from(select.options).some(option=>option.value===palette)){
   select.value=palette;
   select.dispatchEvent(new Event('change',{bubbles:true}));
  }
 }
 function sample(video,stage){
  if(!settings.ambient||!context||document.hidden||!video||!stage||video.paused||video.readyState<2||stage.closest('.studio')?.hidden)return;
  const profile=displayProfile(settings.quality,{
   width:window.innerWidth,
   reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true,
   coarse:window.matchMedia?.('(pointer: coarse)')?.matches===true
  });
  const now=performance.now();if(now-(lastSample.get(video)||0)<profile.sampleMs)return;
  lastSample.set(video,now);
  try{
   context.drawImage(video,0,0,sampler.width,sampler.height);
   const pixel=context.getImageData(0,0,sampler.width,sampler.height).data;
   const rgb=mixRGB(hexToRGB(chosen().color),averageFrameColor(pixel),.58);
   stage.style.setProperty('--overdrive-rgb',rgb.join(','));
  }catch{
   // SecurityError (cross-origin video) or unsupported frame drawing:
   // retain a safe static scene; never attempt to bypass media restrictions.
   stage.style.setProperty('--overdrive-rgb',hexToRGB(chosen().color).join(','));
  }
 }
 for(const [video,stage] of stages){
  if(!video||!stage)continue;
  for(const event of ['play','timeupdate','seeked','loadeddata'])video.addEventListener(event,()=>sample(video,stage));
 }
 for(const button of hub.querySelectorAll('[data-overdrive-target]')){
  button.addEventListener('click',()=>{
   const target=button.dataset.overdriveTarget;
   if(['videos','theater','reactor','arcade','animation'].includes(target))app.changeView(target);
  });
 }
 select.addEventListener('change',()=>{
  settings.sceneId=select.value;applyAndSave('Scene activated for Cinema and Media Theater.');selectTheme();
 });
 quality.addEventListener('change',()=>{settings.quality=quality.value;applyAndSave('Visual quality set to '+settings.quality+'.');});
 ambient.addEventListener('change',()=>{settings.ambient=ambient.checked;applyAndSave(settings.ambient?'Atmosphere Sync enabled.':'Atmosphere Sync disabled.');});
 glow.addEventListener('input',()=>{settings.glow=Number(glow.value);setStages();});
 glow.addEventListener('change',()=>applyAndSave('Ambient glow saved at '+settings.glow+'%.'));
 $('overdriveSave').addEventListener('click',()=>{
  const title=String(name.value||'').trim().slice(0,48);
  if(!title){say('Enter a preset name before saving.',true);name.focus();return;}
  if(settings.customScenes.length>=20){say('Maximum 20 custom scenes; remove one before saving another.',true);return;}
  const source=chosen();
  const preset={id:'custom-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),name:title,color:source.color,palette:source.palette};
  settings.customScenes.push(preset);settings.sceneId=preset.id;
  name.value='';applyAndSave('Custom scene saved on this browser: '+title+'.');
 });
 $('overdriveDelete').addEventListener('click',()=>{
  if(!settings.sceneId.startsWith('custom-'))return;
  settings.customScenes=settings.customScenes.filter(x=>x.id!==settings.sceneId);
  settings.sceneId='nebula';applyAndSave('Custom scene removed. Built-in scenes remain unchanged.');
 });
 $('overdriveExport').addEventListener('click',async()=>{
  try{
   const blob=new Blob([JSON.stringify(exportOverdrivePack(settings),null,2)],{type:'application/json'});
   await saveOrShare(blob,'PROXIMUS-OVERDRIVE-SCENES.json',{preferShare:true});
   say('Scene settings exported. Media files are not included.');
  }catch(error){say('Export unsuccessful: '+error.message,true);}
 });
 $('overdriveImport').addEventListener('change',async event=>{
  const file=event.currentTarget.files?.[0];
  if(!file)return;
  try{
   if(file.size>150000)throw Error('Scene file is too large (150 KB max).');
   const imported=importOverdrivePack(JSON.parse(await file.text()));
   settings=imported;applyAndSave('Scene backup imported successfully. Existing media files were not modified.');selectTheme();
  }catch(error){say('Import failed: '+error.message,true);}
  finally{event.currentTarget.value='';}
 });
 $('overdriveToProjects').addEventListener('click',()=>{
  try{
   app.addAsset('PROXIMUS-OVERDRIVE-SCENE.json',new Blob([JSON.stringify(exportOverdrivePack(settings),null,2)],{type:'application/json'}),'Entertainment Overdrive');
   say('Scene manifest saved to Project Hub → Collected Exports.');
  }catch(error){say('Could not add scene to Project Hub: '+error.message,true);}
 });
 $('overdriveCinemaJump').addEventListener('click',()=>app.changeView('videos'));
 window.addEventListener('resize',setStages,{passive:true});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)setStages();});
 document.addEventListener('proximus-view-changed',()=>setStages());
 refreshUI();
 say('Entertainment Overdrive ready · scenes remain local to this browser.');
}
