/* NEXUS | AZEROTH v22 — LIVING INTELLIGENCE CORE
 * All three domains are bounded and provenance-labeled: player-provided zone
 * map coordinates; explicitly captured public Blizzard API research snapshots;
 * manually generated adventure preparation plans. No fetch, DOM or storage.
 */
(()=>{'use strict';
const VERSION='22.0.0';
const KEYS=Object.freeze({
 waypoints:'nexus_atlas_waypoints_v22',
 research:'nexus_character_research_snapshots_v22',
 director:'nexus_living_director_v22'
});
const WAYPOINT_FORMAT='nexus.atlas-waypoints/1',DIRECTOR_FORMAT='nexus.director/1';
const ZONES=Object.freeze([
 ['stormwind-city','Stormwind City','eastern-kingdoms'],['ironforge','Ironforge','eastern-kingdoms'],
 ['stranglethorn-vale','Stranglethorn Vale','eastern-kingdoms'],['silvermoon-city','Silvermoon City','eastern-kingdoms'],
 ['orgrimmar','Orgrimmar','kalimdor'],['durotar','Durotar','kalimdor'],['ashenvale','Ashenvale','kalimdor'],['mount-hyjal','Mount Hyjal','kalimdor'],
 ['icecrown','Icecrown','northrend'],['dalaran-northrend','Dalaran (Northrend)','northrend'],['storm-peaks','The Storm Peaks','northrend'],
 ['jade-forest','The Jade Forest','pandaria'],['vale-eternal-blossoms','Vale of Eternal Blossoms','pandaria'],
 ['dalaran-broken-isles','Dalaran (Broken Isles)','broken-isles'],['suramar','Suramar','broken-isles'],['valsharah',"Val'sharah",'broken-isles'],
 ['valdrakken','Valdrakken','dragon-isles'],['waking-shores','The Waking Shores','dragon-isles'],['azure-span','The Azure Span','dragon-isles'],
 ['isle-of-dorn','Isle of Dorn','khaz-algar'],['ringing-deeps','The Ringing Deeps','khaz-algar'],['hallowfall','Hallowfall','khaz-algar'],
 ['azj-kahet','Azj-Kahet','khaz-algar'],['shattrath-city','Shattrath City','outland'],['hellfire-peninsula','Hellfire Peninsula','outland']
].map(([id,name,region])=>Object.freeze({id,name,region})));
const zoneMap=new Map(ZONES.map(x=>[x.id,x]));
/* Curated reference IDs from WoW map-ID research, not generated from art.
 * Map ID and coordinates refer to an IN-GAME ZONE MAP, never the artistic
 * continent illustration above. Game patches can change these references.
 */
const mapIDs=Object.freeze({
 'hallowfall':2215,'azj-kahet':2255,'ringing-deeps':2214,'isle-of-dorn':2248,
 'valdrakken':2112,'waking-shores':2022,'azure-span':2024
});
const obj=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const text=(v,n=120)=>typeof v==='string'?v.trim().slice(0,n):'';
const localName=(v,n=120)=>{if(typeof v==='string')return text(v,n);if(!obj(v))return '';return text(v.en_US||v.en_GB||Object.values(v).find(x=>typeof x==='string'),n)};
const array=(v,n=150)=>Array.isArray(v)?v.slice(0,n):[];
const coord=v=>typeof v==='number'||typeof v==='string'&&v.trim()!==''?Number(v):NaN;
const percent=v=>{const n=coord(v);return Number.isFinite(n)&&n>=0&&n<=100?Math.round(n*100)/100:null};
const mapId=v=>{const n=coord(v);return Number.isSafeInteger(n)&&n>=1&&n<=99999?n:null};
const idOK=id=>typeof id==='string'&&/^[a-z0-9-]{8,90}$/i.test(id);
const newId=()=>{try{return 'nx22-'+crypto.randomUUID()}catch(_){return 'nx22-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12)}};
const types=Object.freeze(['Landmark','Activity','Collectible','Dungeon','Raid','Custom']);
function waypoint(raw){
 if(!obj(raw)||!idOK(raw.id)||!zoneMap.has(raw.zoneId))return null;
 const x=percent(raw.x),y=percent(raw.y),m=mapId(raw.mapId),title=text(raw.title,88);
 if(x===null||y===null||!m||!title)return null;
 return {id:raw.id,zoneId:raw.zoneId,mapId:m,x,y,title,
  kind:types.includes(raw.kind)?raw.kind:'Custom',
  note:text(raw.note,320),createdAt:text(raw.createdAt,40)};
}
function cleanWaypoints(raw){
 const arr=Array.isArray(raw)?raw:array(raw?.waypoints,180),seen=new Set(),out=[];
 for(const v of arr){const row=waypoint(v);if(!row||seen.has(row.id))continue;seen.add(row.id);out.push(row);if(out.length>=160)break}
 return out;
}
function addWaypoint(rows,draft){
 const list=cleanWaypoints(rows);if(list.length>=160)throw Error('Coordinate notebook reached 160 saved pins.');
 const row=waypoint({...draft,id:newId(),createdAt:new Date().toISOString()});
 if(!row)throw Error('Enter a mapped zone, valid zone UI Map ID, label and X/Y from 0 to 100.');
 return [row,...list];
}
function removeWaypoint(rows,id){return cleanWaypoints(rows).filter(v=>v.id!==id)}
function gameWaypointMacro(raw){
 const p=waypoint(raw);
 if(!p)throw Error('Waypoint needs a valid zone UI Map ID and 0–100 coordinates.');
 // User copies and pastes IN GAME. No remote client control or automation.
 const m=p.mapId,x=(p.x/100).toFixed(4),y=(p.y/100).toFixed(4);
 return '/run local m='+m+' if C_Map.CanSetUserWaypointOnMap(m) then C_Map.SetUserWaypoint(UiMapPoint.CreateFromCoordinates(m,'+x+','+y+')) else print("Map cannot accept a waypoint") end';
}
function normalizeResearch(raw){
 if(!obj(raw)||!obj(raw.selector))return null;
 const s=raw.selector;
 const region=text(s.region,5).toLowerCase(),realm=text(s.realm,80).toLowerCase(),name=text(s.name,50).toLowerCase();
 if(!['us','eu','kr','tw'].includes(region)||!/^[a-z0-9-]{2,80}$/.test(realm)||!/^[a-z0-9-]{2,50}$/.test(name))return null;
 const p=obj(raw.profile)?raw.profile:{};
 const lv=Number(p.level),ilvl=Number(p.equipped_item_level);
 const items=array(raw.items,40).filter(obj).map(item=>({
  slot:text(item.slotKey||item.slot,50).toUpperCase(),
  name:text(item.name,100)||'Unnamed reported item',
  id:Number.isSafeInteger(Number(item.id))&&Number(item.id)>0?Number(item.id):null,
  level:Number.isFinite(Number(item.level))&&Number(item.level)>0&&Number(item.level)<2000?Number(item.level):null
 })).filter(item=>item.slot);
 const ts=Number.isFinite(Date.parse(raw.fetchedAt))?new Date(raw.fetchedAt).toISOString():null;
 if(!ts)return null;
 return {
  selector:{region,realm,name},
  character:{name:text(p.name,50)||name,realm:text(p.realm?.name,80)||realm,
   className:localName(p.character_class?.name,60)||localName(p.playable_class?.name,60)||'Unreported',
   spec:localName(p.active_spec?.name,65)||'Unreported',
   level:Number.isInteger(lv)&&lv>0&&lv<200?lv:null,
   equippedItemLevel:Number.isInteger(ilvl)&&ilvl>0&&ilvl<2000?ilvl:null},
  items, fetchedAt:ts,source:'blizzard-public-api-via-nexus',verifiedAtFetch:true
 };
}
function normalizeStoredResearch(raw){
 // Stored data is already normalized; ensure only bounded public-report fields
 if(!obj(raw)||raw.source!=='blizzard-public-api-via-nexus'||!obj(raw.selector)||!obj(raw.character))return null;
 const o=normalizeResearch({
  selector:raw.selector,
  profile:{...raw.character,name:raw.character.name,
   realm:{name:raw.character.realm},character_class:{name:raw.character.className},
   active_spec:{name:raw.character.spec},level:raw.character.level,
   equipped_item_level:raw.character.equippedItemLevel},
  items:raw.items,fetchedAt:raw.fetchedAt
 });
 return o;
}
function cleanResearch(raw){
 const out=[],seen=new Set();
 for(const r of array(raw,20)){
  const p=normalizeStoredResearch(r);if(!p)continue;
  const key=[p.selector.region,p.selector.realm,p.selector.name].join('/');
  if(seen.has(key))continue;
  seen.add(key);out.push(p);if(out.length>=12)break;
 }
 return out.sort((a,b)=>b.fetchedAt.localeCompare(a.fetchedAt));
}
function upsertResearch(rows,report){
 const item=normalizeResearch(report);
 if(!item)throw Error('A valid Blizzard API character and equipment result must be loaded first.');
 const key=r=>[r.selector.region,r.selector.realm,r.selector.name].join('/');
 return cleanResearch([item,...cleanResearch(rows).filter(x=>key(x)!==key(item))]);
}
function slotSummary(report){
 const r=normalizeStoredResearch(report);if(!r)return null;
 const levels=r.items.map(x=>x.level).filter(x=>x!==null),slots=new Set(r.items.map(x=>x.slot));
 return {reportedSlots:slots.size,items:r.items.length,
  reportedLevelCount:levels.length,reportedMin:levels.length?Math.min(...levels):null,
  reportedMax:levels.length?Math.max(...levels):null,
  reportedAverage:levels.length?Math.round(levels.reduce((a,b)=>a+b,0)/levels.length):null,
  reportedEquippedItemLevel:r.character.equippedItemLevel,
  source:r.source,fetchedAt:r.fetchedAt};
}
const modes=Object.freeze(['balanced','exploration','equipment','collecting']);
function normalDirector(raw){
 const state=obj(raw)?raw:{};
 const budget=Number(state.budget);
 const rawChecks=obj(state.checks)?state.checks:{};
 const checks={};
 for(const [id,done] of Object.entries(rawChecks).slice(0,100))if(idOK(id)&&done===true)checks[id]=true;
 return {format:DIRECTOR_FORMAT,focus:text(state.focus,150),
  mode:modes.includes(state.mode)?state.mode:'balanced',
  budget:Number.isInteger(budget)&&budget>=15&&budget<=240?budget:90,
  checks};
}
const goalTypes=Object.freeze({
 exploration:['Explore','Other'],equipment:['Equipment research','Build prep'],collecting:['Collection']
});
function plan(raw){
 const input=obj(raw)?raw:{},state=normalDirector(input.settings);
 const goals=array(input.goals,160).filter(obj)
 .filter(g=>g.status==='planned'||g.status==='active')
 .filter(g=>idOK(g.id)&&zoneMap.has(g.zoneId)&&text(g.title,110))
 .filter(g=>!state.focus||!g.charId||g.charId===state.focus);
 const scheduled=array(input.operations?.entries,18).filter(obj);
 const sessionMinutes=new Map(scheduled.filter(e=>idOK(e.id)).map(e=>[e.id,Math.max(0,Math.min(240,Number(e.minutes)||0))]));
 const scored=goals.map(g=>{
  const priority=(g.status==='active'?8:0)+(sessionMinutes.has(g.id)?6:0);
  const type=state.mode==='balanced'?3:goalTypes[state.mode]?.includes(g.category)?7:0;
  const record=!!(input.waypoints||[]).find(w=>w.zoneId===g.zoneId)?3:0;
  return {g,rank:priority+type+record};
 }).sort((a,b)=>b.rank-a.rank||String(a.g.title).localeCompare(String(b.g.title)));
 const steps=[],max=9;let minutesUsed=0;
 // Follow user's own goals; suggested estimates are NOT gameplay route metrics.
 for(const row of scored){
  if(steps.length>=max)break;
  const g=row.g,estimated=sessionMinutes.get(g.id)|| (g.status==='active'?25:30);
  if(steps.length&&minutesUsed+estimated>state.budget)continue;
  const minutes=Math.min(estimated,Math.max(5,state.budget-minutesUsed));
  const label=text(g.title,100),id='goal-'+g.id;
  steps.push({id,title:label,zoneId:g.zoneId,
   kind:'goal',minutes,source:'manual-atlas',status:g.status,
   href:'./world-atlas.html?zone='+encodeURIComponent(g.zoneId),
   detail:'User-saved '+text(g.category,50).toLowerCase()+' objective; time is an estimate, not travel duration.'});
  minutesUsed+=minutes;
 }
 if(!steps.length){
  steps.push({id:'guide-atlas',title:'Choose a research destination',
   zoneId:'',kind:'guide',minutes:15,source:'curated-suggestion',status:'suggested',
   href:'./world-atlas.html',detail:'Browse the World Atlas and save a manual objective to create a personalized itinerary.'});
  minutesUsed=15;
 }
 const prep=[];
 if(input.research)prep.push({id:'prep-gear',title:'Review captured equipped-gear snapshot',href:'./character-intelligence.html',
  source:'Blizzard public API snapshot',detail:'Snapshot captured '+input.research.fetchedAt+'. It may be outdated; no item ownership is assumed after this fetch.'});
 else prep.push({id:'prep-gear',title:'Research your character equipment',href:'./character-intelligence.html',
  source:'optional public API research',detail:'Public Blizzard profile/equipment reports may be unavailable or stale.'});
 prep.push({id:'prep-build',title:'Review Talent Forge plans',href:'./?enter=1&view=talents',
  source:'manual',detail:'Choose a build for this activity; NEXUS does not validate actual in-game allocation.'});
 prep.push({id:'prep-notes',title:'Check Adventure Operations',href:'./adventure-operations.html',
  source:'manual',detail:'Review your saved notes and preparation checklist for this session.'});
 return {mode:state.mode,budget:state.budget,estimatedMinutes:minutesUsed,
  scheduled:steps,preparation:prep,complete:steps.filter(s=>state.checks[s.id]).length,
  source:'manual planning + explicitly captured, time-stamped optional Blizzard research',
  disclaimer:'Plans, times, equipment relevance and objective completion are user planning aids, not live WoW state or route travel metrics.'};
}
const API=Object.freeze({VERSION,KEYS,WAYPOINT_FORMAT,DIRECTOR_FORMAT,ZONES,zoneMap,mapIDs,
 text,percent,mapId,waypoint,cleanWaypoints,addWaypoint,removeWaypoint,gameWaypointMacro,
 normalizeResearch,normalizeStoredResearch,cleanResearch,upsertResearch,slotSummary,
 normalDirector,plan,newId});
Object.defineProperty(window,'NexusLivingIntelligenceV22',{value:API,writable:false,configurable:false});
})();