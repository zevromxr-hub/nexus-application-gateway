/* NEXUS | AZEROTH v8.0 — SOVEREIGN ASCENSION data foundation.
 * Local snapshot is read-only by default, no implicit storage writes.
 * Identity, provenance and missing-data distinctions are mandatory.
 */
(function(root){'use strict';
const SCHEMA='nexus.azeroth.sovereign-snapshot/1';
const LIMITS={drafts:40,targets:1000,characters:100,items:200};
const keys=Object.freeze({core:'nexus_azeroth_companion_genesis_v1',talents:'nexus_azeroth_talent_forge_v1',targets:'nexus_azeroth_character_targets_v1',atlas:'nexus_azeroth_item_atlas_v1',loot:'nexus_azeroth_loot_hunter_v1',farming:'nexus_azeroth_farm_operations_v1'});
const obj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const list=(x,n)=>Array.isArray(x)?x.slice(0,n):[];
const cleanText=(x,n=90)=>typeof x==='string'?x.trim().slice(0,n):'';
const countRanks=r=>Object.values(obj(r)?r:{}).reduce((n,v)=>{const k=Number(v);return n+(Number.isInteger(k)&&k>0&&k<30?k:0)},0);
function rankMap(raw){const out={};if(!obj(raw))return out;for(const [key,val] of Object.entries(raw).slice(0,400)){const n=Number(val);if(/^\d{1,12}$/.test(key)&&Number.isInteger(n)&&n>=0&&n<=20)out[key]=n}return out}
function buildSummary(x){return {name:cleanText(x?.name,75)||'Unnamed build',identity:cleanText(x?.identity,120)||'Unknown spec',region:cleanText(x?.region,3)||null,savedAt:cleanText(x?.savedAt,40)||null,rankByNode:rankMap(x?.rankByNode),source:'manual-local-draft',label:'Locally saved; NOT Blizzard-confirmed',verified:false}}
function compare(a,b){const aa=rankMap(a?.rankByNode),bb=rankMap(b?.rankByNode),ids=[...new Set([...Object.keys(aa),...Object.keys(bb)])].sort((x,y)=>Number(x)-Number(y));return{sameSpecialization:!!a?.identity&&a.identity===b?.identity,aName:a?.name||'A',bName:b?.name||'B',aPoints:countRanks(aa),bPoints:countRanks(bb),changes:ids.map(id=>({nodeId:id,from:aa[id]||0,to:bb[id]||0,delta:(bb[id]||0)-(aa[id]||0)})).filter(c=>c.delta!==0).slice(0,160),source:'manual-local-comparison',warning:'Node IDs and ranks come from saved drafts; not a validated in-game build or optimization.'}}
function readLocal(storage){const problems=[];const read=(name)=>{try{const s=storage.getItem(keys[name]);if(!s)return null;if(s.length>3500000){problems.push(name+' exceeded safe preview size');return null}return JSON.parse(s)}catch(_){problems.push(name+' could not be parsed');return null}};
const raw={core:read('core'),talents:read('talents'),targets:read('targets'),atlas:read('atlas'),loot:read('loot'),farming:read('farming')};
const characters=list(raw.core?.characters,LIMITS.characters).map(x=>({name:cleanText(x?.name,60)||'Unnamed',realm:cleanText(x?.realm,80)||null,game:cleanText(x?.game,50)||null,characterClass:cleanText(x?.class,60)||null,source:'manual-local',verified:false}));
const builds=list(raw.talents,LIMITS.drafts).filter(x=>obj(x)&&obj(x.rankByNode)).map(buildSummary);
const targetCollection=Array.isArray(raw.targets)?raw.targets:obj(raw.targets)?raw.targets.targets:[];
const targets=list(targetCollection,LIMITS.targets).map(x=>({title:cleanText(x?.name||x?.itemName||x?.label,100)||'Goal',itemId:Number.isSafeInteger(Number(x?.itemId))&&Number(x.itemId)>0?Number(x.itemId):null,done:x?.done===true,source:'manual-local-goal',verified:false}));
const atlasCount=Array.isArray(raw.atlas)?raw.atlas.length:obj(raw.atlas)?Object.keys(raw.atlas).length:0;
const lootCount=Array.isArray(raw.loot)?raw.loot.length:obj(raw.loot)?Object.keys(raw.loot).length:0;
return{format:SCHEMA,appVersion:'8.0.0',createdAt:new Date().toISOString(),provenance:{core:'manual-local',talents:'manual-local-draft',targets:'manual-local-goal',atlas:'manual-local',loot:'manual-local',farming:'manual-local'},local:{characters,builds,targets,atlasCount:Math.min(atlasCount,10000),lootCount:Math.min(lootCount,10000)},public:null,issues:problems,notice:'Browser-local plans are not Blizzard-confirmed ownership, inventory, progression or account records.'}}
function identity(region,realm,name){region=cleanText(region,3).toLowerCase();realm=cleanText(realm,80).toLowerCase();name=cleanText(name,50).toLowerCase();if(!['us','eu','kr','tw'].includes(region)||!/^[a-z0-9-]{2,80}$/.test(realm)||!/^[a-z0-9-]{2,50}$/.test(name))throw Error('Enter a supported region, exact realm slug and valid character name.');return{region,realm,name}}
function withPublic(snapshot,query,profile,equipment){if(!obj(snapshot)||snapshot.format!==SCHEMA)throw Error('Unsupported local snapshot');const info=identity(query.region,query.realm,query.name);
const safeProfile=obj(profile)?profile:{};const gear=list(equipment?.equipped_items,LIMITS.items).map(x=>({slot:cleanText(x?.slot?.type,50)||null,itemId:Number.isSafeInteger(Number(x?.item?.id))&&Number(x.item.id)>0?Number(x.item.id):null,name:cleanText(x?.name?.en_US||x?.name,100)||null,itemLevel:Number.isFinite(Number(x?.level?.value))?Number(x.level.value):null}));return {...snapshot,public:{identity:info,source:'blizzard-public-api',verified:'reported-by-api-not-player-ownership-proof',fetchedAt:new Date().toISOString(),name:cleanText(safeProfile?.name,90)||info.name,level:Number.isFinite(Number(safeProfile.level))?Number(safeProfile.level):null,equippedItemLevel:Number.isFinite(Number(safeProfile.equipped_item_level))?Number(safeProfile.equipped_item_level):null,gear},notice:snapshot.notice}};
function validateImport(x){
 if(!obj(x)||x.format!==SCHEMA||!obj(x.local)||!Array.isArray(x.local.builds)||!Array.isArray(x.local.characters)||!Array.isArray(x.local.targets)||x.local.builds.length>LIMITS.drafts||x.local.characters.length>LIMITS.characters||x.local.targets.length>LIMITS.targets)throw Error('Not a supported Sovereign snapshot');
 const characters=x.local.characters.map(c=>({name:cleanText(c?.name,60)||'Unnamed',realm:cleanText(c?.realm,80)||null,game:cleanText(c?.game,50)||null,characterClass:cleanText(c?.characterClass,60)||null,source:'imported-manual-claim',verified:false}));
 const builds=x.local.builds.filter(b=>obj(b)&&obj(b.rankByNode)).map(b=>({...buildSummary(b),source:'imported-manual-claim',verified:false}));
 const targets=x.local.targets.map(t=>({title:cleanText(t?.title,100)||'Imported goal',itemId:Number.isSafeInteger(Number(t?.itemId))&&Number(t.itemId)>0?Number(t.itemId):null,done:t?.done===true,source:'imported-manual-claim',verified:false}));
 let importedPublic=null;
 if(obj(x.public)&&obj(x.public.identity)){
  let id;try{id=identity(x.public.identity.region,x.public.identity.realm,x.public.identity.name)}catch(_){throw Error('Invalid imported public character identity')}
  const sourceGear=list(x.public.gear,LIMITS.items).map(g=>({slot:cleanText(g?.slot,50)||null,itemId:Number.isSafeInteger(Number(g?.itemId))&&Number(g.itemId)>0?Number(g.itemId):null,name:cleanText(g?.name,100)||null,itemLevel:Number.isFinite(Number(g?.itemLevel))&&g?.itemLevel!==null?Number(g.itemLevel):null}));
  importedPublic={identity:id,source:'imported-public-claim',verified:'NOT LIVE VERIFIED — import provided by user',fetchedAt:cleanText(x.public.fetchedAt,42)||null,name:cleanText(x.public.name,90)||id.name,level:Number.isFinite(Number(x.public.level))&&x.public.level!==null?Number(x.public.level):null,equippedItemLevel:Number.isFinite(Number(x.public.equippedItemLevel))&&x.public.equippedItemLevel!==null?Number(x.public.equippedItemLevel):null,gear:sourceGear};
 }
 return{format:SCHEMA,appVersion:'8.0.0',createdAt:new Date().toISOString(),provenance:{import:'user-supplied-preview'},local:{characters,builds,targets,atlasCount:Math.max(0,Math.min(10000,Number(x.local.atlasCount)||0)),lootCount:Math.max(0,Math.min(10000,Number(x.local.lootCount)||0))},public:importedPublic,issues:[],imported:true,notice:'Imported snapshot claims are not verified live; the import does not modify existing local data.'}
}
const API=Object.freeze({SCHEMA,keys,identity,readLocal,compare,rankMap,buildSummary,withPublic,validateImport,countRanks});
if(typeof module!=='undefined'&&module.exports)module.exports=API;
if(root)root.NexusSovereignData8=API;
})(typeof window!=='undefined'?window:null);
