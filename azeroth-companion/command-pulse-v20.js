/* NEXUS | AZEROTH v20 — COMMAND PULSE
 * Source-only visual continuity strip. Reads saved manual plans, never claims
 * verified in-game status. Does NOT write any localStorage or IndexedDB.
 */
(()=>{'use strict';
if(document.getElementById('nx20Pulse'))return;
const anchor=document.getElementById('nx10Chronicle');if(!anchor)return;
const e=(tag,cls,value)=>{const x=document.createElement(tag);if(cls)x.className=cls;if(value!==undefined)x.textContent=String(value);return x};
function read(key,max=280000){
 try{const v=localStorage.getItem(key);if(!v||v.length>max)return null;return JSON.parse(v)}catch(_){return null}
}
const panel=e('section','nx20-pulse');panel.id='nx20Pulse';
panel.setAttribute('aria-labelledby','nx20Title');
panel.innerHTML='<div class="nx20-pulse-art" aria-hidden="true"><span>✦</span></div>'+
 '<div class="nx20-pulse-head"><div><span class="nx20-pulse-overline">YOUR NEXT MOVE · PRIVATE BROWSER-LOCAL PLANS</span>'+
 '<h2 id="nx20Title">CONTINUE THE <em>ADVENTURE.</em></h2>'+
 '<p>Every mission and itinerary below is a plan you saved manually, not a scan of game achievements or equipment.</p></div>'+
 '<a class="nx20-pulse-primary" id="nx20Resume" href="./world-atlas.html">RESUME THE ATLAS ↗</a></div>'+
 '<div class="nx20-pulse-metrics" id="nx20Metrics" aria-label="Your local manual planning summary"></div>'+
 '<div class="nx20-pulse-footer"><div id="nx20ContinueText" aria-live="polite">Checking your saved planning records…</div>'+
 '<div class="nx20-pulse-links">'+
 '<a href="./private-video-vault.html"><strong>◆</strong> PRIVATE VIDEO VAULT</a>'+
 '<a href="./adventure-operations.html"><strong>◈</strong> ADVENTURE OPERATIONS</a>'+
 '<a href="./?enter=1&amp;view=talents" data-nx10-app><strong>✦</strong> TALENT FORGE</a>'+
 '<a href="./save-protection.html"><strong>⌑</strong> BACKUP MY PLANS</a></div></div>';
anchor.before(panel);
const safeZone=id=>typeof id==='string'&&/^[a-z0-9-]{4,80}$/.test(id);
const safeView=view=>['talents','characters','dashboard','progress','collections','armory','guide','builds'].includes(view);
function metric(label,value,description){
 const cell=e('div','nx20-metric');
 cell.append(e('strong','',String(value)),e('span','',label),e('small','',description));
 return cell;
}
function render(){
 const atlas=read('nexus_world_atlas_goals_v16',700000),
  routes=read('nexus_atlas_routes_v181'),
  operations=read('nexus_adventure_operations_v17'),
  forge=read('nexus_azeroth_talent_forge_v1'),
  last=read('nexus_citadel_recent_view_v91',1200);
 const goals=(Array.isArray(atlas)?atlas:[]).slice(0,100),
  planned=goals.filter(g=>g&&g.status==='planned').length,
  active=goals.filter(g=>g&&g.status==='active').length,
  routeList=(Array.isArray(routes?.routes)?routes.routes:[]).slice(0,6),
  stopCount=routeList.reduce((n,r)=>n+Math.min(12,Array.isArray(r.stops)?r.stops.length:0),0),
  sessions=Math.min(18,Array.isArray(operations?.entries)?operations.entries.length:0),
  drafts=Math.min(300,Array.isArray(forge)?forge.length:0);
 const host=document.getElementById('nx20Metrics');host.replaceChildren(
  metric('ACTIVE ATLAS GOALS',active,'Manually marked in progress'),
  metric('SAVED EXPEDITIONS',routeList.length,stopCount+' ordered research stops'),
  metric('ADVENTURE SESSION',sessions,'Personal session entries'),
  metric('FORGE DRAFTS',drafts,'Browser-local build records'));
 const target=goals.find(g=>g&&g.status==='active'&&safeZone(g.zoneId))||
  goals.find(g=>g&&g.status==='planned'&&safeZone(g.zoneId));
 const resume=document.getElementById('nx20Resume');
 resume.href=target?'./world-atlas.html?zone='+encodeURIComponent(target.zoneId):'./world-atlas.html';
 resume.textContent=target?'RESUME '+String(target.title||'ATLAS GOAL').slice(0,40).toUpperCase()+' ↗':'EXPLORE THE ATLAS ↗';
 const message=(active||planned||routeList.length)?
  active+' active and '+planned+' planned Atlas objectives; '+routeList.length+' saved expedition itineraries.':
  'No mission history yet. Explore the Atlas and start your first personal expedition.';
 const lastView=safeView(last?.view)?' · Last visited studio: '+String(last.label||last.view).slice(0,55):'';
 document.getElementById('nx20ContinueText').textContent=message+lastView;
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;render()})}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
window.addEventListener('storage',schedule);
window.addEventListener('pageshow',schedule);
render();
})();