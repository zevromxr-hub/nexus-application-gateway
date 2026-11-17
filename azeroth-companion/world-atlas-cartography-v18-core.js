/* NEXUS | AZEROTH v18 — CARTOGRAPHY INTELLIGENCE CORE
 * Curated destination positions are artistic labels only, NEVER game map coordinates.
 * Pure browser helper, no storage writes, network, auth, or location tracking.
 */
(()=>{'use strict';
const raw={
 'eastern-kingdoms':[
  ['stormwind-city',64,72],['ironforge',48,50],['stranglethorn-vale',72,88],['silvermoon-city',61,21]],
 'kalimdor':[
  ['orgrimmar',72,42],['durotar',80,51],['ashenvale',40,40],['mount-hyjal',51,19]],
 'northrend':[
  ['icecrown',48,47],['dalaran-northrend',63,66],['storm-peaks',77,39]],
 'pandaria':[
  ['jade-forest',77,58],['vale-eternal-blossoms',49,40]],
 'broken-isles':[
  ['dalaran-broken-isles',51,37],['suramar',68,59],['valsharah',28,61]],
 'dragon-isles':[
  ['valdrakken',50,52],['waking-shores',73,78],['azure-span',31,64]],
 'khaz-algar':[
  ['isle-of-dorn',55,19],['ringing-deeps',43,43],['hallowfall',65,62],['azj-kahet',41,80]],
 'outland':[
  ['shattrath-city',48,54],['hellfire-peninsula',71,29]]
};
const positions=Object.freeze(Object.fromEntries(Object.entries(raw).flatMap(([region,rows])=>
 rows.map(([id,x,y])=>[id,Object.freeze({id,region,x,y})]))));
const filters=Object.freeze(['all','goals','active','planned','completed','bookmarks','session','capital','hub','zone']);
const icons=Object.freeze({Capital:'crown',Hub:'compass',Zone:'mountain'});
const text=(v,n=110)=>typeof v==='string'?v.trim().slice(0,n):'';
function filterValue(v){return filters.includes(v)?v:'all'}
function position(zone){return positions[zone?.id]||null}
function bucket(goals){
 const map=new Map();
 for(const g of (Array.isArray(goals)?goals:[]).slice(0,120)){
  if(!positions[g?.zoneId])continue;
  const b=map.get(g.zoneId)||{total:0,active:0,planned:0,completed:0,ids:[],categories:new Set()};
  b.total++;
  if(['active','planned','completed'].includes(g.status))b[g.status]++;
  if(typeof g.id==='string'&&b.ids.length<120)b.ids.push(g.id);
  if(typeof g.category==='string')b.categories.add(text(g.category,40));
  map.set(g.zoneId,b);
 }
 return map;
}
function visible(zone,{filter='all',goals=[],bookmarks=[],sessionIds=[]}={}){
 if(!zone||!positions[zone.id])return false;
 const f=filterValue(filter),byZone=bucket(goals).get(zone.id),
 liked=Array.isArray(bookmarks)&&bookmarks.includes(zone.id),
 inSession=Array.isArray(sessionIds)&&goals.some(g=>g.zoneId===zone.id&&sessionIds.includes(g.id));
 if(f==='all')return true;
 if(f==='goals')return !!byZone?.total;
 if(f==='bookmarks')return liked;
 if(f==='session')return inSession;
 if(f==='active'||f==='planned'||f==='completed')return !!byZone?.[f];
 return zone.kind.toLowerCase()===f;
}
function snapshot(zone,goals,bookmarks=[],sessionIds=[]){
 const b=bucket(goals).get(zone?.id);
 const related=(Array.isArray(goals)?goals:[]).filter(g=>g.zoneId===zone?.id).slice(0,120);
 const count=s=>related.filter(g=>g.status===s).length;
 return {kind:zone?.kind||'Zone',icon:icons[zone?.kind]||'mountain',
  total:b?.total||0,active:count('active'),planned:count('planned'),completed:count('completed'),
  bookmarked:Array.isArray(bookmarks)&&bookmarks.includes(zone?.id),
  inSession:Array.isArray(sessionIds)&&related.some(g=>sessionIds.includes(g.id)),
  goals:related};
}
function regionSummary(regionId,zones,goals){
 const allowed=(Array.isArray(zones)?zones:[]).filter(z=>z.regionId===regionId);
 const selected=(Array.isArray(goals)?goals:[]).filter(g=>allowed.some(z=>z.id===g.zoneId));
 return {destinations:allowed.length,missions:selected.length,
  active:selected.filter(g=>g.status==='active').length,
  planned:selected.filter(g=>g.status==='planned').length,
  completed:selected.filter(g=>g.status==='completed').length};
}
function privacy(){
 return 'Curated reference chart; pin positions are illustrative, not in-game map coordinates. Missions and readiness are manual browser-local records. No live character tracking or Blizzard map data.';
}
window.NexusAtlasCartographyV18=Object.freeze({positions,filters,icons,text,filterValue,position,bucket,visible,snapshot,regionSummary,privacy});
})();