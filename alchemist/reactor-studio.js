// PROXIMUS | ASSET ALCHEMIST v2.7 — SOVEREIGN REACTOR
// Local file, permissioned microphone and desktop browser-tab audio visualizer.
// No access to protected/iOS system audio. No remote uploads or hidden capture.
import {$,bytes,safe,stem,notice,download,blobCanvas,textFile,wrap} from './core.js';
import {saveOrShare} from './portable-kit.js';
import {encodeGif} from './gif-codec.js';
import {parseGifFrames,createGifFrameRenderer} from './gif-reader.js';
import {REACTOR_THEMES,spectralBands,initialBeatState,detectBeat,normalizeReactorPreset,reactorDimensions,nextReactorScene} from './reactor-dsp.js';
import {REACTOR_IV_PRESETS,normalizeEffectSettings,effectLevels,nextSceneInOrder,pulseDecay,transitionProgress} from './reactor-iv.js';
import {SONIC_KEY,SONIC_SCHEMA,normalizeSonic,sonicWorld,nextSonicWorld,sonicBackup,readSonicBackup,drawSonicDimension,shouldCycleSonic} from './sonic-dimension.js';
import {OVERDRIVE_KEY,normalizeOverdriveSettings,currentScene} from './overdrive-core.js';
import {POWER_KEY,normalizePower,isAppleMobileAgent,powerPlan,frameDue} from './sonic-power.js';

const SETTINGS='proximus-reactor-settings-v1',DB='proximus-reactor-media-v1';
const MAX_BACKDROP=55000000,MAX_AUDIO=250000000;
const supportedBackdrop=file=>/^(image\/gif|image\/png|image\/jpeg|image\/webp|video\/mp4|video\/webm)$/.test(file?.type||'')||
 /\.(?:gif|png|jpe?g|webp|mp4|webm)$/i.test(file?.name||'');
const isBackdropVideo=file=>file.type.startsWith('video/')||/\.(?:mp4|webm)$/i.test(file.name||'');
function openMediaStore(){
 return new Promise((resolve,reject)=>{
  if(!indexedDB)return reject(Error('Media storage is unavailable in this browser.'));
  const req=indexedDB.open(DB,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('media'))req.result.createObjectStore('media');};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('Could not open private media storage.'));
 });
}
async function mediaTransaction(type,callback){
 const db=await openMediaStore();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction('media',type),request=callback(tx.objectStore('media'));
  let out;
  if(request)request.onsuccess=()=>out=request.result;
  tx.oncomplete=()=>resolve(out);
  tx.onerror=tx.onabort=()=>reject(tx.error||Error('Browser media storage could not be updated.'));
 });}finally{db.close();}
}
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const clamp=(x,a,b)=>Math.min(b,Math.max(a,x));
const fit=(ctx,source,w,h,mode)=>{
 const iw=source.videoWidth||source.naturalWidth||source.width,ih=source.videoHeight||source.naturalHeight||source.height;
 if(!iw||!ih)return;
 const scale=mode==='contain'?Math.min(w/iw,h/ih):Math.max(w/iw,h/ih);
 ctx.drawImage(source,(w-iw*scale)/2,(h-ih*scale)/2,iw*scale,ih*scale);
};
const color=(hex,a)=>{
 if(a>=1)return hex;
 const value=hex.replace('#','');
 return 'rgba('+parseInt(value.slice(0,2),16)+','+parseInt(value.slice(2,4),16)+','+parseInt(value.slice(4,6),16)+','+clamp(a,0,1)+')';
};

export function initSovereignReactor(app){
 const canvas=$('reactorCanvas');if(!canvas)return;
 const ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:false});
 const audio=$('reactorAudio'),fileInput=$('reactorInputFile'),backgroundInput=$('reactorBgFile');
 const backgroundVideo=$('reactorBgVideo'),backgroundImage=$('reactorBgImage');
 const sourceStatus=$('reactorSourceStatus'),activity=$('reactorActivity'),result=$('reactorExportStatus');
 const stage=$('reactorStage');
 let current='off',source=null,stream=null,sourceNode=null,mediaNode=null,selectedAudio=null,audioUrl=null;
 let audioContext=null,analyser=null,frequency=null;
 let sharedSpectrum=null,sharedSampleRate=44100,sharedFFT=1024,sharedActive=false,sharedUpdated=0;
 let mediaURL=null,mediaRecord=null,videoReady=false,gifBackdrop=null;
 const overlayVideo=$('reactorOverlayVideo'),overlayImage=$('reactorOverlayImage');
 let overlayURL=null,overlayReady=false,gifOverlay=null;
 let runtimeMode='sovereign',nextSceneAt=0,history=[],lastHistory=0,sceneChangedAt=-10000;
 let fxSettings=normalizeEffectSettings(),identityColors=null;
 let sonicSettings=normalizeSonic(),linkedColor=null,sonicBeatPhase=0,sonicCycleAt=performance.now(),sonicCycleBeats=0;
 try{sonicSettings=normalizeSonic(JSON.parse(localStorage.getItem(SONIC_KEY)||'{}'));}catch(e){}
 function updateLinkedColor(){
  try{linkedColor=currentScene(normalizeOverdriveSettings(JSON.parse(localStorage.getItem(OVERDRIVE_KEY)||'{}'))).color;}
  catch(e){linkedColor=null;}
 }
 updateLinkedColor();
 document.addEventListener('proximus-overdrive-scene-changed',updateLinkedColor);
 window.addEventListener('storage',e=>{if(e.key===OVERDRIVE_KEY)updateLinkedColor();});
 let sampleStart=0,sampleFrames=0,measuredFPS=0;
 let presets={},state=initialBeatState(),bands={sub:0,bass:0,mid:0,treble:0,energy:0};
 let raf=0,previous=0,lastPulse=0,shift=0,recording=false,exportingFrame=false,recordBlob=null,recordName='';
 let loopBlob=null,loopName='',recordTimer=0,recordChunks=[],recorder=null;
 let frameCount=0,frequencySmooth=0,streamCaptureActive=false,loopCapturing=false;
 const mobilePowerDevice=isAppleMobileAgent(navigator.userAgent||'');
 const reduceMotion=window.matchMedia?.('(prefers-reduced-motion:reduce)')?.matches===true;
 let powerSettings=normalizePower(),autoSlow=false,stageVisible=true,pausedBackdropElements=new Set(),pausedSiteVideos=new Set(),pausedBackdrops=false;
 let lastPowerDescription='',lastAmbientSuppression=null;
 try{powerSettings=normalizePower(JSON.parse(localStorage.getItem(POWER_KEY)||'{}'));}catch(e){}
 function getPowerPlan(){
  return powerPlan(powerSettings,{mobile:mobilePowerDevice,quality:options().quality,
   recording:recording||loopCapturing||exportingFrame,reducedMotion:reduceMotion,autoSlow});
 }
 function updatePowerUI(){
  const plan=getPowerPlan(),mode=powerSettings.mode;
  $('sonicPowerMode').value=mode;
  $('sonicPowerStatus').textContent=(mobilePowerDevice?'iPhone/iPad':'PC / desktop')+' · '+
   (plan.draw?plan.fps+' FPS · '+(plan.width||reactorDimensions(plan.quality).width)+'×'+(plan.height||reactorDimensions(plan.quality).height):'graphics paused; music continues')+
   (mode==='auto'&&autoSlow?' · auto-reduced after slow frames':'')+
   (plan.backgroundPause?' · animated backdrops paused':'')+
   '. No temperature data is collected.';
  document.documentElement.dataset.sonicPower=plan.draw?mode:'audio';
 }
 function applyPowerEnvironment(){
  const plan=getPowerPlan(),suspendBackdrop=plan.backgroundPause&&active()&&!recording&&!loopCapturing;
  const suppressAmbient=plan.siteAmbientPause&&active();
  if(suppressAmbient!==lastAmbientSuppression){
   lastAmbientSuppression=suppressAmbient;
   document.documentElement.classList.toggle('sonic-power-ambient-off',suppressAmbient);
   if(suppressAmbient){
    document.querySelectorAll('#ambientMedia video,#heroOrb video,[data-panel="reactor"] .studio-personal-thumb video')
     .forEach(el=>{if(!el.paused){el.pause();pausedSiteVideos.add(el);}});
   }else{
    for(const el of pausedSiteVideos){if(el.isConnected)void el.play().catch(()=>{});}
    pausedSiteVideos.clear();
   }
  }
  if(suspendBackdrop===pausedBackdrops&&!suspendBackdrop)return;
  pausedBackdrops=suspendBackdrop;
  const videos=[backgroundVideo,overlayVideo];
  if(suspendBackdrop){
   for(const el of videos)if(!el.hidden&&!el.paused){el.pause();pausedBackdropElements.add(el);}
  }else{
   for(const el of pausedBackdropElements){if(!el.hidden)void el.play().catch(()=>{});}
   pausedBackdropElements.clear();
  }
 }
 // Newly attached site background videos are stopped if a lightweight profile is active.
 document.addEventListener('play',e=>{
  const el=e.target;
  if(!mobilePowerDevice||!el||el.tagName!=='VIDEO'||!getPowerPlan().siteAmbientPause||!active())return;
  if(el.closest('#ambientMedia,#heroOrb,[data-panel="reactor"] .studio-personal-thumb')){
   el.pause();pausedSiteVideos.add(el);
  }
 },true);
 $('sonicPowerMode').addEventListener('change',e=>{
  powerSettings=normalizePower({mode:e.currentTarget.value});autoSlow=false;previous=0;
  try{localStorage.setItem(POWER_KEY,JSON.stringify(powerSettings));}catch(e){}
  resize();applyPowerEnvironment();updatePowerUI();
  if(powerSettings.mode==='audio')status('Music-only mode: Reactor graphics paused. Saved music and controls keep working.');
 });
 document.addEventListener('proximus-view-changed',()=>{applyPowerEnvironment();previous=0;});
 if(typeof IntersectionObserver==='function'){
  const observer=new IntersectionObserver(entries=>{stageVisible=entries.some(entry=>entry.isIntersecting);previous=0;},
   {root:null,threshold:0});
  observer.observe(stage);
  window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
 }

 const inputText={off:'No source connected',file:'Local music file',playlist:'Saved Sonic Theater playlist',mic:'Microphone (permission granted)',tab:'Shared desktop tab / screen audio'};
 const active=()=>document.querySelector('.studio:not([hidden])')?.dataset.panel==='reactor';

 function status(s,error=false){sourceStatus.textContent=s;sourceStatus.dataset.error=error?'true':'false';}
 function exportStatus(s){result.textContent=s;}
 function options(){
  return normalizeReactorPreset({
   theme:$('reactorTheme').value,mode:$('reactorMode').value,quality:$('reactorQuality').value,
   sensitivity:Number($('reactorSensitivity').value),impact:Number($('reactorImpact').value),
   layers:Number($('reactorLayers').value),backgroundOpacity:Number($('reactorBgOpacity').value),
   backgroundFit:$('reactorBgFit').value,autoShift:$('reactorAutoShift').checked,
   snow:$('reactorSnow').checked,signature:$('reactorSignature').value,
   showSignature:$('reactorShowSignature').checked,
   cycle:$('reactorSceneDirector').checked,cycleSeconds:Number($('reactorSceneSeconds').value),
   autoPerformance:$('reactorAutoPerformance').checked,
   overlayOpacity:Number($('reactorOverlayOpacity').value),overlayBlend:$('reactorOverlayBlend').value
  });
 }
 function applyPreset(p){
  const v=normalizeReactorPreset(p);
  for(const [id,value] of [
   ['reactorTheme',v.theme],['reactorMode',v.mode],['reactorQuality',v.quality],
   ['reactorSensitivity',v.sensitivity],['reactorImpact',v.impact],
   ['reactorLayers',v.layers],['reactorBgOpacity',v.backgroundOpacity],
   ['reactorBgFit',v.backgroundFit],['reactorSignature',v.signature]
  ])$(id).value=String(value);
  $('reactorAutoShift').checked=v.autoShift;$('reactorSnow').checked=v.snow;
  $('reactorShowSignature').checked=v.showSignature;
  $('reactorSceneDirector').checked=v.cycle;
  $('reactorSceneSeconds').value=String(v.cycleSeconds);
  $('reactorAutoPerformance').checked=v.autoPerformance;
  $('reactorOverlayOpacity').value=String(v.overlayOpacity);
  $('reactorOverlayBlend').value=v.overlayBlend;
  if(p?.fx){fxSettings=normalizeEffectSettings(p.fx);drawFxControls();}
  if(p?.sonic){sonicSettings=normalizeSonic(p.sonic);drawSonicControls();saveSonicSettings();}
  runtimeMode=v.mode;nextSceneAt=performance.now()+v.cycleSeconds*1000;
  resize();drawStage(performance.now());updateReadouts();
 }
 function saveSettings(){
  try{localStorage.setItem(SETTINGS,JSON.stringify({preset:options(),saved:presets,fx:fxSettings}));}catch(e){}
 }
 function updateReadouts(){
  const o=options();
  $('reactorSensitivityOut').textContent=o.sensitivity.toFixed(2)+'×';
  $('reactorImpactOut').textContent=o.impact.toFixed(2)+'×';
  $('reactorLayersOut').textContent=Math.round(o.layers*100)+'%';
  $('reactorBgOpacityOut').textContent=Math.round(o.backgroundOpacity*100)+'%';
  $('reactorOverlayOpacityOut').textContent=Math.round(o.overlayOpacity*100)+'%';
 }
 function resize(){
  const plan=getPowerPlan();
  const original=reactorDimensions(options().quality);
  const {width,height}=plan.width&&plan.height?plan:original;
  if(canvas.width!==width||canvas.height!==height){
   canvas.width=width;canvas.height=height;
  }
  $('reactorResolution').textContent=width+' × '+height;
  updatePowerUI();
 }
 for(const id of ['reactorTheme','reactorMode','reactorQuality','reactorSensitivity','reactorImpact','reactorLayers',
  'reactorBgOpacity','reactorBgFit','reactorAutoShift','reactorSnow','reactorSignature','reactorShowSignature',
  'reactorSceneDirector','reactorSceneSeconds','reactorAutoPerformance','reactorOverlayOpacity','reactorOverlayBlend']){
  $(id).addEventListener('input',()=>{
   if(id==='reactorQuality')resize();
   if(id==='reactorMode'){runtimeMode=$('reactorMode').value;nextSceneAt=performance.now()+options().cycleSeconds*1000;}
   if(id==='reactorSceneDirector')nextSceneAt=performance.now()+options().cycleSeconds*1000;
   updateReadouts();saveSettings();
  });
 }
 try{
  const found=JSON.parse(localStorage.getItem(SETTINGS)||'{}');
  if(found.saved&&typeof found.saved==='object'&&!Array.isArray(found.saved))presets=found.saved;
  if(found.fx)fxSettings=normalizeEffectSettings(found.fx);
  if(found.preset)applyPreset(found.preset);
  drawFxControls();
 }catch(e){}
 resize();updateReadouts();

 // Sonic Dimension v3.5.1: separate local preferences; legacy Reactor presets remain valid.
 function saveSonicSettings(){
  try{localStorage.setItem(SONIC_KEY,JSON.stringify(sonicSettings));}
  catch(e){$('reactorDimensionStatus').textContent='Settings applied, but this browser could not save them. Export a JSON backup.';}
 }
 function drawSonicControls(){
  $('reactorDimensionEnabled').checked=sonicSettings.enabled;
  $('reactorDimensionWorld').value=sonicSettings.world;
  $('reactorDimensionIntensity').value=String(sonicSettings.intensity);
  $('reactorDimensionIntensityOut').textContent=sonicSettings.intensity+'%';
  $('reactorDimensionAuto').checked=sonicSettings.autoCycle;
  $('reactorDimensionLink').checked=sonicSettings.linkedScene;
  $('reactorDimensionColors').checked=sonicSettings.beatColors;
  $('reactorDimensionNow').textContent=sonicSettings.enabled?sonicWorld(sonicSettings.world).name:'Reactor IV Classic';
 }
 function reportSonic(message,error=false){
  const line=$('reactorDimensionStatus');line.textContent=message;line.dataset.error=error?'true':'false';
 }
 function activateSonic(patch,message){
  sonicSettings=normalizeSonic({...sonicSettings,...patch});
  sonicCycleAt=performance.now();sonicCycleBeats=state.kicks;
  drawSonicControls();saveSonicSettings();drawStage(performance.now());
  if(message)reportSonic(message);
 }
 $('reactorDimensionJump').addEventListener('click',()=>{
  $('sonicDimensionControls').scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',block:'start'});
  $('reactorDimensionWorld').focus({preventScroll:true});
 });
 $('reactorDimensionEnabled').addEventListener('change',e=>{
  activateSonic({enabled:e.currentTarget.checked},e.currentTarget.checked?'Sonic Dimension activated. Select a local song to see real audio reactions.':'Returned to the complete original Reactor IV visualizer.');
 });
 $('reactorDimensionWorld').addEventListener('change',e=>{
  const world=e.currentTarget.value;
  activateSonic({enabled:true,world},'Now exploring '+sonicWorld(world).name+'.');
 });
 $('reactorDimensionIntensity').addEventListener('input',e=>{
  sonicSettings=normalizeSonic({...sonicSettings,intensity:Number(e.currentTarget.value)});
  $('reactorDimensionIntensityOut').textContent=sonicSettings.intensity+'%';
  drawStage(performance.now());
 });
 $('reactorDimensionIntensity').addEventListener('change',()=>{saveSonicSettings();reportSonic('Reactive intensity saved at '+sonicSettings.intensity+'%.');});
 $('reactorDimensionAuto').addEventListener('change',e=>activateSonic({autoCycle:e.currentTarget.checked},e.currentTarget.checked?'Adaptive world progression enabled: 8 beats with a 12-second cooldown.':'World progression disabled.'));
 $('reactorDimensionLink').addEventListener('change',e=>{
  updateLinkedColor();
  activateSonic({linkedScene:e.currentTarget.checked},e.currentTarget.checked?'Sonic Dimension linked to the Entertainment Overdrive scene color.':'World palettes restored.');
 });
 $('reactorDimensionColors').addEventListener('change',e=>activateSonic({beatColors:e.currentTarget.checked},e.currentTarget.checked?'Color shifts enabled for real detected beats.':'Color shifts disabled.'));
 $('reactorDimensionNext').addEventListener('click',()=>{
  const world=nextSonicWorld(sonicSettings.world);
  activateSonic({enabled:true,world},'Opened '+sonicWorld(world).name+'.');
 });
 $('reactorDimensionReset').addEventListener('click',()=>activateSonic(normalizeSonic({}),'Restored Sonic Dimension defaults. Reactor IV preferences remain unchanged.'));
 $('reactorDimensionExport').addEventListener('click',wrap(async()=>{
  const doc=textFile(sonicBackup(sonicSettings));
  await saveOrShare(doc,'PROXIMUS-SONIC-DIMENSION-PRESET.json');
  reportSonic('Dimension settings exported. Songs, media and sensitive data are not included.');
 }));
 $('reactorDimensionImport').addEventListener('change',wrap(async e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  try{
   if(file.size>80000)throw Error('Dimension backup is too large (80 KB max).');
   const value=readSonicBackup(JSON.parse(await file.text()));
   activateSonic(value,'Imported Sonic Dimension preferences from '+safe(file.name)+'.');
  }finally{e.target.value='';}
 }));
 $('reactorDimensionPack').addEventListener('click',wrap(()=>{
  app.addAsset('PROXIMUS-SONIC-DIMENSION-PRESET.json',textFile(sonicBackup(sonicSettings)),'Sonic Dimension');
  reportSonic('Sonic Dimension preset added to Project Hub → Collected Exports.');
 }));
 drawSonicControls();
 reportSonic(sonicSettings.enabled?'Sonic Dimension ready · '+sonicWorld(sonicSettings.world).name+' · real audio needed for reactive visuals.':'Original Reactor IV is active. Enable Sonic Dimension for five living music worlds.');

 // Reactor IV: route actual band energy into independently adjustable effects.
 const fxSliders={sub:'reactorFxSub',bass:'reactorFxBass',mid:'reactorFxMid',
  treble:'reactorFxTreble',shock:'reactorFxShock',particles:'reactorFxParticles'};
 const fxChecks={reactiveOverlay:'reactorFxReactiveOverlay',showMarkers:'reactorFxBeatMarkers',
  beatSceneChange:'reactorFxBeatScene'};
 const fxSelects={mask:'reactorFxMask',transition:'reactorFxTransition'};
 function drawFxControls(){
  $('reactorFxPreset').value=fxSettings.preset;
  for(const [field,id] of Object.entries(fxSliders)){
   $(id).value=String(fxSettings[field]);
   $(id+'Out').textContent=fxSettings[field].toFixed(1)+'×';
  }
  for(const [field,id] of Object.entries(fxChecks))$(id).checked=fxSettings[field];
  for(const [field,id] of Object.entries(fxSelects))$(id).value=fxSettings[field];
  fxSettings.sceneOrder.forEach((scene,i)=>{if(i<4)$('reactorFxScene'+i).value=scene;});
 }
 function readFxControls(){
  const updated={...fxSettings,preset:$('reactorFxPreset').value};
  for(const [field,id] of Object.entries(fxSliders))updated[field]=Number($(id).value);
  for(const [field,id] of Object.entries(fxChecks))updated[field]=$(id).checked;
  for(const [field,id] of Object.entries(fxSelects))updated[field]=$(id).value;
  updated.sceneOrder=Array.from({length:4},(_,i)=>$('reactorFxScene'+i).value);
  fxSettings=normalizeEffectSettings(updated);
  for(const [field,id] of Object.entries(fxSliders))$(id+'Out').textContent=fxSettings[field].toFixed(1)+'×';
  saveSettings();
 }
 $('reactorFxPreset').addEventListener('change',()=>{
  fxSettings=normalizeEffectSettings({preset:$('reactorFxPreset').value,
   sceneOrder:fxSettings.sceneOrder,beatSceneChange:fxSettings.beatSceneChange});
  drawFxControls();saveSettings();
  $('reactorFxStatus').textContent='Loaded '+REACTOR_IV_PRESETS[fxSettings.preset].label+' effect composition.';
 });
 for(const id of [...Object.values(fxSliders),...Object.values(fxChecks),
  ...Object.values(fxSelects),...Array.from({length:4},(_,i)=>'reactorFxScene'+i)]){
  $(id).addEventListener('input',readFxControls);
  $(id).addEventListener('change',readFxControls);
 }
 $('reactorFxReset').addEventListener('click',()=>{
  fxSettings=normalizeEffectSettings({preset:fxSettings.preset});
  drawFxControls();saveSettings();
  $('reactorFxStatus').textContent='Restored the original effect composition mapping.';
 });
 const effectDocument=()=>textFile({schema:'proximus.reactor.effects/1',version:'3.0.0',
  exported:new Date().toISOString(),settings:fxSettings});
 $('reactorFxExport').addEventListener('click',()=>{
  download(effectDocument(),'PROXIMUS-REACTOR-IV-EFFECTS.json');
 });
 $('reactorFxShare').addEventListener('click',wrap(async()=>{
  await saveOrShare(effectDocument(),'PROXIMUS-REACTOR-IV-EFFECTS.json');
  $('reactorFxStatus').textContent='Reactor IV effects shared or downloaded.';
 }));
 $('reactorFxImport').addEventListener('change',wrap(async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>120000)throw Error('Reactor IV effects file exceeds 120 KB.');
  const input=JSON.parse(await file.text());
  if(input?.schema!=='proximus.reactor.effects/1')throw Error('Select a valid Reactor IV effect file.');
  fxSettings=normalizeEffectSettings(input.settings);
  drawFxControls();saveSettings();e.target.value='';
  $('reactorFxStatus').textContent='Imported Reactor IV effects from '+safe(file.name)+'.';
 }));
 document.addEventListener('proximus-identity-changed',e=>{
  const d=e.detail||{};
  identityColors=d.enabled&&d.applyReactor&&d.colors?d.colors:null;
  if(identityColors){
   const map={sovereign:'void',solar:'celestial',abyss:'frost',ember:'inferno',emerald:'emerald',frost:'frost'};
   $('reactorTheme').value=map[d.palette]||'void';
  }
 });

 function releaseInput(){
  if(current==='playlist'&&analyser)frequency=new Uint8Array(analyser.frequencyBinCount);
  audio.pause();
  audio.removeAttribute('src');audio.load();
  if(audioUrl){URL.revokeObjectURL(audioUrl);audioUrl=null;}
  if(sourceNode)try{sourceNode.disconnect();}catch(e){}
  sourceNode=null;source=null;
  if(stream){for(const track of stream.getTracks())track.stop();stream=null;}
  current='off';streamCaptureActive=false;state=initialBeatState();bands={sub:0,bass:0,mid:0,treble:0,energy:0};
  $('reactorSource').textContent='Not connected';$('reactorStop').disabled=true;
 }
 document.addEventListener('proximus-sonic-playback',e=>{
  const d=e.detail||{};
  if(d.kind!=='audio')return;
  if(d.playing===true){
   if(current!=='playlist')releaseInput();
   current='playlist';sharedActive=true;sharedUpdated=performance.now();
   $('reactorSource').textContent='Sonic Theater playlist';
   $('reactorStop').disabled=false;
   status('Playing your saved playlist through the same Reactor · '+safe(d.name||'music'));
  }else if(current==='playlist'){
   sharedActive=false;bands={sub:0,bass:0,mid:0,treble:0,energy:0};
   status('Shared playlist paused. Tap Play to resume and react.');
  }
 });
 document.addEventListener('proximus-sonic-spectrum',e=>{
  const d=e.detail||{};
  if(current!=='playlist'||!d.frequency||!Number.isFinite(d.sampleRate)||!Number.isFinite(d.fftSize))return;
  sharedSpectrum=d.frequency;sharedSampleRate=d.sampleRate;sharedFFT=d.fftSize;
  sharedActive=d.active===true;sharedUpdated=performance.now();
 });
 function makeAudioContext(){
  if(!audioContext){
   const AudioCtx=window.AudioContext||window.webkitAudioContext;
   if(!AudioCtx)throw Error('This browser has no Web Audio engine.');
   audioContext=new AudioCtx();
   analyser=audioContext.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.70;
   analyser.minDecibels=-92;analyser.maxDecibels=-15;
   frequency=new Uint8Array(analyser.frequencyBinCount);
  }
  return audioContext;
 }
 function startFile(){
  if(!selectedAudio)throw Error('Choose a local song, audio file or MP4 with audio first.');
  if(document.documentElement.classList.contains('sonic-theater-integrated')){
   document.dispatchEvent(new CustomEvent('proximus-sonic-enqueue',{detail:{file:selectedAudio,play:true}}));
   status('Playing through shared Sonic Theater playlist · '+safe(selectedAudio.name));
   return;
  }
  if(selectedAudio.size>MAX_AUDIO)throw Error('Audio file exceeds the 250 MB local playback limit.');
  releaseInput();const c=makeAudioContext();
  if(!mediaNode)mediaNode=c.createMediaElementSource(audio);
  sourceNode=mediaNode;sourceNode.connect(analyser);sourceNode.connect(c.destination);
  audioUrl=URL.createObjectURL(selectedAudio);audio.src=audioUrl;audio.load();
  current='file';$('reactorSource').textContent='Local file';$('reactorStop').disabled=false;
  // Both resume() and play() are initiated on the actual user interaction.
  const start=c.resume(),play=audio.play();
  Promise.all([start,play]).then(()=>{
   status('Live music analysis · '+safe(selectedAudio.name));
  }).catch(err=>{status('Tap Play in the local audio player: '+(err.message||err),true);});
 }
 async function startMic(){
  if(!navigator.mediaDevices?.getUserMedia)throw Error('Microphone permission is unavailable in this browser.');
  // Request capture within the click gesture. Never request it on page load.
  const promise=navigator.mediaDevices.getUserMedia({video:false,audio:{
   echoCancellation:false,noiseSuppression:false,autoGainControl:false}});
  const c=makeAudioContext(),resume=c.resume();
  let captured;
  try{captured=await promise;await resume;}
  catch(e){if(captured)for(const t of captured.getTracks())t.stop();throw e;}
  document.dispatchEvent(new Event('proximus-sonic-stop-playlist'));
  releaseInput();stream=captured;sourceNode=c.createMediaStreamSource(captured);
  sourceNode.connect(analyser);current='mic';$('reactorSource').textContent='Microphone';
  $('reactorStop').disabled=false;status('Microphone listening to ambient sound · reacts to audible beats');
  captured.getAudioTracks()[0]?.addEventListener('ended',()=>{
   if(stream===captured){releaseInput();status('Microphone session ended.');}
  });
 }
 async function startTab(){
  if(!navigator.mediaDevices?.getDisplayMedia)throw Error('Desktop tab-audio capture is unavailable here. Use Local File or Microphone instead.');
  // getDisplayMedia MUST be called directly as part of the click gesture.
  const request=navigator.mediaDevices.getDisplayMedia({video:true,audio:true,systemAudio:'include'});
  const c=makeAudioContext(),resume=c.resume();
  let captured;
  try{captured=await request;await resume;}
  catch(e){if(captured)for(const t of captured.getTracks())t.stop();throw e;}
  if(!captured.getAudioTracks().length){
   for(const t of captured.getTracks())t.stop();
   throw Error('The selected tab or screen did not share an audio track. On desktop, choose a music tab and enable Share tab audio.');
  }
  document.dispatchEvent(new Event('proximus-sonic-stop-playlist'));
  releaseInput();stream=captured;sourceNode=c.createMediaStreamSource(new MediaStream(captured.getAudioTracks()));
  sourceNode.connect(analyser);current='tab';streamCaptureActive=true;
  $('reactorSource').textContent='Desktop shared audio';$('reactorStop').disabled=false;
  status('Listening to user-shared desktop audio · source '+captured.getAudioTracks().length+' track');
  for(const t of captured.getTracks())t.addEventListener('ended',()=>{
   if(stream===captured){releaseInput();status('Tab or screen sharing stopped.');}
  },{once:true});
 }
 fileInput.addEventListener('change',e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(!file.type.startsWith('audio/')&&!file.type.startsWith('video/')&&!/\.(?:mp3|wav|m4a|aac|ogg|flac|opus|mp4|webm)$/i.test(file.name)){
   status('Choose a supported local music or video file with audio.',true);return;
  }
  selectedAudio=file;
  status('Ready: '+safe(file.name)+' · '+bytes(file.size)+'. Tap Play local audio.');
 });
 $('reactorFilePlay').addEventListener('click',wrap(startFile));
 $('reactorMic').addEventListener('click',wrap(async()=>{try{await startMic();}catch(e){status('Microphone: '+(e.message||e),true);throw e;}}));
 $('reactorTab').addEventListener('click',wrap(async()=>{try{await startTab();}catch(e){status('Shared tab audio: '+(e.message||e),true);throw e;}}));
 $('reactorStop').addEventListener('click',()=>{if(current==='playlist')document.dispatchEvent(new Event('proximus-sonic-stop-playlist'));releaseInput();status('Audio capture stopped.');});
 audio.addEventListener('ended',()=>{
  if(current==='file'){releaseInput();status('Local audio finished.');}
 });
 audio.addEventListener('error',()=>{if(current==='file')status('Audio decoding failed. Try another browser-supported format.',true);});
 $('reactorVolume').addEventListener('input',()=>{audio.volume=Number($('reactorVolume').value);const shared=$('theaterAudio');if(shared)shared.volume=audio.volume;});
 audio.volume=Number($('reactorVolume').value);

 function clearBackdrop(){
  backgroundVideo.pause();backgroundVideo.removeAttribute('src');backgroundVideo.load();backgroundVideo.hidden=true;
  backgroundImage.removeAttribute('src');backgroundImage.hidden=true;
  if(mediaURL){URL.revokeObjectURL(mediaURL);mediaURL=null;}
  mediaRecord=null;videoReady=false;gifBackdrop=null;
  $('reactorBgName').textContent='Original Reactor atmosphere';
 }
 function setBackdrop(file,name){
  if(!(file instanceof Blob))throw Error('Choose an image, GIF, MP4 or WebM.');
  if(file.size>MAX_BACKDROP)throw Error('Use a background file under 55 MB.');
  clearBackdrop();
  mediaRecord={blob:file,name:safe(name||'Backdrop'),mime:file.type};
  mediaURL=URL.createObjectURL(file);
  if(isBackdropVideo({name:mediaRecord.name,type:file.type})){
   backgroundVideo.hidden=false;backgroundVideo.muted=true;backgroundVideo.loop=true;backgroundVideo.autoplay=true;
   backgroundVideo.playsInline=true;backgroundVideo.preload='auto';
   backgroundVideo.src=mediaURL;backgroundVideo.addEventListener('loadeddata',()=>{
    videoReady=true;backgroundVideo.play().catch(()=>{$('reactorBgPlay').hidden=false;});
   },{once:true});
   backgroundVideo.play().catch(()=>{$('reactorBgPlay').hidden=false;});
  }else{
   backgroundImage.hidden=false;backgroundImage.src=mediaURL;
   if(file.type==='image/gif'||/\.gif$/i.test(mediaRecord.name)){
    const fileURL=mediaURL;
    // Frame-by-frame compositor explicitly advances GIFs on the canvas,
    // even when a browser's drawImage(img) would otherwise use frame zero.
    void file.arrayBuffer().then(parseGifFrames).then(parsed=>{
     if(mediaURL!==fileURL)return;
     const renderer=createGifFrameRenderer(parsed);
     const first=renderer.frame(0);
     gifBackdrop={renderer,frames:parsed.frames,index:0,next:performance.now()+parsed.frames[0].delayMs,canvas:first.canvas};
    }).catch(error=>{
     if(mediaURL===fileURL)status('GIF image loaded; using browser animation playback: '+(error.message||error));
    });
   }
  }
  $('reactorBgName').textContent=mediaRecord.name+' · '+bytes(file.size);
 }
 backgroundInput.addEventListener('change',wrap(async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(!supportedBackdrop(file))throw Error('Choose GIF, MP4, WebM, PNG, JPEG or WebP artwork.');
  setBackdrop(file,file.name);
  try{
   await mediaTransaction('readwrite',store=>store.put({blob:file,name:file.name},'background'));
   status('Custom Reactor backdrop saved locally.');
  }catch(err){status('Background applied for this session; storage unavailable: '+err.message,true);}
  e.target.value='';
 }));
 $('reactorBgRemove').addEventListener('click',wrap(async()=>{
  clearBackdrop();$('reactorBgPlay').hidden=true;
  try{await mediaTransaction('readwrite',store=>store.delete('background'));}
  catch(e){status('Backdrop cleared for this session.');}
 }));
 $('reactorBgPlay').addEventListener('click',()=>{
  backgroundVideo.play().then(()=>{$('reactorBgPlay').hidden=true;}).catch(()=>{status('Tap the video to play your custom backdrop.');});
 });
 document.addEventListener('proximus-reactor-background',wrap(async e=>{
  const {blob,name}=e.detail||{};
  if(!blob||!supportedBackdrop({name:name||'',type:blob.type}))throw Error('Reactor backdrop must be an image, GIF, MP4 or WebM.');
  setBackdrop(blob,name);
  await mediaTransaction('readwrite',store=>store.put({blob,name},'background'));
  app.changeView('reactor');
 }));
 document.addEventListener('proximus-reactor-import',e=>{
  const file=e.detail?.file;
  if(!file)return;
  if(document.documentElement.classList.contains('sonic-theater-integrated')){
   document.dispatchEvent(new CustomEvent('proximus-sonic-enqueue',{detail:{file,play:false}}));
   app.changeView('reactor');
   status('Sent '+safe(file.name)+' to the shared Sonic Theater queue. Use Play in the unified player.');
   return;
  }
  selectedAudio=file;
  status('Ready from Media Theater: '+safe(file.name)+'. Tap Play local audio.');
  app.changeView('reactor');
 });
 void mediaTransaction('readonly',store=>store.get('background')).then(record=>{
  if(record?.blob)setBackdrop(record.blob,record.name||'Saved backdrop');
 }).catch(()=>{});
 // A second independent visual layer, stored in the existing browser media
 // database so portable workspace sync includes it automatically.
 function clearOverlay(){
  overlayVideo.pause();overlayVideo.removeAttribute('src');overlayVideo.load();overlayVideo.hidden=true;
  overlayImage.removeAttribute('src');overlayImage.hidden=true;
  if(overlayURL)URL.revokeObjectURL(overlayURL);
  overlayURL=null;overlayReady=false;gifOverlay=null;
  $('reactorOverlayName').textContent='No secondary visual layer selected.';
 }
 function setOverlay(blob,name){
  if(!(blob instanceof Blob)||blob.size>MAX_BACKDROP)throw Error('Overlay should be a GIF, MP4, WebM or image under 55 MB.');
  if(!supportedBackdrop({type:blob.type,name}))throw Error('Overlay must be GIF, MP4, WebM, PNG, JPEG or WebP.');
  clearOverlay();const url=URL.createObjectURL(blob);overlayURL=url;
  $('reactorOverlayName').textContent=safe(name)+' · '+bytes(blob.size);
  if(isBackdropVideo({name,type:blob.type})){
   overlayVideo.hidden=false;overlayVideo.muted=true;overlayVideo.loop=true;overlayVideo.playsInline=true;
   overlayVideo.src=url;overlayVideo.addEventListener('loadeddata',()=>{
    if(overlayURL!==url)return;overlayReady=true;overlayVideo.play().catch(()=>{});
   },{once:true});
   overlayVideo.play().catch(()=>{});
  }else{
   overlayImage.hidden=false;overlayImage.src=url;
   if(blob.type==='image/gif'||/\.gif$/i.test(name)){
    void blob.arrayBuffer().then(parseGifFrames).then(parsed=>{
     if(overlayURL!==url)return;
     const renderer=createGifFrameRenderer(parsed),first=renderer.frame(0);
     gifOverlay={renderer,frames:parsed.frames,index:0,next:performance.now()+parsed.frames[0].delayMs,canvas:first.canvas};
    }).catch(()=>{});
   }
  }
 }
 $('reactorOverlayFile').addEventListener('change',wrap(async e=>{
  const file=e.target.files?.[0];if(!file)return;
  setOverlay(file,file.name);
  await mediaTransaction('readwrite',store=>store.put({blob:file,name:file.name},'overlay'));
  e.target.value='';status('Saved second Reactor visual layer on this device.');
 }));
 $('reactorOverlayRemove').addEventListener('click',wrap(async()=>{
  clearOverlay();await mediaTransaction('readwrite',store=>store.delete('overlay'));
 }));
 void mediaTransaction('readonly',store=>store.get('overlay')).then(record=>{
  if(record?.blob)setOverlay(record.blob,record.name||'Saved overlay');
 }).catch(()=>{});
 function drawOverlay(c,w,h,o,now){
  if(gifOverlay){
   const item=gifOverlay;if(now-item.next>3500)item.next=now;
   let i=0;while(now>=item.next&&i++<20){
    item.index=(item.index+1)%item.frames.length;
    item.renderer.frame(item.index);item.next+=item.frames[item.index].delayMs;
   }
  }
  const source=gifOverlay?.canvas||
   (!overlayVideo.hidden&&overlayReady?overlayVideo:!overlayImage.hidden&&overlayImage.complete&&overlayImage.naturalWidth?overlayImage:null);
  if(!source)return;
  const levels=effectLevels(bands,fxSettings,false);
  c.save();
  c.globalAlpha=o.overlayOpacity*(fxSettings.reactiveOverlay?Math.min(1,.55+levels.overlay*.65):1);
  c.globalCompositeOperation=o.overlayBlend;
  const cx=w/2,cy=h/2,pulse=1+levels.aura*.15;
  if(fxSettings.mask!=='none'){
   c.beginPath();
   if(fxSettings.mask==='halo'){
    c.ellipse(cx,cy,w*.40*pulse,h*.43*pulse,0,0,Math.PI*2);
   }else if(fxSettings.mask==='eclipse'){
    c.ellipse(cx,cy,w*.27*pulse,h*.40*pulse,0,0,Math.PI*2);
   }else if(fxSettings.mask==='wings'){
    c.ellipse(cx-w*.23,cy,w*.26*pulse,h*.25*pulse,-.38,0,Math.PI*2);
    c.ellipse(cx+w*.23,cy,w*.26*pulse,h*.25*pulse,.38,0,Math.PI*2);
   }else if(fxSettings.mask==='bars'){
    const count=22,bandWidth=w/count;
    for(let i=0;i<count;i++){
     const value=frequency?.length?frequency[Math.min(frequency.length-1,Math.floor(i*frequency.length/(count*2)))]/255:0;
     const height=h*(.22+Math.min(.55,value*.72))*pulse;
     c.rect(i*bandWidth,cy-height/2,bandWidth*.78,height);
    }
   }
   c.clip();
  }
  try{fit(c,source,w,h,'cover');}catch(e){}
  c.restore();
 }
 const historyCanvas=$('reactorHistoryCanvas'),historyCtx=historyCanvas.getContext('2d');
 function drawHistory(){
  const w=historyCanvas.width,h=historyCanvas.height;
  historyCtx.fillStyle='#0a0a1c';historyCtx.fillRect(0,0,w,h);
  for(let i=1;i<5;i++){historyCtx.strokeStyle='#68528233';historyCtx.beginPath();historyCtx.moveTo(0,h*i/5);historyCtx.lineTo(w,h*i/5);historyCtx.stroke();}
  if(fxSettings.showMarkers){
   history.forEach((point,i)=>{
    if(!point.beat)return;
    const x=(w-1)*i/119;
    historyCtx.fillStyle='#fff4b5';historyCtx.fillRect(x,0,2,h);
   });
  }
  for(const [key,colorValue] of [['bass','#bd89ff'],['mid','#72ddff'],['treble','#f1c48b']]){
   historyCtx.strokeStyle=colorValue;historyCtx.lineWidth=2.4;historyCtx.beginPath();
   for(let i=0;i<history.length;i++){
    const item=history[i],x=(w-1)*i/119,y=h-8-(item[key]||0)*(h-15);
    if(i===0)historyCtx.moveTo(x,y);else historyCtx.lineTo(x,y);
   }
   historyCtx.stroke();
  }
 }


 function backdrop(ctx,w,h,o,now){
  if(gifBackdrop){
   const bg=gifBackdrop;
   // Use each source frame's native delay and composite with its disposal mode.
   if(now-bg.next>3500)bg.next=now;
   let steps=0;
   while(now>=bg.next&&steps<25){
    bg.index=(bg.index+1)%bg.frames.length;
    try{bg.renderer.frame(bg.index);}catch(e){gifBackdrop=null;break;}
    bg.next+=bg.frames[bg.index].delayMs;
    steps++;
   }
  }
  const element=gifBackdrop?.canvas||(!backgroundVideo.hidden&&videoReady?backgroundVideo:!backgroundImage.hidden&&backgroundImage.complete&&backgroundImage.naturalWidth?backgroundImage:null);
  if(!element)return false;
  ctx.save();ctx.globalAlpha=o.backgroundOpacity;
  try{fit(ctx,element,w,h,o.backgroundFit);}catch(e){}
  ctx.restore();return true;
 }
 function drawStage(now){
  const w=canvas.width,h=canvas.height,o={...options(),quality:getPowerPlan().quality};
  const sceneMode=(o.cycle||fxSettings.beatSceneChange)?runtimeMode:o.mode;
  const theme=REACTOR_THEMES[o.theme],hasAudio=current==='playlist'?sharedActive&&!!sharedSpectrum:current!=='off'&&!!analyser;
  const b=hasAudio?bands:{sub:0,bass:0,mid:0,treble:0,energy:0};
  const punch=(b.bass*.75+b.sub*.25)*o.impact;
  const activeColor=o.autoShift?Object.values(REACTOR_THEMES)[shift%5]:theme;
  const primary=identityColors?.accent||activeColor.primary,
   secondary=identityColors?.secondary||activeColor.secondary,
   glow=identityColors?.glow||activeColor.glow;
  const fx=effectLevels(b,fxSettings,state.hit);
  ctx.globalAlpha=1;ctx.clearRect(0,0,w,h);
  ctx.fillStyle=theme.dark;ctx.fillRect(0,0,w,h);
  const custom=backdrop(ctx,w,h,o,now);
  if(custom){ctx.fillStyle='rgba(3,2,15,.32)';ctx.fillRect(0,0,w,h);}
  drawOverlay(ctx,w,h,o,now);
  const aura=ctx.createRadialGradient(w*.5,h*.5,10,w*.5,h*.5,w*.67);
  aura.addColorStop(0,color(primary,.18+punch*.13+fx.aura*.11));
  aura.addColorStop(.46,color(secondary,.11+b.energy*.12+fx.emissive*.08));
  aura.addColorStop(1,'rgba(0,0,0,0)');
  ctx.fillStyle=aura;ctx.fillRect(0,0,w,h);
  // Render bounds are normalized to stage size; no per-frame image allocations.
  const cx=w*.5,cy=h*.5,scale=w/960,t=now/1000;
  if(sonicSettings.enabled){
   drawSonicDimension(ctx,{
    world:sonicSettings.world,now,width:w,height:h,bands:b,lastKick:lastPulse,
    intensity:sonicSettings.intensity,quality:o.quality,
    active:hasAudio&&(current==='playlist'||audioContext?.state==='running'),
    reducedMotion:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches===true,
    colorOverride:sonicSettings.linkedScene?linkedColor:null,
    beatShift:sonicBeatPhase,beatColors:sonicSettings.beatColors,customBackdrop:custom
   });
  }else{
  if(sceneMode==='spectrum'||sceneMode==='sovereign'||sceneMode==='starlight'){
   const bars=o.quality==='eco'?42:70;
   const gap=Math.max(2,Math.round(w*.003)),bw=(w*.88-(bars-1)*gap)/bars;
   const start=w*.06;
   for(let i=0;i<bars;i++){
    const index=Math.min(frequency?.length-1||0,Math.floor(i/(bars-1)*(frequency?.length-1||0)*.44));
    const value=hasAudio&&frequency?frequency[index]/255:0;
    const height=Math.max(2,Math.pow(value,1.2)*h*.46*o.impact);
    const x=start+i*(bw+gap);
    const gradient=ctx.createLinearGradient(0,h*.94-height,0,h*.94);
    gradient.addColorStop(0,color(glow,.95));gradient.addColorStop(1,color(secondary,.9));
    ctx.fillStyle=gradient;ctx.fillRect(x,h*.94-height,bw,height);
   }
  }
  if(sceneMode==='wave'){
   ctx.beginPath();ctx.lineWidth=3*scale;ctx.strokeStyle=glow;ctx.shadowColor=primary;ctx.shadowBlur=15*scale;
   for(let x=0;x<=w;x+=Math.max(2,3*scale)){
    const bin=Math.floor((x/w)*(frequency?.length||0)*.5);
    const amplitude=hasAudio&&frequency?frequency[bin]/255:0;
    const y=cy+Math.sin(x*.017-t*3)*(8+amplitude*h*.32)+Math.cos(x*.003+t*2)*amplitude*h*.2;
    x?ctx.lineTo(x,y):ctx.moveTo(x,y);
   }
   ctx.stroke();ctx.shadowBlur=0;
  }
  if(['rings','sovereign','portal'].includes(sceneMode)){
   for(let ring=0;ring<(o.quality==='eco'?5:9);ring++){
    const offset=ring*19*scale;
    const radius=(68+offset+Math.sin(t*1.1+ring*.5)*5+punch*38)*scale;
    ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);
    ctx.lineWidth=(1.3+punch*2.5)*scale;
    ctx.strokeStyle=color(ring%2?secondary:primary,.42+Math.min(.4,punch*.3));
    ctx.shadowColor=primary;ctx.shadowBlur=(8+punch*14)*scale;ctx.stroke();
   }
   ctx.shadowBlur=0;
  }
  if(['portal','sovereign','starlight'].includes(sceneMode)){
   const count=o.quality==='eco'?45:105;
   for(let i=0;i<count;i++){
    const phase=i*2.399963+Math.sin(i*2.1)*.22,
      radius=(.13+((i*.618034+t*(.015+b.energy*.045))%1)*.72)*Math.min(w,h),
      angle=phase+t*(.075+b.bass*.25);
    const x=cx+Math.cos(angle)*radius*1.2,y=cy+Math.sin(angle)*radius*.78;
    const r=(.6+i%3*.3+b.energy*1.2)*scale;
    ctx.fillStyle=color(i%3===0?glow:primary,o.layers*(.3+((i*17)%7)/10));
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
   }
  }
  if(sceneMode==='sovereign'||sceneMode==='portal'){
   ctx.save();ctx.translate(cx,cy);ctx.rotate(t*.12);
   for(let wing=-1;wing<=1;wing+=2){
    for(let i=0;i<9;i++){
     const rx=wing*(35+i*16)*scale,ry=(25+i*6+punch*38)*scale;
     ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(rx,ry,rx*1.42,(i-4)*12*scale);
     ctx.strokeStyle=color(i%2?glow:primary,(.1+.025*i)*o.layers);
     ctx.lineWidth=(2.8+punch*2)*scale;ctx.stroke();
    }
   }
   ctx.restore();
  }
  if(o.snow){
   const count=o.quality==='eco'?24:75;
   for(let i=0;i<count;i++){
    const x=((i*97.1+Math.sin(t*.6+i)*36)*scale+w)%w,
      y=((i*171.2+(t*(9+i%7*4)*scale))%h+h)%h;
    ctx.fillStyle=color(glow,.18+(i%5)*.09);
    ctx.beginPath();ctx.arc(x,y,(i%3+1)*.75*scale,0,Math.PI*2);ctx.fill();
   }
  }
  // Reactor IV frequency-mapped visual layer: only real measured audio can
  // increase these visual intensities; the idle scene remains ambient.
  const kickGlow=pulseDecay(now,lastPulse,270);
  if(current!=='off'&&fx.impact>0.02&&kickGlow>.012){
   ctx.save();ctx.lineWidth=(2+fx.impact*7)*scale;
   ctx.strokeStyle=color(glow,Math.min(.9,.2+kickGlow*.7));
   ctx.shadowColor=primary;ctx.shadowBlur=25*scale*kickGlow;
   ctx.beginPath();ctx.arc(cx,cy,(100+kickGlow*130)*scale,0,Math.PI*2);ctx.stroke();
   ctx.restore();
  }
  if(current!=='off'&&fx.emissive>.02){
   ctx.save();ctx.strokeStyle=color(glow,Math.min(.85,fx.emissive*.4));
   ctx.lineWidth=(1+fx.emissive*3.5)*scale;ctx.shadowColor=glow;ctx.shadowBlur=16*scale;
   for(const wing of [-1,1]){
    ctx.beginPath();ctx.moveTo(cx,cy);
    ctx.bezierCurveTo(cx+wing*w*.08,cy-h*.31,cx+wing*w*.37,cy-h*.15,
     cx+wing*w*(.21+fx.emissive*.055),cy+h*.09);
    ctx.stroke();
   }
   ctx.restore();
  }
  if(current!=='off'&&fx.shimmer>.025){
   const count=o.quality==='eco'?20:56;
   ctx.save();
   for(let i=0;i<count;i++){
    const x=((i*127.7+now*.015*(1+i%4))%w+w)%w;
    const y=((i*83.1+Math.sin(now*.002+i)*h*.1)%h+h)%h;
    ctx.fillStyle=color(i%3?primary:glow,Math.min(.6,fx.shimmer*.30));
    ctx.beginPath();ctx.arc(x,y,(.7+(i%3)*.45)*scale,0,Math.PI*2);ctx.fill();
   }
   ctx.restore();
  }
  }
  const transition=transitionProgress(now,sceneChangedAt,640);
  if(transition<1){
   const level=(1-transition);
   ctx.save();
   if(fxSettings.transition==='fade'){
    ctx.fillStyle='rgba(0,0,0,'+(level*.7)+')';ctx.fillRect(0,0,w,h);
   }else if(fxSettings.transition==='sweep'){
    const px=w*(1-transition),grad=ctx.createLinearGradient(px-100*scale,0,px+100*scale,0);
    grad.addColorStop(0,'rgba(0,0,0,0)');grad.addColorStop(.5,color(glow,level*.45));grad.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
   }else{
    ctx.fillStyle=color(glow,level*.18);ctx.fillRect(0,0,w,h);
   }
   ctx.restore();
  }
  // Bass flash only when the detector has a real input and a confirmed peak.
  const flash=current!=='off'?Math.exp(-(now-lastPulse)/180)*.45:0;
  if(flash>0.001&&now>=lastPulse){
   ctx.fillStyle=color(glow,flash*.26);ctx.fillRect(0,0,w,h);
  }
  const font=Math.max(14,18*scale);
  ctx.fillStyle=color(glow,.9);ctx.textAlign='left';ctx.font='800 '+font+'px system-ui';
  ctx.fillText(sonicSettings.enabled?'PROXIMUS  |  SONIC DIMENSION':'PROXIMUS  |  SOVEREIGN REACTOR',24*scale,36*scale);
  ctx.fillStyle=color(primary,.8);ctx.font='700 '+Math.max(11,13*scale)+'px system-ui';
  ctx.fillText(current==='off'?'VISUAL AMBIENCE · SOURCE NOT CONNECTED':inputText[current].toUpperCase(),24*scale,57*scale);
  if(o.showSignature){
   ctx.textAlign='right';ctx.font='900 '+Math.max(15,23*scale)+'px system-ui';
   ctx.fillStyle=color(glow,.78);ctx.fillText(o.signature||'PROXIMUS',w-26*scale,h-25*scale);
  }
  ctx.textAlign='left';ctx.fillStyle=color(primary,.68);
  ctx.fillRect(25*scale,h-26*scale,Math.max(2,(w-50*scale)*clamp(b.energy*o.impact,0,1)),3*scale);
 }
 function stats(){
  $('reactorBass').value=clamp(bands.bass*options().impact,0,1)*100;
  $('reactorMid').value=clamp(bands.mid*options().impact,0,1)*100;
  $('reactorHigh').value=clamp(bands.treble*options().impact,0,1)*100;
  $('reactorBassText').textContent=Math.round(bands.bass*100)+'%';
  $('reactorMidText').textContent=Math.round(bands.mid*100)+'%';
  $('reactorHighText').textContent=Math.round(bands.treble*100)+'%';
  $('reactorBeats').textContent=String(state.kicks||0);
 }
 function tick(now){
  raf=requestAnimationFrame(tick);
  if(document.hidden)return;
  const o=options();
  if(!active()&&!recording&&!loopCapturing){applyPowerEnvironment();return;}
  const power=getPowerPlan();
  applyPowerEnvironment();
  if(!recording&&!loopCapturing&&!stageVisible&&document.fullscreenElement!==stage)return;
  if(!power.draw||!frameDue(now,previous,power.fps))return;
  previous=now;frameCount++;
  if(o.cycle&&now>=nextSceneAt){
   runtimeMode=nextSceneInOrder(runtimeMode,fxSettings.sceneOrder);
   sceneChangedAt=now;nextSceneAt=now+o.cycleSeconds*1000;
   $('reactorSceneStatus').textContent='Scene Director IV · '+runtimeMode+' · '+o.cycleSeconds+'s cycle';
  }
  if(!o.cycle&&!fxSettings.beatSceneChange)runtimeMode=o.mode;
  sampleFrames++;
  if(!sampleStart)sampleStart=now;
  if(now-sampleStart>=3500){
   measuredFPS=Math.round(sampleFrames*1000/(now-sampleStart));
   $('reactorPerformanceText').textContent='Live '+measuredFPS+' FPS · '+getPowerPlan().quality+
    (getPowerPlan().limited?' · Mobile Power Guard':'');
   if(mobilePowerDevice&&powerSettings.mode==='auto'&&!autoSlow&&
      measuredFPS<getPowerPlan().fps*.65&&sampleFrames>=8&&!recording&&!loopCapturing){
     autoSlow=true;previous=0;resize();applyPowerEnvironment();
     $('reactorPerformanceText').textContent='Adaptive iPhone load reduction · 15 FPS';
   }
   if(!mobilePowerDevice&&o.autoPerformance&&o.quality!=='eco'&&measuredFPS<reactorDimensions(o.quality).fps*.48&&!recording&&!loopCapturing){
    $('reactorQuality').value='eco';resize();saveSettings();
    $('reactorPerformanceText').textContent='Auto-switched to battery saver · '+measuredFPS+' FPS';
   }
   sampleFrames=0;sampleStart=now;
  }
  if(current==='playlist'&&sharedActive&&sharedSpectrum&&now-sharedUpdated<750||
    current!=='off'&&current!=='playlist'&&analyser&&audioContext?.state==='running'){
   if(current==='playlist'){
    frequency=sharedSpectrum;
    bands=spectralBands(frequency,sharedSampleRate,sharedFFT);
   }else{
    analyser.getByteFrequencyData(frequency);
    bands=spectralBands(frequency,audioContext.sampleRate,analyser.fftSize);
   }
   state=detectBeat(bands,now,state,o.sensitivity);
   if(state.hit){
    lastPulse=now;sonicBeatPhase++;if(o.autoShift)shift++;
    if(fxSettings.beatSceneChange&&now-sceneChangedAt>1300){
     runtimeMode=nextSceneInOrder(runtimeMode,fxSettings.sceneOrder);
     sceneChangedAt=now;
     $('reactorSceneStatus').textContent='Beat-triggered scene · '+runtimeMode;
    }
   }
   frequencySmooth=frequencySmooth*.85+bands.energy*.15;
  }else bands={sub:0,bass:0,mid:0,treble:0,energy:0};
  if(shouldCycleSonic({autoCycle:sonicSettings.autoCycle,active:sonicSettings.enabled&&((current==='playlist'&&sharedActive&&now-sharedUpdated<750)||(current!=='off'&&current!=='playlist'&&!!analyser&&audioContext?.state==='running')),
     beats:state.kicks,previousBeats:sonicCycleBeats,now,lastChangeAt:sonicCycleAt})){
    sonicSettings=normalizeSonic({...sonicSettings,world:nextSonicWorld(sonicSettings.world)});
    sonicCycleBeats=state.kicks;sonicCycleAt=now;drawSonicControls();saveSonicSettings();
    reportSonic('Sonic Dimension evolved into '+sonicWorld(sonicSettings.world).name+' after 8 measured beats.');
   }
  if(now-lastHistory>125){
   history.push({bass:bands.bass,mid:bands.mid,treble:bands.treble,beat:state.hit});
   if(history.length>120)history.shift();
   lastHistory=now;
  }
  drawStage(now);
  if(frameCount%4===0){stats();drawHistory();}
 }
 raf=requestAnimationFrame(tick);
 $('reactorFullscreen').addEventListener('click',wrap(async()=>{
  if(stage.requestFullscreen)await stage.requestFullscreen();
  else if(stage.webkitEnterFullscreen)stage.webkitEnterFullscreen();
  else status('This device offers the full stage within the page.');
 }));
 async function exportFrame(kind){
  exportingFrame=true;resize();
  let blob;
  try{drawStage(performance.now());blob=await blobCanvas(canvas,'image/png');}
  finally{exportingFrame=false;resize();applyPowerEnvironment();}
  const name='PROXIMUS-'+(sonicSettings.enabled?'SONIC-'+sonicSettings.world.toUpperCase():'REACTOR-'+stem(options().mode))+'.png';
  if(kind==='pack')app.addAsset(name,blob,'Sovereign Reactor');
  else if(kind==='share')await saveOrShare(blob,name);
  else download(blob,name);
  exportStatus('Captured '+name+' · '+bytes(blob.size));
 }
 $('reactorPNG').addEventListener('click',wrap(()=>exportFrame('download')));
 $('reactorPNGPack').addEventListener('click',wrap(()=>exportFrame('pack')));
 $('reactorPNGShare').addEventListener('click',wrap(()=>exportFrame('share')));

 // A real 3-second silent GIF, including the current animated backdrop where
 // the browser decodes it to a drawable frame. Always keep it within mobile memory.
 $('reactorMakeGif').addEventListener('click',wrap(async()=>{
  if(loopCapturing||recording)throw Error('Finish the current recording first.');
  loopCapturing=true;resize();applyPowerEnvironment();$('reactorMakeGif').disabled=true;
  const frames=[],clip=document.createElement('canvas');clip.width=384;clip.height=216;
  const g=clip.getContext('2d',{willReadFrequently:true});
  const duration=3000,count=24;
  try{
   for(let i=0;i<count;i++){
    if(document.hidden)throw Error('Keep Reactor Studio visible while exporting the animated GIF.');
    drawStage(performance.now());
    g.clearRect(0,0,clip.width,clip.height);g.drawImage(canvas,0,0,clip.width,clip.height);
    frames.push({...g.getImageData(0,0,clip.width,clip.height),delayMs:125});
    exportStatus('Capturing GIF frame '+(i+1)+' / '+count);
    await pause(duration/count);
   }
   const blob=encodeGif({width:384,height:216,frames,dither:true});
   loopBlob=blob;loopName='PROXIMUS-'+(sonicSettings.enabled?'SONIC-'+sonicSettings.world:'REACTOR-'+options().mode)+'-LIVE.gif';
   $('reactorSaveGif').hidden=false;$('reactorGifPack').hidden=false;
   download(blob,loopName);
   exportStatus('Animated GIF ready · 384×216 · 24 frames · '+bytes(blob.size));
  }finally{loopCapturing=false;resize();applyPowerEnvironment();$('reactorMakeGif').disabled=false;}
 }));
 $('reactorSaveGif').addEventListener('click',wrap(async()=>{
  if(!loopBlob)throw Error('Create an animated reactor GIF first.');
  const result=await saveOrShare(loopBlob,loopName);
  exportStatus(result==='shared'?'GIF sent to your device share sheet':result==='cancelled'?'Share cancelled':'GIF downloaded');
 }));
 $('reactorGifPack').addEventListener('click',()=>{
  if(!loopBlob)return;app.addAsset(loopName,loopBlob,'Sovereign Reactor');
  exportStatus('Animated reactor GIF added to Asset Packager');
 });
 $('reactorUseBg').addEventListener('click',wrap(()=>{
  if(!loopBlob)throw Error('Create the Reactor GIF first.');
  document.dispatchEvent(new CustomEvent('proximus-media-export',{detail:{blob:loopBlob,name:loopName,target:'background'}}));
  exportStatus('Reactor GIF added to application background');
 }));
 // Silent stage video recording, feature detected. No copyrighted streaming
 // music is recorded or redistributed by default.
 const candidates=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'];
 const mediaType=typeof MediaRecorder!=='undefined'&&typeof MediaRecorder.isTypeSupported==='function'?candidates.find(x=>MediaRecorder.isTypeSupported(x)):null;
 const videoCaptureAvailable=!!canvas.captureStream&&!!mediaType;
 $('reactorRecord').disabled=!videoCaptureAvailable;
 if(!videoCaptureAvailable)$('reactorRecordingStatus').textContent='Use animated GIF or PNG exports on this browser.';
 async function beginRecord(){
  if(recording||loopCapturing)throw Error('Finish the current visual export first.');
  if(!videoCaptureAvailable)throw Error('Canvas video recording is not available; use GIF or PNG exports.');
  recording=true;recordChunks=[];resize();applyPowerEnvironment();
  const duration=Math.max(3,Math.min(15,Number($('reactorRecordSeconds').value)||8));
  const stageStream=canvas.captureStream(30);
  try{
   recorder=new MediaRecorder(stageStream,{mimeType:mediaType,videoBitsPerSecond:3500000});
   const finished=new Promise((resolve,reject)=>{
    recorder.addEventListener('dataavailable',e=>{if(e.data.size)recordChunks.push(e.data);});
    recorder.addEventListener('error',e=>reject(e.error||Error('Media recording failed.')),{once:true});
    recorder.addEventListener('stop',resolve,{once:true});
   });
   recorder.start(250);
   $('reactorRecord').disabled=true;$('reactorStopRecord').disabled=false;
   $('reactorRecordingStatus').textContent='Recording silent visualizer video · '+duration+' seconds';
   recordTimer=setTimeout(()=>{if(recorder?.state==='recording')recorder.stop();},duration*1000);
   await finished;
   if(!recordChunks.length)throw Error('No video frames were recorded.');
   const blob=new Blob(recordChunks,{type:recorder.mimeType||mediaType});
   recordBlob=blob;const ext=blob.type.includes('mp4')?'mp4':'webm';
   recordName='PROXIMUS-'+(sonicSettings.enabled?'SONIC-'+sonicSettings.world:'REACTOR-'+options().mode)+'-'+duration+'s.'+ext;
   $('reactorSaveRecord').hidden=false;$('reactorRecordPack').hidden=false;
   $('reactorRecordingStatus').textContent='Silent visualizer recording ready · '+bytes(blob.size);
  }finally{
   clearTimeout(recordTimer);
   for(const tr of stageStream.getTracks())tr.stop();
   recorder=null;recording=false;resize();applyPowerEnvironment();$('reactorRecord').disabled=false;$('reactorStopRecord').disabled=true;
  }
 }
 $('reactorRecord').addEventListener('click',wrap(beginRecord));
 $('reactorStopRecord').addEventListener('click',()=>{if(recorder?.state==='recording')recorder.stop();});
 $('reactorSaveRecord').addEventListener('click',wrap(async()=>{
  if(!recordBlob)throw Error('Record a stage video first.');
  await saveOrShare(recordBlob,recordName);
 }));
 $('reactorRecordPack').addEventListener('click',()=>{if(recordBlob)app.addAsset(recordName,recordBlob,'Sovereign Reactor');});

 function presetOptions(){
  const list=$('reactorPresetList');list.replaceChildren();
  for(const key of Object.keys(presets).sort()){
   const row=document.createElement('div');row.className='reactor-preset-row';
   const use=document.createElement('button');use.className='small-btn';use.textContent=key;
   use.addEventListener('click',()=>{applyPreset(presets[key]);saveSettings();status('Loaded preset '+key);});
   const del=document.createElement('button');del.className='small-btn';del.textContent='×';del.title='Delete preset';
   del.addEventListener('click',()=>{delete presets[key];saveSettings();presetOptions();});
   row.append(use,del);list.append(row);
  }
  if(!list.childElementCount)list.textContent='Save a Reactor look to recall it later.';
 }
 $('reactorPresetSave').addEventListener('click',wrap(()=>{
  const name=safe($('reactorPresetName').value.trim()).slice(0,55);
  if(!name||name==='asset')throw Error('Name your Reactor preset.');
  presets[name]={...options(),fx:{...fxSettings},sonic:{...sonicSettings}};if(Object.keys(presets).length>24)throw Error('Keep no more than 24 saved presets.');
  saveSettings();presetOptions();status('Saved appearance preset '+name);
 }));
 $('reactorPresetExport').addEventListener('click',()=>{
  download(textFile({schema:'proximus.reactor.presets/1',presets,exported:new Date().toISOString()}),'PROXIMUS-REACTOR-PRESETS.json');
 });
 $('reactorPresetImport').addEventListener('change',wrap(async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>150000)throw Error('Reactor preset backup is too large.');
  const input=JSON.parse(await file.text());
  if(input.schema!=='proximus.reactor.presets/1'||typeof input.presets!=='object'||Array.isArray(input.presets))throw Error('This is not a Reactor preset backup.');
  for(const [key,val] of Object.entries(input.presets).slice(0,24)){
   const normalized=normalizeReactorPreset(val);
   presets[safe(key).slice(0,55)]={...normalized,
    ...(val?.fx?{fx:normalizeEffectSettings(val.fx)}:{}),
    ...(val?.sonic?{sonic:normalizeSonic(val.sonic)}:{})};
  }
  saveSettings();presetOptions();e.target.value='';status('Reactor presets imported.');
 }));
 $('reactorPresetPack').addEventListener('click',()=>{
  app.addAsset('PROXIMUS-REACTOR-PRESETS.json',textFile({schema:'proximus.reactor.presets/1',presets}), 'Sovereign Reactor');
 });
 presetOptions();
 const mobile=/iPad|iPhone|iPod/i.test(navigator.userAgent);
 $('reactorTab').disabled=mobile||!navigator.mediaDevices?.getDisplayMedia;
 $('reactorDevice').textContent=mobile?
  'iPhone: Use a local music file or tap Microphone to react to nearby speaker audio. Other apps’ system audio cannot be read directly by this website.':
  'PC: Use local audio, Microphone or Share tab audio in supported desktop browsers. Choose a tab with audio sharing enabled.';
 status(mobile?'Ready on iPhone · import music or enable the microphone':'Ready on PC · choose an input source');
 exportStatus('Ready for PNG, animated GIF and supported silent video exports.');
 drawStage(performance.now());
 window.addEventListener('pagehide',()=>{
  releaseInput();clearBackdrop();clearOverlay();
  cancelAnimationFrame(raf);if(recorder?.state==='recording')recorder.stop();
  if(audioContext)audioContext.close().catch(()=>{});
 },{once:true});
}
