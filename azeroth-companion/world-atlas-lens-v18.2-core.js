/* NEXUS | AZEROTH v18.2 — CARTOGRAPHER'S LENS (pure read-only atlas intelligence)
 * Research prompts are editorial planning suggestions, not verified in-game quest,
 * item, transport, NPC, coordinate, dungeon or character state.
 * No network, storage, credentials, timers, DOM or external map tiles.
 */
(()=>{'use strict';
const regions={
 'eastern-kingdoms':{title:'KINGDOMS OF THE EAST',motto:'Cities, heritage and storied roads',terrain:'citadels',tone:'gold',symbol:'♜',intro:'A curated gateway to city research, character preparation and classic-era exploration.',focus:['Capital city research','Equipment goals','Legacy collections']},
 'kalimdor':{title:'THE WESTERN EXPANSE',motto:'Wild frontiers and ancient groves',terrain:'woodland',tone:'jade',symbol:'✧',intro:'Organize outdoor exploration, personal gathering goals and major city research in western Azeroth.',focus:['Outdoor exploration','City research','Collection planning']},
 'northrend':{title:'THE FROZEN NORTH',motto:'Icebound summits and old strongholds',terrain:'frost',tone:'cyan',symbol:'❄',intro:'Track your own legacy research ideas, northern landmarks and preparation objectives.',focus:['Legacy raid research','Northern landmarks','Personal checklists']},
 'pandaria':{title:'THE SOUTHERN REALMS',motto:'Misty forests and imperial valleys',terrain:'mist',tone:'jade',symbol:'❋',intro:'A quieter field chart for landscape research, collecting and long-term personal goals.',focus:['Exploration plans','Collection research','Destination study']},
 'broken-isles':{title:'THE SHATTERED SHORES',motto:'Arcane hubs and overgrown ruins',terrain:'arcane',tone:'violet',symbol:'✦',intro:'Gather Legion-era travel research, city-hub ideas and legacy exploration objectives.',focus:['Hub preparation','Legacy research','Collection tracking']},
 'dragon-isles':{title:'ISLES OF THE DRAGONS',motto:'Primal shores and soaring peaks',terrain:'volcanic',tone:'ember',symbol:'◆',intro:'Keep your own research about the Dragon Isles organized by named destination and mission.',focus:['Destination research','Personal adventure routes','Character preparation']},
 'khaz-algar':{title:'THE WORLD BENEATH',motto:'Isles, caverns and distant light',terrain:'underground',tone:'cyan',symbol:'◈',intro:'Plan exploration across curated Khaz Algar areas without claiming a real dungeon map or travel path.',focus:['Cavern research','Dungeon preparation','Expedition planning']},
 'outland':{title:'BEYOND AZEROTH',motto:'Shattered horizons and ancient portals',terrain:'cosmic',tone:'violet',symbol:'✧',intro:'A separate research folio for Outland hubs, landscapes and past-expansion objectives.',focus:['Outland landmarks','Legacy collections','Hub research']}
};
const notes={
 'stormwind-city':['Urban research','Review saved character goals','Prepare equipment objectives'],
 'ironforge':['City landmark','Check personal item targets','Record hub research notes'],
 'stranglethorn-vale':['Outdoor landscape','Plan exploration objectives','Organize collection targets'],
 'silvermoon-city':['City landmark','Review faction research questions','Create a city mission'],
 'orgrimmar':['Urban research','Review saved character goals','Prepare equipment objectives'],
 'durotar':['Outdoor landscape','List exploration ideas','Create a field route'],
 'ashenvale':['Woodland research','Plan collection objectives','Record places to revisit'],
 'mount-hyjal':['Mountain landmark','Review legacy goals','Prepare a research checklist'],
 'icecrown':['Northern landmark','Review legacy raid prep','Connect an equipment goal'],
 'dalaran-northrend':['Research hub','Review saved character notes','Link a planning session'],
 'storm-peaks':['Mountain landscape','Explore legacy objectives','Record research notes'],
 'jade-forest':['Forest landscape','Plan exploration objectives','Track collection plans'],
 'vale-eternal-blossoms':['Regional landscape','Review historic research','Save a personal route'],
 'dalaran-broken-isles':['Research hub','Review Legion-era questions','Organize personal preparations'],
 'suramar':['City and world research','Review legacy faction ideas','Create an expedition goal'],
 'valsharah':['Forest landscape','Plan collection research','Add a personal route stop'],
 'valdrakken':['Research hub','Link character preparation','Review research missions'],
 'waking-shores':['Coastal landscape','Plan exploration goals','Create an itinerary stop'],
 'azure-span':['Regional landscape','Review collecting goals','Record field observations'],
 'isle-of-dorn':['Island landscape','Organize regional research','Create an expedition stop'],
 'ringing-deeps':['Underground landscape','Prepare dungeon research','Review personal goals'],
 'hallowfall':['Regional landscape','Record field research','Prepare adventure goals'],
 'azj-kahet':['Underground landscape','Prepare dungeon research','Organize collection goals'],
 'shattrath-city':['Outland hub','Review legacy research','Link a character plan'],
 'hellfire-peninsula':['Outland landscape','Plan exploration research','Record mission objectives']
};
const clean=(s,max=130)=>typeof s==='string'?s.trim().slice(0,max):'';
const region=id=>regions[id]||null;
const zoneNote=id=>Array.isArray(notes[id])?notes[id].slice():['Research destination','Personal planning','Manual mission tracking'];
const safeRoutes=raw=>{
 const routes=Array.isArray(raw?.routes)?raw.routes.slice(0,6):[];
 return routes.filter(r=>r&&typeof r==='object'&&Array.isArray(r.stops)).map(r=>({
  id:clean(r.id,85),title:clean(r.title,70),stops:r.stops.slice(0,12).filter(s=>s&&typeof s.zoneId==='string')
 }));
};
function index(goals,bookmarks,routeState,session){
 const goalsByZone=new Map(),routeByZone=new Map();
 for(const goal of (Array.isArray(goals)?goals:[]).slice(0,120)){
  if(!goal||typeof goal.zoneId!=='string')continue;
  if(!goalsByZone.has(goal.zoneId))goalsByZone.set(goal.zoneId,[]);
  goalsByZone.get(goal.zoneId).push(goal);
 }
 for(const r of safeRoutes(routeState)){
  r.stops.forEach((s,i)=>{
   if(!routeByZone.has(s.zoneId))routeByZone.set(s.zoneId,[]);
   routeByZone.get(s.zoneId).push({routeId:r.id,name:r.title,position:i+1});
  });
 }
 const saved=new Set(Array.isArray(bookmarks)?bookmarks.filter(s=>typeof s==='string').slice(0,45):[]);
 const sessionIds=new Set(Array.isArray(session?.entries)?session.entries.slice(0,18).map(e=>e?.id).filter(s=>typeof s==='string'):[]);
 return Object.freeze({goalsByZone,routeByZone,saved,sessionIds});
}
function zoneSummary(zone,indexed){
 const own=indexed.goalsByZone.get(zone?.id)||[];
 return {id:zone?.id||'',name:zone?.name||'',kind:zone?.kind||'Zone',
  regionId:zone?.regionId||'',description:clean(zone?.description,140),
  saved:indexed.saved.has(zone?.id),goals:own.length,
  active:own.filter(g=>g.status==='active').length,
  planned:own.filter(g=>g.status==='planned').length,
  completed:own.filter(g=>g.status==='completed').length,
  routes:indexed.routeByZone.get(zone?.id)||[],
  inSession:own.some(g=>indexed.sessionIds.has(g.id)),
  suggestions:zoneNote(zone?.id)};
}
function regionSummary(reg,zones,indexed){
 const subset=(Array.isArray(zones)?zones:[]).filter(z=>z.regionId===reg?.id);
 const rows=subset.map(z=>zoneSummary(z,indexed));
 return {id:reg?.id||'',name:reg?.name||'',total:rows.length,
  goals:rows.reduce((a,x)=>a+x.goals,0),
  bookmarks:rows.filter(x=>x.saved).length,
  active:rows.reduce((a,x)=>a+x.active,0),
  routes:rows.filter(x=>x.routes.length>0).length,
  rows};
}
function sortZones(zones,indexed,sort='editorial'){
 const rows=(Array.isArray(zones)?zones:[]).map(z=>zoneSummary(z,indexed));
 if(sort==='missions')return rows.sort((a,b)=>b.active-a.active||b.goals-a.goals||a.name.localeCompare(b.name));
 if(sort==='saved')return rows.sort((a,b)=>Number(b.saved)-Number(a.saved)||b.routes.length-a.routes.length||a.name.localeCompare(b.name));
 return rows;
}
function spotlight(zone,indexed,goals){
 const summary=zoneSummary(zone,indexed);
 const own=indexed.goalsByZone.get(zone?.id)||[];
 const next=own.find(x=>x.status==='active')||own.find(x=>x.status==='planned')||null;
 return {...summary,next:next?{id:next.id,title:clean(next.title,110),status:next.status,
   category:clean(next.category,40)}:null,hasPersonalRecords:own.length>0};
}
function performanceCounts(zones,indexed){
 const total=(Array.isArray(zones)?zones:[]).reduce((t,z)=>t+(indexed.goalsByZone.get(z.id)?.length||0),0);
 return {curated:(Array.isArray(zones)?zones:[]).length,manualMissions:total,bookmarks:indexed.saved.size,
   routeDestinations:indexed.routeByZone.size};
}
window.NexusAtlasLensV182=Object.freeze({regions,notes,clean,region,zoneNote,safeRoutes,index,zoneSummary,regionSummary,sortZones,spotlight,performanceCounts});
})();