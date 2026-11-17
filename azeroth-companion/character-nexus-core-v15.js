/* NEXUS | AZEROTH v15 — CHARACTER NEXUS CORE
 * Pure, bounded transformations. No network, browser storage or account claims.
 * Public Blizzard information is labeled separately from user-created plans.
 */
(()=>{'use strict';
const object=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const clean=(x,n=100)=>typeof x==='string'?x.trim().slice(0,n):'';
const validId=x=>/^[1-9]\d{0,9}$/.test(String(x))&&Number.isSafeInteger(Number(x))&&Number(x)<=9999999999;
const rankMap=raw=>{
 const out=Object.create(null);if(!object(raw))return out;
 for(const [k,v]of Object.entries(raw).slice(0,450)){
  const n=Number(v);
  if(validId(k)&&Number.isInteger(n)&&n>=0&&n<=20)out[k]=n;
 }
 return out;
};
const identityOK=x=>typeof x==='string'&&/^(us|eu|kr|tw)\/[1-9]\d{0,9}\/[1-9]\d{0,9}$/.test(x);
const isSelector=p=>object(p)&&['us','eu','kr','tw'].includes(p.region)&&
 /^[a-z0-9-]{2,80}$/.test(p.realm||'')&&/^[a-z0-9-]{2,50}$/.test(p.name||'');
const normalizeSelector=raw=>{
 const p={region:clean(raw?.region,3).toLowerCase(),realm:clean(raw?.realm,80).toLowerCase(),name:clean(raw?.name,50).toLowerCase()};
 return isSelector(p)?p:null;
};
const label=v=>typeof v==='string'?clean(v,140):object(v)?clean(v.en_US||v.en_GB||Object.values(v).find(x=>typeof x==='string'),140):'';
const level=v=>{const n=Number(v?.value??v);return Number.isFinite(n)&&n>0&&n<=99999?n:null};
const unpackEquipment=data=>Array.isArray(data?.equipped_items)?data.equipped_items.slice(0,40).map(item=>{
 const slot=label(item?.slot?.name)||clean(item?.slot?.type,80)||'Unknown slot';
 const slotKey=clean(item?.slot?.type,45).toUpperCase()||slot.toUpperCase();
 const id=validId(item?.item?.id)?Number(item.item.id):null;
 return {id,slot:slot.slice(0,80),slotKey, name:label(item?.name)||label(item?.item?.name)||'Unspecified item',level:level(item?.level)};
}).filter(x=>x.slotKey):[];
const summarizeProfile=(raw,selector)=>{
 const profile=object(raw)?raw:{};
 return {name:label(profile.name)||clean(selector?.name,50),region:selector?.region||null,realm:label(profile.realm?.name)||clean(selector?.realm,80),
 className:label(profile.character_class?.name)||label(profile.playable_class?.name),specialization:label(profile.active_spec?.name),
 level:level(profile.level),averageItemLevel:level(profile.average_item_level),equippedItemLevel:level(profile.equipped_item_level),
 faction:label(profile.faction?.name)};
};
const draftKey=d=>[clean(d?.identity,130),clean(d?.savedAt,40),clean(d?.name,75)].join('::');
const linkedDrafts=(drafts,links,charId)=>Array.isArray(drafts)?drafts.filter(d=>object(d)&&links?.[draftKey(d)]===charId).slice(0,30):[];
const goalsFor=(quests,coreTasks,charId)=>{
 const q=Array.isArray(quests)?quests.filter(x=>object(x)&&x.charId===charId).slice(0,150):[];
 const tasks=Array.isArray(coreTasks)?coreTasks.filter(x=>object(x)&&(!x.charId||x.charId===charId)).slice(0,150):[];
 return {quests:q,tasks,open:q.filter(x=>x.done!==true).length+tasks.filter(x=>x.done!==true).length};
};
function validateDraft(record){
 if(!object(record)||!identityOK(record.identity))return null;
 const rankByNode=rankMap(record.rankByNode),choiceByNode=rankMap(record.choiceByNode);
 if(Object.keys(rankByNode).length>400||Object.keys(choiceByNode).length>400)return null;
 return {format:'nexus-azeroth-talent-draft-v1',name:clean(record.name,75)||'Shared manual draft',
  identity:record.identity,region:record.identity.split('/')[0],specName:clean(record.specName,95),
  rankByNode,choiceByNode,savedAt:clean(record.savedAt,40)||new Date(0).toISOString(),
  notice:'Manual planning data only; official source, legality and in-game import strings are not verified.'};
}
function packageFrom({character,drafts=[],notes=[],goals=[],targets=[]}={}){
 const x=object(character)?character:{};
 const c={name:clean(x.name,75)||'Unnamed character',className:clean(x.className,65),spec:clean(x.spec,65),realm:clean(x.realm,80),version:clean(x.version,40)};
 const entries=Array.isArray(drafts)?drafts.map(validateDraft).filter(Boolean).slice(0,12):[];
 const annotations=Array.isArray(notes)?notes.slice(0,12).filter(object).map(n=>({identity:clean(n.identity,130),name:clean(n.name,75),favorite:n.favorite===true,purpose:clean(n.purpose,35),notes:clean(n.notes,900)})):[];
 const objectives=Array.isArray(goals)?goals.slice(0,30).filter(object).map(g=>({title:clean(g.title,100),kind:clean(g.kind,45),done:g.done===true})).filter(g=>g.title):[];
 const gearTargets=Array.isArray(targets)?targets.slice(0,30).filter(object).map(t=>({id:validId(t.id)?Number(t.id):null,name:clean(t.name,130),status:clean(t.status,30)})).filter(t=>t.id):[];
 return {format:'nexus.character-nexus-package/1',created_at:new Date().toISOString(),source:'NEXUS browser-local planning export',
  character:c,drafts:entries,notes:annotations,goals:objectives,gearTargets,
  notice:'Manually created planning data, not Blizzard account ownership, game-legal builds, confirmed equipped gear or an authorization token.'};
}
function sanitizePackage(raw){
 if(!object(raw)||raw.format!=='nexus.character-nexus-package/1'||!object(raw.character)||!Array.isArray(raw.drafts)||raw.drafts.length>12||
  JSON.stringify(raw).length>270000)return {ok:false,error:'Unrecognized, excessive or incompatible character-package format.'};
 const source=packageFrom({character:raw.character,drafts:raw.drafts,notes:raw.notes,goals:raw.goals,targets:raw.gearTargets});
 if(source.drafts.length!==raw.drafts.length)return {ok:false,error:'The package contains invalid or incompatible talent draft identities.'};
 return {ok:true,package:source};
}
function gearMatches(items,atlas,region){
 const observed=new Set((Array.isArray(items)?items:[]).map(x=>x.id).filter(Boolean));
 return (Array.isArray(atlas)?atlas:[]).filter(x=>object(x)&&x.region===region&&validId(x.id))
  .slice(0,120).map(x=>({id:Number(x.id),name:clean(x.name,140)||'Item #'+x.id,status:clean(x.status,30),reportedEquipped:observed.has(Number(x.id))}));
}
window.NexusCharacterNexusCore=Object.freeze({
 clean,validId,rankMap,identityOK,normalizeSelector,isSelector,label,unpackEquipment,summarizeProfile,
 draftKey,linkedDrafts,goalsFor,validateDraft,packageFrom,sanitizePackage,gearMatches
});
})();