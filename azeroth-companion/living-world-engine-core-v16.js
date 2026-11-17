/* NEXUS | AZEROTH v16 — LIVING WORLD ENGINE CORE
 * Curated in-game destination directory, NOT official Blizzard cartography,
 * live position tracking, routes, dungeon availability or player state.
 * Pure helpers; no storage writes, network, authentication or DOM access.
 */
(()=>{'use strict';
const regions=[
 {id:'eastern-kingdoms',name:'Eastern Kingdoms',group:'Classic Azeroth',x:62,y:42,accent:'gold',art:'sovereign'},
 {id:'kalimdor',name:'Kalimdor',group:'Classic Azeroth',x:25,y:43,accent:'violet',art:'adventure'},
 {id:'northrend',name:'Northrend',group:'Northern Azeroth',x:47,y:15,accent:'cyan',art:'oracle'},
 {id:'pandaria',name:'Pandaria',group:'Southern Azeroth',x:46,y:74,accent:'jade',art:'adventure'},
 {id:'broken-isles',name:'Broken Isles',group:'Northern Azeroth',x:48,y:36,accent:'violet',art:'oracle'},
 {id:'dragon-isles',name:'Dragon Isles',group:'Eastern Seas',x:86,y:33,accent:'gold',art:'sovereign'},
 {id:'khaz-algar',name:'Khaz Algar',group:'Southern Azeroth',x:70,y:79,accent:'cyan',art:'adventure'},
 {id:'outland',name:'Outland',group:'Beyond Azeroth',x:13,y:80,accent:'violet',art:'armory'}
];
const zones=[
 ['stormwind-city','Stormwind City','eastern-kingdoms','Capital','Character and city research'],
 ['ironforge','Ironforge','eastern-kingdoms','Capital','City and equipment research'],
 ['stranglethorn-vale','Stranglethorn Vale','eastern-kingdoms','Zone','Adventure and collection goals'],
 ['silvermoon-city','Silvermoon City','eastern-kingdoms','Capital','City and faction research'],
 ['orgrimmar','Orgrimmar','kalimdor','Capital','Character and city research'],
 ['durotar','Durotar','kalimdor','Zone','Adventure and exploration'],
 ['ashenvale','Ashenvale','kalimdor','Zone','Exploration and collection goals'],
 ['mount-hyjal','Mount Hyjal','kalimdor','Zone','World and legacy research'],
 ['icecrown','Icecrown','northrend','Zone','Legacy raid and adventure research'],
 ['dalaran-northrend','Dalaran (Northrend)','northrend','Hub','Hub and character research'],
 ['storm-peaks','The Storm Peaks','northrend','Zone','Legacy adventure research'],
 ['jade-forest','The Jade Forest','pandaria','Zone','Exploration and collection research'],
 ['vale-eternal-blossoms','Vale of Eternal Blossoms','pandaria','Zone','Hub and adventure research'],
 ['dalaran-broken-isles','Dalaran (Broken Isles)','broken-isles','Hub','Legion-era hub and character research'],
 ['suramar','Suramar','broken-isles','Zone','Legacy faction and adventure research'],
 ['valsharah',"Val'sharah",'broken-isles','Zone','World and collection research'],
 ['valdrakken','Valdrakken','dragon-isles','Hub','Dragonflight-era hub research'],
 ['waking-shores','The Waking Shores','dragon-isles','Zone','Dragonflight-era exploration'],
 ['azure-span','The Azure Span','dragon-isles','Zone','Dragonflight-era exploration'],
 ['isle-of-dorn','Isle of Dorn','khaz-algar','Zone','Khaz Algar exploration'],
 ['ringing-deeps','The Ringing Deeps','khaz-algar','Zone','Dungeon and exploration research'],
 ['hallowfall','Hallowfall','khaz-algar','Zone','Adventure and faction research'],
 ['azj-kahet',"Azj-Kahet",'khaz-algar','Zone','Dungeon and exploration research'],
 ['shattrath-city','Shattrath City','outland','Hub','Outland hub and legacy research'],
 ['hellfire-peninsula','Hellfire Peninsula','outland','Zone','Outland exploration']
].map(([id,name,regionId,kind,description])=>Object.freeze({id,name,regionId,kind,description}));
const safeText=(value,max=120)=>typeof value==='string'?value.trim().slice(0,max):'';
const safeKey=(value)=>typeof value==='string'&&/^[a-z0-9][a-z0-9-]{1,65}$/.test(value)?value:null;
const makeId=()=>{try{return crypto.randomUUID()}catch(_){return 'manual-'+Date.now()+'-'+Math.random().toString(36).slice(2,12)}};
const zoneById=id=>zones.find(x=>x.id===id)||null;
const regionById=id=>regions.find(x=>x.id===id)||null;
const allowedKinds=['Explore','Build prep','Equipment research','Collection','Dungeon prep','Raid prep','Other'];
const stageKinds=['planned','active','completed'];
function normalizeGoal(value){
 if(!value||typeof value!=='object'||Array.isArray(value))return null;
 const place=zoneById(value.zoneId);if(!place)return null;
 const title=safeText(value.title,110);if(!title)return null;
 const id=typeof value.id==='string'&&/^[a-z0-9-]{5,85}$/i.test(value.id)?value.id:null;
 if(!id)return null;
 return {
  id,zoneId:place.id,title,category:allowedKinds.includes(value.category)?value.category:'Explore',
  status:stageKinds.includes(value.status)?value.status:'planned',
  charId:safeText(value.charId,150),buildKey:safeText(value.buildKey,265),
  itemId:Number.isSafeInteger(Number(value.itemId))&&Number(value.itemId)>0&&Number(value.itemId)<10000000000?Number(value.itemId):null,
  notes:safeText(value.notes,500),createdAt:safeText(value.createdAt,36)||new Date(0).toISOString()
 };
}
function cleanGoals(value){
 if(!Array.isArray(value))return[];
 const seen=new Set(),out=[];
 for(const raw of value.slice(0,250)){
  const goal=normalizeGoal(raw);if(!goal||seen.has(goal.id))continue;
  seen.add(goal.id);out.push(goal);
  if(out.length>=120)break;
 }
 return out;
}
function newGoal(value){
 const place=zoneById(value?.zoneId);if(!place)return null;
 const raw={...value,id:makeId(),createdAt:new Date().toISOString()};
 return normalizeGoal(raw);
}
function sortedGoals(goals,{charId='',zoneId='',status='',query=''}={}){
 const q=safeText(query,90).toLocaleLowerCase();
 return cleanGoals(goals).filter(goal=>(!charId||goal.charId===charId)&&(!zoneId||goal.zoneId===zoneId)&&(!status||goal.status===status)&&
 (!q||[goal.title,goal.notes,zoneById(goal.zoneId)?.name,goal.category].some(v=>String(v||'').toLowerCase().includes(q))))
 .sort((a,b)=>a.status===b.status?String(b.createdAt).localeCompare(String(a.createdAt)):
  ['active','planned','completed'].indexOf(a.status)-['active','planned','completed'].indexOf(b.status));
}
function characterize(character){
 if(!character||typeof character!=='object')return null;
 const id=safeText(character.id,150),name=safeText(character.name,75);
 if(!id||!name)return null;
 return {id,name,className:safeText(character.className,65),spec:safeText(character.spec,65),realm:safeText(character.realm,85)};
}
function summary(value={}){
 const chars=Array.isArray(value.characters)?value.characters.map(characterize).filter(Boolean).slice(0,250):[];
 const builds=Array.isArray(value.builds)?value.builds.filter(x=>x&&typeof x==='object').slice(0,600):[];
 const atlas=Array.isArray(value.itemTargets)?value.itemTargets.filter(x=>x&&typeof x==='object').slice(0,450):[];
 const goals=cleanGoals(value.goals);
 const selected=chars.find(x=>x.id===value.selectedId)||chars[0]||null;
 const localForSelected=goals.filter(g=>!g.charId||g.charId===selected?.id);
 const open=localForSelected.filter(g=>g.status!=='completed');
 return {selected,characters:chars.length,builds:builds.length,itemTargets:atlas.length,goals:goals.length,
  openGoals:open.length,nextGoal:open[0]||null};
}
function search({query='',characters=[],drafts=[],goals=[],atlas=[]}={}){
 const term=safeText(query,100).toLocaleLowerCase().trim();if(term.length<2)return[];
 const results=[];
 const push=(label,type,href,subtitle)=>{
  if(results.length>=50||![label,subtitle].some(x=>String(x).toLocaleLowerCase().includes(term)))return;
  results.push({label:safeText(label,105),type,href,subtitle:safeText(subtitle,110)});
 };
 const staticRoutes=[
  ['Expedition Intelligence','Adventure preparation','./expedition-console.html','Manual mission preparation, checklist progress and character-linked research'],
  ['Sovereign Character Nexus','Studio','./player-experience.html','Public Armory research, personal character and builds'],
  ['Living World Atlas','World Atlas','./world-atlas.html','Regions, points of interest and research goals'],
  ['Talent Forge Reforged','Studio','./?enter=1&view=talents','Source-backed talent planning'],
  ['Living Armory','Studio','./character-intelligence.html','Equipment and public gear research'],
  ['Adventure Journal','Studio','./progression-intelligence.html','Adventure and progression research'],
  ['Collection Vault','Studio','./?enter=1&view=collections','Local collections and tracking'],
  ['Save Protection','Safety','./save-protection.html','Export local plans'],
  ['Player Handbook','Guide','./player-handbook.html','Companion documentation']
 ];
 staticRoutes.forEach(([a,b,c,d])=>push(a,b,c,d));
 zones.forEach(zone=>push(zone.name,'Research zone','./world-atlas.html?zone='+encodeURIComponent(zone.id),
  (regionById(zone.regionId)?.name||'')+' · '+zone.kind));
 (Array.isArray(characters)?characters:[]).slice(0,250).forEach(c=>{const name=safeText(c?.name,75);if(name)push(name,'Local character','./player-experience.html',
   'Browser-local profile · '+safeText(c.className,50))});
 (Array.isArray(drafts)?drafts:[]).slice(0,160).forEach(d=>{const name=safeText(d?.name,75);if(name)push(name,'Manual draft','./?enter=1&view=talents',
   'Browser-local Talent Forge · '+safeText(d.specName,50))});
 sortedGoals(goals).slice(0,120).forEach(g=>push(g.title,'Local objective','./world-atlas.html?zone='+encodeURIComponent(g.zoneId),
  'Manual goal · '+zoneById(g.zoneId)?.name));
 (Array.isArray(atlas)?atlas:[]).slice(0,200).forEach(t=>{
  const itemId=Number(t?.id),name=safeText(t?.name,90);
  if(name&&Number.isSafeInteger(itemId)&&itemId>0)push(name+' · #'+itemId,'Item Atlas','./?enter=1&view=collections','Manual item research');
 });
 const seen=new Set();return results.filter(r=>{const key=r.type+'|'+r.label+'|'+r.href;if(seen.has(key))return false;seen.add(key);return true}).slice(0,22);
}
window.NexusWorldEngineCoreV16=Object.freeze({regions:Object.freeze(regions),zones:Object.freeze(zones),safeText,safeKey,zoneById,regionById,allowedKinds,stageKinds,
 normalizeGoal,cleanGoals,newGoal,sortedGoals,characterize,summary,search});
})();