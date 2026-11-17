/* NEXUS | AZEROTH v18.2 — CARTOGRAPHER'S LENS
 * Additive, read-only premium field guide. Original map, v18.1 routes and v16 goals retained.
 * Map positions remain illustrative. No new storage, geolocation, API or remote image calls.
 */
(()=>{'use strict';
const world=window.NexusWorldEngineCoreV16,core=window.NexusAtlasLensV182,
 root=document.getElementById('nx16Atlas'),chart=document.getElementById('nx18Chart');
if(!world||!core||!root||!chart||document.getElementById('nx182Lens'))return;
const $=id=>document.getElementById(id),
 el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n;},
 KEYS=['nexus_world_atlas_goals_v16','nexus_adventure_intelligence_v165','nexus_atlas_routes_v181','nexus_adventure_operations_v17'],
 readJson=(raw,cap)=>{if(!raw||raw.length>=cap)return null;try{return JSON.parse(raw)}catch(_){return null}};
const state={cacheRaw:null,index:null,goals:[],routes:null,selected:'',focus:false,lastRegion:'',animationFrame:0};
const images=Object.freeze({
 'eastern-kingdoms':'./assets/nexus-region-eastern-kingdoms-v182.svg',
 'kalimdor':'./assets/nexus-region-kalimdor-v182.svg',
 'northrend':'./assets/nexus-region-northrend-v182.svg',
 'pandaria':'./assets/nexus-region-pandaria-v182.svg',
 'broken-isles':'./assets/nexus-region-broken-isles-v182.svg',
 'dragon-isles':'./assets/nexus-region-dragon-isles-v182.svg',
 'khaz-algar':'./assets/nexus-region-khaz-algar-v182.svg',
 'outland':'./assets/nexus-region-outland-v182.svg'
});
function sources(){
 const raws=KEYS.map(k=>{try{return localStorage.getItem(k)||''}catch(_){return ''}});
 if(state.cacheRaw&&raws.every((v,i)=>v===state.cacheRaw[i]))return;
 state.cacheRaw=raws;
 state.goals=world.cleanGoals(readJson(raws[0],700000));
 const bookmarkRaw=readJson(raws[1],350000),
 routeRaw=readJson(raws[2],50000),
 sessionRaw=readJson(raws[3],80000);
 state.routes=routeRaw;
 state.index=core.index(state.goals,bookmarkRaw?.bookmarks,routeRaw,sessionRaw);
}
const section=$('nx16Map'),header=section.querySelector('.nx16-atlas-section-header'),
 rail=el('div','nx182-region-rail');rail.id='nx182RegionRail';rail.setAttribute('role','group');
rail.setAttribute('aria-label','Illustrative region atlas quick navigation');
rail.append(el('span','nx182-rail-kicker','THE EIGHT REALMS · SELECT A REGION'));
for(const region of world.regions){
 const b=el('button','nx182-region-tile');b.type='button';b.dataset.region=region.id;
 b.setAttribute('aria-label','Explore '+region.name);
 b.append(el('span','nx182-tile-mark',core.region(region.id)?.symbol||'✦'),
  el('strong','',region.name),el('small','nx182-tile-count','Curated region'));
 rail.append(b);
}
header.after(rail);
const lens=el('section','nx182-lens');lens.id='nx182Lens';
lens.setAttribute('aria-label','Curated region field guide and personal destination intelligence');
lens.innerHTML=[
 '<div class="nx182-scene" id="nx182Scene">',
 '<img id="nx182SceneArt" loading="lazy" decoding="async" alt="Original decorative regional fantasy landscape; not a game map">',
 '<div class="nx182-scene-shade"></div>',
 '<div class="nx182-scene-copy"><span class="nx182-eyebrow">NEXUS / CARTOGRAPHER’S LENS · v18.2</span>',
 '<h3 id="nx182RegionTitle">THE KNOWN WORLD</h3><p id="nx182RegionMotto">A personal research atlas</p>',
 '<div class="nx182-scene-badges" id="nx182SceneBadges"></div></div></div>',
 '<div class="nx182-lens-overview"><div><span>FIELD BRIEFING</span><p id="nx182RegionIntro">Select a curated region to inspect your research priorities.</p></div>',
 '<div class="nx182-focus-list" id="nx182RegionFocus"></div></div>',
 '<div class="nx182-lookup"><div class="nx182-lookup-title"><strong>DESTINATION FINDER</strong><small>Search 25 curated research locations by name or region</small></div>',
 '<input id="nx182Search" type="search" maxlength="80" placeholder="Search Stormwind, Azj-Kahet, Valdrakken…" autocomplete="off" aria-label="Find a destination in the Atlas">',
 '<div id="nx182Results" class="nx182-results" aria-live="polite"></div></div>',
 '<div class="nx182-dossier"><div class="nx182-dossier-head"><span id="nx182DossierType">SELECTED DESTINATION</span>',
 '<h4 id="nx182DossierTitle">Choose a map pin</h4><p id="nx182DossierSubtitle">Personal notes and routes appear below.</p></div>',
 '<div class="nx182-dossier-grid"><div class="nx182-research"><strong>RESEARCH DIRECTIONS</strong><ul id="nx182Suggestions"></ul></div>',
 '<div class="nx182-personal"><strong>YOUR PRIVATE FIELD RECORDS</strong><div id="nx182Records"></div></div></div>',
 '<div class="nx182-actions"><button id="nx182Plan" type="button">PLAN AT THIS LOCATION</button>',
 '<button id="nx182Route" type="button">OPEN ROUTE ARCHITECT</button></div></div>',
 '<div class="nx182-sourcebar"><div><strong>REFERENCE MAP LIBRARY</strong><span>Open real external WoW map references. NEXUS artwork and pins are illustrative.</span></div>',
 '<a href="https://www.wowhead.com/maps" target="_blank" rel="noopener noreferrer">WOWHEAD MAPS ↗</a>',
 '<a href="https://warcraft.wiki.gg/wiki/Maps" target="_blank" rel="noopener noreferrer">WARCRAFT WIKI MAPS ↗</a></div>'
].join('');
const detail=$('nx18Detail');
detail.prepend(lens);
const controls=$('nx18Controls'),modeBar=el('div','nx182-presentation');
modeBar.innerHTML='<div><strong>FIELD PRESENTATION</strong><small>Quiet pins improve readability on small screens without hiding destinations from search or accessibility tools</small></div>'+
 '<button type="button" id="nx182Density" aria-pressed="false">FOCUS PINS: OFF</button>';
controls.querySelector('.nx18-controlrow')?.after(modeBar);
const status=el('div','nx182-status','Original cartography · no location tracking · manual saved data only');
status.id='nx182Status';status.setAttribute('role','status');
$('nx18Legend')?.after(status);
function regionFromDom(){
 const id=chart.dataset.region||'eastern-kingdoms';
 return world.regionById(id)||world.regions[0];
}
function zoneFromDom(reg){
 const button=$('nx18ChartPins')?.querySelector('button[data-zone][aria-pressed="true"]');
 const picked=world.zoneById(button?.dataset.zone);
 if(picked&&picked.regionId===reg.id)return picked;
 return world.zoneById(state.selected)?.regionId===reg.id?world.zoneById(state.selected):
  world.zones.find(z=>z.regionId===reg.id)||null;
}
function jump(id){
 const zone=world.zoneById(id);if(!zone)return;
 const filter=$('nx18Filter');
 if(filter?.value!=='all'){filter.value='all';filter.dispatchEvent(new Event('change',{bubbles:true}))}
 const native=document.querySelector('#nx16RegionStrip button[data-region="'+zone.regionId+'"]');
 if(native&&chart.dataset.region!==zone.regionId)native.click();
 state.selected=zone.id;
 requestAnimationFrame(()=>{
  const pin=[...($('nx18ChartPins')?.querySelectorAll('button[data-zone]')||[])].find(b=>b.dataset.zone===zone.id);
  if(pin){pin.click();pin.focus({preventScroll:true})}
  schedule();
 });
}
function updateRail(region){
 for(const b of rail.querySelectorAll('button[data-region]')){
  const r=world.regionById(b.dataset.region),summary=core.regionSummary(r,world.zones,state.index);
  const active=r.id===region.id;b.classList.toggle('nx182-active',active);
  b.setAttribute('aria-pressed',String(active));
  b.querySelector('.nx182-tile-count').textContent=summary.total+' zones · '+summary.goals+' goals';
 }
}
function updateScene(region){
 const meta=core.region(region.id),info=core.regionSummary(region,world.zones,state.index);
 const art=$('nx182SceneArt');
 if(state.lastRegion!==region.id){art.src=images[region.id];state.lastRegion=region.id}
 art.alt='Original NEXUS fantasy panorama evoking '+region.name+'; decorative only, no map accuracy';
 $('nx182RegionTitle').textContent=meta.title;
 $('nx182RegionMotto').textContent=meta.motto;
 $('nx182Scene').dataset.terrain=meta.terrain;
 const badges=$('nx182SceneBadges');badges.replaceChildren();
 for(const label of [info.total+' CURATED PLACES',info.goals+' MANUAL GOALS',info.bookmarks+' BOOKMARKS',info.routes+' ROUTE LOCATIONS'])
  badges.append(el('span','',label));
 $('nx182RegionIntro').textContent=meta.intro;
 const focus=$('nx182RegionFocus');focus.replaceChildren();
 meta.focus.forEach((t,i)=>focus.append(el('span','',String(i+1).padStart(2,'0')+' / '+t)));
}
function updateDossier(zone){
 const title=$('nx182DossierTitle'),subtitle=$('nx182DossierSubtitle'),
  details=$('nx182Records'),suggestions=$('nx182Suggestions');
 suggestions.replaceChildren();details.replaceChildren();
 const plan=$('nx182Plan');
 if(!zone){title.textContent='Choose a visible map pin';subtitle.textContent='No destination matches this overlay.';
  $('nx182DossierType').textContent='RESEARCH DESTINATION';plan.disabled=true;return;}
 plan.disabled=false;plan.dataset.zone=zone.id;
 const info=core.spotlight(zone,state.index,state.goals);
 state.selected=zone.id;
 title.textContent=zone.name;
 $('nx182DossierType').textContent=zone.kind.toUpperCase()+' · '+(world.regionById(zone.regionId)?.name||'AZEROTH');
 subtitle.textContent=zone.description+' · Curated destination, not a live game state.';
 info.suggestions.forEach(t=>suggestions.append(el('li','',t)));
 const counts=el('div','nx182-personal-counts');
 for(const [label,value] of [['MANUAL GOALS',info.goals],['IN PROGRESS',info.active],['SAVED ROUTES',info.routes.length]]){
  const row=el('div');row.append(el('small','',label),el('b','',String(value)));counts.append(row);
 }
 details.append(counts);
 const facts=el('div','nx182-fact-tags');
 facts.append(el('span','',info.saved?'★ Bookmarked':'☆ Not bookmarked'));
 if(info.inSession)facts.append(el('span','','✦ In v17 session'));
 details.append(facts);
 if(info.next){
  const a=el('a','nx182-next-link','PREPARE: '+info.next.title+' ↗');
  a.href='./expedition-console.html?mission='+encodeURIComponent(info.next.id);
  details.append(a);
 }else details.append(el('p','nx182-no-goals','No open manual mission saved for this destination. Create one using the original planner.'));
 const routes=info.routes.slice(0,3);
 if(routes.length){
  const r=el('div','nx182-route-references');
  routes.forEach(x=>r.append(el('span','',x.name+' · stop '+x.position)));
  details.append(r);
 }
}
function render(){
 state.animationFrame=0;sources();
 const region=regionFromDom(),zone=zoneFromDom(region);
 updateRail(region);updateScene(region);updateDossier(zone);
 const counts=core.performanceCounts(world.zones,state.index);
 $('nx182Status').textContent=counts.curated+' curated locations · '+counts.manualMissions+' manual goals · '+counts.bookmarks+' bookmarks · '+counts.routeDestinations+' route locations · original offline-first cartography';
}
function schedule(){
 if(state.animationFrame)return;
 state.animationFrame=requestAnimationFrame(render);
}
rail.addEventListener('click',event=>{
 const b=event.target.closest('button[data-region]');if(!b)return;
 const origin=document.querySelector('#nx16RegionStrip button[data-region="'+b.dataset.region+'"]');
 if(origin)origin.click();
 chart.scrollIntoView({behavior:root.classList.contains('nx18-lite')?'instant':'smooth',block:'nearest'});
 schedule();
});
const search=$('nx182Search'),results=$('nx182Results');
function searchRender(){
 results.replaceChildren();
 const q=core.clean(search.value,80).toLocaleLowerCase();
 if(q.length<2)return;
 const matches=world.zones.filter(z=>(z.name+' '+world.regionById(z.regionId)?.name+' '+z.description).toLocaleLowerCase().includes(q)).slice(0,8);
 if(!matches.length){results.append(el('span','nx182-no-results','No curated Atlas destination matched.'));return}
 for(const zone of matches){
  const b=el('button','nx182-result');b.type='button';b.dataset.zone=zone.id;
  b.append(el('strong','',zone.name),el('small','',world.regionById(zone.regionId)?.name+' · '+zone.kind));
  results.append(b);
 }
}
search.addEventListener('input',searchRender);
search.addEventListener('keydown',event=>{
 if(event.key==='Escape'){search.value='';results.replaceChildren()}
 if(event.key==='Enter'){
  const first=results.querySelector('button[data-zone]');
  if(first){event.preventDefault();first.click()}
 }
});
results.addEventListener('click',event=>{
 const b=event.target.closest('button[data-zone]');if(!b)return;
 search.value='';results.replaceChildren();
 jump(b.dataset.zone);
});
$('nx182Density').addEventListener('click',()=>{
 state.focus=!state.focus;root.classList.toggle('nx182-quiet-map',state.focus);
 const btn=$('nx182Density');btn.setAttribute('aria-pressed',String(state.focus));
 btn.textContent='FOCUS PINS: '+(state.focus?'ON':'OFF');
});
$('nx182Plan').addEventListener('click',()=>{
 const zone=world.zoneById($('nx182Plan').dataset.zone);if(!zone)return;
 const original=$('nx18ZoneCard')?.querySelector('button[data-plan="'+zone.id+'"]');
 if(original)original.click();
 else jump(zone.id);
});
$('nx182Route').addEventListener('click',()=>{
 $('nx181RouteStudio')?.scrollIntoView({behavior:root.classList.contains('nx18-lite')?'instant':'smooth',block:'start'});
});
const native=$('nx18ChartPins');
if(native)new MutationObserver(schedule).observe(native,{childList:true,subtree:false});
$('nx16RegionStrip')?.addEventListener('click',schedule);
$('nx16RegionPins')?.addEventListener('click',schedule);
$('nx18ZoneCard')?.addEventListener('click',schedule);
$('nx18Filter')?.addEventListener('change',schedule);
$('nx16ZoneFilter')?.addEventListener('input',schedule);
$('nx16GoalRows')?.addEventListener('change',schedule);
$('nx16GoalForm')?.addEventListener('submit',schedule);
$('nx181RouteStudio')?.addEventListener('click',schedule);
$('nx181RouteStudio')?.addEventListener('change',schedule);
window.addEventListener('storage',event=>{if(KEYS.includes(event.key))schedule()});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
const reduced=window.matchMedia?.('(max-width: 650px), (prefers-reduced-motion: reduce)')?.matches;
if(reduced){state.focus=true;root.classList.add('nx182-quiet-map');$('nx182Density').setAttribute('aria-pressed','true');$('nx182Density').textContent='FOCUS PINS: ON'}
render();
})();