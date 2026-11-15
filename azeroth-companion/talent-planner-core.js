/* NEXUS | AZEROTH — Talent Forge Planner Engine v5.1
 * Pure browser-local helpers. Source data is Blizzard-supplied; calculations
 * validate only structural draft properties, not WoW game loadout legality.
 */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.NexusTalentPlanner=api;
})(typeof window!=='undefined'?window:null,function(){
 'use strict';
 const activities=['general','raid','mythic-plus','pvp','solo','open-world'];
 const roles=['unspecified','damage','tank','healer'];
 const styles=['balanced','burst','sustain','utility','survival'];
 const defaultMeta=()=>({activity:'general',role:'unspecified',style:'balanced',notes:'',targets:{class:0,spec:0,hero:0}});
 const bounded=(value,min,max)=>Number.isSafeInteger(Number(value))&&Number(value)>=min&&Number(value)<=max?Number(value):min;
 const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&Object.getPrototypeOf(o)!==null?o:o&&Object.getPrototypeOf(o)===null?o:null;
 const cleanText=(value,limit)=>typeof value==='string'?value.slice(0,limit).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,''):'';
 function sanitizeMeta(raw){
  const x=plain(raw)||{},m=defaultMeta();
  for(const [field,options] of [['activity',activities],['role',roles],['style',styles]])
   if(options.includes(x[field]))m[field]=x[field];
  m.notes=cleanText(x.notes,1800);
  const t=plain(x.targets)||{};
  for(const key of ['class','spec','hero'])m.targets[key]=bounded(t[key],0,150);
  return m;
 }
 const identityOK=s=>typeof s==='string'&&/^(us|eu|kr|tw)\/[1-9]\d{0,9}\/[1-9]\d{0,9}$/.test(s);
 function copyNodes(source,cap,allowedMax){
  const o=plain(source);if(!o||Object.keys(o).length>400)throw Error('Node data is missing or too large');
  const target=Object.create(null);
  for(const [id,v] of Object.entries(o)){
   if(!/^[1-9]\d{0,9}$/.test(id)||!Number.isSafeInteger(v)||v<0||v>allowedMax)
    throw Error('Unsupported node rank or choice value');
   target[id]=v;
  }
  return target;
 }
 function sanitizeImported(raw){
  const v=plain(raw);
  if(!v||v.format!=='nexus-azeroth-talent-draft-v1'||!identityOK(v.identity)||!cleanText(v.name,75).trim())
   throw Error('Unsupported Talent Forge draft or specialization');
  const [region,treeId]=v.identity.split('/');
  const ranks=copyNodes(v.rankByNode,400,20);
  const choices=v.choiceByNode==null?Object.create(null):copyNodes(v.choiceByNode,400,20);
  return{
   format:'nexus-azeroth-talent-draft-v1',identity:v.identity,region,treeId:Number(treeId),
   specName:cleanText(v.specName,95)||'Specialization',
   name:cleanText(v.name,75).trim(),rankByNode:ranks,choiceByNode:choices,
   planner:sanitizeMeta(v.planner),savedAt:typeof v.savedAt==='string'&&/^\d{4}-\d\d-\d\dT/.test(v.savedAt)?v.savedAt.slice(0,30):new Date().toISOString(),
   notice:'Manual planning draft. Validate in the game before use.'
  };
 }
 function nodesByPool(tree){
  const classNodes=Array.isArray(tree?.class_talent_nodes)?tree.class_talent_nodes:[];
  const specNodes=Array.isArray(tree?.spec_talent_nodes)?tree.spec_talent_nodes:[];
  const heroTrees=Array.isArray(tree?.hero_talent_trees)?tree.hero_talent_trees:[];
  const heroNodes=heroTrees.flatMap(t=>Array.isArray(t?.hero_talent_nodes)?t.hero_talent_nodes:[]);
  return{class:classNodes,spec:specNodes,hero:heroNodes,heroTrees};
 }
 function choiceCount(node){
  const ranks=Array.isArray(node?.ranks)?node.ranks:[];
  return Math.max(0,...ranks.map(r=>Array.isArray(r?.choice_of_tooltips)?r.choice_of_tooltips.length:0));
 }
 function analyze(tree,ranks,choiceByNode,rawMeta,paths){
  const meta=sanitizeMeta(rawMeta),pools=nodesByPool(tree),scores={class:0,spec:0,hero:0},
   notes=[],issues=[],nodeKinds=new Map(),heroSelected=new Set(),selected=[];
  for(const category of ['class','spec','hero']){
   for(const node of pools[category]){
    const id=Number(node?.id);
    if(Number.isSafeInteger(id)&&id>0&&!nodeKinds.has(String(id)))nodeKinds.set(String(id),{category,node});
   }
  }
  const selections=plain(ranks)||{},choiceMap=plain(choiceByNode)||{};
  let allocated=0,chosenNodes=0;
  for(const [id,rank]of Object.entries(selections).slice(0,800)){
   if(!Number.isSafeInteger(rank)||rank<0||rank>20){issues.push('A planned rank is outside the supported draft range.');continue}
   if(rank===0)continue;
   allocated+=rank;chosenNodes++;
   const entry=nodeKinds.get(id);
   if(!entry){issues.push('Planned node #'+id+' is not in the currently loaded Blizzard tree.');continue}
   scores[entry.category]+=rank;
   const rankChoices=Array.isArray(entry.node?.ranks)?entry.node.ranks:[];
   const current=rankChoices[Math.min(Math.max(rank-1,0),rankChoices.length-1)]||{};
   const choiceIndex=Number(choiceMap[id]||0);
   const chosen=Array.isArray(current.choice_of_tooltips)?current.choice_of_tooltips[choiceIndex]:null;
   const name=chosen?.talent?.name||chosen?.spell_tooltip?.spell?.name||current?.tooltip?.talent?.name||current?.tooltip?.spell_tooltip?.spell?.name||entry.node?.name||('Node #'+id);
   selected.push({id,category:entry.category,name:cleanText(name,95),rank});
   const max=Math.max(1,Array.isArray(entry.node?.ranks)?entry.node.ranks.length:0);
   if(rank>max)issues.push('Node #'+id+' exceeds the source-reported rank count.');
  }
  for(const [id,v]of Object.entries(choiceMap).slice(0,800)){
   const entry=nodeKinds.get(id);
   if(!entry){if(Number(selections[id])>0)issues.push('Choice for unknown node #'+id+' requires review.');continue}
   const count=choiceCount(entry.node);
   if(!Number.isSafeInteger(v)||v<0||v>=Math.max(1,count))
    issues.push('Choice selection for node #'+id+' is outside the returned options.');
  }
  for(const category of ['class','spec','hero']){
   const goal=meta.targets[category];
   if(goal>0&&scores[category]>goal)notes.push(category+' planned points ('+scores[category]+') exceed your personal target ('+goal+').');
  }
  for(const [index,hTree]of pools.heroTrees.entries()){
   if((hTree?.hero_talent_nodes||[]).some(n=>Number(selections[String(n?.id)]||0)>0))heroSelected.add(index);
  }
  if(heroSelected.size>1)notes.push('Points span multiple returned hero trees; review your selection in the in-game talent interface.');
  let linksForReview=0;
  if(typeof paths==='function'){
   for(const category of ['class','spec','hero']){
    try{
     const graph=paths(pools[category],selections);
     linksForReview+=Math.max(0,Number(graph?.summary?.flagged)||0);
    }catch(_){}
   }
  }
  if(linksForReview)notes.push(linksForReview+' source-linked connections merit review. A missing planned upstream rank does not prove an in-game invalid build.');
  if(!chosenNodes)notes.push('No ranks are allocated yet. Choose talents to begin a planning draft.');
  return{
   scores,allocated,chosenNodes,selected:selected.slice(0,120),goal:{...meta.targets},meta,
   issues:issues.slice(0,12),moreIssues:Math.max(0,issues.length-12),
   advisory:notes.slice(0,12),linksForReview,
   gameValidated:false,hasTree:Boolean(tree)
  };
 }
 function summaryText(info,specName){
  const name=cleanText(specName,95)||'Talent research';
  const p=info||{scores:{class:0,spec:0,hero:0},meta:defaultMeta(),issues:[],advisory:[]};
  return [
   'NEXUS | TALENT FORGE — PLANNING DRAFT',
   'Specialization: '+name,
   'Activity: '+p.meta.activity+' | Role: '+p.meta.role+' | Style: '+p.meta.style,
   'Planned ranks — Class: '+p.scores.class+' | Specialization: '+p.scores.spec+' | Hero: '+p.scores.hero,
   'Personal planning targets — Class: '+p.meta.targets.class+' | Specialization: '+p.meta.targets.spec+' | Hero: '+p.meta.targets.hero,
   'Notes: '+(p.meta.notes||'(none)'),
   'Planned talents: '+(p.selected?.length?p.selected.slice(0,45).map(n=>n.category+': '+n.name+' ('+n.rank+')').join(' | '):'(none)'),
   'Structural review: '+(p.issues.length?p.issues.join(' | '):'No structural issues detected in the currently loaded data'),
   'Advisories: '+(p.advisory.length?p.advisory.join(' | '):'None'),
   'NOT an in-game-valid loadout or Blizzard import code. Verify talents in World of Warcraft.'
  ].join('\n');
 }
 return{activities,roles,styles,defaultMeta,sanitizeMeta,sanitizeImported,nodesByPool,analyze,summaryText,identityOK};
});