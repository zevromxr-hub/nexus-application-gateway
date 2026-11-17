/* NEXUS | AZEROTH v18.1 — ATLAS EXPEDITION ROUTES (pure manual route plans)
 * No travel time, pathfinding, live character data or Blizzard coordinates.
 * All location IDs are read from the existing bounded v16 World Atlas directory.
 */
(()=>{'use strict';
const KEY='nexus_atlas_routes_v181',FORMAT='nexus.atlas-routes/1';
const clean=(v,n=80)=>typeof v==='string'?v.trim().slice(0,n):'';
const validId=v=>typeof v==='string'&&/^[a-z0-9-]{6,85}$/i.test(v);
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const world=()=>window.NexusWorldEngineCoreV16;
const zone=id=>world()?.zoneById(id)||null;
const makeId=()=>{try{return 'route-'+crypto.randomUUID()}catch(_){return 'route-'+Date.now()+'-'+Math.random().toString(36).slice(2,11)}};
const time=()=>new Date().toISOString();
function normalizeStop(value){
 if(!obj(value)||!zone(value.zoneId))return null;
 return {zoneId:value.zoneId,note:clean(value.note,200),done:value.done===true};
}
function normalizeRoute(value){
 if(!obj(value)||!validId(value.id))return null;
 const stops=[],seen=new Set();
 for(const raw of (Array.isArray(value.stops)?value.stops:[]).slice(0,60)){
  const stop=normalizeStop(raw);
  if(stop&&!seen.has(stop.zoneId)){seen.add(stop.zoneId);stops.push(stop)}
  if(stops.length>=12)break;
 }
 return {id:value.id,title:clean(value.title,70)||'New Expedition Route',
   notes:clean(value.notes,500),updatedAt:clean(value.updatedAt,35),stops};
}
function normalize(value){
 const source=obj(value)?value:{},routes=[],seen=new Set();
 for(const raw of (Array.isArray(source.routes)?source.routes:[]).slice(0,30)){
  const route=normalizeRoute(raw);if(!route||seen.has(route.id))continue;
  seen.add(route.id);routes.push(route);if(routes.length>=6)break;
 }
 const selected=routes.some(r=>r.id===source.selected)?source.selected:routes[0]?.id||'';
 return {format:FORMAT,selected,routes};
}
const blank=()=>({format:FORMAT,selected:'',routes:[]});
function addRoute(state,title){
 const s=normalize(state);if(s.routes.length>=6)return s;
 const route={id:makeId(),title:clean(title,70)||'New Expedition Route',notes:'',updatedAt:time(),stops:[]};
 return {...s,selected:route.id,routes:[...s.routes,route]};
}
function removeRoute(state,id){
 const s=normalize(state),routes=s.routes.filter(r=>r.id!==id);
 return {...s,routes,selected:routes.some(r=>r.id===s.selected)?s.selected:routes[0]?.id||''};
}
function choose(state,id){const s=normalize(state);return s.routes.some(r=>r.id===id)?{...s,selected:id}:s}
function change(state,id,patch){
 const s=normalize(state);if(!obj(patch))return s;
 return {...s,routes:s.routes.map(r=>r.id!==id?r:{...r,...('title'in patch?{title:clean(patch.title,70)||r.title}:{}),
   ...('notes'in patch?{notes:clean(patch.notes,500)}:{}),updatedAt:time()})};
}
function push(state,id,zoneId){
 const s=normalize(state);if(!zone(zoneId))return s;
 return {...s,routes:s.routes.map(r=>r.id!==id||r.stops.length>=12||r.stops.some(x=>x.zoneId===zoneId)?r:
  {...r,updatedAt:time(),stops:[...r.stops,{zoneId,note:'',done:false}]})};
}
function removeStop(state,id,zoneId){
 const s=normalize(state);return {...s,routes:s.routes.map(r=>r.id!==id?r:
  {...r,updatedAt:time(),stops:r.stops.filter(x=>x.zoneId!==zoneId)})};
}
function modifyStop(state,id,zoneId,patch){
 const s=normalize(state);if(!obj(patch))return s;
 return {...s,routes:s.routes.map(r=>r.id!==id?r:{...r,updatedAt:time(),
   stops:r.stops.map(stop=>stop.zoneId!==zoneId?stop:{
    ...stop,...('note'in patch?{note:clean(patch.note,200)}:{}),
    ...('done'in patch?{done:patch.done===true}:{})})})};
}
function move(state,id,zoneId,delta){
 const s=normalize(state);
 return {...s,routes:s.routes.map(r=>{
  if(r.id!==id)return r;
  const i=r.stops.findIndex(x=>x.zoneId===zoneId),j=i+(delta===-1?-1:delta===1?1:0);
  if(i<0||j<0||j>=r.stops.length||j===i)return r;
  const stops=r.stops.slice();[stops[i],stops[j]]=[stops[j],stops[i]];
  return {...r,updatedAt:time(),stops};
 })};
}
// Grouping by continent is a CONVENIENCE, not a travel/distance optimizer.
function groupByRegion(state,id){
 const s=normalize(state),regions=world()?.regions||[];
 const rank=new Map(regions.map((r,i)=>[r.id,i]));
 return {...s,routes:s.routes.map(r=>r.id!==id?r:{...r,updatedAt:time(),
   stops:r.stops.map((stop,index)=>({...stop,_i:index})).sort((a,b)=>
    (rank.get(zone(a.zoneId)?.regionId)??999)-(rank.get(zone(b.zoneId)?.regionId)??999)||a._i-b._i)
    .map(({_i,...stop})=>stop)})};
}
function summary(route,goals=[]){
 const r=normalizeRoute(route);if(!r)return {stops:0,done:0,regions:0,linked:0,transitions:0};
 const regions=r.stops.map(s=>zone(s.zoneId)?.regionId).filter(Boolean);
 const linked=r.stops.filter(s=>Array.isArray(goals)&&goals.some(g=>g.zoneId===s.zoneId)).length;
 return {stops:r.stops.length,done:r.stops.filter(s=>s.done).length,
  regions:new Set(regions).size,linked,transitions:regions.filter((x,i)=>i>0&&x!==regions[i-1]).length};
}
function exportPayload(state){
 return {format:'nexus.atlas-routes-backup/1',exportedAt:time(),
   source:'Private illustrative location itinerary; not verified gameplay, travel paths, distances or ETA.',
   data:normalize(state)};
}
window.NexusAtlasRoutesV181=Object.freeze({KEY,FORMAT,blank,clean,validId,normalizeStop,normalizeRoute,normalize,
 addRoute,removeRoute,choose,change,push,removeStop,modifyStop,move,groupByRegion,summary,exportPayload});
})();