/* NEXUS | AZEROTH v22.1 — REAL MAPS FIRST / SOURCE-AWARE WORLD ATLAS
 * No new persistent keys, account scopes, APIs or blank coordinate art.
 * Game-map media is displayed from its external source and © Blizzard.
 * Selected documented locations are a curated research sample, not exhaustive.
 * New code only reads, never modifies, previous v16/v18/v22 Atlas records.
 */
(()=>{'use strict';
const core=window.NexusLivingIntelligenceV22,root=document.getElementById('nx221RealAtlas');
if(!core||!root)return;
const imageBase='https://thewowdb.com/assets/wowdex/maps/worldmap/';
const maps=[
 {id:'silvermoon-midnight',name:'Silvermoon City (Midnight)',era:'Midnight · Silvermoon City',mapId:2393,
 source:'https://thewowdb.com/zone/silvermoon-city-15969/',
 points:[['Murder Row','Dungeon',56.2,61.1],['Great Vault & Bank','Landmark',50.6,65.4],
 ['Auction House','Landmark',50.3,74.9],['Item Upgrader','Landmark',48.6,61.8],
 ['Work Orders & Professions','Landmark',45.6,54.0],['Portal Room','Landmark',53.3,66.2],
 ['Sanctum of Light flight point','Flight',51.0,71.0],['The Royal Exchange flight point','Flight',69.4,63.6],
 ['Harandar portal','Landmark',36.8,68.4],['Voidstorm portal','Landmark',35.3,65.5]]},
 {id:'eversong-midnight',name:'Eversong Woods (Midnight)',era:'Midnight · Eversong Woods',mapId:2395,
 source:'https://thewowdb.com/zone/eversong-woods-16312/',
 points:[['To the Central Tower · quest turn-in','Quest',48.6,57.6],
 ['To the Central Tower · objective area','Quest',56.7,40.8],
 ['Dangerous Showpieces · objective area','Quest',43.5,68.9]]},
 {id:'zul-aman',name:"Zul'Aman",era:'Midnight · current Retail',mapId:2437,
 source:'https://thewowdb.com/zone/zul-aman-15947/',
 points:[['Abundance: Enchanting Crypt','Landmark',17.5,38.0],
 ['Abundance: Skinning Den','Landmark',31.6,26.1],
 ['Abyss Anglers','Landmark',68.2,20.2],
 ['Aqir Invasion of Zul’Aman','Landmark',35.9,50.4],
 ['Maisara Caverns','Landmark',43.8,39.5],
 ["Amani'Zar Village",'Flight',44.8,65.5],["Atal'Aman",'Flight',31.6,53.4],
 ['Camp Stonewash','Flight',47.3,25.5],['Shadebasin Watch','Flight',44.0,33.7],
 ['Torntusk Overlook','Flight',33.8,78.4],['Witherbark Bluffs','Flight',38.8,23.2],
 ["Quest hub near Amani'Zar Village",'Quest',44.6,67.0],
 ['Quest hub near Witherbark Bluffs','Quest',38.0,23.8]]},
 {id:'harandar',name:'Harandar',era:'Midnight · current Retail',mapId:2413,
 source:'https://thewowdb.com/zone/harandar-15355/',
 points:[['Abundance: Herbalism Grotto','Landmark',66.2,61.7],
 ['Eversong Rootway','Landmark',53.3,55.5],
 ['Portal to Voidstorm','Landmark',53.0,55.7],
 ['Rootway to Fairbreeze','Landmark',75.7,53.6],
 ['The Grudge Pit','Delve',70.5,64.9],['The Gulf of Memory','Delve',36.3,49.1],
 ["Har'alnor",'Flight',31.7,67.4],["Har'athir",'Flight',69.4,52.6],
 ["Har'kuai",'Flight',64.6,23.1],["Har'mara",'Flight',35.5,23.8],
 ['The Den','Flight',54.1,53.2],
 ['Quest hub near The Den','Quest',54.2,53.3],
 ['Quest hub near Har’mara','Quest',35.0,25.3]]},
 {id:'voidstorm',name:'Voidstorm',era:'Midnight · current Retail',mapId:2405,
 source:'https://thewowdb.com/zone/voidstorm-16648/',
 points:[['Abundance: Mining Voidburrow','Landmark',38.9,53.4],
 ['Portal to Harandar','Landmark',51.7,70.4],
 ['Portal to Naigtal','Landmark',51.4,71.3],
 ['Portal to Silvermoon','Landmark',34.0,60.7],
 ['Howling Ridge','Flight',51.2,69.2],
 ['Locus Point','Flight',42.3,73.7],
 ["Masters’ Perch",'Flight',44.8,39.5],
 ['The Ingress','Flight',36.9,58.9],
 ['Quest hub near Howling Ridge','Quest',52.0,68.8],
 ['Quest hub near Locus Point','Quest',41.8,74.4],
 ['Quest hub near The Ingress','Quest',35.6,59.5]]},
 {id:'hallowfall',name:'Hallowfall',era:'Khaz Algar · The War Within',mapId:2215,
 source:'https://thewowdb.com/zone/hallowfall-14838/',
 points:[['The Dawnbreaker','Dungeon',54.9,63.1],['Priory of the Sacred Flame','Dungeon',41.3,49.3],
 ['Mycomancer Cavern','Delve',71.3,31.2],['Nightfall Sanctum','Delve',34.3,47.3],
 ['The Sinkhole','Delve',50.7,53.3],['Mereldar','Flight',41.5,52.5],
 ["Dunelle’s Kindness",'Flight',67.5,44.6],["Light’s Redoubt",'Flight',40.5,71.2],
 ["Lorel’s Crossing",'Flight',48.3,40.7],['The Aegis Wall','Flight',71.3,56.5]]},
 {id:'ringing-deeps',name:'The Ringing Deeps',era:'Khaz Algar · The War Within',mapId:2214,
 source:'https://thewowdb.com/zone/the-ringing-deeps-14795/',
 points:[['The Stonevault','Dungeon',42.7,8.1],['Darkflame Cleft','Dungeon',55.5,21.4],
 ['Operation: Floodgate','Dungeon',42.0,39.4],['The Waterworks','Delve',42.2,48.6],
 ['The Dread Pit','Delve',70.2,37.2],['Gundargaz','Flight',42.8,33.4],
 ['Camp Murroch','Flight',54.0,64.1],['Gutterville','Flight',71.4,83.4],
 ['Opportunity Point','Flight',60.6,78.1],['Shadowvein Point','Flight',57.3,47.9]]},
 {id:'isle-of-dorn',name:'Isle of Dorn',era:'Khaz Algar · The War Within',mapId:2248,
 source:'https://thewowdb.com/zone/isle-of-dorn-14717/',
 points:[['The Rookery','Dungeon',45.0,41.1],['Cinderbrew Meadery','Dungeon',76.7,43.8],
 ['Dornogal','Flight',48.4,44.9],['Durgaz Cabin','Flight',67.4,43.3],
 ['Freywold Village','Flight',41.1,72.9],['Rambleshire','Flight',59.2,28.5],
 ['Tranquil Strand','Flight',29.7,58.3]]},
 {id:'azj-kahet',name:'Azj-Kahet',era:'Khaz Algar · The War Within',mapId:2255,
 source:'https://warcraft.wiki.gg/wiki/Azj-Kahet',
 points:[['Nerub-ar Palace','Raid',45.1,90.7],['City of Threads','Dungeon',48.1,71.3],
 ['Ara-Kara, City of Echoes','Dungeon',50.7,82.1],['The Spiral Weave','Delve',46.5,25.4],
 ['The Burrows','Flight',52.7,81.2],["Faerin’s Advance",'Flight',60.2,25.1],
 ["The Weaver’s Lair",'Flight',57.3,51.1]]},
 {id:'valdrakken',name:'Valdrakken',era:'Dragon Isles · Dragonflight',mapId:2112,
 source:'https://thewowdb.com/zone/valdrakken-13862/',
 points:[['The Seat of the Aspects','Landmark',57.9,35.4],['Great Vault','Landmark',58.9,57.9],
 ['Engine of Innovation','Landmark',84,53.6],['Arcane Forge','Landmark',36.5,62],
 ['Valdrakken flight master','Flight',44.5,67.9]]},
 {id:'waking-shores',name:'The Waking Shores',era:'Dragon Isles · Dragonflight',mapId:2022,
 source:'https://thewowdb.com/quest/how-to-use-momentum-with-your-dragon-65133/',
 points:[['Wingrest Embassy quest area','Quest',76.1,34.5],
 ['Obsidian Citadel quest area','Quest',62.6,33.2],
 ['Ruby Life Pools riding lesson','Quest',57.5,59.1],
 ['Obsidian Throne quest area','Quest',27.3,62.8]]},
 {id:'azure-span',name:'The Azure Span',era:'Dragon Isles · Dragonflight',mapId:2024,
 source:'https://thewowdb.com/quest/securing-the-area-winterpelt-hollow-66192/',
 points:[['Winterpelt Hollow quest objective','Quest',70.8,26.1]]}
];
const glyphs={Dungeon:'◆',Delve:'✦',Raid:'⛨',Flight:'✈',Landmark:'⌖',Quest:'!',Personal:'★'};
const el=(tag,cls,txt)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=String(txt);return n};
const $=id=>document.getElementById(id);
const zone=id=>maps.find(x=>x.id===id)||null;
const params=new URLSearchParams(location.search);
const state={id:zone(params.get('zone'))?.id||'zul-aman',filter:'all',query:'',zoom:1,panX:0,panY:0,selected:null,own:[]};
function readOwn(){
 try{const raw=localStorage.getItem(core.KEYS.waypoints);return core.cleanWaypoints(raw?JSON.parse(raw):null)}
 catch(_){return []}
}
function rows(z){
 const catalog=z.points.map((p,i)=>({id:'catalog-'+i,title:p[0],kind:p[1],x:p[2],y:p[3],
 source:'Referenced location · '+(z.source.includes('wiki.gg')?'Warcraft Wiki':'TheWoWDB'),
 mapId:z.mapId,url:z.source}));
 const own=state.own.filter(p=>p.zoneId===z.id&&p.mapId===z.mapId).map(p=>({
 id:'own-'+p.id,title:p.title,kind:'Personal',x:p.x,y:p.y,mapId:p.mapId,
 source:'Your manually saved location · not independently checked',url:'#nx22Atlas',note:p.note}));
 return [...catalog,...own];
}
function filtered(z){
 return rows(z).filter(p=>(state.filter==='all'||state.filter===p.kind)&&
 (!state.query||(p.title+' '+p.kind).toLowerCase().includes(state.query)));
}
function setSource(z){
 $('nx221SourceHero').href=z.source;$('nx221MapFallback').href=z.source;
 $('nx221OpenResearch').href=z.source;
 $('nx221MediaCredit').textContent='World map art © Blizzard Entertainment · served externally by TheWoWDB; documented points: '+
  (z.source.includes('wiki.gg')?'Warcraft Wiki':'TheWoWDB')+'. Not NEXUS map artwork.';
}
function show(id){
 const z=zone(id);if(!z)return;
 state.id=z.id;state.zoom=1;state.panX=0;state.panY=0;state.filter='all';state.query='';state.selected=null;
 if(typeof selection!=='undefined')selection.hidden=true;
 if(typeof toolbarTitle!=='undefined')toolbarTitle.textContent=z.name;
 if(!window.NexusAtlasV23)$('nx221Search').value='';$('nx221SelectedName').textContent='Choose a destination';
 $('nx221SelectedInfo').textContent='Click a sourced marker to see its coordinates.';
 $('nx221Copy').disabled=true;
 const url=new URL(location.href);url.searchParams.set('zone',z.id);
 history.replaceState(history.state,'',url.pathname+url.search+url.hash);
 $('nx221ZoneTitle').textContent=z.name.toUpperCase();
 $('nx221ZoneInfo').textContent=z.era+' · UI MAP '+z.mapId;
 setSource(z);
 const tabs=$('nx221ZoneTabs');tabs.replaceChildren();
 for(const row of maps){
  const btn=el('button','nx221-zone-tab',row.name);btn.type='button';
  btn.setAttribute('aria-pressed',String(row.id===z.id));
  btn.addEventListener('click',()=>show(row.id));tabs.append(btn);
 }
 const image=$('nx221MapImage');
 image.onload=()=>{if(state.id!==z.id)return;$('nx221MapFailure').hidden=true;
  image.hidden=false;$('nx221MapSurface').hidden=false};
 image.onerror=()=>{if(state.id!==z.id)return;image.hidden=true;
  $('nx221MapSurface').hidden=true;$('nx221MapFailure').hidden=false};
 image.alt='Game-derived World of Warcraft zone map: '+z.name+' (external media from TheWoWDB)';
 $('nx221MapSurface').hidden=false;image.hidden=false;$('nx221MapFailure').hidden=true;
 image.src=imageBase+z.mapId+'.jpg';
 applyZoom();render();
}
function select(id){
 const z=zone(state.id),p=rows(z).find(x=>x.id===id);if(!p)return;
 state.selected=p;
 if(typeof showSelectedOnMap==='function')showSelectedOnMap(p);
 $('nx221SelectedName').textContent=p.title;
 $('nx221SelectedInfo').textContent=p.kind+' · '+p.x.toFixed(1)+', '+p.y.toFixed(1)+
  ' · UI Map '+p.mapId+' · '+p.source+(p.note?' · '+p.note:'');
 $('nx221OpenResearch').href=p.url;
 $('nx221Copy').disabled=false;
 for(const b of viewport.querySelectorAll('[data-point-id]'))b.setAttribute('aria-pressed',String(b.dataset.pointId===id));
 window.dispatchEvent(new CustomEvent('nexus:atlas-pin-selected',{detail:{zoneId:state.id,pointId:id}}));
}
function render(){
 const z=zone(state.id);if(!z)return;
 const visible=filtered(z),list=$('nx221PlacesList'),pins=$('nx221PinLayer');
 list.replaceChildren();pins.replaceChildren();
 $('nx221Count').textContent=visible.length+' LOCATIONS';
 const kinds=$('nx221Types');kinds.replaceChildren();
 for(const k of ['all','Dungeon','Raid','Delve','Flight','Landmark','Quest','Personal']){
  if(k!=='all'&&!rows(z).some(p=>p.kind===k))continue;
  const b=el('button','nx221-type',k==='all'?'ALL':k.toUpperCase());b.type='button';
  b.setAttribute('aria-pressed',String(state.filter===k));
  b.addEventListener('click',()=>{state.filter=k;render()});kinds.append(b);
 }
 for(const p of visible){
  const pin=el('button','nx221-map-pin',glyphs[p.kind]||'●');pin.type='button';
  pin.style.left=p.x+'%';pin.style.top=p.y+'%';pin.dataset.kind=p.kind;
  pin.dataset.pointId=p.id;pin.title=p.title+' · '+p.x+', '+p.y;
  pin.setAttribute('aria-label',p.title+' · '+p.x+', '+p.y);
  pin.addEventListener('click',()=>select(p.id));pins.append(pin);
  const b=el('button','nx221-place');b.type='button';b.dataset.pointId=p.id;
  b.append(el('span','nx221-place-icon',glyphs[p.kind]||'●'));
  const copy=el('span','nx221-place-copy');
  copy.append(el('strong','',p.title),el('small','',p.kind+' · '+p.x.toFixed(1)+', '+p.y.toFixed(1)));
  b.append(copy);b.addEventListener('click',()=>select(p.id));list.append(b);
 }
 if(!visible.length)list.append(el('p','nx221-no-results','No matching markers in the curated selection. Open the full source for more locations.'));
 if(state.selected&&visible.some(p=>p.id===state.selected.id))select(state.selected.id);
}
function applyZoom(){
 const viewport=$('nx221MapViewport');
 const maxX=viewport.clientWidth*(state.zoom-1)/2,maxY=viewport.clientHeight*(state.zoom-1)/2;
 state.panX=Math.min(maxX,Math.max(-maxX,state.panX));
 state.panY=Math.min(maxY,Math.max(-maxY,state.panY));
 $('nx221MapSurface').style.transform='translate('+state.panX+'px,'+state.panY+'px) scale('+state.zoom+')';
 viewport.classList.toggle('nx221-pannable',state.zoom>1);
 $('nx221ZoomOut').disabled=state.zoom<=1;$('nx221ZoomIn').disabled=state.zoom>=2.5;
}
$('nx221ZoomIn').addEventListener('click',()=>{state.zoom=Math.min(2.5,state.zoom+.25);applyZoom()});
$('nx221ZoomOut').addEventListener('click',()=>{state.zoom=Math.max(1,state.zoom-.25);applyZoom()});
$('nx221Reset').addEventListener('click',()=>{state.zoom=1;applyZoom()});
const viewport=$('nx221MapViewport');
let drag=null;
viewport.addEventListener('pointerdown',event=>{
 if(state.zoom<=1||event.target.closest('button'))return;
 drag={id:event.pointerId,x:event.clientX,y:event.clientY,baseX:state.panX,baseY:state.panY};
 viewport.setPointerCapture(event.pointerId);
});
viewport.addEventListener('pointermove',event=>{
 if(!drag||drag.id!==event.pointerId)return;
 state.panX=drag.baseX+(event.clientX-drag.x);
 state.panY=drag.baseY+(event.clientY-drag.y);
 applyZoom();
});
const stop=event=>{
 if(drag?.id!==event.pointerId)return;
 drag=null;
 if(viewport.hasPointerCapture(event.pointerId))viewport.releasePointerCapture(event.pointerId);
};
viewport.addEventListener('pointerup',stop);
viewport.addEventListener('pointercancel',stop);

// v23.0.1 — iOS-safe fullscreen: portal the viewport to <body> so the site shell
// cannot clip fixed controls, and always provide selection feedback ON the map.
const fullscreen=el('button','nx230-fullscreen','FULLSCREEN');fullscreen.type='button';
fullscreen.title='Expand or exit the map';fullscreen.setAttribute('aria-pressed','false');
$('nx221Reset').after(fullscreen);
const mapHome=viewport.parentNode,mapFollowing=viewport.nextSibling;
const toolbar=el('div','nx230-map-toolbar');
const toolbarTitle=el('span','nx230-map-toolbar-title','WORLD MAP');
const closeMap=el('button','nx230-map-close','✕  EXIT MAP');closeMap.type='button';
closeMap.setAttribute('aria-label','Close fullscreen map');
toolbar.append(toolbarTitle,closeMap);
const selection=el('section','nx230-map-selection');
selection.setAttribute('role','status');selection.setAttribute('aria-live','polite');
selection.hidden=true;
const selectionName=el('strong','', 'Selected location');
const selectionInfo=el('span','', '');
const selectionActions=el('div','nx230-map-selection-actions');
const detailsBtn=el('button','', 'VIEW DESTINATION DETAILS');detailsBtn.type='button';
const quickCopy=el('button','', 'COPY GAME PIN');quickCopy.type='button';
selectionActions.append(detailsBtn,quickCopy);
selection.append(selectionName,selectionInfo,selectionActions);
viewport.append(toolbar,selection);
let full=false,previousFocus=null;
function showSelectedOnMap(p){
 if(!p)return;
 selectionName.textContent=p.title;
 selectionInfo.textContent=p.kind+' · X '+p.x.toFixed(1)+' / Y '+p.y.toFixed(1)+' · UI Map '+p.mapId;
 selection.hidden=false;
}
function setFull(next){
 if(full===!!next)return;
 full=!!next;
 if(full){
  previousFocus=document.activeElement;
  document.body.append(viewport); // Portaling avoids ancestor overflow/transform bugs in iOS WebKit.
  document.documentElement.classList.add('nx230-map-open');
  toolbarTitle.textContent=zone(state.id)?.name||'WORLD MAP';
  if(state.selected)showSelectedOnMap(state.selected);
  viewport.classList.add('nx230-map-fullscreen');
  closeMap.focus({preventScroll:true});
 }else{
  viewport.classList.remove('nx230-map-fullscreen');
  document.documentElement.classList.remove('nx230-map-open');
  if(mapFollowing&&mapFollowing.parentNode===mapHome)mapHome.insertBefore(viewport,mapFollowing);
  else mapHome.append(viewport);
  if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});
  previousFocus=null;
 }
 fullscreen.textContent=full?'EXIT FULLSCREEN':'FULLSCREEN';
 fullscreen.setAttribute('aria-pressed',String(full));
 drag=null;touches.clear();pinchStart=null;
 applyZoom();
}
fullscreen.addEventListener('click',()=>setFull(!full));
closeMap.addEventListener('click',()=>setFull(false));
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&full){e.preventDefault();setFull(false)}});
window.addEventListener('pagehide',()=>{if(full)setFull(false)});
detailsBtn.addEventListener('click',()=>{
 setFull(false);
 const card=$('nx230Detail')&&!$('nx230Detail').hidden?$('nx230Detail'):$('nx221Selected');
 $('nx221Selected').hidden=false;
 if(card)card.scrollIntoView({block:'center',behavior:'smooth'});
});
quickCopy.addEventListener('click',()=>{$('nx221Copy')?.click()});
// Keep a readable selection response in fullscreen even when the map's sidebar is hidden.
viewport.addEventListener('click',e=>{
 const pin=e.target.closest('button[data-point-id]');
 if(!pin)return;
 const point=rows(zone(state.id)).find(p=>p.id===pin.dataset.pointId);
 if(point)showSelectedOnMap(point);
});
const touches=new Map();let pinchStart=null;
viewport.addEventListener('pointerdown',e=>{
 if(e.pointerType==='mouse'||e.target.closest('button'))return;
 touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(touches.size===2){
  const pts=[...touches.values()],dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
  pinchStart={dist:Math.max(1,dist),zoom:state.zoom};
  drag=null;
 }
});
viewport.addEventListener('pointermove',e=>{
 if(!touches.has(e.pointerId))return;
 touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(touches.size!==2||!pinchStart)return;
 const pts=[...touches.values()],dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);
 state.zoom=Math.max(1,Math.min(2.5,pinchStart.zoom*dist/pinchStart.dist));applyZoom();
},{passive:true});
const endTouch=e=>{touches.delete(e.pointerId);if(touches.size<2)pinchStart=null};
viewport.addEventListener('pointerup',endTouch);
viewport.addEventListener('pointercancel',endTouch);

$('nx221Search').addEventListener('input',e=>{if(window.NexusAtlasV23)return;state.query=e.target.value.trim().toLowerCase().slice(0,80);render()});
async function copy(value){
 if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(value);return true}
 const ta=el('textarea');ta.value=value;ta.style.cssText='position:fixed;left:-9999px;opacity:0';
 document.body.append(ta);ta.select();const ok=document.execCommand('copy');ta.remove();return ok;
}
$('nx221Copy').addEventListener('click',async()=>{
 const p=state.selected;if(!p)return;
 const macro='/run local m='+p.mapId+' if C_Map.CanSetUserWaypointOnMap(m) then C_Map.SetUserWaypoint(UiMapPoint.CreateFromCoordinates(m,'+
  (p.x/100).toFixed(4)+','+(p.y/100).toFixed(4)+')) end';
 const b=$('nx221Copy');
 try{if(!await copy(macro))throw Error('blocked');b.textContent='COPIED ✓';setTimeout(()=>b.textContent='COPY GAME PIN',1500)}
 catch(_){b.textContent='CLIPBOARD BLOCKED';setTimeout(()=>b.textContent='COPY GAME PIN',1800)}
});
window.addEventListener('storage',event=>{
 if(event.key===core.KEYS.waypoints){state.own=readOwn();render()}
});
window.addEventListener('pageshow',()=>{state.own=readOwn();render()});
window.addEventListener('nexus:waypoints-changed',()=>{state.own=readOwn();render()});

// A read-only discovery bridge for the shared Atlas sidebar. Never exposes or mutates saved data.
window.NexusRealMapDiscoveryV223=Object.freeze({
 catalog:maps.map(m=>({id:m.id,name:m.name,mapId:m.mapId,era:m.era,source:m.source,
  points:m.points.map((p,i)=>({id:'catalog-'+i,title:p[0],kind:p[1],x:p[2],y:p[3]}))})),
 current:()=>state.id,
 open:(id,pointId)=>{
  if(!zone(id))return false;
  if(state.id!==id)show(id);
  else {state.query='';state.filter='all';if(!window.NexusAtlasV23)$('nx221Search').value='';render()}
  if(pointId&&rows(zone(id)).some(p=>p.id===pointId)){select(pointId);return true}
  return true;
 },
 reset:()=>{state.query='';state.filter='all';$('nx221Search').value='';render()}
});
state.own=readOwn();show(state.id);
})();