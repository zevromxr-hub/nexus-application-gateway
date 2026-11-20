/* NEXUS v22 — WORLD ATLAS ZONE COORDINATE LAB
 * User-supplied map coordinates overlay a neutral 0..100 grid or the user's
 * temporary locally selected map image. NEVER the fantasy continent chart.
 * Writes only nexus_atlas_waypoints_v22; old goals/routes remain untouched.
 */
(()=>{'use strict';
const core=window.NexusLivingIntelligenceV22,root=document.getElementById('nx16Atlas');
if(!core||!root||document.getElementById('nx22Atlas'))return;
const $=id=>document.getElementById(id),
 el=(tag,cls,value)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=String(value);return x};
const read=()=>{try{const raw=localStorage.getItem(core.KEYS.waypoints);return core.cleanWaypoints(raw?JSON.parse(raw):null)}catch(_){return []}};
const save=items=>{try{localStorage.setItem(core.KEYS.waypoints,JSON.stringify(core.cleanWaypoints(items)));window.dispatchEvent(new Event('nexus:waypoints-changed'));return true}catch(_){status('Browser local storage is full or unavailable; export your waypoints.',true);return false}};
let rows=read(),mapURL=null,selected='',filter='all';
const requested=new URLSearchParams(location.search).get('zone');
selected=core.zoneMap.has(requested)?requested:'hallowfall';
const shell=el('section','nx22-atlas');shell.id='nx22Atlas';shell.setAttribute('aria-labelledby','nx22AtlasTitle');
shell.innerHTML='<div class="nx22-heading"><div class="nx22-eyebrow">03 / LIVING CARTOGRAPHY · EXACT USER COORDINATES</div>'+
 '<h2 id="nx22AtlasTitle">ZONE WAYPOINT <em>LABORATORY.</em></h2>'+
 '<p>Keep meaningful X/Y map coordinates alongside your existing Atlas routes. These positions belong to a specific in-game zone UI Map ID; the original NEXUS world art above remains illustrative.</p>'+
 '<div class="nx22-source-pills"><span>◉ ZONE GRID 0–100</span><span>⌖ YOUR OWN PINS</span><span>▣ LOCAL IMAGE PREVIEW</span><span>⛨ NO PLAYER LOCATION TRACKING</span></div></div>'+
 '<div class="nx22-atlas-work"><form id="nx22AtlasForm" class="nx22-coordinate-form">'+
  '<span class="nx22-small">PIN EDITOR · MANUAL SOURCE</span>'+
  '<label for="nx22Zone">ZONE<select id="nx22Zone" required></select></label>'+
  '<div class="nx22-form-grid"><label for="nx22MapId">IN-GAME UI MAP ID<input id="nx22MapId" type="number" min="1" max="99999" step="1" required inputmode="numeric"></label>'+
  '<label for="nx22Kind">PIN CATEGORY<select id="nx22Kind">'+
  '<option>Landmark</option><option>Activity</option><option>Collectible</option><option>Dungeon</option><option>Raid</option><option>Custom</option></select></label></div>'+
  '<label for="nx22Title">PERSONAL WAYPOINT TITLE<input id="nx22Title" maxlength="88" required placeholder="e.g. My gathering location" autocomplete="off"></label>'+
  '<div class="nx22-form-grid"><label for="nx22X">X · 0 TO 100<input id="nx22X" type="number" min="0" max="100" step=".01" inputmode="decimal" required placeholder="56.40"></label>'+
  '<label for="nx22Y">Y · 0 TO 100<input id="nx22Y" type="number" min="0" max="100" step=".01" inputmode="decimal" required placeholder="43.80"></label></div>'+
  '<label for="nx22Note">OPTIONAL RESEARCH NOTE<textarea id="nx22Note" maxlength="320" rows="2" placeholder="Your own source, goal or route note"></textarea></label>'+
  '<button type="submit" class="nx22-primary">✦ SAVE EXACT ZONE PIN</button>'+
  '<p class="nx22-hint">Enter coordinates from inside WoW or from a trusted source; no position is discovered automatically. Some zones need different map IDs depending on floor/phase.</p></form>'+
 '<div class="nx22-preview-panel"><div class="nx22-preview-head"><strong id="nx22PreviewTitle">ZONE COORDINATE GRID</strong><span id="nx22PreviewCount">0 PINS</span></div>'+
 '<div id="nx22Grid" class="nx22-grid" role="group" aria-label="Zone map coordinate grid from 0 to 100 on both axes; tap to populate manual coordinates">'+
  '<div class="nx22-grid-mark nx22-grid-mark-top">X 0 → 100</div><div class="nx22-grid-mark nx22-grid-mark-left">Y 0 → 100</div>'+
  '<div id="nx22Pins" class="nx22-grid-pins"></div><div class="nx22-grid-cross" aria-hidden="true">✦</div></div>'+
 '<div class="nx22-image-tools"><label class="nx22-image-pick">▣ PREVIEW MY OWN ZONE MAP IMAGE<input id="nx22Image" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label>'+
 '<button id="nx22ClearImage" type="button">USE NEUTRAL GRID</button></div>'+
 '<p class="nx22-hint">Your image stays in memory for this visit, never uploaded. Only use a map image you have rights to use. Pin placement assumes the image exactly represents this selected zone’s 0–100 map grid.</p></div></div>'+
 '<div class="nx22-atlas-footer"><div class="nx22-list-top"><div><strong>SAVED ZONE COORDINATES</strong><p id="nx22Status" role="status">Loading your personal waypoint notebook…</p></div><div class="nx22-list-actions">'+
 '<button type="button" id="nx22Export">EXPORT WAYPOINTS</button><label class="nx22-import">IMPORT JSON<input id="nx22Import" type="file" accept=".json,application/json"></label></div></div>'+
 '<div id="nx22WaypointList" class="nx22-pin-list" aria-live="polite"></div>'+
 '<div class="nx22-atlas-sources"><a href="https://warcraft.wiki.gg/wiki/Coordinates" target="_blank" rel="noopener noreferrer">WOW MAP COORDINATE REFERENCE ↗</a>'+
 '<a href="https://www.wowhead.com/guide/list-of-zone-map-id-number-for-navigation-in-wow-and-tomtom-19501" target="_blank" rel="noopener noreferrer">UI MAP ID GUIDE ↗</a>'+
 '<a href="./adventure-operations.html">OPEN ADVENTURE OPERATIONS ↗</a></div>'+
 '<p class="nx22-hint">NEXUS did not measure these locations. UI Map IDs are sourced reference values where supplied; the coordinates come from you. This grid is not a game map or travel router.</p></div>';
const anchor=document.getElementById('nx16Missions');
if(anchor)anchor.before(shell);else root.append(shell);
for(const z of core.ZONES){const opt=el('option','',z.name);opt.value=z.id;$('nx22Zone').append(opt)}
$('nx22Zone').value=selected;
function status(value,error=false){$('nx22Status').textContent=value;$('nx22Status').dataset.error=String(error)}
function setZone(id){
 if(!core.zoneMap.has(id))return;
 selected=id;$('nx22Zone').value=id;
 $('nx22MapId').value=core.mapIDs[id]||'';
 releaseImage();
 render();
}
function releaseImage(){
 if(mapURL){URL.revokeObjectURL(mapURL);mapURL=null}
 $('nx22Grid').style.removeProperty('--nx22-preview-url');
 $('nx22Grid').classList.remove('nx22-user-image');
 $('nx22Image').value='';
}
function download(body,name){
 const blob=new Blob([body],{type:'application/json'}),url=URL.createObjectURL(blob);
 const a=el('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
async function copy(value){
 if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return}
 const t=el('textarea');t.value=value;t.style.position='fixed';t.style.opacity='0';document.body.append(t);t.select();
 const ok=document.execCommand('copy');t.remove();if(!ok)throw Error('Clipboard access unavailable. Select and copy the coordinates manually.');
}
function pinIcon(k){return ({Landmark:'⌖',Activity:'⚔',Collectible:'✦',Dungeon:'◆',Raid:'⛨',Custom:'◉'})[k]||'◉'}
function render(){
 const zone=core.zoneMap.get(selected);if(!zone)return;
 $('nx22PreviewTitle').textContent=zone.name.toUpperCase()+' · ZONE COORDINATES';
 const visible=rows.filter(x=>x.zoneId===selected);
 $('nx22PreviewCount').textContent=visible.length+' SAVED PIN'+(visible.length===1?'':'S');
 const host=$('nx22Pins'),list=$('nx22WaypointList');host.replaceChildren();list.replaceChildren();
 const frag=document.createDocumentFragment();
 for(const p of visible){
  const b=el('button','nx22-pin',pinIcon(p.kind));b.type='button';b.dataset.id=p.id;
  b.style.left=p.x+'%';b.style.top=p.y+'%';b.title=p.title+' · '+p.x.toFixed(2)+', '+p.y.toFixed(2);
  b.setAttribute('aria-label',b.title);b.addEventListener('click',()=>{
   $('nx22X').value=p.x;$('nx22Y').value=p.y;$('nx22Title').value=p.title;$('nx22MapId').value=p.mapId;
   status('Selected '+p.title+' · '+p.x.toFixed(2)+', '+p.y.toFixed(2));
  });host.append(b);
  const card=el('article','nx22-record'),top=el('div','nx22-record-heading'),body=el('div','nx22-record-body'),actions=el('div','nx22-record-actions');
  top.append(el('span','nx22-record-icon',pinIcon(p.kind)),el('strong','',p.title));
  body.append(el('span','',p.kind+' · '+core.zoneMap.get(p.zoneId).name),
   el('b','', 'X '+p.x.toFixed(2)+' · Y '+p.y.toFixed(2)+' · UI MAP '+p.mapId));
  if(p.note)body.append(el('small','',p.note));
  for(const [name,action] of [['COPY IN-GAME MACRO','macro'],['USE IN EDITOR','use'],['DELETE','delete']]){
   const b=el('button','',name);b.type='button';b.dataset.action=action;b.dataset.id=p.id;actions.append(b);
  }
  card.append(top,body,actions);frag.append(card);
 }
 list.append(frag);
 if(!visible.length){
  list.append(el('p','nx22-empty','No coordinates saved for this zone yet. Enter one yourself—or tap the grid to fill X and Y.'));
 }
 status(rows.length+' total user-saved coordinate pins · '+visible.length+' in '+zone.name+' · no live position tracking');
}
$('nx22Zone').addEventListener('change',e=>setZone(e.target.value));
$('nx22Grid').addEventListener('click',e=>{
 if(e.target.closest('button'))return;
 const rect=$('nx22Grid').getBoundingClientRect();
 const x=(e.clientX-rect.left)/rect.width*100,y=(e.clientY-rect.top)/rect.height*100;
 $('nx22X').value=Math.min(100,Math.max(0,x)).toFixed(2);
 $('nx22Y').value=Math.min(100,Math.max(0,y)).toFixed(2);
 status('Grid point selected. Confirm these coordinates against your in-game zone map before saving.');
});
$('nx22AtlasForm').addEventListener('submit',e=>{
 e.preventDefault();
 try{
  const next=core.addWaypoint(rows,{zoneId:selected,mapId:$('nx22MapId').value,
   x:$('nx22X').value,y:$('nx22Y').value,title:$('nx22Title').value,
   kind:$('nx22Kind').value,note:$('nx22Note').value});
  if(!save(next))return;
  rows=next;$('nx22Title').value='';$('nx22Note').value='';render();
  status('Saved user-entered zone coordinates locally. They are not measured by NEXUS.');
 }catch(err){status(err.message||'Could not save coordinates',true)}
});
$('nx22WaypointList').addEventListener('click',async e=>{
 const btn=e.target.closest('button[data-action]');if(!btn)return;
 const p=rows.find(x=>x.id===btn.dataset.id);if(!p)return;
 if(btn.dataset.action==='macro'){
  try{await copy(core.gameWaypointMacro(p));status('Copied an in-game waypoint macro. Paste into WoW chat; the map must support waypoints.')}
  catch(err){status(err.message||'Clipboard unavailable',true)}
 }else if(btn.dataset.action==='use'){
  setZone(p.zoneId);$('nx22MapId').value=p.mapId;$('nx22X').value=p.x;$('nx22Y').value=p.y;
  $('nx22Title').value=p.title;$('nx22Note').value=p.note;status('Loaded waypoint into the editor. Save creates a new pin.');
  $('nx22Title').focus();
 }else if(btn.dataset.action==='delete'){
  if(!confirm('Delete ONLY this manually saved waypoint? Other Atlas goals and routes are unchanged.'))return;
  const next=core.removeWaypoint(rows,p.id);
  if(save(next)){rows=next;render();status('Deleted this coordinate record only.')}
 }
});
$('nx22Image').addEventListener('change',e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(!['image/png','image/jpeg','image/webp','image/gif'].includes(file.type)||file.size>12*1024*1024){
  e.target.value='';status('Choose a PNG, JPEG, WebP or GIF under 12 MB.',true);return
 }
 releaseImage();mapURL=URL.createObjectURL(file);
 $('nx22Grid').style.setProperty('--nx22-preview-url','url("'+mapURL+'")');
 $('nx22Grid').classList.add('nx22-user-image');
 status('Temporary local image preview loaded; align your personal X/Y coordinates to its edges.');
});
$('nx22ClearImage').addEventListener('click',()=>{releaseImage();status('Neutral zone grid restored.')});
window.addEventListener('pagehide',releaseImage);
$('nx22Export').addEventListener('click',()=>{
 const data={format:core.WAYPOINT_FORMAT,version:'22.0.0',source:'User-entered WoW UI map coordinates',exportedAt:new Date().toISOString(),waypoints:rows};
 download(JSON.stringify(data,null,2),'nexus-azeroth-v22-zone-waypoints.json');
 status('Exported only the v22 zone-coordinate notebook, not other private app records.');
});
$('nx22Import').addEventListener('change',async e=>{
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 if(file.size>128000){status('Waypoint JSON exceeds the safe import size.',true);return}
 try{
  const data=JSON.parse(await file.text());
  if(data?.format!==core.WAYPOINT_FORMAT||!Array.isArray(data.waypoints)||data.waypoints.length>160)
   throw Error('Expected a v22 zone-waypoints JSON archive.');
  const incoming=core.cleanWaypoints(data.waypoints);
  if(!incoming.length)throw Error('No valid coordinate records found.');
  if(!confirm('Add '+incoming.length+' valid coordinates to this browser’s v22 notebook? Existing pins are retained.'))return;
  const merged=core.cleanWaypoints([...rows,...incoming]);
  if(!save(merged))return;
  rows=merged;render();status('Imported '+incoming.length+' validated records. Duplicates are safely ignored.');
 }catch(err){status(err.message||'Invalid JSON archive',true)}
});
window.addEventListener('storage',e=>{if(e.key===core.KEYS.waypoints){rows=read();render()}});
setZone(selected); // Also prefill the sourced in-game UI Map ID on first load.
})();