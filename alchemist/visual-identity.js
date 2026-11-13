// PROXIMUS Asset Alchemist v3.0 — Master Visual Identity Publisher
// Local cosmetic state only: never alters user tokens, auth, or GitHub source.
import {$,download,wrap,notice,textFile} from './core.js';
import {saveOrShare} from './portable-kit.js';
import {
 IDENTITY_STORAGE,IDENTITY_PALETTES,IDENTITY_SCHEMA,DEFAULT_IDENTITY,
 normalizeIdentity,colorsForIdentity,identityAsCSS,identityBackup,readIdentityBackup
} from './visual-identity-core.js';
const editable=['accent','secondary','glow','base','panel','border'];
const reactorTheme={sovereign:'void',solar:'celestial',abyss:'frost',ember:'inferno',emerald:'emerald',frost:'frost'};
export function initVisualIdentity(app){
 const root=$('identityStudio');if(!root)return;
 let state=normalizeIdentity(DEFAULT_IDENTITY);
 try{const raw=localStorage.getItem(IDENTITY_STORAGE);if(raw)state=normalizeIdentity(JSON.parse(raw));}catch(e){}
 const studioIds=app.studios.filter(x=>!['releases','creator','identity'].includes(x.id));
 let lastScheduled='',currentCard='';
 const status=$('identityStatus'),picker=$('identityPresetGallery');
 function say(x){status.textContent=x;}
 function persist(){try{localStorage.setItem(IDENTITY_STORAGE,JSON.stringify(state));}catch(e){say('Theme works for this session, but browser storage is unavailable.');}}
 function emitAppearance(){
  const resolved=colorsForIdentity(state),enabled=state.enabled,colors=resolved.colors;
  const vars=identityAsCSS({colors},state.glow);
  const html=document.documentElement;
  for(const [key,value] of Object.entries(vars))html.style.setProperty(key,value);
  document.body.dataset.identityEnabled=enabled?'on':'off';
  document.body.dataset.identityBorder=state.borderStyle;
  document.body.dataset.identityMotion=state.motion;
  document.body.dataset.identityMasterMedia=state.applyMasterMedia?'on':'off';
  html.style.setProperty('--identity-font-scale',String(state.fontScale));
  for(const section of document.querySelectorAll('.studio[data-panel]')){
   section.dataset.identityExempt=state.exempt.includes(section.dataset.panel)?'true':'false';
  }
  lastScheduled=resolved.palette;
  document.dispatchEvent(new CustomEvent('proximus-identity-changed',{detail:{
   palette:resolved.palette,colors,enabled,applyReactor:state.applyReactor,
   masterMedia:state.applyMasterMedia
  }}));
  $('identityCurrentTheme').textContent=(IDENTITY_PALETTES[resolved.palette]?.name||resolved.palette)+
   (state.schedule.enabled?' · Scheduled':'');
  $('identityMediaStatus').textContent=state.applyMasterMedia?
   'Existing Master Thumbnail remains enabled across the site.':'Master Thumbnail temporarily hidden by the visual identity preset; your saved file is preserved.';
 }
 function renderGallery(){
  picker.replaceChildren();
  for(const [key,v] of Object.entries(IDENTITY_PALETTES)){
   const btn=document.createElement('button');btn.className='identity-preset-card';
   btn.type='button';btn.dataset.palette=key;
   if(state.palette===key)btn.classList.add('selected');
   const swatch=document.createElement('span');swatch.className='identity-swatch';
   swatch.style.background='radial-gradient(circle at 25% 20%,'+v.glow+',transparent 70%),linear-gradient(115deg,'+v.base+','+v.panel+')';
   swatch.style.borderColor=v.border;
   const name=document.createElement('strong');name.textContent=v.name;
   const desc=document.createElement('small');desc.textContent=v.accent+' · '+v.secondary;
   btn.append(swatch,name,desc);
   btn.addEventListener('click',()=>{
    state.palette=key;state.customColors=null;state.enabled=true;persist();render();say('Applied '+v.name+'.');
   });
   picker.append(btn);
  }
 }
 function renderExceptions(){
  const holder=$('identityStudioExceptions');holder.replaceChildren();
  for(const s of studioIds){
   const label=document.createElement('label');label.className='identity-exception-row';
   const input=document.createElement('input');input.type='checkbox';input.checked=state.exempt.includes(s.id);
   input.addEventListener('change',()=>{
    state.exempt=input.checked?[...state.exempt,s.id]:state.exempt.filter(v=>v!==s.id);
    state=normalizeIdentity(state);persist();emitAppearance();
   });
   label.append(input,document.createTextNode(' Preserve default look: '+s.title));holder.append(label);
  }
 }
 function renderSaved(){
  const holder=$('identitySavedProfiles');holder.replaceChildren();
  for(const preset of state.saved){
   const row=document.createElement('div');row.className='identity-saved-item';
   const b=document.createElement('button');b.className='small-btn';b.textContent='✧ '+preset.name;
   b.addEventListener('click',()=>{
    state.palette=preset.value.palette;state.customColors=preset.value.colors;
    state.enabled=true;persist();render();say('Loaded '+preset.name+' identity.');
   });
   const del=document.createElement('button');del.className='small-btn';del.textContent='×';del.title='Delete appearance preset';
   del.addEventListener('click',()=>{
    state.saved=state.saved.filter(x=>x!==preset);persist();renderSaved();
   });
   row.append(b,del);holder.append(row);
  }
  if(!holder.childElementCount)holder.textContent='Save named color compositions for instant switching.';
 }
 function syncControls(){
  $('identityEnabled').checked=state.enabled;
  $('identityMasterEnabled').checked=state.applyMasterMedia;
  $('identityReactorLinked').checked=state.applyReactor;
  $('identityGlow').value=String(state.glow);
  $('identityFontScale').value=String(state.fontScale);
  $('identityBorder').value=state.borderStyle;
  $('identityMotion').value=state.motion;
  $('identityScheduleEnabled').checked=state.schedule.enabled;
  $('identityDay').value=state.schedule.day;
  $('identityNight').value=state.schedule.night;
  $('identityScheduleStart').value=String(state.schedule.start);
  $('identityScheduleEnd').value=String(state.schedule.end);
  $('identityGlowOut').textContent=Math.round(state.glow*100)+'%';
  $('identityScaleOut').textContent=Math.round(state.fontScale*100)+'%';
  const colors=state.customColors||IDENTITY_PALETTES[state.palette];
  for(const key of editable)$('identityColor'+key[0].toUpperCase()+key.slice(1)).value=colors[key];
 }
 function render(){syncControls();renderGallery();renderExceptions();renderSaved();emitAppearance();}
 for(const [id,set] of [
  ['identityEnabled',v=>state.enabled=v],
  ['identityMasterEnabled',v=>state.applyMasterMedia=v],
  ['identityReactorLinked',v=>state.applyReactor=v],
  ['identityScheduleEnabled',v=>state.schedule.enabled=v]
 ]){
  $(id).addEventListener('change',e=>{set(e.target.checked);persist();emitAppearance();});
 }
 for(const [id,set] of [
  ['identityGlow',v=>state.glow=Number(v)],['identityFontScale',v=>state.fontScale=Number(v)],
  ['identityBorder',v=>state.borderStyle=v],['identityMotion',v=>state.motion=v],
  ['identityDay',v=>state.schedule.day=v],['identityNight',v=>state.schedule.night=v],
  ['identityScheduleStart',v=>state.schedule.start=Number(v)],['identityScheduleEnd',v=>state.schedule.end=Number(v)]
 ]){
  $(id).addEventListener('input',e=>{set(e.target.value);state=normalizeIdentity(state);persist();syncControls();emitAppearance();});
 }
 for(const key of editable){
  const id='identityColor'+key[0].toUpperCase()+key.slice(1);
  $(id).addEventListener('input',e=>{
   state.customColors={...(state.customColors||IDENTITY_PALETTES[state.palette]),[key]:e.target.value};
   state=normalizeIdentity(state);persist();emitAppearance();
  });
 }
 $('identityReset').addEventListener('click',()=>{
  if(!confirm('Reset visual identity preferences? Uploaded media and all studio files are preserved.'))return;
  const keep=state.saved;
  state=normalizeIdentity({...DEFAULT_IDENTITY,saved:keep});
  persist();render();say('Restored default Sovereign Violet identity.');
 });
 $('identitySaveProfile').addEventListener('click',wrap(()=>{
  const name=$('identityProfileName').value.trim().slice(0,42);
  if(!name)throw Error('Name this visual identity preset first.');
  if(state.saved.length>=12&&!state.saved.some(x=>x.name===name))throw Error('You can store up to 12 visual identity presets.');
  state.saved=state.saved.filter(x=>x.name!==name);
  state.saved.push({name,value:{palette:state.palette,colors:state.customColors}});
  state=normalizeIdentity(state);persist();renderSaved();say('Saved appearance preset '+name+'.');
 }));
 $('identityExport').addEventListener('click',wrap(async()=>{
  const blob=textFile(identityBackup(state));
  await saveOrShare(blob,'PROXIMUS-VISUAL-IDENTITY-v3.json');
  say('Visual identity profile exported. Include full media in Sync Bridge separately.');
 }));
 $('identityImport').addEventListener('change',wrap(async e=>{
  const file=e.target.files?.[0];if(!file)return;
  if(file.size>180000)throw Error('Identity backup is too large.');
  const restored=readIdentityBackup(JSON.parse(await file.text()));
  state=restored;persist();render();e.target.value='';say('Imported and applied your visual identity.');
 }));
 $('identityOpenMedia').addEventListener('click',()=>{
  $('mediaTarget').value='master';$('mediaTarget').dispatchEvent(new Event('change'));
  $('mediaOpen').click();$('mediaTarget').value='master';$('mediaTarget').dispatchEvent(new Event('change'));
 });
 $('identityOpenBackground').addEventListener('click',()=>{
  $('mediaOpen').click();$('mediaTarget').value='background';$('mediaTarget').dispatchEvent(new Event('change'));
 });
 $('identityOpenSync').addEventListener('click',()=>app.changeView('sync'));
 $('identityReactorOpen').addEventListener('click',()=>app.changeView('reactor'));
 $('identityShareToReactor').addEventListener('click',()=>{
  state.applyReactor=true;persist();syncControls();emitAppearance();say('Reactor IV color link enabled. Open Reactor to customize effect mappings.');
 });
 $('identityExceptionToggle').addEventListener('click',()=>{
  const panel=$('identityExceptionsPanel');panel.hidden=!panel.hidden;
 });
 function tickSchedule(){
  if(state.schedule.enabled){
   const key=colorsForIdentity(state).palette;
   if(key!==lastScheduled)emitAppearance();
  }
 }
 window.addEventListener('focus',tickSchedule);
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)tickSchedule();});
 const scheduleTicker=setInterval(()=>{if(!document.hidden)tickSchedule();},60000);
 window.addEventListener('pagehide',()=>clearInterval(scheduleTicker),{once:true});
 window.addEventListener('storage',e=>{
  if(e.key===IDENTITY_STORAGE){
   try{state=normalizeIdentity(JSON.parse(e.newValue||'{}'));render();}catch(err){}
  }
 });
 document.addEventListener('proximus-workspace-restored',()=>{
  try{state=normalizeIdentity(JSON.parse(localStorage.getItem(IDENTITY_STORAGE)||'{}'));render();}catch(e){}
 });
 render();say('Visual identity loaded · all appearance changes remain on this device.');
}
