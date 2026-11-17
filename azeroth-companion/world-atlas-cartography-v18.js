/* NEXUS | AZEROTH v18 — WORLD ATLAS CARTOGRAPHY OVERDRIVE
 * Additive to v16 World Atlas + v16.5 bookmarks. NO new persistent keys.
 * Source-illustrative pins; user-supplied map preview stays local in memory.
 */
(()=>{'use strict';
const root=document.getElementById('nx16Atlas'),
 world=window.NexusWorldEngineCoreV16,brain=window.NexusAtlasCartographyV18;
if(!root||!world||!brain||document.getElementById('nx18Controls'))return;
const $=id=>document.getElementById(id);
const el=(tag,cls,value)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(value!==undefined)n.textContent=String(value);return n;};
const keys={goals:'nexus_world_atlas_goals_v16',plans:'nexus_adventure_intelligence_v165',
 session:'nexus_adventure_operations_v17',profile:'nexus_azeroth_companion_genesis_v1',
 drafts:'nexus_azeroth_talent_forge_v1',items:'nexus_azeroth_item_atlas_v1'};
const read=(key,max=900000)=>{try{const v=localStorage.getItem(key);return v&&v.length<max?JSON.parse(v):null}catch(_){return null}};
const list=v=>Array.isArray(v)?v.filter(x=>x&&typeof x==='object'&&!Array.isArray(x)):[];
let goals=world.cleanGoals(read(keys.goals)),bookmarks=[],sessionIds=[],filter='all',currentRegion='eastern-kingdoms',
 selectedZone='',lite=window.matchMedia?.('(max-width: 650px), (prefers-reduced-motion: reduce)')?.matches||false,
 objectURL=null,requested=world.zoneById(new URL(location.href).searchParams.get('zone'));
function pull(){
 goals=world.cleanGoals(read(keys.goals));
 const raw=read(keys.plans,350000);
 bookmarks=Array.isArray(raw?.bookmarks)?raw.bookmarks.filter(id=>!!world.zoneById(id)).slice(0,45):[];
 const session=read(keys.session,80000);sessionIds=list(session?.entries).map(x=>x.id).filter(x=>typeof x==='string').slice(0,18);
}
function icon(name){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('nx18-icon');
 svg.setAttribute('aria-hidden','true');svg.setAttribute('viewBox','0 0 24 24');
 const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href','#nx18-'+name);svg.append(use);return svg;
}
const sprites=document.createElementNS('http://www.w3.org/2000/svg','svg');
sprites.setAttribute('id','nx18Sprites');sprites.setAttribute('xmlns','http://www.w3.org/2000/svg');
sprites.setAttribute('aria-hidden','true');sprites.setAttribute('width','0');sprites.setAttribute('height','0');
sprites.innerHTML='<defs>'+
 '<symbol id="nx18-crown" viewBox="0 0 24 24"><path d="M3 7 7 11 12 5 17 11 21 7 19 18 5 18Z M5 21h14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>'+
 '<symbol id="nx18-compass" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m9 15 3-8 3 8-3-2z" fill="currentColor"/></symbol>'+
 '<symbol id="nx18-mountain" viewBox="0 0 24 24"><path d="m2 19 7-12 4 6 3-4 6 10H2Z M7 11l2-4 3 5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>'+
 '<symbol id="nx18-flag" viewBox="0 0 24 24"><path d="M5 21V4m0 1c4-3 7 3 12 0v10c-5 3-8-3-12 0" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></symbol>'+
 '<symbol id="nx18-star" viewBox="0 0 24 24"><path d="m12 2 3.2 6.4 7.1 1-5.1 5 1.2 7-6.4-3.4L5.6 21l1.2-7-5.1-5 7.1-1Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></symbol>'+
 '<symbol id="nx18-check" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m7 12 3.2 3.2L17.5 8" fill="none" stroke="currentColor" stroke-width="1.9"/></symbol>'+
 '<symbol id="nx18-scroll" viewBox="0 0 24 24"><path d="M6 3h13v16H7c-2 0-3-1-3-3V6c0-2 1-3 2-3m0 0c2 0 3 1 3 3v13M11 8h6m-6 4h6" fill="none" stroke="currentColor" stroke-width="1.7"/></symbol>'+
 '</defs>';
document.body.append(sprites);
const worldSurface=$('nx16MapSurface'),image=el('img','nx18-world-image');
image.id='nx18WorldImage';image.alt='Original detailed fantasy continent chart; positions are illustrative, not game coordinates';
image.src='./assets/nexus-atlas-cartography-v18.svg';image.loading='eager';image.decoding='async';
worldSurface.prepend(image);worldSurface.classList.add('nx18-cartography');
const oldHeading=worldSurface.querySelector('.nx16-map-heading');
if(oldHeading)oldHeading.firstChild.textContent='NEXUS CARTOGRAPHIC ATLAS ';
const wrap=worldSurface.closest('.nx16-atlas-map-wrap');
const controls=el('div','nx18-controls');controls.id='nx18Controls';
controls.innerHTML=
 '<div class="nx18-controls-title"><strong>WORLD CARTOGRAPHY · v18</strong><small>Original reference chart + live display of your own local missions</small></div>'+
 '<div class="nx18-controlrow"><label>MAP OVERLAY<select id="nx18Filter" aria-label="Choose cartographic map pin filter">'+
 '<option value="all">All locations</option><option value="goals">My mission zones</option><option value="active">My in-progress goals</option>'+
 '<option value="planned">My planned goals</option><option value="completed">Manually completed goals</option>'+
 '<option value="bookmarks">Bookmarked places</option><option value="session">My v17 session</option>'+
 '<option value="capital">Capitals</option><option value="hub">Hubs</option><option value="zone">Zones</option>'+
 '</select></label><label>RENDER MODE<select id="nx18Performance" aria-label="Map visual performance setting">'+
 '<option value="cinematic">Cinematic</option><option value="lite">Performance / iPhone</option></select></label></div>'+
 '<div class="nx18-uploadline"><label class="nx18-upload">PREVIEW OWN MAP IMAGE <input id="nx18MapFile" type="file" accept="image/png,image/jpeg,image/webp" aria-label="Preview a locally selected map image"></label>'+
 '<button type="button" id="nx18ResetArt">RESTORE NEXUS MAP</button></div>'+
 '<p class="nx18-footnote">Your image stays in this tab, is never uploaded, and may not align with our illustrative pins. For real in-game map art, use an image you have permission to display.</p>'+
 '<div class="nx18-filterstats" id="nx18FilterStats" role="status" aria-live="polite"></div>';
wrap.prepend(controls);
const legend=el('div','nx18-legend');legend.id='nx18Legend';
legend.innerHTML='<span><i class="nx18-key nx18-key-capital"></i> Capital</span>'+
 '<span><i class="nx18-key nx18-key-hub"></i> Hub</span>'+
 '<span><i class="nx18-key nx18-key-zone"></i> Zone</span>'+
 '<span><i class="nx18-key nx18-key-active"></i> In progress (manual)</span>'+
 '<span><i class="nx18-key nx18-key-planned"></i> Planned (manual)</span>'+
 '<span><i class="nx18-key nx18-key-completed"></i> Completed (manual)</span>'+
 '<span>★ Saved bookmark · ✦ v17 session</span>';
wrap.append(legend);
const regionInfo=document.querySelector('.nx16-region-info');
const zonePanel=el('section','nx18-detail');zonePanel.id='nx18Detail';zonePanel.setAttribute('aria-label','Selected research destination intelligence');
zonePanel.innerHTML='<div class="nx18-detail-heading"><span>02 / LOCAL CHART INTELLIGENCE</span>'+
 '<strong id="nx18DetailHeading">CHOOSE A DESTINATION</strong><p id="nx18DetailSub">Choose an icon to inspect personal research and existing plans.</p></div>'+
 '<div class="nx18-chart" id="nx18Chart" role="group" aria-label="Selected region zone icon chart; positions are illustrative">'+
 '<div class="nx18-chart-title"><strong id="nx18ChartTitle">REGIONAL CHART</strong><small>ICON OVERLAY · NOT GAME COORDINATES</small></div>'+
 '<div id="nx18ChartPins" class="nx18-chart-pins"></div><div class="nx18-chart-caption" id="nx18ChartCaption">Select a zone pin for details.</div></div>'+
 '<div class="nx18-zone-card" id="nx18ZoneCard" aria-live="polite"></div>'+
 '<p class="nx18-map-source"><a href="https://warcraft.wiki.gg/wiki/Maps" target="_blank" rel="noopener noreferrer">VIEW REFERENCE GAME MAPS ↗</a> <span>External Warcraft Wiki reference; no map imagery is hotlinked.</span></p>';
const dst=$('nx16Destinations');dst.before(zonePanel);
function activeRegion(){
 const pin=document.querySelector('#nx16RegionPins button[data-region][aria-pressed="true"]')||
 document.querySelector('#nx16RegionStrip button[data-region][aria-pressed="true"]');
 return world.regionById(pin?.dataset.region)||world.regionById(currentRegion)||world.regions[0];
}
function regionSelect(id){
 const native=document.querySelector('#nx16RegionStrip button[data-region="'+id+'"]');
 if(native)native.click();
}
function notify(s){$('nx18FilterStats').textContent=s}
function labelPin(zone,snap,selected){
 const b=el('button','nx18-zone-pin nx18-type-'+zone.kind.toLowerCase());
 b.type='button';b.dataset.zone=zone.id;b.setAttribute('aria-pressed',String(selected));
 b.setAttribute('aria-label',zone.name+', '+zone.kind+', '+snap.total+' manually tracked mission'+(snap.total===1?'':'s'));
 b.style.left=brain.position(zone).x+'%';b.style.top=brain.position(zone).y+'%';
 if(snap.active)b.classList.add('nx18-state-active');
 else if(snap.planned)b.classList.add('nx18-state-planned');
 else if(snap.completed)b.classList.add('nx18-state-completed');
 if(snap.inSession)b.classList.add('nx18-in-session');
 b.append(icon(snap.icon),el('span','nx18-pin-text',zone.name));
 if(snap.total)b.append(el('b','nx18-mission-count',String(snap.total)));
 if(snap.bookmarked)b.append(el('span','nx18-bookmarked','★'));
 return b;
}
function refreshRegion(){
 const region=activeRegion();currentRegion=region.id;
 const chart=$('nx18Chart'),pinHost=$('nx18ChartPins'),label=$('nx18ChartTitle');
 chart.dataset.region=region.id;
 chart.style.setProperty('--nx18-focus-x',region.x+'%');
 chart.style.setProperty('--nx18-focus-y',region.y+'%');
 label.textContent=region.name+' · DESTINATIONS';
 const zones=world.zones.filter(z=>z.regionId===region.id);
 const allowed=zones.filter(z=>brain.visible(z,{filter,goals,bookmarks,sessionIds}));
 pinHost.replaceChildren();
 allowed.forEach(z=>pinHost.append(labelPin(z,brain.snapshot(z,goals,bookmarks,sessionIds),selectedZone===z.id)));
 const summary=brain.regionSummary(region.id,world.zones,goals);
 $('nx18ChartCaption').textContent=allowed.length+' shown of '+summary.destinations+' known destinations · '+summary.missions+' personal mission'+(summary.missions===1?'':'s')+' in region';
 if(!allowed.length)pinHost.append(el('p','nx18-no-pins','No pins match this filter. Choose All locations to see every curated destination.'));
 if(!zones.some(z=>z.id===selectedZone)||!allowed.some(z=>z.id===selectedZone))selectedZone=allowed[0]?.id||'';
 renderCard();
}
function actionLink(text,href){const a=el('a','nx18-link',text);a.href=href;return a;}
function renderCard(){
 const host=$('nx18ZoneCard');host.replaceChildren();
 const zone=world.zoneById(selectedZone);
 if(!zone){host.append(el('p','nx18-empty-zone','Choose a visible destination pin or clear the overlay filter.'));$('nx18DetailHeading').textContent='NO DESTINATION SELECTED';return}
 const snap=brain.snapshot(zone,goals,bookmarks,sessionIds);
 $('nx18DetailHeading').textContent=zone.name.toUpperCase();
 $('nx18DetailSub').textContent=zone.kind+' · '+zone.description;
 const stats=el('div','nx18-zone-stats');
 for(const [label,n] of [['MISSIONS',snap.total],['ACTIVE',snap.active],['PLANNED',snap.planned],['MANUAL DONE',snap.completed]]){
  const box=el('div','nx18-zone-stat');box.append(el('small','',label),el('strong','',String(n)));stats.append(box);
 }
 host.append(stats);
 const flags=el('div','nx18-zone-tags');
 flags.append(el('span','',snap.bookmarked?'★ BOOKMARKED':'☆ NOT BOOKMARKED'));
 if(snap.inSession)flags.append(el('span','','✦ IN v17 SESSION'));
 host.append(flags);
 const buttons=el('div','nx18-zone-actions');
 const plan=el('button','nx18-plan-action','CREATE MISSION HERE');plan.type='button';plan.dataset.plan=zone.id;
 const bookmark=el('button','nx18-bookmark-action',snap.bookmarked?'★ REMOVE BOOKMARK':'☆ SAVE BOOKMARK');
 bookmark.type='button';bookmark.dataset.bookmark=zone.id;
 buttons.append(plan,bookmark,actionLink('OPEN ZONE RESEARCH ↗','./world-atlas.html?zone='+encodeURIComponent(zone.id)));
 host.append(buttons);
 if(snap.goals.length){
  const chars=list(read(keys.profile)?.characters),drafts=list(read(keys.drafts)),items=list(read(keys.items));
  const linked=el('div','nx18-local-links');
  for(const goal of snap.goals.slice(0,4)){
   if(goal.charId){
    const character=chars.find(x=>x.id===goal.charId);
    linked.append(el('small','',character?'LOCAL CHARACTER · '+brain.text(character.name,70):'LINKED CHARACTER UNAVAILABLE IN THIS BROWSER'));
   }
   if(goal.buildKey){
    const draft=drafts.find(x=>[brain.text(x.identity,130),brain.text(x.savedAt,40),brain.text(x.name,75)].join('::')===goal.buildKey);
    linked.append(el('small','',draft?'MANUAL FORGE DRAFT · '+brain.text(draft.name,70):'LINKED FORGE DRAFT UNAVAILABLE IN THIS BROWSER'));
   }
   if(goal.itemId){
    const target=items.find(x=>Number(x.id)===Number(goal.itemId));
    linked.append(el('small','',target?'LOCAL ITEM ATLAS · '+brain.text(target.name,75):'ITEM #'+goal.itemId+' NOT FOUND IN LOCAL ATLAS'));
   }
  }
  if(linked.children.length)host.append(linked);
  const title=el('strong','nx18-related-label','YOUR LOCAL MISSIONS');
  const listHost=el('div','nx18-goals');host.append(title,listHost);
  for(const goal of snap.goals.slice(0,6)){
   const row=el('div','nx18-related-goal'),copy=el('span','','◈ '+goal.title+' · '+goal.status);
   const targets=el('div','nx18-goal-actionlinks');
   targets.append(actionLink('PREPARE ↗','./expedition-console.html?mission='+encodeURIComponent(goal.id)),
    actionLink('SESSION ↗','./adventure-operations.html?mission='+encodeURIComponent(goal.id)));
   row.append(copy,targets);listHost.append(row);
  }
  if(snap.goals.length>6)host.append(el('small','',String(snap.goals.length-6)+' additional local missions remain in the Atlas log.'));
 }else host.append(el('p','nx18-no-missions','No personal missions have been saved here yet. This is not a report of in-game activity.'));
}
function refreshWorld(){
 const nodes=$('nx16RegionPins')?.querySelectorAll('button[data-region]')||[];
 let visibleCount=0;
 for(const node of nodes){
  const r=world.regionById(node.dataset.region);if(!r)continue;
  const allowed=world.zones.filter(z=>z.regionId===r.id&&brain.visible(z,{filter,goals,bookmarks,sessionIds}));
  const count=brain.regionSummary(r.id,world.zones,goals);
  node.classList.add('nx18-map-region');
  node.dataset.nx18Visible=String(allowed.length);
  node.classList.toggle('nx18-has-active',count.active>0);
  node.title=r.name+' · '+count.missions+' manual missions · '+allowed.length+' matching destinations';
  node.setAttribute('aria-label',node.title);
  node.classList.toggle('nx18-empty-filter',!allowed.length&&filter!=='all');
  const span=node.querySelector('span:first-child');
  if(span&&!span.querySelector('svg')){span.textContent='';span.append(icon('compass'))}
  if(allowed.length)visibleCount++;
 }
 notify(filter==='all'?'All '+world.zones.length+' curated destinations available.':visibleCount+' regions have destinations matching "'+$('nx18Filter').selectedOptions[0].textContent+'".');
}
function refresh(){pull();refreshWorld();refreshRegion()}
function selected(id){
 const z=world.zoneById(id);if(!z)return;
 if(z.regionId!==currentRegion){regionSelect(z.regionId);currentRegion=z.regionId}
 selectedZone=z.id;refreshRegion();
}
$('nx18ChartPins').addEventListener('click',event=>{
 const btn=event.target.closest('button[data-zone]');if(btn)selected(btn.dataset.zone);
});
$('nx18ZoneCard').addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.plan){
  const z=world.zoneById(button.dataset.plan);
  if(!z)return;
  const search=$('nx16ZoneFilter');if(search?.value){search.value='';search.dispatchEvent(new Event('input',{bubbles:true}))}
  if(z.regionId!==currentRegion)regionSelect(z.regionId);
  const original=document.querySelector('#nx16Destinations button[data-zone="'+z.id+'"]');
  if(original)original.click();
  else notify('Select the region and Plan Here in the original destination list.');
 }
 if(button.dataset.bookmark){
  const id=button.dataset.bookmark;
  const original=document.querySelector('#nx16Destinations button[data-nx165-bookmark="'+id+'"]');
  if(original){original.click();queueMicrotask(refresh)}
  else notify('Bookmark control unavailable; use the original destination list.');
 }
});
$('nx18Filter').addEventListener('change',e=>{filter=brain.filterValue(e.target.value);refreshWorld();refreshRegion()});
$('nx18Performance').value=lite?'lite':'cinematic';
root.classList.toggle('nx18-lite',lite);
$('nx18Performance').addEventListener('change',event=>{
 lite=event.target.value==='lite';root.classList.toggle('nx18-lite',lite);
 notify(lite?'Reduced effects enabled for this tab.':'Cinematic map effects enabled for this tab.');
});
$('nx18MapFile').addEventListener('change',event=>{
 const f=event.target.files?.[0];if(!f)return;
 if(!['image/png','image/jpeg','image/webp'].includes(f.type)||f.size>8*1024*1024||f.size===0){
  notify('Use a PNG, JPEG or WebP image under 8 MB. No files were uploaded.');event.target.value='';return;
 }
 const next=URL.createObjectURL(f),previous=objectURL;
 image.src=next;objectURL=next;
 if(previous)URL.revokeObjectURL(previous);
 notify('Your own map image is visible in this tab only. Region pin locations are schematic and may not align with it.');
});
$('nx18ResetArt').addEventListener('click',()=>{
 image.src='./assets/nexus-atlas-cartography-v18.svg';
 if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null}
 $('nx18MapFile').value='';
 notify('Original lightweight NEXUS cartography restored.');
});
window.addEventListener('pagehide',()=>{if(objectURL){URL.revokeObjectURL(objectURL);objectURL=null}});
let queued=false;
const schedule=()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;refresh()})};
$('nx16RegionStrip')?.addEventListener('click',()=>queueMicrotask(()=>{currentRegion=activeRegion().id;refreshWorld();refreshRegion()}));
$('nx16RegionPins')?.addEventListener('click',()=>queueMicrotask(()=>{currentRegion=activeRegion().id;refreshWorld();refreshRegion()}));
$('nx16ZoneFilter')?.addEventListener('input',()=>queueMicrotask(()=>{currentRegion=activeRegion().id;refreshWorld();refreshRegion()}));
$('nx165RegionActivity')?.addEventListener('click',()=>queueMicrotask(()=>{currentRegion=activeRegion().id;refreshWorld();refreshRegion()}));
const target=$('nx16GoalRows');
if(target)new MutationObserver(schedule).observe(target,{childList:true});
window.addEventListener('storage',event=>{
 if([keys.goals,keys.plans,keys.session].includes(event.key))schedule();
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
currentRegion=activeRegion().id;
if(requested){selectedZone=requested.id;if(requested.regionId!==currentRegion)regionSelect(requested.regionId)}
refresh();
})();