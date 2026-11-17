/* NEXUS | AZEROTH v18.1 — VISUAL EXPEDITION ROUTES
 * Each route is a local, user-directed research itinerary, not travel navigation.
 * Writes ONLY nexus_atlas_routes_v181 and never modifies v16/16.5/v17 records.
 */
(()=>{'use strict';
const core=window.NexusAtlasRoutesV181,world=window.NexusWorldEngineCoreV16,
 map=window.NexusAtlasCartographyV18,atlas=document.getElementById('nx16Atlas');
if(!core||!world||!map||!atlas||document.getElementById('nx181RouteStudio'))return;
const $=id=>document.getElementById(id),
 e=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n},
 read=(key,max=160000)=>{try{const x=localStorage.getItem(key);return x&&x.length<max?JSON.parse(x):null}catch(_){return null}};
const GOALS='nexus_world_atlas_goals_v16';
let raw='',state=core.blank(),stale=false,pending=null,goals=[];
try{raw=localStorage.getItem(core.KEY)||''}catch(_){}
state=core.normalize(read(core.KEY));goals=world.cleanGoals(read(GOALS));
const section=e('section','nx181-route-studio');section.id='nx181RouteStudio';section.setAttribute('aria-labelledby','nx181Title');
section.innerHTML=[
'<div class="nx181-hero"><div><span class="nx181-kicker">02 / SOVEREIGN ROUTE ARCHITECT · v18.1</span>',
'<h2 id="nx181Title">PLAN YOUR <em>JOURNEY.</em></h2>',
'<p>Turn curated Azeroth destinations into a visual, ordered research itinerary. Route sequence, visited checks and notes are yours—<strong>nothing here claims in-game navigation, travel times or quest completion.</strong></p>',
'</div><a href="./adventure-operations.html">OPEN ADVENTURE OPERATIONS ↗</a></div>',
'<div class="nx181-stats"><div><small>ROUTE LIBRARY</small><strong id="nx181StatRoutes">0 / 6</strong></div>',
'<div><small>SELECTED STOPS</small><strong id="nx181StatStops">0 / 12</strong></div>',
'<div><small>REGIONS</small><strong id="nx181StatRegions">0</strong></div>',
'<div><small>MANUAL CHECKS</small><strong id="nx181StatDone">0</strong></div></div>',
'<div class="nx181-grid"><div class="nx181-workspace"><div class="nx181-panel-head"><span>EXPEDITION LIBRARY</span>',
'<small>Private · browser-local · independent of Atlas missions</small></div>',
'<div class="nx181-control"><label>SAVED ROUTE<select id="nx181Choose" aria-label="Select saved expedition route"></select></label>',
'<div class="nx181-create"><input id="nx181NewName" maxlength="70" placeholder="Name a new route…" aria-label="Name a new route">',
'<button type="button" id="nx181Create">CREATE ROUTE</button></div></div>',
'<div class="nx181-templates"><span>START FROM A RESEARCH IDEA</span>',
'<button type="button" data-template="capitals">Capital Survey</button>',
'<button type="button" data-template="dragons">Dragon Isles</button>',
'<button type="button" data-template="khaz">Khaz Algar</button></div>',
'<div id="nx181Editor" class="nx181-editor"></div><div class="nx181-foot-actions">',
'<button type="button" id="nx181Group">GROUP STOPS BY REGION</button>',
'<button type="button" id="nx181Delete">DELETE SELECTED ROUTE</button></div></div>',
'<div class="nx181-board"><div class="nx181-panel-head"><span>VISUAL ROUTE BOARD</span>',
'<small>Order of personal goals · not a travel path</small></div>',
'<div class="nx181-board-content"><div id="nx181Board" class="nx181-board-list" aria-live="polite"></div></div>',
'<div class="nx181-handoff"><p id="nx181HandOff">Atlas missions can be prepared separately in Expedition Intelligence and v17 Adventure Operations.</p>',
'<a href="./expedition-console.html">EXPEDITION INTELLIGENCE ↗</a></div></div></div>',
'<div class="nx181-portability"><div><strong>PORTABLE ROUTE PLANS</strong>',
'<small>Export your route library as JSON. Import after preview and confirmation; only this v18.1 library is replaced.</small></div>',
'<button type="button" id="nx181Export">EXPORT ROUTES</button>',
'<label class="nx181-file-btn">SELECT IMPORT FILE <input type="file" id="nx181File" accept=".json,application/json"></label>',
'<button type="button" id="nx181Import" disabled>CONFIRM IMPORT</button></div>',
'<p class="nx181-status" id="nx181Status" aria-live="polite">Your Atlas missions, Forge drafts, inventory and v17 session are never overwritten by route planning.</p>',
'<p class="nx181-disclaimer">Cartographic lines and numbered markers visualize your chosen sequence only. They do not show actual distances, game transport methods or optimized routes. Verify cross-continent travel independently.</p>'
].join('');
$('nx16Map').after(section);
const templates=Object.freeze({
 capitals:{title:'Four Capital Research Stops',zones:['stormwind-city','ironforge','orgrimmar','silvermoon-city']},
 dragons:{title:'Dragon Isles Survey',zones:['waking-shores','valdrakken','azure-span']},
 khaz:{title:'Khaz Algar Field Survey',zones:['isle-of-dorn','ringing-deeps','hallowfall','azj-kahet']}
});
function selected(){return state.routes.find(r=>r.id===state.selected)||null}
function say(msg){$('nx181Status').textContent=msg}
function write(next,msg){
 try{
  if(stale||((localStorage.getItem(core.KEY)||'')!==raw)){
   stale=true;say('Your routes changed in another tab. Reload this page before editing, so the other changes are preserved.');return false;
  }
  const clean=core.normalize(next),json=JSON.stringify(clean);
  if(json.length>30000)throw Error('Route storage exceeded limit');
  localStorage.setItem(core.KEY,json);raw=json;state=clean;
  pending=null;$('nx181Import').disabled=true;
  refresh();say(msg||'Private route library saved on this device.');return true;
 }catch(_){say('Save failed; original Atlas missions, Forge data and v17 Operations remain unchanged.');return false}
}
function refreshData(){goals=world.cleanGoals(read(GOALS))}
function stats(){
 const r=selected(),s=core.summary(r,goals);
 $('nx181StatRoutes').textContent=state.routes.length+' / 6';
 $('nx181StatStops').textContent=s.stops+' / 12';
 $('nx181StatRegions').textContent=String(s.regions);
 $('nx181StatDone').textContent=s.done+' / '+s.stops;
 $('nx181Group').disabled=!r||r.stops.length<2;$('nx181Delete').disabled=!r;
}
function chooseRender(){
 const input=$('nx181Choose');input.replaceChildren();
 if(!state.routes.length){const opt=e('option','','No routes yet');opt.value='';input.append(opt);input.disabled=true;return}
 input.disabled=false;
 for(const r of state.routes){const o=e('option','',r.title+' · '+r.stops.length+' stops');o.value=r.id;input.append(o)}
 input.value=state.selected;
}
function label(text,field){const l=e('label','',text);l.append(field);return l}
function button(text,action,id,disabled=false){
 const b=e('button','',text);b.type='button';b.dataset.action=action;
 if(id)b.dataset.zone=id;
 b.disabled=disabled;return b
}
function editor(){
 const host=$('nx181Editor');host.replaceChildren();
 const r=selected();
 if(!r){host.append(e('div','nx181-empty','Create a route or choose one of the research templates to begin a private itinerary.'));return}
 const fields=e('div','nx181-editor-fields'),title=e('input'),notes=e('textarea');
 title.type='text';title.maxLength=70;title.value=r.title;title.id='nx181TitleInput';
 title.setAttribute('aria-label','Route title');
 notes.maxLength=500;notes.rows=2;notes.value=r.notes;notes.id='nx181RouteNotes';
 notes.placeholder='Private questions, preparation notes, or research theme…';
 fields.append(label('ROUTE TITLE',title),label('RESEARCH NOTES',notes),button('SAVE ROUTE DETAILS','details'));
 const add=e('div','nx181-add-stop'),select=e('select');
 select.id='nx181ZonePicker';select.setAttribute('aria-label','Choose an Atlas destination');
 const blank=e('option','','Choose a curated destination');blank.value='';select.append(blank);
 for(const region of world.regions){
  const group=e('optgroup');group.label=region.name;
  for(const z of world.zones.filter(x=>x.regionId===region.id)){
   const opt=e('option','',z.kind+' · '+z.name);opt.value=z.id;group.append(opt)
  }
  select.append(group);
 }
 add.append(select,button('ADD LOCATION','add','',r.stops.length>=12),button('ADD SELECTED MAP PIN','pin','',r.stops.length>=12));
 host.append(fields,add,e('p','nx181-hint','Choose a zone icon on the map above, or add any destination from the list. Up to 12 unique stops.'));
}
function board(){
 const host=$('nx181Board');host.replaceChildren();
 const r=selected();
 if(!r||!r.stops.length){
  $('nx181HandOff').textContent='Add destinations to your route to see which stops connect to your existing Atlas missions.';
  host.append(e('div','nx181-empty','No stops yet. Choose a destination or start from a curated template.'));decorateMap();return
 }
 const s=core.summary(r,goals);
 $('nx181HandOff').textContent=s.linked+' of '+s.stops+' destinations have saved personal Atlas missions. '+s.transitions+' changes of region in your chosen sequence. These are NOT travel directions.';
 r.stops.forEach((stop,i)=>{
  const z=world.zoneById(stop.zoneId),region=world.regionById(z.regionId);
  const card=e('article','nx181-stop'+(stop.done?' nx181-stop-done':'')),
   top=e('div','nx181-stop-top'),number=e('b','nx181-stop-number',String(i+1).padStart(2,'0')),
   copy=e('div','nx181-stop-copy');
  copy.append(e('strong','',z.name),e('span','',region.name+' · '+z.kind));
  const c=goals.filter(g=>g.zoneId===z.id).length,badge=e('span','nx181-mission-badge',c+' local mission'+(c===1?'':'s'));
  top.append(number,copy,badge);card.append(top);
  const controls=e('div','nx181-stop-buttons');
  controls.append(button('↑ MOVE UP','up',z.id,i===0),button('↓ MOVE DOWN','down',z.id,i===r.stops.length-1),
   button(stop.done?'✓ VISITED (MANUAL)':'○ MARK VISITED','done',z.id),
   button('REMOVE','remove',z.id));
  card.append(controls);
  const foot=e('div','nx181-stop-foot'),input=e('input');
  input.type='text';input.maxLength=200;input.value=stop.note;input.dataset.note=z.id;
  input.placeholder='Private stop note';input.setAttribute('aria-label','Personal note for '+z.name);
  const open=e('a','','OPEN ZONE ↗');open.href='./world-atlas.html?zone='+encodeURIComponent(z.id);
  foot.append(input,button('SAVE NOTE','note',z.id),open);card.append(foot);
  if(i<r.stops.length-1)card.classList.add('nx181-stop-continues');
  host.append(card);
 });
 decorateMap();
}
let overlay=null;
function decorateMap(){
 const host=$('nx18ChartPins'),chart=$('nx18Chart');if(!host||!chart)return;
 const stops=selected()?.stops||[];
 for(const pin of host.querySelectorAll('button[data-zone]')){
  const i=stops.findIndex(s=>s.zoneId===pin.dataset.zone);
  pin.classList.toggle('nx181-in-route',i>=0);
  pin.querySelector('.nx181-route-marker')?.remove();
  if(i>=0){pin.append(e('span','nx181-route-marker',String(i+1)));pin.title='Route stop '+(i+1)+' of '+stops.length}
 }
 if(!overlay){
  overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');
  overlay.setAttribute('id','nx181RouteOverlay');overlay.setAttribute('viewBox','0 0 100 100');
  overlay.setAttribute('preserveAspectRatio','none');overlay.setAttribute('aria-hidden','true');
  overlay.classList.add('nx181-route-lines');chart.insertBefore(overlay,host);
 }
 overlay.replaceChildren();
 for(let i=1;i<stops.length;i++){
  const a=map.position(world.zoneById(stops[i-1].zoneId)),b=map.position(world.zoneById(stops[i].zoneId));
  // Show visual sequence ONLY for adjacent stops inside the currently displayed research region.
  if(!a||!b||a.region!==b.region||a.region!==chart.dataset.region)continue;
  const line=document.createElementNS('http://www.w3.org/2000/svg','path');
  line.setAttribute('d','M'+a.x+' '+a.y+' L'+b.x+' '+b.y);overlay.append(line);
 }
}
function refresh(){refreshData();chooseRender();stats();editor();board()}
$('nx181Create').addEventListener('click',()=>{
 if(state.routes.length>=6){say('Six saved routes already; export or remove an older route first.');return}
 if(write(core.addRoute(state,$('nx181NewName').value),'Created a new private route.'))$('nx181NewName').value='';
});
$('nx181NewName').addEventListener('keydown',ev=>{if(ev.key==='Enter')$('nx181Create').click()});
$('nx181Choose').addEventListener('change',ev=>write(core.choose(state,ev.target.value),'Selected the saved route.'));
$('nx181Editor').addEventListener('click',ev=>{
 const target=ev.target.closest('button[data-action]'),r=selected();if(!target||!r)return;
 const act=target.dataset.action;
 if(act==='details'){write(core.change(state,r.id,{title:$('nx181TitleInput').value,notes:$('nx181RouteNotes').value}),'Saved route title and private notes.');return}
 let id=act==='add'?$('nx181ZonePicker').value:document.querySelector('#nx18ChartPins button[data-zone][aria-pressed="true"]')?.dataset.zone;
 if(!world.zoneById(id)){say('Select a known research location first.');return}
 if(r.stops.some(s=>s.zoneId===id)){say('This destination is already in your itinerary. Reorder it below instead.');return}
 write(core.push(state,r.id,id),'Added '+world.zoneById(id).name+' to your visual itinerary.');
});
$('nx181Board').addEventListener('click',ev=>{
 const b=ev.target.closest('button[data-action]'),r=selected();if(!b||!r)return;
 const id=b.dataset.zone,stop=r.stops.find(s=>s.zoneId===id);if(!stop)return;
 if(b.dataset.action==='up'||b.dataset.action==='down')
  write(core.move(state,r.id,id,b.dataset.action==='up'?-1:1),'Reordered your manual route stops.');
 if(b.dataset.action==='remove')write(core.removeStop(state,r.id,id),'Removed the stop from this route only.');
 if(b.dataset.action==='done')write(core.modifyStop(state,r.id,id,{done:!stop.done}),'Updated a manual visited checkbox—not game completion.');
 if(b.dataset.action==='note'){
  const input=[...$('nx181Board').querySelectorAll('input[data-note]')].find(x=>x.dataset.note===id);
  if(input)write(core.modifyStop(state,r.id,id,{note:input.value}),'Saved the private stop note.');
 }
});
$('nx181Group').addEventListener('click',()=>{
 const r=selected();if(!r||r.stops.length<2)return;
 if(!confirm('Group stops by region for easier research? This changes only the manual order, not true travel distance.'))return;
 write(core.groupByRegion(state,r.id),'Grouped your stops by region. This is NOT a travel optimizer.');
});
$('nx181Delete').addEventListener('click',()=>{
 const r=selected();if(!r)return;
 if(!confirm('Delete this saved route? Original Atlas missions and Adventure Operations are not affected.'))return;
 write(core.removeRoute(state,r.id),'Removed only the selected private route.');
});
section.querySelectorAll('button[data-template]').forEach(b=>b.addEventListener('click',()=>{
 const template=templates[b.dataset.template];if(!template)return;
 if(state.routes.length>=6){say('Six routes already saved. Export or delete one first.');return}
 let next=core.addRoute(state,template.title),id=next.selected;
 for(const zoneId of template.zones)next=core.push(next,id,zoneId);
 write(next,'Created a curated research itinerary. Verify actual travel yourself.');
}));
$('nx181Export').addEventListener('click',()=>{
 try{
  const payload=core.exportPayload(state),blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
  const u=URL.createObjectURL(blob),a=e('a');a.href=u;a.download='nexus-atlas-routes-v18.1.json';
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1500);
  say('Exported your route library. Review personal notes before sharing.');
 }catch(_){say('Export failed; your original records are unchanged.')}
});
$('nx181File').addEventListener('change',async ev=>{
 pending=null;$('nx181Import').disabled=true;
 const file=ev.target.files?.[0];if(!file)return;
 if(file.size>100000||file.size<10){say('Choose a JSON backup smaller than 100 KB.');return}
 try{
  const json=JSON.parse(await file.text());
  if(json?.format!=='nexus.atlas-routes-backup/1'||json?.data?.format!==core.FORMAT||!Array.isArray(json.data.routes))throw Error('Format');
  const next=core.normalize(json.data),entries=json.data.routes.reduce((n,x)=>n+(Array.isArray(x.stops)?x.stops.length:0),0),
   kept=next.routes.reduce((n,x)=>n+x.stops.length,0);
  pending=next;$('nx181Import').disabled=false;
  say('Import PREVIEW: '+next.routes.length+' routes / '+kept+' valid curated stops. File had '+json.data.routes.length+' route entries and '+entries+' stops. Confirm to replace ONLY the v18.1 library.');
 }catch(_){say('Invalid route backup; nothing changed.')}
});
$('nx181Import').addEventListener('click',()=>{
 if(!pending)return;
 if(!confirm('Replace ONLY the v18.1 route library? All Atlas missions, bookmarks, characters, builds and v17 sessions stay untouched.'))return;
 if(write(pending,'Imported your reviewed route library.'))$('nx181File').value='';
 pending=null;$('nx181Import').disabled=true;
});
const pins=$('nx18ChartPins');if(pins)new MutationObserver(()=>queueMicrotask(decorateMap)).observe(pins,{childList:true});
window.addEventListener('storage',ev=>{
 if(ev.key===core.KEY){stale=true;say('A second tab changed the route library. Reload before editing to protect its changes.')}
 if(ev.key===GOALS){refreshData();stats();board()}
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden){refreshData();stats();board()}});
refresh();
})();