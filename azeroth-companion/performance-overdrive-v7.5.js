/* NEXUS | AZEROTH v7.5 — Performance Overdrive
 * Presentation-only choice; cannot write talent allocations, media libraries,
 * account credentials, inventory, or other game/planning records.
 */
(()=>{'use strict';
const forge=document.getElementById('talentForge'),tree=document.getElementById('tfTree');
if(!forge||!tree||document.getElementById('nxPerformanceOverdrive'))return;
const KEY='nexus_azeroth_perf_profile_v75',allowed=new Set(['auto','full','lite']);
let setting='auto';try{const x=localStorage.getItem(KEY);if(allowed.has(x))setting=x}catch(_){}
const panel=document.createElement('div');panel.id='nxPerformanceOverdrive';panel.className='nx-performance-overdrive';
panel.innerHTML='<div><strong>⚡ PERFORMANCE OVERDRIVE</strong><small>Optional display mode · never changes talents, data or music</small></div>'+
'<label for="nxPerformanceProfile">Visual performance<select id="nxPerformanceProfile"><option value="auto">AUTO · Adaptive</option><option value="full">FULL · Original effects</option><option value="lite">LITE · Faster visual effects</option></select></label>'+
'<span id="nxPerformanceState" role="status"></span>';
const anchor=document.getElementById('tfCanvasTools')||tree;
anchor.before(panel);
const selector=document.getElementById('nxPerformanceProfile'),status=document.getElementById('nxPerformanceState');
selector.value=setting;
const viewport=matchMedia('(max-width: 760px)'),motion=matchMedia('(prefers-reduced-motion: reduce)');
function apply(){
 const lite=setting==='lite'||setting==='auto'&&(viewport.matches||motion.matches);
 document.documentElement.classList.toggle('nx-performance-lite',lite);
 status.textContent=lite?'Lightweight tree effects active':'Original tree effects active';
 selector.setAttribute('aria-label','Talent Forge visual performance: '+setting);
}
selector.addEventListener('change',()=>{
 if(!allowed.has(selector.value))return;
 setting=selector.value;
 try{localStorage.setItem(KEY,setting)}catch(_){}
 apply();
});
viewport.addEventListener?.('change',apply);
motion.addEventListener?.('change',apply);
apply();
})();


/* v21 SOVEREIGN UNITY bundled core and UI — no new main page JS requests */
/* NEXUS | AZEROTH v21 — SOVEREIGN UNITY CORE
 * Pure, bounded public studio directory and browser-local planning snapshots.
 * Does not call any network, storage, authentication or Blizzard endpoint.
 */
(()=>{'use strict';
const VERSION='21.0.0',KEY='nexus_azeroth_unity_v21';
const DIR=Object.freeze([
 {id:'command',title:'Living Command Center',icon:'✦',group:'Command',href:'./command-center.html',desc:'Your connected entry to character research and local plans',tokens:'home command center launch navigation studios war room overview'},
 {id:'companion',title:'Full Azeroth Companion',icon:'◈',group:'Command',href:'./?enter=1',desc:'Character roster, collections and personal planning tools',tokens:'app overview dashboard character collection builds'},
 {id:'character',title:'Character Nexus',icon:'♟',group:'Character',href:'./player-experience.html',desc:'Profiles, linked builds and clearly sourced research',tokens:'character nexus profile armory equipped gear link'},
 {id:'forge',title:'Talent Forge',icon:'⚔',group:'Character',href:'./?enter=1&view=talents',desc:'Plan talents and compare your saved build choices',tokens:'talent build skill planner specialization points allocation'},
 {id:'builds',title:'Build Architect',icon:'◇',group:'Character',href:'./?enter=1&view=builds',desc:'Keep personal build references and notes',tokens:'build architect draft loadout talent'},
 {id:'armory',title:'Living Armory',icon:'⛨',group:'Character',href:'./character-intelligence.html',desc:'Equipment and public character research',tokens:'armory gear equipment items public blizzard'},
 {id:'atlas',title:'World Atlas',icon:'◉',group:'Adventure',href:'./world-atlas.html',desc:'Region intelligence, destinations and saved travel plans',tokens:'world map zone region map pins cartographer route'},
 {id:'director',title:'Living Intelligence Director',icon:'✧',group:'Adventure',href:'./living-intelligence.html',desc:'Connect manual Atlas missions, public equipment research and personal session preparation',tokens:'living intelligence adventure director planner prepare session character gear coordinate waypoint v22'},
 {id:'operations',title:'Adventure Operations',icon:'✧',group:'Adventure',href:'./adventure-operations.html',desc:'Sequence your personal objectives into a session',tokens:'adventure operations session checklist plan time'},
 {id:'expedition',title:'Expedition Intelligence',icon:'⌖',group:'Adventure',href:'./expedition-console.html',desc:'Prepare missions and source-backed research notes',tokens:'expedition mission preparation checklist briefs'},
 {id:'progression',title:'Progression Intelligence',icon:'✥',group:'Adventure',href:'./progression-intelligence.html',desc:'Research raids, reputations and progression systems',tokens:'progression world of warcraft quests activities raids'},
 {id:'living',title:'Living Azeroth',icon:'✺',group:'Adventure',href:'./living-azeroth.html',desc:'Cinematic world research and discovery portal',tokens:'living azeroth world portal cinematic'},
 {id:'vault',title:'Private Video Vault',icon:'◆',group:'Personal',href:'./private-video-vault.html',desc:'Locally encrypted personal videos and independent backup',tokens:'password protected private video media encrypted vault'},
 {id:'backup',title:'Save Protection',icon:'▣',group:'Personal',href:'./save-protection.html',desc:'Export compatible planning records; Vault backup is separate',tokens:'save protection backup progress export recovery'},
 {id:'oracle',title:'Azeroth Oracle',icon:'☼',group:'Explore',href:'./azeroth-assistant.html',desc:'Guided answers from the companion knowledge library',tokens:'assistant oracle knowledge questions help'},
 {id:'handbook',title:'Player Handbook',icon:'▤',group:'Explore',href:'./player-handbook.html',desc:'Understand the companion features and limits',tokens:'guide documentation handbook learning how to'},
 {id:'addons',title:'Addon Nexus',icon:'⚙',group:'Explore',href:'./addon-nexus.html',desc:'Curated research and addon guidance',tokens:'addon nexus mod plugin research'},
 {id:'updates',title:'Release History',icon:'✎',group:'Explore',href:'./release-notes.html',desc:'Verified owner release notes and version history',tokens:'update patch release version changes news'},
 {id:'gateway',title:'NEXUS Gateway',icon:'⌂',group:'NEXUS',href:'../hub/',desc:'Browse the complete NEXUS collection',tokens:'gateway proximus nexus website other studios'},
 {id:'alchemist',title:'Asset Alchemist',icon:'◈',group:'NEXUS',href:'../alchemist/',desc:'Create and organize your own media and utilities',tokens:'alchemist videos gif studio images audio creator'}
]);
const idMap=new Map(DIR.map(x=>[x.id,x]));
const validId=v=>typeof v==='string'&&idMap.has(v);
const safeZone=v=>typeof v==='string'&&/^[a-z0-9-]{4,80}$/.test(v);
const trim=(v,max=90)=>typeof v==='string'?v.trim().slice(0,max):'';
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const arr=(v,max=100)=>Array.isArray(v)?v.slice(0,max):[];
function normalizePreferences(value){
 const source=obj(value)?value:{},pinned=[],seen=new Set(),recent=[],rseen=new Set();
 for(const id of arr(source.pinned,50))if(validId(id)&&!seen.has(id)&&pinned.length<6){pinned.push(id);seen.add(id)}
 for(const id of arr(source.recent,50))if(validId(id)&&!rseen.has(id)&&recent.length<8){recent.push(id);rseen.add(id)}
 return {format:'nexus.unity/1',pinned, recent};
}
function togglePinned(value,id){
 const state=normalizePreferences(value);
 if(!validId(id))return state;
 const pinned=state.pinned.includes(id)?state.pinned.filter(x=>x!==id):
  [id,...state.pinned.filter(x=>x!==id)].slice(0,6);
 return {...state,pinned};
}
function visit(value,id){
 const state=normalizePreferences(value);
 if(!validId(id))return state;
 return {...state,recent:[id,...state.recent.filter(x=>x!==id)].slice(0,8)};
}
function snapshot(raw){
 const src=obj(raw)?raw:{},atlas=arr(src.atlas,100),routes=arr(src.routes?.routes,6),
 operations=arr(src.operations?.entries,18),forge=arr(src.forge,160),characters=arr(src.core?.characters,150),
 builds=arr(src.core?.builds,120),collections=arr(src.core?.collections,120);
 const goals=atlas.filter(x=>obj(x)&&trim(x.title,100)),
 active=goals.filter(x=>x.status==='active'),planned=goals.filter(x=>x.status==='planned');
 const destination=active.find(x=>safeZone(x.zoneId))||planned.find(x=>safeZone(x.zoneId))||null;
 const firstRoutes=routes.filter(x=>obj(x)&&trim(x.title,80));
 const steps=firstRoutes.reduce((sum,r)=>sum+arr(r.stops,12).length,0);
 return Object.freeze({
  characterCount:characters.filter(x=>obj(x)&&trim(x.name)).length,
  draftCount:forge.filter(x=>obj(x)&&trim(x.name)&&obj(x.rankByNode)).length+builds.filter(x=>obj(x)&&trim(x.title)).length,
  collectionCount:collections.length,
  atlasCount:goals.length,activeCount:active.length,plannedCount:planned.length,
  routeCount:firstRoutes.length,routeStops:steps,sessionCount:operations.length,
  nextGoal:destination?{title:trim(destination.title,90),zoneId:destination.zoneId,status:destination.status}:null,
  goals:goals.slice(0,35).filter(x=>safeZone(x.zoneId)).map(x=>({
   title:trim(x.title,90),zoneId:x.zoneId,status:trim(x.status,25)
  })),
  routes:firstRoutes.map(x=>({title:trim(x.title,80),stops:arr(x.stops,12).length}))
 });
}
function search(query,snap,limit=22){
 const q=trim(query,90).toLowerCase().replace(/\s+/g,' ').trim();
 const words=q.split(' ').filter(Boolean),results=[];
 for(const d of DIR){
  const corpus=(d.title+' '+d.desc+' '+d.tokens+' '+d.group).toLowerCase();
  if(words.every(x=>corpus.includes(x))){
   const score=!q?1:d.title.toLowerCase().startsWith(q)?6:d.title.toLowerCase().includes(q)?4:2;
   results.push({kind:'studio',id:d.id,title:d.title,subtitle:d.desc,href:d.href,icon:d.icon,group:d.group,score});
  }
 }
 if(q&&obj(snap)){
  for(const goal of arr(snap.goals,35)){
   const corpus=(goal.title+' '+goal.zoneId+' atlas mission '+goal.status).toLowerCase();
   if(words.every(x=>corpus.includes(x))){
    results.push({kind:'manual',title:goal.title,subtitle:'MANUAL '+(goal.status||'saved')+' · '+goal.zoneId,
     href:'./world-atlas.html?zone='+encodeURIComponent(goal.zoneId),icon:'◉',group:'Manual objectives',score:3});
   }
  }
  if(words.some(w=>'route expedition itinerary'.includes(w)))for(const route of arr(snap.routes,6)){
   results.push({kind:'route',title:route.title,subtitle:route.stops+' saved manual destinations',
    href:'./world-atlas.html',icon:'✧',group:'Saved routes',score:2});
  }
 }
 return results.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).slice(0,Math.min(40,Math.max(1,limit)));
}
const JOURNEYS=Object.freeze([
 {id:'prepare',title:'Prepare an adventure',desc:'Research a destination, organize your session, then review preparation.',steps:['atlas','operations','expedition']},
 {id:'character',title:'Build your character',desc:'Open a character, plan talents, then research equipment.',steps:['character','forge','armory']},
 {id:'collect',title:'Plan a collection',desc:'Study progression, record collections and preserve your plans.',steps:['progression','companion','backup']},
 {id:'private',title:'Organize your media',desc:'Keep personal videos encrypted and create independent archive backups.',steps:['vault','backup','handbook']}
]);
const api=Object.freeze({VERSION,KEY,DIR,JOURNEYS,idMap,validId,safeZone,trim,
 normalizePreferences,togglePinned,visit,snapshot,search});
Object.defineProperty(window,'NexusUnityCoreV21',{value:api,writable:false,configurable:false});
})();
/* NEXUS | AZEROTH v21 — SOVEREIGN UNITY
 * A single cross-studio command/search experience. Zero network calls, zero
 * interference with OAuth, Blizzard, Vault encryption or old saved records.
 * Writes ONLY a bounded list of public studio IDs in nexus_azeroth_unity_v21.
 */
(()=>{'use strict';
const core=window.NexusUnityCoreV21;
if(!core||window.NexusUnityV21)return;
const $=id=>document.getElementById(id),doc=document;
const el=(tag,cls,label)=>{const x=doc.createElement(tag);if(cls)x.className=cls;if(label!==undefined)x.textContent=String(label);return x};
const page=location.pathname.split('/').pop().toLowerCase()||'index.html';
const inVault=page==='private-video-vault.html';
const isCommand=page==='command-center.html';
const state={open:false,query:'',category:'All',tab:'explore',prefs:core.normalizePreferences(null),
 snapshot:core.snapshot({}),activeIndex:0,items:[]};
function read(key,max=500000){
 if(inVault)return null; // no other private planning data or preferences read from Vault
 try{const s=localStorage.getItem(key);return s&&s.length<=max?JSON.parse(s):null}catch(_){return null}
}
function load(){
 if(inVault){state.prefs=core.normalizePreferences(null);state.snapshot=core.snapshot({});return}
 state.prefs=core.normalizePreferences(read(core.KEY,2000));
 state.snapshot=core.snapshot({
  atlas:read('nexus_world_atlas_goals_v16',600000),
  routes:read('nexus_atlas_routes_v181',280000),
  operations:read('nexus_adventure_operations_v17',180000),
  forge:read('nexus_azeroth_talent_forge_v1',400000),
  core:read('nexus_azeroth_companion_genesis_v1',650000)
 });
}
function save(){
 if(inVault)return;
 try{localStorage.setItem(core.KEY,JSON.stringify(state.prefs))}catch(_){}
}
function currentId(){
 if(page==='index.html'){
  const view=new URLSearchParams(location.search).get('view');
  if(view==='talents')return 'forge';
  if(view==='builds')return 'builds';
  return 'companion';
 }
 const matches=core.DIR.filter(x=>{
  const url=new URL(x.href,location.href);
  return url.pathname===location.pathname&&x.id!=='companion';
 });
 return matches[0]?.id||null;
}
function hrefFor(id){return core.idMap.get(id)?.href||'./command-center.html'}
function refresh(){
 load();
 if(state.open)render();
 renderBridge();
}
function prefer(id){
 if(inVault)return;
 state.prefs=core.togglePinned(state.prefs,id);save();
 render();
}
function node(type,name,content){return el(type,name,content)}
function linkRow(item){
 const row=node('div','nx21-result');
 row.dataset.nx21Id=item.id||'';
 if(item.kind==='manual')row.classList.add('nx21-manual-result');
 const anchor=node('a','nx21-result-link');anchor.href=item.href;
 const ico=node('span','nx21-result-icon',item.icon);ico.setAttribute('aria-hidden','true');
 const body=node('span','nx21-result-text');
 body.append(node('strong','',item.title),node('small','',item.subtitle));
 anchor.append(ico,body,node('span','nx21-result-arrow','↗'));
 row.append(anchor);
 if(item.kind==='studio'&&!inVault){
  const pressed=state.prefs.pinned.includes(item.id);
  const fav=node('button','nx21-pin',pressed?'★':'☆');
  fav.type='button';fav.dataset.nx21Pin=item.id;
  fav.setAttribute('aria-label',(pressed?'Unpin ':'Pin ')+item.title);
  fav.setAttribute('aria-pressed',String(pressed));
  row.append(fav);
 }
 return row;
}
function statusStat(value,label){
 const w=node('div','nx21-stat');
 w.append(node('strong','',value),node('span','',label));
 return w;
}
function paintPersonal(){
 const host=$('nx21Personal'),s=state.snapshot;
 host.replaceChildren();
 if(inVault){
  host.append(node('p','nx21-private-notice','This secure Vault remains isolated. NEXUS navigation never reads your encrypted videos, password or filenames.'));
  return;
 }
 const stats=node('div','nx21-stats');
 stats.append(statusStat(s.characterCount,'MANUAL CHARACTERS'),statusStat(s.draftCount,'SAVED BUILDS'),
  statusStat(s.activeCount+s.plannedCount,'OPEN ATLAS GOALS'),statusStat(s.routeCount,'SAVED ROUTES'));
 host.append(stats);
 const desc=node('p','nx21-source','Source: this browser’s manually saved companion records. Not a live Battle.net scan.');
 host.append(desc);
 const goal=s.nextGoal,cont=node('a','nx21-continue');
 cont.href=goal?'./world-atlas.html?zone='+encodeURIComponent(goal.zoneId):'./world-atlas.html';
 cont.append(node('small','','YOUR NEXT STOP'),node('strong','',goal?goal.title:'EXPLORE THE WORLD ATLAS'),node('span','','CONTINUE ↗'));
 host.append(cont);
}
function paintJourneys(){
 const host=$('nx21Journeys');host.replaceChildren();
 for(const j of core.JOURNEYS){
  const card=node('article','nx21-journey');
  card.append(node('strong','nx21-journey-title',j.title),node('p','',j.desc));
  const steps=node('div','nx21-journey-steps');
  j.steps.forEach((id,index)=>{
   const item=core.idMap.get(id),a=node('a','nx21-step',item?item.title:id);
   a.href=hrefFor(id);a.title='Step '+(index+1)+' · '+(item?.desc||'');
   const n=node('b','',String(index+1).padStart(2,'0'));
   a.prepend(n);steps.append(a);
  });
  card.append(steps);host.append(card);
 }
}
function matchesDefault(){
 const selected=state.category;
 if(selected==='Pinned')return core.DIR.filter(x=>state.prefs.pinned.includes(x.id)).map(x=>({
  kind:'studio',id:x.id,title:x.title,subtitle:x.desc,href:x.href,icon:x.icon,group:x.group
 }));
 if(selected==='Recent')return state.prefs.recent.map(id=>core.idMap.get(id)).filter(Boolean).map(x=>({
  kind:'studio',id:x.id,title:x.title,subtitle:x.desc,href:x.href,icon:x.icon,group:x.group
 }));
 return core.DIR.filter(x=>selected==='All'||x.group===selected).map(x=>({
  kind:'studio',id:x.id,title:x.title,subtitle:x.desc,href:x.href,icon:x.icon,group:x.group
 }));
}
function renderResults(){
 const q=state.query.trim(),list=$('nx21Results'),empty=$('nx21Empty');
 let data=q?core.search(q,state.snapshot,35):matchesDefault();
 if(inVault)data=data.filter(x=>x.kind==='studio');
 state.items=data;
 list.replaceChildren();list.setAttribute('aria-busy','false');
 const frag=doc.createDocumentFragment();
 for(const item of data)frag.append(linkRow(item));
 list.append(frag);
 empty.hidden=data.length!==0;
 empty.textContent=q?'No results for “'+q.slice(0,70)+'”. Try a studio name, mission, map, gear or vault.':
   'No studios here yet. Pin the ones you visit most to create your personal quick-access row.';
 $('nx21ResultsCount').textContent=data.length+' DESTINATION'+(data.length===1?'':'S');
}
function paintTabs(){
 const selected=state.tab;
 $('nx21Explore').hidden=selected!=='explore';$('nx21JourneysPanel').hidden=selected!=='journeys';
 for(const btn of doc.querySelectorAll('[data-nx21-tab]')){
  btn.setAttribute('aria-selected',String(btn.dataset.nx21Tab===selected));
  btn.classList.toggle('nx21-selected',btn.dataset.nx21Tab===selected);
 }
}
function renderFilters(){
 const host=$('nx21Groups');host.replaceChildren();
 for(const group of ['All','Pinned','Recent','Command','Character','Adventure','Personal','Explore','NEXUS']){
  const btn=node('button','nx21-filter',group);btn.type='button';
  btn.dataset.nx21Group=group;btn.setAttribute('aria-pressed',String(state.category===group));
  host.append(btn);
 }
}
function render(){
 renderFilters();renderResults();paintPersonal();paintTabs();
 const v=window.NexusVisualEngineV19?.getResolved?.()||'balanced';
 $('nx21CurrentMode').textContent='DISPLAY: '+v.toUpperCase();
}
function open(){
 if(state.open)return;
 load();state.open=true;
 render();
 $('nx21Dialog').showModal();doc.documentElement.dataset.nx21Open='true';
 const input=$('nx21Search');
 input.value=state.query;input.focus();
}
function close(){
 if(!state.open)return;
 state.open=false;doc.documentElement.dataset.nx21Open='false';
 $('nx21Dialog').close();$('nx21Launch').focus({preventScroll:true});
}
function build(){
 if($('nx21Launch'))return;
 doc.documentElement.dataset.nx21Ready='true';
 const launcher=node('button','nx21-launcher');launcher.id='nx21Launch';launcher.type='button';
 launcher.setAttribute('aria-haspopup','dialog');launcher.setAttribute('aria-controls','nx21Dialog');
 launcher.setAttribute('aria-label','Open NEXUS unified studio navigation and search');
 launcher.append(node('span','nx21-launch-symbol','✦'),node('span','nx21-launch-label','NEXUS COMMAND'));
 doc.body.append(launcher);
 const dialog=node('dialog','nx21-dialog');dialog.id='nx21Dialog';
 dialog.setAttribute('aria-label','NEXUS unified command and studio navigation');
 dialog.innerHTML=
 '<div class="nx21-shell">'+
  '<header class="nx21-header"><span class="nx21-brand">✦ NEXUS <small>UNITY ENGINE / V21</small></span>'+
   '<div class="nx21-header-right"><span id="nx21CurrentMode">DISPLAY: AUTO</span>'+
    '<button type="button" class="nx21-close" id="nx21Close" aria-label="Close NEXUS command">✕</button></div></header>'+
  '<div class="nx21-hero"><div><span class="nx21-eyebrow">ONE CONNECTED COMPANION · PC + IPHONE</span>'+
   '<h2>YOUR ENTIRE <em>AZEROTH.</em></h2>'+
   '<p>Search studios, pick a personal path and resume manual adventures—all without exposing your accounts or changing existing saved work.</p></div>'+
   '<span class="nx21-hero-icon" aria-hidden="true">✧</span></div>'+
  '<nav class="nx21-tabs" aria-label="NEXUS command views">'+
   '<button type="button" data-nx21-tab="explore" aria-selected="true" class="nx21-selected">EXPLORE & SEARCH</button>'+
   '<button type="button" data-nx21-tab="journeys" aria-selected="false">GUIDED JOURNEYS</button></nav>'+
  '<section id="nx21Explore" class="nx21-explore" aria-label="Find a NEXUS destination">'+
   '<label class="nx21-search-label" for="nx21Search">SEARCH YOUR NEXUS STUDIOS & MANUAL PLANS</label>'+
   '<div class="nx21-search-wrap"><span aria-hidden="true">⌕</span><input type="search" id="nx21Search" autocomplete="off" maxlength="90" placeholder="World Atlas, talents, media, missions…" aria-label="Search studios and saved manual plans"></div>'+
   '<div id="nx21Groups" class="nx21-groups" aria-label="Filter studios by category"></div>'+
   '<div class="nx21-columns"><div class="nx21-directory"><div class="nx21-section-line"><strong>DESTINATIONS</strong><small id="nx21ResultsCount"></small></div>'+
    '<div id="nx21Results" class="nx21-results" role="list" aria-live="polite"></div><p id="nx21Empty" class="nx21-empty" hidden></p></div>'+
   '<aside class="nx21-personal"><div class="nx21-section-line"><strong>MY CONTINUITY</strong><small>LOCAL / MANUAL</small></div><div id="nx21Personal"></div>'+
    '<a class="nx21-private-link" href="./save-protection.html">◈ BACK UP MY LOCAL PLANS ↗</a></aside></div></section>'+
  '<section id="nx21JourneysPanel" class="nx21-journeys-panel" aria-label="Guided companion workflows" hidden>'+
   '<p class="nx21-journeys-intro">Choose an outcome, then follow real links through the studios. Progress is recorded manually, not inferred from your game account.</p>'+
   '<div id="nx21Journeys" class="nx21-journeys"></div></section>'+
  '<footer class="nx21-footer"><span>PRIVATE BROWSER-LOCAL SEARCH · NO REMOTE QUERY</span>'+
   '<span>✦ PIN STUDIOS FOR NEXT TIME <span class="nx21-shortcut">⌘ / CTRL + K</span></span></footer>'+
 '</div>';
 doc.body.append(dialog);
 launcher.addEventListener('click',open);
 $('nx21Close').addEventListener('click',close);
 dialog.addEventListener('cancel',event=>{event.preventDefault();close()});
 dialog.addEventListener('click',event=>{
  const rect=dialog.getBoundingClientRect();
  if(event.target===dialog&&(event.clientX<rect.left||event.clientX>rect.right||
   event.clientY<rect.top||event.clientY>rect.bottom))close();
 });
 $('nx21Search').addEventListener('input',event=>{
  state.query=event.target.value;state.category='All';renderFilters();renderResults();
 });
 $('nx21Groups').addEventListener('click',event=>{
  const btn=event.target.closest('button[data-nx21-group]');
  if(!btn)return;state.category=btn.dataset.nx21Group;state.query='';$('nx21Search').value='';
  renderFilters();renderResults();
 });
 $('nx21Results').addEventListener('click',event=>{
  const btn=event.target.closest('button[data-nx21-pin]');
  if(btn)prefer(btn.dataset.nx21Pin);
 });
 for(const tab of doc.querySelectorAll('[data-nx21-tab]'))tab.addEventListener('click',()=>{
  state.tab=tab.dataset.nx21Tab;
  paintTabs();
 });
 paintJourneys();
 doc.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&state.open){event.preventDefault();close();return}
  if(event.altKey&&event.shiftKey&&event.key.toLowerCase()==='n'){
   event.preventDefault();state.open?close():open();return;
  }
  if(!isCommand&&(event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
   event.preventDefault();open();
  }
 });
 window.addEventListener('storage',event=>{
  if(event.key===core.KEY||event.key==='nexus_world_atlas_goals_v16'||
   event.key==='nexus_atlas_routes_v181'||event.key==='nexus_adventure_operations_v17'||
   event.key==='nexus_azeroth_companion_genesis_v1'||event.key==='nexus_azeroth_talent_forge_v1')
   scheduleRefresh();
 });
 window.addEventListener('pageshow',event=>{if(event.persisted)scheduleRefresh()});
 doc.addEventListener('visibilitychange',()=>{if(!doc.hidden)scheduleRefresh()});
 window.addEventListener('nexus:visual-mode',()=>{if(state.open)render()});
 if(!inVault){
  load();const id=currentId();
  if(id){state.prefs=core.visit(state.prefs,id);save()}
 }
 insertBridge();
 renderBridge();
}
let queued=false;
function scheduleRefresh(){
 if(queued||inVault)return;queued=true;
 requestAnimationFrame(()=>{queued=false;refresh()});
}
function statText(s){return s.activeCount+' ACTIVE GOALS · '+s.routeCount+' SAVED ROUTES · '+s.draftCount+' BUILD DRAFTS'}
function makeJourneyLink(title,id,art){
 const a=node('a','nx21-showcase nx21-showcase-'+art),item=core.idMap.get(id);
 a.href=hrefFor(id);
 a.append(node('span','nx21-showcase-icon',item?.icon||'✦'),
  node('strong','',title),node('small','',item?.desc||'Explore the connected studio'),
  node('b','','OPEN STUDIO ↗'));
 return a;
}
function insertBridge(){
 const c=doc.querySelector('#nx10Home');
 const main=doc.querySelector('body[data-nx12-page="index"] .main .stats');
 if(c&&!$('nx21Bridge')){
  const b=node('section','nx21-bridge');b.id='nx21Bridge';
  b.setAttribute('aria-label','Your connected paths across Azeroth');
  b.innerHTML='<div class="nx21-bridge-head"><div><span class="nx21-eyebrow">NEXUS / SOVEREIGN UNITY · V21</span>'+
   '<h2>ONE WORLD. <em>EVERY STUDIO.</em></h2>'+
   '<p>Choose a path and carry your own manually saved plans between the tools that support them.</p></div>'+
   '<button type="button" id="nx21BridgeOpen">EXPLORE ALL STUDIOS ✦</button></div>'+
   '<div id="nx21BridgeCards" class="nx21-bridge-cards"></div>'+
   '<p class="nx21-bridge-foot" id="nx21BridgeStatus"></p>';
  c.after(b);
  const cards=$('nx21BridgeCards');
  cards.append(makeJourneyLink('BUILD A CHARACTER','character','character'),
   makeJourneyLink('EXPLORE THE WORLD','atlas','atlas'),
   makeJourneyLink('PLAN AN ADVENTURE','operations','adventure'),
   makeJourneyLink('PROTECT YOUR MEDIA','vault','vault'));
  $('nx21BridgeOpen').addEventListener('click',open);
 }
 if(main&&!$('nx21HomeHub')){
  const b=node('section','nx21-home-hub');b.id='nx21HomeHub';
  b.setAttribute('aria-label','Explore interconnected Azeroth studios');
  b.innerHTML='<div><span class="nx21-eyebrow">SOVEREIGN UNITY / V21</span>'+
   '<strong>ALL YOUR AZEROTH STUDIOS. ONE COMMAND.</strong>'+
   '<p id="nx21HomeStatus">Manual characters, Atlas goals and saved routes remain in your browser.</p></div>'+
   '<button type="button" id="nx21HomeOpen">EXPLORE MY STUDIOS ↗</button>';
  main.before(b);
  $('nx21HomeOpen').addEventListener('click',open);
 }
}
function renderBridge(){
 const s=state.snapshot;
 if($('nx21BridgeStatus'))$('nx21BridgeStatus').textContent=statText(s)+' · USER-SAVED PLANS, NOT LIVE GAME PROGRESS';
 if($('nx21HomeStatus'))$('nx21HomeStatus').textContent=statText(s)+' · ALL STORED LOCALLY ON THIS DEVICE';
}
Object.defineProperty(window,'NexusUnityV21',{value:Object.freeze({
 open,close,refresh,version:core.VERSION
 }),writable:false,configurable:false});
if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',build,{once:true});else build();
})();

/* v19 main companion bundled display controller: matches shared/nexus-experience-v19.js */
/* NEXUS | ADAPTIVE EXPERIENCE ENGINE v19.0.0
 * Visual presentation only. Does NOT read or mutate account, talents, missions,
 * media, files, saved builds or authentication. One isolated optional preference.
 * Zero remote dependencies, navigation interception, timers or analytics.
 */
(()=>{'use strict';
if(window.NexusVisualEngineV19)return;
const KEY='nexus_visual_presentation_v19',VALID=new Set(['auto','cinematic','balanced','quiet']);
const root=document.documentElement;
const narrow=matchMedia('(max-width: 700px)'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
const touch=matchMedia('(pointer: coarse)');
const connection=navigator.connection||navigator.mozConnection||navigator.webkitConnection||null;
const path=location.pathname.toLowerCase();
function surface(){
 if(path.includes('/hub/'))return 'gateway';
 if(path.includes('/alchemist/'))return 'creator';
 if(path.includes('/world-atlas.html'))return 'atlas';
 if(path.includes('/command-center.html'))return 'command';
 if(path.includes('/player-experience.html'))return 'character';
 if(path.includes('/expedition-console.html')||path.includes('/adventure-operations.html'))return 'expedition';
 if(path.includes('/living-azeroth.html'))return 'living';
 return 'azeroth';
}
root.dataset.nx19Surface=surface();
let selected='auto';
try{const saved=localStorage.getItem(KEY);if(VALID.has(saved))selected=saved}catch(_){}
let selector=null,status=null;
function resolve(){
 if(selected!=='auto')return selected;
 // Respect explicit OS motion/data preferences and narrow touch viewports.
 if(reduced.matches||connection?.saveData||narrow.matches&&touch.matches)return 'quiet';
 return 'balanced';
}
function apply(){
 const resolved=resolve(),phone=narrow.matches;
 root.dataset.nx19Preset=selected;root.dataset.nx19Resolved=resolved;
 root.dataset.nx19Viewport=phone?'compact':'wide';
 root.classList.toggle('nx19-quiet',resolved==='quiet');
 root.classList.toggle('nx19-cinematic',resolved==='cinematic');
 if(selector)selector.value=selected;
 if(status){
  const detail=resolved==='quiet'?'Low-motion, lower-cost decorative effects':
    resolved==='cinematic'?'Extra decorative depth where motion is allowed':'Balanced presentation with responsive detail';
  status.textContent=(selected==='auto'?'AUTO → ':'')+resolved.toUpperCase()+' · '+detail;
 }
 // Listeners may pause purely decorative visuals; no content/data changes.
 window.dispatchEvent(new CustomEvent('nexus:visual-mode',{detail:{preset:selected,resolved,compact:phone}}));
}
function host(){
 const choices={
  gateway:'.topTools',creator:'.topbar',atlas:'.nx16-atlas-header',
  command:'.nx10-header-actions',character:'.px11-nav',
  expedition:'.nx165-header',living:'.lv9-topnav',azeroth:'.main .top'
 };
 return document.querySelector(choices[root.dataset.nx19Surface])||
  document.querySelector('header')||document.querySelector('main');
}
function install(){
 if(document.getElementById('nx19VisualMode'))return;
 document.querySelector('.hero,.nx10-hero,.nx16-atlas-hero,.nx165-hero,.nx17-hero')?.classList.add('nx19-aura');
 const parent=host();if(!parent)return;
 const menu=document.createElement('details');menu.id='nx19VisualMode';
 menu.className='nx19-visual-mode';
 menu.innerHTML='<summary aria-label="Open visual performance settings">✧ <span>VISUAL MODE</span></summary>'+
  '<div class="nx19-mode-panel"><div class="nx19-mode-title"><strong>VISUAL EXPERIENCE</strong>'+
  '<small>Presentation only · never changes account or saved work</small></div>'+
  '<label for="nx19Preset">DISPLAY PRESET</label>'+
  '<select id="nx19Preset"><option value="auto">AUTO · Adaptive device</option>'+
  '<option value="cinematic">CINEMATIC · Full atmosphere</option>'+
  '<option value="balanced">BALANCED · Refined visuals</option>'+
  '<option value="quiet">QUIET · Low-motion effects</option></select>'+
  '<p id="nx19ModeStatus" role="status"></p>'+
  '<p class="nx19-mode-note">System reduced-motion preferences remain respected even in Cinematic mode. Local preference applies to compatible NEXUS pages on this device only.</p>'+
  '<button type="button" id="nx19ModeClose">CLOSE SETTINGS</button></div>';
 parent.append(menu);
 selector=menu.querySelector('select');status=menu.querySelector('#nx19ModeStatus');
 selector.addEventListener('change',()=>{
  if(!VALID.has(selector.value))return;
  selected=selector.value;
  try{localStorage.setItem(KEY,selected)}catch(_){}
  apply();
 });
 menu.querySelector('#nx19ModeClose').addEventListener('click',()=>{menu.open=false;menu.querySelector('summary').focus()});
 menu.addEventListener('keydown',event=>{if(event.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus()}});
 document.addEventListener('pointerdown',event=>{if(menu.open&&!menu.contains(event.target))menu.open=false},{passive:true});
 apply();
}
function onMedia(m){if(m.addEventListener)m.addEventListener('change',apply);else m.addListener?.(apply)}
onMedia(narrow);onMedia(reduced);onMedia(touch);
connection?.addEventListener?.('change',apply);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)apply()});
window.addEventListener('pageshow',event=>{if(event.persisted)apply()});
const api=Object.freeze({key:KEY,getPreset:()=>selected,getResolved:resolve,surface:()=>root.dataset.nx19Surface});
Object.defineProperty(window,'NexusVisualEngineV19',{value:api,configurable:false,writable:false});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
apply();
})();