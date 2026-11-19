/* NEXUS | AZEROTH v21 — SOVEREIGN UNITY CORE
 * Pure, bounded public studio directory and browser-local planning snapshots.
 * Does not call any network, storage, authentication or Blizzard endpoint.
 */
(()=>{'use strict';
const VERSION='21.0.0',KEY='nexus_azeroth_unity_v21';
const DIR=Object.freeze([
 {id:'command',title:'Living Command Center',icon:'✦',group:'Command',href:'./command-center.html',desc:'Your connected entry to character research and local plans',tokens:'home command center launch navigation studios war room overview'},
 {id:'companion',title:'Full Azeroth Companion',icon:'◈',group:'Command',href:'./?enter=1',desc:'Character roster, collections and personal planning tools',tokens:'app overview dashboard character collection builds'},
 {id:'character',title:'Character Nexus',icon:'♟',group:'Character',href:'./player-experience.html',desc:'Profiles, linked builds and clearly sourced research',tokens:'character nexus profile armory equipped gear link'},
 {id:'forge',title:'Talent Forge',icon:'⚔',group:'Character',href:'./?enter=1&view=talents',desc:'Plan talents and compare your saved build choices',tokens:'talent build skill planner specialization points allocation'},
 {id:'builds',title:'Build Architect',icon:'◇',group:'Character',href:'./?enter=1&view=builds',desc:'Keep personal build references and notes',tokens:'build architect draft loadout talent'},
 {id:'armory',title:'Living Armory',icon:'⛨',group:'Character',href:'./character-intelligence.html',desc:'Equipment and public character research',tokens:'armory gear equipment items public blizzard'},
 {id:'atlas',title:'World Atlas',icon:'◉',group:'Adventure',href:'./world-atlas.html',desc:'Region intelligence, destinations and saved travel plans',tokens:'world map zone region map pins cartographer route'},
 {id:'operations',title:'Adventure Operations',icon:'✧',group:'Adventure',href:'./adventure-operations.html',desc:'Sequence your personal objectives into a session',tokens:'adventure operations session checklist plan time'},
 {id:'expedition',title:'Expedition Intelligence',icon:'⌖',group:'Adventure',href:'./expedition-console.html',desc:'Prepare missions and source-backed research notes',tokens:'expedition mission preparation checklist briefs'},
 {id:'progression',title:'Progression Intelligence',icon:'✥',group:'Adventure',href:'./progression-intelligence.html',desc:'Research raids, reputations and progression systems',tokens:'progression world of warcraft quests activities raids'},
 {id:'living',title:'Living Azeroth',icon:'✺',group:'Adventure',href:'./living-azeroth.html',desc:'Cinematic world research and discovery portal',tokens:'living azeroth world portal cinematic'},
 {id:'vault',title:'Private Video Vault',icon:'◆',group:'Personal',href:'./private-video-vault.html',desc:'Locally encrypted personal videos and independent backup',tokens:'password protected private video media encrypted vault'},
 {id:'backup',title:'Save Protection',icon:'▣',group:'Personal',href:'./save-protection.html',desc:'Export compatible planning records; Vault backup is separate',tokens:'save protection backup progress export recovery'},
 {id:'oracle',title:'Azeroth Oracle',icon:'☼',group:'Explore',href:'./azeroth-assistant.html',desc:'Guided answers from the companion knowledge library',tokens:'assistant oracle knowledge questions help'},
 {id:'handbook',title:'Player Handbook',icon:'▤',group:'Explore',href:'./player-handbook.html',desc:'Understand the companion features and limits',tokens:'guide documentation handbook learning how to'},
 {id:'addons',title:'Addon Nexus',icon:'⚙',group:'Explore',href:'./addon-nexus.html',desc:'Curated research and addon guidance',tokens:'addon nexus mod plugin research'},
 {id:'updates',title:'Release History',icon:'✎',group:'Explore',href:'./release-notes.html',desc:'Verified owner release notes and version history',tokens:'update patch release version changes news'},
 {id:'gateway',title:'NEXUS Gateway',icon:'⌂',group:'NEXUS',href:'../hub/',desc:'Browse the complete NEXUS collection',tokens:'gateway proximus nexus website other studios'},
 {id:'alchemist',title:'Asset Alchemist',icon:'◈',group:'NEXUS',href:'../alchemist/',desc:'Create and organize your own media and utilities',tokens:'alchemist videos gif studio images audio creator'}
]);
const idMap=new Map(DIR.map(x=>[x.id,x]));
const validId=v=>typeof v==='string'&&idMap.has(v);
const safeZone=v=>typeof v==='string'&&/^[a-z0-9-]{4,80}$/.test(v);
const trim=(v,max=90)=>typeof v==='string'?v.trim().slice(0,max):'';
const obj=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const arr=(v,max=100)=>Array.isArray(v)?v.slice(0,max):[];
function normalizePreferences(value){
 const source=obj(value)?value:{},pinned=[],seen=new Set(),recent=[],rseen=new Set();
 for(const id of arr(source.pinned,50))if(validId(id)&&!seen.has(id)&&pinned.length<6){pinned.push(id);seen.add(id)}
 for(const id of arr(source.recent,50))if(validId(id)&&!rseen.has(id)&&recent.length<8){recent.push(id);rseen.add(id)}
 return {format:'nexus.unity/1',pinned, recent};
}
function togglePinned(value,id){
 const state=normalizePreferences(value);
 if(!validId(id))return state;
 const pinned=state.pinned.includes(id)?state.pinned.filter(x=>x!==id):
  [id,...state.pinned.filter(x=>x!==id)].slice(0,6);
 return {...state,pinned};
}
function visit(value,id){
 const state=normalizePreferences(value);
 if(!validId(id))return state;
 return {...state,recent:[id,...state.recent.filter(x=>x!==id)].slice(0,8)};
}
function snapshot(raw){
 const src=obj(raw)?raw:{},atlas=arr(src.atlas,100),routes=arr(src.routes?.routes,6),
 operations=arr(src.operations?.entries,18),forge=arr(src.forge,160),characters=arr(src.core?.characters,150),
 builds=arr(src.core?.builds,120),collections=arr(src.core?.collections,120);
 const goals=atlas.filter(x=>obj(x)&&trim(x.title,100)),
 active=goals.filter(x=>x.status==='active'),planned=goals.filter(x=>x.status==='planned');
 const destination=active.find(x=>safeZone(x.zoneId))||planned.find(x=>safeZone(x.zoneId))||null;
 const firstRoutes=routes.filter(x=>obj(x)&&trim(x.title,80));
 const steps=firstRoutes.reduce((sum,r)=>sum+arr(r.stops,12).length,0);
 return Object.freeze({
  characterCount:characters.filter(x=>obj(x)&&trim(x.name)).length,
  draftCount:forge.filter(x=>obj(x)&&trim(x.name)&&obj(x.rankByNode)).length+builds.filter(x=>obj(x)&&trim(x.title)).length,
  collectionCount:collections.length,
  atlasCount:goals.length,activeCount:active.length,plannedCount:planned.length,
  routeCount:firstRoutes.length,routeStops:steps,sessionCount:operations.length,
  nextGoal:destination?{title:trim(destination.title,90),zoneId:destination.zoneId,status:destination.status}:null,
  goals:goals.slice(0,35).filter(x=>safeZone(x.zoneId)).map(x=>({
   title:trim(x.title,90),zoneId:x.zoneId,status:trim(x.status,25)
  })),
  routes:firstRoutes.map(x=>({title:trim(x.title,80),stops:arr(x.stops,12).length}))
 });
}
function search(query,snap,limit=22){
 const q=trim(query,90).toLowerCase().replace(/\s+/g,' ').trim();
 const words=q.split(' ').filter(Boolean),results=[];
 for(const d of DIR){
  const corpus=(d.title+' '+d.desc+' '+d.tokens+' '+d.group).toLowerCase();
  if(words.every(x=>corpus.includes(x))){
   const score=!q?1:d.title.toLowerCase().startsWith(q)?6:d.title.toLowerCase().includes(q)?4:2;
   results.push({kind:'studio',id:d.id,title:d.title,subtitle:d.desc,href:d.href,icon:d.icon,group:d.group,score});
  }
 }
 if(q&&obj(snap)){
  for(const goal of arr(snap.goals,35)){
   const corpus=(goal.title+' '+goal.zoneId+' atlas mission '+goal.status).toLowerCase();
   if(words.every(x=>corpus.includes(x))){
    results.push({kind:'manual',title:goal.title,subtitle:'MANUAL '+(goal.status||'saved')+' · '+goal.zoneId,
     href:'./world-atlas.html?zone='+encodeURIComponent(goal.zoneId),icon:'◉',group:'Manual objectives',score:3});
   }
  }
  if(words.some(w=>'route expedition itinerary'.includes(w)))for(const route of arr(snap.routes,6)){
   results.push({kind:'route',title:route.title,subtitle:route.stops+' saved manual destinations',
    href:'./world-atlas.html',icon:'✧',group:'Saved routes',score:2});
  }
 }
 return results.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title)).slice(0,Math.min(40,Math.max(1,limit)));
}
const JOURNEYS=Object.freeze([
 {id:'prepare',title:'Prepare an adventure',desc:'Research a destination, organize your session, then review preparation.',steps:['atlas','operations','expedition']},
 {id:'character',title:'Build your character',desc:'Open a character, plan talents, then research equipment.',steps:['character','forge','armory']},
 {id:'collect',title:'Plan a collection',desc:'Study progression, record collections and preserve your plans.',steps:['progression','companion','backup']},
 {id:'private',title:'Organize your media',desc:'Keep personal videos encrypted and create independent archive backups.',steps:['vault','backup','handbook']}
]);
const api=Object.freeze({VERSION,KEY,DIR,JOURNEYS,idMap,validId,safeZone,trim,
 normalizePreferences,togglePinned,visit,snapshot,search});
Object.defineProperty(window,'NexusUnityCoreV21',{value:api,writable:false,configurable:false});
})();