/* v22.2 Unified Map Migration — legacy identifiers remain readable, legacy artwork retired. */
(()=>{'use strict';
const root=document.getElementById('nx16Atlas'),real=document.getElementById('nx221RealAtlas');
const world=window.NexusWorldEngineCoreV16;
if(!root||!real||!world)return;
root.classList.add('nx222-unified');
const $=id=>document.getElementById(id);
const aliases={'ringing-deeps':'ringing-deeps','hallowfall':'hallowfall','azj-kahet':'azj-kahet','isle-of-dorn':'isle-of-dorn','valdrakken':'valdrakken','waking-shores':'waking-shores','azure-span':'azure-span'};
const safeMap=new Set(['zul-aman','harandar','voidstorm','hallowfall','ringing-deeps','isle-of-dorn','azj-kahet','valdrakken','waking-shores','azure-span']);
const node=(tag,cls,txt)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(txt!==undefined)el.textContent=txt;return el};
function go(id,point){
 const target=aliases[id]||id;
 if(!safeMap.has(target))return false;
 const btn=[...real.querySelectorAll('#nx221ZoneTabs button')].find(b=>b.textContent.trim().toLowerCase()===({'ringing-deeps':'the ringing deeps','azj-kahet':"azj-kahet"}[target]||world.zoneById(id)?.name.toLowerCase()||target.replaceAll('-',' ')));
 if(btn)btn.click();
 else {
  const url=new URL(location.href);url.searchParams.set('zone',target);
  location.assign(url.href);return true;
 }
 real.scrollIntoView({behavior:'smooth',block:'start'});
 if(point){const q=$('nx221Search');if(q){q.value=point;q.dispatchEvent(new Event('input',{bubbles:true}))}}
 return true;
}
window.NexusUnifiedMapV222=Object.freeze({open:go,hasLocalMap:id=>safeMap.has(aliases[id]||id)});
/* Preserve the old zone identifiers, bookmark IDs, mission links, saved routes, and JSON data unchanged. */
const section=node('section','nx222-directory');
section.id='nx222Directory';section.setAttribute('aria-label','Legacy destinations and new map connections');
section.innerHTML='<div class="nx222-directory-header"><div><strong>ALL SAVED ATLAS DESTINATIONS</strong><p>Find older expedition locations without reopening the retired illustrated chart. Select a zone to open its real in-page map, or a sourced external map where in-page coverage has not yet been added.</p></div><a href="#nx16Missions">YOUR SAVED MISSIONS ↓</a></div><input id="nx222DirectorySearch" type="search" maxlength="80" aria-label="Search all legacy destinations" placeholder="Find Stormwind, Hallowfall, Valdrakken…"><div class="nx222-directory-results" id="nx222DirectoryResults"></div>';
real.after(section);
const search=$('nx222DirectorySearch'),results=$('nx222DirectoryResults');
function directory(){
 results.replaceChildren();
 const q=search.value.trim().toLocaleLowerCase();
 const zones=world.zones.filter(z=>(z.name+' '+world.regionById(z.regionId)?.name).toLocaleLowerCase().includes(q)).slice(0,q?25:12);
 zones.forEach(z=>{
  const supported=safeMap.has(z.id),b=node(supported?'button':'a','nx222-directory-entry');
  if(supported){b.type='button';b.addEventListener('click',()=>go(z.id))}
  else {b.href='https://www.wowhead.com/maps';b.target='_blank';b.rel='noopener noreferrer';b.title='Browse this destination in the external map directory';}
  b.append(node('strong','',z.name),node('small','',world.regionById(z.regionId)?.name+' · '+(supported?'OPEN IN-PAGE MAP':'EXTERNAL MAP DIRECTORY ↗')));
  results.append(b);
 });
 if(!zones.length)results.append(node('p','', 'No legacy destinations match this search.'));
}
search.addEventListener('input',directory);directory();
/* The coordinate notebook remains the original local store; consolidate its controls with the new map rather than a second blank grid. */
const notebook=$('nx22Atlas');
if(notebook){
 const panel=node('details','nx222-tool-details');panel.id='nx222WaypointTools';
 const summary=node('summary','','PERSONAL WAYPOINT EDITOR · IMPORT / EXPORT / MAP ID');
 panel.append(summary);
 notebook.before(panel);panel.append(notebook);
 const grid=$('nx22Grid');if(grid){grid.setAttribute('aria-label','Deprecated neutral coordinate grid, editor only; real game maps are above');}
 const hint=node('p','nx222-note','Saved personal pins also appear on the real map for matching zone + UI Map ID. After adding or importing a pin, reopen its zone or refresh the page to display it on the real map.');
 panel.append(hint);
}
/* Route Architect and mission editor still use the historical local records; expose their route/zone choice in the map viewer. */
const route=$('nx181RouteStudio');
if(route){
 const jump=node('button','nx222-route-map','OPEN SELECTED ROUTE STOP ON REAL MAP');
 jump.type='button';jump.textContent='OPEN FIRST ROUTE STOP ON REAL MAP';
 const status=node('p','nx222-note','In-page game maps are currently available for 10 supported zones; older saved stops retain their original IDs and can use the external map directory.');
 jump.addEventListener('click',()=>{
  const selected=$('nx181Board')?.querySelector('[data-zone]');
  const id=selected?.dataset.zone||$('nx181ZonePicker')?.value;
  if(id&&go(id))return;
  const z=world.zoneById(id);
  status.textContent=z?'This older stop ('+z.name+') has no in-page game map yet. Use the external map directory instead.':'Select a route stop first.';
 });
 route.querySelector('.nx181-panel-head')?.append(jump);
 route.append(status);
 route.addEventListener('click',event=>{
  const b=event.target.closest('[data-nx222-map]');if(b)go(b.dataset.nx222Map);
 });
}

// Redirect legacy per-stop OPEN ZONE links to an actual matching game map,
// never to the Zul'Aman default for an unsupported saved destination.
const routeBoard=$('nx181Board');
function patchRouteLinks(){
 if(!routeBoard)return;
 for(const link of routeBoard.querySelectorAll('a[href*="world-atlas.html?zone="]')){
  const id=new URL(link.href,location.href).searchParams.get('zone');
  if(safeMap.has(id)){
   link.href='./world-atlas.html?zone='+encodeURIComponent(id)+'#nx221RealAtlas';
   link.textContent='OPEN REAL ZONE MAP ↗';
  } else {
   link.href='https://www.wowhead.com/maps';link.target='_blank';link.rel='noopener noreferrer';
   link.textContent='FIND EXTERNAL MAP ↗';
   link.title='No verified in-page map for this zone yet; find it in the external map directory';
  }
 }
}
if(routeBoard){new MutationObserver(patchRouteLinks).observe(routeBoard,{childList:true});patchRouteLinks()}

const missions=$('nx16Missions');
if(missions){
 const form=$('nx16GoalForm');
 if(form){
  const button=node('button','nx222-route-map','VIEW SELECTED MISSION ZONE ON MAP');
  button.type='button';button.addEventListener('click',()=>{
   const id=$('nx16GoalZone')?.value;
   if(!go(id)){$('nx16GoalStatus').textContent='This older destination has no in-page game map yet. Its saved mission remains intact; use the external map directory above.';}
  });form.querySelector('.nx16-form-actions')?.append(button);
 }
}
const header=$('nx16Map');
if(header)header.setAttribute('aria-hidden','true');
const lead=real.querySelector('.nx221-overline');if(lead)lead.textContent='NEXUS / AZEROTH · UNIFIED REAL MAP EXPERIENCE';
const sub=real.querySelector('.nx221-footer span');if(sub)sub.textContent='Existing routes, missions and personal waypoints are still supported. Legacy illustrated maps have been retired in favor of real zone maps.';
})();
