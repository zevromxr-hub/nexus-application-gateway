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