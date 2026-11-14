// PROXIMUS | ASSET ALCHEMIST — Sovereign Command Center
// Personal dashboard with a visual-only creator/customer layout preference.
// All user permissions still require a protected backend. Never claims that
// changing a browser interface profile provides authorization or access control.
import {$,bytes,wrap} from './core.js';
import {saveOrShare} from './portable-kit.js';
import {readOrbitPins,writeOrbitPins} from './orbit-interface.js';
import {listStoredVideos} from './video-vault.js';
import {LIFE_STORAGE,normalizeLifeData,lifeStats,filterLife,localDay} from './life-command-core.js';
import {COMPANION_LINKS,companionCategory,companionWatchlist,companionSavedOverview,
 cleanCompanionLinks,validateCompanionUrl} from './companion-core.js';
const PROFILE='proximus-command-layout-v1',PINS='proximus-command-pins-v1',NAME='proximus-command-name-v1',NOTES='proximus-companion-pocket-notes-v1';
export const MODES=['creator','customer'];
export function normalizePins(input,known){
 if(!Array.isArray(input))return [];
 const keys=new Set(known),seen=new Set(),out=[];
 for(const id of input)if(keys.has(id)&&!seen.has(id)){out.push(id);seen.add(id);}
 return out.slice(0,16);
}
export function filterStudios(studios,term='',pins=[],onlyPinned=false){
 const t=String(term).trim().toLowerCase();
 return studios.filter(x=>(!onlyPinned||pins.includes(x.id))&&(!t||(x.title+' '+x.detail).toLowerCase().includes(t)))
   .sort((a,b)=>(pins.includes(b.id)?1:0)-(pins.includes(a.id)?1:0));
}
export function initCommandCenter(app){
 const search=$('commandSearch'),grid=$('commandCards'),summary=$('commandStatus'),pinsCount=$('commandPinsCount');
 if(!grid)return;
 const all=app.studios.filter(s=>!['releases','creator'].includes(s.id));
 let pins=[],profile=localStorage.getItem(PROFILE)||'creator',onlyPinned=false;
 let library=[],bookmarks=[];
 try{bookmarks=cleanCompanionLinks(JSON.parse(localStorage.getItem(COMPANION_LINKS)||'[]'));}catch(e){bookmarks=[];}
 try{pins=normalizePins(JSON.parse(localStorage.getItem(PINS)||'[]'),all.map(x=>x.id));}catch(e){pins=[];}
 pins=normalizePins(readOrbitPins(),all.map(x=>x.id));
 if(!MODES.includes(profile))profile='creator';
 const savePins=()=>{try{localStorage.setItem(PINS,JSON.stringify(pins));}catch(e){}writeOrbitPins(pins);};
 function useProfile(value){
  profile=MODES.includes(value)?value:'creator';document.body.dataset.proximusProfile=profile;
  localStorage.setItem(PROFILE,profile);
  $('commandMode').value=profile;
  $('commandModeNote').textContent=profile==='creator'?
   'Creator layout: full workspace navigation and publishing controls.':
   'Customer layout: simpler navigation and creation shortcuts. This is a display preference, not a secure login or permissions system.';
  draw();
 }
 document.addEventListener('proximus-orbit-pins-changed',event=>{
  pins=normalizePins(event.detail?.pins||[],all.map(x=>x.id));draw();
 });
 const advanced=new Set(['audit','production','motiongraphics','recovery','tokens','utility','projects','automation','motion','model']);
 function draw(){
  grid.replaceChildren();
  const category=$('commandCategory').value,hasSearch=!!search.value.trim();
  const showing=filterStudios(all,search.value,pins,onlyPinned)
   .filter(x=>(hasSearch||category==='all'||companionCategory(x.id)===category))
   .filter(x=>profile==='creator'||!advanced.has(x.id));
  for(const s of showing){
   const card=document.createElement('article');card.className='command-studio-card';
   card.dataset.proximusThumbnail=s.id;
   const image=document.createElement('div');image.className='dashboard-thumb';
   const info=document.createElement('div');info.className='command-studio-info';
   const title=document.createElement('strong');title.textContent=s.icon+' '+s.title;
   const desc=document.createElement('p');desc.textContent=s.detail;
   const actions=document.createElement('div');actions.className='command-studio-actions';
   const open=document.createElement('button');open.className='primary';open.textContent='Open studio';
   open.addEventListener('click',()=>app.changeView(s.id));
   const pin=document.createElement('button');pin.className='small-btn';pin.textContent=pins.includes(s.id)?'★ Pinned':'☆ Pin';
   pin.setAttribute('aria-label','Pin '+s.title+' to favorites');
   pin.addEventListener('click',()=>{
    pins=pins.includes(s.id)?pins.filter(x=>x!==s.id):[...pins,s.id].slice(0,16);
    savePins();draw();
   });
   actions.append(open,pin);info.append(title,desc,actions);card.append(image,info);grid.append(card);
  }
  if(!showing.length){const msg=document.createElement('p');msg.className='hint';msg.textContent='No workspaces match your filter.';grid.append(msg);}
  pinsCount.textContent=pins.length+' pinned · '+showing.length+' shown';
  document.dispatchEvent(new Event('proximus-media-refresh'));
 }
 function liveStats(){
  const assets=app.listAssets(),total=assets.reduce((sum,x)=>sum+(x.data?.size||0),0);
  $('commandAssets').textContent=String(assets.length);
  $('commandPackSize').textContent=bytes(total);
  const recent=$('commandRecent');recent.replaceChildren();
  for(const a of assets.slice(-6).reverse()){
   const row=document.createElement('div');row.className='command-recent-item';
   const name=document.createElement('span');name.textContent=a.name;
   const info=document.createElement('small');info.textContent=(a.studio||'Studio')+' · '+bytes(a.data.size);
   const button=document.createElement('button');button.className='small-btn';button.textContent='View pack';
   button.addEventListener('click',()=>app.changeView('pack'));
   row.append(name,info,button);recent.append(row);
  }
  if(!assets.length)recent.textContent='Completed studio exports will appear here.';
 }
 $('commandMode').addEventListener('change',e=>useProfile(e.target.value));
 search.addEventListener('input',draw);
 $('commandCategory').addEventListener('change',draw);
 $('commandOnlyPinned').addEventListener('change',e=>{onlyPinned=e.target.checked;draw();});
 $('commandOpenSync').addEventListener('click',()=>app.changeView('sync'));
 $('commandOpenProjects').addEventListener('click',()=>app.changeView('projects'));
 $('commandOpenMedia').addEventListener('click',()=>$('mediaOpen').click());
 $('commandOpenReactor').addEventListener('click',()=>app.changeView('reactor'));
 $('commandOpenVideos').addEventListener('click',()=>app.changeView('videos'));
 $('commandOpenTheater').addEventListener('click',()=>app.changeView('theater'));
 $('commandOpenArcade').addEventListener('click',()=>app.changeView('arcade'));
 $('commandOpenLife').addEventListener('click',()=>app.changeView('life'));
 $('commandOpenWorkflow').addEventListener('click',()=>app.changeView('workflow'));
 $('commandOpenAnimation').addEventListener('click',()=>app.changeView('animation'));
 $('commandOpenRelease').addEventListener('click',()=>app.changeView('releases'));
 $('commandOpenRecovery').addEventListener('click',()=>app.changeView('recovery'));
 $('commandCheckUpdates').addEventListener('click',()=>$('versionCheck').click());
 const label=$('commandDisplayName');
 label.value=localStorage.getItem(NAME)||'';
 label.addEventListener('change',()=>{
  const value=label.value.trim().slice(0,45);
  localStorage.setItem(NAME,value);drawGreeting();
 });
 function drawGreeting(){
  const name=localStorage.getItem(NAME)||'';
  $('commandGreeting').textContent=name?'Welcome back, '+name+'.':'Welcome to your PROXIMUS command center.';
 }
 document.addEventListener('proximus-pack-changed',liveStats);
 document.addEventListener('proximus-workspace-restored',()=>{liveStats();draw();});
 $('commandRefresh').addEventListener('click',()=>{liveStats();draw();summary.textContent='Command dashboard refreshed.';});

 function watchFromHome(id){
  app.changeView('videos');
  document.dispatchEvent(new CustomEvent('proximus-video-vault-watch',{detail:{id}}));
 }
 async function refreshOverview(){
  try{
   library=await listStoredVideos();
   const stats=companionSavedOverview(library);
   $('commandVideoCount').textContent=stats.saved+' saved videos';
   $('commandVideoContinueCount').textContent=stats.inProgress+' in progress';
   $('commandVideoFavoriteCount').textContent=stats.favorites+' favorites';
   const panel=$('commandContinue');panel.replaceChildren();
   const watched=companionWatchlist(library,4);
   for(const item of watched){
    const button=document.createElement('button');
    button.className='companion-resume-item';button.type='button';
    const title=document.createElement('strong');title.textContent=item.name;
    const details=document.createElement('small');
    const pos=Math.max(0,Math.floor(item.position||0));
    details.textContent='▶ Resume at '+Math.floor(pos/60)+':'+String(pos%60).padStart(2,'0')+
      (item.duration?' · '+Math.round(pos/item.duration*100)+'% watched':'');
    button.append(title,details);
    button.addEventListener('click',()=>watchFromHome(item.id));panel.append(button);
   }
   if(!watched.length)panel.textContent=stats.saved?
    'Your saved videos are ready. Start watching one from Video Vault and it will appear here.' :
    'Save your first video in Video Vault to start building your personal entertainment library.';
  }catch(error){
   $('commandContinue').textContent='Local video library unavailable: '+error.message;
  }
 }
 const persistBookmarks=()=>{
  try{localStorage.setItem(COMPANION_LINKS,JSON.stringify(bookmarks));}
  catch(e){$('commandLinksStatus').textContent='Browser preference storage is full. Use workspace backup after freeing space.';}
 };
 function renderBookmarks(){
  const holder=$('commandLinks');holder.replaceChildren();
  for(const entry of bookmarks){
   const row=document.createElement('div');row.className='companion-link-item';
   const anchor=document.createElement('a');anchor.href=entry.url;anchor.target='_blank';
   anchor.rel='noopener noreferrer';anchor.textContent=entry.name;anchor.title=entry.url;
   const host=document.createElement('small');
   try{host.textContent=new URL(entry.url).hostname;}catch(e){}
   const remove=document.createElement('button');remove.className='small-btn';
   remove.textContent='×';remove.title='Remove '+entry.name;
   remove.setAttribute('aria-label','Remove '+entry.name);
   remove.addEventListener('click',()=>{
    bookmarks=bookmarks.filter(x=>x.id!==entry.id);
    persistBookmarks();renderBookmarks();
   });
   row.append(anchor,host,remove);holder.append(row);
  }
  if(!bookmarks.length)holder.textContent='No saved shortcuts yet. Add an HTTPS website above for one-tap access.';
  $('commandLinksStatus').textContent=bookmarks.length+' of 12 shortcuts saved on this device · external sites open in a new tab.';
 }
 $('commandLinkAdd').addEventListener('click',wrap(()=>{
  const name=$('commandLinkName').value.trim().slice(0,46);
  if(!name)throw Error('Choose a short name for this website.');
  if(bookmarks.length>=12)throw Error('The companion supports up to 12 personal shortcuts.');
  const url=validateCompanionUrl($('commandLinkUrl').value);
  const id=crypto.randomUUID?crypto.randomUUID():String(Date.now())+'-'+Math.random().toString(36).slice(2);
  bookmarks.push({id,name,url});persistBookmarks();renderBookmarks();
  $('commandLinkName').value='';$('commandLinkUrl').value='';
 }));
 $('commandWatchLibrary').addEventListener('click',()=>app.changeView('videos'));
 $('commandWatchFavorites').addEventListener('click',()=>{
  app.changeView('videos');
  $('videoVaultFilter').value='favorites';
  $('videoVaultFilter').dispatchEvent(new Event('input'));
 });
 $('commandSurprise').addEventListener('click',()=>{
  if(!library.length){app.changeView('videos');return;}
  const favorites=library.filter(v=>v.favorite);
  const pool=favorites.length?favorites:library;
  const random=pool[Math.floor(Math.random()*pool.length)];
  if(random)watchFromHome(random.id);
 });
 $('commandRefreshCompanion').addEventListener('click',()=>void refreshOverview());
 document.addEventListener('proximus-view-changed',e=>{
  if(e.detail?.studio==='command')void refreshOverview();
 });
 document.addEventListener('proximus-video-vault-changed',()=>{
  if(document.querySelector('.studio:not([hidden])')?.dataset.panel==='command')void refreshOverview();
 });
 document.addEventListener('proximus-workspace-restored',()=>{
  try{bookmarks=cleanCompanionLinks(JSON.parse(localStorage.getItem(COMPANION_LINKS)||'[]'));}
  catch(e){bookmarks=[];}
  renderBookmarks();void refreshOverview();
  try{$('commandPocketNotes').value=(localStorage.getItem(NOTES)||'').slice(0,8000);}catch(e){}
 });
 renderBookmarks();void refreshOverview();

 function refreshLife(){
  const summary=$('commandLifeSummary'),detail=$('commandLifeDetail');
  try{
   const state=normalizeLifeData(JSON.parse(localStorage.getItem(LIFE_STORAGE)||'{}'));
   const now=localDay(),stats=lifeStats(state.items,now);
   summary.textContent=stats.soon+' upcoming · '+stats.doneToday+' completed today';
   const active=filterLife(state.items,{status:'active',today:now}).slice(0,2);
   detail.textContent=active.length?active.map(x=>x.title).join(' · '):
    'No unfinished tasks. Open Life Command to plan your next day.';
  }catch(e){summary.textContent='Your Life Command is ready';detail.textContent='Open to plan your day.';}
 }
 $('commandLifeNow').addEventListener('click',()=>app.changeView('life'));
 document.addEventListener('proximus-life-changed',refreshLife);
 document.addEventListener('proximus-view-changed',e=>{
  if(e.detail?.studio==='command')refreshLife();
 });
 refreshLife();

 const notes=$('commandPocketNotes'),notesStatus=$('commandNotesStatus');
 try{notes.value=(localStorage.getItem(NOTES)||'').slice(0,8000);}catch(e){}
 notes.addEventListener('input',()=>{
  const value=notes.value.slice(0,8000);
  try{localStorage.setItem(NOTES,value);
   notesStatus.textContent='Pocket Notes saved locally · '+value.length+' / 8,000 characters';
  }catch(e){notesStatus.textContent='Browser storage full. Export notes to keep your changes.';}
 });
 $('commandNotesExport').addEventListener('click',wrap(async()=>{
  if(!notes.value.trim())throw Error('Pocket Notes is empty.');
  const file=new Blob([notes.value],{type:'text/plain;charset=utf-8'});
  await saveOrShare(file,'PROXIMUS-COMPANION-POCKET-NOTES.txt');
  notesStatus.textContent='Your Pocket Notes were shared or downloaded.';
 }));
 $('commandNotesClear').addEventListener('click',()=>{
  if(!notes.value||!confirm('Clear your private Pocket Notes from this browser?'))return;
  notes.value='';notes.dispatchEvent(new Event('input'));
 });

 useProfile(profile);liveStats();drawGreeting();
 summary.textContent='Companion Edition · entertainment, Life Command planning, saved videos and 18 focused spaces.';
}
